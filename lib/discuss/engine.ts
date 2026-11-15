// Software-discovery engine: maps option answers onto EstimatorAnswers and runs
// the existing estimator. Indicative only. See docs/discuss-flow.md.

import {estimateProject} from '@/lib/estimator/engine';
import type {EstimatorAnswers} from '@/lib/estimator/schema';
import type {FeatureId, IntegrationId, ProjectType, RoleBucket} from '@/lib/estimator/types';
import {DISCUSS_CONFIG} from './config';
import type {DiscussAnswers} from './schema';
import type {Budget, BudgetFit, DiscussConfig, DiscussResult, MustHave, Purpose, Users} from './types';

const ROLES: Record<Users, RoleBucket> = {
  me: 'one',
  'team-2-10': 'few',
  'team-10-50': 'many',
  customers: 'few',
  'team-and-customers': 'many',
};

const MUST_HAVE_FEATURE: Partial<Record<MustHave, FeatureId>> = {
  'auth-roles': 'auth',
  payments: 'payments',
  dashboards: 'dashboards',
  'ai-assistant': 'aiFeatures',
  bilingual: 'multilingual',
};

const PURPOSE_FEATURE: Partial<Record<Purpose, FeatureId[]>> = {
  'replace-spreadsheets': ['database'],
  'run-operations': ['database', 'adminDashboard'],
  'customer-portal': ['auth'],
  'internal-dashboard': ['dashboards'],
  'ai-tool': ['aiFeatures'],
  'connect-tools': ['apiIntegrations'],
};

const WEBAPP_PURPOSES: readonly Purpose[] = ['replace-spreadsheets', 'run-operations', 'ai-tool', 'connect-tools', 'other'];

function baseTypes(purpose: readonly Purpose[]): ProjectType[] {
  // One custom web app already covers portal/dashboard scope; combine only when nothing app-like is chosen.
  if (purpose.some((p) => WEBAPP_PURPOSES.includes(p))) return ['webapp'];
  const out: ProjectType[] = [];
  if (purpose.includes('customer-portal')) out.push('portal');
  if (purpose.includes('internal-dashboard')) out.push('dashboard');
  return out.length > 0 ? out : ['webapp'];
}

/** Map discovery answers to estimator answers (exported for tests / UIs). */
export function discussToEstimatorAnswers(a: DiscussAnswers): EstimatorAnswers {
  const types = baseTypes(a.purpose);
  const features = new Set<FeatureId>();
  for (const p of a.purpose) for (const f of PURPOSE_FEATURE[p] ?? []) features.add(f);
  for (const m of a.mustHaves ?? []) {
    const f = MUST_HAVE_FEATURE[m];
    if (f) features.add(f);
  }
  const integrations = new Set<IntegrationId>();
  if (a.integrations === 'one-two' || a.integrations === 'unsure') integrations.add('thirdPartyApi');
  if (a.integrations === 'many') {
    integrations.add('thirdPartyApi');
    features.add('apiIntegrations');
  }
  // Notifications are priced through the nearest integration (email automation).
  if (a.mustHaves?.includes('notifications')) integrations.add('emailAutomation');

  const out: EstimatorAnswers = {types, features: [...features], integrations: [...integrations]};
  if (a.users) out.rolesBucket = ROLES[a.users];
  return out;
}

const ceilTo = (n: number, s: number) => Math.ceil(n / s) * s;
const floorTo = (n: number, s: number) => Math.floor(n / s) * s;

export function budgetFit(budget: Budget | undefined, low: number, high: number, c: DiscussConfig = DISCUSS_CONFIG): BudgetFit {
  if (!budget || budget === 'unsure') return 'unknown';
  const band = c.budgetBands[budget];
  if (band.max !== null && band.max < low) return 'below';
  if (band.min > high) return 'above';
  return 'within';
}

function assumptionsFor(a: DiscussAnswers, weeksHigh: number): string[] {
  const out = ['Indicative starting range for a custom web app, not a quotation; scope is confirmed in a discovery call.'];
  if (a.today === 'spreadsheets') out.push('Existing spreadsheets are imported once into the new system.');
  if (a.today === 'disconnected-tools') out.push('Current tools stay in place and are connected where they have an API.');
  if (a.today === 'off-the-shelf') out.push('Data is migrated from your current off-the-shelf tool where an export exists.');
  if (a.mustHaves?.includes('mobile')) out.push('Mobile-friendly responsive interface is included; native mobile apps are quoted separately.');
  if (a.mustHaves?.includes('notifications')) out.push('Notifications are priced as email automation; SMS/WhatsApp are extra.');
  if (a.integrations === 'unsure') out.push('Integrations are not yet defined; one third-party integration is assumed.');
  if (a.integrations === 'many') out.push('Several integrations are assumed; each additional system may add cost.');
  if (a.timeline === 'lt-1m' && weeksHigh > 4) out.push('The requested timeline is shorter than the typical delivery time; scope may need to be phased.');
  if (a.timeline === '1-3m' && weeksHigh > 13) out.push('The typical delivery time is longer than three months; scope may need to be phased.');
  return out;
}

/** Estimate a software project from discovery answers. Indicative, not a quotation. */
export function estimateDiscuss(answers: DiscussAnswers, config: DiscussConfig = DISCUSS_CONFIG): DiscussResult {
  const estimate = estimateProject(discussToEstimatorAnswers(answers));
  const r = config.startingRange;
  const startingLow = Math.max(0, floorTo(estimate.subtotal * r.lowFactor, r.roundTo));
  const startingHigh = ceilTo(estimate.subtotal * r.highFactor, r.roundTo);
  return {
    estimate,
    startingLow,
    startingHigh,
    budgetFit: budgetFit(answers.budget, startingLow, startingHigh, config),
    weeks: {low: estimate.weeksLow, high: estimate.weeksHigh},
    maintenanceMonthly: estimate.maintenanceMonthly,
    assumptions: assumptionsFor(answers, estimate.weeksHigh),
    configVersion: estimate.configVersion,
  };
}
