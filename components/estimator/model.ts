// State model for the estimator island: pure types, reducer and helpers.
// No React, no I/O — everything here is unit-testable.

import {ESTIMATOR_CONFIG} from '@/lib/pricing/config';
import {visibleQuestions, type Question, type QuestionOption} from '@/lib/estimator/questions';
import type {EstimatorAnswers} from '@/lib/estimator/schema';
import {
  FEATURE_IDS,
  INTEGRATION_IDS,
  PRODUCT_BUCKETS,
  PROJECT_TYPES,
  ROLE_BUCKETS,
  SHARED_IDS,
  type FeatureId,
  type IntegrationId,
  type ProductBucket,
  type ProjectType,
  type RoleBucket,
} from '@/lib/estimator/types';

export const STEP_COUNT = 7;
export const PAGE_CHOICES = [5, 8, 12, 20, 30] as const;
export const PROBLEM_MAX = 1500;
export const NOTES_MAX = 1700; // leaves room for the context prefix (server cap is 2000)

export type StepNo = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export const STEP_LIST: readonly StepNo[] = [1, 2, 3, 4, 5, 6, 7];

export type DesignKey = 'existing' | 'brandIdentity' | 'advancedMotion' | 'premium';
export const DESIGN_KEYS: readonly DesignKey[] = ['existing', 'brandIdentity', 'advancedMotion', 'premium'];

export interface Answers {
  types: ProjectType[];
  pages?: number;
  productBucket?: ProductBucket;
  rolesBucket?: RoleBucket;
  problem: string;
  features: FeatureId[];
  integrations: IntegrationId[];
  design: Partial<Record<DesignKey, boolean>>;
}

export interface BusinessContext {
  industry?: string;
  size?: string;
  goal?: string;
}

export interface TimelineEntry {
  step: string;
  tsMs: number;
}

export interface EstimatorState {
  step: StepNo;
  answers: Answers;
  context: BusinessContext;
  /** bumps on every user-driven step change; drives focus + announcement */
  focusTick: number;
  /** true once the visitor changed something (silences first-load announcements) */
  interacted: boolean;
  restored: boolean;
  startedAtMs: number;
  idempotencyKey: string;
  timeline: TimelineEntry[];
}

export const EMPTY_ANSWERS: Answers = {
  types: [],
  problem: '',
  features: [],
  integrations: [],
  design: {},
};

export const initialState: EstimatorState = {
  step: 1,
  answers: EMPTY_ANSWERS,
  context: {},
  focusTick: 0,
  interacted: false,
  restored: false,
  startedAtMs: 0,
  idempotencyKey: '',
  timeline: [],
};

// ── steps ────────────────────────────────────────────────────────────────

export const clampStep = (n: number): StepNo =>
  (Number.isInteger(n) ? Math.min(STEP_COUNT, Math.max(1, n)) : 1) as StepNo;

/** Nothing past step 1 until at least one project type is chosen. */
export const reachableStep = (n: number, answers: Answers): StepNo =>
  answers.types.length === 0 ? 1 : clampStep(n);

export const parseStepParam = (raw: string | null): StepNo | null => {
  if (raw === null || !/^\d{1,2}$/.test(raw)) return null;
  return clampStep(Number(raw));
};

// ── answers → engine input ───────────────────────────────────────────────

/**
 * Options of a question that are relevant to the selected types. Feature
 * options the engine would ignore for these types are dropped, so the UI never
 * shows a selectable item that has no effect.
 */
export function optionsFor(question: Question, types: readonly ProjectType[]): QuestionOption[] {
  const options = question.options ?? [];
  if (question.answerKey !== 'features') return options;
  return options.filter((o) =>
    ESTIMATOR_CONFIG.features[o.id as FeatureId].appliesTo.some((t) => types.includes(t)),
  );
}

