import Container from '@/components/ui/Container';
import WordReveal from '@/components/motion/WordReveal';
import HeroReveal from '@/components/motion/HeroReveal';

// Shared subpage hero (Work / Services / Contact / …) in the DEVORA OS key:
// a gold ◗ mono eyebrow, a large word-revealed headline, a sub, and a mono HUD
// strip. It sits over the cosmic starfield supplied by the marketing layout.
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
      {/* faint scanlines, like the homepage HUD */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.014) 0, rgba(255,255,255,0.014) 1px, transparent 2px, transparent 4px)',
        }}
      />
      <Container className="relative pb-24 pt-[132px]">
        <HeroReveal index={0}>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[13px] leading-none text-amber">◗</span>
            <span className="u-mono font-mono text-xs uppercase tracking-[0.36em] text-amber">
              {label}
            </span>
          </div>
        </HeroReveal>

        <WordReveal
          as="h1"
          text={title}
          className="u-track mt-9 block max-w-[16ch] font-display font-semibold leading-[0.98] tracking-[-0.03em] text-[clamp(42px,7vw,100px)]"
          delayBase={140}
        />

        <HeroReveal index={1}>
          <p className="mt-7 max-w-[600px] text-[19px] leading-[1.65] text-muted">
            {sub}
          </p>
        </HeroReveal>

        <HeroReveal index={2}>
          <div
            dir="ltr"
            className="mt-11 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-faint-2"
          >
            <span className="h-px w-12 bg-[linear-gradient(90deg,var(--color-amber),transparent)]" />
            <span className="text-muted-2">DEVORA OS</span>
            <span className="text-faint">/</span>
            <span>{label}</span>
          </div>
        </HeroReveal>
      </Container>
    </section>
  );
}
