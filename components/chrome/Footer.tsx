import type {ReactNode} from 'react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import Container from '@/components/ui/Container';
import ScrollToggle from './ScrollToggle';
import {SITE, SOCIALS} from '@/lib/site';
import WhatsAppLink from '@/components/ui/WhatsAppLink';

function ColTitle({children}: {children: ReactNode}) {
  return (
    <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
      {children}
    </p>
  );
}

const linkCls =
  'text-sm text-ink-2 transition-colors hover:text-amber w-fit';

export default function Footer() {
  const t = useTranslations('common');
  return (
    <>
      <footer className="border-t border-border bg-bg-foot">
      <Container className="pt-20 pb-10">
        <div className="grid gap-12 nav:grid-cols-[1fr_1.4fr] nav:gap-16">
          {/* Wordmark + tagline */}
          <div>
            <div
              dir="ltr"
              className="font-display font-bold leading-[0.95] tracking-[-0.03em]"
              style={{fontSize: 'clamp(44px, 8vw, 120px)'}}
            >
              <span className="text-ink">devora</span>
              <span className="text-amber">.</span>
              <span className="text-faint-2">design</span>
            </div>
            <p className="mt-4 max-w-[380px] text-base text-muted-2">
              {t('footer_tag')}
            </p>
          </div>

          {/* Link columns: every page is reachable from the footer. */}
          <nav aria-label={t('footer_nav_aria')} className="grid grid-cols-2 gap-8 nav:grid-cols-4">
            <div className="flex flex-col">
              <ColTitle>{t('footer_services')}</ColTitle>
              <div className="flex flex-col gap-2.5">
                <Link href="/services#websites" className={linkCls}>{t('nav_pillar_web')}</Link>
                <Link href="/services#automation" className={linkCls}>{t('nav_pillar_auto')}</Link>
                <Link href="/services#software" className={linkCls}>{t('nav_pillar_soft')}</Link>
                <Link href="/industries" className={linkCls}>{t('nav_industries')}</Link>
              </div>
            </div>

            <div className="flex flex-col">
              <ColTitle>{t('footer_tools')}</ColTitle>
              <div className="flex flex-col gap-2.5">
                <Link href="/estimate" className={linkCls}>{t('nav_estimate')}</Link>
                <Link href="/automation-roi" className={linkCls}>{t('nav_roi')}</Link>
                <Link href="/pricing" className={linkCls}>{t('nav_pricing')}</Link>
                <Link href="/faq" className={linkCls}>{t('nav_faq')}</Link>
              </div>
            </div>

            <div className="flex flex-col">
              <ColTitle>{t('footer_more')}</ColTitle>
              <div className="flex flex-col gap-2.5">
                <Link href="/" className={linkCls}>{t('nav_home')}</Link>
                <Link href="/work" className={linkCls}>{t('nav_work')}</Link>
                <Link href="/about" className={linkCls}>{t('nav_about')}</Link>
                <Link href="/process" className={linkCls}>{t('nav_process')}</Link>
              </div>
            </div>

            <div className="flex flex-col">
              <ColTitle>{t('footer_contact')}</ColTitle>
              <div className="flex flex-col gap-2.5">
                <a href={`mailto:${SITE.email}`} className={linkCls} dir="ltr">
                  {SITE.email}
                </a>
                <WhatsAppLink className={linkCls} showNumber={false} />
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkCls}
                  >
                    {s.label} <span dir="ltr">↗</span>
                  </a>
                ))}
                <Link
                  href="/contact"
                  className="w-fit text-sm font-medium text-amber transition-colors hover:text-amber-hi"
                >
                  {t('nav_cta')}
                </Link>
              </div>
            </div>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-border-sub pt-6 font-mono text-[11px] text-faint-2">
          <span>{t('footer_copy')}</span>
          <span dir="ltr">{t('footer_sig')}</span>
        </div>
      </Container>
      </footer>
      <ScrollToggle />
    </>
  );
}
