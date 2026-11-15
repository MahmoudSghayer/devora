import type {ChatMessage} from '@/lib/chat/types';
import {formatMoney} from '@/lib/pricing/config';
import type {EstimateResult} from '@/lib/estimator/types';
import type {EstimatorAnswers} from '@/lib/estimator/schema';
import type {RoiResult} from '@/lib/roi/types';
import type {RoiAnswers} from '@/lib/roi/schema';
import type {DiscussResult} from '@/lib/discuss/types';
import type {DiscussAnswers} from '@/lib/discuss/schema';
import {
  BUDGET_FIT_LABEL,
  BUDGET_LABEL,
  INTEGRATIONS_LABEL,
  MUST_HAVE_LABEL,
  PURPOSE_LABEL,
  TIMELINE_LABEL,
  TODAY_LABEL,
  USERS_LABEL,
} from '@/lib/leads/discussLabels';

export const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function historyText(messages: ChatMessage[]): string {
  return messages
    .map((m) => {
      const who =
        m.role === 'user'
          ? 'Visitor'
          : m.author === 'human_agent'
            ? 'devora team'
            : 'AI';
      return `${who}: ${m.content}`;
    })
    .join('\n');
}

export function shell(title: string, rows: string, bodyBlocks: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto;color:#1a1a1a">
  <div style="background:#0f0f0f;color:#f4c542;padding:18px 22px;border-radius:12px 12px 0 0;font-weight:700;font-size:15px">devora · ${esc(title)}</div>
  <div style="border:1px solid #e6e6e6;border-top:none;border-radius:0 0 12px 12px;padding:22px">
    <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
    ${bodyBlocks}
  </div>
</div>`;
}

export function row(label: string, value?: string): string {
  if (!value) return '';
  return `<tr><td style="padding:6px 0;color:#777;width:120px;vertical-align:top">${esc(label)}</td><td style="padding:6px 0;font-weight:600" dir="auto">${esc(value)}</td></tr>`;
}

export function block(label: string, value?: string): string {
  if (!value) return '';
  return `<div style="margin-top:18px"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#999;margin-bottom:6px">${esc(label)}</div><div style="white-space:pre-wrap;line-height:1.6;background:#faf9f5;border:1px solid #eee;border-radius:8px;padding:12px" dir="auto">${esc(value)}</div></div>`;
}

export function leadEmail(data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  request: string;
  recommendedPackage?: string;
  aiSummary?: string;
  locale: string;
  history: ChatMessage[];
}): {subject: string; text: string; html: string} {
  const subject = `New lead — ${data.name}${data.company ? ` (${data.company})` : ''}`;
  // Packages were retired: the legacy field is shown as plain "Interested in" text.
  const interest = data.recommendedPackage?.trim() || undefined;

  const text = [
    'NEW LEAD (via the devora assistant)',
    '',
    `Name:     ${data.name}`,
    `Email:    ${data.email}`,
    `Phone:    ${data.phone || '—'}`,
    `Company:  ${data.company || '—'}`,
    `Language: ${data.locale}`,
    interest ? `Interested in: ${interest}` : '',
    '',
    'REQUEST',
    data.request,
    '',
    data.aiSummary ? 'AI SUMMARY' : '',
    data.aiSummary || '',
    '',
    data.history.length ? 'CONVERSATION' : '',
    data.history.length ? historyText(data.history) : '',
  ]
    .filter((l) => l !== '')
    .join('\n');

  const html = shell(
    'New lead',
    row('Name', data.name) +
      row('Email', data.email) +
      row('Phone', data.phone) +
      row('Company', data.company) +
      row('Language', data.locale) +
      row('Interested in', interest),
    block('Request', data.request) +
      block('AI summary', data.aiSummary) +
      block('Conversation', data.history.length ? historyText(data.history) : '')
  );

  return {subject, text, html};
}

