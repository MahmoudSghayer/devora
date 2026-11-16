'use client';

import {useCallback, useEffect, useMemo, useReducer, useRef, useState} from 'react';
import {useLocale} from 'next-intl';
import {useReducedMotion} from 'motion/react';
import {estimateDiscuss} from '@/lib/discuss/engine';
import {formatMoney} from '@/lib/pricing/config';
import {trackFunnel} from '@/lib/leads/track';
import LivePanel, {MobileBar, weeksText} from './LivePanel';
import ProgressNav from './ProgressNav';
import {useCalcDone} from '@/components/calc/CalcShell';
import SuccessView, {type Social} from './SuccessView';
import QuestionStep from './steps/QuestionStep';
import SummaryStep, {type Failure} from './steps/SummaryStep';
import {useTx} from './i18n';
import {ArrowIcon} from './icons';
import {buildSummary} from './labels';
import {
  FINAL_STEP,
  FIRST_PANEL_STEP,
  QUESTIONS,
  STEP_COUNT,
  initialState,
  parseStepParam,
  reachableStep,
  reducer,
  toSchemaAnswers,
  EMPTY_ANSWERS,
  type StepNo,
} from './model';
import {clearStored, loadStored, newIdempotencyKey, saveStored} from './storage';
import {EMPTY_FORM, submitDiscuss, type ContactForm} from './submit';
import {BTN_GHOST, BTN_PRIMARY} from './ui';

type Outcome = {leadRef: string; duplicate: boolean; name: string} | null;

const stepFromLocation = (): StepNo | null => parseStepParam(new URLSearchParams(window.location.search).get('step'));

function writeStep(step: StepNo, mode: 'push' | 'replace') {
  const q = new URLSearchParams(window.location.search);
  q.set('step', String(step));
  const url = `${window.location.pathname}?${q.toString()}`;
  if (mode === 'push') window.history.pushState(null, '', url);
  else window.history.replaceState(null, '', url);
}

