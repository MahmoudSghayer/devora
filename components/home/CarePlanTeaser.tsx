import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import ArrowLink from '@/components/ui/ArrowLink';
import Reveal from '@/components/motion/Reveal';

const POINTS = ['care_p1', 'care_p2', 'care_p3'] as const;

// "Beyond launch" — surfaces the Care Plan (recurring) offer and links to pricing.
export default function CarePlanTeaser() {
  const h = useTranslations('home');

  return (
    <section className="border-b border-border bg-bg-alt">
      <Container className="grid items-center gap-10 py-24 nav:grid-cols-[6fr_5fr] nav:gap-16">
        <Reveal>
          <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-muted-2">
            {h('care_label')}
          </p>
          <h2 className="u-track mt-4 font-display text-h2 font-semibold leading-[1.05] tracking-[-0.02em]">
            {h('care_title')}
          </h2>
          <p className="mt-5 max-w-[460px] text-[17px] leading-relaxed text-muted">
            {h('care_sub')}
          </p>
          <div className="mt-8">
            <ArrowLink href="/pricing" label={h('care_link')} />
          </div>
        </Reveal>

        <Reveal index={1}>
          <ul className="flex flex-col gap-4">
            {POINTS.map((k) => (
              <li
                key={k}
                className="flex items-start gap-3 border-t border-border-sub pt-4"
              >
                <span className="font-mono text-amber">+</span>
                <span className="text-[17px] text-ink-2">{h(k)}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
