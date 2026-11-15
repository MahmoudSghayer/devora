import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import Reveal from '@/components/motion/Reveal';
import Spotlight from '@/components/motion/Spotlight';

const POINTS = [
  {n: '01', t: 'diff_1_t', d: 'diff_1_d'},
  {n: '02', t: 'diff_2_t', d: 'diff_2_d'},
  {n: '03', t: 'diff_3_t', d: 'diff_3_d'},
  {n: '04', t: 'diff_4_t', d: 'diff_4_d'},
] as const;

export default function Difference() {
  const a = useTranslations('about');

  return (
    <section
      aria-labelledby="about-diff-title"
      className="aura aura-signal overflow-x-clip border-b border-border py-section"
    >
      <Container>
        <Reveal>
          <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-amber">
            <span aria-hidden>{'// '}</span>
            {a('diff_label')}
          </p>
          <h2
            id="about-diff-title"
            className="u-track mt-4 max-w-[760px] font-display text-h2 font-semibold leading-[1.05] tracking-[-0.02em]"
          >
            {a('diff_title')}
          </h2>
        </Reveal>

        <ul className="mt-12 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
          {POINTS.map((pt, i) => (
            <li key={pt.n}>
              <Reveal index={i} className="h-full">
                <Spotlight className="glass h-full rounded-card p-6 nav:p-8">
                  <span className="num font-mono text-sm text-amber">{pt.n}</span>
                  <h3 className="mt-4 font-display text-xl font-semibold">{a(pt.t)}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">
                    {a(pt.d)}
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