export default function DiscussApp({email, socials}: {email: string; socials: readonly Social[]}) {
  const t = useTx();
  const locale = useLocale();
  const reduced = useReducedMotion();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const setDone = useCalcDone();
  const [stepNote, setStepNote] = useState('');
  const [liveNote, setLiveNote] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inFlight = useRef(false);
  const started = useRef(false);
  const lastTick = useRef(0);

  const {step, answers} = state;
  const hasPurpose = answers.purpose.length > 0;
  const schema = useMemo(() => toSchemaAnswers(answers), [answers]);
  const result = useMemo(() => (hasPurpose ? estimateDiscuss(schema) : null), [hasPurpose, schema]);
  const sections = useMemo(() => buildSummary(answers, t, locale), [answers, t, locale]);

  // ── hydrate from storage + URL ───────────────────────────────────────
  useEffect(() => {
    const stored = loadStored();
    const urlStep = stepFromLocation();
    dispatch({type: 'hydrate', stored, urlStep, now: Date.now(), key: newIdempotencyKey()});
    if (urlStep !== null) {
      const wanted = reachableStep(urlStep, stored?.answers ?? EMPTY_ANSWERS);
      if (wanted !== urlStep) writeStep(wanted, 'replace');
    }
  }, []);

  // ── persist progress (not before hydrate; not after a successful send) ──
  useEffect(() => {
    if (state.startedAtMs === 0 || outcome) return;
    saveStored(state);
  }, [state, outcome]);

  // ── browser Back / Forward ───────────────────────────────────────────
  useEffect(() => {
    const onPop = () => dispatch({type: 'popstate', step: stepFromLocation() ?? 1, now: Date.now()});
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = useCallback(
    (target: StepNo, fromSummary = false) => {
      const to = reachableStep(target, answers);
      if (to === step) return;
      writeStep(to, 'push');
      dispatch({type: 'goto', step: to, now: Date.now(), fromSummary});
    },
    [answers, step],
  );

  // ── focus the step heading + announce "Step n of 8" ──────────────────
  const headingText = step === FINAL_STEP ? t('flow.s8.title') : t(`q.${QUESTIONS[step - 1].id}.title`);
  useEffect(() => {
    if (state.focusTick === 0 || state.focusTick === lastTick.current) return;
    lastTick.current = state.focusTick;
    const h = headingRef.current;
    if (h) {
      h.focus({preventScroll: true});
      const top = h.getBoundingClientRect().top + window.scrollY - 112;
      window.scrollTo({top: Math.max(0, top), behavior: reduced ? 'auto' : 'smooth'});
    }
    setStepNote(`${t('step_of', {n: step, total: STEP_COUNT})}: ${headingText}`);
    trackFunnel('calculator_step', {calculator: 'discuss', step});
  }, [state.focusTick, step, reduced, t, headingText]);

  useEffect(() => {
    if (state.interacted && !started.current) {
      started.current = true;
      trackFunnel('calculator_started', {calculator: 'discuss'});
    }
  }, [state.interacted]);

  // ── debounced live-region announcement of the range ──────────────────
  useEffect(() => {
    if (!state.interacted || !result || step < FIRST_PANEL_STEP) return;
    const id = window.setTimeout(() => {
      setLiveNote(
        t('range.announce', {
          low: formatMoney(result.startingLow, locale),
          high: formatMoney(result.startingHigh, locale),
          weeks: weeksText(t, result.weeks.low, result.weeks.high),
        }),
      );
    }, 700);
    return () => window.clearTimeout(id);
  }, [result, locale, state.interacted, step, t]);

  // ── submit ───────────────────────────────────────────────────────────
  const mailto = useMemo(() => {
    const lines = sections.flatMap((s) => [`${t(`sum.${s.id}`)}:`, ...s.items.map((i) => `- ${i}`), '']);
    const range = result ? `${formatMoney(result.startingLow, 'en')} – ${formatMoney(result.startingHigh, 'en')}` : '';
    const body = [t('mailto.intro'), '', ...lines, range, '', form.name, form.email, '', form.notes].join('\n').slice(0, 1500);
    return `mailto:${email}?subject=${encodeURIComponent(t('mailto.subject'))}&body=${encodeURIComponent(body)}`;
  }, [sections, result, email, form.name, form.email, form.notes, t]);

  const onSubmit = async (honeypot: string) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setFailure(null);
    const res = await submitDiscuss({
      locale,
      idempotencyKey: state.idempotencyKey,
      startedAtMs: state.startedAtMs,
      answers: schema,
      form,
      timeline: state.timeline,
      honeypot,
    });
    inFlight.current = false;
    setSubmitting(false);
    if (res.ok) {
      clearStored();
      trackFunnel('discuss_submitted', {calculator: 'discuss', duplicate: res.duplicate});
      setDone(true);
      setOutcome({leadRef: res.leadRef, duplicate: res.duplicate, name: form.name.trim()});
    } else {
      setFailure({error: res.error, retryAfterSec: res.retryAfterSec});
    }
  };

  const restart = () => {
    clearStored();
    setDone(false);
    setOutcome(null);
    setFailure(null);
    setForm(EMPTY_FORM);
    started.current = false;
    dispatch({type: 'reset', now: Date.now(), key: newIdempotencyKey()});
    writeStep(1, 'push');
  };

  if (outcome && result) {
    return (
      <div aria-live="off">
        <SuccessView {...outcome} sections={sections} result={result} email={email} socials={socials} onRestart={restart} />
      </div>
    );
  }

  const showPanel = result !== null && step >= FIRST_PANEL_STEP && step < FINAL_STEP;
  const needsPurpose = step === 1 && !hasPurpose;
  const isLastQuestion = step === FINAL_STEP - 1;
  const nextLabel = state.fromSummary ? t('btn_back_summary') : isLastQuestion ? t('btn_review') : t('btn_next');
  const next = (
    <button
      type="button"
      aria-disabled={needsPurpose}
      aria-describedby={needsPurpose ? 'dsc-need' : undefined}
      onClick={() => {
        if (needsPurpose) return;
        if (state.fromSummary) go(FINAL_STEP);
        else go((step + 1) as StepNo);
      }}
      className={BTN_PRIMARY}
    >
      {nextLabel}
      <ArrowIcon />
    </button>
  );

  return (
    <div className="grid gap-8 nav:grid-cols-[minmax(0,1fr)_380px] nav:items-start nav:gap-10">
      <div className={`min-w-0 space-y-8 ${showPanel ? 'max-nav:pb-28' : ''}`}>
        <ProgressNav step={step} canLeaveFirst={hasPurpose} onGo={(n) => go(n)} />

        {state.restored && !state.interacted && step === 1 ? (
          <p className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card border border-border-card p-3 text-sm text-ink-2">
            {t('restored.note')}
            <button type="button" onClick={restart} className="min-h-11 font-semibold text-amber underline underline-offset-4">
              {t('start_over')}
            </button>
          </p>
        ) : null}

        <section aria-labelledby="dsc-step-h" className="glass rounded-panel p-5 nav:p-8">
          <h2
            id="dsc-step-h"
            ref={headingRef}
            tabIndex={-1}
            className="mb-6 font-display text-h3 font-semibold leading-tight text-ink outline-none"
          >
            {headingText}
          </h2>
          {step < FINAL_STEP ? <QuestionStep step={step} answers={answers} dispatch={dispatch} /> : null}
          {step === FINAL_STEP && result ? (
            <SummaryStep
              sections={sections}
              result={result}
              form={form}
              setForm={setForm}
              submitting={submitting}
              failure={failure}
              mailto={mailto}
              onSubmit={onSubmit}
              onEdit={(n) => go(n, true)}
            />
          ) : null}
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          {step > 1 ? (
            <button type="button" onClick={() => go((step - 1) as StepNo)} className={BTN_GHOST}>
              <ArrowIcon back />
              {t('btn_back')}
            </button>
          ) : (
            <span />
          )}
          {step < FINAL_STEP ? next : null}
        </div>
      </div>

      {showPanel && result ? (
        <aside aria-label={t('range.title')} className="hidden nav:block print:hidden">
          <div className="glass sticky top-28 max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-panel p-6">
            <LivePanel result={result} />
          </div>
        </aside>
      ) : null}
      {showPanel && result ? <MobileBar result={result} /> : null}

      <p role="status" aria-live="polite" className="sr-only">
        {stepNote}
      </p>
      <p role="status" aria-live="polite" className="sr-only">
        {liveNote}
      </p>
    </div>
  );
}
