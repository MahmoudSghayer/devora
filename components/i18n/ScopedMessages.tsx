import type {ReactNode} from 'react';
import {NextIntlClientProvider} from 'next-intl';
import {getLocale, getMessages} from 'next-intl/server';
import {pickMessages} from '@/lib/i18n/pickMessages';

/**
 * Server wrapper for a page's client islands: provides only the listed message
 * namespaces (plus `common`, used by the shared arrow buttons/links) instead of
 * the whole catalogue. Replaces — not merges with — the layout-level provider.
 */
export default async function ScopedMessages({
  namespaces,
  children,
}: {
  namespaces: readonly string[];
  children: ReactNode;
}) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  return (
    <NextIntlClientProvider locale={locale} messages={pickMessages(messages, [...namespaces, 'common'])}>
      {children}
    </NextIntlClientProvider>
  );
}
