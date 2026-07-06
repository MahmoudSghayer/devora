import type {ReactNode} from 'react';
import {useTranslations} from 'next-intl';
import {SITE, SOCIALS} from '@/lib/site';

function Block({title, children}: {title: string; children: ReactNode}) {
  return (
    <div className="border-t border-border py-7">
      <p className="u-mono font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
        {title}
      </p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function ContactAside() {
  const t = useTranslations('contact');
  return (
    <div className="border-b border-border">
      <Block title={t('a1_t')}>
        <a
          href={`mailto:${SITE.email}`}
          dir="ltr"
          className="text-2xl font-semibold text-ink transition-colors hover:text-amber"
        >
          {SITE.email}
        </a>
      </Block>

      <Block title={t('a2_t')}>
        <div className="flex flex-col gap-2">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit text-[15px] text-ink-2 transition-colors hover:text-amber"
            >
              {s.label} <span dir="ltr">↗</span>
            </a>
          ))}
        </div>
      </Block>

      <Block title={t('a3_t')}>
        <p className="text-base leading-relaxed text-ink-2">{t('a3_d')}</p>
      </Block>
    </div>
  );
}
