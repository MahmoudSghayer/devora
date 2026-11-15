'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {motion} from 'motion/react';
import {useTranslations} from 'next-intl';
import {Link, usePathname} from '@/i18n/navigation';
import {EASE} from '@/lib/motion';
import {useScrollDirection} from '@/lib/hooks/useScrollDirection';
import {useFocusTrap} from '@/lib/hooks/useFocusTrap';
import {useScrollLock} from '@/lib/hooks/useScrollLock';
import Container from '@/components/ui/Container';
import Logo from './Logo';
import LanguageToggle from './LanguageToggle';

// Primary IA: Services · Work · Cost estimator · Automation ROI · Pricing · About.
// `tool` items are the two lead calculators (marked with the cool signal dot).
const NAV = [
  {href: '/services', key: 'nav_services'},
  {href: '/work', key: 'nav_work'},
  {href: '/estimate', key: 'nav_estimate', tool: true},
  {href: '/automation-roi', key: 'nav_roi', tool: true},
  {href: '/about', key: 'nav_about'},
] as const;

export default function Header() {
  const t = useTranslations('common');
  const pathname = usePathname();
  const hidden = useScrollDirection(320);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useFocusTrap(panelRef, open, close);
  useScrollLock(open);
  // Close on route change.
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <motion.header
      initial={false}
      animate={{y: hidden && !open ? '-105%' : '0%'}}
      transition={{duration: 0.4, ease: EASE}}
      className="glass sticky top-0 border-x-0 border-t-0"
      style={{zIndex: 'var(--z-header)'}}
    >
      <Container className="flex h-[76px] items-center gap-6">
        <Logo />

        <div className="ms-auto flex items-center gap-3 nav:gap-5">
          <nav aria-label={t('nav_aria')} className="hidden items-center gap-5 nav:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`u-mono inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
                  isActive(item.href) ? 'text-amber' : 'text-muted-2 hover:text-ink'
                }`}
              >
                {'tool' in item && (
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-signal" />
                )}
                {t(item.key)}
              </Link>
            ))}
          </nav>

          <LanguageToggle />

          <Link
            href="/contact"
            className="hidden rounded-pill bg-amber px-[22px] py-[11px] font-display text-sm font-semibold text-on-amber transition-colors hover:bg-amber-hi nav:inline-block"
          >
            {t('nav_cta')}
          </Link>

          <button
            type="button"
            aria-label={open ? t('menu_close') : t('menu_open')}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-input border border-border-ghost text-ink nav:hidden"
          >
            <span aria-hidden className="relative block h-[14px] w-[18px]">
              <span
                className={`absolute inset-x-0 block h-[2px] bg-current transition-all duration-300 ${
                  open ? 'top-[6px] rotate-45' : 'top-0'
                }`}
              />
              <span
                className={`absolute inset-x-0 block h-[2px] bg-current transition-all duration-300 ${
                  open ? 'top-[6px] -rotate-45' : 'top-[12px]'
                }`}
              />
            </span>
          </button>
        </div>
      </Container>

      {open && (
        <div
          id="mobile-menu"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={t('menu_label')}
          className="border-t border-hairline bg-bg nav:hidden"
        >
          <Container className="flex max-h-[calc(100dvh-76px)] flex-col overflow-y-auto py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`flex items-center gap-2.5 border-b border-hairline py-4 text-[18px] font-medium ${
                  isActive(item.href) ? 'text-amber' : 'text-ink'
                }`}
              >
                {'tool' in item && (
                  <span aria-hidden className="h-2 w-2 rounded-full bg-signal" />
                )}
                {t(item.key)}
              </Link>
            ))}
            <Link
              href="/contact"
              className="mt-5 rounded-pill bg-amber px-6 py-3.5 text-center font-semibold text-on-amber"
            >
              {t('nav_cta')}
            </Link>
          </Container>
        </div>
      )}
    </motion.header>
  );
}
