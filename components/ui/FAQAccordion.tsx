'use client';

import {useState} from 'react';

// Accessible accordion. Items are pre-resolved {q, a} strings passed by a
// server parent (so translation stays in the page). Height animates via the
// grid-rows 1fr/0fr trick — no box-shadow, respects the site's motion feel.
export default function FAQAccordion({
  items,
}: {
  items: {q: string; a: string}[];
}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="border-t border-border-sub">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="border-b border-border-sub">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-6 py-6 text-start"
            >
              <span className="font-display text-lg font-medium text-ink">
                {it.q}
              </span>
              <span
                className={`shrink-0 font-mono text-xl text-amber transition-transform duration-300 ${
                  isOpen ? 'rotate-45' : ''
                }`}
              >
                +
              </span>
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? 'grid-rows-[1fr] pb-6' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <p className="max-w-[720px] text-[15px] leading-[1.7] text-muted">
                  {it.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
