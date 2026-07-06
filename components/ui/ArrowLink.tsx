'use client';

import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';

// Text "All work →" style amber link with a locale-aware arrow.
export default function ArrowLink({href, label}: {href: string; label: string}) {
  const c = useTranslations('common');
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1.5 font-display text-sm font-medium text-amber transition-colors hover:text-amber-hi"
    >
      {label} <span>{c('arrow')}</span>
    </Link>
  );
}
