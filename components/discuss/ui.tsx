'use client';

import {useId, type ReactNode} from 'react';
import Spotlight from '@/components/motion/Spotlight';
import {CheckIcon} from './icons';

// Shared form/selection primitives: real inputs inside labels, state shown by
// shape (check mark / filled dot) as well as colour, ≥44px targets. Selection
// accents use the soft violet pillar tint; amber is reserved for CTAs.

/** Question group: <fieldset> + <legend> + optional hint. */
export function Group({
  legend,
  hint,
  hideLegend = false,
  children,
  className = '',
}: {
  legend: string;
  hint?: string;
  hideLegend?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const hintId = useId();
  return (
    <fieldset className={`min-w-0 border-0 p-0 ${className}`} aria-describedby={hint ? hintId : undefined}>
      <legend className={hideLegend ? 'sr-only' : 'mb-1 block font-display text-lg font-semibold text-ink'}>{legend}</legend>
      {hint ? (
        <p id={hintId} className="mb-4 text-sm leading-relaxed text-muted">
          {hint}
        </p>
      ) : null}
      {children}
    </fieldset>
  );
}

const CARD =
  'flex min-h-14 items-center gap-3 rounded-card border border-glass-border bg-glass px-4 py-3 text-start backdrop-blur-[14px] transition-colors peer-checked:border-pillar-soft peer-checked:bg-glass-hi peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-amber';

/** Checkbox or radio presented as a selectable card. */
export function Choice({
  kind,
  name,
  checked,
  onChange,
  label,
  icon,
  value,
}: {
  kind: 'checkbox' | 'radio';
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  icon?: ReactNode;
  value?: string;
}) {
  return (
    <label className="relative block cursor-pointer">
      <input type={kind} name={name} value={value} checked={checked} onChange={onChange} className="peer sr-only" />
      <Spotlight tone="soft" className={CARD}>
        {icon ? <span className="shrink-0 text-pillar-soft">{icon}</span> : null}
        <span className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-ink">{label}</span>
        <span
          aria-hidden
          className={`flex size-6 shrink-0 items-center justify-center border ${
            kind === 'radio' ? 'rounded-pill' : 'rounded-chip'
          } ${checked ? 'border-pillar-soft bg-pillar-soft text-on-amber' : 'border-border-ghost text-transparent'}`}
        >
          {kind === 'radio' ? <span className={`size-2 rounded-pill ${checked ? 'bg-on-amber' : ''}`} /> : <CheckIcon className="size-4" />}
        </span>
      </Spotlight>
    </label>
  );
}

export const FIELD =
  'block min-h-11 w-full rounded-input border border-border-ghost bg-surface px-4 py-2.5 text-[15px] text-ink placeholder:text-faint aria-[invalid=true]:border-danger';

export function Field({
  label,
  optionalText,
  error,
  hint,
  children,
}: {
  label: string;
  optionalText?: string;
  error?: string;
  hint?: string;
  children: (a: {id: string; describedBy: string | undefined; invalid: boolean}) => ReactNode;
}) {
  const id = useId();
  const describedBy = [error ? `${id}-e` : '', hint ? `${id}-h` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline gap-2 text-sm font-medium text-ink-2">
        {label}
        {optionalText ? <span className="text-xs font-normal text-muted">{optionalText}</span> : null}
      </label>
      {children({id, describedBy, invalid: Boolean(error)})}
      {hint ? (
        <p id={`${id}-h`} className="mt-1.5 text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-e`} className="mt-1.5 flex items-start gap-1.5 text-[13px] font-medium text-danger">
          <span aria-hidden>!</span>
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

export const BTN_PRIMARY =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-pill bg-amber px-7 py-3 font-display text-base font-semibold text-on-amber transition-colors hover:bg-amber-hi aria-disabled:cursor-not-allowed aria-disabled:opacity-50 disabled:cursor-not-allowed disabled:opacity-50';
export const BTN_GHOST =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-pill border border-border-ghost px-6 py-3 font-display text-base font-semibold text-ink transition-colors hover:border-amber hover:text-amber';
