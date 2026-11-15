'use client';

import {useTranslations} from 'next-intl';

/** Loosely-typed translator for the dynamic `estimator.*` keys (ids come from the engine). */
export type Tx = (key: string, values?: Record<string, string | number>) => string;

export function useTx(): Tx {
  return useTranslations('estimator') as unknown as Tx;
}

/** Engine label keys are written `estimator.q.…`; the namespace is already bound. */
export const local = (key: string): string => key.replace(/^estimator\./, '');
