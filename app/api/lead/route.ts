import {NextResponse, after} from 'next/server';
import {leadSchema} from '@/lib/validation';
import {getConversation, getMessages, insertLead} from '@/lib/chat/store';
import {summarize} from '@/lib/chat/summarize';
import {leadEmail} from '@/lib/email/templates';
import {isEmailConfigured, sendMail} from '@/lib/email/send';
import {
  createSupabaseServiceClient,
  isSupabaseConfigured,
} from '@/lib/supabase/service';
import {logEvent} from '@/lib/analytics';
import {rateLimit, getRequestIp} from '@/lib/ratelimit';
import type {ChatMessage} from '@/lib/chat/types';
import {metaFrom, readCapped} from '@/lib/leads/http';
import {isSameOrigin} from '@/lib/leads/service';
import {MAX_BODY_BYTES} from '@/lib/leads/types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  // Same hardening as the calculator routes: same-origin only, streamed body cap.
  if (!isSameOrigin(metaFrom(request))) {
    return NextResponse.json({ok: false, error: 'origin'}, {status: 403});
  }
  const raw = await readCapped(request, MAX_BODY_BYTES);
  if (raw === null) {
    return NextResponse.json({ok: false, error: 'too_large'}, {status: 413});
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ok: false, error: 'invalid_json'}, {status: 400});
  }

  // Honeypot — silently accept and drop obvious bot submissions.
  const website = (body as {website?: unknown})?.website;
  if (typeof website === 'string' && website.trim() !== '') {
    return NextResponse.json({ok: true, delivered: false});
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ok: false, error: 'validation'}, {status: 422});
  }
  const d = parsed.data;

  const rl = await rateLimit('lead', getRequestIp(request));
  if (!rl.success) {
    return NextResponse.json(
      {ok: false, error: 'rate_limited'},
      {status: 429, headers: {'Retry-After': String(rl.retryAfterSec ?? 3600)}}
    );
  }

  // Load linked conversation history (token-verified) for the summary + email.
  let history: ChatMessage[] = [];
  let conversationId: string | null = null;
  if (d.conversationId && d.token && isSupabaseConfigured()) {
    const conv = await getConversation(d.conversationId, d.token);
    if (conv) {
      conversationId = conv.id;
      history = await getMessages(conv.id);
    }
  }

  // 1. Persist (without the AI summary — that's added off the critical path).
  let leadId: string | null = null;
  let persistError: unknown = null;
  if (isSupabaseConfigured()) {
    try {
      leadId = await insertLead({
        conversationId,
        name: d.name,
        email: d.email,
        phone: d.phone,
        company: d.company,
        request: d.request,
        locale: d.locale,
      });
    } catch (err) {
      persistError = err;
      console.error('[lead] persistence failed:', err);
    }
  }

  const buildMail = (aiSummary?: string) =>
    leadEmail({
      name: d.name,
      email: d.email,
      phone: d.phone,
      company: d.company,
      request: d.request,
      aiSummary,
      locale: d.locale,
      history,
    });

  void logEvent('lead_captured', {
    conversationId,
    locale: d.locale,
  });

  // 2a. Saved → summarise + email after the response is sent.
  if (leadId) {
    const id = leadId;
    after(async () => {
      let aiSummary = '';
      try {
        aiSummary = await summarize({
          locale: d.locale,
          kind: 'lead',
          request: d.request,
          history,
        });
      } catch (err) {
        console.error('[lead] summarize failed:', err);
      }
      let delivered = false;
      let emailError: string | null = null;
      try {
        const mail = buildMail(aiSummary);
        ({delivered} = await sendMail({
          subject: mail.subject,
          text: mail.text,
          html: mail.html,
          replyTo: d.email,
        }));
        if (!delivered) emailError = 'smtp_not_configured';
      } catch (err) {
        emailError = err instanceof Error ? err.message : String(err);
        console.error('[lead] email failed:', err);
      }
      try {
        const {error} = await createSupabaseServiceClient()
          .from('leads')
          .update({
            ai_summary: aiSummary || null,
            email_delivered: delivered,
            email_error: emailError,
          })
          .eq('id', id);
        if (error) console.error('[lead] post-send update failed:', error);
      } catch (err) {
        console.error('[lead] post-send update threw:', err);
      }
    });
    return NextResponse.json({ok: true, delivered: false, queued: true, leadId});
  }

  // 2b. Not saved (DB unconfigured or failed) → email is the only record, so
  // send it synchronously and never report success if that fails too.
  if (isEmailConfigured()) {
    try {
      const mail = buildMail();
      const {delivered} = await sendMail({
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        replyTo: d.email,
      });
      if (delivered) return NextResponse.json({ok: true, delivered: true});
    } catch (err) {
      console.error('[lead] email failed:', err);
    }
  }
  console.error('[lead] neither persistence nor email succeeded', {
    persistError: persistError ? String(persistError) : null,
  });
  return NextResponse.json(
    {ok: false, error: 'unavailable', retryable: true},
    {status: 503}
  );
}
