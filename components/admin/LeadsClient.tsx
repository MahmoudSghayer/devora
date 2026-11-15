'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';

const STATUSES = ['new', 'qualified', 'contacted', 'won', 'lost'] as const;
const FILTERS = ['all', ...STATUSES] as const;
const SOURCES = ['all', 'chat', 'contact', 'website_estimate', 'automation_roi'] as const;

const SOURCE_LABEL: Record<string, string> = {
  chat: 'Chat',
  contact: 'Contact form',
  website_estimate: 'Website estimate',
  automation_roi: 'Automation ROI',
  all: 'All sources',
};

type Lead = Record<string, unknown>;
type Json = unknown;

// ── helpers: turn arbitrary `details` JSON into readable structure ──────────

const isObj = (v: Json): v is Record<string, Json> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function humanize(key: string): string {
  const spaced = key
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function scalar(v: Json): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number')
    return new Intl.NumberFormat('en-US', {maximumFractionDigits: 2}).format(v);
  return String(v);
}

const isScalar = (v: Json) => v === null || typeof v !== 'object';

/** Plain-text rendering (used by "copy as text"); mirrors the on-screen layout. */
function toText(v: Json, indent = 0): string[] {
  const pad = '  '.repeat(indent);
  if (isScalar(v)) return [`${pad}${scalar(v)}`];
  if (Array.isArray(v)) {
    if (v.every(isScalar)) return [`${pad}${v.map(scalar).join(', ') || '—'}`];
    return v.flatMap((item, i) => {
      if (isScalar(item)) return [`${pad}- ${scalar(item)}`];
      if (isObj(item)) {
        const label = scalarLabel(item);
        return [
          `${pad}- ${label ?? `#${i + 1}`}`,
          ...Object.entries(item)
            .filter(([k]) => !labelKeys.includes(k) || label === undefined)
            .flatMap(([k, x]) => entryText(k, x, indent + 1)),
        ];
      }
      return toText(item, indent + 1);
    });
  }
  return Object.entries(v as Record<string, Json>).flatMap(([k, x]) =>
    entryText(k, x, indent)
  );
}

function entryText(k: string, x: Json, indent: number): string[] {
  const pad = '  '.repeat(indent);
  if (isScalar(x)) return [`${pad}${humanize(k)}: ${scalar(x)}`];
  if (Array.isArray(x) && x.every(isScalar))
    return [`${pad}${humanize(k)}: ${x.map(scalar).join(', ') || '—'}`];
  if (isObj(x) && Object.keys(x).length === 0) return [`${pad}${humanize(k)}: —`];
  return [`${pad}${humanize(k)}:`, ...toText(x, indent + 1)];
}

const labelKeys = ['label', 'name', 'taskId', 'step', 'id'];
function scalarLabel(o: Record<string, Json>): string | undefined {
  for (const k of labelKeys) if (typeof o[k] === 'string') return o[k] as string;
  return undefined;
}

function leadToText(l: Lead): string {
  const details = isObj(l.details) ? l.details : {};
  const head = [
    `Lead ${scalar(l.lead_ref)} (${SOURCE_LABEL[String(l.source)] ?? scalar(l.source)})`,
    `Name: ${scalar(l.name)}`,
    `Email: ${scalar(l.email)}`,
    `Phone: ${scalar(l.phone)}`,
    `Company: ${scalar(l.company)}`,
    `Preferred contact: ${scalar(l.preferred_contact)}`,
    `Locale: ${scalar(l.locale)}`,
    `Status: ${scalar(l.status)}`,
    `Created: ${scalar(l.created_at)}`,
    l.estimate_low != null
      ? `Estimate: ${money(l)}`
      : '',
    '',
    'Request:',
    scalar(l.request),
  ].filter((x) => x !== '');
  const body = Object.entries(details).flatMap(([k, v]) => [
    '',
    `${humanize(k)}:`,
    ...toText(v, 1),
  ]);
  return [...head, ...body].join('\n');
}

