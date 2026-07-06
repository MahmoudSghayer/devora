'use client';

import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import Magnetic from '@/components/motion/Magnetic';

// Magnetic pill CTA with a nudging directional arrow. Sizing/padding come from
// className. The arrow glyph is locale-aware (→ / ←) via common.arrow.
export default function ArrowButton({
  href,
  label,
  variant = 'amber',
  className = '',
}: {
  href: string;
  label: string;
  variant?: 'amber' | 'dark';
  className?: string;
}) {
  const c = useTranslations('common');
  const styles =
    variant === 'amber'
      ? 'bg-amber text-on-amber hover:bg-amber-hi'
      : 'bg-on-amber text-amber hover:bg-dark-btn-hi';
  return (
    <Magnetic>
      <Link
        href={href}
        className={`inline-flex items-center gap-2 rounded-pill font-display font-semibold transition-colors ${styles} ${className}`}
      >
        {label}
        <span className="animate-nudge inline-block">{c('arrow')}</span>
      </Link>
    </Magnetic>
  );
}
