// Single source of truth for Devora pricing.
//
// Every price the site, emails, chat prompts and calculators show comes from
// here — never hardcode a number elsewhere. Values are INDICATIVE (see
// docs/pricing-engine.md); Devora can edit them without touching any UI.
//
// Currency: Israeli shekel. The package tiers are the previous USD tiers
// ($1,650 / $2,650 / $5,000 and $200 / $250 / $300 per month) anchored at
// ≈3.7 ₪/$ and rounded to friendly numbers.

export const CURRENCY = 'ILS' as const;
export type CurrencyCode = typeof CURRENCY;

/** Bump when any price in this file changes (stored with every lead snapshot). */
export const PRICING_CONFIG_VERSION = '2026-11-v1';

export type TierId = 'launch' | 'studio' | 'growth';

export interface Tier {
  id: TierId;
  /** one-time build, "from" price (CURRENCY major units) */
  from: number;
  /** monthly care plan (CURRENCY major units) */
  monthly: number;
}

export const TIERS: Record<TierId, Tier> = {
  launch: {id: 'launch', from: 6100, monthly: 750},
  studio: {id: 'studio', from: 9800, monthly: 950},
  growth: {id: 'growth', from: 18500, monthly: 1100},
};

export const TIER_ORDER: readonly TierId[] = ['launch', 'studio', 'growth'];

/** Care-plan monthly range across tiers (for copy like "from ₪750/mo"). */
export const MONTHLY_MIN = Math.min(...TIER_ORDER.map((t) => TIERS[t].monthly));
export const MONTHLY_MAX = Math.max(...TIER_ORDER.map((t) => TIERS[t].monthly));

const LOCALE_TAG: Record<string, string> = {ar: 'ar-u-nu-latn', en: 'en-US'};

/**
 * Format a money amount for a locale. Arabic uses Latin digits (consistent
 * with the rest of the site) with the localized currency symbol.
 */
export function formatMoney(
  amount: number,
  locale: string,
  opts: {currency?: CurrencyCode; maximumFractionDigits?: number} = {},
): string {
  return new Intl.NumberFormat(LOCALE_TAG[locale] ?? 'en-US', {
    style: 'currency',
    currency: opts.currency ?? CURRENCY,
    maximumFractionDigits: opts.maximumFractionDigits ?? 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

/** Compact bare number (no currency), e.g. 6,100. */
export function formatNumber(amount: number, locale: string, maxFraction = 0): string {
  return new Intl.NumberFormat(LOCALE_TAG[locale] ?? 'en-US', {
    maximumFractionDigits: maxFraction,
  }).format(amount);
}

/**
 * ICU params for next-intl messages, so copy never hardcodes numbers:
 *   t('a5', pricingParams(locale))  with  "…{launch_from}… {care_min}/mo"
 */
export function pricingParams(locale: string): Record<string, string> {
  const out: Record<string, string> = {
    care_min: formatMoney(MONTHLY_MIN, locale),
    care_max: formatMoney(MONTHLY_MAX, locale),
  };
  for (const id of TIER_ORDER) {
    out[`${id}_from`] = formatMoney(TIERS[id].from, locale);
    out[`${id}_monthly`] = formatMoney(TIERS[id].monthly, locale);
  }
  return out;
}

/** Plain-text price line for emails / prompts (English). */
export function tierLine(id: TierId, locale = 'en'): string {
  const name = id[0].toUpperCase() + id.slice(1);
  return `${name} — from ${formatMoney(TIERS[id].from, locale)} + ${formatMoney(TIERS[id].monthly, locale)}/mo`;
}

// ── Calculator pricing: appended below by the estimator/ROI engine work ──
