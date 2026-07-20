'use client';

import {useState} from 'react';
import {motion} from 'motion/react';
import {useTranslations} from 'next-intl';
import {Link, usePathname} from '@/i18n/navigation';
import {EASE} from '@/lib/motion';
import {useScrollDirection} from '@/lib/hooks/useScrollDirection';
import Container from '@/components/ui/Container';
import Logo from './Logo';
import LanguageToggle from './LanguageToggle';

const NAV = [
  {href: '/work', key: 'nav_work'},
  {href: '/services', key: 'nav_services'},
  {href: '/pricing', key: 'nav_pricing'},
  {href: '/about', key: 'nav_about'},
  {href: '/contact', key: 'nav_contact'},
] as const;

export default function Header() {
  const t = useTranslations('common');
  const pathname = usePathname();
  const hidden = useScrollDirection(320);
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <motion.header
      initial={false}
      animate={{y: hidden ? '-105%' : '0%'}}
      transition={{duration: 0.4, ease: EASE}}
      className="sticky top-0 z-50 border-b border-border bg-[rgba(5,6,9,0.82)] backdrop-blur-[12px]"
    >
      <Container className="flex h-[76px] items-center gap-6">
        <Logo />

        <div className="ms-auto flex items-center gap-3 nav:gap-6">
          <nav className="hidden items-center gap-6 nav:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-mono text-[11px] uppercase tracking-[0.18em] transition-colors ${
                  isActive(item.href)
                    ? 'text-amber'
                    : 'text-muted-2 hover:text-ink'
                }`}
              >
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
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-border-ghost text-ink nav:hidden"
          >
            <span className="flex flex-col gap-[5px]">
              <span className="block h-[2px] w-[18px] bg-current" />
              <span className="block h-[2px] w-[18px] bg-current" />
            </span>
          </button>
        </div>
      </Container>

      {open && (
        <nav className="border-t border-border bg-[rgba(5,6,9,0.97)] backdrop-blur-[12px] nav:hidden">
          <Container className="flex flex-col py-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`py-3 text-[17px] font-medium ${
                  isActive(item.href) ? 'text-amber' : 'text-ink'
                }`}
              >
                {t(item.key)}
              </Link>
            ))}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="mt-3 rounded-pill bg-amber px-6 py-3 text-center font-semibold text-on-amber"
            >
              {t('nav_cta')}
            </Link>
          </Container>
        </nav>
      )}
    </motion.header>
  );
}
