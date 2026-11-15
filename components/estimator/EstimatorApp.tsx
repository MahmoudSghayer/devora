'use client';

import {useCallback, useEffect, useMemo, useReducer, useRef, useState} from 'react';
import {useLocale} from 'next-intl';
import {useReducedMotion} from 'motion/react';
import {estimateProject} from '@/lib/estimator/engine';
import {formatMoney} from '@/lib/pricing/config';
import {trackFunnel} from '@/lib/leads/track';
import EstimatePanel from './EstimatePanel';
import MobileSheet from './MobileSheet';
import ProgressNav from './ProgressNav';
import SuccessView, {type Social} from './SuccessView';
import GoalStep from './steps/GoalStep';
import SizeStep from './steps/SizeStep';
import DesignStep from './steps/DesignStep';
import IntegrationsStep from './steps/IntegrationsStep';
import RequirementsStep from './steps/RequirementsStep';
import ReviewStep from './steps/ReviewStep';
import SummaryStep, {type Failure} from './steps/SummaryStep';
import TypeStep from './steps/TypeStep';
import {weeksText} from './EstimatePanel';
import {useTx} from './i18n';
import {ArrowIcon} from './icons';
import {
  STEP_COUNT,
  TYPE_STEP,
  initialState,
  parseStepParam,
  reachableStep,
  reducer,
  toSchemaAnswers,
  EMPTY_ANSWERS,
  type StepNo,
} from './model';
import {clearStored, loadStored, newIdempotencyKey, saveStored} from './storage';
import {EMPTY_FORM, submitEstimate, type ContactForm} from './submit';
import {buildSummary} from './summary';
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

