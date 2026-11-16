// Single source of truth for Devora pricing.
//
// Every price the site, emails, chat prompts and calculators show comes from
// here — never hardcode a number elsewhere. Values are INDICATIVE (see
// docs/pricing-engine.md); Devora can edit them without touching any UI.
//
// Currency: Israeli shekel. Prices are deliberately affordable for any small
// business (2026-11-v2 repricing). The care plans (TIERS) are the internal
// source for the monthly maintenance price; they are never sold as packages.

import type {EstimatorConfig, FeatureDef, FeatureId, Goal, ProjectType, SizeId} from '@/lib/estimator/types';
import type {RoiConfig, RoiTaskDef, RoiTaskId} from '@/lib/roi/types';

export const CURRENCY = 'ILS' as const;
export type CurrencyCode = typeof CURRENCY;

/** Bump when any price in this file changes (stored with every lead snapshot). */
export const PRICING_CONFIG_VERSION = '2026-11-v2';

export type TierId = 'launch' | 'studio' | 'growth';

export interface Tier {
  id: TierId;
  /** one-time build, "from" price (CURRENCY major units) */
  from: number;
  /** monthly care plan (CURRENCY major units) */
  monthly: number;
}

export const TIERS: Record<TierId, Tier> = {
  // `from` = build subtotal at which the plan starts to apply (internal; never surfaced).
  launch: {id: 'launch', from: 1500, monthly: 150},
  studio: {id: 'studio', from: 4500, monthly: 250},
  growth: {id: 'growth', from: 12000, monthly: 400},
};

export const TIER_ORDER: readonly TierId[] = ['launch', 'studio', 'growth'];

/** Care-plan monthly range across tiers (for copy like "from ₪150/mo"). */
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
 *   t('a5', pricingParams(locale))  with  "…{care_min}–{care_max}/mo"
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
  feature({id: 'blog', home: 'business', appliesTo: ['business'], label: 'Blog / articles', amount: 500, days: 3}),
  feature({id: 'leadForm', home: 'business', appliesTo: ['landing', 'business'], label: 'Contact / lead collection', amount: 300, days: 1}),
  feature({id: 'booking', home: 'business', appliesTo: ['business'], label: 'Online booking', amount: 1200, days: 6}),
  // shared (also selectable in step 5 — priced once)
  feature({id: 'crm', home: 'shared', appliesTo: BUSINESS_TYPES, label: 'CRM integration', amount: 900, days: 4}),
  feature({
    id: 'multilingual',
    home: 'shared',
    appliesTo: BUSINESS_TYPES,
    label: 'Multilingual (Hebrew / Arabic / English)',
    amount: 0,
    days: 4,
    percentOfCore: {rate: 0.1, min: 600},
  }),
  feature({id: 'advancedSeo', home: 'shared', appliesTo: BUSINESS_TYPES, label: 'Advanced SEO', amount: 700, days: 3}),
  feature({id: 'adminDashboard', home: 'shared', appliesTo: ['business', 'ecommerce', 'booking', 'portal', 'webapp'], label: 'Admin dashboard', amount: 1200, days: 5}),
  feature({id: 'payments', home: 'shared', appliesTo: BUSINESS_TYPES, label: 'Online payments', amount: 800, days: 3}),
  // e-commerce
  feature({id: 'categories', home: 'ecommerce', appliesTo: ['ecommerce'], label: 'Product categories', amount: 250, days: 1}),
  feature({id: 'filtering', home: 'ecommerce', appliesTo: ['ecommerce'], label: 'Advanced filtering & search', amount: 700, days: 2}),
  feature({id: 'accounts', home: 'ecommerce', appliesTo: ['ecommerce'], label: 'Customer accounts', amount: 700, days: 3}),
  feature({id: 'cart', home: 'ecommerce', appliesTo: ['ecommerce'], label: 'Shopping cart & checkout', amount: 400, days: 3}),
  feature({id: 'shipping', home: 'ecommerce', appliesTo: ['ecommerce'], label: 'Shipping options', amount: 800, days: 2}),
  feature({id: 'inventory', home: 'ecommerce', appliesTo: ['ecommerce'], label: 'Inventory management', amount: 1000, days: 3}),
  feature({id: 'coupons', home: 'ecommerce', appliesTo: ['ecommerce'], label: 'Coupons & discounts', amount: 350, days: 2}),
  feature({id: 'orderTracking', home: 'ecommerce', appliesTo: ['ecommerce'], label: 'Order tracking', amount: 500, days: 2}),
  feature({id: 'notifications', home: 'ecommerce', appliesTo: ['ecommerce', 'booking'], label: 'Customer notifications', amount: 400, days: 2}),
  // web app
  feature({id: 'auth', home: 'webapp', appliesTo: ['dashboard', 'portal', 'webapp'], label: 'Authentication & accounts', amount: 900, days: 4}),
  feature({id: 'subscriptions', home: 'webapp', appliesTo: ['webapp', 'portal'], label: 'Subscriptions & billing plans', amount: 1800, days: 7}),
  feature({id: 'dashboards', home: 'webapp', appliesTo: ['dashboard', 'portal', 'webapp'], label: 'Dashboards & charts', amount: 1500, days: 8}),
  feature({id: 'database', home: 'webapp', appliesTo: ['dashboard', 'portal', 'webapp'], label: 'Database management screens', amount: 1200, days: 5}),
  feature({id: 'apiIntegrations', home: 'webapp', appliesTo: ['dashboard', 'portal', 'webapp'], label: 'API integrations', amount: 1000, days: 5}),
  feature({id: 'realtime', home: 'webapp', appliesTo: ['dashboard', 'portal', 'webapp'], label: 'Real-time updates', amount: 1800, days: 7}),
  feature({id: 'aiFeatures', home: 'webapp', appliesTo: ['dashboard', 'portal', 'webapp'], label: 'AI features', amount: 2500, days: 8}),
]) as Record<FeatureId, FeatureDef>;

