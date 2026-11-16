import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import ArrowLink from '@/components/ui/ArrowLink';
import Reveal from '@/components/motion/Reveal';

const STEPS = [
  {n: '01', t: 's1_t', d: 's1_d'},
  {n: '02', t: 's2_t', d: 's2_d'},
  {n: '03', t: 's3_t', d: 's3_d'},
  {n: '04', t: 's4_t', d: 's4_d'},
  {n: '05', t: 's5_t', d: 's5_d'},
] as const;

// The one process (Discovery → Support), sourced from the `process` namespace.
export default function ProcessSteps() {
  const s = useTranslations('process');
  const v = useTranslations('services');

  return (
    <section
      aria-labelledby="services-process-title"
      className="border-b border-border bg-bg-alt py-section"
    >
      <Container>
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-[720px]">
              <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-amber">
                <span aria-hidden>{'// '}</span>
                {s('pr_label')}
              </p>
              <h2
                id="services-process-title"
                className="u-track mt-4 font-display text-h2 font-semibold leading-[1.05] tracking-[-0.02em]"
              >
                {s('pr_title')}
              </h2>
            </div>
            <ArrowLink href="/process" label={v('process_link')} />
          </div>
        </Reveal>

        <ol className="mt-12 grid gap-8 [grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))]">
          {STEPS.map((step, i) => (
            <li key={step.n}>
              <Reveal index={i}>
                <div
                  className={`border-t-2 pt-6 transition-colors duration-300 ${
                    i === 0
                      ? 'border-amber'
                      : 'border-border-chip hover:border-amber'
                  }`}
                >
                  <span className="num font-mono text-sm text-amber">{step.n}</span>
                  <h3 className="mt-4 text-xl font-semibold">{s(step.t)}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {s(step.d)}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
