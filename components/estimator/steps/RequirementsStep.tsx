'use client';

import type {Dispatch} from 'react';
import {visibleQuestions, type Question} from '@/lib/estimator/questions';
import type {FeatureId, ProjectType} from '@/lib/estimator/types';
import {isSelected, optionsFor, type Action, type Answers} from '../model';
import {local, useTx} from '../i18n';
import {Choice, Group} from '../ui';

const GRID = 'grid grid-cols-1 gap-3 nav:grid-cols-2';

/** Step 3: scope buckets + features, driven entirely by visibleQuestions(). */
export default function RequirementsStep({answers, dispatch}: {answers: Answers; dispatch: Dispatch<Action>}) {
  const t = useTx();
  const types = answers.types as ProjectType[];
  // the size card already fixes the page count; ask only when it is unset or "not sure"
  const askPages = !answers.size || answers.size === 'unsure';
  const questions = visibleQuestions({types}).filter(
    (q) => (q.step === 4 || q.step === 5) && (q.id !== 'pages' || askPages),
  );
  const scope = questions.filter((q) => q.step === 4);
  const features = questions.filter((q) => q.step === 5);

  const render = (q: Question) => {
    const options = optionsFor(q, types);
    if (q.kind === 'bucket') {
      const key = q.answerKey as 'pages' | 'productBucket' | 'rolesBucket';
      return (
        <Group key={q.id} legend={t(local(q.labelKey))} hint={t(local(q.hintKey ?? ''))}>
          <div className={GRID}>
            {options.map((o) => {
              const selected =
                key === 'pages' ? answers.pages === o.value : answers[key] === o.id;
              return (
                <Choice
                  key={o.id}
                  kind="radio"
                  name={q.id}
                  checked={selected}
                  onChange={() => dispatch({type: 'setBucket', key, value: key === 'pages' ? (o.value ?? 5) : o.id})}
                  label={t(local(o.labelKey))}
                />
              );
            })}
          </div>
        </Group>
      );
    }
    return (
      <Group key={q.id} legend={t(local(q.labelKey))} hint={t(local(q.hintKey ?? ''))}>
        <div className={GRID}>
          {options.map((o) => (
            <Choice
              key={o.id}
              kind="checkbox"
              name={q.id}
              checked={isSelected(answers, 'features', o.id)}
              onChange={() => dispatch({type: 'toggleList', key: 'features', id: o.id as FeatureId})}
              label={t(local(o.labelKey))}
            />
          ))}
        </div>
      </Group>
    );
  };

  return (
    <div className="space-y-10">
      {scope.length > 0 ? (
        <section aria-labelledby="est-scope" className="space-y-6">
          <h3 id="est-scope" className="u-mono font-mono text-xs uppercase tracking-[0.2em] text-amber">
            {t('step.4.title')}
          </h3>
          {scope.map(render)}
        </section>
      ) : null}
      {features.length > 0 ? (
        <section aria-labelledby="est-features" className="space-y-6">
          <h3 id="est-features" className="u-mono font-mono text-xs uppercase tracking-[0.2em] text-amber">
            {t('step.5.title')}
          </h3>
          {features.map(render)}
        </section>
      ) : null}
    </div>
  );
}
