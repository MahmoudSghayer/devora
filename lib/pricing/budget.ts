import {formatMoney} from './config';

/** Contact-form budget band boundaries (₪), sized for small-business projects (website ≈ ₪1–3k, store ≈ ₪4–6k, app ≈ ₪8k+). */
export const BUDGET_BANDS = [2000, 4000, 8000] as const;

const compact = (n: number, locale: string) =>
  formatMoney(n / 1000, locale, {maximumFractionDigits: 0}) + 'k';

/** ICU params for contact.o1..o4 so band labels never hardcode numbers. */
export function budgetParams(locale: string): Record<string, string> {
  return {
    b1: compact(BUDGET_BANDS[0], locale),
    b2: compact(BUDGET_BANDS[1], locale),
    b3: compact(BUDGET_BANDS[2], locale),
  };
}
