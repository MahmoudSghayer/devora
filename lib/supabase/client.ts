'use client';

import {createBrowserClient} from '@supabase/ssr';

// Browser (anon) Supabase client — used ONLY for Realtime subscriptions and
// public broadcast channels. It carries the public anon key by design; the
// capability to read a conversation comes from the unguessable token in the
// channel name, never from this key. Never use it for privileged writes.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// True when the public Supabase env is present, so Realtime subscriptions can
// be attempted. When false, the widget/admin fall back to HTTP + polling.
export function isRealtimeConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
