import type {CSSProperties} from 'react';
import Container from '@/components/ui/Container';
import WordReveal from '@/components/motion/WordReveal';
import HeroReveal from '@/components/motion/HeroReveal';

// Shared subpage intro (Work / Services / Contact): pulsing label, word-revealed
// H1 at the subpage scale, sub. Same drifting-hairline background as the hero.
export default function PageIntro({
  label,
  title,
  sub,
}: {
  label: string;
  title: string;
  sub: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 animate-grid-drift"
        style={
          {
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 160px)',
            '--drift': '160px',
            '--drift-dur': '18s',
          } as CSSProperties
        }
      />
      <Container className="relative pb-20 pt-[110px]">
        <HeroReveal index={0}>
          <div className="flex items-center gap-3">
            <span className="animate-pulse-dot inline-block h-2 w-2 rounded-full bg-amber" />
            <span className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-muted-2">
              {label}
            </span>
          </div>
        </HeroReveal>

        <WordReveal
          as="h1"
          text={title}
          className="u-track mt-8 block max-w-[18ch] font-display text-h1-sub font-bold leading-[1.02] tracking-[-0.03em]"
          delayBase={120}
        />

        <HeroReveal index={1}>
          <p className="mt-6 max-w-[560px] text-[19px] leading-[1.65] text-muted">
            {sub}
          </p>
        </HeroReveal>
      </Container>
    </section>
  );
}
