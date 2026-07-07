import type {ReactNode} from 'react';
import {notFound} from 'next/navigation';
import {hasLocale, NextIntlClientProvider} from 'next-intl';
import {setRequestLocale, getMessages} from 'next-intl/server';
import {routing} from '@/i18n/routing';
import {spaceGrotesk, spaceMono, arabic} from '@/lib/fonts';
import Header from '@/components/chrome/Header';
import Footer from '@/components/chrome/Footer';
import ScrollProgress from '@/components/chrome/ScrollProgress';
import ChatWidget from '@/components/chat/ChatWidget';
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
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${spaceGrotesk.variable} ${spaceMono.variable} ${arabic.variable}`}
    >
      <body className="flex min-h-dvh flex-col bg-bg text-ink font-display antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ScrollProgress />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <ChatWidget />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
