'use client';

import {useEffect, useState} from 'react';

export interface BarSegment {
  /** 0-100 start offset and width, in percent of the track */
  from: number;
  width: number;
  tone: 'signal' | 'muted' | 'soft';
}

const TONE: Record<BarSegment['tone'], string> = {
  signal: 'fill-signal',
  muted: 'fill-border-ghost',
  soft: 'fill-signal-hi',
};

/**
 * Geometry-only horizontal bar. x/width are percentages so it is fluid with no
 * text scaling; mirrored in RTL; draws in with a scale transition (instant under
 * reduced motion).
 */
export default function Bar({segments, height = 14}: {segments: BarSegment[]; height?: number}) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(r);
  }, []);
  return (
    <svg
      aria-hidden
      width="100%"
      height={height}
      className="block overflow-hidden rounded-pill rtl:-scale-x-100"
    >
      <rect x="0" y="0" width="100%" height={height} className="fill-border-sub" />
      <g
        className={`origin-left transition-transform duration-700 ease-out motion-reduce:transition-none ${
          on ? 'scale-x-100' : 'scale-x-0'
        }`}
      >
        {segments.map((s) => (
          <rect
            key={`${s.from}-${s.tone}`}
            x={`${s.from}%`}
            y="0"
            width={`${Math.max(0, s.width)}%`}
            height={height}
            className={TONE[s.tone]}
          />
        ))}
      </g>
    </svg>
  );
}
