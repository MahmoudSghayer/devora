// State model for the discovery island: pure types, reducer and helpers.
// No React, no I/O.

import {
  BUDGET_OPTIONS,
  INTEGRATIONS_OPTIONS,
  MUST_HAVE_OPTIONS,
  PURPOSE_OPTIONS,
  TIMELINE_OPTIONS,
  TODAY_OPTIONS,
  USERS_OPTIONS,
  type DiscussAnswers,
} from '@/lib/discuss/schema';
import type {Budget, IntegrationsLevel, MustHave, Purpose, Timeline, Today, Users} from '@/lib/discuss/types';

export const STEP_COUNT = 8;
export type StepNo = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export const STEP_LIST: readonly StepNo[] = [1, 2, 3, 4, 5, 6, 7, 8];
/** The live range appears once the visitor has answered step 2 (i.e. from step 3). */
export const FIRST_PANEL_STEP: StepNo = 3;
export const FINAL_STEP: StepNo = 8;
export const NOTES_MAX = 2000;

export type QuestionId = 'purpose' | 'users' | 'today' | 'integrations' | 'mustHaves' | 'timeline' | 'budget';

export interface QuestionDef {
  id: QuestionId;
  multi: boolean;
  options: readonly string[];
}

/** Steps 1–7 in order. */
export const QUESTIONS: readonly QuestionDef[] = [
  {id: 'purpose', multi: true, options: PURPOSE_OPTIONS},
  {id: 'users', multi: false, options: USERS_OPTIONS},
  {id: 'today', multi: false, options: TODAY_OPTIONS},
  {id: 'integrations', multi: false, options: INTEGRATIONS_OPTIONS},
  {id: 'mustHaves', multi: true, options: MUST_HAVE_OPTIONS},
  {id: 'timeline', multi: false, options: TIMELINE_OPTIONS},
  {id: 'budget', multi: false, options: BUDGET_OPTIONS},
];

export interface Answers {
  purpose: Purpose[];
  users?: Users;
  today?: Today;
  integrations?: IntegrationsLevel;
  mustHaves: MustHave[];
  timeline?: Timeline;
  budget?: Budget;
}

export const EMPTY_ANSWERS: Answers = {purpose: [], mustHaves: []};

export interface TimelineEntry {
  step: string;
  tsMs: number;
}

export interface DiscussState {
  step: StepNo;
  answers: Answers;
  /** bumps on every user-driven step change; drives focus + announcement */
  focusTick: number;
  interacted: boolean;
  restored: boolean;
  /** set when a step was opened from a summary "Edit" link: Next returns to the summary */
  fromSummary: boolean;
  startedAtMs: number;
  idempotencyKey: string;
  timeline: TimelineEntry[];
}

export const initialState: DiscussState = {
  step: 1,
  answers: EMPTY_ANSWERS,
  focusTick: 0,
  interacted: false,
  restored: false,
  fromSummary: false,
  startedAtMs: 0,
  idempotencyKey: '',
  timeline: [],
};

// ── steps ────────────────────────────────────────────────────────────────

export const clampStep = (n: number): StepNo =>
  (Number.isInteger(n) ? Math.min(STEP_COUNT, Math.max(1, n)) : 1) as StepNo;

/** Nothing past step 1 until at least one purpose is chosen. */
export const reachableStep = (n: number, answers: Answers): StepNo =>
  answers.purpose.length === 0 ? 1 : clampStep(n);

export const parseStepParam = (raw: string | null): StepNo | null => {
  if (raw === null || !/^\d{1,2}$/.test(raw)) return null;
  return clampStep(Number(raw));
};

// ── answers ──────────────────────────────────────────────────────────────

const pick = <T extends string>(options: readonly T[], v: unknown): T | undefined =>
  typeof v === 'string' && (options as readonly string[]).includes(v) ? (v as T) : undefined;

const pickMany = <T extends string>(options: readonly T[], v: unknown): T[] =>
  Array.isArray(v) ? options.filter((o) => v.includes(o)) : [];

/** Engine-ready answers (schema-valid once at least one purpose is chosen). */
export function toSchemaAnswers(a: Answers): DiscussAnswers {
  const out: DiscussAnswers = {purpose: a.purpose};
  if (a.users) out.users = a.users;
  if (a.today) out.today = a.today;
  if (a.integrations) out.integrations = a.integrations;
  if (a.mustHaves.length > 0) out.mustHaves = a.mustHaves;
  if (a.timeline) out.timeline = a.timeline;
  if (a.budget) out.budget = a.budget;
  return out;
}

