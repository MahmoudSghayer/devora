'use client';

import {createContext, useContext, useState, type ReactNode} from 'react';

const DoneContext = createContext<(done: boolean) => void>(() => {});

/**
 * Lets a calculator island tell its page that the lead was submitted. While
 * done, the (server-rendered) intro hero is replaced by a spacer that clears the
 * fixed header, so the success view takes its place in normal flow instead of
 * stacking under a stale H1. Call the setter in the same event as the island's
 * own state change so both land in one commit (no layout jump before scrolling).
 */
export function useCalcDone(): (done: boolean) => void {
  return useContext(DoneContext);
}

export default function CalcShell({
  intro,
  spacer,
  children,
}: {
  intro: ReactNode;
  /** height utility classes that stand in for the header offset once the intro is gone */
  spacer: string;
  children: ReactNode;
}) {
  const [done, setDone] = useState(false);
  return (
    <DoneContext value={setDone}>
      {done ? <div aria-hidden className={spacer} /> : intro}
      {children}
    </DoneContext>
  );
}
