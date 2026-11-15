'use client';

import {track} from '@vercel/analytics';

// Tiny funnel helper for the calculators. Never throws — ad blockers or a
// missing Analytics script must not break the UI.

export type FunnelEvent =
  | 'calculator_started'
  | 'calculator_step'
  | 'estimate_submitted'
  | 'roi_submitted'
  | 'discuss_submitted';

export function trackFunnel(
  event: FunnelEvent,
  props?: Record<string, string | number | boolean | null>
): void {
  try {
    track(event, props);
  } catch {
    // no-op
  }
}
