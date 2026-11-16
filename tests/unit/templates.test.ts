import {describe, expect, it} from 'vitest';
import {
  automationRoiEmail,
  contactEmail,
  esc,
  leadEmail,
  softwareDiscoveryEmail,
  websiteEstimateEmail,
} from '@/lib/email/templates';
import {
  DESIGN_FLAGS,
  DESIGN_LABEL,
  FEATURE_LABEL,
  GOAL_LABEL,
  INTEGRATION_LABEL,
  PRODUCT_LABEL,
  ROI_TASK_LABEL,
  ROLE_LABEL,
  SIZE_LABEL,
  TYPE_LABEL,
} from '@/lib/leads/answerLabels';
import {
  BUDGET_LABEL,
  INTEGRATIONS_LABEL,
  MUST_HAVE_LABEL,
  PURPOSE_LABEL,
  TIMELINE_LABEL,
  TODAY_LABEL,
  USERS_LABEL,
} from '@/lib/leads/discussLabels';
import {
  FEATURE_IDS,
  GOAL_IDS,
  INTEGRATION_IDS,
  PRODUCT_BUCKETS,
  PROJECT_TYPES,
  ROLE_BUCKETS,
  SIZE_IDS,
} from '@/lib/estimator/types';
import {ROI_TASK_IDS} from '@/lib/roi/types';
import {
  BUDGET_OPTIONS,
  INTEGRATIONS_OPTIONS,
  MUST_HAVE_OPTIONS,
  PURPOSE_OPTIONS,
  TIMELINE_OPTIONS,
  TODAY_OPTIONS,
  USERS_OPTIONS,
} from '@/lib/discuss/types';
import {estimateProject} from '@/lib/estimator/engine';
import {computeRoi} from '@/lib/roi/engine';
import {estimateDiscuss} from '@/lib/discuss/engine';

const base = {
  leadRef: 'DV-2611-7KQ4',
  locale: 'en',
  submittedAt: '2026-11-15T10:00:00.000Z',
  contact: {
    name: 'Dana "<b>Boss</b>" O\'Neil',
    businessName: 'Acme & Sons',
    email: 'dana@example.com',
    phone: '+972500000000',
    notes: '<script>alert(1)</script>',
    preferredContact: 'email',
  },
  timeline: [
    {step: 'types', tsMs: 1000},
    {step: 'contact', tsMs: 9000},
  ],
};

