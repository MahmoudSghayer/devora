import {formatMoney} from './config';

/** Contact-form budget band boundaries (₪), aligned to the package tiers. */
export const BUDGET_BANDS = [6000, 10000, 20000] as const;

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
