import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import Reveal from '@/components/motion/Reveal';
import Spotlight from '@/components/motion/Spotlight';
import ArrowLink from '@/components/ui/ArrowLink';
import {PILLARS} from '@/lib/pillars';
import {PILLAR_TINT} from './pillarTint';

// "Which pillar is right for me?" — three situations, each deep-linking to the
// matching pillar section below.
export default function PillarHelper() {
  const s = useTranslations('services');
  const p = useTranslations('pillars');

  return (
    <section aria-labelledby="pillar-helper-title" className="border-b border-border py-section">
      <Container>
        <Reveal>
          <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-amber">
            <span aria-hidden>{'// '}</span>
            {s('help_label')}
          </p>
          <h2
            id="pillar-helper-title"
            className="u-track mt-4 max-w-[760px] font-display text-h2 font-semibold leading-[1.05] tracking-[-0.02em]"
          >
            {s('help_title')}
          </h2>
        </Reveal>

        <ul className="mt-12 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
          {PILLARS.map((pl, i) => {
            const tint = PILLAR_TINT[pl.tint];
            return (
              <li key={pl.id}>
                <Reveal index={i} className="h-full">
                  <Spotlight
                    tone={tint.tone}
                    className="glass h-full rounded-card"
                  >
                    <a
                      href={`#${pl.anchor}`}
                      className="flex h-full flex-col gap-6 rounded-card p-6 nav:p-8"
                    >
                      <span className="font-display text-xl font-medium leading-snug text-ink">
                        {s(`help_${pl.id}_q`)}
                      </span>
                      <span
                        className={`u-mono mt-auto inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] ${tint.text}`}
                      >
                        {s('help_go')} {p(`${pl.id}.name`)}
                        <span aria-hidden>↓</span>
                      </span>
                    </a>
                  </Spotlight>
                </Reveal>
              </li>
            );
          })}
        </ul>

        <Reveal>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
            <p className="max-w-[560px] text-base text-muted">{s('help_foot')}</p>
            <ArrowLink href="/contact" label={s('help_link')} />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
