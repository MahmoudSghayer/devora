import {randomInt} from 'node:crypto';

// No 0/O/1/I/L — refs get read aloud and typed from emails.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Human-readable lead reference, e.g. DV-2611-7KQ4 (year-month + 4 chars). */
export function generateLeadRef(nowMs: number = Date.now()): string {
  const d = new Date(nowMs);
  const yy = String(d.getUTCFullYear()).slice(-2);
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  let tail = '';
  for (let i = 0; i < 4; i++) tail += ALPHABET[randomInt(ALPHABET.length)];
  return `DV-${yy}${mm}-${tail}`;
}
