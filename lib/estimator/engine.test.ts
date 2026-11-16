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
  it('landing alone ≈ ₪1,400–1,800', () => {
    const r = estimateProject({types: ['landing']});
    expect(r.subtotal).toBe(1500);
    expect(r.subtotal).toBeGreaterThanOrEqual(1400);
    expect(r.subtotal).toBeLessThanOrEqual(1800);
    expect(r.maintenancePlan).toBe('launch');
  });

  it('5-page business site + WhatsApp + hosting ≈ ₪2,600–3,400', () => {
    const r = estimateProject({types: ['business'], pages: 5, integrations: ['whatsapp', 'hosting']});
    expect(r.subtotal).toBe(C.projectBase.business.amount + C.integrations.whatsapp.amount + C.integrations.hosting.amount);
    expect(r.subtotal).toBeGreaterThanOrEqual(2600);
    expect(r.subtotal).toBeLessThanOrEqual(3400);
    expect(r.maintenancePlan).toBe('launch');
  });

  it('small store (≤100 products, payments, shipping) ≈ ₪6,500–8,500', () => {
    const r = estimateProject({types: ['ecommerce'], productBucket: 'p21_100', features: ['payments', 'shipping']});
    expect(r.subtotal).toBe(7700);
    expect(r.subtotal).toBeGreaterThanOrEqual(6500);
    expect(r.subtotal).toBeLessThanOrEqual(8500);
    expect(r.maintenancePlan).toBe('studio');
  });

  it('web app with auth + dashboards starts at ≈ ₪12,000+', () => {
    const r = estimateProject({types: ['webapp'], features: ['auth', 'dashboards']});
    expect(r.subtotal).toBeGreaterThanOrEqual(12000);
    expect(r.maintenancePlan).toBe('growth');
    const big = estimateProject({
      types: ['webapp'],
      rolesBucket: 'many',
      features: ['auth', 'subscriptions', 'payments', 'dashboards', 'apiIntegrations', 'realtime'],
    });
    expect(big.low).toBeGreaterThanOrEqual(TIERS.growth.from);
  });
});

describe('overlaps are never double-charged', () => {
  it('booking type + the "booking" feature costs the same as the booking type alone', () => {
    const alone = estimateProject({types: ['booking']});
    const both = estimateProject({types: ['booking'], features: ['booking']});
    expect(both.subtotal).toBe(alone.subtotal);
    expect(both.lineItems.map((i) => i.id)).toEqual(alone.lineItems.map((i) => i.id));
    expect(both.weeksHigh).toBe(alone.weeksHigh);
  });
  it('booking + business types: online booking is still not priced on top', () => {
    const alone = estimateProject({types: ['booking', 'business']});
    const both = estimateProject({types: ['booking', 'business'], features: ['booking']});
    expect(both.subtotal).toBe(alone.subtotal);
  });
  it('business without the booking type still prices online booking', () => {
    const r = estimateProject({types: ['business'], features: ['booking']});
    expect(r.subtotal).toBe(C.projectBase.business.amount + C.features.booking.amount);
  });
  it('dashboard type + admin dashboard feature costs the same as the dashboard type alone', () => {
    const alone = estimateProject({types: ['dashboard', 'business']});
    const both = estimateProject({types: ['dashboard', 'business'], features: ['adminDashboard']});
    expect(both.subtotal).toBe(alone.subtotal);
    expect(estimateProject({types: ['dashboard'], features: ['adminDashboard']}).subtotal).toBe(C.projectBase.dashboard.amount);
  });
  it('email automation covers customer notifications (priced once)', () => {
    const email = estimateProject({types: ['ecommerce'], integrations: ['emailAutomation']});
    const both = estimateProject({types: ['ecommerce'], features: ['notifications'], integrations: ['emailAutomation']});
    expect(both.subtotal).toBe(email.subtotal);
    const onlyNotif = estimateProject({types: ['ecommerce'], features: ['notifications']});
    expect(onlyNotif.subtotal).toBe(C.projectBase.ecommerce.amount + C.features.notifications.amount);
  });
  it('questions hide options the selected types already include', () => {
    const optionIds = (types: EstimatorAnswers['types'], qid: string, integrations?: string[]) =>
      visibleQuestions({types, integrations}).find((q) => q.id === qid)?.options?.map((o) => o.id) ?? [];
    expect(optionIds(['business'], 'features.business')).toContain('booking');
    expect(optionIds(['business', 'booking'], 'features.business')).not.toContain('booking');
    expect(optionIds(['business', 'dashboard'], 'features.shared')).not.toContain('adminDashboard');
    expect(optionIds(['business'], 'features.shared')).toContain('adminDashboard');
    expect(optionIds(['ecommerce'], 'features.ecommerce')).toContain('notifications');
    expect(optionIds(['ecommerce'], 'features.ecommerce', ['emailAutomation'])).not.toContain('notifications');
    // a question whose options are all redundant disappears
    expect(visibleQuestions({types: ['booking']}).some((q) => q.id === 'features.business')).toBe(false);
  });
});

