import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import Reveal from '@/components/motion/Reveal';

const POINTS = [
  {n: '01', t: 'diff_1_t', d: 'diff_1_d'},
  {n: '02', t: 'diff_2_t', d: 'diff_2_d'},
  {n: '03', t: 'diff_3_t', d: 'diff_3_d'},
  {n: '04', t: 'diff_4_t', d: 'diff_4_d'},
] as const;

export default function Difference() {
  const a = useTranslations('about');

  return (
    <section className="border-b border-border bg-bg-alt">
      <Container className="py-24">
        <Reveal>
          <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-amber">
            {a('diff_label')}
          </p>
          <h2 className="u-track mt-4 max-w-[760px] font-display text-h2 font-semibold leading-[1.05] tracking-[-0.02em]">
            {a('diff_title')}
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-x-10 gap-y-10 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
          {POINTS.map((pt, i) => (
            <Reveal key={pt.n} index={i}>
              <div className="border-t-2 border-border-chip pt-6 transition-colors duration-300 hover:border-amber">
                <span className="font-mono text-sm text-amber">{pt.n}</span>
                <h3 className="mt-4 text-xl font-semibold">{a(pt.t)}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">
                  {a(pt.d)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
