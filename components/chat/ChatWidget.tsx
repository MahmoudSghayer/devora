'use client';

import {useCallback, useState} from 'react';
import {AnimatePresence} from 'motion/react';
import {useLocale, useTranslations} from 'next-intl';
import type {ChatLocale} from '@/lib/chat/types';
import {useChat} from './useChat';
import ChatLauncher from './ChatLauncher';
import ChatPanel from './ChatPanel';

// Mounted once in app/[locale]/layout.tsx → present on every public page, in
// both locales, with RTL inherited from <html dir>. The conversation state
// lives here so it survives the panel closing/reopening.
export default function ChatWidget() {
  const localeRaw = useLocale();
  const locale: ChatLocale = localeRaw === 'ar' ? 'ar' : 'en';
  const t = useTranslations('chat');
  const [open, setOpen] = useState(false);
  const chat = useChat(locale);

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
