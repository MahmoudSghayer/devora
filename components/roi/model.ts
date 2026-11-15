// State model for the automation ROI calculator: reducer, per-step validation,
// conversion to the engine / API answers, and versioned localStorage persistence.
// Pure TypeScript (no React) so it stays easy to reason about and test.

import {ROI_CONFIG, ROI_TASKS} from '@/lib/pricing/config';
import {
  HOURLY_COST_BANDS,
  MINUTES_BUCKETS,
  MONTHLY_SALARY_BANDS,
  PEOPLE_BUCKETS,
  TIMES_PER_DAY_BUCKETS,
  defaultAutomationPct,
  type Bucket,
  type StandardisationLevel,
} from '@/lib/roi/buckets';
import type {RoiAnswers} from '@/lib/roi/schema';
import type {RoiTaskId} from '@/lib/roi/types';

export const STEP_IDS = ['tasks', 'workload', 'labor', 'potential', 'results', 'form'] as const;
export type StepId = (typeof STEP_IDS)[number];
export const TOTAL_STEPS = STEP_IDS.length;
export const MAX_ROWS = 6;
export const STORAGE_KEY = 'devora.roi.v2';
const STORAGE_VERSION = 2;

export type LaborMode = 'hourly' | 'salary' | 'unknown';

/** One group of employees doing a task. All values are per-employee except `employees`. */
export interface WorkRow {
  id: string;
  /** times per day, PER EMPLOYEE */
  times: string;
  /** minutes each time */
  minutes: string;
  employees: string;
}

export interface TaskEntry {
  taskId: RoiTaskId;
  rows: WorkRow[];
  /** percent 0-100 */
  pct: number;
}

export interface TimelineEntry {
  step: string;
  tsMs: number;
}

export interface CalcState {
  step: number;
  tasks: TaskEntry[];
  laborMode: LaborMode;
  hourly: string;
  salary: string;
  multiplier: string;
  workingDays: string;
  /** percent 0-100 */
  directPct: number;
  /** how standardised the tasks are: seeds each task's default automation % */
  level: StandardisationLevel;
  /** true: type exact numbers; false: quick option cards (representative values) */
  exactWorkload: boolean;
  exactLabor: boolean;
  hydrated: boolean;
  /** answers were restored from a previous visit (not persisted) */
  restored: boolean;
  startedAt: number | null;
  key: string | null;
  timeline: TimelineEntry[];
  utm: Record<string, string>;
}

export const initialState: CalcState = {
  step: 1,
  tasks: [],
  laborMode: 'unknown',
  hourly: String(ROI_CONFIG.defaultHourlyCost),
  salary: '',
  multiplier: String(ROI_CONFIG.defaultEmployerCostMultiplier),
  workingDays: String(ROI_CONFIG.defaultWorkingDays),
  directPct: Math.round(ROI_CONFIG.defaultDirectShare * 100),
  level: 'mostly',
  exactWorkload: false,
  exactLabor: false,
  hydrated: false,
  restored: false,
  startedAt: null,
  key: null,
  timeline: [],
  utm: {},
};

export type RowField = 'times' | 'minutes' | 'employees';
export type LaborField = 'hourly' | 'salary' | 'multiplier' | 'workingDays';

export type Action =
  | {type: 'hydrate'; restored: Partial<CalcState> | null; step: number; startedAt: number; key: string; utm: Record<string, string>}
  | {type: 'toggleTask'; taskId: RoiTaskId; rowId: string}
  | {type: 'setRow'; taskId: RoiTaskId; rowId: string; field: RowField; value: string}
  | {type: 'addRow'; taskId: RoiTaskId; rowId: string}
  | {type: 'dupRow'; taskId: RoiTaskId; fromId: string; rowId: string}
  | {type: 'removeRow'; taskId: RoiTaskId; rowId: string}
  | {type: 'setPct'; taskId: RoiTaskId; pct: number}
  | {type: 'resetPct'; taskId: RoiTaskId}
  | {type: 'setLaborMode'; mode: LaborMode}
  | {type: 'setLabor'; field: LaborField; value: string}
  | {type: 'setDirect'; pct: number}
  | {type: 'setLevel'; level: StandardisationLevel}
  | {type: 'setExact'; scope: 'workload' | 'labor'; value: boolean}
  | {type: 'setStep'; step: number; tsMs: number}
  | {type: 'start'; startedAt: number}
  | {type: 'reset'; key: string; startedAt: number};

