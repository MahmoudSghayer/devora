// Option-card buckets for the guided ROI flow. The UI converts a chosen bucket
// to its representative `value` and sends plain numbers (roiAnswersSchema stays
// numeric). The engine math is unchanged. Documented in docs/automation-roi.md.
//
// i18n: every bucket has `i18nKey = roi.bucket.<group>.<id>`.

import {ROI_CONFIG, ROI_TASKS} from '@/lib/pricing/config';
import type {RoiTaskId} from './types';

export interface Bucket {
  id: string;
  /** representative number the engine receives */
  value: number;
  i18nKey: string;
}

const make = (group: string, rows: readonly (readonly [string, number])[]): readonly Bucket[] =>
  rows.map(([id, value]) => ({id, value, i18nKey: `roi.bucket.${group}.${id}`}));

/** "How many times a day, per person?" */
export const TIMES_PER_DAY_BUCKETS = make('timesPerDay', [
  ['1-5', 3],
  ['6-15', 10],
  ['16-40', 25],
  ['40+', 50],
]);

/** "How long does each one take?" (minutes) */
export const MINUTES_BUCKETS = make('minutes', [
  ['lt2', 1.5],
  ['2-5', 3.5],
  ['5-15', 10],
  ['15-30', 22],
  ['30+', 40],
]);

/** "How many people do this?" */
export const PEOPLE_BUCKETS = make('people', [
  ['1', 1],
  ['2-3', 3],
  ['4-6', 5],
  ['7+', 8],
]);

export interface LaborBand extends Bucket {
  /** shown as the band's i18n label key (same as i18nKey) */
  labelKey: string;
}

const bands = (group: string, rows: readonly (readonly [string, number])[]): readonly LaborBand[] =>
  make(group, rows).map((b) => ({...b, labelKey: b.i18nKey}));

/** Hourly cost of one employee (ILS/hour). Representative = band midpoint. */
export const HOURLY_COST_BANDS = bands('hourly', [
  ['lt40', 30],
  ['40-60', 50],
  ['60-90', 75],
  ['90-150', 120],
  ['150+', 180],
]);

/** Monthly GROSS salary (ILS). Representative = band midpoint. */
export const MONTHLY_SALARY_BANDS = bands('salary', [
  ['lt8k', 7000],
  ['8-12k', 10000],
  ['12-18k', 15000],
  ['18-25k', 21000],
  ['25k+', 30000],
]);

/** "I don't know": the UI sends `labor: {mode: 'unknown'}` (config defaults apply). */
export const LABOR_UNKNOWN = {id: 'unknown', i18nKey: 'roi.bucket.labor.unknown', defaultHourlyCost: ROI_CONFIG.defaultHourlyCost} as const;

/** How standardised is the task? Sets the default automation % (still adjustable). */
export const STANDARDISATION_LEVELS = [
  {id: 'very', delta: 10, i18nKey: 'roi.bucket.standardisation.very'},
  {id: 'mostly', delta: 0, i18nKey: 'roi.bucket.standardisation.mostly'},
  {id: 'varies', delta: -20, i18nKey: 'roi.bucket.standardisation.varies'},
] as const;
export type StandardisationLevel = (typeof STANDARDISATION_LEVELS)[number]['id'];

const AUTOMATION_CAP = 95;
const AUTOMATION_FLOOR = 10;

/** very = catalog default +10 (cap 95); mostly = catalog default; varies = −20 (floor 10). */
export function defaultAutomationPct(taskId: RoiTaskId, level: StandardisationLevel): number {
  const base = ROI_TASKS.find((t) => t.id === taskId)?.defaultAutomationPct ?? 40;
  if (level === 'very') return Math.min(AUTOMATION_CAP, base + 10);
  if (level === 'varies') return Math.max(AUTOMATION_FLOOR, base - 20);
  return base;
}
