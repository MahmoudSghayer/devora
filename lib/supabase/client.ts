'use client';

import {createBrowserClient} from '@supabase/ssr';

// Browser (anon) Supabase client — used ONLY for Realtime subscriptions and
// public broadcast channels. It carries the public anon key by design; the
// capability to read a conversation comes from the unguessable token in the
// channel name, never from this key. Never use it for privileged writes.
//
// Singleton: every caller shares ONE client (and one WebSocket). Creating a new
// client per subscription opens a new socket each time — that's what made the
// admin panel heavy.
function makeBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

let browserClient: ReturnType<typeof makeBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  if (!browserClient) browserClient = makeBrowserClient();
  return browserClient;
}

// True when the public Supabase env is present, so Realtime subscriptions can
// be attempted. When false, the widget/admin fall back to HTTP + polling.
export function isRealtimeConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