const taskDef = (id: RoiTaskId) => ROI_TASKS.find((t) => t.id === id);

/** Option cards available for each workload field. */
export const FIELD_BUCKETS: Record<RowField, readonly Bucket[]> = {
  times: TIMES_PER_DAY_BUCKETS,
  minutes: MINUTES_BUCKETS,
  employees: PEOPLE_BUCKETS,
};

/** The bucket whose representative value is closest to `n` (ties go to the lower one). */
export function nearest(buckets: readonly Bucket[], n: number): Bucket {
  let best = buckets[0];
  for (const b of buckets) if (Math.abs(b.value - n) < Math.abs(best.value - n)) best = b;
  return best;
}
const snapStr = (buckets: readonly Bucket[], s: string): string => {
  const n = toNum(s);
  return Number.isFinite(n) ? String(nearest(buckets, n).value) : '';
};
const isBucketValue = (buckets: readonly Bucket[], s: string): boolean => {
  const n = toNum(s);
  return buckets.some((b) => b.value === n);
};
const snapRow = (r: WorkRow): WorkRow => ({
  ...r,
  times: snapStr(TIMES_PER_DAY_BUCKETS, r.times),
  minutes: snapStr(MINUTES_BUCKETS, r.minutes),
  employees: snapStr(PEOPLE_BUCKETS, r.employees),
});
const catalogIndex = (id: RoiTaskId) => ROI_TASKS.findIndex((t) => t.id === id);

export function defaultRow(taskId: RoiTaskId, rowId: string): WorkRow {
  const d = taskDef(taskId);
  return snapRow({
    id: rowId,
    times: String(d?.defaultTimesPerDay ?? 5),
    minutes: String(d?.defaultMinutes ?? 5),
    employees: '1',
  });
}

function mapTask(state: CalcState, taskId: RoiTaskId, fn: (t: TaskEntry) => TaskEntry): CalcState {
  return {...state, tasks: state.tasks.map((t) => (t.taskId === taskId ? fn(t) : t))};
}