describe('esc', () => {
  it('escapes HTML and both quote kinds', () => {
    expect(esc(`<a href="x" title='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;'
    );
  });
});

describe('calculator emails', () => {
  const estimate = websiteEstimateEmail({
    ...base,
    answers: {types: ['business'], pages: 6, features: ['blog']},
    result: estimateProject({types: ['business'], pages: 6, features: ['blog']}),
  });
  const roiAnswers = {
    tasks: [{taskId: 'invoices' as const, timesPerDay: 5, minutesEach: 10, employees: 2, automationPct: 70}],
  };
  const roi = automationRoiEmail({...base, answers: roiAnswers, result: computeRoi(roiAnswers)});

  it.each([
    ['estimate', estimate],
    ['roi', roi],
  ])('%s email carries the lead ref, reply-to and escaped HTML', (_n, mail) => {
    expect(mail.subject).toContain('DV-2611-7KQ4');
    expect(mail.replyTo).toBe('dana@example.com');
    expect(mail.text).toContain('DV-2611-7KQ4');
    expect(mail.html).toContain('DV-2611-7KQ4');
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).not.toContain('<b>Boss</b>');
    expect(mail.html).toContain('&lt;script&gt;');
    expect(mail.html).toContain('&quot;');
    expect(mail.html).toContain('&#39;');
    expect(mail.html).toContain('Acme &amp; Sons');
  });

  it('estimate email has range subject, breakdown and timeline', () => {
    expect(estimate.subject).toMatch(/^\[Estimate DV-2611-7KQ4\] .* — ₪[\d,]+–₪[\d,]+$/);
    expect(estimate.text).toContain('BREAKDOWN');
    expect(estimate.text).toContain('weeks');
    expect(estimate.text).toContain('Maintenance');
  });

  it('roi email has per-task table, payback and assumptions', () => {
    expect(roi.subject).toMatch(/^\[ROI DV-2611-7KQ4\]/);
    expect(roi.text).toContain('PER TASK');
    expect(roi.text).toContain('Payback');
    expect(roi.text).toContain('ASSUMPTIONS');
    expect(roi.html).toContain('<table');
  });

  it('contact email works too', () => {
    const m = contactEmail({...base, message: 'Hi "there"', budget: '10k'});
    expect(m.replyTo).toBe('dana@example.com');
    expect(m.subject).toContain('DV-2611-7KQ4');
    expect(m.html).toContain('Hi &quot;there&quot;');
  });
});

describe('software discovery email', () => {
  const answers = {
    purpose: ['replace-spreadsheets' as const, 'ai-tool' as const],
    users: 'team-2-10' as const,
    mustHaves: ['auth-roles' as const, 'bilingual' as const],
    timeline: '1-3m' as const,
    budget: '3-7k' as const,
  };
  const result = estimateDiscuss(answers);
  const mail = softwareDiscoveryEmail({
    ...base,
    contact: {...base.contact, notes: 'We need <b>this</b> by "Q1" & more'},
    answers,
    result,
  });

  it('has the [Discuss ref] subject with the starting range and replies to the visitor', () => {
    expect(mail.subject).toMatch(/^\[Discuss DV-2611-7KQ4\] .* — ₪[\d,]+–₪[\d,]+$/);
    expect(mail.replyTo).toBe('dana@example.com');
  });

  it('lists human-readable options, range, fit, weeks, maintenance and assumptions', () => {
    expect(mail.text).toContain('Replace spreadsheets and manual processes');
    expect(mail.text).toContain('Bilingual (Arabic / English)');
    expect(mail.text).toContain('1–3 months');
    expect(mail.text).toContain('Budget fit:');
    expect(mail.text).toContain('weeks');
    expect(mail.text).toContain('Maintenance:');
    expect(mail.text).toContain('ASSUMPTIONS');
    expect(mail.text).toContain(result.assumptions[0]!);
    expect(mail.text).not.toContain('ANSWERS (raw)');
    expect(mail.html).toContain('Answers');
  });

  it('renders the free text prominently and escaped', () => {
    expect(mail.text).toContain('We need <b>this</b> by "Q1" & more');
    expect(mail.html).toContain('We need &lt;b&gt;this&lt;/b&gt; by &quot;Q1&quot; &amp; more');
    expect(mail.html).not.toContain('<b>this</b>');
    expect(mail.html.indexOf('Anything else we should know')).toBeLessThan(
      mail.html.indexOf('Indicative starting range')
    );
  });
});

describe('free-text notes appear in every calculator + contact email', () => {
  const notes = 'NOTE-MARKER-123';
  const c = {...base, contact: {...base.contact, notes}};
  const roiA = {
    tasks: [{taskId: 'invoices' as const, timesPerDay: 5, minutesEach: 10, employees: 2, automationPct: 70}],
  };
  it.each([
    ['estimate', websiteEstimateEmail({...c, answers: {types: ['business']}, result: estimateProject({types: ['business']})})],
    ['roi', automationRoiEmail({...c, answers: roiA, result: computeRoi(roiA)})],
    ['contact', contactEmail({...c, message: 'm'})],
  ])('%s', (_n, m) => {
    expect(m.text).toContain(notes);
    expect(m.html).toContain(notes);
  });
});

describe('legacy lead email', () => {
  it('has no package line; shows "Interested in" only when non-empty', () => {
    const withText = leadEmail({
      name: 'A',
      email: 'a@b.co',
      request: 'r',
      recommendedPackage: 'a custom portal',
      locale: 'en',
      history: [],
    });
    expect(withText.text).toContain('Interested in: a custom portal');
    expect(withText.text).not.toMatch(/package|Launch|Studio|Growth/i);
    const without = leadEmail({name: 'A', email: 'a@b.co', request: 'r', locale: 'en', history: []});
    expect(without.text).not.toContain('Interested in');
    expect(without.html).not.toContain('Interested in');
  });
});

// ── Answers completeness: readable labels, no raw ids ───────────────────────

const plain = (html: string) => html.replace(/<[^>]*>/g, ' ');
/** camelCase, snake_case and kebab-case/digit ids that must never reach a reader. */
const RAW_ID = /\b[a-z]+[A-Z][A-Za-z]*\b|\b[a-z0-9]+_[a-z0-9_]+\b|\b(?:replace-spreadsheets|run-operations|customer-portal|internal-dashboard|ai-tool|connect-tools|team-\d|auth-roles|ai-assistant|disconnected-tools|one-two|lt-1m|\d-\d+m|lt15k|\d+-\d+k)\b/;

function expectReadable(mail: {text: string; html: string}, labels: string[]) {
  for (const l of labels) {
    expect(l, 'label must be non-empty').toBeTruthy();
    expect(mail.text).toContain(l);
    expect(plain(mail.html)).toContain(l.replace(/&/g, '&amp;'));
  }
  expect(mail.text).not.toMatch(RAW_ID);
  expect(plain(mail.html)).not.toMatch(RAW_ID);
}

describe('label maps cover every option id', () => {
  const cases: [string, readonly string[], Record<string, string>][] = [
    ['goals', GOAL_IDS, GOAL_LABEL],
    ['sizes', SIZE_IDS, SIZE_LABEL],
    ['types', PROJECT_TYPES, TYPE_LABEL],
    ['products', PRODUCT_BUCKETS, PRODUCT_LABEL],
    ['roles', ROLE_BUCKETS, ROLE_LABEL],
    ['features', FEATURE_IDS, FEATURE_LABEL],
    ['integrations', INTEGRATION_IDS, INTEGRATION_LABEL],
    ['design', DESIGN_FLAGS, DESIGN_LABEL],
    ['roi tasks', ROI_TASK_IDS, ROI_TASK_LABEL],
    ['purpose', PURPOSE_OPTIONS, PURPOSE_LABEL],
    ['users', USERS_OPTIONS, USERS_LABEL],
    ['today', TODAY_OPTIONS, TODAY_LABEL],
    ['discuss integrations', INTEGRATIONS_OPTIONS, INTEGRATIONS_LABEL],
    ['must-haves', MUST_HAVE_OPTIONS, MUST_HAVE_LABEL],
    ['timeline', TIMELINE_OPTIONS, TIMELINE_LABEL],
    ['budget', BUDGET_OPTIONS, BUDGET_LABEL],
  ];
  it.each(cases)('%s', (_n, ids, map) => {
    for (const id of ids) {
      expect(map[id], `missing label for "${id}"`).toBeTruthy();
      expect(map[id]).not.toBe(id);
    }
    expect(Object.keys(map).sort()).toEqual([...ids].sort());
  });
});

describe('rich-sample emails render every answer readably', () => {
  it('estimate', () => {
    const answers = {
      types: ['business' as const, 'ecommerce' as const, 'webapp' as const],
      goals: ['leads' as const, 'sell' as const],
      size: 'medium' as const,
      pages: 12,
      productBucket: 'p21_100' as const,
      rolesBucket: 'few' as const,
      features: ['advancedSeo' as const, 'leadForm' as const, 'orderTracking' as const, 'aiFeatures' as const],
      integrations: ['whatsapp' as const, 'emailAutomation' as const, 'crm' as const],
      design: {existing: true, brandIdentity: true, advancedMotion: true, premium: true},
      problem: 'We lose leads after hours',
    };
    const mail = websiteEstimateEmail({...base, answers, result: estimateProject(answers)});
    expectReadable(mail, [
      ...answers.goals.map((g) => GOAL_LABEL[g]),
      SIZE_LABEL.medium,
      ...answers.types.map((t) => TYPE_LABEL[t]),
      '12 pages',
      PRODUCT_LABEL.p21_100,
      ROLE_LABEL.few,
      ...answers.features.map((f) => FEATURE_LABEL[f]),
      ...answers.integrations.map((i) => INTEGRATION_LABEL[i]),
      ...DESIGN_FLAGS.map((k) => DESIGN_LABEL[k]),
      'We lose leads after hours',
    ]);
  });

  it('roi', () => {
    const answers = {
      tasks: ROI_TASK_IDS.slice(0, 4).map((taskId, i) => ({
        taskId,
        timesPerDay: 3 + i,
        minutesEach: 10,
        employees: 2,
        automationPct: 60 + i,
      })),
      labor: {mode: 'salary' as const, monthlyGross: 12000, employerCostMultiplier: 1.3},
      workingDays: 22,
      directShare: 0.4,
    };
    const mail = automationRoiEmail({...base, answers, result: computeRoi(answers)});
    expectReadable(mail, [
      ...answers.tasks.map((t) => ROI_TASK_LABEL[t.taskId]),
      'Monthly gross salary',
      '× 1.3 employer cost',
      '22',
      '40%',
      '61%',
    ]);
  });

  it('discuss', () => {
    const answers = {
      purpose: [...PURPOSE_OPTIONS],
      users: 'team-and-customers' as const,
      today: 'off-the-shelf' as const,
      integrations: 'one-two' as const,
      mustHaves: [...MUST_HAVE_OPTIONS],
      timeline: 'lt-1m' as const,
      budget: '3-7k' as const,
    };
    const mail = softwareDiscoveryEmail({...base, answers, result: estimateDiscuss(answers)});
    expectReadable(mail, [
      ...PURPOSE_OPTIONS.map((v) => PURPOSE_LABEL[v]),
      USERS_LABEL['team-and-customers'],
      TODAY_LABEL['off-the-shelf'],
      INTEGRATIONS_LABEL['one-two'],
      ...MUST_HAVE_OPTIONS.map((v) => MUST_HAVE_LABEL[v]),
      TIMELINE_LABEL['lt-1m'],
      BUDGET_LABEL['3-7k'],
    ]);
  });
});
