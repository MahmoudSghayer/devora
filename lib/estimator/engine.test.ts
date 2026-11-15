import {describe, expect, it} from 'vitest';
import {ESTIMATOR_CONFIG, TIERS} from '@/lib/pricing/config';
import {estimateProject} from './engine';
import {estimatorAnswersSchema, type EstimatorAnswers} from './schema';
import {QUESTIONS, estimatorI18nKeys, visibleQuestions} from './questions';
import {FEATURE_IDS, GOAL_IDS, INTEGRATION_IDS, PROJECT_TYPES} from './types';
import {GOAL_OPTIONS, GOAL_TYPE_SUGGESTIONS, SIZE_OPTIONS} from './questions';
import keysJson from '@/docs/transformation/estimator-i18n-keys.json';

const C = ESTIMATOR_CONFIG;
const total = (a: EstimatorAnswers) => estimateProject(a).subtotal;

describe('calibration', () => {
  it('5-page business site + WhatsApp + hosting ≈ Launch tier', () => {
    const r = estimateProject({types: ['business'], pages: 5, integrations: ['whatsapp', 'hosting']});
    expect(r.subtotal).toBe(C.projectBase.business.amount + C.integrations.whatsapp.amount + C.integrations.hosting.amount);
    expect(r.low).toBeGreaterThanOrEqual(5000);
    expect(r.low).toBeLessThanOrEqual(TIERS.studio.from);
    expect(r.maintenancePlan).toBe('launch');
  });

  it('standard store (~50 products, cart, payments, shipping, admin) sits between Studio and Growth', () => {
    const r = estimateProject({
      types: ['ecommerce'],
      productBucket: 'p21_100',
      features: ['cart', 'payments', 'shipping', 'adminDashboard'],
    });
    expect(r.low).toBeGreaterThanOrEqual(TIERS.studio.from);
    expect(r.low).toBeLessThanOrEqual(TIERS.growth.from);
    expect(r.maintenancePlan).toBe('growth');
  });

  it('complex web app is at least Growth', () => {
    const r = estimateProject({
      types: ['webapp'],
      rolesBucket: 'many',
      features: ['auth', 'subscriptions', 'payments', 'dashboards', 'apiIntegrations', 'realtime'],
    });
    expect(r.low).toBeGreaterThanOrEqual(TIERS.growth.from);
  });
});

describe('types', () => {
  it('unsure => needsDiscovery with the unsure base', () => {
    const r = estimateProject({types: ['unsure']});
    expect(r.needsDiscovery).toBe(true);
    expect(r.subtotal).toBe(C.projectBase.unsure.amount);
  });

  it('additional types cost 70% of base; priciest is full price', () => {
    const r = estimateProject({types: ['landing', 'ecommerce']});
    expect(r.subtotal).toBe(C.projectBase.ecommerce.amount + Math.round((C.projectBase.landing.amount * 0.7) / 10) * 10);
    expect(r.lineItems.map((i) => i.id)).toEqual(['base.ecommerce', 'type.landing']);
  });

  it('unsure alongside real types is not priced as an extra type', () => {
    const r = estimateProject({types: ['business', 'unsure']});
    expect(r.subtotal).toBe(C.projectBase.business.amount);
    expect(r.needsDiscovery).toBe(true);
  });

  it('extra pages are priced beyond the included five', () => {
    const r = estimateProject({types: ['business'], pages: 9});
    expect(r.groups.build.items.find((i) => i.id === 'pages')?.amount).toBe(4 * C.pages.perPage);
  });

  it('ignores features irrelevant to the selected types', () => {
    expect(total({types: ['landing'], features: ['cart', 'realtime']})).toBe(C.projectBase.landing.amount);
  });
});

describe('dedupe', () => {
  it.each(['crm', 'multilingual', 'advancedSeo', 'payments'] as const)('%s chosen twice counts once', (id) => {
    const once = estimateProject({types: ['business'], features: [id]});
    const both = estimateProject({types: ['business'], features: [id], integrations: [id]});
    expect(both.subtotal).toBe(once.subtotal);
    expect(both.lineItems.filter((i) => i.id === `feature.${id}`)).toHaveLength(1);
    // step-5 only: priced once, in the integrations group
    const only5 = estimateProject({types: ['business'], integrations: [id]});
    expect(only5.subtotal).toBe(once.subtotal);
    expect(only5.groups.integrations.items).toHaveLength(1);
  });

  it('duplicate ids within an array count once', () => {
    expect(total({types: ['business'], features: ['blog', 'blog']})).toBe(total({types: ['business'], features: ['blog']}));
  });
});

