import {formatMoney, formatNumber} from '@/lib/pricing/config';

export const intlTag = (locale: string): string => (locale === 'ar' ? 'ar-u-nu-latn' : 'en-US');

export const money = (n: number, locale: string): string => formatMoney(n, locale);
export const num = (n: number, locale: string, max = 1): string => formatNumber(n, locale, max);

/** ratio (0.5 → 50%) */
export const percent = (ratio: number, locale: string): string =>
  new Intl.NumberFormat(intlTag(locale), {style: 'percent', maximumFractionDigits: 0}).format(ratio);

export const compactMoney = (n: number, locale: string): string =>
  new Intl.NumberFormat(intlTag(locale), {
    style: 'currency',
    currency: 'ILS',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);

/** Stable Intl options for CountUp (must not be re-created each render). */
export const HOURS_OPTS: Intl.NumberFormatOptions = {maximumFractionDigits: 1};
export const MONEY_OPTS: Intl.NumberFormatOptions = {style: 'currency', currency: 'ILS', maximumFractionDigits: 0};
export const FTE_OPTS: Intl.NumberFormatOptions = {minimumFractionDigits: 2, maximumFractionDigits: 2};
