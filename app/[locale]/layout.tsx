import type {ReactNode} from 'react';
import {notFound} from 'next/navigation';
import {hasLocale, NextIntlClientProvider} from 'next-intl';
import {setRequestLocale, getMessages} from 'next-intl/server';
import {routing, type Locale} from '@/i18n/routing';
import {spaceGrotesk, spaceMono} from '@/lib/fonts';
import ChatWidget from '@/components/chat/ChatWidgetLazy';
import StructuredData from '@/components/seo/StructuredData';
import {pickMessages} from '@/lib/i18n/pickMessages';
import {preload} from 'react-dom';
import {Analytics} from '@vercel/analytics/next';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Enable static rendering for this locale.
  setRequestLocale(locale);
  // Only the namespaces read by always-mounted client islands: chrome (common)
  // and the chat widget (chat). Pages scope the rest via <ScopedMessages>.
  const messages = pickMessages(await getMessages(), ['common', 'chat']);
  // Arabic is the default locale: preload Cairo there only (EN never fetches it).
  if (locale === 'ar') {
    preload('/fonts/cairo-arabic.9ff27b8a.woff2', {as: 'font', type: 'font/woff2', crossOrigin: 'anonymous'});
  }
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${spaceGrotesk.variable} ${spaceMono.variable}`}
    >
      <body className="flex min-h-dvh flex-col bg-bg text-ink font-display antialiased">
        <StructuredData locale={locale as Locale} />
        <NextIntlClientProvider messages={messages} locale={locale}>
          {/* Page chrome (header/footer) is supplied per route: the (marketing)
              group wraps standard pages; the homepage renders its own. The chat
              widget stays global so lead capture is available everywhere. */}
          {children}
          <ChatWidget />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
