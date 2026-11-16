// Public types for the automation ROI calculator. Pure TS, no framework.

import type {CurrencyCode} from '@/lib/pricing/config';

export const ROI_TASK_IDS = [
  'whatsappReplies',
  'repetitiveFaqs',
  'scheduling',
  'reminders',
  'leadFollowUps',
  'spreadsheetEntry',
  'invoices',
  'reports',
  'copyingBetweenSystems',
  'crmUpdates',
  'collectCustomerInfo',
  'sendingEmails',
  'orderProcessing',
  'customerSupport',
  'other',
] as const;
export type RoiTaskId = (typeof ROI_TASK_IDS)[number];

export type AutomationPotential = 'high' | 'medium' | 'low';

export interface RoiTaskDef {
  id: RoiTaskId;
  /** English label (team emails) */
  label: string;
  /** i18n key `roi.task.<id>` */
  labelKey: string;
  /** percent 0–100 of the task's time that automation typically removes */
  defaultAutomationPct: number;
  defaultTimesPerDay: number;
  defaultMinutes: number;
  potential: AutomationPotential;
  /** i18n key explaining the potential, `roi.why.<id>` */
  whyKey: string;
}

export type {RoiAnswers} from './schema';

export interface RoiTaskRow {
  taskId: RoiTaskId;
  label: string;
  /** team-wide hours per working day: times × minutes × employees ÷ 60 */
  hoursPerDay: number;
  monthlyHours: number;
  savedHours: number;
  monthlyValue: number;
}

export interface RoiAssumptions {
  laborMode: 'hourly' | 'salary' | 'unknown';
  hourlyCost: number;
  workingDays: number;
  directShare: number;
  employerCostMultiplier: number | null;
  hoursPerMonthFte: number;
  implementationBase: number;
  implementationPerTask: number;
  runningBase: number;
  runningPerTask: number;
}

export interface RoiResult {
  rows: RoiTaskRow[];
  /** number of task types with automation > 0 */
  automatedTasks: number;
  hoursPerDay: number;
  monthlyHours: number;
  savedHoursMonthly: number;
  savedHoursAnnual: number;
  savedHoursPerDay: number;
  /** value of the freed capacity per month */
  capacityValueMonthly: number;
  /** share of capacity value that becomes real cost reduction */
  directReductionMonthly: number;
  /** remainder: growth / productivity value */
  productivityValueMonthly: number;
  fteEquivalent: number;
  /** capacity ×12 */
  annualValue: number;
  /** direct reduction ×12 */
  annualDirect: number;
  implementationCost: number;
  runningMonthly: number;
  paybackMonthsDirect: number | null;
  paybackMonthsCapacity: number | null;
  roi12Direct: number | null;
  roi12Capacity: number | null;
  assumptions: RoiAssumptions;
  currency: CurrencyCode;
  configVersion: string;
}

export interface RoiConfig {
  configVersion: string;
  currency: CurrencyCode;
  defaultHourlyCost: number;
  defaultEmployerCostMultiplier: number;
  defaultWorkingDays: number;
  defaultDirectShare: number;
  /** working hours per month of one full-time employee */
  hoursPerMonthFte: number;
  implementation: {base: number; perTask: number};
  running: {base: number; perTask: number};
}