export function supportEmail(data: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  body: string;
  aiSummary?: string;
  locale: string;
  history: ChatMessage[];
}): {subject: string; text: string; html: string} {
  const subject = `Support — ${data.subject} · ${data.name}`;

  const text = [
    'NEW SUPPORT REQUEST (via the devora assistant)',
    '',
    `Name:     ${data.name}`,
    `Email:    ${data.email}`,
    `Phone:    ${data.phone || '—'}`,
    `Language: ${data.locale}`,
    `Subject:  ${data.subject}`,
    '',
    'MESSAGE',
    data.body,
    '',
    data.aiSummary ? 'AI SUMMARY' : '',
    data.aiSummary || '',
    '',
    data.history.length ? 'CONVERSATION' : '',
    data.history.length ? historyText(data.history) : '',
  ]
    .filter((l) => l !== '')
    .join('\n');

  const html = shell(
    'Support request',
    row('Name', data.name) +
      row('Email', data.email) +
      row('Phone', data.phone) +
      row('Language', data.locale) +
      row('Subject', data.subject),
    block('Message', data.body) +
      block('AI summary', data.aiSummary) +
      block('Conversation', data.history.length ? historyText(data.history) : '')
  );

  return {subject, text, html};
}

// ── Calculator + contact emails ─────────────────────────────────────────────
// Team-facing, always English (labels come from the engines). Visitor-supplied
// text is escaped in HTML and rendered with dir="auto" so Arabic reads right.

export interface ContactBlock {
  name: string;
  businessName?: string;
  email: string;
  phone?: string;
  notes?: string;
  preferredContact: string;
}

export interface CalcEmailBase {
  leadRef: string;
  contact: ContactBlock;
  locale: string;
  /** ISO timestamp of submission */
  submittedAt: string;
  timeline?: {step: string; tsMs: number}[];
}

export interface BuiltEmail {
  subject: string;
  text: string;
  html: string;
  replyTo: string;
}

const money = (n: number, currency?: string) =>
  formatMoney(n, 'en', currency ? {currency: currency as 'ILS'} : {});
const num = (n: number, d = 1) =>
  new Intl.NumberFormat('en-US', {maximumFractionDigits: d}).format(n);

type Align = 'left' | 'right';

function sectionTitle(title: string): string {
  return `<div style="margin:24px 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#999;font-weight:700">${esc(title)}</div>`;
}

/** HTML table with a header row; cells are escaped. */
export function htmlTable(
  headers: string[],
  rows: string[][],
  aligns: Align[] = [],
  boldLast = false
): string {
  const cell = (c: string, i: number, tag: 'th' | 'td', bold: boolean) =>
    `<${tag} style="padding:6px 8px;border-bottom:1px solid #eee;text-align:${aligns[i] ?? 'left'};${
      tag === 'th' ? 'color:#777;font-weight:600;font-size:12px;' : ''
    }${bold ? 'font-weight:700;' : ''}" dir="auto">${esc(c)}</${tag}>`;
  const head = `<tr>${headers.map((h, i) => cell(h, i, 'th', false)).join('')}</tr>`;
  const body = rows
    .map(
      (r, ri) =>
        `<tr>${r.map((c, i) => cell(c, i, 'td', boldLast && ri === rows.length - 1)).join('')}</tr>`
    )
    .join('');
  return `<table style="width:100%;border-collapse:collapse;font-size:13px">${head}${body}</table>`;
}

/** Fixed-width plain-text table. */
export function textTable(headers: string[], rows: string[][], aligns: Align[] = []): string {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length))
  );
  const fmt = (r: string[]) =>
    r
      .map((c, i) => (aligns[i] === 'right' ? c.padStart(widths[i]!) : c.padEnd(widths[i]!)))
      .join('  ')
      .trimEnd();
  return [fmt(headers), widths.map((w) => '-'.repeat(w)).join('  '), ...rows.map(fmt)].join('\n');
}

function contactRows(b: CalcEmailBase): string {
  return (
    row('Lead ref', b.leadRef) +
    row('Name', b.contact.name) +
    row('Business', b.contact.businessName) +
    row('Email', b.contact.email) +
    row('Phone', b.contact.phone) +
    row('Prefers', b.contact.preferredContact) +
    row('Language', b.locale) +
    row('Submitted', b.submittedAt)
  );
}

function contactText(b: CalcEmailBase): string[] {
  return [
    `Lead ref:  ${b.leadRef}`,
    `Name:      ${b.contact.name}`,
    `Business:  ${b.contact.businessName || '—'}`,
    `Email:     ${b.contact.email}`,
    `Phone:     ${b.contact.phone || '—'}`,
    `Prefers:   ${b.contact.preferredContact}`,
    `Language:  ${b.locale}`,
    `Submitted: ${b.submittedAt}`,
  ];
}

