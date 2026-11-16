import {describe, expect, it} from 'vitest';
import {ROI_CONFIG, ROI_TASKS} from '@/lib/pricing/config';
import {HOURS_PER_MONTH_FTE, computeRoi} from './engine';
import {roiAnswersSchema, type RoiAnswers} from './schema';

const task = (o: Partial<RoiAnswers['tasks'][number]> = {}): RoiAnswers['tasks'][number] => ({
  taskId: 'whatsappReplies',
  timesPerDay: 4,
  minutesEach: 30,
  employees: 3,
  automationPct: 70,
  ...o,
});
const hourly = {mode: 'hourly', hourlyCost: 60} as const;

describe('computeRoi: the canonical example', () => {
  const r = computeRoi({tasks: [task()], labor: hourly});
  it('matches the hand calculation exactly', () => {
    expect(r.hoursPerDay).toBe(6);
    expect(r.monthlyHours).toBe(132);
    expect(r.savedHoursMonthly).toBeCloseTo(92.4, 9);
    expect(r.capacityValueMonthly).toBeCloseTo(5544, 9);
    expect(r.annualValue).toBeCloseTo(66528, 9);
    expect(r.savedHoursAnnual).toBeCloseTo(1108.8, 9);
    expect(r.savedHoursPerDay).toBeCloseTo(4.2, 9);
    expect(r.fteEquivalent).toBeCloseTo(92.4 / 182, 9);
    expect(HOURS_PER_MONTH_FTE).toBe(182);
  });
  it('splits direct vs productivity (20% default)', () => {
    expect(r.directReductionMonthly).toBeCloseTo(1108.8, 9);
    expect(r.productivityValueMonthly).toBeCloseTo(4435.2, 9);
    expect(r.annualDirect).toBeCloseTo(13305.6, 9);
  });
  it('costs, payback and ROI follow the config', () => {
    expect(r.implementationCost).toBe(1100 + 650);
    expect(r.runningMonthly).toBe(90 + 30);
    expect(r.paybackMonthsCapacity).toBeCloseTo(1750 / (5544 - 120), 9);
    expect(r.paybackMonthsDirect).toBeCloseTo(1750 / (1108.8 - 120), 9);
    expect(r.roi12Capacity).toBeCloseTo((12 * 5544 - 12 * 120 - 1750) / (1750 + 12 * 120), 9);
    expect(r.roi12Direct).toBeCloseTo((12 * 1108.8 - 12 * 120 - 1750) / (1750 + 12 * 120), 9);
    expect(r.rows[0]).toMatchObject({taskId: 'whatsappReplies', label: 'WhatsApp replies', hoursPerDay: 6});
  });
  it('is JSON-serializable', () => {
    expect(JSON.parse(JSON.stringify(r))).toEqual(r);
  });
});

