import {z} from 'zod';
import {
  FEATURE_IDS,
  GOAL_IDS,
  SIZE_IDS,
  INTEGRATION_IDS,
  PRODUCT_BUCKETS,
  PROJECT_TYPES,
  ROLE_BUCKETS,
} from './types';

/**
 * Validates estimator answers coming from the browser. Strict: unknown keys
 * are rejected and every string/array/number is bounded.
 */
export const estimatorAnswersSchema = z.strictObject({
  types: z.array(z.enum(PROJECT_TYPES)).min(1).max(PROJECT_TYPES.length),
  /** what the visitor wants the project to achieve (multi-select cards) */
  goals: z.array(z.enum(GOAL_IDS)).max(GOAL_IDS.length).optional(),
  /** site-size card; mapped to a page count when `pages` is absent */
  size: z.enum(SIZE_IDS).optional(),
  /** total pages (business sites) */
  pages: z.number().int().min(1).max(200).optional(),
  productBucket: z.enum(PRODUCT_BUCKETS).optional(),
  rolesBucket: z.enum(ROLE_BUCKETS).optional(),
  /** free-text problem description (not priced) */
  problem: z.string().max(1500).optional(),
  features: z.array(z.enum(FEATURE_IDS)).max(FEATURE_IDS.length * 2).optional(),
  integrations: z.array(z.enum(INTEGRATION_IDS)).max(INTEGRATION_IDS.length * 2).optional(),
  design: z
    .strictObject({
      existing: z.boolean().optional(),
      brandIdentity: z.boolean().optional(),
      advancedMotion: z.boolean().optional(),
      premium: z.boolean().optional(),
    })
    .optional(),
});

export type EstimatorAnswers = z.infer<typeof estimatorAnswersSchema>;
