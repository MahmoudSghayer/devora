import {z} from 'zod';
import {estimatorAnswersSchema} from '@/lib/estimator/schema';
import {roiAnswersSchema} from '@/lib/roi/schema';

// Request envelope for POST /api/estimate, /api/automation-roi and
// /api/contact. Strict: unknown keys are rejected; every string/array/number is
// bounded. NOTE: no real field may be called `website` — that name is the
// honeypot bots fill in.

const contactBlock = z.strictObject({
  name: z.string().trim().min(1).max(120),
  businessName: z.string().trim().max(160).optional(),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  phone: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(2000).optional(),
  preferredContact: z.enum(['email', 'phone', 'whatsapp']).default('email'),
  consent: z.literal(true),
});

const timelineEntry = z.strictObject({
  step: z.string().trim().min(1).max(64),
  tsMs: z.number().int().min(0).max(4_102_444_800_000),
});

const utmSchema = z
  .record(z.string().max(40), z.string().max(200))
  .refine((o) => Object.keys(o).length <= 10, 'too many utm keys');

export const contactAnswersSchema = z.strictObject({
  message: z.string().trim().min(1).max(4000),
  budget: z.string().trim().max(120).optional(),
});
export type ContactAnswers = z.infer<typeof contactAnswersSchema>;

const base = {
  /** Client-generated UUID, one per calculator session (idempotency). */
  idempotencyKey: z.uuid(),
  locale: z.enum(['en', 'ar']).default('en'),
  contact: contactBlock,
  /** Step timeline ({step, tsMs}) recorded by the UI for the funnel. */
  timeline: z.array(timelineEntry).max(60).default([]),
  /** Epoch ms when the visitor started the calculator / opened the form. */
  startedAtMs: z.number().int().min(0).max(4_102_444_800_000).optional(),
  /** Honeypot — must stay empty. */
  website: z.string().max(500).optional(),
  utm: utmSchema.optional(),
  /**
   * Whatever the browser displayed as its result. ACCEPTED BUT IGNORED — the
   * server always recomputes from `answers`.
   */
  result: z.record(z.string().max(64), z.unknown()).optional(),
};

export const envelopeSchema = z.discriminatedUnion('source', [
  z.strictObject({
    ...base,
    source: z.literal('website_estimate'),
    answers: estimatorAnswersSchema,
  }),
  z.strictObject({
    ...base,
    source: z.literal('automation_roi'),
    answers: roiAnswersSchema,
  }),
  z.strictObject({
    ...base,
    source: z.literal('contact'),
    idempotencyKey: z.uuid().optional(),
    answers: contactAnswersSchema,
  }),
]);

export type Envelope = z.infer<typeof envelopeSchema>;
