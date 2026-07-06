import {Link} from '@/i18n/navigation';

// The mark: rounded-bracket outline + centred amber dot. Built as a CSS box so
// the signature asymmetric corner (9/9/9/2 at 30px) is exact. Scales with size.
export function LogoMark({size = 30}: {size?: number}) {
  const border = (size * 2.5) / 30;
  const dot = (size * 7) / 30;
  const r = (size * 9) / 30;
  const rSmall = (size * 2) / 30;
  return (
    <span
      aria-hidden
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{
        width: size,
        height: size,
        border: `${border}px solid var(--color-amber)`,
        borderRadius: `${r}px ${r}px ${r}px ${rSmall}px`,
      }}
    >
      <span
        style={{
          width: dot,
          height: dot,
          background: 'var(--color-amber)',
          borderRadius: '999px',
        }}
      />
    </span>
  );
}

// Nav lockup: mark + wordmark, links home. Stays LTR in RTL (brand name).
export default function Logo({className = ''}: {className?: string}) {
  return (
    <Link
      href="/"
      dir="ltr"
      aria-label="devora.design — home"
      className={`inline-flex items-center gap-[11px] ${className}`}
    >
      <LogoMark size={30} />
      <span className="font-display text-[19px] font-bold leading-none tracking-[-0.01em]">
        <span className="text-ink">devora</span>
        <span className="text-amber">.</span>
        <span className="font-normal text-muted-2">design</span>
      </span>
    </Link>
  );
}
