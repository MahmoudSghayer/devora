import {useLocale, useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import ArrowLink from '@/components/ui/ArrowLink';
import Reveal from '@/components/motion/Reveal';
import Spotlight from '@/components/motion/Spotlight';
import {pricingParams} from '@/lib/pricing/config';

const MODELS = [
  {n: '01', name: 'em1_n', d: 'em1_d'},
  {n: '02', name: 'em2_n', d: 'em2_d'},
  {n: '03', name: 'em3_n', d: 'em3_d'},
] as const;

// Three ways to engage devora, linking out to the pricing page.
export default function EngagementModels() {
  const s = useTranslations('services');
  const params = pricingParams(useLocale());

  return (
    <section className="border-b border-border py-section">
      <Container>
        <Reveal>
          <SectionHeader
            label={s('em_label')}
            title={s('em_title')}
            link={<ArrowLink href="/pricing" label={s('em_link')} />}
          />
        </Reveal>

        <ul className="mt-12 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
          {MODELS.map((m, i) => (
            <li key={m.n}>
              <Reveal index={i} className="h-full">
                <Spotlight className="glass h-full rounded-card px-8 pb-10 pt-8 transition-transform duration-300 hover:-translate-y-1">
                  <span className="num font-mono text-sm text-amber">{m.n}</span>
                  <h3 className="mt-5 font-display text-[22px] font-semibold">
                    {s(m.name)}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">
                    {s(m.d, params)}
                  </p>
                </Spotlight>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
