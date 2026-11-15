'use client';

import type {Dispatch} from 'react';
import {SIZE_OPTIONS} from '@/lib/estimator/questions';
import type {Action, Answers} from '../model';
import {local, useTx} from '../i18n';
import {Choice, Group} from '../ui';

export default function SizeStep({answers, dispatch}: {answers: Answers; dispatch: Dispatch<Action>}) {
  const t = useTx();
  return (
    <Group legend={t('q.size.label')} hint={t('q.size.hint')} hideLegend>
      <p className="mb-4 text-sm text-muted">{t('q.size.hint')}</p>
      <div className="grid grid-cols-1 gap-3 nav:grid-cols-2">
        {SIZE_OPTIONS.map((o) => (
          <Choice
            key={o.id}
            kind="radio"
            name="size"
            checked={answers.size === o.id}
            onChange={() => dispatch({type: 'setSize', id: o.id})}
            label={t(local(o.i18nKey))}
          />
        ))}
      </div>
    </Group>
  );
}
