import type {ReactNode} from 'react';

// Mono label + H2 title, with an optional trailing link (e.g. "All services →").
export default function SectionHeader({
  label,
  title,
  link,
  className = '',
}: {
  label: string;
  title: string;
  link?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-6 ${className}`}>
      <div className="max-w-[760px]">
        <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-muted-2">
          {label}
        </p>
        <h2 className="u-track mt-4 font-display text-h2 font-semibold leading-[1.05] tracking-[-0.02em]">
          {title}
        </h2>
      </div>
      {link}
    </div>
  );
}
