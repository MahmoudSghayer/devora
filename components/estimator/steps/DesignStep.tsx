'use client';

import type {Dispatch} from 'react';
import {visibleQuestions} from '@/lib/estimator/questions';
import {DESIGN_KEYS, type Action, type Answers, type DesignKey} from '../model';
import {local, useTx} from '../i18n';
import {Group, SwitchRow} from '../ui';

export default function DesignStep({answers, dispatch}: {answers: Answers; dispatch: Dispatch<Action>}) {
  const t = useTx();
  const questions = visibleQuestions({types: answers.types}).filter((q) => q.step === 6);
  return (
    <Group legend={t('design.legend')} hint={t('design.hint')}>
      <div className="space-y-3">
        {questions.map((q) => {
          const key = q.answerKey.replace('design.', '') as DesignKey;
          if (!DESIGN_KEYS.includes(key)) return null;
          return (
            <SwitchRow
              key={q.id}
              checked={Boolean(answers.design[key])}
              onChange={() => dispatch({type: 'setDesign', key, value: !answers.design[key]})}
              label={t(local(q.labelKey))}
              hint={t(local(q.hintKey ?? ''))}
              onText={t('on')}
              offText={t('off')}
            />
          );
        })}
      </div>
    </Group>
  );
}
