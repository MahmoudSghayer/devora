import type {ReactNode} from 'react';
import {AlertIcon} from './icons';

export const inputCls =
  'min-h-11 w-full rounded-input border border-border-card bg-surface px-4 py-2.5 font-display text-[15px] text-ink outline-none transition-colors placeholder:text-faint focus-visible:border-signal aria-[invalid=true]:border-amber';

export const primaryBtn =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-pill bg-amber px-7 py-3 font-display text-base font-semibold text-on-amber transition-colors hover:bg-amber-hi disabled:cursor-not-allowed disabled:opacity-60 print:hidden';

export const ghostBtn =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border border-border-ghost px-5 py-2.5 font-display text-sm font-semibold text-ink-2 transition-colors hover:border-signal hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 print:hidden';

export const iconBtn =
  'inline-flex size-11 items-center justify-center rounded-pill border border-border-card text-ink-2 transition-colors hover:border-signal hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 print:hidden';

/** Numbers/currency inside RTL copy stay left-to-right. */
export function Ltr({children, className = ''}: {children: ReactNode; className?: string}) {
  return (
    <bdi dir="ltr" className={`num inline-block ${className}`}>
      {children}
    </bdi>
  );
}

export function ErrorText({id, children}: {id: string; children: ReactNode}) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-[13px] leading-snug text-amber-hi">
      <AlertIcon className="mt-px size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function Eyebrow({children, className = ''}: {children: ReactNode; className?: string}) {
  return (
    <p className={`u-mono font-mono text-[11px] uppercase tracking-[0.2em] text-muted-2 ${className}`}>{children}</p>
  );
}

export function NumField({
  id,
  label,
  hint,
  value,
  onChange,
  error,
  suffix,
  step = 'any',
  inputMode = 'decimal',
  className = '',
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  suffix?: string;
  step?: string;
  inputMode?: 'decimal' | 'numeric';
  className?: string;
}) {
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy = [hint ? hintId : '', error ? errId : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium leading-snug text-ink-2">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode={inputMode}
          step={step}
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${inputCls} num ${suffix ? 'pe-20' : ''}`}
        />
        {suffix && (
          <span aria-hidden className="pointer-events-none absolute inset-y-0 end-4 flex items-center text-sm text-muted-2">
            {suffix}
          </span>
        )}
      </div>
      {hint && (
        <p id={hintId} className="text-xs leading-snug text-muted-2">
          {hint}
        </p>
      )}
      {error && <ErrorText id={errId}>{error}</ErrorText>}
    </div>
  );
}

export function RangeField({
  id,
  label,
  value,
  min = 0,
  max = 100,
  step = 5,
  display,
  valueText,
  onChange,
  describedBy,
}: {
  id: string;
  label: ReactNode;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  display: string;
  valueText: string;
  onChange: (v: number) => void;
  describedBy?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium leading-snug text-ink-2">
          {label}
        </label>
        <output htmlFor={id} className="num shrink-0 font-display text-lg font-semibold text-signal">
          <Ltr>{display}</Ltr>
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={valueText}
        aria-describedby={describedBy}
        className="h-11 w-full cursor-pointer accent-signal"
      />
    </div>
  );
}

export interface Option {
  value: string;
  label: string;
}

/** Native radio group styled as option cards. The first radio carries the field id so errors can focus it. */
export function OptionGroup({
  name,
  legend,
  options,
  value,
  onSelect,
  error,
  firstId,
  hint,
  className = '',
}: {
  name: string;
  legend: string;
  options: readonly Option[];
  value: string;
  onSelect: (v: string) => void;
  error?: string;
  firstId?: string;
  hint?: string;
  className?: string;
}) {
  const errId = `${name}-err`;
  const hintId = `${name}-hint`;
  return (
    <fieldset
      className={`min-w-0 ${className}`}
      aria-describedby={[hint ? hintId : '', error ? errId : ''].filter(Boolean).join(' ') || undefined}
    >
      <legend className="mb-3 text-sm font-medium leading-snug text-ink-2">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o, i) => {
          const checked = o.value === value;
          return (
            <label
              key={o.value}
              className={`flex min-h-11 cursor-pointer items-center rounded-pill border px-4 py-2 text-sm font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-amber ${
                checked ? 'border-signal bg-signal-lo text-ink' : 'border-border-card text-ink-2 hover:border-border-ghost'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                id={i === 0 ? firstId : undefined}
                checked={checked}
                onChange={() => onSelect(o.value)}
                className="peer sr-only"
              />
              <span className="flex items-center gap-2">
                <span aria-hidden className={`size-2 rounded-pill ${checked ? 'bg-signal' : 'bg-border-ghost'}`} />
                {o.label}
              </span>
            </label>
          );
        })}
      </div>
      {hint && (
        <p id={hintId} className="mt-2 text-xs leading-snug text-muted-2">
          {hint}
        </p>
      )}
      {error && (
        <div className="mt-2">
          <ErrorText id={errId}>{error}</ErrorText>
        </div>
      )}
    </fieldset>
  );
}

/** "Enter exact numbers" switch (a native checkbox). */
export function ExactToggle({
  id,
  checked,
  onChange,
  label,
  hint,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col gap-1 print:hidden">
      <label
        htmlFor={id}
        className="flex min-h-11 w-fit cursor-pointer items-center gap-3 text-sm font-semibold text-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-amber"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby={`${id}-hint`}
          className="size-5 accent-signal"
        />
        {label}
      </label>
      <p id={`${id}-hint`} className="max-w-[68ch] text-xs leading-snug text-muted-2">
        {hint}
      </p>
    </div>
  );
}
