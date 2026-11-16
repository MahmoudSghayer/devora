import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import Reveal from '@/components/motion/Reveal';

const ITEMS = ['inc_1', 'inc_2', 'inc_3', 'inc_4', 'inc_5', 'inc_6'] as const;

// "Every engagement includes" — the essentials baked into any price. The
// heading is rendered statically (never behind a scroll reveal) so the section
// can never read as an empty band; only the list items animate in.
export default function Included() {
  const p = useTranslations('pricing');

  return (
    <section
      aria-labelledby="included-title"
      className="border-y border-border bg-bg-alt/60 py-section"
    >
      <Container>
        <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-amber">
          <span aria-hidden>{'// '}</span>
          {p('inc_label')}
        </p>
        <h2
          id="included-title"
          className="u-track mt-4 max-w-[760px] font-display text-h2 font-semibold leading-[1.05] tracking-[-0.02em]"
        >
          {p('inc_title')}
        </h2>

        <ul className="mt-12 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
          {ITEMS.map((it, i) => (
            <li key={it}>
              <Reveal index={i} className="h-full">
                <div className="glass flex h-full items-start gap-4 rounded-card p-6">
                  <span
                    aria-hidden
                    className="u-mono num font-mono text-sm text-amber"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-base leading-snug text-ink-2">{p(it)}</span>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