export default function EstimatorApp({email, socials}: {email: string; socials: readonly Social[]}) {
  const t = useTx();
  const locale = useLocale();
  const reduced = useReducedMotion();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [stepNote, setStepNote] = useState('');
  const [liveNote, setLiveNote] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inFlight = useRef(false);
  const started = useRef(false);
  const lastTick = useRef(0);

  const {step, answers} = state;
  const hasTypes = answers.types.length > 0;
  const schema = useMemo(() => toSchemaAnswers(answers), [answers]);
  const est = useMemo(() => estimateProject(schema), [schema]);
  const sections = useMemo(() => buildSummary(schema, t), [schema, t]);

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
    (target: StepNo) => {
      const to = reachableStep(target, answers);
      if (to === step) return;
      writeStep(to, 'push');
      dispatch({type: 'goto', step: to, now: Date.now()});
    },
    [answers, step],
  );

  // ── focus the step heading + announce "Step n of 7" ──────────────────
  useEffect(() => {
    if (state.focusTick === 0 || state.focusTick === lastTick.current) return;
    lastTick.current = state.focusTick;
    headingRef.current?.focus({preventScroll: true});
    const anchor = document.getElementById('est-top');
    if (anchor) {
      const top = anchor.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({top: Math.max(0, top), behavior: reduced ? 'auto' : 'smooth'});
    }
    setStepNote(`${t('step_of', {n: step, total: STEP_COUNT})}: ${t(`flow.s${step}.title`)}`);
    trackFunnel('calculator_step', {calculator: 'estimator', step});
  }, [state.focusTick, step, reduced, t]);

  useEffect(() => {
    if (state.interacted && !started.current) {
      started.current = true;
      trackFunnel('calculator_started', {calculator: 'estimator'});
    }
  }, [state.interacted]);

  // ── debounced live-region announcement of the estimate ───────────────
  useEffect(() => {
    if (!state.interacted || !hasTypes) return;
    const id = window.setTimeout(() => {
      setLiveNote(
        t('live.announce', {
          low: formatMoney(est.low, locale),
          high: formatMoney(est.high, locale),
          weeks: weeksText(t, est.weeksLow, est.weeksHigh),
        }),
      );
    }, 700);
    return () => window.clearTimeout(id);
  }, [est, hasTypes, locale, state.interacted, t]);

  // ── submit ───────────────────────────────────────────────────────────
  const mailto = useMemo(() => {
    const lines = sections.flatMap((s) => [`${t(`sum.${s.id}`)}:`, ...s.items.map((i) => `- ${i}`), '']);
    const body = [
      t('mailto.intro'),
      '',
      ...lines,
      `${formatMoney(est.low, 'en')} – ${formatMoney(est.high, 'en')}`,
      '',
      form.name,
      form.email,
    ]
      .join('\n')
      .slice(0, 1500);
    return `mailto:${email}?subject=${encodeURIComponent(t('mailto.subject'))}&body=${encodeURIComponent(body)}`;
  }, [sections, est, email, form.name, form.email, t]);

  const onSubmit = async (honeypot: string) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setFailure(null);
    const result = await submitEstimate({
      locale,
      idempotencyKey: state.idempotencyKey,
      startedAtMs: state.startedAtMs,
      answers: schema,
      form,
      notes: form.details.trim() || undefined,
      timeline: state.timeline,
      honeypot,
    });
    inFlight.current = false;
    setSubmitting(false);
    if (result.ok) {
      clearStored();
      trackFunnel('estimate_submitted', {calculator: 'estimator', duplicate: result.duplicate});
      setOutcome({leadRef: result.leadRef, duplicate: result.duplicate, name: form.name.trim()});
    } else {
      setFailure({error: result.error, retryAfterSec: result.retryAfterSec});
    }
  };

  const restart = () => {
    clearStored();
    setOutcome(null);
    setFailure(null);
    setForm(EMPTY_FORM);
    started.current = false;
    dispatch({type: 'reset', now: Date.now(), key: newIdempotencyKey()});
    writeStep(1, 'push');
  };

  if (outcome) {
    return (
      <div aria-live="off">
        <SuccessView
          {...outcome}
          sections={sections}
          est={est}
          email={email}
          socials={socials}
          onRestart={restart}
        />
      </div>
    );
  }

  const showPanel = step !== 7;
  const needsType = step === TYPE_STEP && !hasTypes;
  const next = (
    <button
      type="button"
      aria-disabled={needsType}
      aria-describedby={needsType ? 'est-need-type' : undefined}
      onClick={() => {
        if (!needsType) go((step + 1) as StepNo);
      }}
      className={BTN_PRIMARY}
    >
      {step === 7 ? t('review.continue') : t('btn_next')}
      <ArrowIcon />
    </button>
  );

  return (
    <div className="grid gap-8 nav:grid-cols-[minmax(0,1fr)_400px] nav:items-start nav:gap-10">
      <div className="min-w-0 space-y-8 max-nav:pb-28">
        <div id="est-top" aria-hidden className="-mb-8 h-0" />
        <ProgressNav step={step} canLeaveType={hasTypes} typeStep={TYPE_STEP} onGo={go} />

        {state.restored && !state.interacted ? (
          <p className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card border border-border-card p-3 text-sm text-ink-2">
            {t('restored.note')}
            <button type="button" onClick={restart} className="min-h-11 font-semibold text-amber underline underline-offset-4">
              {t('start_over')}
            </button>
          </p>
        ) : null}

        <section aria-labelledby="est-step-h" className="glass rounded-panel p-5 nav:p-8">
          <h2
            id="est-step-h"
            ref={headingRef}
            tabIndex={-1}
            className="mb-6 font-display text-h3 font-semibold leading-tight text-ink outline-none"
          >
            {t(`flow.s${step}.title`)}
          </h2>
          {step === 1 && <GoalStep answers={answers} dispatch={dispatch} />}
          {step === 2 && <SizeStep answers={answers} dispatch={dispatch} />}
          {step === 3 && <TypeStep answers={answers} dispatch={dispatch} />}
          {step === 4 && <RequirementsStep answers={answers} dispatch={dispatch} />}
          {step === 5 && <DesignStep answers={answers} dispatch={dispatch} />}
          {step === 6 && <IntegrationsStep answers={answers} dispatch={dispatch} />}
          {step === 7 && <ReviewStep est={est} onGo={go} />}
          {step === 8 && (
            <SummaryStep
              sections={sections}
              est={est}
              form={form}
              setForm={setForm}
              submitting={submitting}
              failure={failure}
              mailto={mailto}
              onSubmit={onSubmit}
              onEdit={go}
            />
          )}
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
          {step < STEP_COUNT ? next : null}
        </div>
      </div>

      {showPanel ? (
        <aside aria-label={t('panel.title')} className="hidden nav:block print:hidden">
          <div className="glass sticky top-28 max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-panel p-6">
            <EstimatePanel est={est} hasTypes={hasTypes} />
          </div>
        </aside>
      ) : null}
      {showPanel ? <MobileSheet est={est} hasTypes={hasTypes} /> : null}

      <p role="status" aria-live="polite" className="sr-only">
        {stepNote}
      </p>
      <p role="status" aria-live="polite" className="sr-only">
        {liveNote}
      </p>
    </div>
  );
}
