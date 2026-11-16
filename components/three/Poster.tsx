import {
  MARK_BRACKETS, MARK_DOT, MARK_STROKE, MARK_VIEWBOX, bracketPath,
} from '@/lib/three/mark-geometry';
import styles from './poster.module.css';

/** Static glow poster of the `< • >` mark (decorative). Geometry comes from the shared module. */
export default function Poster() {
  const viewBox = `0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}`;
  const paths = MARK_BRACKETS.map((b) => (
    <path key={bracketPath(b)} d={bracketPath(b)} />
  ));
  return (
    <div aria-hidden className={styles.root}>
      <div className={styles.aura} />
      <svg viewBox={viewBox} fill="none" className={styles.glow}>
        <g className={styles.stroke} strokeWidth={MARK_STROKE} strokeLinecap="round" strokeLinejoin="round">
          {paths}
        </g>
        <circle className={styles.dot} cx={MARK_DOT.cx} cy={MARK_DOT.cy} r={MARK_DOT.r} />
      </svg>
      <svg viewBox={viewBox} fill="none" className={styles.mark}>
        <defs>
          <radialGradient id="poster-dot" cx="50%" cy="42%" r="55%">
            <stop offset="0%" className={styles.stopHi} />
            <stop offset="100%" className={styles.stopLo} />
          </radialGradient>
        </defs>
        <g className={styles.stroke} strokeWidth={MARK_STROKE} strokeLinecap="round" strokeLinejoin="round">
          {paths}
        </g>
        <circle cx={MARK_DOT.cx} cy={MARK_DOT.cy} r={MARK_DOT.r} fill="url(#poster-dot)" />
      </svg>
    </div>
  );
}
