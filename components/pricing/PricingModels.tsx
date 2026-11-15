import {useLocale, useTranslations} from 'next-intl';
import {pricingParams} from '@/lib/pricing/config';
import Container from '@/components/ui/Container';
import Reveal from '@/components/motion/Reveal';
import TiltCard from '@/components/motion/TiltCard';
import ArrowLink from '@/components/ui/ArrowLink';
import {Link} from '@/i18n/navigation';

// Three tiers, each a one-time build fee + a low monthly (hosting, care &
// support). "from" prices are indicative starting points — every project is
// scoped and quoted to fit.
const MODELS = [
  {
    n: 'm1_n',
    d: 'm1_d',
    p: 'm1_p',
    mo: 'm1_mo',
    feats: ['m1_f1', 'm1_f2', 'm1_f3', 'm1_f4', 'm1_f5', 'm1_f6', 'm1_f7', 'm1_f8'],
    featured: false,
    btn: 'btn',
  },
  {
    n: 'm2_n',
    d: 'm2_d',
    p: 'm2_p',
    mo: 'm2_mo',
    feats: ['m2_f1', 'm2_f2', 'm2_f3', 'm2_f4', 'm2_f5', 'm2_f6', 'm2_f7', 'm2_f8', 'm2_f9'],
    featured: true,
    tag: 'm2_tag',
    btn: 'btn',
  },
  {
    n: 'm3_n',
    d: 'm3_d',
    p: 'm3_p',
    mo: 'm3_mo',
    feats: ['m3_f1', 'm3_f2', 'm3_f3', 'm3_f4', 'm3_f5', 'm3_f6', 'm3_f7', 'm3_f8'],
    featured: false,
    tag: 'm3_tag',
    btn: 'btn_care',
  },
] as const;

export default function PricingModels() {
  const p = useTranslations('pricing');
  const pl = useTranslations('pillars');
  const params = pricingParams(useLocale());

  return (
    <section aria-labelledby="pricing-models-title" className="aura overflow-x-clip py-section">
      <Container>
        <Reveal>
          <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-amber">
            <span aria-hidden>{'// '}</span>
            {p('models_label')}
          </p>
          <h2
            id="pricing-models-title"
            className="u-track mt-4 max-w-[760px] font-display text-h2 font-semibold leading-[1.05] tracking-[-0.02em]"
          >
            {p('models_title')}
          </h2>
          <p className="mt-5 max-w-[640px] text-lead text-muted">{p('note')}</p>
          <div className="mt-5">
            <ArrowLink href="/estimate" label={pl('web.cta')} />
          </div>
        </Reveal>

        <div className="mt-16 grid items-stretch gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
          {MODELS.map((pk, i) => (
            <Reveal key={pk.n} index={i} className="h-full">
              <TiltCard
                className={`flex h-full flex-col rounded-card p-8 nav:p-10 ${
                  pk.featured
                    ? 'border border-amber bg-featured'
                    : 'glass'
                }`}
              >
                {'tag' in pk && (
                  <span
                    className={`u-mono absolute -top-[13px] start-8 rounded-pill px-3.5 py-1.5 font-mono text-[11px] font-bold tracking-[0.08em] ${
                      pk.featured
                        ? 'bg-amber text-on-amber'
                        : 'border border-border-amber bg-bg text-amber'
                    }`}
                  >
                    {p(pk.tag)}
                  </span>
                )}
                <h3 className="font-display text-2xl font-semibold">{p(pk.n)}</h3>
                <p className="mt-3 text-[15px] text-muted">{p(pk.d)}</p>
                <p className="num mt-5 font-mono text-[22px] text-amber" dir="ltr">
                  {p(pk.p, params)}
                </p>
                <p className="num mt-1 font-mono text-[13px] text-muted-2" dir="ltr">
                  {p(pk.mo, params)}
                </p>
                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {pk.feats.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-ink-2"
                    >
                      <span className="font-mono text-amber">+</span>
                      <span>{p(f)}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact"
                  className={`mt-8 flex min-h-11 items-center justify-center rounded-pill px-6 py-3 text-center text-sm font-semibold transition-colors ${
                    pk.featured
                      ? 'bg-amber text-on-amber hover:bg-amber-hi'
                      : 'border border-border-ghost hover:border-amber hover:text-amber'
                  }`}
                >
                  {p(pk.btn)}
                </Link>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
