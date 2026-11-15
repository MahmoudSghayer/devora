import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import Reveal from '@/components/motion/Reveal';
import Spotlight from '@/components/motion/Spotlight';
import ArrowButton from '@/components/ui/ArrowButton';
import {PILLARS} from '@/lib/pillars';
import {PILLAR_TINT} from '@/components/services/pillarTint';

// Three guided entry points, one per pillar: website estimator, automation
// ROI calculator, or a conversation for custom software (PILLARS[].calculator). Prices live only in lib/pricing/config.
export default function CustomNeeds({
  label,
  title,
  sub,
  headingId = 'custom-needs-title',
  className = 'border-b border-border py-section',
}: {
  label: string;
  title: string;
  sub: string;
  headingId?: string;
  className?: string;
}) {
  const p = useTranslations('pricing');
  const pl = useTranslations('pillars');

  return (
    <section
      aria-labelledby={headingId}
      className={`aura aura-signal overflow-x-clip ${className}`}
    >
      <Container>
        <Reveal>
          <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-amber">
            <span aria-hidden>{'// '}</span>
            {label}
          </p>
          <h2
            id={headingId}
            className="u-track mt-4 max-w-[760px] font-display text-h2 font-semibold leading-[1.05] tracking-[-0.02em]"
          >
            {title}
          </h2>
          <p className="mt-5 max-w-[640px] text-lead text-muted">
            {sub}
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
