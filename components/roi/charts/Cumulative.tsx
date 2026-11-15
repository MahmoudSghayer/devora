'use client';

import {useEffect, useRef, useState} from 'react';
import {motion, useReducedMotion} from 'motion/react';
import {useLocale, useTranslations} from 'next-intl';
import type {RoiResult} from '@/lib/roi/types';
import {compactMoney, money, num} from '../format';
import ChartFrame from './ChartFrame';

const MONTHS = 24;
const HEIGHT = 280;
const PAD = {top: 16, bottom: 28, axis: 64, edge: 16};
const TABLE_MONTHS = [0, 3, 6, 9, 12, 18, 24];

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return {ref, w};
}

const net = (month: number, cost: number, monthly: number) => -cost + month * monthly;

function niceTicks(min: number, max: number): number[] {
  const span = max - min || 1;
  const raw = span / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(Math.round(v * 100) / 100 || 0);
  return out;
}

export default function Cumulative({result}: {result: RoiResult}) {
  const t = useTranslations('roi');
  const locale = useLocale();
  const rtl = locale === 'ar';
  const reduced = useReducedMotion();
  const {ref, w} = useWidth();

  const cost = result.implementationCost;
  const capMonthly = result.capacityValueMonthly - result.runningMonthly;
  const dirMonthly = result.directReductionMonthly - result.runningMonthly;
  const series = [
    {key: 'capacity', monthly: capMonthly, pay: result.paybackMonthsCapacity, cls: 'stroke-signal', dot: 'fill-signal'},
    {key: 'direct', monthly: dirMonthly, pay: result.paybackMonthsDirect, cls: 'stroke-ink-2', dot: 'fill-ink-2'},
  ] as const;

  const values = series.flatMap((s) => [net(0, cost, s.monthly), net(MONTHS, cost, s.monthly)]);
  const lo = Math.min(0, ...values);
  const hi = Math.max(0, ...values);
  const ticks = niceTicks(lo, hi);
  const yMin = Math.min(lo, ticks[0] ?? lo);
  const yMax = Math.max(hi, ticks[ticks.length - 1] ?? hi);

  const x0 = rtl ? PAD.edge : PAD.axis;
  const x1 = rtl ? w - PAD.axis : w - PAD.edge;
  const x = (m: number) => (rtl ? x1 - (m / MONTHS) * (x1 - x0) : x0 + (m / MONTHS) * (x1 - x0));
  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin || 1)) * (HEIGHT - PAD.top - PAD.bottom);
  const axisX = rtl ? x1 + 8 : x0 - 8;

  const payText = (p: number | null) =>
    p !== null && p <= MONTHS ? t('chart.cumulative.paybackAt', {months: num(p, locale, 1)}) : t('chart.cumulative.noPayback');

  return (
    <ChartFrame
      title={t('chart.cumulative.title')}
      table={{
        caption: t('chart.cumulative.caption'),
        head: [t('chart.cumulative.colMonth'), t('chart.cumulative.capacity'), t('chart.cumulative.direct')],
        rows: TABLE_MONTHS.map((m) => [
          String(m),
          money(net(m, cost, capMonthly), locale),
          money(net(m, cost, dirMonthly), locale),
        ]),
      }}
      legend={
        <ul className="flex flex-col gap-2 text-sm text-muted">
          {series.map((s) => (
            <li key={s.key} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span aria-hidden className={`h-0.5 w-6 ${s.key === 'capacity' ? 'bg-signal' : 'bg-ink-2'}`} />
              <span className="text-ink-2">{t(`chart.cumulative.${s.key}`)}</span>
              <span>{payText(s.pay)}</span>
            </li>
          ))}
          <li className="text-xs text-muted-2">{t('chart.cumulative.axisX')} · {t('chart.cumulative.axisY')}</li>
        </ul>
      }
    >
      <div ref={ref} className="min-w-0">
        <svg
          role="img"
          aria-label={t('chart.cumulative.aria', {
            months: MONTHS,
            capacity: payText(result.paybackMonthsCapacity),
            direct: payText(result.paybackMonthsDirect),
          })}
          width={w}
          height={HEIGHT}
          className="block max-w-full text-muted [direction:ltr]"
        >
          {ticks.map((v) => (
            <g key={v}>
              <line
                x1={x0}
                x2={x1}
                y1={y(v)}
                y2={y(v)}
                className={v === 0 ? 'stroke-border-ghost' : 'stroke-border-sub'}
                strokeDasharray={v === 0 ? '4 4' : undefined}
              />
              <text
                x={axisX}
                y={y(v)}
                dy="0.32em"
                textAnchor={rtl ? 'start' : 'end'}
                className="fill-muted-2 text-[11px]"
              >
                {compactMoney(v, locale)}
              </text>
            </g>
          ))}
          {[0, 6, 12, 18, 24].map((m) => (
            <text key={m} x={x(m)} y={HEIGHT - 8} textAnchor="middle" className="fill-muted-2 text-[11px]">
              {m}
            </text>
          ))}
          {series.map((s) => {
            const d = `M${x(0)},${y(net(0, cost, s.monthly))} L${x(MONTHS)},${y(net(MONTHS, cost, s.monthly))}`;
            return (
              <motion.path
                key={s.key}
                d={d}
                fill="none"
                strokeWidth={2.5}
                strokeLinecap="round"
                className={s.cls}
                initial={reduced ? false : {pathLength: 0}}
                animate={{pathLength: 1}}
                transition={{duration: 0.9, ease: 'easeOut'}}
              />
            );
          })}
          {series.map((s) =>
            s.pay !== null && s.pay <= MONTHS ? (
              <circle key={s.key} cx={x(s.pay)} cy={y(0)} r={6} className={`${s.dot} stroke-bg`} strokeWidth={2} />
            ) : null,
          )}
        </svg>
      </div>
    </ChartFrame>
  );
}