/** Engine-ready answers: only what the visible questions can have produced. */
export function toSchemaAnswers(a: Answers): EstimatorAnswers {
  const types = a.types.length > 0 ? a.types : (['unsure'] as ProjectType[]);
  const visible = visibleQuestions({types});
  const has = (id: string) => visible.some((q) => q.id === id);
  const allowedFeatures = new Set(
    visible.filter((q) => q.answerKey === 'features').flatMap((q) => optionsFor(q, types).map((o) => o.id)),
  );

  const out: EstimatorAnswers = {types};
  if (has('pages') && a.pages !== undefined) out.pages = a.pages;
  if (has('products') && a.productBucket) out.productBucket = a.productBucket;
  if (has('roles') && a.rolesBucket) out.rolesBucket = a.rolesBucket;
  const problem = a.problem.trim();
  if (has('problem') && problem) out.problem = problem.slice(0, PROBLEM_MAX);
  const features = a.features.filter((f) => allowedFeatures.has(f));
  if (features.length > 0) out.features = features;
  if (a.integrations.length > 0) out.integrations = a.integrations;
  const design: NonNullable<EstimatorAnswers['design']> = {};
  for (const k of DESIGN_KEYS) if (a.design[k]) design[k] = true;
  if (Object.keys(design).length > 0) out.design = design;
  return out;
}

const isShared = (id: string): boolean => (SHARED_IDS as readonly string[]).includes(id);

/** Shared ids (crm, payments…) count as selected from either step 3 or 5. */
export function isSelected(a: Answers, key: 'features' | 'integrations', id: string): boolean {
  const own = (a[key] as readonly string[]).includes(id);
  if (own || !isShared(id)) return own;
  const other = key === 'features' ? a.integrations : a.features;
  return (other as readonly string[]).includes(id);
}

// ── reducer ──────────────────────────────────────────────────────────────

export interface Stored {
  answers: Answers;
  context: BusinessContext;
  step: StepNo;
  startedAtMs: number;
  idempotencyKey: string;
  timeline: TimelineEntry[];
}

export type Action =
  | {type: 'hydrate'; stored: Stored | null; urlStep: StepNo | null; now: number; key: string}
  | {type: 'goto'; step: StepNo; now: number}
  | {type: 'popstate'; step: StepNo; now: number}
  | {type: 'toggleType'; id: ProjectType}
  | {type: 'toggleList'; key: 'features' | 'integrations'; id: FeatureId | IntegrationId}
  | {type: 'setBucket'; key: 'pages' | 'productBucket' | 'rolesBucket'; value: number | string}
  | {type: 'setProblem'; value: string}
  | {type: 'setDesign'; key: DesignKey; value: boolean}
  | {type: 'setContext'; key: keyof BusinessContext; value: string}
  | {type: 'reset'; now: number; key: string};

const MAX_TIMELINE = 60;

function withStep(s: EstimatorState, step: StepNo, now: number, focus: boolean): EstimatorState {
  const target = reachableStep(step, s.answers);
  const label = `step_${target}`;
  const last = s.timeline[s.timeline.length - 1];
  const timeline =
    last?.step === label ? s.timeline : [...s.timeline, {step: label, tsMs: now}].slice(-MAX_TIMELINE);
  return {...s, step: target, timeline, focusTick: focus ? s.focusTick + 1 : s.focusTick};
}

const touch = (s: EstimatorState, patch: Partial<EstimatorState>): EstimatorState => ({
  ...s,
  ...patch,
  interacted: true,
});

