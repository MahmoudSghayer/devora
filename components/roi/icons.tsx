import type {RoiTaskId} from '@/lib/roi/types';

// 24×24 stroke icons (Lucide-style geometry), one per catalogue task.
const PATHS: Record<RoiTaskId, string[]> = {
  whatsappReplies: ['M7.9 20A9 9 0 1 0 4 16.1L2 22Z'],
  repetitiveFaqs: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3', 'M12 17h.01'],
  scheduling: ['M8 2v4M16 2v4M3 10h18', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z'],
  reminders: ['M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9', 'M10.3 21a1.9 1.9 0 0 0 3.4 0'],
  leadFollowUps: ['M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2', 'M16 11l2 2 4-4'],
  spreadsheetEntry: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z', 'M3 9h18M3 15h18M9 3v18'],
  invoices: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z', 'M14 2v6h6M8 13h8M8 17h5'],
  reports: ['M3 3v18h18', 'M7 16v-5M12 16V7M17 16v-3'],
  copyingBetweenSystems: ['M7 7h13l-3-3M17 17H4l3 3'],
  crmUpdates: ['M12 7c4.97 0 9-1.34 9-3s-4.03-3-9-3-9 1.34-9 3 4.03 3 9 3Z', 'M3 4v16c0 1.66 4.03 3 9 3s9-1.34 9-3V4', 'M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3'],
  collectCustomerInfo: ['M9 2h6v4H9z', 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2', 'M9 13h6M9 17h4'],
  sendingEmails: ['M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z', 'm22 7-10 6L2 7'],
  orderProcessing: ['M21 8l-9-5-9 5v8l9 5 9-5Z', 'M3.3 7 12 12l8.7-5M12 22V12'],
  customerSupport: ['M3 14v-2a9 9 0 0 1 18 0v2', 'M21 15a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2ZM3 15a2 2 0 0 0 2 2h1v-5H5a2 2 0 0 0-2 2Z'],
  other: ['M4 6h16M4 12h16M4 18h10'],
};

export function TaskIcon({id, className = 'size-6'}: {id: RoiTaskId; className?: string}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {PATHS[id].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export function ChevronIcon({className = 'size-4'}: {className?: string}) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function CheckIcon({className = 'size-4'}: {className?: string}) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

export function AlertIcon({className = 'size-4'}: {className?: string}) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v5M12 16.5h.01" />
    </svg>
  );
}