describe('multilingual', () => {
  it('uses the minimum on small builds and 15% on larger ones', () => {
    const small = estimateProject({types: ['landing'], features: ['multilingual']});
    expect(small.lineItems.find((i) => i.id === 'feature.multilingual')?.amount).toBe(1500);
    const big = estimateProject({types: ['webapp'], features: ['multilingual']});
    expect(big.lineItems.find((i) => i.id === 'feature.multilingual')?.amount).toBe(Math.round(22000 * 0.15 / 10) * 10);
  });
});

describe('design multipliers', () => {
  const base: EstimatorAnswers = {types: ['business'], features: ['blog']};
  it('existing design takes 15% off the build only', () => {
    const r = estimateProject({...base, design: {existing: true}});
    expect(r.groups.design.subtotal).toBe(-900);
  });
  it('premium adds 15% on build + features (after existing discount)', () => {
    const r = estimateProject({...base, design: {premium: true}});
    expect(r.groups.design.subtotal).toBe(Math.round((6000 + 1200) * 0.15 / 10) * 10);
    const both = estimateProject({...base, design: {existing: true, premium: true}});
    expect(both.groups.design.items.map((i) => i.amount)).toEqual([-900, 950]);
  });
  it('brand identity and motion are flat', () => {
    const r = estimateProject({...base, design: {brandIdentity: true, advancedMotion: true}});
    expect(r.groups.design.subtotal).toBe(3500 + 5000);
  });
});

describe('range, timeline, maintenance', () => {
  it('rounds to ₪500 with low <= total <= high', () => {
    for (const types of PROJECT_TYPES.map((t) => [t])) {
      const r = estimateProject({types});
      expect(r.low % 500).toBe(0);
      expect(r.high % 500).toBe(0);
      expect(r.low).toBeLessThanOrEqual(r.subtotal);
      expect(r.high).toBeGreaterThanOrEqual(r.subtotal);
      expect(r.low).toBeGreaterThanOrEqual(r.subtotal * 0.9 - 500);
    }
  });
  it('weeks are integers >= 1 and ordered', () => {
    const r = estimateProject({types: ['landing']});
    expect(Number.isInteger(r.weeksLow) && Number.isInteger(r.weeksHigh)).toBe(true);
    expect(r.weeksLow).toBeGreaterThanOrEqual(1);
    expect(r.weeksHigh).toBeGreaterThanOrEqual(r.weeksLow);
  });
  it('maintenance includes recurring integration costs separately from the one-time total', () => {
    const r = estimateProject({types: ['business'], integrations: ['hosting', 'aiChatbot']});
    expect(r.subtotal).toBe(6000 + 600 + 4500);
    expect(r.maintenancePlan).toBe('studio'); // 11,100 >= Studio.from
    expect(r.maintenanceMonthly).toBe(TIERS.studio.monthly + 60 + 150);
  });
  it('is JSON-serializable', () => {
    const r = estimateProject({types: ['business'], integrations: ['whatsapp']});
    expect(JSON.parse(JSON.stringify(r))).toEqual(r);
    expect(r.currency).toBe('ILS');
    expect(r.configVersion).toBe(C.configVersion);
  });
});

describe('monotonicity', () => {
  it('adding any feature or integration never lowers the total', () => {
    const types = ['business', 'ecommerce', 'webapp'] as const;
    const base: EstimatorAnswers = {types: [...types], design: {premium: true}};
    let prev = total(base);
    const features: EstimatorAnswers['features'] = [];
    for (const f of FEATURE_IDS) {
      features.push(f);
      const t = total({...base, features: [...features]});
      expect(t).toBeGreaterThanOrEqual(prev);
      prev = t;
    }
    const integrations: EstimatorAnswers['integrations'] = [];
    for (const i of INTEGRATION_IDS) {
      integrations.push(i);
      const t = total({...base, features: [...features], integrations: [...integrations]});
      expect(t).toBeGreaterThanOrEqual(prev);
      prev = t;
    }
  });
});

