import {NextResponse} from 'next/server';
import {conversationCreateSchema} from '@/lib/validation';
import {createConversation} from '@/lib/chat/store';
import {logEvent} from '@/lib/analytics';
import {rateLimit, getRequestIp, hashIp} from '@/lib/ratelimit';

export const runtime = 'nodejs';

// POST /api/conversation — create (or resume-scope) a visitor conversation.
// Returns the id + an unguessable token the widget stores and replays.
export async function POST(request: Request) {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine — defaults apply
  }

  const parsed = conversationCreateSchema.safeParse(body ?? {});
  const {locale, firstPage} = parsed.success
    ? parsed.data
    : {locale: 'en' as const, firstPage: undefined};

  const ip = getRequestIp(request);
  const rl = await rateLimit('conversation', ip);
  if (!rl.success) {
    return NextResponse.json({ok: false, error: 'rate_limited'}, {status: 429});
  }

  try {
    const conv = await createConversation({
      locale,
      visitorMeta: {
        ip_hash: hashIp(ip),
        ua: request.headers.get('user-agent') ?? undefined,
        referer: request.headers.get('referer') ?? undefined,
        first_page: firstPage,
      },
    });
    void logEvent('conversation_started', {conversationId: conv.id, locale});
    return NextResponse.json({
      ok: true,
      id: conv.id,
      token: conv.token,
      mode: conv.mode,
      representativeOnline: conv.representativeOnline,
    });
  } catch {
    return NextResponse.json({ok: false, error: 'create_failed'}, {status: 500});
  }
}
