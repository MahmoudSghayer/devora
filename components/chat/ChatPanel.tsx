'use client';

import {useEffect, useRef, useState} from 'react';
import {motion, useReducedMotion} from 'motion/react';
import {useTranslations} from 'next-intl';
import {EASE} from '@/lib/motion';
import type {ChatLocale, ChatMessage as ChatMessageType} from '@/lib/chat/types';
import type {UseChat} from './useChat';
import ChatMessage from './ChatMessage';
import LeadForm from './LeadForm';

export default function ChatPanel({
  locale,
  chat,
  onClose,
}: {
  locale: ChatLocale;
  chat: UseChat;
  onClose: () => void;
}) {
  const t = useTranslations('chat');
  const reduce = useReducedMotion();
  const [input, setInput] = useState('');
  const [showLead, setShowLead] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const openLead = () => {
    void chat.ensureConversation();
    setShowLead(true);
  };

  const {messages, status, error, mode, representativeOnline, humanTyping, send, reset} =
    chat;

  // Keep the transcript pinned to the latest message / streamed tokens.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => {
    const text = input;
    if (!text.trim() || status === 'streaming') return;
    setInput('');
    void send(text);
  };

  const greeting: ChatMessageType = {
    id: '__greeting__',
    role: 'assistant',
    author: 'ai',
    content: t('greeting'),
    createdAt: '',
  };

  const online = representativeOnline;

  return (
    <motion.div
      role="dialog"
      aria-label={t('title')}
      initial={reduce ? false : {opacity: 0, y: 12, scale: 0.98}}
      animate={{opacity: 1, y: 0, scale: 1}}
      exit={reduce ? {opacity: 0} : {opacity: 0, y: 12, scale: 0.98}}
      transition={{duration: 0.26, ease: EASE}}
      className="flex h-[min(72vh,580px)] w-[calc(100vw-2.5rem)] max-w-[380px] flex-col overflow-hidden rounded-[18px] border border-border-card bg-bg-alt"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border-sub bg-surface px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-ink">
            {t('title')}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
            <span
              className={`inline-block size-1.5 rounded-full ${
                online ? 'bg-emerald-400' : 'bg-amber'
              }`}
              aria-hidden
            />
            {mode === 'human'
              ? t('badge_human')
              : online
                ? t('status_online')
                : t('status_ai')}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void reset()}
            aria-label={t('reset_aria')}
            className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 4v4h4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close_aria')}
            className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Transcript */}
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
      >
        <ChatMessage message={greeting} />
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} />
        ))}
        {humanTyping && (
          <p className="text-[12px] text-muted">
            {t('badge_human')} · {t('typing')}
          </p>
        )}
        {mode === 'human' && (
          <p className="my-1 text-center text-[12px] text-muted">
            {t('handoff_note')}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-[10px] border border-border-sub bg-surface px-3 py-2 text-center text-[12px] text-muted-2"
          >
            {error === 'rate_limited' ? t('rate_limited') : t('error')}
          </p>
        )}
      </div>

      {/* Composer / lead form */}
      {showLead ? (
        <LeadForm
          locale={locale}
          conversationId={chat.conversationId}
          token={chat.conversationToken}
          onCancel={() => setShowLead(false)}
        />
      ) : (
        <div className="border-t border-border-sub bg-surface p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={1}
              placeholder={t('placeholder')}
              aria-label={t('placeholder')}
              className="max-h-28 min-h-[42px] flex-1 resize-none rounded-[10px] border border-border-card bg-surface-2 px-3 py-2.5 text-[14px] text-ink outline-none placeholder:text-faint focus:border-border-ghost"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!input.trim() || status === 'streaming'}
              aria-label={t('send_aria')}
              className="grid size-[42px] shrink-0 place-items-center rounded-full bg-amber text-on-amber transition-colors hover:bg-amber-hi disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg
                viewBox="0 0 24 24"
                className={`size-[18px] ${locale === 'ar' ? '-scale-x-100' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M5 12h13M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={openLead}
              className="text-[11px] text-muted underline-offset-2 transition-colors hover:text-ink hover:underline"
            >
              {t('lead_prompt')}
            </button>
            <p className="text-[10px] tracking-wide text-faint-2">{t('powered')}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
