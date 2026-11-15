'use client';

import {useCallback, useEffect, useState} from 'react';
import {AnimatePresence} from 'motion/react';
import {useLocale, useTranslations} from 'next-intl';
import type {ChatLocale} from '@/lib/chat/types';
import {useChat} from './useChat';
import ChatLauncher from './ChatLauncher';
import ChatPanel from './ChatPanel';

// Mounted once in app/[locale]/layout.tsx → present on every public page, in
// both locales, with RTL inherited from <html dir>. The conversation state
// lives here so it survives the panel closing/reopening.
export default function ChatWidget({initialOpen = false}: {initialOpen?: boolean}) {
  const localeRaw = useLocale();
  const locale: ChatLocale = localeRaw === 'ar' ? 'ar' : 'en';
  const t = useTranslations('chat');
  const [open, setOpen] = useState(initialOpen);
  const chat = useChat(locale);

  // A click on the pre-load launcher opens the panel as soon as the widget mounts.
  useEffect(() => {
    if (initialOpen) void chat.ensureConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next) void chat.ensureConversation();
      return next;
    });
  }, [chat]);

  return (
    <div className="fixed bottom-5 end-5 z-[60] flex flex-col items-end gap-3 print:hidden">
      <AnimatePresence>
        {open && (
          <ChatPanel locale={locale} chat={chat} onClose={() => setOpen(false)} />
        )}
      </AnimatePresence>
      <ChatLauncher open={open} label={t('launcher_aria')} onClick={toggle} />
    </div>
  );
}
