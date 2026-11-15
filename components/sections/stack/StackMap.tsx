'use client';

import {useEffect, useRef, useState, type CSSProperties, type PointerEvent} from 'react';
import {useReducedMotion} from 'motion/react';
import {usePointerFine} from '@/lib/hooks/usePointerFine';
import type {MapGroup, MapNode, MapProps} from './types';

const descId = (id: string) => `stack-use-${id}`;

function Tile({node}: {node: MapNode}) {
  return (
    <span
      aria-hidden
      className="flex size-12 items-center justify-center rounded-card border border-border-card bg-surface-2 transition-colors group-hover:border-current group-data-[active=true]:border-current group-data-[active=true]:bg-surface nav:size-[52px]"
    >
      {node.path ? (
        <svg viewBox="0 0 24 24" className="size-6" fill="currentColor">
          <path d={node.path} />
        </svg>
      ) : (
        <span dir="ltr" className="font-mono text-[13px] font-semibold leading-none">
          {node.mono}
        </span>
      )}
    </span>
  );
}

/**
 * The stack as a constellation. The DOM IS the grouped list: each group is an
 * `li` with a nested `ul` of node buttons. On `nav:` screens the same elements
 * are laid out in a 3D stage (per-group depth, pointer parallax when a fine
 * pointer is available and motion is allowed); below it they are a plain
 * grouped grid where a tap expands a node's use-line. The lines, hub and
 * readout are decorative (aria-hidden); every use-line is also the node's
 * accessible description.
 */
