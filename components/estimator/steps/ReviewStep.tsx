'use client';

import type {EstimateResult} from '@/lib/estimator/types';
import type {StepNo} from '../model';
import EstimatePanel from '../EstimatePanel';
import {useTx} from '../i18n';
import {BTN_GHOST} from '../ui';

const EDITABLE: readonly StepNo[] = [1, 2, 3, 4, 5, 6];

/** Step 6: the full live estimate in the main column, with shortcuts back to each input step. */
export default function ReviewStep({est, onGo}: {est: EstimateResult; onGo: (s: StepNo) => void}) {
  const t = useTx();
  return (
    <div className="space-y-8">
      <p className="text-sm leading-relaxed text-muted">{t('review.intro')}</p>
      <div className="glass rounded-panel p-5 nav:p-8">
        <EstimatePanel est={est} hasTypes headingLevel={3} />
      </div>
      <div>
        <h3 className="mb-3 text-sm font-medium text-ink-2">{t('review.edit')}</h3>
        <ul className="flex flex-wrap gap-3">
          {EDITABLE.map((n) => (
            <li key={n}>
              <button type="button" onClick={() => onGo(n)} className={BTN_GHOST}>
                {t(`flow.s${n}.short`)}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
