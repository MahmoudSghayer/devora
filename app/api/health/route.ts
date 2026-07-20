import {NextResponse} from 'next/server';
import {isAnthropicConfigured} from '@/lib/anthropic';
import {isSupabaseConfigured} from '@/lib/supabase/service';
import {isEmailConfigured} from '@/lib/email/send';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Diagnostic: reports which integrations the RUNNING deployment can see. Returns
// booleans only — no secrets. Hit /api/health after deploying to confirm the
// env vars are actually reaching production. If `anthropic` is false, the key
// isn't set for this deployment (wrong name/scope, or deployed before it was
// added) and the chat will use its offline fallback.
export async function GET() {
  return NextResponse.json({
    ok: true,
    integrations: {
      anthropic: isAnthropicConfigured(),
      supabase: isSupabaseConfigured(),
      email: isEmailConfigured(),
      rateLimit: Boolean(
        process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
      ),
    },
  });
}
