'use client';

import {useEffect, useRef, useState} from 'react';
import {useLocale} from 'next-intl';
import {formatMoney} from '@/lib/pricing/config';
import type {EstimateResult} from '@/lib/estimator/types';
import SummaryList from './SummaryList';
import {RangeFigures, weeksText} from './EstimatePanel';
import {useTx} from './i18n';
import {PrintIcon} from './icons';
import type {SummarySection} from './summary';
import {BTN_GHOST} from './ui';

export interface Social {
  label: string;
  href: string;
}

// In print, ink-on-dark tokens flip to black-on-white for this subtree only.
const PRINT_TOKENS =
  'print:bg-white print:text-black print:[--color-ink:black] print:[--color-ink-2:black] print:[--color-muted:dimgray] print:[--color-muted-2:dimgray] print:[--color-faint:dimgray] print:[--color-amber:black] print:[--color-hairline:silver] print:[--color-border-card:gray] print:[--color-glass:white] print:[--color-glass-border:gray]';

export default function SuccessView({
  leadRef,
  duplicate,
  name,
  sections,
  est,
  email,
  socials,
  onRestart,
}: {
  leadRef: string;
  duplicate: boolean;
  name: string;
  sections: SummarySection[];
  est: EstimateResult;
  email: string;
  socials: readonly Social[];
  onRestart: () => void;
}) {
  const t = useTx();
  const locale = useLocale();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle');

  useEffect(() => {
    headingRef.current?.focus({preventScroll: true});
    headingRef.current?.scrollIntoView({block: 'start'});
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(leadRef);
      setCopied('ok');
    } catch {
      setCopied('fail');
    }
  };

  const date = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-u-nu-latn' : 'en-GB', {dateStyle: 'long'}).format(new Date());

  return (
    <div className={`space-y-10 ${PRINT_TOKENS}`}>
      <p className="hidden font-display text-xl font-semibold print:block">
        {t('print_heading')} — <span className="num">{date}</span>
      </p>

      <header>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-h3 font-semibold leading-tight text-ink scroll-mt-28 outline-none"
        >
          {t('success.title')}
        </h1>
        <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-ink-2">{t('success.sub', {name})}</p>
        {duplicate ? <p className="mt-2 text-sm text-muted">{t('success.duplicate')}</p> : null}
      </header>

      <section aria-labelledby="est-ref" className="glass rounded-panel p-5 nav:p-8">
        <h2 id="est-ref" className="u-mono font-mono text-xs uppercase tracking-[0.2em] text-amber">
          {t('success.ref')}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <p dir="ltr" className="num font-mono text-2xl font-semibold tracking-wider text-ink [overflow-wrap:anywhere]">
            {leadRef}
          </p>
          <button type="button" onClick={copy} className={`${BTN_GHOST} print:hidden`}>
            {copied === 'ok' ? t('copied') : t('copy')}
          </button>
          <p role="status" className="sr-only">
            {copied === 'ok' ? t('copied') : copied === 'fail' ? t('copy_failed') : ''}
          </p>
        </div>
        {copied === 'fail' ? <p className="mt-2 text-sm text-muted print:hidden">{t('copy_failed')}</p> : null}
      </section>

      <section aria-labelledby="est-yours" className="glass rounded-panel p-5 nav:p-8">
        <h2 id="est-yours" className="mb-5 font-display text-lg font-semibold text-ink">
          {t('sum.title')}
        </h2>
        <SummaryList sections={sections} />
        <div className="mt-6 grid gap-2 border-t border-hairline pt-5 text-sm text-ink-2">
          <p className="font-display text-2xl font-semibold text-ink">
            <RangeFigures est={est} />
          </p>
          <p>{weeksText(t, est.weeksLow, est.weeksHigh)}</p>
          <p>
            {t('panel.maintenance')}:{' '}
            <span dir="ltr" className="num">
              {formatMoney(est.maintenanceMonthly, locale)}
            </span>{' '}
            {t('panel.per_month')}
          </p>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-muted">{t('disclaimer')}</p>
      </section>

      <section aria-labelledby="est-next">
        <h2 id="est-next" className="mb-4 font-display text-lg font-semibold text-ink">
          {t('next.title')}
        </h2>
        <ol className="space-y-3">
          {([1, 2, 3] as const).map((n) => (
            <li key={n} className="flex gap-4 text-[15px] leading-relaxed text-ink-2">
              <span
                aria-hidden
                className="num flex size-8 shrink-0 items-center justify-center rounded-pill border border-border-amber font-semibold text-amber"
              >
                {n}
              </span>
              <span>{t(`next.${n}`)}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="est-alt" className="print:hidden">
        <h2 id="est-alt" className="mb-3 font-display text-lg font-semibold text-ink">
          {t('alt.title')}
        </h2>
        <ul className="flex flex-wrap gap-3">
          <li>
            <a href={`mailto:${email}`} className={BTN_GHOST}>
              <span dir="ltr">{email}</span>
            </a>
          </li>
          {socials.map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" className={BTN_GHOST}>
                {s.label}
                <span className="sr-only"> {t('new_tab')}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3 print:hidden">
        <button type="button" onClick={() => window.print()} className={BTN_GHOST}>
          <PrintIcon />
          {t('btn_print')}
        </button>
        <button type="button" onClick={onRestart} className={BTN_GHOST}>
          {t('new')}
        </button>
      </div>
    </div>
  );
}
