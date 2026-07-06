import type {ReactNode} from 'react';

// Pill chip used for team disciplines and service deliverables.
// Space Mono, 1px chip border, recolors to amber on hover.
export default function Chip({children}: {children: ReactNode}) {
  return (
    <span className="inline-block rounded-pill border border-border-chip px-4 py-[9px] font-mono text-xs text-ink-2 transition-colors hover:border-amber hover:text-amber">
      {children}
    </span>
  );
}