function money(l: Lead): string {
  const lo = Number(l.estimate_low);
  const hi = Number(l.estimate_high);
  if (!Number.isFinite(lo)) return '';
  const cur = typeof l.estimate_currency === 'string' ? l.estimate_currency : 'ILS';
  const f = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: 0,
    }).format(n);
  return lo === hi || !Number.isFinite(hi) ? f(lo) : `${f(lo)}–${f(hi)}`;
}

// ── detail rendering ────────────────────────────────────────────────────────

function Value({v}: {v: Json}) {
  if (isScalar(v)) return <span className="text-ink">{scalar(v)}</span>;
  if (Array.isArray(v)) {
    if (v.length === 0) return <span className="text-muted">—</span>;
    if (v.every(isScalar))
      return (
        <span className="flex flex-wrap gap-1">
          {v.map((x, i) => (
            <span
              key={i}
              className="rounded-full border border-border-card px-2 py-0.5 text-[11px] text-ink-2"
            >
              {scalar(x)}
            </span>
          ))}
        </span>
      );
    // array of objects → table
    const rows = v.filter(isObj);
    const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r)))).filter((c) =>
      rows.some((r) => isScalar(r[c]))
    );
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c} className="px-2 py-1 text-start font-medium text-muted">
                  {humanize(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border-sub">
                {cols.map((c) => (
                  <td key={c} className="px-2 py-1 text-ink-2">
                    {isScalar(r[c]) ? scalar(r[c]) : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return <Fields data={v as Record<string, Json>} />;
}

function Fields({data}: {data: Record<string, Json>}) {
  const entries = Object.entries(data);
  if (entries.length === 0) return <span className="text-muted">—</span>;
  return (
    <dl className="grid grid-cols-[minmax(0,10rem)_1fr] gap-x-3 gap-y-1.5 text-[12px]">
      {entries.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted">{humanize(k)}</dt>
          <dd className="min-w-0 break-words" dir="auto">
            <Value v={v} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function DetailPanel({lead}: {lead: Lead}) {
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null);
  const details = isObj(lead.details) ? lead.details : {};
  const sections = Object.entries(details);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(leadToText(lead));
      setCopied('ok');
    } catch {
      setCopied('fail');
    }
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="mt-3 flex flex-col gap-4 border-t border-border-sub pt-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] text-muted">
          {scalar(lead.lead_ref)} · {scalar(lead.locale)} ·{' '}
          {lead.email_delivered === true
            ? 'email sent'
            : lead.email_error
              ? `email failed: ${String(lead.email_error)}`
              : 'email pending'}
        </p>
        <button
          onClick={copy}
          className="rounded-full border border-border-card px-3 py-1 text-[12px] text-ink hover:bg-surface-2"
        >
          {copied === 'ok' ? 'Copied' : copied === 'fail' ? 'Copy failed' : 'Copy as text'}
        </button>
      </div>

      <section>
        <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
          Contact
        </h3>
        <Fields
          data={{
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            company: lead.company,
            preferred_contact: lead.preferred_contact,
            consent_at: lead.consent_at,
          }}
        />
      </section>

      {lead.request ? (
        <section>
          <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Request
          </h3>
          <p className="whitespace-pre-wrap text-[13px] text-ink-2" dir="auto">
            {String(lead.request)}
          </p>
        </section>
      ) : null}

      {sections.map(([k, v]) => (
        <section key={k}>
          <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
            {humanize(k)}
          </h3>
          <Value v={v} />
        </section>
      ))}
    </div>
  );
}

// ── page ────────────────────────────────────────────────────────────────────

export default function LeadsClient() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [source, setSource] = useState<(typeof SOURCES)[number]>('all');
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('status', filter);
    if (source !== 'all') params.set('source', source);
    if (debouncedQ) params.set('q', debouncedQ);
    try {
      const res = await fetch(`/api/admin/leads?${params}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(`Could not load leads (${data?.error ?? res.status}).`);
        return;
      }
      setError(null);
      setLeads(data.leads);
    } catch {
      setError('Could not load leads (network error).');
    }
  }, [filter, source, debouncedQ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional load-on-mount
    void load();
  }, [load]);

  const setStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({status}),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(`Status change failed (${data?.error ?? res.status}).`);
      } else {
        setError(null);
      }
    } catch {
      setError('Status change failed (network error).');
    }
    void load();
  };

  const count = useMemo(() => leads.length, [leads]);

  return (
    <div className="p-6 lg:p-8">
      <h1 className="mb-4 text-[20px] font-bold">Leads</h1>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, company, ref"
          aria-label="Search leads"
          className="w-full max-w-[320px] rounded-[8px] border border-border-card bg-surface-2 px-3 py-1.5 text-[13px] text-ink outline-none"
        />
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as (typeof SOURCES)[number])}
          aria-label="Filter by source"
          className="rounded-[8px] border border-border-card bg-surface-2 px-2 py-1.5 text-[12px] text-ink outline-none"
        >
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {SOURCE_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-[12px] capitalize ${
              filter === f ? 'bg-amber text-on-amber' : 'text-muted hover:text-ink'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mb-3 rounded-[8px] bg-surface-2 p-2.5 text-[12px] text-ink">
          {error}
        </p>
      ) : null}

      {leads.length === 0 ? (
        <p className="text-[13px] text-muted">No leads found.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[12px] text-muted">{count} shown</p>
          {leads.map((l) => {
            const id = String(l.id);
            const expanded = open === id;
            const est = money(l);
            return (
              <div
                key={id}
                className="rounded-[14px] border border-border-sub bg-surface p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-ink" dir="auto">
                      {String(l.name ?? '—')}
                      {l.company ? (
                        <span className="text-muted"> · {String(l.company)}</span>
                      ) : null}
                    </p>
                    <p className="text-[12px] text-muted" dir="ltr">
                      {String(l.email ?? '')}
                      {l.phone ? ` · ${String(l.phone)}` : ''}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted" dir="ltr">
                      {l.lead_ref ? `${String(l.lead_ref)} · ` : ''}
                      {l.created_at ? new Date(String(l.created_at)).toLocaleString() : ''}
                      {l.locale ? ` · ${String(l.locale)}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-ink-2">
                      {SOURCE_LABEL[String(l.source ?? 'chat')] ?? String(l.source)}
                    </span>
                    {est ? (
                      <span className="rounded-full border border-border-card px-2 py-0.5 text-[11px] text-ink">
                        {est}
                      </span>
                    ) : null}
                    {l.recommended_package ? (
                      <span className="rounded-full border border-border-card px-2 py-0.5 text-[11px] capitalize text-muted">
                        {String(l.recommended_package)}
                      </span>
                    ) : null}
                    <select
                      value={String(l.status ?? 'new')}
                      onChange={(e) => setStatus(id, e.target.value)}
                      aria-label="Lead status"
                      className="rounded-[8px] border border-border-card bg-surface-2 px-2 py-1 text-[12px] text-ink outline-none"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {l.request ? (
                  <p className="mt-2 line-clamp-2 text-[13px] text-ink-2" dir="auto">
                    {String(l.request)}
                  </p>
                ) : null}
                {l.ai_summary ? (
                  <p className="mt-2 rounded-[8px] bg-surface-2 p-2.5 text-[12px] text-muted">
                    {String(l.ai_summary)}
                  </p>
                ) : null}
                <button
                  onClick={() => setOpen(expanded ? null : id)}
                  aria-expanded={expanded}
                  className="mt-2 text-[12px] text-muted hover:text-ink"
                >
                  {expanded ? 'Hide details' : 'Show details'}
                </button>
                {expanded ? <DetailPanel lead={l} /> : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
