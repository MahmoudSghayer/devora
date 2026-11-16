// Types for the software-discovery ("discuss") flow. Pure TS.

import type {EstimateResult} from '@/lib/estimator/types';

export const PURPOSE_OPTIONS = [
  'replace-spreadsheets',
  'run-operations',
  'customer-portal',
  'internal-dashboard',
  'ai-tool',
  'connect-tools',
  'other',
] as const;
export type Purpose = (typeof PURPOSE_OPTIONS)[number];

export const USERS_OPTIONS = ['me', 'team-2-10', 'team-10-50', 'customers', 'team-and-customers'] as const;
export type Users = (typeof USERS_OPTIONS)[number];

export const TODAY_OPTIONS = ['spreadsheets', 'off-the-shelf', 'disconnected-tools', 'nothing'] as const;
export type Today = (typeof TODAY_OPTIONS)[number];

export const INTEGRATIONS_OPTIONS = ['none', 'one-two', 'many', 'unsure'] as const;
export type IntegrationsLevel = (typeof INTEGRATIONS_OPTIONS)[number];

export const MUST_HAVE_OPTIONS = [
  'auth-roles',
  'payments',
  'dashboards',
  'notifications',
  'mobile',
  'ai-assistant',
  'bilingual',
] as const;
export type MustHave = (typeof MUST_HAVE_OPTIONS)[number];

export const TIMELINE_OPTIONS = ['lt-1m', '1-3m', '3-6m', 'flexible'] as const;
export type Timeline = (typeof TIMELINE_OPTIONS)[number];

export const BUDGET_OPTIONS = ['lt3k', '3-7k', '7-15k', '15k+', 'unsure'] as const;
export type Budget = (typeof BUDGET_OPTIONS)[number];

export type BudgetFit = 'below' | 'within' | 'above' | 'unknown';

export interface DiscussResult {
  estimate: EstimateResult;
  /** typical starting range, rounded to ₪100 — indicative, not a quotation */
  startingLow: number;
  startingHigh: number;
  budgetFit: BudgetFit;
  /** timeline in weeks (from the estimate) */
  weeks: {low: number; high: number};
  maintenanceMonthly: number;
  /** English assumptions, shown to the visitor and in team emails */
  assumptions: string[];
  configVersion: string;
}

export interface DiscussConfig {
  /** budget band → ILS range (max null = open-ended, min null = none) */
  budgetBands: Record<Budget, {min: number; max: number | null}>;
  /** starting range = subtotal × these factors, rounded to roundTo */
  startingRange: {lowFactor: number; highFactor: number; roundTo: number};
}
