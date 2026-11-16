'use client';

import {useCallback, useRef, useState} from 'react';
import {AnimatePresence, motion, useReducedMotion} from 'motion/react';
import {useFocusTrap} from '@/lib/hooks/useFocusTrap';
import {useScrollLock} from '@/lib/hooks/useScrollLock';
import type {EstimateResult} from '@/lib/estimator/types';
import EstimatePanel, {RangeFigures} from './EstimatePanel';
import {useBottomBar} from '@/components/chat/bottomBar';
import {ChevronIcon} from './icons';
import {useTx} from './i18n';

/**
 * Mobile estimate: a collapsed total bar pinned to the bottom that expands
 * into a dialog sheet (focus trapped, Escape/backdrop closes, focus restored).
 * Hidden at `nav:` where the sticky side panel takes over.
 */
export default function MobileSheet({est, hasTypes}: {est: EstimateResult; hasTypes: boolean}) {
  const t = useTx();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  useBottomBar(barRef);
  const close = useCallback(() => setOpen(false), []);
  useFocusTrap(sheetRef, open, close);
  useScrollLock(open);

  return (
    <div className="nav:hidden print:hidden">
      <div
        ref={barRef}
        className="glass-hi fixed inset-x-0 bottom-0 flex items-center justify-between gap-3 rounded-t-panel ps-5 pe-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3"
        style={{zIndex: 'var(--z-sheet)'}}
      >
        <div className="min-w-0">
          <p className="text-[12px] leading-none text-muted">{t('sheet.bar_label')}</p>
          <p className="mt-1.5 truncate font-display text-base font-semibold leading-none text-ink">
            {hasTypes ? <RangeFigures est={est} /> : <span className="text-sm font-normal text-muted">{t('sheet.bar_empty')}</span>}
          </p>
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="est-sheet"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-pill border border-border-ghost px-4 text-sm font-semibold text-ink hover:border-amber"
        >
          {t('sheet.open')}
          <ChevronIcon />
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0" style={{zIndex: 'var(--z-overlay)'}}>
            <motion.div
              aria-hidden
              className="absolute inset-0 bg-bg/70 backdrop-blur-sm"
              initial={reduced ? false : {opacity: 0}}
              animate={{opacity: 1}}
              exit={reduced ? undefined : {opacity: 0}}
              onClick={close}
            />
            <motion.div
              id="est-sheet"
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-label={t('sheet.title')}
              className="glass-hi absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-panel"
              initial={reduced ? false : {y: '100%'}}
              animate={{y: 0}}
              exit={reduced ? undefined : {y: '100%'}}
              transition={{type: 'spring', stiffness: 260, damping: 32}}
            >
              <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3">
                <p className="font-display text-base font-semibold text-ink">{t('sheet.title')}</p>
                <button
                  type="button"
                  onClick={close}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-pill border border-border-ghost px-4 text-sm font-semibold text-ink hover:border-amber"
                >
                  {t('sheet.close')}
                  <ChevronIcon className="rotate-180" />
                </button>
              </div>
              <div className="overflow-y-auto overscroll-contain px-5 py-5">
                <EstimatePanel est={est} hasTypes={hasTypes} headingLevel={3} />
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
