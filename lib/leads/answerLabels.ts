import {ESTIMATOR_CONFIG, ROI_TASKS, formatMoney} from '@/lib/pricing/config';
import {estimatorI18nKeys} from '@/lib/estimator/questions';
import {
  FEATURE_IDS,
  GOAL_IDS,
  INTEGRATION_IDS,
  PRODUCT_BUCKETS,
  PROJECT_TYPES,
  ROLE_BUCKETS,
  SIZE_IDS,
  type FeatureId,
  type Goal,
  type IntegrationId,
  type ProductBucket,
  type ProjectType,
  type RoleBucket,
  type SizeId,
} from '@/lib/estimator/types';
import type {EstimatorAnswers} from '@/lib/estimator/schema';
import {ROI_TASK_IDS, type RoiTaskId} from '@/lib/roi/types';
import type {RoiAnswers} from '@/lib/roi/schema';
import type {DiscussAnswers} from '@/lib/discuss/schema';
import {
  BUDGET_LABEL,
  INTEGRATIONS_LABEL,
  MUST_HAVE_LABEL,
  PURPOSE_LABEL,
  TIMELINE_LABEL,
  TODAY_LABEL,
  USERS_LABEL,
} from './discussLabels';

// English labels for every calculator answer, used by the team emails and the
// admin UI. Everything is derived from the engine config / option arrays (no
// string is repeated here). Pure module: safe in client components.

const I18N = estimatorI18nKeys();
const fromEntries = <K extends string>(ids: readonly K[], f: (id: K) => string) =>
  Object.fromEntries(ids.map((id) => [id, f(id)])) as Record<K, string>;

const cfg = ESTIMATOR_CONFIG;

export const GOAL_LABEL: Record<Goal, string> = fromEntries(GOAL_IDS, (id) => I18N[`estimator.goal.${id}`] ?? '');
export const SIZE_LABEL: Record<SizeId, string> = fromEntries(SIZE_IDS, (id) => I18N[`estimator.size.${id}`] ?? '');
export const TYPE_LABEL: Record<ProjectType, string> = fromEntries(PROJECT_TYPES, (id) => cfg.projectBase[id].label);
export const PRODUCT_LABEL: Record<ProductBucket, string> = fromEntries(PRODUCT_BUCKETS, (id) => cfg.products[id].label);
export const ROLE_LABEL: Record<RoleBucket, string> = fromEntries(ROLE_BUCKETS, (id) => cfg.roles[id].label);
export const FEATURE_LABEL: Record<FeatureId, string> = fromEntries(FEATURE_IDS, (id) => cfg.features[id].label);
export const INTEGRATION_LABEL: Record<IntegrationId, string> = fromEntries(INTEGRATION_IDS, (id) =>
  id in cfg.integrations ? cfg.integrations[id as keyof typeof cfg.integrations].label : cfg.features[id as FeatureId].label
);
export const DESIGN_LABEL: Record<DesignFlag, string> = {
  existing: I18N['estimator.q.design.existing.label'] ?? '',
  brandIdentity: I18N['estimator.q.design.brandIdentity.label'] ?? '',
  advancedMotion: I18N['estimator.q.design.advancedMotion.label'] ?? '',
  premium: I18N['estimator.q.design.premium.label'] ?? '',
};
export type DesignFlag = 'existing' | 'brandIdentity' | 'advancedMotion' | 'premium';
export const DESIGN_FLAGS = Object.keys(DESIGN_LABEL) as DesignFlag[];

export const ROI_TASK_LABEL: Record<RoiTaskId, string> = fromEntries(
  ROI_TASK_IDS,
  (id) => ROI_TASKS.find((t) => t.id === id)?.label ?? ''
);

export type Pair = [label: string, value: string];

const NONE = '—';
const join = (xs: readonly string[]) => (xs.length ? xs.join(', ') : NONE);
const n = (v: number, d = 1) => new Intl.NumberFormat('en-US', {maximumFractionDigits: d}).format(v);

export function estimatorAnswerPairs(a: EstimatorAnswers): Pair[] {
  const design = DESIGN_FLAGS.filter((k) => a.design?.[k]).map((k) => DESIGN_LABEL[k]);
  return [
    ['Goals', join((a.goals ?? []).map((g) => GOAL_LABEL[g]))],
    ['Site size', a.size ? SIZE_LABEL[a.size] : NONE],
    ['Project types', join(a.types.map((t) => TYPE_LABEL[t]))],
    ['Pages', a.pages != null ? `${a.pages} pages` : NONE],
    ['Product catalogue', a.productBucket ? PRODUCT_LABEL[a.productBucket] : NONE],
    ['User roles', a.rolesBucket ? ROLE_LABEL[a.rolesBucket] : NONE],
    ['Features', join((a.features ?? []).map((f) => FEATURE_LABEL[f]))],
    ['Integrations', join((a.integrations ?? []).map((i) => INTEGRATION_LABEL[i]))],
    ['Design', join(design)],
    ['Problem (visitor)', a.problem || NONE],
  ];
}

export function roiLaborPairs(a: RoiAnswers, currency?: string): Pair[] {
  const m = (v: number) => formatMoney(v, 'en', currency ? {currency: currency as 'ILS'} : {});
  const l = a.labor;
  let labour = 'Not provided';
  if (l?.mode === 'hourly') labour = `Hourly cost ${m(l.hourlyCost)}`;
  else if (l?.mode === 'salary')
    labour = `Monthly gross salary ${m(l.monthlyGross)}${l.employerCostMultiplier ? ` × ${l.employerCostMultiplier} employer cost` : ''}`;
  else if (l?.mode === 'unknown') labour = 'Unknown (configured default used)';
  return [
    ['Labour cost input', labour],
    ['Working days / month (override)', a.workingDays != null ? n(a.workingDays, 0) : NONE],
    ['Direct cost-reduction share (override)', a.directShare != null ? `${n(a.directShare * 100, 0)}%` : NONE],
  ];
}

export const ROI_ANSWER_HEAD = ['Task', 'Times/day each', 'Min each', 'People', 'Automation %'];
export function roiAnswerRows(a: RoiAnswers): string[][] {
  return a.tasks.map((t) => [
    ROI_TASK_LABEL[t.taskId],
    n(t.timesPerDay),
    n(t.minutesEach),
    String(t.employees),
    `${n(t.automationPct, 0)}%`,
  ]);
}

export function discussAnswerPairs(a: DiscussAnswers): Pair[] {
  return [
    ['What it is for', join(a.purpose.map((v) => PURPOSE_LABEL[v]))],
    ['Who will use it', a.users ? USERS_LABEL[a.users] : NONE],
    ['How they work today', a.today ? TODAY_LABEL[a.today] : NONE],
    ['Integrations', a.integrations ? INTEGRATIONS_LABEL[a.integrations] : NONE],
    ['Must-haves', join((a.mustHaves ?? []).map((v) => MUST_HAVE_LABEL[v]))],
    ['Timeline', a.timeline ? TIMELINE_LABEL[a.timeline] : NONE],
    ['Budget', a.budget ? BUDGET_LABEL[a.budget] : NONE],
  ];
}
