import {NextResponse} from 'next/server';
import {leadSchema} from '@/lib/validation';
import {getConversation, getMessages, insertLead} from '@/lib/chat/store';
import {summarize} from '@/lib/chat/summarize';
import {leadEmail} from '@/lib/email/templates';
import {sendMail} from '@/lib/email/send';
import {isSupabaseConfigured} from '@/lib/supabase/service';
import {logEvent} from '@/lib/analytics';
import {rateLimit, getRequestIp} from '@/lib/ratelimit';
import type {ChatMessage} from '@/lib/chat/types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
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
    return NextResponse.json({ok: false, error: 'rate_limited'}, {status: 429});
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

  const aiSummary = await summarize({
    locale: d.locale,
    kind: 'lead',
    request: d.request,
    history,
  });

  const leadId = await insertLead({
    conversationId,
    name: d.name,
    email: d.email,
    phone: d.phone,
    company: d.company,
    request: d.request,
    recommendedPackage: d.recommendedPackage,
    aiSummary,
    locale: d.locale,
  });

  let delivered = false;
  try {
    const mail = leadEmail({
      name: d.name,
      email: d.email,
      phone: d.phone,
      company: d.company,
      request: d.request,
      recommendedPackage: d.recommendedPackage,
      aiSummary,
      locale: d.locale,
      history,
    });
    ({delivered} = await sendMail({
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      replyTo: d.email,
    }));
  } catch (err) {
    console.error('[lead] email failed:', err);
  }

  void logEvent('lead_captured', {
    conversationId,
    locale: d.locale,
    props: {package: d.recommendedPackage ?? null},
  });

  return NextResponse.json({ok: true, delivered, leadId});
}
