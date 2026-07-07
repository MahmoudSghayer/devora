import {NextResponse} from 'next/server';
import {getAdminUser} from '@/lib/admin/auth';
import {setConversationMode, getConversationToken} from '@/lib/admin/queries';
import {broadcastToConversation} from '@/lib/realtime/broadcast';
import {logEvent} from '@/lib/analytics';

export const runtime = 'nodejs';

export async function POST(
  _request: Request,
  {params}: {params: Promise<{id: string}>}
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ok: false, error: 'unauthorized'}, {status: 401});
  }
  const {id} = await params;
  await setConversationMode(id, 'human', admin.id);

  const token = await getConversationToken(id);
  if (token) {
    await broadcastToConversation(token, 'mode', {mode: 'human'});
  }
  void logEvent('takeover', {conversationId: id});

  return NextResponse.json({ok: true, mode: 'human'});
}