export function reducer(state: CalcState, action: Action): CalcState {
  switch (action.type) {
    case 'hydrate':
      return {
        ...state,
        ...(action.restored ?? {}),
        step: action.step,
        startedAt: action.restored?.startedAt ?? action.startedAt,
        key: action.restored?.key ?? action.key,
        utm: Object.keys(action.utm).length > 0 ? action.utm : (action.restored?.utm ?? {}),
        hydrated: true,
        restored: Boolean(action.restored?.tasks && action.restored.tasks.length > 0),
      };
    case 'toggleTask': {
      const has = state.tasks.some((t) => t.taskId === action.taskId);
      if (has) return {...state, tasks: state.tasks.filter((t) => t.taskId !== action.taskId)};
      const entry: TaskEntry = {
        taskId: action.taskId,
        rows: [defaultRow(action.taskId, action.rowId)],
        pct: defaultAutomationPct(action.taskId, state.level),
      };
      const tasks = [...state.tasks, entry].sort((a, b) => catalogIndex(a.taskId) - catalogIndex(b.taskId));
      return {...state, tasks};
    }
    case 'setRow':
      return mapTask(state, action.taskId, (t) => ({
        ...t,
        rows: t.rows.map((r) => (r.id === action.rowId ? {...r, [action.field]: action.value} : r)),
      }));
    case 'addRow':
      return mapTask(state, action.taskId, (t) =>
        t.rows.length >= MAX_ROWS ? t : {...t, rows: [...t.rows, {...defaultRow(t.taskId, action.rowId)}]},
      );
    case 'dupRow':
      return mapTask(state, action.taskId, (t) => {
        if (t.rows.length >= MAX_ROWS) return t;
        const i = t.rows.findIndex((r) => r.id === action.fromId);
        if (i < 0) return t;
        const rows = [...t.rows];
        rows.splice(i + 1, 0, {...t.rows[i], id: action.rowId});
        return {...t, rows};
      });
    case 'removeRow':
      return mapTask(state, action.taskId, (t) =>
        t.rows.length <= 1 ? t : {...t, rows: t.rows.filter((r) => r.id !== action.rowId)},
      );
    case 'setPct':
      return mapTask(state, action.taskId, (t) => ({...t, pct: action.pct}));
    case 'resetPct':
      return mapTask(state, action.taskId, (t) => ({...t, pct: defaultAutomationPct(t.taskId, state.level)}));
    case 'setLaborMode':
      return {...state, laborMode: action.mode};
    case 'setLabor':
      return {...state, [action.field]: action.value};
    case 'setDirect':
      return {...state, directPct: action.pct};
    case 'setLevel':
      return {
        ...state,
        level: action.level,
        tasks: state.tasks.map((t) => ({...t, pct: defaultAutomationPct(t.taskId, action.level)})),
      };
    case 'setExact':
      if (action.scope === 'workload') {
        return {
          ...state,
          exactWorkload: action.value,
          tasks: action.value ? state.tasks : state.tasks.map((t) => ({...t, rows: t.rows.map(snapRow)})),
        };
      }
      return {
        ...state,
        exactLabor: action.value,
        hourly: action.value ? state.hourly : snapStr(HOURLY_COST_BANDS, state.hourly),
        salary: action.value || state.salary.trim() === '' ? state.salary : snapStr(MONTHLY_SALARY_BANDS, state.salary),
      };
    case 'setStep': {
      const last = state.timeline[state.timeline.length - 1];
      const id = STEP_IDS[action.step - 1];
      const timeline =
        last?.step === id ? state.timeline : [...state.timeline, {step: id, tsMs: action.tsMs}].slice(-60);
      return {...state, step: action.step, timeline};
    }
    case 'start':
      return state.startedAt ? state : {...state, startedAt: action.startedAt};
    case 'reset':
      return {...initialState, hydrated: true, key: action.key, startedAt: action.startedAt, step: 1};
  }
}

// ── numbers & validation ──────────────────────────────────────────────────────

export function toNum(s: string): number {
  const t = s.trim().replace(',', '.');
  return t === '' ? NaN : Number(t);
}
const safe = (n: number): number => (Number.isFinite(n) ? n : 0);
const round6 = (n: number): number => Math.round(n * 1e6) / 1e6;

export interface FieldError {
  key: string;
  params?: Record<string, string | number>;
}
export type FieldErrors = Record<string, FieldError>;

export const fieldId = (taskId: string, rowId: string, field: RowField) => `f-${taskId}-${rowId}-${field}`;
export const LABOR_FIELD_ID: Record<LaborField, string> = {
  hourly: 'f-hourly',
  salary: 'f-salary',
  multiplier: 'f-multiplier',
  workingDays: 'f-days',
};
export const TASKS_FIELD_ID = 'roi-tasks';

function numberError(
  s: string,
  min: number,
  max: number,
  opts: {int?: boolean; minExclusive?: boolean} = {},
): FieldError | null {
  const n = toNum(s);
  if (s.trim() === '') return {key: 'required'};
  if (!Number.isFinite(n)) return {key: 'number'};
  if (opts.int && !Number.isInteger(n)) return {key: 'int'};
  if (n < min || n > max || (opts.minExclusive && n === min)) return {key: 'range', params: {min, max}};
  return null;
}