export function reducer(s: EstimatorState, action: Action): EstimatorState {
  switch (action.type) {
    case 'hydrate': {
      const base: EstimatorState = action.stored
        ? {
            ...s,
            answers: action.stored.answers,
            context: action.stored.context,
            startedAtMs: action.stored.startedAtMs || action.now,
            idempotencyKey: action.stored.idempotencyKey || action.key,
            timeline: action.stored.timeline,
            restored: action.stored.answers.types.length > 0,
          }
        : {...s, startedAtMs: action.now, idempotencyKey: action.key};
      const wanted = action.urlStep ?? action.stored?.step ?? 1;
      return {...base, step: reachableStep(wanted, base.answers)};
    }
    case 'goto':
      return withStep(s, action.step, action.now, true);
    case 'popstate':
      return withStep(s, action.step, action.now, true);
    case 'toggleType': {
      const set = new Set(s.answers.types);
      let types: ProjectType[];
      if (action.id === 'unsure') {
        types = set.has('unsure') ? [] : ['unsure'];
      } else {
        set.delete('unsure');
        if (set.has(action.id)) set.delete(action.id);
        else set.add(action.id);
        types = PROJECT_TYPES.filter((t) => set.has(t));
      }
      return touch(s, {answers: {...s.answers, types}});
    }
    case 'toggleList': {
      const a = s.answers;
      const on = isSelected(a, action.key, action.id);
      if (on) {
        return touch(s, {
          answers: {
            ...a,
            features: a.features.filter((f) => f !== action.id),
            integrations: a.integrations.filter((f) => f !== action.id),
          },
        });
      }
      return touch(s, {
        answers:
          action.key === 'features'
            ? {...a, features: [...a.features, action.id as FeatureId]}
            : {...a, integrations: [...a.integrations, action.id as IntegrationId]},
      });
    }
    case 'setBucket':
      return touch(s, {answers: {...s.answers, [action.key]: action.value}});
    case 'setProblem':
      return touch(s, {answers: {...s.answers, problem: action.value.slice(0, PROBLEM_MAX)}});
    case 'setDesign':
      return touch(s, {answers: {...s.answers, design: {...s.answers.design, [action.key]: action.value}}});
    case 'setContext':
      return touch(s, {context: {...s.context, [action.key]: action.value}});
    case 'reset':
      return {
        ...initialState,
        startedAtMs: action.now,
        idempotencyKey: action.key,
        timeline: [{step: 'step_1', tsMs: action.now}],
        focusTick: s.focusTick + 1,
      };
  }
}

// ── persistence validation ───────────────────────────────────────────────

const pick = <T extends string>(v: unknown, allowed: readonly T[]): T | undefined =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;

const pickList = <T extends string>(v: unknown, allowed: readonly T[]): T[] =>
  Array.isArray(v) ? allowed.filter((id) => v.includes(id)) : [];

const short = (v: unknown, max: number): string | undefined =>
  typeof v === 'string' && v.length > 0 ? v.slice(0, max) : undefined;

/** Defensive parse of whatever localStorage returned. Never throws. */
export function parseStored(raw: unknown): Stored | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const a = (typeof r.answers === 'object' && r.answers !== null ? r.answers : {}) as Record<string, unknown>;
  const d = (typeof a.design === 'object' && a.design !== null ? a.design : {}) as Record<string, unknown>;
  const c = (typeof r.context === 'object' && r.context !== null ? r.context : {}) as Record<string, unknown>;
  const pages = typeof a.pages === 'number' && PAGE_CHOICES.includes(a.pages as 5) ? a.pages : undefined;
  const design: Answers['design'] = {};
  for (const k of DESIGN_KEYS) if (d[k] === true) design[k] = true;
  const answers: Answers = {
    types: pickList(a.types, PROJECT_TYPES),
    pages,
    productBucket: pick(a.productBucket, PRODUCT_BUCKETS),
    rolesBucket: pick(a.rolesBucket, ROLE_BUCKETS),
    problem: typeof a.problem === 'string' ? a.problem.slice(0, PROBLEM_MAX) : '',
    features: pickList(a.features, FEATURE_IDS),
    integrations: pickList(a.integrations, INTEGRATION_IDS),
    design,
  };
  const key = typeof r.idempotencyKey === 'string' && /^[0-9a-f-]{36}$/i.test(r.idempotencyKey) ? r.idempotencyKey : '';
  const started = typeof r.startedAtMs === 'number' && r.startedAtMs > 0 ? r.startedAtMs : 0;
  const timeline = Array.isArray(r.timeline)
    ? r.timeline
        .filter(
          (e): e is TimelineEntry =>
            typeof e === 'object' && e !== null && typeof (e as TimelineEntry).step === 'string' && Number.isInteger((e as TimelineEntry).tsMs),
        )
        .slice(-MAX_TIMELINE)
    : [];
  return {
    answers,
    context: {industry: short(c.industry, 40), size: short(c.size, 40), goal: short(c.goal, 40)},
    step: clampStep(Number(r.step)),
    startedAtMs: started,
    idempotencyKey: key,
    timeline,
  };
}
