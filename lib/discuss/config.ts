// Discovery-flow constants. Prices come from ESTIMATOR_CONFIG; only the budget
// bands and the "typical starting range" factors live here.
import type {DiscussConfig} from './types';

export const DISCUSS_CONFIG: DiscussConfig = {
  // Budget cards (ILS). 'unsure' never compares.
  budgetBands: {
    lt15k: {min: 0, max: 15000},
    '15-30k': {min: 15000, max: 30000},
    '30-60k': {min: 30000, max: 60000},
    '60k+': {min: 60000, max: null},
    unsure: {min: 0, max: null},
  },
  // Starting range = subtotal x [0.9, 1.2], rounded to 500 (same spread as the website estimator).
  startingRange: {lowFactor: 0.9, highFactor: 1.2, roundTo: 500},
};