describe('computeRoi: edge cases', () => {
  it('zero tasks gives zeros and no costs', () => {
    const r = computeRoi({tasks: []});
    expect(r.capacityValueMonthly).toBe(0);
    expect(r.implementationCost).toBe(0);
    expect(r.runningMonthly).toBe(0);
    expect(r.paybackMonthsCapacity).toBeNull();
    expect(r.roi12Capacity).toBeNull();
  });
  it('zero employees yields no savings and null payback', () => {
    const r = computeRoi({tasks: [task({employees: 0})], labor: hourly});
    expect(r.savedHoursMonthly).toBe(0);
    expect(r.paybackMonthsDirect).toBeNull();
    expect(r.paybackMonthsCapacity).toBeNull();
    expect(r.roi12Capacity).toBeNull(); // nothing is automated, so nothing is spent either
    expect(r.implementationCost).toBe(0);
  });
  it('0% automation: saves nothing and does not count as an automated task', () => {
    const r = computeRoi({tasks: [task({automationPct: 0})], labor: hourly});
    expect(r.savedHoursMonthly).toBe(0);
    expect(r.automatedTasks).toBe(0);
    expect(r.implementationCost).toBe(0);
  });
  it('100% automation saves all hours', () => {
    const r = computeRoi({tasks: [task({automationPct: 100})], labor: hourly});
    expect(r.savedHoursMonthly).toBe(132);
    expect(r.capacityValueMonthly).toBe(7920);
  });
  it('null payback when direct benefit does not cover running cost', () => {
    // 1 employee: 1848 capacity; 20% direct = 369.6 > 120 running, so direct payback exists
    const paying = computeRoi({tasks: [task({employees: 1})], labor: hourly});
    expect(paying.paybackMonthsDirect).toBeCloseTo(1750 / (369.6 - 120), 9);
    // 5% direct share = 92.4 < 120 running: direct never pays back, capacity does
    const r = computeRoi({tasks: [task({employees: 1})], labor: hourly, directShare: 0.05});
    expect(r.paybackMonthsDirect).toBeNull();
    expect(r.paybackMonthsCapacity).toBeCloseTo(1750 / (1848 - 120), 9);
  });
  it('salary mode: gross × 1.25 ÷ 182', () => {
    const r = computeRoi({tasks: [task()], labor: {mode: 'salary', monthlyGross: 10000}});
    expect(r.assumptions.hourlyCost).toBeCloseTo((10000 * 1.25) / 182, 9);
    expect(r.assumptions.employerCostMultiplier).toBe(1.25);
    expect(r.capacityValueMonthly).toBeCloseTo(92.4 * ((10000 * 1.25) / 182), 9);
  });
  it('salary mode honours a custom multiplier', () => {
    const r = computeRoi({tasks: [task()], labor: {mode: 'salary', monthlyGross: 9100, employerCostMultiplier: 1.4}});
    expect(r.assumptions.hourlyCost).toBeCloseTo(70, 9);
  });
  it("'I don't know' and missing labor use the defaults", () => {
    expect(computeRoi({tasks: [], labor: {mode: 'unknown'}}).assumptions.hourlyCost).toBe(ROI_CONFIG.defaultHourlyCost);
    expect(computeRoi({tasks: []}).assumptions).toMatchObject({hourlyCost: 60, workingDays: 22, directShare: 0.2});
  });
  it('sums multiple tasks and counts implementation per automated task', () => {
    const r = computeRoi({
      tasks: [task(), task({taskId: 'reminders', timesPerDay: 6, minutesEach: 10, employees: 2, automationPct: 90})],
      labor: hourly,
    });
    const second = (6 * 10 * 2) / 60; // 2 h/day
    expect(r.hoursPerDay).toBeCloseTo(6 + second, 9);
    expect(r.savedHoursMonthly).toBeCloseTo(92.4 + second * 22 * 0.9, 9);
    expect(r.rows).toHaveLength(2);
    expect(r.automatedTasks).toBe(2);
    expect(r.implementationCost).toBe(1100 + 2 * 650);
    expect(r.runningMonthly).toBe(90 + 2 * 30);
  });
  it('directShare 0 and 1', () => {
    const zero = computeRoi({tasks: [task()], labor: hourly, directShare: 0});
    expect(zero.directReductionMonthly).toBe(0);
    expect(zero.paybackMonthsDirect).toBeNull();
    const one = computeRoi({tasks: [task()], labor: hourly, directShare: 1});
    expect(one.directReductionMonthly).toBeCloseTo(one.capacityValueMonthly, 9);
    expect(one.productivityValueMonthly).toBeCloseTo(0, 9);
  });
  it('custom working days', () => {
    expect(computeRoi({tasks: [task()], labor: hourly, workingDays: 20}).monthlyHours).toBe(120);
  });
});

describe('ROI_TASKS catalog', () => {
  it('has the specified default automation percentages', () => {
    const pct = Object.fromEntries(ROI_TASKS.map((t) => [t.id, t.defaultAutomationPct]));
    expect(pct).toEqual({
      whatsappReplies: 70, repetitiveFaqs: 80, scheduling: 75, reminders: 90, leadFollowUps: 65,
      spreadsheetEntry: 70, invoices: 60, reports: 75, copyingBetweenSystems: 85, crmUpdates: 70,
      collectCustomerInfo: 75, sendingEmails: 70, orderProcessing: 55, customerSupport: 45, other: 40,
    });
    for (const t of ROI_TASKS) {
      expect(t.labelKey).toBe(`roi.task.${t.id}`);
      expect(['high', 'medium', 'low']).toContain(t.potential);
    }
  });
});

describe('roiAnswersSchema', () => {
  it('accepts valid and rejects unknown keys / bad bounds', () => {
    expect(roiAnswersSchema.safeParse({tasks: [task()], labor: hourly}).success).toBe(true);
    expect(roiAnswersSchema.safeParse({tasks: [], x: 1}).success).toBe(false);
    expect(roiAnswersSchema.safeParse({tasks: [{...task(), extra: 1}]}).success).toBe(false);
    expect(roiAnswersSchema.safeParse({tasks: [task({automationPct: 101})]}).success).toBe(false);
    expect(roiAnswersSchema.safeParse({tasks: [task({employees: -1})]}).success).toBe(false);
    expect(roiAnswersSchema.safeParse({tasks: [task({employees: 1.5})]}).success).toBe(false);
    expect(roiAnswersSchema.safeParse({tasks: [task({taskId: 'nope' as never})]}).success).toBe(false);
    expect(roiAnswersSchema.safeParse({tasks: [], directShare: 1.1}).success).toBe(false);
    expect(roiAnswersSchema.safeParse({tasks: [], labor: {mode: 'salary', monthlyGross: 1, hourlyCost: 1}}).success).toBe(false);
    expect(roiAnswersSchema.safeParse({tasks: Array(16).fill(task())}).success).toBe(false);
  });
  it('rejects duplicate task ids', () => {
    expect(roiAnswersSchema.safeParse({tasks: [task(), task()]}).success).toBe(false);
  });
});