/** Visitor free text, set apart in the plain-text email so it is not missed. */
function notesText(notes?: string): string[] {
  return notes ? ['', 'VISITOR NOTES', notes] : [];
}

function timelineLines(t?: {step: string; tsMs: number}[]): string[] {
  if (!t || t.length === 0) return [];
  const t0 = t[0]!.tsMs;
  return t.map((e) => `${e.step} (+${num((e.tsMs - t0) / 1000, 1)}s)`);
}

const GROUP_LABEL: Record<string, string> = {
  build: 'Build',
  features: 'Features',
  integrations: 'Integrations',
  design: 'Design',
};

const list = (xs?: readonly string[]) => (xs && xs.length ? xs.join(', ') : '—');

function estimatorAnswerPairs(a: EstimatorAnswers): [string, string][] {
  return [
    ['Project types', list(a.types)],
    ['Pages', a.pages != null ? String(a.pages) : '—'],
    ['Products', a.productBucket ?? '—'],
    ['User roles', a.rolesBucket ?? '—'],
    ['Features', list(a.features)],
    ['Integrations', list(a.integrations)],
    [
      'Design',
      a.design
        ? Object.entries(a.design)
            .filter(([, v]) => v)
            .map(([k]) => k)
            .join(', ') || '—'
        : '—',
    ],
    ['Problem', a.problem || '—'],
  ];
}

export function websiteEstimateEmail(data: CalcEmailBase & {
  answers: EstimatorAnswers;
  result: EstimateResult;
  pricingConfigVersion?: string;
}): BuiltEmail {
  const {result: r, answers, contact} = data;
  const cur = r.currency;
  const range = `${money(r.low, cur)}–${money(r.high, cur)}`;
  const subject = `[Estimate ${data.leadRef}] ${contact.name} — ${range}`;
  const weeks = `${num(r.weeksLow, 0)}–${num(r.weeksHigh, 0)} weeks`;
  const maint = `${money(r.maintenanceMonthly, cur)}/mo (${r.maintenancePlan} care plan)`;

  const lineHead = ['Item', 'Days', 'Amount'];
  const lineRows = r.lineItems.map((li) => [
    `${GROUP_LABEL[li.group] ?? li.group}: ${li.label}${li.monthly ? ` (+${money(li.monthly, cur)}/mo)` : ''}`,
    num(li.days),
    money(li.amount, cur),
  ]);
  lineRows.push(['Subtotal (one-time)', num(r.lineItems.reduce((s, l) => s + l.days, 0)), money(r.subtotal, cur)]);
  const aligns: Align[] = ['left', 'right', 'right'];
  const pairs = estimatorAnswerPairs(answers);
  const tl = timelineLines(data.timeline);

  const text = [
    `WEBSITE ESTIMATE  ${data.leadRef}`,
    '',
    ...contactText(data),
    ...notesText(contact.notes),
    '',
    `RANGE: ${range}${r.needsDiscovery ? '  (visitor unsure — needs a discovery call)' : ''}`,
    `Timeline:    ${weeks}`,
    `Maintenance: ${maint}`,
    '',
    'BREAKDOWN',
    textTable(lineHead, lineRows, aligns),
    '',
    'ANSWERS',
    ...pairs.map(([k, v]) => `${k}: ${v}`),
    '',
    tl.length ? 'STEP TIMELINE' : '',
    ...tl,
    '',
    `Pricing config ${data.pricingConfigVersion ?? r.configVersion}`,
  ]
    .filter((l, i, arr) => l !== '' || arr[i - 1] !== '')
    .join('\n');

  const html = shell(
    `Website estimate · ${data.leadRef}`,
    contactRows(data),
    block('Visitor notes', contact.notes) +
      sectionTitle('Estimate') +
      htmlTable(
        ['Range (one-time)', 'Timeline', 'Maintenance'],
        [[range, weeks, maint]],
        ['left', 'left', 'left']
      ) +
      (r.needsDiscovery
        ? `<p style="font-size:13px;color:#a15c00;margin:8px 0 0">Visitor was unsure what they need — suggest a discovery call.</p>`
        : '') +
      sectionTitle('Breakdown') +
      htmlTable(lineHead, lineRows, aligns, true) +
      sectionTitle('Answers') +
      htmlTable(['Question', 'Answer'], pairs.map(([k, v]) => [k, v])) +
      (tl.length ? sectionTitle('Step timeline') + `<div style="font-size:12px;color:#555" dir="auto">${esc(tl.join(' → '))}</div>` : '') +
      `<p style="margin-top:20px;font-size:11px;color:#999">Pricing config ${esc(data.pricingConfigVersion ?? r.configVersion)}</p>`
  );

  return {subject, text, html, replyTo: contact.email};
}

