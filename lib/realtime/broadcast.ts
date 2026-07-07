import {isSupabaseConfigured} from '@/lib/supabase/service';

// Server → browser realtime using Supabase Realtime's REST broadcast endpoint.
// This works from stateless serverless functions (no websocket to hold open).
// Visitors subscribe to `conv:<token>` (the unguessable token is the
// capability); everyone subscribes to `presence:global` for the online toggle.
async function broadcast(
  topic: string,
  event: string,
  payload: unknown
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({messages: [{topic, event, payload}]}),
    });
  } catch {
    // realtime is best-effort; the durable message is already persisted and
    // the visitor gap-fills via GET /api/conversation/[id] on reconnect.
  }
}

export function broadcastToConversation(
  token: string,
  event: string,
  payload: unknown
): Promise<void> {
  if (!token) return Promise.resolve();
  return broadcast(`conv:${token}`, event, payload);
}

export function broadcastPresence(online: boolean): Promise<void> {
  return broadcast('presence:global', 'online', {online});
}
