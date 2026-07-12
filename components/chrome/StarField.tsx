'use client';

import {useEffect, useRef} from 'react';

// A lightweight 2D echo of the homepage's WebGL universe: a fixed canvas
// starfield behind the marketing pages so they live in the same DEVORA OS cosmos
// without the cost of Three.js. Gentle downward drift, twinkle and a touch of
// mouse parallax; fully static (drawn once, no loop) under prefers-reduced-motion.
type Star = {x: number; y: number; z: number; r: number; c: string; tw: number; ts: number};

const COLORS = [
  'rgba(255,255,255,', // white (most)
  'rgba(255,255,255,',
  'rgba(255,255,255,',
  'rgba(242,168,75,', // DEVORA gold
  'rgba(111,211,255,', // cyan
];

export default function StarField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0;
    let h = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let stars: Star[] = [];
    let mx = 0;
    let my = 0;
    let tmx = 0;
    let tmy = 0;
    let raf = 0;

    const seed = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(520, Math.max(120, Math.round((w * h) / 4200)));
      stars = Array.from({length: count}, () => {
        const z = Math.random();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          z,
          r: 0.4 + z * 1.5,
          c: COLORS[Math.floor(Math.random() * COLORS.length)],
          tw: Math.random() * 6.283,
          ts: 0.5 + Math.random() * 1.4,
        };
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      if (!reduce) {
        mx += (tmx - mx) * 0.05;
        my += (tmy - my) * 0.05;
      }
      for (const s of stars) {
        if (!reduce) {
          s.y += s.z * 0.14;
          if (s.y > h) s.y = 0;
          s.tw += 0.02 * s.ts;
        }
        const px = s.x + mx * 34 * s.z;
        const py = s.y + my * 34 * s.z;
        const tw = reduce ? 0.75 : 0.45 + 0.55 * Math.sin(s.tw);
        const alpha = 0.1 + 0.55 * tw * (0.35 + s.z * 0.65);
        ctx.fillStyle = s.c + alpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, 6.283);
        ctx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      seed();
      if (reduce) draw();
    };
    const onMove = (e: MouseEvent) => {
      tmx = e.clientX / window.innerWidth - 0.5;
      tmy = e.clientY / window.innerHeight - 0.5;
    };

    seed();
    draw();
    window.addEventListener('resize', onResize);
    if (!reduce) window.addEventListener('mousemove', onMove);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
