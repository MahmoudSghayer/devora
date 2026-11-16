// Discovery-flow constants. Prices come from ESTIMATOR_CONFIG; only the budget
// bands live here. The starting range reuses the estimator's range factors, so
// the two flows always quote the same spread.
import {ESTIMATOR_CONFIG} from '@/lib/pricing/config';
import type {DiscussConfig} from './types';

/** Budget card boundaries (ILS): under B1 / B1–B2 / B2–B3 / B3 and over. */
export const DISCUSS_BUDGET_BOUNDS = [3000, 7000, 15000] as const;
const [B1, B2, B3] = DISCUSS_BUDGET_BOUNDS;

export const DISCUSS_CONFIG: DiscussConfig = {
  // 'unsure' never compares.
  budgetBands: {
    lt3k: {min: 0, max: B1},
    '3-7k': {min: B1, max: B2},
    '7-15k': {min: B2, max: B3},
    '15k+': {min: B3, max: null},
    unsure: {min: 0, max: null},
  },
  startingRange: ESTIMATOR_CONFIG.range,
};
