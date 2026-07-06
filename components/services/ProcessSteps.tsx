import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import Reveal from '@/components/motion/Reveal';

const STEPS = [
  {n: '01', t: 'p1_t', d: 'p1_d'},
  {n: '02', t: 'p2_t', d: 'p2_d'},
  {n: '03', t: 'p3_t', d: 'p3_d'},
  {n: '04', t: 'p4_t', d: 'p4_d'},
  {n: '05', t: 'p5_t', d: 'p5_d'},
] as const;

export default function ProcessSteps() {
  const s = useTranslations('services');

  return (
    <section className="bg-bg-alt">
      <Container className="py-24">
        <Reveal>
          <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-muted-2">
            {s('pr_label')}
          </p>
          <h2 className="u-track mt-4 max-w-[720px] font-display text-h2 font-semibold leading-[1.05] tracking-[-0.02em]">
            {s('pr_title')}
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-8 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} index={i}>
              <div
                className={`border-t-2 pt-6 transition-colors duration-300 ${
                  i === 0
                    ? 'border-amber'
                    : 'border-border-chip hover:border-amber'
                }`}
              >
                <span className="font-mono text-sm text-amber">{step.n}</span>
                <h3 className="mt-4 text-xl font-semibold">{s(step.t)}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {s(step.d)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
