'use client';

import {useId, useState, type ReactNode} from 'react';
import {useTranslations} from 'next-intl';
import {Ltr, ghostBtn} from '../ui';

export interface ChartTable {
  caption: string;
  head: string[];
  /** numeric cells are rendered left-to-right */
  rows: string[][];
}

/** Figure shell: title, visual, legend slot and a toggleable accessible data table. */
export default function ChartFrame({
  title,
  table,
  children,
  legend,
}: {
  title: string;
  table: ChartTable;
  children: ReactNode;
  legend?: ReactNode;
}) {
  const t = useTranslations('roi');
  const [open, setOpen] = useState(false);
  const uid = useId();
  const tableId = `${uid}-table`;
  return (
    <figure className="glass flex min-w-0 flex-col gap-5 rounded-panel p-5 nav:p-8 print:break-inside-avoid">
      <figcaption className="font-display text-xl font-semibold text-ink">{title}</figcaption>
      {children}
      {legend}
      <div>
        <button
          type="button"
          className={ghostBtn}
          aria-expanded={open}
          aria-controls={tableId}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? t('chart.hideTable') : t('chart.showTable')}
        </button>
      </div>
      <div id={tableId} hidden={!open} className="min-w-0 overflow-x-auto print:block">
        <table className="w-full min-w-[320px] border-collapse text-sm">
          <caption className="pb-2 text-start text-xs text-muted-2">{table.caption}</caption>
          <thead>
            <tr>
              {table.head.map((h) => (
                <th key={h} scope="col" className="border-b border-border-card px-3 py-2 text-start font-semibold text-ink-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) =>
                  j === 0 ? (
                    <th key={j} scope="row" className="border-b border-border-sub px-3 py-2 text-start font-medium text-ink">
                      {cell}
                    </th>
                  ) : (
                    <td key={j} className="border-b border-border-sub px-3 py-2 text-start text-muted">
                      <Ltr>{cell}</Ltr>
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
