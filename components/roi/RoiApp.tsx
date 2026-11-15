'use client';

import {useCallback, useEffect, useMemo, useReducer, useRef, useState} from 'react';
import {useReducedMotion} from 'motion/react';
import {useTranslations} from 'next-intl';
import {trackFunnel} from '@/lib/leads/track';
import {computeRoi} from '@/lib/roi/engine';
import {ChevronIcon} from './icons';
import Labor from './Labor';
import LeadForm, {type Submitted} from './LeadForm';
import {
  STEP_IDS,
  TOTAL_STEPS,
  clearSaved,
  initialState,
  loadSaved,
  maxReachable,
  newId,
  newKey,
  readUtm,
  reducer,
  save,
  toAnswers,
  validateStep,
  type CalcState,
  type FieldErrors,
} from './model';
import Potential from './Potential';
import Results from './Results';
import Success from './Success';
import Summary from './Summary';
import TaskPicker from './TaskPicker';
import Workload from './Workload';
import {Eyebrow, ghostBtn, primaryBtn} from './ui';
import {toNum} from './model';
import type {RoiTaskId} from '@/lib/roi/types';

function stepFromUrl(): number {
  const n = Number(new URLSearchParams(window.location.search).get('step'));
  return Number.isInteger(n) && n >= 1 && n <= TOTAL_STEPS ? n : 1;
}

function writeStep(step: number, mode: 'push' | 'replace') {
  const p = new URLSearchParams(window.location.search);
  p.set('step', String(step));
  const url = `${window.location.pathname}?${p.toString()}`;
  if (mode === 'push') window.history.pushState(null, '', url);
  else window.history.replaceState(null, '', url);
}

