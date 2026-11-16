'use client';

import {useCallback, useEffect, useState} from 'react';
import dynamic from 'next/dynamic';
import {useTranslations} from 'next-intl';
import {aboveBottomBar} from './bottomBar';

// The full widget (panel, streaming, Supabase realtime) is not needed for first
// paint. A static launcher button renders immediately in the exact slot the real
// one occupies (no layout shift); the widget chunk loads on first interaction
// or when the browser goes idle, and a click made before then opens the panel
// as soon as it mounts.
const ChatWidget = dynamic(() => import('./ChatWidget'), {ssr: false});

const IDLE_TIMEOUT_MS = 4000;
const WAKE_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;

export default function ChatWidgetLazy() {
  const t = useTranslations('chat');
  const [loaded, setLoaded] = useState(false);
  const [openOnLoad, setOpenOnLoad] = useState(false);

  useEffect(() => {
    if (loaded) return;
    const load = () => setLoaded(true);
    const hasIdle = 'requestIdleCallback' in window;
    const idle = hasIdle
      ? window.requestIdleCallback(load, {timeout: IDLE_TIMEOUT_MS})
      : window.setTimeout(load, IDLE_TIMEOUT_MS);
    WAKE_EVENTS.forEach((e) => window.addEventListener(e, load, {once: true, passive: true}));
    return () => {
      if (hasIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      WAKE_EVENTS.forEach((e) => window.removeEventListener(e, load));
    };
  }, [loaded]);

  const onClick = useCallback(() => {
    setOpenOnLoad(true);
    setLoaded(true);
  }, []);

  if (loaded) return <ChatWidget initialOpen={openOnLoad} />;

  return (
    <div
      className="fixed end-5 z-[60] flex flex-col items-end gap-3 print:hidden"
      style={{bottom: aboveBottomBar('1.25rem')}}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={t('launcher_aria')}
        aria-expanded={false}
        className="grid size-14 place-items-center self-end rounded-full bg-amber text-on-amber outline-none ring-offset-2 ring-offset-bg focus-visible:ring-2 focus-visible:ring-amber"
      >
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path
            d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
