'use client';

import {useCallback, useEffect, useState} from 'react';
import type {KbDoc} from '@/lib/admin/queries';

type Editing =
  | null
  | {id?: string; locale: 'en' | 'ar'; title: string; body: string; is_active: boolean};

export default function KnowledgeClient() {
  const [docs, setDocs] = useState<KbDoc[]>([]);
  const [editing, setEditing] = useState<Editing>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/kb');
    if (res.ok) {
      const data = await res.json();
      if (data.ok) setDocs(data.docs);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional load-on-mount
    void load();
  }, [load]);

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/kb', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(editing),
      });
      if (res.ok) {
        setEditing(null);
        await load();
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await fetch(`/api/admin/kb/${id}`, {method: 'DELETE'});
      await load();
    } finally {
      setBusy(false);
    }
  };

  const seed = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/kb/seed', {method: 'POST'});
      const data = await res.json();
      if (data.ok) setMsg(`Imported ${data.count} documents from the site.`);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const input =
    'w-full rounded-[10px] border border-border-card bg-surface-2 px-3 py-2 text-[14px] text-ink outline-none placeholder:text-faint focus:border-border-ghost';

  if (editing) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="mb-4 text-[20px] font-bold">
          {editing.id ? 'Edit document' : 'New document'}
        </h1>
        <div className="flex max-w-2xl flex-col gap-3">
          <select
            value={editing.locale}
            onChange={(e) =>
              setEditing({...editing, locale: e.target.value as 'en' | 'ar'})
            }
            disabled={!!editing.id}
            className={input}
          >
            <option value="en">English</option>
            <option value="ar">Arabic</option>
          </select>
          <input
            className={input}
            placeholder="Title"
            value={editing.title}
            onChange={(e) => setEditing({...editing, title: e.target.value})}
          />
          <textarea
            className={`${input} min-h-[220px]`}
            placeholder="Content the assistant can use to answer…"
            value={editing.body}
            onChange={(e) => setEditing({...editing, body: e.target.value})}
          />
          <label className="flex items-center gap-2 text-[13px] text-muted">
            <input
              type="checkbox"
              checked={editing.is_active}
              onChange={(e) => setEditing({...editing, is_active: e.target.checked})}
            />
            Active (used by the assistant)
          </label>
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={busy || !editing.title.trim() || !editing.body.trim()}
              className="rounded-[10px] bg-amber px-4 py-2 text-[14px] font-semibold text-on-amber hover:bg-amber-hi disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(null)}
              className="rounded-[10px] border border-border-card px-4 py-2 text-[14px] text-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[20px] font-bold">Knowledge</h1>
        <div className="flex gap-2">
          <button
            onClick={seed}
            disabled={busy}
            className="rounded-[10px] border border-border-card px-3 py-2 text-[13px] text-muted hover:text-ink disabled:opacity-50"
          >
            Import from site
          </button>
          <button
            onClick={() =>
              setEditing({locale: 'en', title: '', body: '', is_active: true})
            }
            className="rounded-[10px] bg-amber px-3 py-2 text-[13px] font-semibold text-on-amber hover:bg-amber-hi"
          >
            Add document
          </button>
        </div>
      </div>

      {msg && <p className="mb-3 text-[13px] text-emerald-300">{msg}</p>}

      <p className="mb-4 max-w-2xl text-[13px] text-muted">
        The assistant answers only from these documents. Import the site’s
        content to start, then edit or add your own — changes apply within a
        minute, no redeploy.
      </p>

      {docs.length === 0 ? (
        <p className="text-[13px] text-muted">
          No documents yet — click “Import from site”.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {docs.map((d) => (
            <div
              key={d.id}
              className="flex items-start justify-between gap-3 rounded-[12px] border border-border-sub bg-surface p-3.5"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[14px] font-medium text-ink">
                  {d.title || d.ref_key}
                  <span className="rounded-full bg-surface-2 px-1.5 py-px font-mono text-[10px] uppercase text-faint">
                    {d.locale}
                  </span>
                  {!d.is_active && (
                    <span className="rounded-full bg-surface-2 px-1.5 py-px text-[10px] text-muted">
                      inactive
                    </span>
                  )}
                </p>
                <p className="mt-1 line-clamp-2 text-[12px] text-muted">{d.body}</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  onClick={() =>
                    setEditing({
                      id: d.id,
                      locale: d.locale as 'en' | 'ar',
                      title: d.title ?? '',
                      body: d.body,
                      is_active: d.is_active,
                    })
                  }
                  className="rounded-[8px] border border-border-card px-2.5 py-1 text-[12px] text-muted hover:text-ink"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(d.id)}
                  className="rounded-[8px] border border-border-card px-2.5 py-1 text-[12px] text-muted hover:text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