export default function RoiApp() {
  const t = useTranslations('roi');
  const reduced = useReducedMotion();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [attempted, setAttempted] = useState(false);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusPending = useRef(false);
  const startedTracked = useRef(false);
  const stateRef = useRef<CalcState>(state);
  const submittedRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  });

  // Hydrate from localStorage + ?step= once on the client.
  useEffect(() => {
    const saved = loadSaved();
    const merged = {...initialState, ...(saved ?? {})};
    const wanted = stepFromUrl();
    const step = Math.min(wanted, maxReachable(merged));
    dispatch({type: 'hydrate', restored: saved, step, startedAt: Date.now(), key: newKey(), utm: readUtm(window.location.search)});
    if (new URLSearchParams(window.location.search).has('step')) writeStep(step, 'replace');
  }, []);

  useEffect(() => {
    if (state.hydrated && !submittedRef.current) save(state);
  }, [state]);

  const goTo = useCallback((step: number, history: 'push' | 'none' = 'push') => {
    dispatch({type: 'setStep', step, tsMs: Date.now()});
    setAttempted(false);
    focusPending.current = true;
    if (history === 'push') writeStep(step, 'push');
    trackFunnel('calculator_step', {calculator: 'roi', step: STEP_IDS[step - 1]});
  }, []);

  useEffect(() => {
    const onPop = () => goTo(Math.min(stepFromUrl(), maxReachable(stateRef.current)), 'none');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [goTo]);

  // Move focus to the step heading after each step change.
  useEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    const h = headingRef.current;
    if (!h) return;
    h.focus({preventScroll: true});
    h.scrollIntoView({block: 'start', behavior: reduced ? 'auto' : 'smooth'});
  }, [state.step, submitted, reduced]);

  const errors: FieldErrors = useMemo(() => (attempted ? validateStep(state, state.step) : {}), [attempted, state]);
  const errCount = Object.keys(errors).length;
  const reach = maxReachable(state);
  const result = useMemo(() => computeRoi(toAnswers(state)), [state]);
  const step = state.step;
  const stepId = STEP_IDS[step - 1];

  function onNext() {
    const e = validateStep(state, step);
    const first = Object.keys(e)[0];
    if (first) {
      setAttempted(true);
      requestAnimationFrame(() => document.getElementById(first)?.focus());
      return;
    }
    goTo(step + 1);
  }

  function onToggleTask(id: RoiTaskId) {
    if (!startedTracked.current) {
      startedTracked.current = true;
      trackFunnel('calculator_started', {calculator: 'roi'});
    }
    dispatch({type: 'toggleTask', taskId: id, rowId: newId()});
  }

  function restart() {
    submittedRef.current = false;
    clearSaved();
    setSubmitted(null);
    dispatch({type: 'reset', key: newKey(), startedAt: Date.now()});
    goTo(1);
  }

  function onSuccess(s: Submitted) {
    submittedRef.current = true;
    clearSaved();
    focusPending.current = true;
    setSubmitted(s);
  }

  const nextLabel = step === 4 ? t('nav.toResults') : step === 5 ? t('nav.toForm') : t('nav.next');

  return (
    <div className="flex flex-col gap-8 print:gap-4" data-step={step}>
      <nav aria-label={t('step.nav')} className="print:hidden">
        <ol className="flex items-center gap-2">
          {STEP_IDS.map((id, i) => {
            const n = i + 1;
            const current = n === step;
            const enabled = n <= reach && !submitted;
            const label = t(`step.short.${id}`);
            return (
              <li key={id} className="flex min-w-0 flex-1 items-center gap-2 nav:flex-none">
                <button
                  type="button"
                  disabled={!enabled}
                  aria-current={current ? 'step' : undefined}
                  aria-label={t('step.go', {n, title: label})}
                  onClick={() => goTo(n)}
                  className={`flex size-11 shrink-0 items-center justify-center rounded-pill border font-display text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    current
                      ? 'border-signal bg-signal text-on-amber'
                      : n < step
                        ? 'border-signal text-signal'
                        : 'border-border-ghost text-ink-2'
                  }`}
                >
                  <span className="num">{n}</span>
                </button>
                <span className={`hidden text-sm nav:inline ${current ? 'font-semibold text-ink' : 'text-muted'}`}>{label}</span>
                {n < TOTAL_STEPS && <span aria-hidden className="hidden h-px flex-1 bg-border-card nav:block nav:w-6 nav:flex-none" />}
              </li>
            );
          })}
        </ol>
      </nav>

      {state.restored && step === 1 && (
        <p className="flex flex-wrap items-center gap-3 rounded-card border border-border-card p-4 text-sm text-ink-2 print:hidden">
          {t('nav.restored')}
          <button type="button" className={ghostBtn} onClick={restart}>
            {t('nav.startOver')}
          </button>
        </p>
      )}

      <section aria-labelledby="roi-step-title" className="flex flex-col gap-6">
        <header className="print:hidden">
          <Eyebrow>
            <span aria-hidden>{t('step.of', {n: submitted ? TOTAL_STEPS : step, total: TOTAL_STEPS})}</span>
          </Eyebrow>
          <h2
            id="roi-step-title"
            ref={headingRef}
            tabIndex={-1}
            className="u-track mt-3 scroll-mt-28 font-display text-h3 font-semibold leading-tight tracking-[-0.01em] text-ink outline-none"
          >
            <span className="sr-only">{t('step.of', {n: step, total: TOTAL_STEPS})}: </span>
            {t(`step.title.${stepId}`)}
          </h2>
          {step !== 2 && step !== 4 && STEP_LEAD.has(stepId) && (
            <p className="mt-3 max-w-[68ch] text-base leading-relaxed text-muted">{t(`step.lead.${stepId}`)}</p>
          )}
        </header>

        {step === 1 && (
          <TaskPicker
            selected={state.tasks.map((x) => x.taskId)}
            onToggle={onToggleTask}
            error={errors['roi-tasks'] ? t(`err.${errors['roi-tasks'].key}`) : undefined}
          />
        )}
        {step === 2 && (
          <Workload
            tasks={state.tasks}
            errors={errors}
            workingDays={toNum(state.workingDays)}
            exact={state.exactWorkload}
            dispatch={dispatch}
          />
        )}
        {step === 3 && <Labor state={state} errors={errors} dispatch={dispatch} />}
        {step === 4 && <Potential tasks={state.tasks} directPct={state.directPct} level={state.level} dispatch={dispatch} />}
        {step === 5 && <Results state={state} result={result} dispatch={dispatch} />}
        {step === 6 &&
          (submitted ? (
            <Success state={state} result={result} submitted={submitted} onRestart={restart} />
          ) : (
            <div className="flex flex-col gap-6">
              <Summary state={state} onEdit={(n) => goTo(n)} />
              <LeadForm state={state} result={result} onSuccess={onSuccess} />
            </div>
          ))}
      </section>

      {!submitted && (
        <div className="flex flex-col gap-4 print:hidden">
          {errCount > 0 && (
            <p role="alert" className="text-sm font-medium text-amber-hi">
              {t('err.summary', {count: errCount})}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {step > 1 ? (
              <button type="button" className={ghostBtn} onClick={() => goTo(step - 1)}>
                <ChevronIcon className="size-4 rtl:rotate-180" />
                {t('nav.back')}
              </button>
            ) : (
              <span />
            )}
            {step < TOTAL_STEPS && (
              <button type="button" className={primaryBtn} onClick={onNext}>
                {nextLabel}
                <ChevronIcon className="size-4 rotate-180 rtl:rotate-0" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const STEP_LEAD = new Set(['tasks', 'labor', 'results', 'form']);