function laborLine(a: RoiAnswers): string {
  const l = a.labor;
  if (!l) return 'not provided';
  if (l.mode === 'hourly') return `hourly cost ${l.hourlyCost}`;
  if (l.mode === 'salary')
    return `monthly gross ${l.monthlyGross}${l.employerCostMultiplier ? ` × ${l.employerCostMultiplier}` : ''}`;
  return 'unknown (defaults used)';
}

export function automationRoiEmail(data: CalcEmailBase & {
  answers: RoiAnswers;
  result: RoiResult;
  pricingConfigVersion?: string;
}): BuiltEmail {
  const {result: r, answers, contact} = data;
  const cur = r.currency;
  const savings = `${money(r.capacityValueMonthly, cur)}/mo`;
  const subject = `[ROI ${data.leadRef}] ${contact.name} — ${num(r.savedHoursMonthly, 0)} h/mo · ${savings}`;
  const months = (m: number | null) => (m == null ? 'n/a' : `${num(m, 1)} months`);
  const pct = (p: number | null) => (p == null ? 'n/a' : `${num(p * 100, 0)}%`);

  const taskHead = ['Task', 'Hours/day', 'Hours/mo', 'Saved h/mo', 'Value/mo'];
  const taskAligns: Align[] = ['left', 'right', 'right', 'right', 'right'];
  const taskRows = r.rows.map((x) => [
    x.label,
    num(x.hoursPerDay, 2),
    num(x.monthlyHours),
    num(x.savedHours),
    money(x.monthlyValue, cur),
  ]);
  taskRows.push([
    'Total',
    num(r.hoursPerDay, 2),
    num(r.monthlyHours),
    num(r.savedHoursMonthly),
    money(r.capacityValueMonthly, cur),
  ]);

  const sumPairs: [string, string][] = [
    ['Hours saved / month', `${num(r.savedHoursMonthly)} h (${num(r.savedHoursAnnual, 0)} h/year, ≈ ${num(r.fteEquivalent, 2)} FTE)`],
    ['Capacity value / month', money(r.capacityValueMonthly, cur)],
    ['Direct cost reduction / month', money(r.directReductionMonthly, cur)],
    ['Productivity value / month', money(r.productivityValueMonthly, cur)],
    ['Annual value (capacity)', money(r.annualValue, cur)],
    ['Annual direct reduction', money(r.annualDirect, cur)],
    ['Implementation (one-time)', money(r.implementationCost, cur)],
    ['Running cost / month', money(r.runningMonthly, cur)],
    ['Payback (direct)', months(r.paybackMonthsDirect)],
    ['Payback (capacity)', months(r.paybackMonthsCapacity)],
    ['12-month ROI (direct)', pct(r.roi12Direct)],
    ['12-month ROI (capacity)', pct(r.roi12Capacity)],
  ];
  const a = r.assumptions;
  const assumptionPairs: [string, string][] = [
    ['Labor basis', a.laborMode],
    ['Hourly cost', money(a.hourlyCost, cur)],
    ['Working days / month', num(a.workingDays, 0)],
    ['Direct share', `${num(a.directShare * 100, 0)}%`],
    ['Employer cost multiplier', a.employerCostMultiplier != null ? String(a.employerCostMultiplier) : '—'],
    ['Hours / month per FTE', num(a.hoursPerMonthFte, 0)],
    ['Implementation', `${money(a.implementationBase, cur)} + ${money(a.implementationPerTask, cur)} per task`],
    ['Running', `${money(a.runningBase, cur)} + ${money(a.runningPerTask, cur)} per task / mo`],
  ];

  const ansHead = ['Task', 'Times/day', 'Min each', 'People', 'Automation %'];
  const ansAligns: Align[] = ['left', 'right', 'right', 'right', 'right'];
  const ansRows = answers.tasks.map((t) => [
    t.taskId,
    num(t.timesPerDay),
    num(t.minutesEach),
    String(t.employees),
    `${num(t.automationPct, 0)}%`,
  ]);
  const extra: [string, string][] = [
    ['Labor input', laborLine(answers)],
    ['Working days override', answers.workingDays != null ? String(answers.workingDays) : '—'],
    ['Direct share override', answers.directShare != null ? String(answers.directShare) : '—'],
  ];
  const tl = timelineLines(data.timeline);

  const text = [
    `AUTOMATION ROI  ${data.leadRef}`,
    '',
    ...contactText(data),
    ...notesText(contact.notes),
    '',
    'SUMMARY',
    ...sumPairs.map(([k, v]) => `${k}: ${v}`),
    '',
    'PER TASK',
    textTable(taskHead, taskRows, taskAligns),
    '',
    'ASSUMPTIONS',
    ...assumptionPairs.map(([k, v]) => `${k}: ${v}`),
    '',
    'ANSWERS',
    textTable(ansHead, ansRows, ansAligns),
    ...extra.map(([k, v]) => `${k}: ${v}`),
    '',
    tl.length ? 'STEP TIMELINE' : '',
    ...tl,
    '',
    `Pricing config ${data.pricingConfigVersion ?? r.configVersion}`,
  ]
    .filter((l, i, arr) => l !== '' || arr[i - 1] !== '')
    .join('\n');

  const html = shell(
    `Automation ROI · ${data.leadRef}`,
    contactRows(data),
    block('Visitor notes', contact.notes) +
      sectionTitle('Summary') +
      htmlTable(['Metric', 'Value'], sumPairs.map(([k, v]) => [k, v])) +
      sectionTitle('Per task') +
      htmlTable(taskHead, taskRows, taskAligns, true) +
      sectionTitle('Assumptions') +
      htmlTable(['Assumption', 'Value'], assumptionPairs.map(([k, v]) => [k, v])) +
      sectionTitle('Answers') +
      htmlTable(ansHead, ansRows, ansAligns) +
      htmlTable(['Input', 'Value'], extra.map(([k, v]) => [k, v])) +
      (tl.length ? sectionTitle('Step timeline') + `<div style="font-size:12px;color:#555" dir="auto">${esc(tl.join(' → '))}</div>` : '') +
      `<p style="margin-top:20px;font-size:11px;color:#999">Pricing config ${esc(data.pricingConfigVersion ?? r.configVersion)}</p>`
  );

  return {subject, text, html, replyTo: contact.email};
}

