import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import Reveal from '@/components/motion/Reveal';
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

  return (
    <section>
      <Container className="py-24">
        <Reveal>
          <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-amber">
            {p('models_label')}
          </p>
          <p className="mt-4 max-w-[640px] text-[17px] text-muted">{p('note')}</p>
        </Reveal>

        <div className="mt-14 grid items-stretch gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
          {MODELS.map((pk, i) => (
            <Reveal key={pk.n} index={i} className="h-full">
              <div
                className={`relative flex h-full flex-col rounded-[18px] p-10 transition-transform duration-300 hover:-translate-y-1.5 ${
                  pk.featured
                    ? 'border border-amber bg-featured'
                    : 'border border-border-card bg-bg-alt'
                }`}
              >
                {'tag' in pk && (
                  <span
                    className={`absolute -top-[13px] start-8 rounded-pill px-3.5 py-1.5 font-mono text-[11px] font-bold tracking-[0.08em] ${
                      pk.featured
                        ? 'bg-amber text-on-amber'
                        : 'border border-border-amber bg-bg text-amber'
                    }`}
                  >
                    {p(pk.tag)}
                  </span>
                )}
                <h3 className="text-2xl font-semibold">{p(pk.n)}</h3>
                <p className="mt-3 text-[15px] text-muted">{p(pk.d)}</p>
                <p className="mt-5 font-mono text-[22px] text-amber" dir="ltr">
                  {p(pk.p)}
                </p>
                <p className="mt-1 font-mono text-[13px] text-muted-2" dir="ltr">
                  {p(pk.mo)}
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
                  className={`mt-8 rounded-pill px-6 py-3 text-center text-sm font-semibold transition-colors ${
                    pk.featured
                      ? 'bg-amber text-on-amber hover:bg-amber-hi'
                      : 'border border-border-ghost hover:border-amber hover:text-amber'
                  }`}
                >
                  {p(pk.btn)}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
