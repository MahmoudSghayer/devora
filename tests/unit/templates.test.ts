import {describe, expect, it} from 'vitest';
import {
  automationRoiEmail,
  contactEmail,
  esc,
  leadEmail,
  websiteEstimateEmail,
} from '@/lib/email/templates';
import {estimateProject} from '@/lib/estimator/engine';
import {computeRoi} from '@/lib/roi/engine';
import {tierLine} from '@/lib/pricing/config';

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

describe('legacy lead email', () => {
  it('uses config-driven tier prices (no hardcoded USD)', () => {
    const m = leadEmail({
      name: 'A',
      email: 'a@b.co',
      request: 'r',
      recommendedPackage: 'studio',
      locale: 'en',
      history: [],
    });
    expect(m.text).toContain(tierLine('studio'));
    expect(m.text).not.toContain('$');
  });
});
