'use client';

import {useEffect, useRef, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import Spotlight from '@/components/motion/Spotlight';
import type {RoiResult} from '@/lib/roi/types';
import {SITE, SOCIALS} from '@/lib/site';
import {CheckIcon} from './icons';
import {money, num} from './format';
import type {Submitted} from './LeadForm';
import type {CalcState} from './model';
import {Ltr, ghostBtn} from './ui';

export default function Success({
  state,
  result,
  submitted,
  onRestart,
}: {
  state: CalcState;
  result: RoiResult;
  submitted: Submitted;
  onRestart: () => void;
}) {
  const t = useTranslations('roi');
  const locale = useLocale();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [copy, setCopy] = useState<'idle' | 'ok' | 'fail'>('idle');
  const date = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-u-nu-latn' : 'en-GB', {dateStyle: 'medium'}).format(new Date());

  useEffect(() => {
    headingRef.current?.focus({preventScroll: true});
    headingRef.current?.scrollIntoView({block: 'start'});
  }, []);

  async function copyRef() {
    try {
      await navigator.clipboard.writeText(submitted.leadRef);
      setCopy('ok');
    } catch {
      setCopy('fail');
    }
  }

  const instagram = SOCIALS.find((s) => s.label === 'Instagram');

  return (
    <div className="flex flex-col gap-6 print:gap-4 print:bg-white print:text-black print:[&_*]:!text-black">
      <Spotlight tone="signal" className="glass rounded-panel">
        <div className="flex flex-col gap-5 rounded-panel p-5 nav:p-8">
          <div className="flex items-start gap-4">
            <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-pill border border-signal text-signal">
              <CheckIcon className="size-6" />
            </span>
            <div>
              <h1 ref={headingRef} tabIndex={-1} className="font-display text-h3 font-semibold text-ink scroll-mt-28 outline-none">
                {t('success.title')}
              </h1>
              <p className="mt-1 text-base text-muted">{t('success.sub')}</p>
            </div>
          </div>
          <p className="hidden text-lg font-semibold print:block">{t('success.printHeading')}</p>
          <div className="flex flex-wrap items-center gap-4 rounded-card border border-border-card bg-surface/60 p-4">
            <div>
              <p className="text-xs text-muted-2">{t('success.refLabel')}</p>
              <p className="num select-all font-mono text-2xl font-semibold tracking-wider text-signal" data-testid="lead-ref">
                <Ltr>{submitted.leadRef}</Ltr>
              </p>
            </div>
            <button type="button" className={ghostBtn} onClick={copyRef}>
              {copy === 'ok' ? t('success.copied') : t('success.copy')}
            </button>
            <p role="status" className="text-sm text-muted">
              {copy === 'fail' ? t('success.copyFail') : copy === 'ok' ? t('success.copied') : ''}
            </p>
          </div>
          {submitted.duplicate && <p className="text-sm text-amber-hi">{t('success.duplicate')}</p>}
        </div>
      </Spotlight>

      <Spotlight tone="signal" className="glass rounded-panel">
        <div className="flex flex-col gap-4 rounded-panel p-5 nav:p-8">
          <h2 className="font-display text-xl font-semibold text-ink">{t('success.recapTitle')}</h2>
          <dl className="grid grid-cols-1 gap-4 min-[560px]:grid-cols-3">
            <div>
              <dt className="text-sm text-muted">{t('form.recapHours')}</dt>
              <dd className="num font-display text-2xl font-semibold text-ink"><Ltr>{num(result.savedHoursMonthly, locale, 1)}</Ltr></dd>
            </div>
            <div>
              <dt className="text-sm text-muted">{t('form.recapValue')}</dt>
              <dd className="num font-display text-2xl font-semibold text-ink"><Ltr>{money(result.capacityValueMonthly, locale)}</Ltr></dd>
            </div>
            <div>
              <dt className="text-sm text-muted">{t('form.recapTasks')}</dt>
              <dd className="font-display text-2xl font-semibold text-ink"><Ltr>{state.tasks.length}</Ltr></dd>
            </div>
          </dl>
          <ul className="flex flex-wrap gap-2">
            {state.tasks.map((x) => (
              <li key={x.taskId} className="rounded-pill border border-border-chip px-3 py-1 text-sm text-ink-2">
                {t(`task.${x.taskId}`)}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-2">{t('success.recapNote', {date})}</p>
        </div>
      </Spotlight>

      <Spotlight tone="signal" className="glass rounded-panel print:hidden">
        <div className="flex flex-col gap-4 rounded-panel p-5 nav:p-8">
          <h2 className="font-display text-xl font-semibold text-ink">{t('success.nextTitle')}</h2>
          <ol className="flex list-decimal flex-col gap-2 ps-5 text-base leading-relaxed text-ink-2">
            <li>{t('success.next1')}</li>
            <li>{t('success.next2', {channel: t(`form.channel.${submitted.channel}`)})}</li>
            <li>{t('success.next3')}</li>
          </ol>
        </div>
      </Spotlight>

      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <button type="button" className={ghostBtn} onClick={() => window.print()}>
          {t('success.print')}
        </button>
        <button type="button" className={ghostBtn} onClick={onRestart}>
          {t('success.again')}
        </button>
      </div>

      <div className="flex flex-col gap-2 text-sm text-muted print:hidden">
        <p className="font-semibold text-ink-2">{t('success.altTitle')}</p>
        <a href={`mailto:${SITE.email}`} className="inline-flex min-h-11 w-fit items-center text-signal underline underline-offset-4">
          {t('success.altEmail')}: <Ltr className="ms-1">{SITE.email}</Ltr>
        </a>
        {instagram && (
          <a href={instagram.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-fit items-center text-signal underline underline-offset-4">
            {t('success.altInstagram')}
          </a>
        )}
      </div>
    </div>
  );
}
