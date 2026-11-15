import {describe, expect, it} from 'vitest';
import {ROI_TASKS} from '@/lib/pricing/config';
import {computeRoi} from './engine';
import {
  HOURLY_COST_BANDS,
  MINUTES_BUCKETS,
  MONTHLY_SALARY_BANDS,
  PEOPLE_BUCKETS,
  STANDARDISATION_LEVELS,
  TIMES_PER_DAY_BUCKETS,
  defaultAutomationPct,
} from './buckets';
import {roiAnswersSchema} from './schema';

const val = (bs: readonly {id: string; value: number}[], id: string) => bs.find((b) => b.id === id)!.value;

describe('roi buckets', () => {
  it('maps to the documented representative numbers', () => {
    expect(TIMES_PER_DAY_BUCKETS.map((b) => b.value)).toEqual([3, 10, 25, 50]);
    expect(MINUTES_BUCKETS.map((b) => b.value)).toEqual([1.5, 3.5, 10, 22, 40]);
    expect(PEOPLE_BUCKETS.map((b) => b.value)).toEqual([1, 3, 5, 8]);
  });
  it('every bucket and band has a roi.bucket.<group>.<id> key and ascending values', () => {
    for (const set of [TIMES_PER_DAY_BUCKETS, MINUTES_BUCKETS, PEOPLE_BUCKETS, HOURLY_COST_BANDS, MONTHLY_SALARY_BANDS]) {
      for (const b of set) expect(b.i18nKey).toMatch(new RegExp(`^roi\\.bucket\\.[A-Za-z]+\\.${b.id.replace(/[+]/g, '\\+')}$`));
      const vs = set.map((b) => b.value);
      expect([...vs].sort((a, b) => a - b)).toEqual(vs);
    }
    for (const b of HOURLY_COST_BANDS) expect(b.labelKey).toBe(b.i18nKey);
  });
  it('standardisation sets the default automation % (+10 cap 95, 0, -20 floor 10)', () => {
    expect(STANDARDISATION_LEVELS.map((l) => l.id)).toEqual(['very', 'mostly', 'varies']);
    expect(defaultAutomationPct('whatsappReplies', 'mostly')).toBe(70);
    expect(defaultAutomationPct('whatsappReplies', 'very')).toBe(80);
    expect(defaultAutomationPct('whatsappReplies', 'varies')).toBe(50);
    expect(defaultAutomationPct('reminders', 'very')).toBe(95);
    expect(defaultAutomationPct('other', 'varies')).toBe(20);
    for (const t of ROI_TASKS) {
      for (const l of ['very', 'mostly', 'varies'] as const) {
        const p = defaultAutomationPct(t.id, l);
        expect(p).toBeGreaterThanOrEqual(10);
        expect(p).toBeLessThanOrEqual(95);
      }
    }
  });
  it('a bucket-driven scenario reproduces hand-computed numbers', () => {
    // WhatsApp replies: 6-15/day (10) x 2-5 min (3.5) x 2-3 people (3), 70% ('mostly'), hourly band 60-90 (75)
    const answers = {
      tasks: [
        {
          taskId: 'whatsappReplies' as const,
          timesPerDay: val(TIMES_PER_DAY_BUCKETS, '6-15'),
          minutesEach: val(MINUTES_BUCKETS, '2-5'),
          employees: val(PEOPLE_BUCKETS, '2-3'),
          automationPct: defaultAutomationPct('whatsappReplies', 'mostly'),
        },
      ],
      labor: {mode: 'hourly' as const, hourlyCost: val(HOURLY_COST_BANDS, '60-90')},
    };
    expect(roiAnswersSchema.safeParse(answers).success).toBe(true);
    const r = computeRoi(answers);
    // 10 x 3.5 x 3 / 60 = 1.75 h/day; x22 = 38.5 h/month; x70% = 26.95 h saved; x 75 = 2021.25
    expect(r.hoursPerDay).toBeCloseTo(1.75, 10);
    expect(r.monthlyHours).toBeCloseTo(38.5, 10);
    expect(r.savedHoursMonthly).toBeCloseTo(26.95, 10);
    expect(r.capacityValueMonthly).toBeCloseTo(2021.25, 6);
  });
  it('salary band feeds the salary mode (10000 x 1.25 / 182)', () => {
    const r = computeRoi({
      tasks: [{taskId: 'reports', timesPerDay: 1, minutesEach: 60, employees: 1, automationPct: 100}],
      labor: {mode: 'salary', monthlyGross: val(MONTHLY_SALARY_BANDS, '8-12k')},
    });
    expect(r.assumptions.hourlyCost).toBeCloseTo((10000 * 1.25) / 182, 10);
  });
});
