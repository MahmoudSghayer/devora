import {formatMoney} from '@/lib/pricing/config';
import {DISCUSS_CONFIG} from '@/lib/discuss/config';
import type {
  Budget,
  BudgetFit,
  IntegrationsLevel,
  MustHave,
  Purpose,
  Timeline,
  Today,
  Users,
} from '@/lib/discuss/types';

// English labels for the software-discovery answers (team emails + admin UI).
// Pure module — safe to import from client components.

export const PURPOSE_LABEL: Record<Purpose, string> = {
  'replace-spreadsheets': 'Replace spreadsheets and manual processes',
  'run-operations': 'Run day-to-day operations',
  'customer-portal': 'A portal or app for customers',
  'internal-dashboard': 'An internal dashboard or admin tool',
  'ai-tool': 'An AI-powered tool',
  'connect-tools': 'Connect the tools we already use',
  other: 'Something else',
};
export const USERS_LABEL: Record<Users, string> = {
  me: 'Just me',
  'team-2-10': 'A small team (2–10 people)',
  'team-10-50': 'A larger team (10–50 people)',
  customers: 'Our customers',
  'team-and-customers': 'Our team and our customers',
};
export const TODAY_LABEL: Record<Today, string> = {
  spreadsheets: 'Spreadsheets and email',
  'off-the-shelf': 'Off-the-shelf software that does not fit',
  'disconnected-tools': 'Several disconnected tools',
  nothing: 'Nothing yet — starting from scratch',
};
export const INTEGRATIONS_LABEL: Record<IntegrationsLevel, string> = {
  none: 'No integrations',
  'one-two': 'One or two integrations',
  many: 'Many integrations',
  unsure: 'Not sure yet',
};
export const MUST_HAVE_LABEL: Record<MustHave, string> = {
  'auth-roles': 'Logins and user roles',
  payments: 'Online payments',
  dashboards: 'Dashboards and reports',
  notifications: 'Notifications (email / SMS / WhatsApp)',
  mobile: 'Mobile-friendly or mobile app',
  'ai-assistant': 'AI assistant',
  bilingual: 'Bilingual (Arabic / English)',
};
export const TIMELINE_LABEL: Record<Timeline, string> = {
  'lt-1m': 'Under 1 month',
  '1-3m': '1–3 months',
  '3-6m': '3–6 months',
  flexible: 'Flexible',
};
export const BUDGET_LABEL = ((): Record<Budget, string> => {
  const bands = DISCUSS_CONFIG.budgetBands;
  const m = (n: number) => formatMoney(n, 'en');
  const label = (id: Budget): string => {
    if (id === 'unsure') return 'Not sure yet';
    const {min, max} = bands[id];
    if (max === null) return `Over ${m(min)}`;
    return min === 0 ? `Under ${m(max)}` : `${m(min)}–${m(max)}`;
  };
  return Object.fromEntries(
    (Object.keys(bands) as Budget[]).map((id) => [id, label(id)])
  ) as Record<Budget, string>;
})();
export const BUDGET_FIT_LABEL: Record<BudgetFit, string> = {
  below: 'Budget is below the typical starting range',
  within: 'Budget is within the typical starting range',
  above: 'Budget is above the typical starting range',
  unknown: 'Budget not given',
};