describe('questions', () => {
  const ids = (types: EstimatorAnswers['types']) => visibleQuestions({types}).map((q) => q.id);
  it('adapts step 3 to the selected types', () => {
    expect(ids(['landing'])).not.toContain('features.ecommerce');
    expect(ids(['landing'])).not.toContain('products');
    expect(ids(['ecommerce'])).toContain('features.ecommerce');
    expect(ids(['ecommerce'])).toContain('products');
    expect(ids(['ecommerce'])).not.toContain('features.webapp');
    expect(ids(['webapp'])).toContain('roles');
    expect(ids(['webapp'])).not.toContain('problem');
    expect(ids(['business', 'webapp'])).toContain('pages');
  });
  it('starts with goals then size, and every question is option-based', () => {
    expect(QUESTIONS.slice(0, 3).map((q) => q.id)).toEqual(['goals', 'size', 'types']);
    for (const q of QUESTIONS) expect(q.options !== undefined || q.kind === 'toggle').toBe(true);
  });
  it('always shows type, design and integrations', () => {
    const v = ids(['unsure']);
    expect(v).toEqual(expect.arrayContaining(['types', 'design.premium', 'integrations']));
    expect(v).not.toContain('features.business');
  });
  it('every feature and integration appears in exactly one question option list', () => {
    const count = (qid: string, id: string) =>
      QUESTIONS.filter((q) => q.id === qid).flatMap((q) => q.options ?? []).filter((o) => o.id === id).length;
    for (const f of FEATURE_IDS) expect(count(`features.${C.features[f].home}`, f)).toBe(1);
    for (const i of INTEGRATION_IDS) expect(count('integrations', i)).toBe(1);
  });
  it('i18n key file is in sync with the flow', () => {
    expect(keysJson).toEqual(estimatorI18nKeys());
    for (const q of QUESTIONS) expect(keysJson).toHaveProperty([q.labelKey]);
  });
});

describe('schema', () => {
  it('accepts a valid payload', () => {
    expect(estimatorAnswersSchema.safeParse({types: ['business'], pages: 6, design: {premium: true}}).success).toBe(true);
  });
  it('rejects unknown keys (top level and nested)', () => {
    expect(estimatorAnswersSchema.safeParse({types: ['business'], extra: 1}).success).toBe(false);
    expect(estimatorAnswersSchema.safeParse({types: ['business'], design: {foo: true}}).success).toBe(false);
  });
  it('rejects oversize / out-of-range values', () => {
    expect(estimatorAnswersSchema.safeParse({types: ['business'], problem: 'x'.repeat(1501)}).success).toBe(false);
    expect(estimatorAnswersSchema.safeParse({types: ['business'], pages: 201}).success).toBe(false);
    expect(estimatorAnswersSchema.safeParse({types: []}).success).toBe(false);
    expect(estimatorAnswersSchema.safeParse({types: ['nope']}).success).toBe(false);
    expect(estimatorAnswersSchema.safeParse({types: ['business'], features: Array(200).fill('blog')}).success).toBe(false);
  });
});

describe('goals and size', () => {
  it('maps size to a representative page count and prices pages beyond the included 5', () => {
    const extra = (size: NonNullable<EstimatorAnswers['size']>) =>
      total({types: ['business'], size}) - C.projectBase.business.amount;
    expect(extra('small')).toBe(0);
    expect(extra('medium')).toBe((C.sizePages.medium - C.pages.included) * C.pages.perPage);
    expect(extra('xlarge')).toBe((50 - 5) * C.pages.perPage);
    expect(extra('unsure')).toBe((8 - 5) * C.pages.perPage);
  });
  it('explicit pages win over size', () => {
    expect(total({types: ['business'], size: 'xlarge', pages: 5})).toBe(C.projectBase.business.amount);
  });
  it('exports goal and size cards and suggestions', () => {
    expect(GOAL_OPTIONS.map((g) => g.id)).toEqual(GOAL_IDS);
    expect(SIZE_OPTIONS.map((s) => s.i18nKey)).toContain('estimator.size.unsure');
    expect(GOAL_TYPE_SUGGESTIONS.sell).toEqual(['ecommerce']);
    for (const g of GOAL_IDS) expect(GOAL_TYPE_SUGGESTIONS[g].length).toBeGreaterThan(0);
  });
  it('validates goals and size', () => {
    expect(estimatorAnswersSchema.safeParse({types: ['business'], goals: ['leads', 'sell'], size: 'large'}).success).toBe(true);
    expect(estimatorAnswersSchema.safeParse({types: ['business'], goals: ['x']}).success).toBe(false);
    expect(estimatorAnswersSchema.safeParse({types: ['business'], size: 'huge'}).success).toBe(false);
  });
});