describe('types', () => {
  it('unsure => needsDiscovery with the unsure base', () => {
    const r = estimateProject({types: ['unsure']});
    expect(r.needsDiscovery).toBe(true);
    expect(r.subtotal).toBe(C.projectBase.unsure.amount);
  });

  it('additional types cost 60% of base; priciest is full price', () => {
    const r = estimateProject({types: ['business', 'ecommerce']});
    expect(r.subtotal).toBe(C.projectBase.ecommerce.amount + Math.round((C.projectBase.business.amount * 0.6) / 10) * 10);
    expect(r.lineItems.map((i) => i.id)).toEqual(['base.ecommerce', 'type.business']);
  });

  it('a landing page is included (₪0 line) whenever a multi-page type is selected', () => {
    const r = estimateProject({types: ['landing', 'business']});
    expect(r.subtotal).toBe(C.projectBase.business.amount);
    const landing = r.lineItems.find((i) => i.id === 'type.landing');
    expect(landing?.amount).toBe(0);
    // landing alone is still priced normally
    expect(estimateProject({types: ['landing']}).subtotal).toBe(C.projectBase.landing.amount);
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
  it('uses the minimum on small builds and 10% on larger ones', () => {
    const small = estimateProject({types: ['landing'], features: ['multilingual']});
    expect(small.lineItems.find((i) => i.id === 'feature.multilingual')?.amount).toBe(600);
    const big = estimateProject({types: ['webapp'], features: ['multilingual']});
    expect(big.lineItems.find((i) => i.id === 'feature.multilingual')?.amount).toBe(Math.round(12000 * 0.1 / 10) * 10);
  });
});

describe('design multipliers', () => {
  const base: EstimatorAnswers = {types: ['business'], features: ['blog']};
  it('existing design takes 15% off the build only', () => {
    const r = estimateProject({...base, design: {existing: true}});
    expect(r.groups.design.subtotal).toBe(-440);
  });
  it('premium adds 10% on build + features (after existing discount)', () => {
    const r = estimateProject({...base, design: {premium: true}});
    expect(r.groups.design.subtotal).toBe(Math.round((2900 + 500) * 0.1 / 10) * 10);
    const both = estimateProject({...base, design: {existing: true, premium: true}});
    expect(both.groups.design.items.map((i) => i.amount)).toEqual([-440, 300]);
  });
  it('brand identity and motion are flat', () => {
    const r = estimateProject({...base, design: {brandIdentity: true, advancedMotion: true}});
    expect(r.groups.design.subtotal).toBe(1200 + 2000);
  });
});

describe('range, timeline, maintenance', () => {
  it('range is ×0.9 / ×1.15 rounded to ₪100 with low <= total <= high', () => {
    for (const types of PROJECT_TYPES.map((t) => [t])) {
      const r = estimateProject({types});
      expect(r.low % 100).toBe(0);
      expect(r.high % 100).toBe(0);
      expect(r.low).toBeLessThanOrEqual(r.subtotal);
      expect(r.high).toBeGreaterThanOrEqual(r.subtotal);
      expect(r.low).toBeGreaterThan(r.subtotal * 0.9 - 100);
      expect(r.high).toBeLessThan(r.subtotal * 1.15 + 100);
    }
    const landing = estimateProject({types: ['landing']});
    expect([landing.low, landing.high]).toEqual([1300, 1800]);
  });
  it('weeks are integers >= 1 and ordered', () => {
    const r = estimateProject({types: ['landing']});
    expect(Number.isInteger(r.weeksLow) && Number.isInteger(r.weeksHigh)).toBe(true);
    expect(r.weeksLow).toBeGreaterThanOrEqual(1);
    expect(r.weeksHigh).toBeGreaterThanOrEqual(r.weeksLow);
  });
  it('maintenance includes recurring integration costs separately from the one-time total', () => {
    const r = estimateProject({types: ['business'], integrations: ['hosting', 'aiChatbot']});
    expect(r.subtotal).toBe(2900 + 0 + 1800);
    expect(r.maintenancePlan).toBe('studio'); // 4,700 >= Studio.from
    expect(r.maintenanceMonthly).toBe(TIERS.studio.monthly + 100); // hosting is covered by the care plan: +0
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

describe('shared items priced identically from step 3 or step 5', () => {
  it('business + CRM + multilingual + premium: same total either way', () => {
    const viaFeatures = estimateProject({
      types: ['business'],
      features: ['crm', 'multilingual'],
      design: {existing: false, brandIdentity: false, advancedMotion: false, premium: true},
    } as EstimatorAnswers);
    const viaIntegrations = estimateProject({
      types: ['business'],
      integrations: ['crm', 'multilingual'],
      design: {existing: false, brandIdentity: false, advancedMotion: false, premium: true},
    } as EstimatorAnswers);
    expect(viaIntegrations.subtotal).toBe(viaFeatures.subtotal);
  });
  it('an undecided project still prices a feature the visitor chose', () => {
    const r = estimateProject({types: ['unsure'], features: ['crm']} as EstimatorAnswers);
    expect(r.subtotal).toBeGreaterThan(ESTIMATOR_CONFIG.projectBase.unsure.amount);
  });
});
