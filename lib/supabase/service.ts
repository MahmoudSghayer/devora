import {createClient, type SupabaseClient} from '@supabase/supabase-js';

// Service-role Supabase client — BYPASSES RLS. Server-only. This is the gate
// through which all anonymous-visitor writes flow: the route handler validates
// the conversation token itself, then writes with this client. NEVER import
// this into a Client Component; the service-role key must never reach the
// browser.
let cached: SupabaseClient | null = null;

export function createSupabaseServiceClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Supabase service client not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  cached = createClient(url, key, {
    auth: {persistSession: false, autoRefreshToken: false},
  });
  return cached;
}

// True when the Supabase env is present. Route handlers use this to degrade
// gracefully (like the contact route does for SMTP) instead of 500-ing when
// the project hasn't wired Supabase yet.
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
