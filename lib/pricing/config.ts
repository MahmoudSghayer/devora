// Single source of truth for Devora pricing.
//
// Every price the site, emails, chat prompts and calculators show comes from
// here — never hardcode a number elsewhere. Values are INDICATIVE (see
// docs/pricing-engine.md); Devora can edit them without touching any UI.
//
// Currency: Israeli shekel. The package tiers are the previous USD tiers
// ($1,650 / $2,650 / $5,000 and $200 / $250 / $300 per month) anchored at
// ≈3.7 ₪/$ and rounded to friendly numbers.

import type {EstimatorConfig, FeatureDef, FeatureId} from '@/lib/estimator/types';
import type {RoiConfig, RoiTaskDef, RoiTaskId} from '@/lib/roi/types';

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

// All amounts below are INDICATIVE one-time ILS prices ("not a quotation").
// Change a number here and the estimator updates; bump PRICING_CONFIG_VERSION.
// See docs/pricing-engine.md.

type FeatureSeed = Omit<FeatureDef, 'label'> & {label: string};
const feature = (f: FeatureSeed): [FeatureId, FeatureDef] => [f.id, f];

const BUSINESS_TYPES = ['landing', 'business', 'ecommerce', 'booking', 'dashboard', 'portal', 'webapp'] as const;

const FEATURES: Record<FeatureId, FeatureDef> = Object.fromEntries([
  // business / landing
  feature({id: 'blog', home: 'business', appliesTo: ['business'], label: 'Blog / articles', amount: 1200, days: 3}),
  feature({id: 'leadForm', home: 'business', appliesTo: ['landing', 'business'], label: 'Contact / lead collection', amount: 600, days: 1}),
  feature({id: 'booking', home: 'business', appliesTo: ['business'], label: 'Online booking', amount: 3500, days: 6}),
  // shared (also selectable in step 5 — priced once)
  feature({id: 'crm', home: 'shared', appliesTo: BUSINESS_TYPES, label: 'CRM integration', amount: 2500, days: 4}),
  feature({
    id: 'multilingual',
    home: 'shared',
    appliesTo: BUSINESS_TYPES,
    label: 'Multilingual (Hebrew / Arabic / English)',
    amount: 0,
    days: 4,
    percentOfCore: {rate: 0.15, min: 1500},
  }),
  feature({id: 'advancedSeo', home: 'shared', appliesTo: BUSINESS_TYPES, label: 'Advanced SEO', amount: 1800, days: 3}),
  feature({id: 'adminDashboard', home: 'shared', appliesTo: ['business', 'ecommerce', 'booking', 'portal', 'webapp'], label: 'Admin dashboard', amount: 2500, days: 5}),
  feature({id: 'payments', home: 'shared', appliesTo: BUSINESS_TYPES, label: 'Online payments', amount: 1500, days: 3}),
  // e-commerce
  feature({id: 'categories', home: 'ecommerce', appliesTo: ['ecommerce'], label: 'Product categories', amount: 600, days: 1}),
  feature({id: 'filtering', home: 'ecommerce', appliesTo: ['ecommerce'], label: 'Advanced filtering & search', amount: 1200, days: 2}),
  feature({id: 'accounts', home: 'ecommerce', appliesTo: ['ecommerce'], label: 'Customer accounts', amount: 1500, days: 3}),
  feature({id: 'cart', home: 'ecommerce', appliesTo: ['ecommerce'], label: 'Shopping cart & checkout', amount: 1200, days: 3}),
  feature({id: 'shipping', home: 'ecommerce', appliesTo: ['ecommerce'], label: 'Shipping options', amount: 1200, days: 2}),
  feature({id: 'inventory', home: 'ecommerce', appliesTo: ['ecommerce'], label: 'Inventory management', amount: 1500, days: 3}),
  feature({id: 'coupons', home: 'ecommerce', appliesTo: ['ecommerce'], label: 'Coupons & discounts', amount: 800, days: 2}),
  feature({id: 'orderTracking', home: 'ecommerce', appliesTo: ['ecommerce'], label: 'Order tracking', amount: 1200, days: 2}),
  feature({id: 'notifications', home: 'ecommerce', appliesTo: ['ecommerce', 'booking'], label: 'Customer notifications', amount: 800, days: 2}),
  // web app
  feature({id: 'auth', home: 'webapp', appliesTo: ['dashboard', 'portal', 'webapp'], label: 'Authentication & accounts', amount: 2500, days: 4}),
  feature({id: 'subscriptions', home: 'webapp', appliesTo: ['webapp', 'portal'], label: 'Subscriptions & billing plans', amount: 4000, days: 7}),
  feature({id: 'dashboards', home: 'webapp', appliesTo: ['dashboard', 'portal', 'webapp'], label: 'Dashboards & charts', amount: 4500, days: 8}),
  feature({id: 'database', home: 'webapp', appliesTo: ['dashboard', 'portal', 'webapp'], label: 'Database management screens', amount: 3000, days: 5}),
  feature({id: 'apiIntegrations', home: 'webapp', appliesTo: ['dashboard', 'portal', 'webapp'], label: 'API integrations', amount: 3000, days: 5}),
  feature({id: 'realtime', home: 'webapp', appliesTo: ['dashboard', 'portal', 'webapp'], label: 'Real-time updates', amount: 4000, days: 7}),
  feature({id: 'aiFeatures', home: 'webapp', appliesTo: ['dashboard', 'portal', 'webapp'], label: 'AI features', amount: 5000, days: 8}),
]) as Record<FeatureId, FeatureDef>;

