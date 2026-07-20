import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import Reveal from '@/components/motion/Reveal';

const ITEMS = ['inc_1', 'inc_2', 'inc_3', 'inc_4', 'inc_5', 'inc_6'] as const;

// "Every engagement includes" — the essentials baked into any price.
export default function Included() {
  const p = useTranslations('pricing');

  return (
    <section className="border-t border-border bg-bg-alt">
      <Container className="py-24">
        <Reveal>
          <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-amber">
            {p('inc_label')}
          </p>
          <h2 className="u-track mt-4 font-display text-h2 font-semibold leading-[1.05] tracking-[-0.02em]">
            {p('inc_title')}
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-x-10 gap-y-6 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
          {ITEMS.map((it, i) => (
            <Reveal key={it} index={i}>
              <div className="flex items-start gap-3 border-t border-border-sub pt-5">
                <span className="mt-0.5 font-mono text-amber">+</span>
                <span className="text-[16px] text-ink-2">{p(it)}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