export default function StackMap({groups, stage, hubLabel, hint, listAria}: MapProps) {
  const [active, setActive] = useState<string | null>(null);
  const fine = usePointerFine();
  const reduced = useReducedMotion();
  const parallax = fine && !reduced;
  const stageRef = useRef<HTMLDivElement>(null);
  const toggleOnClick = useRef(false);

  useEffect(() => {
    if (!parallax) return;
    const el = stageRef.current;
    if (!el) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      raf = 0;
      el.style.setProperty('--px', x.toFixed(3));
      el.style.setProperty('--py', y.toFixed(3));
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const move = (e: globalThis.PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
      queue();
    };
    const leave = () => {
      x = 0;
      y = 0;
      queue();
    };
    el.addEventListener('pointermove', move, {passive: true});
    el.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      el.style.removeProperty('--px');
      el.style.removeProperty('--py');
    };
  }, [parallax]);

  const current = groups.flatMap((g) => g.nodes.map((n) => ({g, n}))).find((o) => o.n.id === active);
  const stageStyle = parallax ? ({'--z': 1} as CSSProperties) : undefined;

  return (
    <div>
      <div
        ref={stageRef}
        style={stageStyle}
        className="nav:relative nav:aspect-[1000/520] nav:[perspective:1400px]"
      >
        <div className="nav:absolute nav:inset-0 nav:[transform-style:preserve-3d] nav:[transform:rotateX(calc(var(--py,0)*-3.5deg))_rotateY(calc(var(--px,0)*4.5deg))] nav:transition-transform nav:duration-300 nav:ease-out motion-reduce:transition-none">
          <div aria-hidden className="pointer-events-none absolute inset-0 max-nav:hidden">
            <div
              className="absolute flex size-[92px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border-amber bg-featured"
              style={{left: `${(stage.hub.x / stage.w) * 100}%`, top: `${(stage.hub.y / stage.h) * 100}%`}}
            >
              <span className="absolute inset-[-14px] rounded-full border border-border-sub" />
              <span className="absolute inset-[-34px] rounded-full border border-border-sub opacity-60" />
              <span dir="ltr" className="u-mono font-mono text-[13px] font-semibold tracking-[0.06em] text-amber">
                {hubLabel}
              </span>
            </div>
          </div>

          <ul
            aria-label={listAria}
            className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-4 nav:absolute nav:inset-0 nav:block nav:[transform-style:preserve-3d]"
          >
            {groups.map((g) => {
              const groupActive = g.nodes.some((n) => n.id === active);
              return (
                <li
                  key={g.id}
                  style={{'--d': g.depth} as CSSProperties}
                  className="p-5 max-nav:rounded-card max-nav:border max-nav:border-glass-border max-nav:bg-glass nav:pointer-events-none nav:absolute nav:inset-0 nav:p-0 nav:[transform-style:preserve-3d] nav:[translate:0_0_calc(var(--d)*var(--z,0)*1px)] nav:transition-[translate] nav:duration-300 motion-reduce:transition-none"
                >
                  <svg
                    aria-hidden
                    viewBox={`0 0 ${stage.w} ${stage.h}`}
                    className="pointer-events-none absolute inset-0 size-full fill-none max-nav:hidden"
                  >
                    {g.lines.map((l) => {
                      const on = active !== null && (l.nodeId === active || (l.nodeId === null && groupActive));
                      return (
                        <path
                          key={l.d}
                          d={l.d}
                          strokeWidth={on ? 1.6 : 1}
                          strokeDasharray={on ? '4 6' : undefined}
                          vectorEffect="non-scaling-stroke"
                          className={`${g.stroke} transition-[stroke-opacity] duration-300 ${
                            on ? 'motion-safe:animate-[dvFlow_1.4s_linear_infinite]' : ''
                          }`}
                          strokeOpacity={on ? 0.95 : groupActive ? 0.5 : 0.28}
                        />
                      );
                    })}
                  </svg>

                  <h3
                    className={`u-mono font-mono text-xs uppercase tracking-[0.2em] ${g.tone} nav:absolute nav:-translate-x-1/2 nav:-translate-y-1/2 nav:whitespace-nowrap nav:text-center nav:text-xs nav:opacity-80`}
                    style={{left: `${g.labelX}%`, top: `${g.labelY}%`}}
                  >
                    {g.label}
                  </h3>

                  <ul className="mt-4 grid grid-cols-2 gap-2 nav:absolute nav:inset-0 nav:mt-0 nav:block nav:[transform-style:preserve-3d]">
                    {g.nodes.map((n) => {
                      const open = n.id === active;
                      return (
                        <li
                          key={n.id}
                          data-active={open}
                          style={{left: `${n.x}%`, top: `${n.y}%`}}
                          className={`group ${g.tone} ${
                            open ? 'max-nav:col-span-2' : ''
                          } nav:pointer-events-auto nav:absolute nav:[translate:-50%_-50%]`}
                        >
                          <button
                            type="button"
                            aria-describedby={descId(n.id)}
                            onPointerEnter={(e: PointerEvent) => {
                              if (e.pointerType === 'mouse') setActive(n.id);
                            }}
                            onPointerLeave={(e: PointerEvent<HTMLButtonElement>) => {
                              if (e.pointerType === 'mouse' && document.activeElement !== e.currentTarget)
                                setActive((a) => (a === n.id ? null : a));
                            }}
                            onPointerDown={(e) => {
                              toggleOnClick.current = e.pointerType !== 'mouse' && open;
                            }}
                            onFocus={() => setActive(n.id)}
                            onBlur={() => setActive((a) => (a === n.id ? null : a))}
                            onClick={() => {
                              setActive(toggleOnClick.current ? null : n.id);
                              toggleOnClick.current = false;
                            }}
                            className="flex min-h-11 w-full items-center gap-3 rounded-card text-start max-nav:p-1 nav:w-auto nav:flex-col nav:gap-1.5"
                          >
                            <Tile node={n} />
                            <span className="u-mono max-w-[8.5rem] text-pretty font-mono text-xs leading-tight text-ink-2 nav:text-center nav:text-[11px]">
                              {n.name}
                            </span>
                          </button>
                          <p
                            id={descId(n.id)}
                            className={`text-[13px] leading-snug text-muted ${
                              open ? 'sr-only max-nav:not-sr-only max-nav:mt-2 max-nav:px-1 max-nav:pb-1' : 'sr-only'
                            }`}
                          >
                            {n.use}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div
        aria-hidden
        className="glass mt-6 min-h-[112px] rounded-card px-6 py-5 max-nav:hidden"
      >
        {current ? (
          <>
            <p className={`u-mono font-mono text-xs uppercase tracking-[0.2em] ${current.g.tone}`}>
              {current.g.label}
            </p>
            <p className="mt-2 font-display text-lg font-semibold text-ink">{current.n.name}</p>
            <p className="mt-1 max-w-[70ch] text-[15px] leading-snug text-muted">{current.n.use}</p>
          </>
        ) : (
          <p className="text-[15px] leading-snug text-muted">{hint}</p>
        )}
      </div>
    </div>
  );
}

export type {MapGroup};
