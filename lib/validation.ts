import {z} from 'zod';

// Server-side schema (used by the API route).
export const contactSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  company: z.string().trim().optional(),
  budget: z.string().trim().optional(),
  details: z.string().trim().min(1),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactErrorKey = 'err_name' | 'err_email' | 'err_details';

// Lightweight client validator → maps required/format failures to i18n keys so
// messages localize. Mirrors the required fields in contactSchema.
export function validateContact(values: {
  name?: string;
  email?: string;
  details?: string;
}): Partial<Record<'name' | 'email' | 'details', ContactErrorKey>> {
  const errors: Partial<Record<'name' | 'email' | 'details', ContactErrorKey>> = {};
  if (!values.name?.trim()) errors.name = 'err_name';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((values.email ?? '').trim()))
    errors.email = 'err_email';
  if (!values.details?.trim()) errors.details = 'err_details';
  return errors;
}

// ── Chat / conversation ─────────────────────────────────────────────────────

const localeSchema = z.enum(['en', 'ar']);

export const conversationCreateSchema = z.object({
  locale: localeSchema.default('en'),
  firstPage: z.string().trim().max(512).optional(),
});

// A single prior turn the client may echo back — used ONLY as a fallback for
// conversation memory when Supabase isn't configured (local preview). Ignored
// in production, where the DB is the authoritative history.
const clientTurnSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(4000),
});

export const chatMessageSchema = z.object({
  conversationId: z.string().uuid(),
  token: z.string().uuid(),
  message: z.string().trim().min(1).max(2000),
  locale: localeSchema.optional(),
  clientHistory: z.array(clientTurnSchema).max(40).optional(),
});

export type ConversationCreateInput = z.infer<typeof conversationCreateSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

// ── Lead / support request (Phase 2) ────────────────────────────────────────

export const leadSchema = z.object({
  conversationId: z.string().uuid().optional(),
  token: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(120).optional(),
  request: z.string().trim().min(1).max(4000),
  recommendedPackage: z.enum(['launch', 'studio', 'growth']).optional(),
  locale: localeSchema.default('en'),
  // Honeypot — must stay empty (bots fill it). Not persisted.
  website: z.string().trim().max(0).optional(),
});

export const supportRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  token: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).optional(),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(4000),
  locale: localeSchema.default('en'),
  website: z.string().trim().max(0).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;
export type SupportRequestInput = z.infer<typeof supportRequestSchema>;

export type LeadErrorKey = 'err_name' | 'err_email' | 'err_request';

// Client-side lead validator → i18n keys (mirrors leadSchema required fields).
export function validateLead(values: {
  name?: string;
  email?: string;
  request?: string;
}): Partial<Record<'name' | 'email' | 'request', LeadErrorKey>> {
  const errors: Partial<Record<'name' | 'email' | 'request', LeadErrorKey>> = {};
  if (!values.name?.trim()) errors.name = 'err_name';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((values.email ?? '').trim()))
    errors.email = 'err_email';
  if (!values.request?.trim()) errors.request = 'err_request';
  return errors;
}
