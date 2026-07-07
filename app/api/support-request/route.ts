import {NextResponse} from 'next/server';
import {supportRequestSchema} from '@/lib/validation';
import {getConversation, getMessages, insertSupportRequest} from '@/lib/chat/store';
import {summarize} from '@/lib/chat/summarize';
import {supportEmail} from '@/lib/email/templates';
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

  const website = (body as {website?: unknown})?.website;
  if (typeof website === 'string' && website.trim() !== '') {
    return NextResponse.json({ok: true, delivered: false});
  }

  const parsed = supportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ok: false, error: 'validation'}, {status: 422});
  }
  const d = parsed.data;

  const rl = await rateLimit('lead', getRequestIp(request));
  if (!rl.success) {
    return NextResponse.json({ok: false, error: 'rate_limited'}, {status: 429});
  }

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
    kind: 'support',
    request: `${d.subject}\n${d.body}`,
    history,
  });

  const requestId = await insertSupportRequest({
    conversationId,
    name: d.name,
    email: d.email,
    phone: d.phone,
    subject: d.subject,
    body: d.body,
    aiSummary,
    locale: d.locale,
  });

  let delivered = false;
  try {
    const mail = supportEmail({
      name: d.name,
      email: d.email,
      phone: d.phone,
      subject: d.subject,
      body: d.body,
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
    console.error('[support] email failed:', err);
  }

  void logEvent('support_created', {conversationId, locale: d.locale});

  return NextResponse.json({ok: true, delivered, requestId});
}
