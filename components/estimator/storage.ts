// Versioned, failure-tolerant localStorage persistence. The page must work
// when storage throws (private mode, blocked cookies, quota).

import {parseStored, type EstimatorState, type Stored} from './model';

const KEY = 'devora.estimator.v1';

export function loadStored(): Stored | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? parseStored(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveStored(s: EstimatorState): void {
  try {
    const payload: Stored = {
      answers: s.answers,
      context: s.context,
      step: s.step,
      startedAtMs: s.startedAtMs,
      idempotencyKey: s.idempotencyKey,
      timeline: s.timeline,
    };
    window.localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // storage unavailable: the in-memory state still works
  }
}

export function clearStored(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** RFC 4122 v4 id; falls back to getRandomValues where randomUUID is missing. */
export function newIdempotencyKey(): string {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === 'function') return c.randomUUID();
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
