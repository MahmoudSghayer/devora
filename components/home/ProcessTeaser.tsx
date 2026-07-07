import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import ArrowLink from '@/components/ui/ArrowLink';
import Reveal from '@/components/motion/Reveal';

const STEPS = ['p1_t', 'p2_t', 'p3_t', 'p4_t', 'p5_t'] as const;

// Compact "how we work" strip on the home page — links to the full Process page.
export default function ProcessTeaser() {
  const h = useTranslations('home');
  const s = useTranslations('services');

  return (
    <section className="border-b border-border bg-bg-alt">
      <Container className="py-24">
        <Reveal>
          <SectionHeader
            label={h('proc_label')}
            title={h('proc_title')}
            link={<ArrowLink href="/process" label={h('proc_link')} />}
          />
        </Reveal>
        <Reveal>
          <p className="mt-4 max-w-[600px] text-[17px] text-muted">
            {h('proc_sub')}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-px bg-border [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
          {STEPS.map((k, i) => (
            <Reveal key={k} index={i} className="h-full">
              <div className="h-full bg-bg-alt px-6 py-8 transition-colors duration-300 hover:bg-surface-2">
                <span className="font-mono text-sm text-amber">
                  {`0${i + 1}`}
                </span>
                <h3 className="mt-4 font-display text-[18px] font-semibold">
                  {s(k)}
                </h3>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
