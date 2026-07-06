'use client';

import {useLocale, useTranslations} from 'next-intl';
import {usePathname, useRouter} from '@/i18n/navigation';

// Switches locale while staying on the same page. next-intl persists the
// choice via the NEXT_LOCALE cookie. Label shows the OTHER language.
export default function LanguageToggle() {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const other = locale === 'ar' ? 'en' : 'ar';

  return (
    <button
      type="button"
      dir="ltr"
      onClick={() => router.replace(pathname, {locale: other})}
      className="rounded-pill border border-border-ghost px-4 py-2 font-mono text-xs text-ink transition-colors hover:border-amber hover:text-amber"
    >
      {t('lang_toggle')}
    </button>
  );
}
