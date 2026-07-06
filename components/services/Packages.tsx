import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import Reveal from '@/components/motion/Reveal';
import {Link} from '@/i18n/navigation';

// NOTE: prices (k1_p / k2_p) are placeholder figures — TODO(devora): replace
// with real numbers, or keep "custom quote" framing.
const PACKAGES = [
  {n: 'k1_n', d: 'k1_d', p: 'k1_p', feats: ['k1_f1', 'k1_f2', 'k1_f3', 'k1_f4'], featured: false},
  {
    n: 'k2_n',
    d: 'k2_d',
    p: 'k2_p',
    feats: ['k2_f1', 'k2_f2', 'k2_f3', 'k2_f4', 'k2_f5'],
    featured: true,
    tag: 'k2_tag',
  },
  {n: 'k3_n', d: 'k3_d', p: 'k3_p', feats: ['k3_f1', 'k3_f2', 'k3_f3', 'k3_f4'], featured: false},
] as const;

export default function Packages() {
  const s = useTranslations('services');

  return (
    <section>
      <Container className="py-24">
        <Reveal>
          <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-muted-2">
            {s('pk_label')}
          </p>
          <h2 className="u-track mt-4 font-display text-h2 font-semibold leading-[1.05] tracking-[-0.02em]">
            {s('pk_title')}
          </h2>
          <p className="mt-4 text-[17px] text-muted">{s('pk_sub')}</p>
        </Reveal>

        <div className="mt-14 grid items-stretch gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
          {PACKAGES.map((pk, i) => (
            <Reveal key={pk.n} index={i} className="h-full">
              <div
                className={`relative flex h-full flex-col rounded-[18px] p-10 transition-transform duration-300 hover:-translate-y-1.5 ${
                  pk.featured
                    ? 'border border-amber bg-featured'
                    : 'border border-border-card bg-bg-alt'
                }`}
              >
                {pk.featured && 'tag' in pk && (
                  <span className="absolute -top-[13px] start-8 rounded-pill bg-amber px-3.5 py-1.5 font-mono text-[11px] font-bold tracking-[0.08em] text-on-amber">
                    {s(pk.tag)}
                  </span>
                )}
                <h3 className="text-2xl font-semibold">{s(pk.n)}</h3>
                <p className="mt-3 text-[15px] text-muted">{s(pk.d)}</p>
                <p className="mt-5 font-mono text-[17px] text-amber">{s(pk.p)}</p>
                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {pk.feats.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink-2">
                      <span className="font-mono text-amber">+</span>
                      <span>{s(f)}</span>
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
                  {s('pk_btn')}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
