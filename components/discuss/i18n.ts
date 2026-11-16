'use client';

import {useTranslations} from 'next-intl';

/** Loosely-typed translator for the dynamic `discuss.*` keys (ids come from the engine option arrays). */
export type Tx = (key: string, values?: Record<string, string | number>) => string;

export function useTx(): Tx {
  return useTranslations('discuss') as unknown as Tx;
}
