import type {ReactNode} from 'react';
import type {ProjectType} from '@/lib/estimator/types';

// Inline 24px stroke icons (decorative, aria-hidden). currentColor only.

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

const PATHS: Record<ProjectType, ReactNode> = {
  landing: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M7 14h6M7 17h3" />
    </>
  ),
  business: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 8.5h18M7.5 12.5h9M7.5 16h5" />
      <circle cx="6" cy="6.2" r="0.4" />
    </>
  ),
  ecommerce: (
    <>
      <path d="M4 5h2l2 10h9.5l2-7H7" />
      <circle cx="9.5" cy="19" r="1.3" />
      <circle cx="17" cy="19" r="1.3" />
    </>
  ),
  booking: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4M9 14.5l2 2 4-4" />
    </>
  ),
  dashboard: (
    <>
      <rect x="3" y="3.5" width="7.5" height="9" rx="2" />
      <rect x="13.5" y="3.5" width="7.5" height="5" rx="2" />
      <rect x="13.5" y="11.5" width="7.5" height="9" rx="2" />
      <rect x="3" y="15.5" width="7.5" height="5" rx="2" />
    </>
  ),
  portal: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5" />
    </>
  ),
  webapp: (
    <>
      <path d="M8 8l-4.5 4L8 16M16 8l4.5 4L16 16M13.5 5.5l-3 13" />
    </>
  ),
  unsure: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.6 2.6 0 015 .9c0 1.7-2.5 2.2-2.5 3.8M12 17.2v.1" />
    </>
  ),
};

export function TypeIcon({id}: {id: ProjectType}) {
  return <svg {...base}>{PATHS[id]}</svg>;
}

export function CheckIcon({className = ''}: {className?: string}) {
  return (
    <svg {...base} strokeWidth={2.4} className={className}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/** Points to the inline-end; flips under RTL. */
export function ArrowIcon({back = false, className = ''}: {back?: boolean; className?: string}) {
  return (
    <svg
      {...base}
      width={18}
      height={18}
      className={`${back ? 'rotate-180 rtl:rotate-0' : 'rtl:rotate-180'} ${className}`}
    >
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export function PrintIcon() {
  return (
    <svg {...base} width={18} height={18}>
      <path d="M7 9V3.5h10V9M7 17H4.5A1.5 1.5 0 013 15.5v-5A1.5 1.5 0 014.5 9h15a1.5 1.5 0 011.5 1.5v5a1.5 1.5 0 01-1.5 1.5H17M7 14h10v6.5H7z" />
    </svg>
  );
}

export function ChevronIcon({className = ''}: {className?: string}) {
  return (
    <svg {...base} width={18} height={18} className={className}>
      <path d="M6 14.5l6-6 6 6" />
    </svg>
  );
}
