import {useLocale, useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import Reveal from '@/components/motion/Reveal';
import Spotlight from '@/components/motion/Spotlight';
import {pricingParams} from '@/lib/pricing/config';

// "How pricing works": a one-time build plus an optional monthly Care Plan.
// The only figures shown are the care-plan range from lib/pricing/config.
export default function HowPricingWorks() {
  const p = useTranslations('pricing');
  const params = pricingParams(useLocale());
  const cards = [
    {n: '01', t: p('build_t'), d: p('build_d')},
    {n: '02', t: p('care_t'), d: p('care_d', params)},
  ];

  return (
    <section aria-labelledby="how-pricing-title" className="aura overflow-x-clip pb-block pt-section">
      <Container>
        <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-amber">
          <span aria-hidden>{'// '}</span>
          {p('how_label')}
        </p>
        <h2
          id="how-pricing-title"
          className="u-track mt-4 max-w-[760px] font-display text-h2 font-semibold leading-[1.05] tracking-[-0.02em]"
        >
          {p('how_title')}
        </h2>
        <p className="mt-5 max-w-[640px] text-lead text-muted">{p('how_sub')}</p>

        <ul className="mt-12 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))]">
          {cards.map((c, i) => (
            <li key={c.n}>
              <Reveal index={i} className="h-full">
                <Spotlight className="glass h-full rounded-panel p-6 nav:p-10">
                  <span className="num font-mono text-sm text-amber">{c.n}</span>
                  <h3 className="mt-5 font-display text-h3 font-semibold leading-tight">{c.t}</h3>
                  <p className="mt-4 max-w-[480px] text-base leading-[1.7] text-muted">{c.d}</p>
                </Spotlight>
              </Reveal>
            </li>
          ))}
        </ul>
        <p className="u-mono mt-6 font-mono text-xs text-faint">{p('how_note')}</p>
      </Container>
    </section>
  );
}
