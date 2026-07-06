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
