// Business-context answers (step 2). The strict estimator schema cannot carry
// them and they are not priced, so they travel as a text prefix of
// contact.notes. Labels are English: the team reads them in the lead email.

import {NOTES_MAX, type BusinessContext} from './model';

export const INDUSTRIES = ['retail', 'food', 'services', 'health', 'education', 'realestate', 'tech', 'nonprofit', 'other'] as const;
export const SIZES = ['solo', 's2_10', 's11_50', 's50_plus'] as const;
export const GOALS = ['leads', 'sales', 'automation', 'brand', 'internal'] as const;

const EN: Record<string, string> = {
  retail: 'Retail & e-commerce',
  food: 'Food & hospitality',
  services: 'Professional services',
  health: 'Health & wellness',
  education: 'Education',
  realestate: 'Real estate',
  tech: 'Technology',
  nonprofit: 'Non-profit',
  other: 'Other',
  solo: 'Just me',
  s2_10: '2–10 people',
  s11_50: '11–50 people',
  s50_plus: '50+ people',
  leads: 'Get more leads',
  sales: 'Sell online',
  automation: 'Automate operations',
  brand: 'Build the brand',
  internal: 'Internal tool',
};

const inList = (list: readonly string[], v?: string): string | undefined =>
  v && list.includes(v) ? v : undefined;

/** Validated context (unknown ids dropped). */
export function cleanContext(c: BusinessContext): BusinessContext {
  return {industry: inList(INDUSTRIES, c.industry), size: inList(SIZES, c.size), goal: inList(GOALS, c.goal)};
}

/** `contact.notes` text: business context first, then the visitor's own details. */
export function buildNotes(context: BusinessContext, details: string): string | undefined {
  const c = cleanContext(context);
  const lines: string[] = [];
  if (c.industry) lines.push(`Industry: ${EN[c.industry]}`);
  if (c.size) lines.push(`Team size: ${EN[c.size]}`);
  if (c.goal) lines.push(`Main goal: ${EN[c.goal]}`);
  const own = details.trim().slice(0, NOTES_MAX);
  const text = [lines.join('\n'), own].filter(Boolean).join('\n\n');
  return text ? text.slice(0, 2000) : undefined;
}