/** Indicative project estimator prices (ILS). Documented in docs/pricing-engine.md. */
export const ESTIMATOR_CONFIG: EstimatorConfig = {
  configVersion: PRICING_CONFIG_VERSION,
  currency: CURRENCY,
  projectBase: {
    landing: {label: 'Landing page', amount: 1500, days: 4},
    business: {label: 'Business website (up to 5 pages)', amount: 2900, days: 8},
    ecommerce: {label: 'E-commerce store', amount: 5500, days: 16},
    booking: {label: 'Booking / scheduling system', amount: 4500, days: 14},
    dashboard: {label: 'Dashboard / internal tool', amount: 7000, days: 18},
    portal: {label: 'Customer portal', amount: 8000, days: 22},
    webapp: {label: 'Custom web app', amount: 12000, days: 30},
    unsure: {label: 'Project to be defined (discovery)', amount: 2900, days: 8},
  },
  additionalTypeRate: 0.6,
  pages: {included: 5, perPage: 150, daysPerPage: 0.5},
  // Representative page count per size card (used when `pages` is not answered).
  // small = 1–5 pages → 5; medium = 6–15 → 10; large = 16–40 → 28; xlarge = 40+ → 50;
  // unsure → 8 (a modest mid-small site; the team confirms scope in discovery).
  sizePages: {small: 5, medium: 10, large: 28, xlarge: 50, unsure: 8},
  products: {
    p1_20: {label: 'Catalog: 1–20 products', amount: 0, days: 0},
    p21_100: {label: 'Catalog: 21–100 products', amount: 600, days: 2},
    p101_500: {label: 'Catalog: 101–500 products', amount: 1500, days: 4},
    p501_1000: {label: 'Catalog: 501–1,000 products', amount: 2500, days: 6},
    p1000_plus: {label: 'Catalog: 1,000+ products', amount: 3500, days: 9},
  },
  roles: {
    one: {label: 'User roles: single role', amount: 0, days: 0},
    few: {label: 'User roles: 2–3 roles', amount: 1200, days: 4},
    many: {label: 'User roles: 4+ roles', amount: 2500, days: 8},
  },
  features: FEATURES,
  integrations: {
    whatsapp: {id: 'whatsapp', label: 'WhatsApp integration', amount: 300, days: 2},
    emailAutomation: {id: 'emailAutomation', label: 'Email automation', amount: 600, days: 3},
    aiChatbot: {id: 'aiChatbot', label: 'AI chatbot', amount: 1800, days: 7, monthly: 100},
    aiAgents: {id: 'aiAgents', label: 'AI agents / workflows', amount: 3500, days: 12, monthly: 150},
    thirdPartyApi: {id: 'thirdPartyApi', label: 'Third-party API integration', amount: 1000, days: 5},
    analytics: {id: 'analytics', label: 'Analytics & reporting', amount: 400, days: 3},
    hosting: {id: 'hosting', label: 'Hosting & domain setup (covered by the care plan)', amount: 0, days: 1},
    maintenance: {id: 'maintenance', label: 'Ongoing care plan (billed monthly, shown separately)', amount: 0, days: 0},
  },
  design: {
    existingFactor: 0.85,
    brandIdentity: {amount: 1200, days: 5},
    advancedMotion: {amount: 2000, days: 8},
    premiumFactor: 1.1,
    premiumDays: 4,
  },
  // Overlap table (docs/pricing-engine.md): never charge the same scope twice.
  typeIncludes: {
    booking: ['booking'], // the booking system IS online booking
    dashboard: ['adminDashboard'], // a dashboard/internal tool already has its admin area
  },
  integrationCovers: {
    emailAutomation: ['notifications'], // customer notification emails are email automation
  },
  range: {lowFactor: 0.9, highFactor: 1.15, roundTo: 100},
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
  implementation: {base: 1500, perTask: 900},
  running: {base: 120, perTask: 40},
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

// ── Guided-flow option cards (rendered from config by the UIs) ──

/** Goal cards for the website estimator. i18n: `estimator.goal.<id>`. */
export const GOAL_OPTIONS: readonly {id: Goal; i18nKey: string}[] = (
  ['leads', 'sell', 'bookings', 'brand', 'content', 'portal', 'other'] as const
).map((id) => ({id, i18nKey: `estimator.goal.${id}`}));

/** Size cards. i18n: `estimator.size.<id>`; `pages` is the representative page count. */
export const SIZE_OPTIONS: readonly {id: SizeId; i18nKey: string; pages: number; range: string}[] = [
  {id: 'small', range: '1–5'},
  {id: 'medium', range: '6–15'},
  {id: 'large', range: '16–40'},
  {id: 'xlarge', range: '40+'},
  {id: 'unsure', range: ''},
].map((o) => ({
  id: o.id as SizeId,
  i18nKey: `estimator.size.${o.id}`,
  pages: ESTIMATOR_CONFIG.sizePages[o.id as SizeId],
  range: o.range,
}));

/** Project types a goal suggests (the UI pre-selects them in the next step). */
export const GOAL_TYPE_SUGGESTIONS: Record<Goal, ProjectType[]> = {
  leads: ['business', 'landing'],
  sell: ['ecommerce'],
  bookings: ['booking'],
  brand: ['business'],
  content: ['business'],
  portal: ['portal'],
  other: ['unsure'],
};
