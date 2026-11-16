import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import ArrowButton from '@/components/ui/ArrowButton';
import Reveal from '@/components/motion/Reveal';
import Spotlight from '@/components/motion/Spotlight';
import {pillarItemKeys, type PILLARS} from '@/lib/pillars';
import {PILLAR_TINT} from './pillarTint';

type Pillar = (typeof PILLARS)[number];

// One pillar of the services taxonomy: kicker, headline, description, the full
// 8-item list, a real-world scenario, outcomes and a CTA to its calculator.
// The anchor id sits on the <section>; scroll-margin clears the sticky header
// plus the in-page nav.
export default function PillarSection({
  pillar,
  index,
}: {
  pillar: Pillar;
  index: number;
}) {
  const p = useTranslations('pillars');
  const tint = PILLAR_TINT[pillar.tint];
  const id = pillar.id;
  const headingId = `${pillar.anchor}-title`;
  const num = String(index + 1).padStart(2, '0');

  return (
    <section
      id={pillar.anchor}
      aria-labelledby={headingId}
      className={`aura ${tint.aura} relative scroll-mt-[148px] overflow-x-clip border-b border-border py-section`}
    >
      <Container className="grid gap-block nav:grid-cols-[5fr_7fr] nav:gap-16">
        <Reveal>
          <p
            className={`u-mono font-mono text-xs uppercase tracking-[0.22em] ${tint.text}`}
          >
            <span aria-hidden>{`${num} / `}</span>
            {p(`${id}.kicker`)}
          </p>
          <h2
            id={headingId}
            className="u-track mt-4 font-display text-h2 font-semibold leading-[1.05] tracking-[-0.02em]"
          >
            {p(`${id}.headline`)}
          </h2>
          <p className="mt-3 font-display text-lg font-medium text-ink-2">
            {p(`${id}.name`)}
          </p>
          <p className="mt-5 max-w-[520px] text-lead leading-[1.65] text-muted">
            {p(`${id}.desc`)}
          </p>

          <h3 className="u-mono mt-10 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
            {p('outcomes_label')}
          </h3>
          <ul className="mt-4 flex flex-col gap-3">
            {(['o1', 'o2', 'o3'] as const).map((o) => (
              <li key={o} className="flex items-start gap-3 text-base text-ink-2">
                <span
                  aria-hidden
                  className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${tint.dot}`}
                />
                <span>{p(`${id}.${o}`)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <ArrowButton
              href={pillar.calculator}
              label={p(`${id}.cta`)}
              className="px-8 py-4 text-base"
            />
          </div>
        </Reveal>

        <Reveal index={1} className="flex flex-col gap-6">
          <Spotlight
            tone={tint.tone}
            className={`glass rounded-panel border-s-2 p-6 nav:p-10 ${tint.border}`}
          >
            <h3 className="u-mono font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
              {p('includes_label')}
            </h3>
            <ul className="mt-6 grid gap-x-8 gap-y-4 nav:grid-cols-2">
              {pillarItemKeys(pillar.itemCount).map((k) => (
                <li
                  key={k}
                  className="flex items-start gap-3 border-t border-hairline pt-4 text-[15px] leading-snug text-ink"
                >
                  <span
                    aria-hidden
                    className={`u-mono font-mono ${tint.text}`}
                  >
                    +
                  </span>
                  <span>{p(`${id}.${k}`)}</span>
                </li>
              ))}
            </ul>
          </Spotlight>

          <div className="rounded-card border border-border-card bg-surface p-6 nav:p-8">
            <p
              className={`u-mono font-mono text-[11px] uppercase tracking-[0.18em] ${tint.text}`}
            >
              {p('scenario_label')}
            </p>
            <h3 className="mt-3 font-display text-xl font-semibold">
              {p(`${id}.scenario_title`)}
            </h3>
            <p className="mt-3 text-[15px] leading-[1.7] text-muted">
              {p(`${id}.scenario`)}
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
