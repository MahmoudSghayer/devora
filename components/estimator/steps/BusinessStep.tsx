'use client';

import type {Dispatch} from 'react';
import type {Action, BusinessContext} from '../model';
import {useTx} from '../i18n';
import {GOALS, INDUSTRIES, SIZES, cleanContext} from '../notes';
import {Choice, FIELD, Field, Group} from '../ui';

export default function BusinessStep({context, dispatch}: {context: BusinessContext; dispatch: Dispatch<Action>}) {
  const t = useTx();
  const c = cleanContext(context);
  return (
    <div className="space-y-8">
      <p className="text-sm text-muted">{t('biz.hint')}</p>

      <Field label={t('biz.industry.label')} optionalText={t('optional')}>
        {({id, describedBy}) => (
          <select
            id={id}
            aria-describedby={describedBy}
            className={FIELD}
            value={c.industry ?? ''}
            onChange={(e) => dispatch({type: 'setContext', key: 'industry', value: e.target.value})}
          >
            <option value="">{t('biz.select')}</option>
            {INDUSTRIES.map((id2) => (
              <option key={id2} value={id2}>
                {t(`biz.industry.opt.${id2}`)}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Group legend={t('biz.size.label')} hint={t('optional')}>
        <div className="grid grid-cols-1 gap-3 min-[560px]:grid-cols-2">
          {SIZES.map((id) => (
            <Choice
              key={id}
              kind="radio"
              name="size"
              checked={c.size === id}
              onChange={() => dispatch({type: 'setContext', key: 'size', value: id})}
              label={t(`biz.size.opt.${id}`)}
            />
          ))}
        </div>
      </Group>

      <Group legend={t('biz.goal.label')} hint={t('optional')}>
        <div className="grid grid-cols-1 gap-3 min-[560px]:grid-cols-2">
          {GOALS.map((id) => (
            <Choice
              key={id}
              kind="radio"
              name="goal"
              checked={c.goal === id}
              onChange={() => dispatch({type: 'setContext', key: 'goal', value: id})}
              label={t(`biz.goal.opt.${id}`)}
            />
          ))}
        </div>
      </Group>
    </div>
  );
}
