import {describe, expect, it} from 'vitest';
import {ESTIMATOR_CONFIG} from '@/lib/pricing/config';
import keysJson from '@/docs/transformation/discuss-i18n-keys.json';
import {budgetFit, estimateDiscuss} from './engine';
import {discussI18nKeys} from './i18n-keys';
import {
  BUDGET_OPTIONS,
  INTEGRATIONS_OPTIONS,
  MUST_HAVE_OPTIONS,
  PURPOSE_OPTIONS,
  TIMELINE_OPTIONS,
  TODAY_OPTIONS,
  USERS_OPTIONS,
  discussAnswersSchema,
  type DiscussAnswers,
} from './schema';

const mid: DiscussAnswers = {purpose: ['replace-spreadsheets'], users: 'team-2-10', today: 'spreadsheets'};

describe('estimateDiscuss', () => {
  it('a mid app lands at or above the web-app base', () => {
    const r = estimateDiscuss(mid);
    expect(r.estimate.subtotal).toBeGreaterThanOrEqual(ESTIMATOR_CONFIG.projectBase.webapp.amount);
    expect(r.startingLow % 500).toBe(0);
    expect(r.startingHigh % 500).toBe(0);
    expect(r.startingLow).toBeLessThanOrEqual(r.estimate.subtotal);
    expect(r.startingHigh).toBeGreaterThanOrEqual(r.estimate.subtotal);
    expect(r.configVersion).toBe(ESTIMATOR_CONFIG.configVersion);
    expect(r.assumptions.length).toBeGreaterThan(0);
  });
  it('adding must-haves, integrations or users never lowers the price', () => {
    let prev = estimateDiscuss(mid).estimate.subtotal;
    const picked: DiscussAnswers['mustHaves'] = [];
    for (const m of MUST_HAVE_OPTIONS) {
      picked.push(m);
      const t = estimateDiscuss({...mid, mustHaves: [...picked]}).estimate.subtotal;
      expect(t).toBeGreaterThanOrEqual(prev);
      prev = t;
    }
    const base = estimateDiscuss({...mid, mustHaves: ['auth-roles']}).estimate.subtotal;
    let last = base;
    for (const i of ['none', 'one-two', 'many'] as const) {
      const t = estimateDiscuss({...mid, mustHaves: ['auth-roles'], integrations: i}).estimate.subtotal;
      expect(t).toBeGreaterThanOrEqual(last);
      last = t;
    }
  });
  it('maps users to roles, ai/bilingual/payments to features and notifications to email automation', () => {
    const r = estimateDiscuss({...mid, users: 'team-10-50', mustHaves: ['ai-assistant', 'bilingual', 'payments', 'notifications']});
    const ids = r.estimate.lineItems.map((i) => i.id);
    expect(ids).toEqual(expect.arrayContaining(['roles', 'feature.aiFeatures', 'feature.multilingual', 'feature.payments', 'integration.emailAutomation']));
  });
  it('portal-only and dashboard-only purposes use their own base', () => {
    expect(estimateDiscuss({purpose: ['customer-portal']}).estimate.lineItems[0].id).toBe('base.portal');
    expect(estimateDiscuss({purpose: ['internal-dashboard']}).estimate.lineItems[0].id).toBe('base.dashboard');
  });
  it('budgetFit compares the band to the starting range', () => {
    const r = estimateDiscuss(mid);
    expect(estimateDiscuss({...mid, budget: 'unsure'}).budgetFit).toBe('unknown');
    expect(estimateDiscuss(mid).budgetFit).toBe('unknown');
    expect(budgetFit('lt15k', r.startingLow, r.startingHigh)).toBe(r.startingLow > 15000 ? 'below' : 'within');
    expect(budgetFit('lt15k', 20000, 30000)).toBe('below');
    expect(budgetFit('15-30k', 20000, 30000)).toBe('within');
    expect(budgetFit('60k+', 20000, 30000)).toBe('above');
    expect(budgetFit('60k+', 40000, 90000)).toBe('within');
    expect(budgetFit('30-60k', 10000, 20000)).toBe('above');
    expect(estimateDiscuss({...mid, budget: '60k+'}).budgetFit).toBe('above');
    expect(estimateDiscuss({...mid, budget: 'lt15k'}).budgetFit).toBe('below');
  });
});

describe('discussAnswersSchema', () => {
  it('accepts a full payload and every enum value', () => {
    expect(
      discussAnswersSchema.safeParse({
        purpose: [...PURPOSE_OPTIONS],
        users: USERS_OPTIONS[4],
        today: TODAY_OPTIONS[0],
        integrations: INTEGRATIONS_OPTIONS[2],
        mustHaves: [...MUST_HAVE_OPTIONS],
        timeline: TIMELINE_OPTIONS[1],
        budget: BUDGET_OPTIONS[2],
      }).success,
    ).toBe(true);
  });
  it('is strict and bounded', () => {
    expect(discussAnswersSchema.safeParse({purpose: ['other'], notes: 'free text'}).success).toBe(false);
    expect(discussAnswersSchema.safeParse({purpose: []}).success).toBe(false);
    expect(discussAnswersSchema.safeParse({purpose: ['nope']}).success).toBe(false);
    expect(discussAnswersSchema.safeParse({purpose: Array(20).fill('other')}).success).toBe(false);
    expect(discussAnswersSchema.safeParse({purpose: ['other'], budget: '1m'}).success).toBe(false);
  });
});

describe('discuss i18n keys', () => {
  it('json file is in sync and covers every option', () => {
    expect(keysJson).toEqual(discussI18nKeys());
    for (const p of PURPOSE_OPTIONS) expect(keysJson).toHaveProperty([`discuss.purpose.${p}`]);
    for (const b of BUDGET_OPTIONS) expect(keysJson).toHaveProperty([`discuss.budget.${b}`]);
    expect(keysJson).toHaveProperty(['discuss.q.purpose.title']);
  });
});
