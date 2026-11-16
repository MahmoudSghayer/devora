import {useTranslations} from 'next-intl';
import Spotlight from '@/components/motion/Spotlight';
import TiltCard from '@/components/motion/TiltCard';
import ArrowButton from '@/components/ui/ArrowButton';

// A small "system map": nodes joined by lines. Purely illustrative (no data).
const NODES = [
  {x: 50, y: 60, r: 9},
  {x: 140, y: 30, r: 6},
  {x: 160, y: 90, r: 7},
  {x: 230, y: 55, r: 10},
  {x: 290, y: 100, r: 6},
  {x: 120, y: 120, r: 5},
] as const;
const EDGES = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [3, 4],
  [2, 5],
  [0, 5],
] as const;

/** Third entry card: custom-software discovery, in the soft (violet) pillar tint. */
export default function DiscussCard() {
  const t = useTranslations('homeB.calc');
  return (
    <TiltCard className="h-full" max={4}>
      <Spotlight tone="soft" className="glass aura aura-soft flex h-full flex-col overflow-clip rounded-panel p-6 nav:p-8">
        <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-pillar-soft">
          <span aria-hidden>{'// '}</span>
          {t('disc_kicker')}
        </p>
        <h3 className="u-track mt-4 font-display text-h3 font-semibold leading-[1.1] tracking-[-0.02em]">
          {t('disc_title')}
        </h3>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">{t('disc_desc')}</p>

        <div className="mt-6 flex flex-1 items-center rounded-card border border-border-card bg-bg/50 p-5">
          <div dir="ltr" className="w-full">
            <svg viewBox="0 0 340 150" role="img" aria-label={t('disc_map_alt')} className="block h-auto w-full">
              {EDGES.map(([a, b]) => (
                <line
                  key={`${a}-${b}`}
                  x1={NODES[a].x}
                  y1={NODES[a].y}
                  x2={NODES[b].x}
                  y2={NODES[b].y}
                  stroke="var(--color-pillar-soft)"
                  strokeOpacity="0.55"
                  strokeWidth="1.5"
                  strokeDasharray="3 5"
                  className="motion-safe:animate-[dvFlow_4s_linear_infinite]"
                />
              ))}
              {NODES.map((n, i) => (
                <circle
                  key={i}
                  cx={n.x}
                  cy={n.y}
                  r={n.r}
                  fill="var(--color-surface-2)"
                  stroke="var(--color-pillar-soft)"
                  strokeWidth="1.5"
                  className="origin-center [transform-box:fill-box] motion-safe:animate-pulse-dot"
                  style={{animationDelay: `${i * 0.4}s`}}
                />
              ))}
            </svg>
          </div>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-muted">{t('disc_note')}</p>

        <div className="mt-auto pt-6">
          <ArrowButton href="/discuss" label={t('disc_cta')} className="min-h-12 px-7 py-3 text-[15px]" />
          <p className="u-mono mt-4 font-mono text-xs text-faint">{t('free_talk')}</p>
        </div>
      </Spotlight>
    </TiltCard>
  );
}
