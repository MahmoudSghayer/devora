import {NextResponse} from 'next/server';
import {z} from 'zod';
import {getAdminUser} from '@/lib/admin/auth';
import {sendHumanMessage, getConversationToken} from '@/lib/admin/queries';
import {broadcastToConversation} from '@/lib/realtime/broadcast';

export const runtime = 'nodejs';

const schema = z.object({content: z.string().trim().min(1).max(4000)});

export async function POST(
  request: Request,
  {params}: {params: Promise<{id: string}>}
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ok: false, error: 'unauthorized'}, {status: 401});
  }
  const {id} = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ok: false, error: 'validation'}, {status: 422});
  }

  const message = await sendHumanMessage(id, admin.id, parsed.data.content);

  // Push the reply to the visitor over their private broadcast channel.
  const token = await getConversationToken(id);
  if (token && message) {
    await broadcastToConversation(token, 'message', {
      id: message.id,
      role: message.role,
      author: message.author,
      content: message.content,
      createdAt: message.createdAt,
    });
  }

  return NextResponse.json({ok: true, message});
}
