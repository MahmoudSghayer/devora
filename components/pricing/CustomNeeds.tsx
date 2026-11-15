import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import Reveal from '@/components/motion/Reveal';
import Spotlight from '@/components/motion/Spotlight';
import ArrowButton from '@/components/ui/ArrowButton';
import {PILLARS} from '@/lib/pillars';
import {PILLAR_TINT} from '@/components/services/pillarTint';

// "Custom needs? Run the estimator" band: the three pillars each point at the
// tool that fits (website estimator, automation ROI calculator, or a
// conversation for custom software). Prices live only in lib/pricing/config.
export default function CustomNeeds() {
  const p = useTranslations('pricing');
  const pl = useTranslations('pillars');

  return (
    <section
      aria-labelledby="custom-needs-title"
      className="aura aura-signal overflow-x-clip border-b border-border py-section"
    >
      <Container>
        <Reveal>
          <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-amber">
            <span aria-hidden>{'// '}</span>
            {p('custom_label')}
          </p>
          <h2
            id="custom-needs-title"
            className="u-track mt-4 max-w-[760px] font-display text-h2 font-semibold leading-[1.05] tracking-[-0.02em]"
          >
            {p('custom_title')}
          </h2>
          <p className="mt-5 max-w-[640px] text-lead text-muted">
            {p('custom_sub')}
          </p>
        </Reveal>

        <ul className="mt-12 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
          {PILLARS.map((pillar, i) => {
            const tint = PILLAR_TINT[pillar.tint];
            return (
              <li key={pillar.id}>
                <Reveal index={i} className="h-full">
                  <Spotlight
                    tone={tint.tone}
                    className="glass flex h-full flex-col rounded-card p-6 nav:p-8"
                  >
                    <h3
                      className={`u-mono font-mono text-xs uppercase tracking-[0.16em] ${tint.text}`}
                    >
                      {pl(`${pillar.id}.name`)}
                    </h3>
                    <p className="mt-4 flex-1 text-base leading-relaxed text-ink-2">
                      {p(`custom_${pillar.id}_d`)}
                    </p>
                    <div className="mt-8">
                      <ArrowButton
                        href={pillar.calculator}
                        label={pl(`${pillar.id}.cta`)}
                        className="px-6 py-3 text-sm"
                      />
                    </div>
                  </Spotlight>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