export function contactEmail(
  data: CalcEmailBase & {message: string; budget?: string}
): BuiltEmail {
  const {contact} = data;
  const subject = `[Contact ${data.leadRef}] ${contact.name}${contact.businessName ? ` (${contact.businessName})` : ''}`;
  const text = [
    `NEW PROJECT ENQUIRY  ${data.leadRef}`,
    '',
    ...contactText(data),
    `Budget:    ${data.budget || '—'}`,
    '',
    'MESSAGE',
    data.message,
    ...notesText(contact.notes),
  ]
    .filter((l) => l !== '')
    .join('\n');
  const html = shell(
    `Contact · ${data.leadRef}`,
    contactRows(data) + row('Budget', data.budget),
    block('Message', data.message) + block('Visitor notes', contact.notes)
  );
  return {subject, text, html, replyTo: contact.email};
}

// ── Software discovery ──────────────────────────────────────────────────────

const labelOf = (map: Record<string, string>, v: string) => map[v] ?? v;

function discussAnswerPairs(a: DiscussAnswers): [string, string][] {
  return [
    ['What it is for', a.purpose.map((v) => labelOf(PURPOSE_LABEL, v)).join('; ')],
    ['Who will use it', a.users ? labelOf(USERS_LABEL, a.users) : '—'],
    ['How they work today', a.today ? labelOf(TODAY_LABEL, a.today) : '—'],
    ['Integrations', a.integrations ? labelOf(INTEGRATIONS_LABEL, a.integrations) : '—'],
    [
      'Must-haves',
      a.mustHaves && a.mustHaves.length
        ? a.mustHaves.map((v) => labelOf(MUST_HAVE_LABEL, v)).join('; ')
        : '—',
    ],
    ['Timeline', a.timeline ? labelOf(TIMELINE_LABEL, a.timeline) : '—'],
    ['Budget', a.budget ? labelOf(BUDGET_LABEL, a.budget) : '—'],
  ];
}

