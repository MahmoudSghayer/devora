// Public types + id catalogs for the project estimator. Pure TS, no framework.
// Prices live in lib/pricing/config.ts (ESTIMATOR_CONFIG), never here.

import type {CurrencyCode, TierId} from '@/lib/pricing/config';

export const PROJECT_TYPES = [
  'landing',
  'business',
  'ecommerce',
  'booking',
  'dashboard',
  'portal',
  'webapp',
  'unsure',
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

/** Features asked in step 3 (adapt to the selected project types). */
export const FEATURE_IDS = [
  // business / landing
  'blog',
  'leadForm',
  'booking',
  // shared across several types
  'crm',
  'multilingual',
  'advancedSeo',
  'adminDashboard',
  'payments',
  // e-commerce
  'categories',
  'filtering',
  'accounts',
  'cart',
  'shipping',
  'inventory',
  'coupons',
  'orderTracking',
  'notifications',
  // web app
  'auth',
  'subscriptions',
  'dashboards',
  'database',
  'apiIntegrations',
  'realtime',
  'aiFeatures',
] as const;
export type FeatureId = (typeof FEATURE_IDS)[number];

/**
 * Ids that can be chosen in BOTH step 3 (features) and step 5 (integrations).
 * They are priced once; the line item id is always `feature.<id>`.
 */
export const SHARED_IDS = ['crm', 'multilingual', 'advancedSeo', 'payments'] as const;
export type SharedId = (typeof SHARED_IDS)[number];

/** Integrations that exist only in step 5. */
export const INTEGRATION_ONLY_IDS = [
  'whatsapp',
  'emailAutomation',
  'aiChatbot',
  'aiAgents',
  'thirdPartyApi',
  'analytics',
  'hosting',
  'maintenance',
] as const;
export type IntegrationOnlyId = (typeof INTEGRATION_ONLY_IDS)[number];

/** Every id the step-5 integrations question accepts. */
export const INTEGRATION_IDS = [...INTEGRATION_ONLY_IDS, ...SHARED_IDS] as const;
export type IntegrationId = (typeof INTEGRATION_IDS)[number];

export const PRODUCT_BUCKETS = ['p1_20', 'p21_100', 'p101_500', 'p501_1000', 'p1000_plus'] as const;
export type ProductBucket = (typeof PRODUCT_BUCKETS)[number];

/** User-role buckets for web apps / portals. */
export const ROLE_BUCKETS = ['one', 'few', 'many'] as const;
export type RoleBucket = (typeof ROLE_BUCKETS)[number];

/** Goal cards (first guided step, multi-select). */
export const GOAL_IDS = ['leads', 'sell', 'bookings', 'brand', 'content', 'portal', 'other'] as const;
export type Goal = (typeof GOAL_IDS)[number];

/** Site-size cards (second guided step, single-select). */
export const SIZE_IDS = ['small', 'medium', 'large', 'xlarge', 'unsure'] as const;
export type SizeId = (typeof SIZE_IDS)[number];

export type LineGroup = 'build' | 'features' | 'integrations' | 'design';
export const LINE_GROUPS: readonly LineGroup[] = ['build', 'features', 'integrations', 'design'];

export type {EstimatorAnswers} from './schema';

export interface LineItem {
  /** stable id, e.g. `base.business`, `feature.cart`, `integration.whatsapp` */
  id: string;
  group: LineGroup;
  /** English label — used verbatim in team emails */
  label: string;
  /** i18n key: `estimator.item.<id>` */
  labelKey: string;
  /** one-time amount in ILS (negative for discounts) */
  amount: number;
  /** working days of effort */
  days: number;
  /** recurring monthly cost in ILS, when the item has one */
  monthly?: number;
}

export interface EstimateGroup {
  subtotal: number;
  items: LineItem[];
}

export type MaintenancePlan = TierId;

export interface EstimateResult {
  lineItems: LineItem[];
  groups: Record<LineGroup, EstimateGroup>;
  /** one-time total (sum of all line items) */
  subtotal: number;
  /** indicative range, rounded to ₪500: low rounds down, high rounds up */
  low: number;
  high: number;
  weeksLow: number;
  weeksHigh: number;
  /** monthly care plan + recurring integration costs, shown separately */
  maintenanceMonthly: number;
  maintenancePlan: MaintenancePlan;
  /** true when the visitor was unsure what they need */
  needsDiscovery: boolean;
  currency: CurrencyCode;
  configVersion: string;
}

// ── config shapes (instances live in lib/pricing/config.ts) ──

export interface FeatureDef {
  id: FeatureId;
  /** which step-3 question lists it */
  home: 'business' | 'ecommerce' | 'webapp' | 'shared';
  /** project types it is relevant to (ignored for other types) */
  appliesTo: readonly ProjectType[];
  label: string;
  amount: number;
  days: number;
  /** price as a share of (build + other features) with a floor, instead of `amount` */
  percentOfCore?: {rate: number; min: number};
}

export interface IntegrationDef {
  id: IntegrationOnlyId;
  label: string;
  amount: number;
  days: number;
  monthly?: number;
}

export interface BucketDef {
  label: string;
  amount: number;
  days: number;
}

export interface EstimatorConfig {
  configVersion: string;
  currency: CurrencyCode;
  projectBase: Record<ProjectType, {label: string; amount: number; days: number}>;
  /** each extra selected type costs this share of its base (cheapest-first) */
  additionalTypeRate: number;
  pages: {included: number; perPage: number; daysPerPage: number};
  /** representative page count used when `size` is answered but `pages` is not */
  sizePages: Record<SizeId, number>;
  products: Record<ProductBucket, BucketDef>;
  roles: Record<RoleBucket, BucketDef>;
  features: Record<FeatureId, FeatureDef>;
  integrations: Record<IntegrationOnlyId, IntegrationDef>;
  design: {
    existingFactor: number;
    brandIdentity: {amount: number; days: number};
    advancedMotion: {amount: number; days: number};
    premiumFactor: number;
    premiumDays: number;
  };
  range: {lowFactor: number; highFactor: number; roundTo: number};
  timeline: {daysPerWeek: number; parallelismLow: number; parallelismHigh: number; bufferWeeksHigh: number};
  /** one-time subtotal at/above which the next care plan applies */
  maintenanceThresholds: {studio: number; growth: number};
}
