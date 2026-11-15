import {z} from 'zod';
import {
  BUDGET_OPTIONS,
  INTEGRATIONS_OPTIONS,
  MUST_HAVE_OPTIONS,
  PURPOSE_OPTIONS,
  TIMELINE_OPTIONS,
  TODAY_OPTIONS,
  USERS_OPTIONS,
} from './types';

export {
  BUDGET_OPTIONS,
  INTEGRATIONS_OPTIONS,
  MUST_HAVE_OPTIONS,
  PURPOSE_OPTIONS,
  TIMELINE_OPTIONS,
  TODAY_OPTIONS,
  USERS_OPTIONS,
};

/**
 * Software-discovery answers (all option-based). Free text is NOT part of the
 * answers; it travels in the contact `notes` field. Strict and bounded.
 */
export const discussAnswersSchema = z.strictObject({
  purpose: z.array(z.enum(PURPOSE_OPTIONS)).min(1).max(PURPOSE_OPTIONS.length),
  users: z.enum(USERS_OPTIONS).optional(),
  today: z.enum(TODAY_OPTIONS).optional(),
  integrations: z.enum(INTEGRATIONS_OPTIONS).optional(),
  mustHaves: z.array(z.enum(MUST_HAVE_OPTIONS)).max(MUST_HAVE_OPTIONS.length).optional(),
  timeline: z.enum(TIMELINE_OPTIONS).optional(),
  budget: z.enum(BUDGET_OPTIONS).optional(),
});

export type DiscussAnswers = z.infer<typeof discussAnswersSchema>;