/** Indicative project estimator prices (ILS). Documented in docs/pricing-engine.md. */
export const ESTIMATOR_CONFIG: EstimatorConfig = {
  configVersion: PRICING_CONFIG_VERSION,
  currency: CURRENCY,
  projectBase: {
    landing: {label: 'Landing page', amount: 3500, days: 5},
    business: {label: 'Business website (up to 5 pages)', amount: 6000, days: 10},
    ecommerce: {label: 'E-commerce store', amount: 12000, days: 20},
    booking: {label: 'Booking / scheduling system', amount: 11000, days: 18},
    dashboard: {label: 'Dashboard / internal tool', amount: 14000, days: 20},
    portal: {label: 'Customer portal', amount: 16000, days: 25},
    webapp: {label: 'Custom web app', amount: 22000, days: 35},
    unsure: {label: 'Project to be defined (discovery)', amount: 6000, days: 10},
  },
  additionalTypeRate: 0.7,
  pages: {included: 5, perPage: 400, daysPerPage: 0.5},
  products: {
    p1_20: {label: 'Catalog: 1–20 products', amount: 0, days: 0},
    p21_100: {label: 'Catalog: 21–100 products', amount: 1500, days: 2},
    p101_500: {label: 'Catalog: 101–500 products', amount: 3500, days: 4},
    p501_1000: {label: 'Catalog: 501–1,000 products', amount: 6000, days: 6},
    p1000_plus: {label: 'Catalog: 1,000+ products', amount: 10000, days: 9},
  },
  roles: {
    one: {label: 'User roles: single role', amount: 0, days: 0},
    few: {label: 'User roles: 2–3 roles', amount: 2500, days: 4},
    many: {label: 'User roles: 4+ roles', amount: 5000, days: 8},
  },
  features: FEATURES,
  integrations: {
    whatsapp: {id: 'whatsapp', label: 'WhatsApp integration', amount: 1200, days: 2},
    emailAutomation: {id: 'emailAutomation', label: 'Email automation', amount: 1800, days: 3},
    aiChatbot: {id: 'aiChatbot', label: 'AI chatbot', amount: 4500, days: 7, monthly: 150},
    aiAgents: {id: 'aiAgents', label: 'AI agents / workflows', amount: 9000, days: 12, monthly: 400},
    thirdPartyApi: {id: 'thirdPartyApi', label: 'Third-party API integration', amount: 3000, days: 5},
    analytics: {id: 'analytics', label: 'Analytics & reporting', amount: 1500, days: 3},
    hosting: {id: 'hosting', label: 'Hosting & domain setup', amount: 600, days: 1, monthly: 60},
    maintenance: {id: 'maintenance', label: 'Ongoing care plan (billed monthly, shown separately)', amount: 0, days: 0},
  },
  design: {
    existingFactor: 0.85,
    brandIdentity: {amount: 3500, days: 5},
    advancedMotion: {amount: 5000, days: 8},
    premiumFactor: 1.15,
    premiumDays: 4,
  },
  range: {lowFactor: 0.9, highFactor: 1.2, roundTo: 500},
  timeline: {daysPerWeek: 5, parallelismLow: 0.6, parallelismHigh: 0.9, bufferWeeksHigh: 1},
  maintenanceThresholds: {studio: TIERS.studio.from, growth: TIERS.growth.from},
};

/** Automation ROI calculator constants (ILS). Documented in docs/automation-roi.md. */
export const ROI_CONFIG: RoiConfig = {
  configVersion: PRICING_CONFIG_VERSION,
  currency: CURRENCY,
  defaultHourlyCost: 60,
  defaultEmployerCostMultiplier: 1.25,
  defaultWorkingDays: 22,
  defaultDirectShare: 0.2,
  hoursPerMonthFte: 182,
  implementation: {base: 4000, perTask: 2500},
  running: {base: 400, perTask: 100},
};

const roiTask = (
  id: RoiTaskId,
  label: string,
  defaultAutomationPct: number,
  defaultTimesPerDay: number,
  defaultMinutes: number,
  potential: RoiTaskDef['potential'],
): RoiTaskDef => ({
  id,
  label,
  labelKey: `roi.task.${id}`,
  defaultAutomationPct,
  defaultTimesPerDay,
  defaultMinutes,
  potential,
  whyKey: `roi.why.${id}`,
});

/** Task catalog. defaultAutomationPct is a percent (0–100). */
export const ROI_TASKS: readonly RoiTaskDef[] = [
  roiTask('whatsappReplies', 'WhatsApp replies', 70, 20, 3, 'high'),
  roiTask('repetitiveFaqs', 'Repetitive customer questions (FAQs)', 80, 15, 3, 'high'),
  roiTask('scheduling', 'Scheduling appointments', 75, 10, 4, 'high'),
  roiTask('reminders', 'Reminders', 90, 10, 2, 'high'),
  roiTask('leadFollowUps', 'Lead follow-ups', 65, 8, 5, 'high'),
  roiTask('spreadsheetEntry', 'Data entry in spreadsheets', 70, 20, 2, 'high'),
  roiTask('invoices', 'Invoices', 60, 5, 8, 'medium'),
  roiTask('reports', 'Reports', 75, 1, 25, 'medium'),
  roiTask('copyingBetweenSystems', 'Copying data between systems', 85, 15, 2, 'high'),
  roiTask('crmUpdates', 'CRM updates', 70, 10, 2, 'medium'),
  roiTask('collectCustomerInfo', 'Collecting customer information', 75, 8, 4, 'high'),
  roiTask('sendingEmails', 'Sending emails', 70, 20, 3, 'medium'),
  roiTask('orderProcessing', 'Order processing', 55, 10, 5, 'medium'),
  roiTask('customerSupport', 'Customer support', 45, 12, 6, 'medium'),
  roiTask('other', 'Other repetitive work', 40, 5, 10, 'low'),
];