export function sanitizeAnswers(raw: unknown): Answers {
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    purpose: pickMany(PURPOSE_OPTIONS, o.purpose),
    users: pick(USERS_OPTIONS, o.users),
    today: pick(TODAY_OPTIONS, o.today),
    integrations: pick(INTEGRATIONS_OPTIONS, o.integrations),
    mustHaves: pickMany(MUST_HAVE_OPTIONS, o.mustHaves),
    timeline: pick(TIMELINE_OPTIONS, o.timeline),
    budget: pick(BUDGET_OPTIONS, o.budget),
  };
}

// ── persistence shape ────────────────────────────────────────────────────

export interface Stored {
  answers: Answers;
  step: StepNo;
  startedAtMs: number;
  idempotencyKey: string;
  timeline: TimelineEntry[];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseStored(raw: unknown): Stored | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const answers = sanitizeAnswers(o.answers);
  if (answers.purpose.length === 0) return null;
  const timeline = Array.isArray(o.timeline)
    ? o.timeline
        .filter(
          (e): e is TimelineEntry =>
            typeof e === 'object' && e !== null && typeof (e as TimelineEntry).step === 'string' && Number.isFinite((e as TimelineEntry).tsMs),
        )
        .map((e) => ({step: e.step.slice(0, 64), tsMs: e.tsMs}))
        .slice(-60)
    : [];
  return {
    answers,
    step: clampStep(Number(o.step)),
    startedAtMs: typeof o.startedAtMs === 'number' && o.startedAtMs > 0 ? o.startedAtMs : 0,
    idempotencyKey: typeof o.idempotencyKey === 'string' && UUID_RE.test(o.idempotencyKey) ? o.idempotencyKey : '',
    timeline,
  };
}

// ── reducer ──────────────────────────────────────────────────────────────

export type Action =
  | {type: 'hydrate'; stored: Stored | null; urlStep: StepNo | null; now: number; key: string}
  | {type: 'goto'; step: StepNo; now: number; fromSummary?: boolean}
  | {type: 'popstate'; step: StepNo; now: number}
  | {type: 'toggle'; question: 'purpose' | 'mustHaves'; id: string}
  | {type: 'set'; question: 'users' | 'today' | 'integrations' | 'timeline' | 'budget'; id: string}
  | {type: 'reset'; now: number; key: string};

const withEntry = (tl: TimelineEntry[], step: StepNo, now: number): TimelineEntry[] =>
  [...tl, {step: `step-${step}`, tsMs: now}].slice(-60);

export function reducer(state: DiscussState, action: Action): DiscussState {
  switch (action.type) {
    case 'hydrate': {
      const stored = action.stored;
      const answers = stored?.answers ?? EMPTY_ANSWERS;
      const step = reachableStep(action.urlStep ?? stored?.step ?? 1, answers);
      return {
        ...state,
        answers,
        step,
        restored: stored !== null,
        startedAtMs: stored?.startedAtMs || action.now,
        idempotencyKey: stored?.idempotencyKey || action.key,
        timeline: stored?.timeline ?? [],
      };
    }
    case 'goto': {
      const step = reachableStep(action.step, state.answers);
      if (step === state.step) return state;
      return {
        ...state,
        step,
        fromSummary: action.fromSummary === true,
        focusTick: state.focusTick + 1,
        interacted: true,
        timeline: withEntry(state.timeline, step, action.now),
      };
    }
    case 'popstate': {
      const step = reachableStep(action.step, state.answers);
      if (step === state.step) return state;
      return {...state, step, fromSummary: false, focusTick: state.focusTick + 1, timeline: withEntry(state.timeline, step, action.now)};
    }
    case 'toggle': {
      const list = state.answers[action.question] as string[];
      const next = list.includes(action.id) ? list.filter((x) => x !== action.id) : [...list, action.id];
      const def = QUESTIONS.find((q) => q.id === action.question);
      const ordered = def ? def.options.filter((o) => next.includes(o)) : next;
      return {...state, interacted: true, answers: {...state.answers, [action.question]: ordered}};
    }
    case 'set':
      return {...state, interacted: true, answers: {...state.answers, [action.question]: action.id}};
    case 'reset':
      return {
        ...initialState,
        step: 1,
        focusTick: 0,
        startedAtMs: action.now,
        idempotencyKey: action.key,
      };
  }
}
