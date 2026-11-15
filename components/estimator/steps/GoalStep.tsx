'use client';

import type {Dispatch} from 'react';
import {GOAL_OPTIONS} from '@/lib/estimator/questions';
import type {Action, Answers} from '../model';
import {local, useTx} from '../i18n';
import {Choice, Group} from '../ui';

export default function GoalStep({answers, dispatch}: {answers: Answers; dispatch: Dispatch<Action>}) {
  const t = useTx();
  return (
    <Group legend={t('q.goals.label')} hint={t('q.goals.hint')} hideLegend>
      <div className="grid grid-cols-1 gap-3 nav:grid-cols-2">
        {GOAL_OPTIONS.map((g) => (
          <Choice
            key={g.id}
            kind="checkbox"
            name="goals"
            checked={answers.goals.includes(g.id)}
            onChange={() => dispatch({type: 'toggleGoal', id: g.id})}
            label={t(local(g.i18nKey))}
          />
        ))}
      </div>
    </Group>
  );
}
