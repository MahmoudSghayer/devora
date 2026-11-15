'use client';

import type {Dispatch} from 'react';
import {PROJECT_TYPES, type ProjectType} from '@/lib/estimator/types';
import type {Action, Answers} from '../model';
import {useTx} from '../i18n';
import {TypeIcon} from '../icons';
import {Choice, Group} from '../ui';

export default function TypeStep({answers, dispatch}: {answers: Answers; dispatch: Dispatch<Action>}) {
  const t = useTx();
  const needs = answers.types.length === 0;
  return (
    <Group legend={t('q.types.label')} hint={t('q.types.hint')} hideLegend>
      <p className="mb-4 text-sm text-muted">{t('q.types.hint')}</p>
      <div className="grid gap-3 grid-cols-1 min-[560px]:grid-cols-2">
        {PROJECT_TYPES.map((id: ProjectType) => (
          <Choice
            key={id}
            kind="checkbox"
            name="types"
            checked={answers.types.includes(id)}
            onChange={() => dispatch({type: 'toggleType', id})}
            label={t(`q.types.opt.${id}`)}
            icon={<TypeIcon id={id} />}
          />
        ))}
      </div>
      {needs ? (
        <p id="est-need-type" className="mt-4 text-sm font-medium text-ink-2">
          {t('step1.need')}
        </p>
      ) : null}
    </Group>
  );
}
