/**
 * Single source of truth for the devora `< • >` mark (512 viewBox). The inline SVG poster and the
 * WebGL particle cloud both derive from these constants so they cannot drift apart.
 */
export const MARK_VIEWBOX = 512;
export const MARK_CENTER = 256;
export const MARK_STROKE = 46;
export const MARK_DOT = {cx: 256, cy: 256, r: 40} as const;
export const MARK_BRACKETS = [
  [[214, 156], [150, 256], [214, 356]],
  [[298, 156], [362, 256], [298, 356]],
] as const;

type Pt = readonly [number, number];

/** SVG path data for one bracket polyline, e.g. "M214 156 L150 256 L214 356". */
export const bracketPath = (pts: readonly Pt[]) => `M${pts.map((p) => p.join(' ')).join(' L')}`;

function distToSegment(px: number, py: number, a: Pt, b: Pt) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy));
}

function distToPolyline(px: number, py: number, pts: readonly Pt[]) {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) best = Math.min(best, distToSegment(px, py, pts[i - 1], pts[i]));
  return best;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Samples `count` points covering the stroked brackets (rejection sampling against the polyline at
 * half the stroke width, so caps and joins are exact) plus a centre-weighted disc for the dot.
 * Output is normalised: x/y in -1..1 across the viewBox (y up), `kind` 0 = bracket, 1 = dot.
 */
export function sampleMark(count: number, dotShare = 0.2, seed = 7) {
  const rnd = mulberry32(seed);
  const pos = new Float32Array(count * 2);
  const kind = new Float32Array(count);
  const half = MARK_STROKE / 2;
  const [x0, x1] = [150 - half, 362 + half];
  const [y0, y1] = [156 - half, 356 + half];
  const dots = Math.round(count * dotShare);
  const put = (i: number, x: number, y: number, k: number) => {
    pos[i * 2] = (x - MARK_CENTER) / MARK_CENTER;
    pos[i * 2 + 1] = (MARK_CENTER - y) / MARK_CENTER;
    kind[i] = k;
  };
  for (let i = 0; i < count; i++) {
    if (i < dots) {
      const r = MARK_DOT.r * Math.pow(rnd(), 0.6);
      const a = rnd() * Math.PI * 2;
      put(i, MARK_DOT.cx + r * Math.cos(a), MARK_DOT.cy + r * Math.sin(a), 1);
      continue;
    }
    for (;;) {
      const x = x0 + rnd() * (x1 - x0);
      const y = y0 + rnd() * (y1 - y0);
      if (MARK_BRACKETS.some((b) => distToPolyline(x, y, b) <= half)) {
        put(i, x, y, 0);
        break;
      }
    }
  }
  return {pos, kind};
}