export function validateStep(state: CalcState, step: number): FieldErrors {
  const errors: FieldErrors = {};
  if (step === 1) {
    if (state.tasks.length === 0) errors[TASKS_FIELD_ID] = {key: 'noTask'};
  }
  if (step === 2) {
    let total = 0;
    let firstId = '';
    for (const t of state.tasks) {
      for (const r of t.rows) {
        const idT = fieldId(t.taskId, r.id, 'times');
        const idM = fieldId(t.taskId, r.id, 'minutes');
        const idE = fieldId(t.taskId, r.id, 'employees');
        firstId ||= idT;
        const eT = numberError(r.times, 0, 1000);
        const eM = numberError(r.minutes, 0, 1440);
        const eE = numberError(r.employees, 1, 10000, {int: true});
        if (eT) errors[idT] = eT;
        if (eM) errors[idM] = eM;
        if (eE) errors[idE] = eE;
        if (!state.exactWorkload) {
          if (!eT && !isBucketValue(TIMES_PER_DAY_BUCKETS, r.times)) errors[idT] = {key: 'choose'};
          if (!eM && !isBucketValue(MINUTES_BUCKETS, r.minutes)) errors[idM] = {key: 'choose'};
          if (!eE && !isBucketValue(PEOPLE_BUCKETS, r.employees)) errors[idE] = {key: 'choose'};
        }
        if (!eT && !eM && !errors[idM] && toNum(r.times) * toNum(r.minutes) > 1440) errors[idM] = {key: 'perDay'};
        if (!eT && !eM && !eE) total += toNum(r.times) * toNum(r.minutes) * toNum(r.employees);
      }
    }
    if (Object.keys(errors).length === 0 && total <= 0 && firstId) errors[firstId] = {key: 'noHours'};
  }
  if (step === 3) {
    if (state.laborMode === 'hourly') {
      const e = state.exactLabor
        ? numberError(state.hourly, 0, 100000, {minExclusive: true})
        : isBucketValue(HOURLY_COST_BANDS, state.hourly)
          ? null
          : {key: 'choose'};
      if (e) errors[LABOR_FIELD_ID.hourly] = e;
    }
    if (state.laborMode === 'salary') {
      const e = state.exactLabor
        ? numberError(state.salary, 0, 10_000_000, {minExclusive: true})
        : isBucketValue(MONTHLY_SALARY_BANDS, state.salary)
          ? null
          : {key: 'choose'};
      if (e) errors[LABOR_FIELD_ID.salary] = e;
      const m = numberError(state.multiplier, 1, 3);
      if (m) errors[LABOR_FIELD_ID.multiplier] = m;
    }
    const d = numberError(state.workingDays, 1, 31);
    if (d) errors[LABOR_FIELD_ID.workingDays] = d;
  }
  return errors;
}

/** Highest step the visitor may open: every earlier input step must be valid. */
export function maxReachable(state: CalcState): number {
  for (let s = 1; s <= 3; s++) if (Object.keys(validateStep(state, s)).length > 0) return s;
  return TOTAL_STEPS;
}

// ── answers (engine + API) ────────────────────────────────────────────────────

/** Team hours per working day for a task: Σ times × minutes × employees ÷ 60. */
export function rowHours(r: WorkRow): number {
  return (safe(toNum(r.times)) * safe(toNum(r.minutes)) * safe(toNum(r.employees))) / 60;
}

/**
 * The API takes ONE entry per task, so several groups are folded exactly:
 * employees = Σe, times = weighted average times, minutes = weighted average
 * minutes per occurrence — their product equals Σ(times × minutes × employees).
 */
export function toAnswers(state: CalcState): RoiAnswers {
  const tasks = state.tasks.map((t) => {
    let employees = 0;
    let occurrences = 0;
    let minutesTotal = 0;
    for (const r of t.rows) {
      const e = safe(toNum(r.employees));
      const times = safe(toNum(r.times));
      employees += e;
      occurrences += times * e;
      minutesTotal += times * e * safe(toNum(r.minutes));
    }
    return {
      taskId: t.taskId,
      timesPerDay: employees > 0 ? round6(occurrences / employees) : 0,
      minutesEach: occurrences > 0 ? round6(minutesTotal / occurrences) : 0,
      employees,
      automationPct: t.pct,
    };
  });
  const labor: RoiAnswers['labor'] =
    state.laborMode === 'hourly'
      ? {mode: 'hourly', hourlyCost: safe(toNum(state.hourly))}
      : state.laborMode === 'salary'
        ? {mode: 'salary', monthlyGross: safe(toNum(state.salary)), employerCostMultiplier: safe(toNum(state.multiplier)) || undefined}
        : {mode: 'unknown'};
  return {
    tasks,
    labor,
    workingDays: safe(toNum(state.workingDays)) || ROI_CONFIG.defaultWorkingDays,
    directShare: state.directPct / 100,
  };
}