export function softwareDiscoveryEmail(data: CalcEmailBase & {
  answers: DiscussAnswers;
  result: DiscussResult;
  pricingConfigVersion?: string;
}): BuiltEmail {
  const {result: r, answers, contact} = data;
  const cur = r.estimate.currency;
  const range = `${money(r.startingLow, cur)}–${money(r.startingHigh, cur)}`;
  const subject = `[Discuss ${data.leadRef}] ${contact.name} — ${range}`;
  const weeks = `${num(r.weeks.low, 0)}–${num(r.weeks.high, 0)} weeks`;
  const maint = `${money(r.maintenanceMonthly, cur)}/mo`;
  const fit = labelOf(BUDGET_FIT_LABEL, r.budgetFit);
  const pairs = discussAnswerPairs(answers);
  const tl = timelineLines(data.timeline);
  const version = data.pricingConfigVersion ?? r.configVersion;

  const text = [
    `SOFTWARE DISCOVERY  ${data.leadRef}`,
    '',
    ...contactText(data),
    '',
    'ANYTHING ELSE WE SHOULD KNOW? (visitor free text)',
    contact.notes || '—',
    '',
    'INDICATIVE STARTING RANGE (not a quotation)',
    `Range:       ${range}`,
    `Budget fit:  ${fit}`,
    `Timeline:    ${weeks}`,
    `Maintenance: ${maint}`,
    '',
    'CHOSEN OPTIONS',
    ...pairs.map(([k, v]) => `${k}: ${v}`),
    '',
    r.assumptions.length ? 'ASSUMPTIONS' : '',
    ...r.assumptions.map((x) => `- ${x}`),
    '',
    'ANSWERS (raw)',
    JSON.stringify(answers),
    '',
    tl.length ? 'STEP TIMELINE' : '',
    ...tl,
    '',
    `Pricing config ${version}`,
  ]
    .filter((l, i, arr) => l !== '' || arr[i - 1] !== '')
    .join('\n');

  const html = shell(
    `Software discovery · ${data.leadRef}`,
    contactRows(data),
    block('Anything else we should know? (visitor)', contact.notes || '—') +
      sectionTitle('Indicative starting range') +
      htmlTable(
        ['Range', 'Budget fit', 'Timeline', 'Maintenance'],
        [[range, fit, weeks, maint]],
        ['left', 'left', 'left', 'left']
      ) +
      `<p style="font-size:11px;color:#999;margin:6px 0 0">Indicative, not a quotation.</p>` +
      sectionTitle('Chosen options') +
      htmlTable(['Question', 'Answer'], pairs.map(([k, v]) => [k, v])) +
      (r.assumptions.length
        ? sectionTitle('Assumptions') +
          `<ul style="margin:0;padding-inline-start:18px;font-size:13px;line-height:1.6">${r.assumptions
            .map((x) => `<li dir="auto">${esc(x)}</li>`)
            .join('')}</ul>`
        : '') +
      sectionTitle('Answers (raw)') +
      `<pre style="font-size:11px;white-space:pre-wrap;background:#faf9f5;border:1px solid #eee;border-radius:8px;padding:10px;margin:0">${esc(JSON.stringify(answers, null, 2))}</pre>` +
      (tl.length ? sectionTitle('Step timeline') + `<div style="font-size:12px;color:#555" dir="auto">${esc(tl.join(' → '))}</div>` : '') +
      `<p style="margin-top:20px;font-size:11px;color:#999">Pricing config ${esc(version)}</p>`
  );

  return {subject, text, html, replyTo: contact.email};
}
