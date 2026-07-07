'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import type {RealtimeChannel} from '@supabase/supabase-js';
import {
  createSupabaseBrowserClient,
  isRealtimeConfigured,
} from '@/lib/supabase/client';
import type {ChatMessage} from '@/lib/chat/types';
import type {AdminConversationRow} from '@/lib/admin/queries';

interface Detail {
  conversation: AdminConversationRow;
  messages: ChatMessage[];
  lead: Record<string, unknown> | null;
  support: Record<string, unknown> | null;
}

const STATUS_TABS = ['active', 'all', 'closed'] as const;

export default function ConversationsClient() {
  const [list, setList] = useState<AdminConversationRow[]>([]);
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]>('active');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);
  const lastTypingRef = useRef(0);

  const fetchList = useCallback(async () => {
    const params = new URLSearchParams({status});
    if (q.trim()) params.set('q', q.trim());
    const res = await fetch(`/api/admin/conversations?${params}`);
    if (res.ok) {
      const data = await res.json();
      if (data.ok) setList(data.conversations);
    }
  }, [status, q]);

  const fetchDetail = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/conversations/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.ok) setDetail(data as Detail);
    }
  }, []);

  // Keep the latest fetchers in refs so the realtime subscriptions below don't
  // tear down and re-subscribe every time the search text or filter changes.
  const fetchListRef = useRef(fetchList);
  const fetchDetailRef = useRef(fetchDetail);
  useEffect(() => {
    fetchListRef.current = fetchList;
    fetchDetailRef.current = fetchDetail;
  });

  // Load the list on mount and when the filter/search changes — debounced so
  // typing in the search box doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => void fetchList(), 250);
    return () => clearTimeout(t);
  }, [fetchList]);

  // Fallback polling ONLY when realtime is unavailable; otherwise realtime
  // drives updates and an interval would just add load.
  useEffect(() => {
    if (isRealtimeConfigured()) return;
    const t = setInterval(() => void fetchListRef.current(), 15000);
    return () => clearInterval(t);
  }, []);

  // Load the open thread when the selection changes; fallback-poll only when
  // realtime is off.
  useEffect(() => {
    if (!selectedId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear on deselect
      setDetail(null);
      return;
    }
    void fetchDetail(selectedId);
    if (isRealtimeConfigured()) return;
    const t = setInterval(() => void fetchDetailRef.current(selectedId), 8000);
    return () => clearInterval(t);
  }, [selectedId, fetchDetail]);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [detail?.messages.length]);

  // Realtime — live inbox (subscribe ONCE; the ref keeps the fetcher current so
  // search/filter changes don't churn the subscription).
  useEffect(() => {
    if (!isRealtimeConfigured()) return;
    const supabase = createSupabaseBrowserClient();
    const ch = supabase
      .channel('admin:inbox')
      .on(
        'postgres_changes',
        {event: '*', schema: 'public', table: 'conversations'},
        () => void fetchListRef.current()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, []);

  // Realtime — the open thread (re-subscribes only when the selection changes).
  useEffect(() => {
    if (!selectedId || !isRealtimeConfigured()) return;
    const supabase = createSupabaseBrowserClient();
    const ch = supabase
      .channel(`admin:conv:${selectedId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedId}`,
        },
        () => void fetchDetailRef.current(selectedId)
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [selectedId]);

  // Broadcast channel to the visitor for the "agent is typing" indicator.
  useEffect(() => {
    const token = detail?.conversation.token;
    if (!token || !isRealtimeConfigured()) {
      typingChannelRef.current = null;
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const ch = supabase.channel(`conv:${token}`);
    ch.subscribe();
    typingChannelRef.current = ch;
    return () => {
      typingChannelRef.current = null;
      void supabase.removeChannel(ch);
    };
  }, [detail?.conversation.token]);

  const onReplyChange = (value: string) => {
    setReply(value);
    const ch = typingChannelRef.current;
    const now = Date.now();
    if (ch && now - lastTypingRef.current > 1200) {
      lastTypingRef.current = now;
      void ch.send({type: 'broadcast', event: 'typing', payload: {}});
    }
  };

  const act = async (path: string, body?: unknown) => {
    if (!selectedId) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/conversations/${selectedId}/${path}`, {
        method: 'POST',
        headers: body ? {'Content-Type': 'application/json'} : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      await fetchDetail(selectedId);
      await fetchList();
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async () => {
    const text = reply.trim();
    if (!text) return;
    setReply('');
    await act('message', {content: text});
  };

  const mode = detail?.conversation.mode;

  return (
    <div className="flex h-dvh">
      {/* List */}
      <div className="flex w-[300px] shrink-0 flex-col border-e border-border-sub">
        <div className="border-b border-border-sub p-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email…"
            className="w-full rounded-[10px] border border-border-card bg-surface-2 px-3 py-2 text-[13px] text-ink outline-none placeholder:text-faint focus:border-border-ghost"
          />
          <div className="mt-2 flex gap-1">
            {STATUS_TABS.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-full px-2.5 py-1 text-[12px] capitalize ${
                  status === s
                    ? 'bg-amber text-on-amber'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {list.length === 0 && (
            <p className="p-4 text-[13px] text-muted">No conversations.</p>
          )}
          {list.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`flex w-full flex-col gap-0.5 border-b border-border-sub px-3.5 py-3 text-start transition-colors ${
                selectedId === c.id ? 'bg-surface-2' : 'hover:bg-surface'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] font-medium text-ink">
                  {c.visitor_name || c.visitor_email || 'Anonymous visitor'}
                </span>
                <span className="shrink-0 font-mono text-[10px] uppercase text-faint">
                  {c.locale}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted">
                <span
                  className={`rounded-full px-1.5 py-px ${
                    c.mode === 'human'
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'bg-surface-2 text-faint'
                  }`}
                >
                  {c.mode === 'human' ? 'human' : 'AI'}
                </span>
                <span className="capitalize">{c.status}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Thread */}
      <div className="flex flex-1 flex-col">
        {!detail ? (
          <div className="grid flex-1 place-items-center text-[14px] text-muted">
            Select a conversation.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-sub px-5 py-3">
              <div>
                <p className="text-[14px] font-semibold text-ink">
                  {detail.conversation.visitor_name ||
                    detail.conversation.visitor_email ||
                    'Anonymous visitor'}
                </p>
                <p className="text-[12px] text-muted">
                  {detail.conversation.visitor_email || '—'} ·{' '}
                  <span className="capitalize">{detail.conversation.status}</span> ·{' '}
                  {mode === 'human' ? 'human handling' : 'AI handling'}
                </p>
              </div>
              <div className="flex gap-2">
                {mode === 'human' ? (
                  <button
                    disabled={busy}
                    onClick={() => act('release')}
                    className="rounded-full border border-border-card px-3 py-1.5 text-[12px] text-muted hover:text-ink disabled:opacity-50"
                  >
                    Release to AI
                  </button>
                ) : (
                  <button
                    disabled={busy}
                    onClick={() => act('takeover')}
                    className="rounded-full bg-amber px-3 py-1.5 text-[12px] font-semibold text-on-amber hover:bg-amber-hi disabled:opacity-50"
                  >
                    Take over
                  </button>
                )}
              </div>
            </div>

            {(detail.lead || detail.support) && (
              <div className="border-b border-border-sub bg-surface px-5 py-2 text-[12px] text-muted">
                {detail.lead && (
                  <span className="me-3">
                    Lead: {String(detail.lead.email ?? '')}
                    {detail.lead.recommended_package
                      ? ` · ${detail.lead.recommended_package}`
                      : ''}
                  </span>
                )}
                {detail.support && (
                  <span>Support: {String(detail.support.subject ?? '')}</span>
                )}
              </div>
            )}

            <div ref={threadRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
              {detail.messages.map((m) => {
                const mine = m.role !== 'user';
                return (
                  <div
                    key={m.id}
                    className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-[70%]">
                      <p className="mb-1 text-[10px] uppercase tracking-wide text-faint">
                        {m.role === 'user'
                          ? 'Visitor'
                          : m.author === 'human_agent'
                            ? 'You'
                            : 'AI'}
                      </p>
                      <div
                        className={`whitespace-pre-wrap break-words rounded-[12px] px-3.5 py-2.5 text-[14px] leading-relaxed ${
                          mine
                            ? 'bg-amber text-on-amber'
                            : 'bg-surface-2 text-ink border border-border-sub'
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border-sub p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={reply}
                  onChange={(e) => onReplyChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void sendReply();
                    }
                  }}
                  rows={1}
                  placeholder={
                    mode === 'human'
                      ? 'Reply as a human…'
                      : 'Reply (tip: Take over first)…'
                  }
                  className="max-h-32 min-h-[42px] flex-1 resize-none rounded-[10px] border border-border-card bg-surface-2 px-3 py-2.5 text-[14px] text-ink outline-none placeholder:text-faint focus:border-border-ghost"
                />
                <button
                  onClick={() => void sendReply()}
                  disabled={busy || !reply.trim()}
                  className="rounded-[10px] bg-amber px-4 py-2.5 text-[14px] font-semibold text-on-amber hover:bg-amber-hi disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
