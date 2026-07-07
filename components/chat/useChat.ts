'use client';

import {useCallback, useRef, useState} from 'react';
import type {
  ChatLocale,
  ChatMessage,
  ChatStreamEvent,
  ConversationMode,
} from '@/lib/chat/types';
import {useRealtimeConversation} from './useRealtimeConversation';

interface StoredConversation {
  id: string;
  token: string;
  locale: ChatLocale;
}

type Status = 'idle' | 'streaming';

const storageKey = (locale: ChatLocale) => `devora:chat:${locale}`;

function loadStored(locale: ChatLocale): StoredConversation | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey(locale));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConversation;
    return parsed.id && parsed.token ? parsed : null;
  } catch {
    return null;
  }
}

function saveStored(conv: StoredConversation) {
  try {
    window.localStorage.setItem(storageKey(conv.locale), JSON.stringify(conv));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

export interface UseChat {
  messages: ChatMessage[];
  status: Status;
  error: 'error' | 'rate_limited' | null;
  mode: ConversationMode;
  representativeOnline: boolean;
  humanTyping: boolean;
  ensureConversation: () => Promise<void>;
  send: (text: string) => Promise<void>;
  reset: () => Promise<void>;
  conversationId: string | null;
  conversationToken: string | null;
}

export function useChat(locale: ChatLocale): UseChat {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<'error' | 'rate_limited' | null>(null);
  const [mode, setMode] = useState<ConversationMode>('ai');
  const [representativeOnline, setRepresentativeOnline] = useState(false);
  const [humanTyping, setHumanTyping] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // convRef is the source of truth for async callbacks (avoids stale closures);
  // `conv` state mirrors it so render-time reads don't touch the ref.
  const convRef = useRef<StoredConversation | null>(null);
  const [conv, setConv] = useState<StoredConversation | null>(null);
  const setConversation = (c: StoredConversation | null) => {
    convRef.current = c;
    setConv(c);
  };

  // Live updates: human replies, takeover mode, and the online toggle.
  useRealtimeConversation(conv?.token ?? null, {
    onMessage: (m) =>
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m])),
    onMode: (m) => setMode(m),
    onOnline: (online) => setRepresentativeOnline(online),
    onHumanTyping: () => {
      setHumanTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setHumanTyping(false), 3000);
    },
  });

  const createConversation = useCallback(async () => {
    const res = await fetch('/api/conversation', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({locale, firstPage: window.location.pathname}),
    });
    const data = await res.json();
    if (!data.ok) throw new Error('create_failed');
    const created: StoredConversation = {id: data.id, token: data.token, locale};
    setConversation(created);
    saveStored(created);
    setMode(data.mode ?? 'ai');
    setRepresentativeOnline(Boolean(data.representativeOnline));
  }, [locale]);

  const ensureConversation = useCallback(async () => {
    if (convRef.current) return;
    const stored = loadStored(locale);
    if (stored) {
      setConversation(stored);
      // Restore server-side history when available (persisted mode).
      try {
        const res = await fetch(
          `/api/conversation/${stored.id}?token=${stored.token}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            if (Array.isArray(data.messages)) setMessages(data.messages);
            setMode(data.conversation?.mode ?? 'ai');
            return;
          }
        }
        // token no longer valid (e.g. DB reset) — start fresh
        await createConversation();
      } catch {
        /* offline / not persisted — keep the stored id */
      }
      return;
    }
    await createConversation();
  }, [locale, createConversation]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || status === 'streaming') return;
      setError(null);
      await ensureConversation();
      const conv = convRef.current;
      if (!conv) {
        setError('error');
        return;
      }

      const priorForServer = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-40)
        .map((m) => ({role: m.role, content: m.content}));

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        author: 'visitor',
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      const assistantId = crypto.randomUUID();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        author: 'ai',
        content: '',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setStatus('streaming');

      const patchAssistant = (fn: (content: string) => string) =>
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? {...m, content: fn(m.content)} : m
          )
        );

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            conversationId: conv.id,
            token: conv.token,
            message: trimmed,
            locale,
            clientHistory: priorForServer,
          }),
        });

        if (res.status === 429) {
          setError('rate_limited');
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          setStatus('idle');
          return;
        }
        if (!res.ok || !res.body) throw new Error('bad_response');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let gotText = false;

        while (true) {
          const {done, value} = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, {stream: true});
          let sep: number;
          while ((sep = buffer.indexOf('\n\n')) !== -1) {
            const rawEvent = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            const line = rawEvent.replace(/^data:\s?/, '').trim();
            if (!line) continue;
            let evt: ChatStreamEvent;
            try {
              evt = JSON.parse(line);
            } catch {
              continue;
            }
            if (evt.type === 'delta') {
              gotText = true;
              patchAssistant((c) => c + evt.text);
            } else if (evt.type === 'meta') {
              setMode(evt.mode);
            } else if (evt.type === 'handoff') {
              setMode('human');
              setMessages((prev) => prev.filter((m) => m.id !== assistantId));
            } else if (evt.type === 'error') {
              setError('error');
            }
          }
        }

        if (!gotText && mode !== 'human') {
          // nothing streamed — drop the empty placeholder, surface an error
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          setError('error');
        }
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        setError('error');
      } finally {
        setStatus('idle');
      }
    },
    [ensureConversation, locale, messages, mode, status]
  );

  const reset = useCallback(async () => {
    try {
      window.localStorage.removeItem(storageKey(locale));
    } catch {
      /* ignore */
    }
    setConversation(null);
    setMessages([]);
    setError(null);
    setMode('ai');
    await createConversation();
  }, [locale, createConversation]);

  return {
    messages,
    status,
    error,
    mode,
    representativeOnline,
    humanTyping,
    ensureConversation,
    send,
    reset,
    conversationId: conv?.id ?? null,
    conversationToken: conv?.token ?? null,
  };
}
