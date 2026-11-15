import {createSupabaseServiceClient, isSupabaseConfigured} from '@/lib/supabase/service';

export type AnalyticsType =
  | 'conversation_started'
  | 'message_sent'
  | 'lead_captured'
  | 'support_created'
  | 'takeover'
  | 'released'
  | 'out_of_scope'
  | 'language_detected'
  | 'cache_usage'
  | 'calculator_started'
  | 'calculator_step'
  | 'estimate_submitted'
  | 'roi_submitted';

// Fire-and-forget analytics. Never throws, never blocks the response path, and
// no-ops when Supabase isn't configured.
export async function logEvent(
  type: AnalyticsType,
  opts: {
    conversationId?: string | null;
    locale?: string | null;
    props?: Record<string, unknown>;
  } = {}
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = createSupabaseServiceClient();
    await supabase.from('analytics_events').insert({
      conversation_id: opts.conversationId ?? null,
      type,
      locale: opts.locale ?? null,
      props: opts.props ?? {},
    });
  } catch {
    // swallow — analytics must never break a user-facing request
  }
}
