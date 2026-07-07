import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import ArrowLink from '@/components/ui/ArrowLink';
import Reveal from '@/components/motion/Reveal';

const MODELS = [
  {n: '01', name: 'em1_n', d: 'em1_d'},
  {n: '02', name: 'em2_n', d: 'em2_d'},
  {n: '03', name: 'em3_n', d: 'em3_d'},
] as const;

// Three ways to engage devora — links out to the pricing page. Mirrors the
// hairline-grid card pattern used across the site.
export default function EngagementModels() {
  const s = useTranslations('services');

  return (
    <section className="border-t border-border bg-bg-alt">
      <Container className="py-24">
        <Reveal>
          <SectionHeader
            label={s('em_label')}
            title={s('em_title')}
            link={<ArrowLink href="/pricing" label={s('em_link')} />}
          />
        </Reveal>

        <div className="mt-14 grid gap-px bg-border [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
          {MODELS.map((m, i) => (
            <Reveal key={m.n} index={i} className="h-full">
              <div className="group h-full bg-bg-alt px-8 pb-11 pt-9 transition-[background-color,transform] duration-300 hover:-translate-y-1.5 hover:bg-surface-2">
                <span className="font-mono text-sm text-amber">{m.n}</span>
                <h3 className="mt-6 font-display text-[22px] font-semibold">
                  {s(m.name)}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">
                  {s(m.d)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
