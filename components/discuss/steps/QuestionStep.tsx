'use client';

import type {Dispatch} from 'react';
import {useLocale} from 'next-intl';
import type {Purpose} from '@/lib/discuss/types';
import {QUESTIONS, type Action, type Answers, type StepNo} from '../model';
import {useTx} from '../i18n';
import {PurposeIcon} from '../icons';
import {optionLabel} from '../labels';
import {Choice, Group} from '../ui';

function selectedOf(answers: Answers, id: string): string[] {
  const v = (answers as unknown as Record<string, string | string[] | undefined>)[id];
  return Array.isArray(v) ? v : v ? [v] : [];
}

/** Steps 1–7: one option-card group (radio for single, checkbox for multi). */
export default function QuestionStep({step, answers, dispatch}: {step: StepNo; answers: Answers; dispatch: Dispatch<Action>}) {
  const t = useTx();
  const locale = useLocale();
  const q = QUESTIONS[step - 1];
  const selected = selectedOf(answers, q.id);
  const needs = q.id === 'purpose' && selected.length === 0;
  const hint = `${t(`q.${q.id}.hint`)}${q.id !== 'purpose' ? ` ${t('optional_step')}` : ''}`;
  return (
    <Group legend={t(`q.${q.id}.title`)} hint={hint} hideLegend>
      <div className="grid grid-cols-1 gap-3 nav:grid-cols-2">
        {q.options.map((id) => (
          <Choice
            key={id}
            kind={q.multi ? 'checkbox' : 'radio'}
            name={q.id}
            value={id}
            checked={selected.includes(id)}
            onChange={() =>
              q.multi
                ? dispatch({type: 'toggle', question: q.id as 'purpose' | 'mustHaves', id})
                : dispatch({type: 'set', question: q.id as 'users', id})
            }
            label={optionLabel(t, locale, q.id, id)}
            icon={q.id === 'purpose' ? <PurposeIcon id={id as Purpose} /> : undefined}
          />
        ))}
      </div>
      {needs ? (
        <p id="dsc-need" className="mt-4 text-sm font-medium text-ink-2">
          {t('step1.need')}
        </p>
      ) : null}
    </Group>
  );
}
