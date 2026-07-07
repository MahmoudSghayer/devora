'use client';

import {useCallback, useEffect, useState} from 'react';

const STATUSES = ['new', 'qualified', 'contacted', 'won', 'lost'] as const;
const FILTERS = ['all', ...STATUSES] as const;

type Lead = Record<string, unknown>;

export default function LeadsClient() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('status', filter);
    const res = await fetch(`/api/admin/leads?${params}`);
    if (res.ok) {
      const data = await res.json();
      if (data.ok) setLeads(data.leads);
    }
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional load-on-mount
    void load();
  }, [load]);

  const setStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/leads/${id}`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({status}),
    });
    void load();
  };

  return (
    <div className="p-6 lg:p-8">
      <h1 className="mb-4 text-[20px] font-bold">Leads</h1>
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

      {leads.length === 0 ? (
        <p className="text-[13px] text-muted">No leads yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {leads.map((l) => (
            <div
              key={String(l.id)}
              className="rounded-[14px] border border-border-sub bg-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-ink">
                    {String(l.name ?? '—')}
                    {l.company ? (
                      <span className="text-muted"> · {String(l.company)}</span>
                    ) : null}
                  </p>
                  <p className="text-[12px] text-muted" dir="ltr">
                    {String(l.email ?? '')}
                    {l.phone ? ` · ${String(l.phone)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {l.recommended_package ? (
                    <span className="rounded-full border border-border-card px-2 py-0.5 text-[11px] capitalize text-muted">
                      {String(l.recommended_package)}
                    </span>
                  ) : null}
                  <select
                    value={String(l.status ?? 'new')}
                    onChange={(e) => setStatus(String(l.id), e.target.value)}
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
                <p className="mt-2 line-clamp-2 text-[13px] text-ink-2">
                  {String(l.request)}
                </p>
              ) : null}
              {l.ai_summary ? (
                <p className="mt-2 rounded-[8px] bg-surface-2 p-2.5 text-[12px] text-muted">
                  {String(l.ai_summary)}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
