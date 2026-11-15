import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import Reveal from '@/components/motion/Reveal';
import ArrowLink from '@/components/ui/ArrowLink';
import {PILLARS} from '@/lib/pillars';

// "How we work" block. Deliberately no team photo, headcount or discipline
// chips: nothing here claims more than the studio can back up. It points at
// the three pillars instead.
export default function Crew() {
  const a = useTranslations('about');
  const p = useTranslations('pillars');

  return (
    <section aria-labelledby="about-work-title" className="border-b border-border py-section">
      <Container className="grid gap-10 nav:grid-cols-[5fr_7fr] nav:gap-16">
        <Reveal>
          <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-amber">
            <span aria-hidden>{'// '}</span>
            {a('team_label')}
          </p>
          <h2
            id="about-work-title"
            className="u-track mt-4 font-display text-h2 font-semibold leading-[1.05] tracking-[-0.02em]"
          >
            {a('team_title')}
          </h2>
          <p className="mt-5 max-w-[440px] text-lead leading-relaxed text-muted">
            {a('team_sub')}
          </p>
        </Reveal>

        <Reveal index={1}>
          <p className="u-mono font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
            {a('team_pillars')}
          </p>
          <ul className="mt-5 flex flex-col">
            {PILLARS.map((pl) => (
              <li
                key={pl.id}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-border-sub py-5 last:border-b"
              >
                <span className="font-display text-xl font-medium text-ink">
                  {p(`${pl.id}.name`)}
                </span>
                <ArrowLink href={`/services#${pl.anchor}`} label={p(`${pl.id}.kicker`)} />
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
