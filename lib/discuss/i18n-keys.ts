// English text for every `discuss` i18n key (synced with docs/transformation/discuss-i18n-keys.json).

const QUESTIONS: Record<string, [string, string]> = {
  purpose: ['What do you want the software to do?', 'Pick everything that applies.'],
  users: ['Who will use it?', 'Pick one.'],
  today: ['How do you handle this today?', 'Pick the closest.'],
  integrations: ['Does it need to connect to other tools?', 'For example accounting, CRM, WhatsApp or payment systems.'],
  mustHaves: ['What must it have?', 'Pick everything that is a must.'],
  timeline: ['When do you need it?', 'A rough timeframe is fine.'],
  budget: ['What budget do you have in mind?', 'Optional. This only helps us suggest the right scope.'],
};

const OPTIONS: Record<string, Record<string, string>> = {
  purpose: {
    'replace-spreadsheets': 'Replace spreadsheets',
    'run-operations': 'Run daily operations',
    'customer-portal': 'A portal for my customers',
    'internal-dashboard': 'An internal dashboard',
    'ai-tool': 'An AI-powered tool',
    'connect-tools': 'Connect the tools I already use',
    other: 'Something else',
  },
  users: {
    me: 'Just me',
    'team-2-10': 'A team of 2–10',
    'team-10-50': 'A team of 10–50',
    customers: 'My customers',
    'team-and-customers': 'My team and my customers',
  },
  today: {
    spreadsheets: 'Spreadsheets',
    'off-the-shelf': 'An off-the-shelf tool',
    'disconnected-tools': 'Several disconnected tools',
    nothing: 'Nothing yet',
  },
  integrations: {none: 'No', 'one-two': 'One or two', many: 'Many', unsure: 'Not sure'},
  mustHaves: {
    'auth-roles': 'Logins and user roles',
    payments: 'Online payments',
    dashboards: 'Dashboards and reports',
    notifications: 'Notifications',
    mobile: 'Works well on mobile',
    'ai-assistant': 'AI assistant',
    bilingual: 'Hebrew / Arabic / English',
  },
  timeline: {'lt-1m': 'Under a month', '1-3m': '1–3 months', '3-6m': '3–6 months', flexible: 'Flexible'},
  budget: {lt15k: 'Under ₪15,000', '15-30k': '₪15,000–30,000', '30-60k': '₪30,000–60,000', '60k+': '₪60,000+', unsure: 'Not sure yet'},
};

/** key → English text, namespace `discuss`. */
export function discussI18nKeys(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [q, [title, hint]] of Object.entries(QUESTIONS)) {
    out[`discuss.q.${q}.title`] = title;
    out[`discuss.q.${q}.hint`] = hint;
  }
  for (const [q, opts] of Object.entries(OPTIONS)) {
    for (const [id, label] of Object.entries(opts)) out[`discuss.${q}.${id}`] = label;
  }
  return out;
}
