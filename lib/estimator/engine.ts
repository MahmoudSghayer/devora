// Pure estimator engine. No I/O, no framework, JSON-in / JSON-out.
//
// Order of operations (documented in docs/pricing-engine.md):
//   1. build      base of the priciest type (100%) + other types (additionalTypeRate),
//                 extra pages, product-count bucket, user-role bucket
//   2. features   fixed prices; multilingual = max(min, rate × (build + other features))
//   3. design     existing-design discount (on build only), premium markup
//                 (on build + features + discount), flat brand / motion add-ons
//   4. integrations  fixed prices (+ optional monthly)
//   Shared ids (crm, multilingual, advancedSeo, payments) are priced once even
//   when chosen in both the features step and the integrations step.

import {ESTIMATOR_CONFIG, TIERS} from '@/lib/pricing/config';
import type {EstimatorAnswers} from './schema';
import {
  FEATURE_IDS,
  INTEGRATION_ONLY_IDS,
  LINE_GROUPS,
  PROJECT_TYPES,
  SHARED_IDS,
  type EstimateGroup,
  type EstimateResult,
  type EstimatorConfig,
  type FeatureId,
  type IntegrationOnlyId,
  type LineGroup,
  type LineItem,
  type MaintenancePlan,
  type ProjectType,
} from './types';

const round10 = (n: number): number => Math.round(n / 10) * 10;

function item(
  id: string,
  group: LineGroup,
  label: string,
  amount: number,
  days: number,
  monthly?: number,
): LineItem {
  const out: LineItem = {id, group, label, labelKey: `estimator.item.${id}`, amount, days};
  if (monthly) out.monthly = monthly;
  return out;
}

/** Unique, known types; `unsure` is dropped when real types exist. */
function normalizeTypes(types: readonly ProjectType[]): ProjectType[] {
  const set = new Set(types);
  const real = PROJECT_TYPES.filter((t) => t !== 'unsure' && set.has(t));
  return real.length > 0 ? real : ['unsure'];
}

function buildItems(types: ProjectType[], answers: EstimatorAnswers, c: EstimatorConfig): LineItem[] {
  const out: LineItem[] = [];
  const ranked = [...types].sort(
    (a, b) =>
      c.projectBase[b].amount - c.projectBase[a].amount ||
      PROJECT_TYPES.indexOf(a) - PROJECT_TYPES.indexOf(b),
  );
  ranked.forEach((t, i) => {
    const b = c.projectBase[t];
    if (i === 0) {
      out.push(item(`base.${t}`, 'build', b.label, b.amount, b.days));
    } else {
      const pct = Math.round(c.additionalTypeRate * 100);
      out.push(
        item(
          `type.${t}`,
          'build',
          `Additional: ${b.label} (shared foundation, ${pct}%)`,
          round10(b.amount * c.additionalTypeRate),
          Math.round(b.days * c.additionalTypeRate * 10) / 10,
        ),
      );
    }
  });
  const pages = answers.pages ?? (answers.size ? c.sizePages[answers.size] : c.pages.included);
  if (types.includes('business') && pages > c.pages.included) {
    const extra = pages - c.pages.included;
    out.push(
      item('pages', 'build', `Extra pages (${extra} beyond ${c.pages.included})`, extra * c.pages.perPage, extra * c.pages.daysPerPage),
    );
  }
  if (types.includes('ecommerce') && answers.productBucket) {
    const p = c.products[answers.productBucket];
    if (p.amount > 0) out.push(item('products', 'build', p.label, p.amount, p.days));
  }
  if ((types.includes('webapp') || types.includes('portal')) && answers.rolesBucket) {
    const r = c.roles[answers.rolesBucket];
    if (r.amount > 0) out.push(item('roles', 'build', r.label, r.amount, r.days));
  }
  return out;
}

const sum = (items: readonly LineItem[], key: 'amount' | 'days'): number =>
  items.reduce((s, i) => s + i[key], 0);

/** Round to the nearest `step`; floor/ceil variants guarantee low ≤ total ≤ high. */
const floorTo = (n: number, step: number): number => Math.floor(n / step) * step;
const ceilTo = (n: number, step: number): number => Math.ceil(n / step) * step;

function planFor(subtotal: number, c: EstimatorConfig): MaintenancePlan {
  if (subtotal >= c.maintenanceThresholds.growth) return 'growth';
  if (subtotal >= c.maintenanceThresholds.studio) return 'studio';
  return 'launch';
}

/**
 * Estimate a project from the visitor's answers. Indicative, not a quotation.
 * Adding a feature or integration never lowers the total.
 */
