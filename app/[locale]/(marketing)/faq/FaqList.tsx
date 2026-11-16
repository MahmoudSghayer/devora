'use client';

import {useState} from 'react';
import {Link} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';

export type FaqItem = {q: string; a: string; link?: {href: string; label: string}};

// Accessible accordion with an optional follow-up link under each answer.
// Items arrive pre-translated from the server page.
export default function FaqList({items, idPrefix}: {items: FaqItem[]; idPrefix: string}) {
  const c = useTranslations('common');
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="glass overflow-hidden rounded-card">
      {items.map((it, i) => {
        const isOpen = open === i;
        const panelId = `${idPrefix}-${i}-panel`;
        return (
          <div key={it.q} className="border-b border-hairline last:border-b-0">
            <h3>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex min-h-14 w-full items-center justify-between gap-6 px-6 py-5 text-start nav:px-8"
              >
                <span className="font-display text-lg font-medium text-ink">{it.q}</span>
                <span
                  aria-hidden
                  className={`shrink-0 font-mono text-xl text-amber transition-transform duration-300 ${
                    isOpen ? 'rotate-45' : ''
                  }`}
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden" inert={!isOpen}>
                <div className="px-6 pb-6 nav:px-8">
                  <p className="max-w-[720px] text-[15px] leading-[1.7] text-muted">{it.a}</p>
                  {it.link && (
                    <Link
                      href={it.link.href}
                      className="mt-4 inline-flex min-h-11 items-center gap-1.5 font-display text-sm font-medium text-amber transition-colors hover:text-amber-hi"
                    >
                      {it.link.label} <span>{c('arrow')}</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