// ── persistence (versioned, never throws) ─────────────────────────────────────

const isStr = (v: unknown): v is string => typeof v === 'string';
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export function restore(raw: unknown): Partial<CalcState> | null {
  if (!isObj(raw) || raw.v !== STORAGE_VERSION) return null;
  const out: Partial<CalcState> = {};
  if (Array.isArray(raw.tasks)) {
    const tasks: TaskEntry[] = [];
    for (const t of raw.tasks) {
      if (!isObj(t) || !isStr(t.taskId) || !taskDef(t.taskId as RoiTaskId) || !Array.isArray(t.rows)) continue;
      const rows: WorkRow[] = t.rows
        .filter(isObj)
        .filter((r) => isStr(r.id) && isStr(r.times) && isStr(r.minutes) && isStr(r.employees))
        .map((r) => ({id: r.id as string, times: r.times as string, minutes: r.minutes as string, employees: r.employees as string}))
        .slice(0, MAX_ROWS);
      if (rows.length === 0) continue;
      const pct = typeof t.pct === 'number' && t.pct >= 0 && t.pct <= 100 ? t.pct : 50;
      tasks.push({taskId: t.taskId as RoiTaskId, rows, pct});
    }
    out.tasks = tasks;
  }
  if (raw.laborMode === 'hourly' || raw.laborMode === 'salary' || raw.laborMode === 'unknown') out.laborMode = raw.laborMode;
  for (const k of ['hourly', 'salary', 'multiplier', 'workingDays'] as const) if (isStr(raw[k])) out[k] = raw[k];
  if (typeof raw.directPct === 'number' && raw.directPct >= 0 && raw.directPct <= 100) out.directPct = raw.directPct;
  if (raw.level === 'very' || raw.level === 'mostly' || raw.level === 'varies') out.level = raw.level;
  if (typeof raw.exactWorkload === 'boolean') out.exactWorkload = raw.exactWorkload;
  if (typeof raw.exactLabor === 'boolean') out.exactLabor = raw.exactLabor;
  if (typeof raw.startedAt === 'number') out.startedAt = raw.startedAt;
  if (isStr(raw.key) && /^[0-9a-f-]{36}$/i.test(raw.key)) out.key = raw.key;
  if (Array.isArray(raw.timeline)) {
    out.timeline = raw.timeline
      .filter(isObj)
      .filter((e) => isStr(e.step) && typeof e.tsMs === 'number')
      .map((e) => ({step: e.step as string, tsMs: e.tsMs as number}))
      .slice(-60);
  }
  if (isObj(raw.utm)) {
    out.utm = Object.fromEntries(Object.entries(raw.utm).filter((e): e is [string, string] => isStr(e[1])));
  }
  return out;
}

/** Contact details are deliberately NOT persisted. */
export function serialize(s: CalcState): string {
  return JSON.stringify({
    v: STORAGE_VERSION,
    tasks: s.tasks,
    laborMode: s.laborMode,
    hourly: s.hourly,
    salary: s.salary,
    multiplier: s.multiplier,
    workingDays: s.workingDays,
    directPct: s.directPct,
    level: s.level,
    exactWorkload: s.exactWorkload,
    exactLabor: s.exactLabor,
    startedAt: s.startedAt,
    key: s.key,
    timeline: s.timeline,
    utm: s.utm,
  });
}

export function loadSaved(): Partial<CalcState> | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? restore(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function save(s: CalcState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, serialize(s));
  } catch {
    // storage unavailable (private mode, quota): the calculator still works
  }
}

export function clearSaved(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function newKey(): string {
  try {
    return crypto.randomUUID();
  } catch {
    const h = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
    return `${h()}${h()}-${h()}-4${h().slice(1)}-a${h().slice(1)}-${h()}${h()}${h()}`;
  }
}

export function readUtm(search: string): Record<string, string> {
  const out: Record<string, string> = {};
  const p = new URLSearchParams(search);
  for (const [k, v] of p) {
    if (k.startsWith('utm_') && Object.keys(out).length < 10) out[k.slice(0, 40)] = v.slice(0, 200);
  }
  return out;
}
