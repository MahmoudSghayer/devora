import type {ReactNode} from 'react';
import type {Purpose} from '@/lib/discuss/types';

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

const PURPOSE_PATHS: Record<Purpose, ReactNode> = {
  'replace-spreadsheets': (
    <>
      <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
      <path d="M3.5 9.5h17M3.5 14.5h17M9.5 4v16" />
    </>
  ),
  'run-operations': (
    <>
      <path d="M4 7h10M4 12h16M4 17h7" />
      <circle cx="17" cy="7" r="2" />
      <circle cx="14" cy="17" r="2" />
    </>
  ),
  'customer-portal': (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5" />
    </>
  ),
  'internal-dashboard': (
    <>
      <rect x="3" y="3.5" width="7.5" height="9" rx="2" />
      <rect x="13.5" y="3.5" width="7.5" height="5" rx="2" />
      <rect x="13.5" y="11.5" width="7.5" height="9" rx="2" />
      <rect x="3" y="15.5" width="7.5" height="5" rx="2" />
    </>
  ),
  'ai-tool': (
    <>
      <path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z" />
      <path d="M18.5 16.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </>
  ),
  'connect-tools': (
    <>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6.5" r="2.5" />
      <circle cx="18" cy="17.5" r="2.5" />
      <path d="M8.3 11l7.4-3.4M8.3 13l7.4 3.4" />
    </>
  ),
  other: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h.1M12 12h.1M16 12h.1" strokeWidth={2.4} />
    </>
  ),
};

export function PurposeIcon({id}: {id: Purpose}) {
  return <svg {...base}>{PURPOSE_PATHS[id]}</svg>;
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
    <svg {...base} width={18} height={18} className={`${back ? 'rotate-180 rtl:rotate-0' : 'rtl:rotate-180'} ${className}`}>
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
