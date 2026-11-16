'use client';

import type {Dispatch} from 'react';
import {PROJECT_TYPES, type ProjectType} from '@/lib/estimator/types';
import {suggestedTypes, type Action, type Answers} from '../model';
import {useTx} from '../i18n';
import {TypeIcon} from '../icons';
import {Choice, Group} from '../ui';

export default function TypeStep({answers, dispatch}: {answers: Answers; dispatch: Dispatch<Action>}) {
  const t = useTx();
  const needs = answers.types.length === 0;
  const suggested = suggestedTypes(answers.goals);
  return (
    <Group legend={t('q.types.label')} hint={t('q.types.hint')} hideLegend>
      <div className="grid gap-3 grid-cols-1 nav:grid-cols-2">
        {PROJECT_TYPES.map((id: ProjectType) => (
          <Choice
            key={id}
            kind="checkbox"
            name="types"
            checked={answers.types.includes(id)}
            onChange={() => dispatch({type: 'toggleType', id})}
            label={t(`q.types.opt.${id}`)}
            hint={suggested.includes(id) ? t('step3.suggested') : undefined}
            icon={<TypeIcon id={id} />}
          />
        ))}
      </div>
      {needs ? (
        <p id="est-need-type" className="mt-4 text-sm font-medium text-ink-2">
          {t('step3.need')}
        </p>
      ) : null}
    </Group>
  );
}
