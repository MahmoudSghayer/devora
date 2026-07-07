'use client';

import {useCallback, useEffect, useState} from 'react';

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
const FILTERS = ['all', ...STATUSES] as const;

type Req = Record<string, unknown>;

export default function SupportClient() {
  const [items, setItems] = useState<Req[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('status', filter);
    const res = await fetch(`/api/admin/support-requests?${params}`);
    if (res.ok) {
      const data = await res.json();
      if (data.ok) setItems(data.requests);
    }
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional load-on-mount
    void load();
  }, [load]);

  const setStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/support-requests/${id}`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({status}),
    });
    void load();
  };

  return (
    <div className="p-6 lg:p-8">
      <h1 className="mb-4 text-[20px] font-bold">Support requests</h1>
      <div className="mb-4 flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-[12px] capitalize ${
              filter === f ? 'bg-amber text-on-amber' : 'text-muted hover:text-ink'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-[13px] text-muted">No support requests.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((r) => (
            <div
              key={String(r.id)}
              className="rounded-[14px] border border-border-sub bg-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-ink">
                    {String(r.subject ?? '—')}
                  </p>
                  <p className="text-[12px] text-muted">
                    {String(r.name ?? '')} ·{' '}
                    <span dir="ltr">{String(r.email ?? '')}</span>
                  </p>
                </div>
                <select
                  value={String(r.status ?? 'open')}
                  onChange={(e) => setStatus(String(r.id), e.target.value)}
                  className="rounded-[8px] border border-border-card bg-surface-2 px-2 py-1 text-[12px] text-ink outline-none"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              {r.body ? (
                <p className="mt-2 text-[13px] text-ink-2">{String(r.body)}</p>
              ) : null}
              {r.ai_summary ? (
                <p className="mt-2 rounded-[8px] bg-surface-2 p-2.5 text-[12px] text-muted">
                  {String(r.ai_summary)}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
