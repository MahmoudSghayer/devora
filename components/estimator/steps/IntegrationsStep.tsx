'use client';

import type {Dispatch} from 'react';
import {visibleQuestions} from '@/lib/estimator/questions';
import type {IntegrationId} from '@/lib/estimator/types';
import {isSelected, type Action, type Answers} from '../model';
import {local, useTx} from '../i18n';
import {Choice, Group} from '../ui';

export default function IntegrationsStep({answers, dispatch}: {answers: Answers; dispatch: Dispatch<Action>}) {
  const t = useTx();
  const q = visibleQuestions({types: answers.types}).find((x) => x.id === 'integrations');
  if (!q) return null;
  return (
    <Group legend={t(local(q.labelKey))} hint={t(local(q.hintKey ?? ''))}>
      <div className="grid grid-cols-1 gap-3 min-[560px]:grid-cols-2">
        {(q.options ?? []).map((o) => (
          <Choice
            key={o.id}
            kind="checkbox"
            name="integrations"
            checked={isSelected(answers, 'integrations', o.id)}
            onChange={() => dispatch({type: 'toggleList', key: 'integrations', id: o.id as IntegrationId})}
            label={t(local(o.labelKey))}
          />
        ))}
      </div>
    </Group>
  );
}
