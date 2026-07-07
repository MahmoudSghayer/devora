import {NextResponse} from 'next/server';
import {getConversation, getMessages} from '@/lib/chat/store';

export const runtime = 'nodejs';

// GET /api/conversation/[id]?token=... — history refetch for reconnect / gap
// fill. Token-gated: without the matching token this 404s.
export async function GET(
  request: Request,
  {params}: {params: Promise<{id: string}>}
) {
  const {id} = await params;
  const token = new URL(request.url).searchParams.get('token');
  if (!token) {
    return NextResponse.json({ok: false, error: 'missing_token'}, {status: 400});
  }

  const conv = await getConversation(id, token);
  if (!conv) {
    return NextResponse.json({ok: false, error: 'not_found'}, {status: 404});
  }

  const messages = await getMessages(id);
  return NextResponse.json({
    ok: true,
    conversation: {
      id: conv.id,
      locale: conv.locale,
      mode: conv.mode,
      status: conv.status,
    },
    messages,
  });
}