export function estimateProject(
  answers: EstimatorAnswers,
  config: EstimatorConfig = ESTIMATOR_CONFIG,
): EstimateResult {
  const c = config;
  const types = normalizeTypes(answers.types);
  const needsDiscovery = answers.types.length === 0 || answers.types.includes('unsure');

  const build = buildItems(types, answers, c);

  // features (step 3): only those relevant to a selected type
  const chosenFeatures = new Set(answers.features ?? []);
  const featureIds = FEATURE_IDS.filter(
    (id) =>
      chosenFeatures.has(id) &&
      // an undecided project ('unsure') prices whatever the visitor picked
      (types.includes('unsure') || c.features[id].appliesTo.some((t) => types.includes(t))),
  );
  // shared ids chosen only in step 5 are priced in the integrations group
  const chosenIntegrations = new Set(answers.integrations ?? []);
  const sharedFromIntegrations = SHARED_IDS.filter(
    (id) => chosenIntegrations.has(id) && !featureIds.includes(id),
  );

  const featureItem = (id: FeatureId, group: LineGroup, coreBase: number): LineItem => {
    const f = c.features[id];
    const amount = f.percentOfCore
      ? Math.max(f.percentOfCore.min, round10(coreBase * f.percentOfCore.rate))
      : f.amount;
    return item(`feature.${id}`, group, f.label, amount, f.days);
  };

  // Shared items (CRM, multilingual, advanced SEO, payments) are priced the same
  // whether the visitor picked them in step 3 or step 5: both feed the core base
  // (for percent-based items) and the premium-design base. Only the group differs.
  const isPlain = (id: FeatureId) => !c.features[id].percentOfCore;
  const features: LineItem[] = featureIds.filter(isPlain).map((id) => featureItem(id, 'features', 0));
  const sharedPlain: LineItem[] = sharedFromIntegrations
    .filter(isPlain)
    .map((id) => featureItem(id, 'integrations', 0));
  const coreBase = sum(build, 'amount') + sum(features, 'amount') + sum(sharedPlain, 'amount');
  for (const id of featureIds.filter((i) => !isPlain(i))) {
    features.push(featureItem(id, 'features', coreBase));
  }
  features.sort((a, b) => featureOrder(a.id) - featureOrder(b.id));
  const sharedPercent: LineItem[] = sharedFromIntegrations
    .filter((id) => !isPlain(id))
    .map((id) => featureItem(id, 'integrations', coreBase));
  const sharedItems = [...sharedPlain, ...sharedPercent];

  // design
  const design: LineItem[] = [];
  const d = answers.design ?? {};
  const buildSub = sum(build, 'amount');
  let designDelta = 0;
  if (d.existing) {
    const amount = -round10(buildSub * (1 - c.design.existingFactor));
    designDelta += amount;
    design.push(item('design.existing', 'design', 'Existing design provided (build discount)', amount, 0));
  }
  if (d.premium) {
    const base = buildSub + sum(features, 'amount') + sum(sharedItems, 'amount') + designDelta;
    design.push(
      item('design.premium', 'design', 'Premium visual design', round10(base * c.design.premiumFactor - base + 1e-9), c.design.premiumDays),
    );
  }
  if (d.brandIdentity) {
    const b = c.design.brandIdentity;
    design.push(item('design.brandIdentity', 'design', 'Brand identity', b.amount, b.days));
  }
  if (d.advancedMotion) {
    const m = c.design.advancedMotion;
    design.push(item('design.advancedMotion', 'design', 'Advanced 3D / animation', m.amount, m.days));
  }

  // integrations (step 5)
  const integrations: LineItem[] = [];
  integrations.push(...sharedItems);
  for (const id of INTEGRATION_ONLY_IDS as readonly IntegrationOnlyId[]) {
    if (!chosenIntegrations.has(id)) continue;
    const g = c.integrations[id];
    integrations.push(item(`integration.${id}`, 'integrations', g.label, g.amount, g.days, g.monthly));
  }

  const byGroup: Record<LineGroup, LineItem[]> = {build, features, integrations, design};
  const groups = {} as Record<LineGroup, EstimateGroup>;
  for (const g of LINE_GROUPS) groups[g] = {subtotal: sum(byGroup[g], 'amount'), items: byGroup[g]};
  const lineItems = LINE_GROUPS.flatMap((g) => byGroup[g]);

  const subtotal = sum(lineItems, 'amount');
  const days = sum(lineItems, 'days');
  const t = c.timeline;
  const weeks = days / t.daysPerWeek;
  const weeksLow = Math.max(1, Math.ceil(weeks * t.parallelismLow));
  const weeksHigh = Math.max(weeksLow, Math.ceil(weeks * t.parallelismHigh + t.bufferWeeksHigh));

  const maintenancePlan = planFor(subtotal, c);
  const recurring = lineItems.reduce((s, i) => s + (i.monthly ?? 0), 0);

  return {
    lineItems,
    groups,
    subtotal,
    low: Math.max(0, floorTo(subtotal * c.range.lowFactor, c.range.roundTo)),
    high: ceilTo(subtotal * c.range.highFactor, c.range.roundTo),
    weeksLow,
    weeksHigh,
    maintenanceMonthly: TIERS[maintenancePlan].monthly + recurring,
    maintenancePlan,
    needsDiscovery,
    currency: c.currency,
    configVersion: c.configVersion,
  };
}

function featureOrder(lineId: string): number {
  return FEATURE_IDS.indexOf(lineId.replace('feature.', '') as FeatureId);
}

