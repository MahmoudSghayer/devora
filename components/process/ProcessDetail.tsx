import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import Reveal from '@/components/motion/Reveal';
import Spotlight from '@/components/motion/Spotlight';

const STEPS = [
  {n: '01', t: 's1_t', d: 's1_d', out: 's1_out'},
  {n: '02', t: 's2_t', d: 's2_d', out: 's2_out'},
  {n: '03', t: 's3_t', d: 's3_d', out: 's3_out'},
  {n: '04', t: 's4_t', d: 's4_d', out: 's4_out'},
  {n: '05', t: 's5_t', d: 's5_d', out: 's5_out'},
] as const;

// The five steps in depth, as a vertical timeline: a hairline rail with a node
// per step, each step a glass card with what happens and what you walk away with.
export default function ProcessDetail() {
  const p = useTranslations('process');

  return (
    <section aria-label={p('pr_title')} className="py-section">
      <Container>
        <ol className="relative flex flex-col gap-6 ps-10 nav:ps-20">
          <span
            aria-hidden
            className="absolute inset-y-2 start-[11px] w-px bg-[linear-gradient(180deg,var(--color-amber),var(--color-border-card)_40%,transparent)] nav:start-[27px]"
          />
          {STEPS.map((step, i) => (
            <li key={step.n} className="relative">
              <span
                aria-hidden
                className={`absolute -start-10 top-8 flex h-6 w-6 items-center justify-center rounded-full border bg-bg nav:-start-20 nav:h-14 nav:w-14 ${
                  i === 0 ? 'border-amber' : 'border-border-chip'
                }`}
              >
                <span
                  className={`num font-mono text-[10px] nav:text-sm ${
                    i === 0 ? 'text-amber' : 'text-muted-2'
                  }`}
                >
                  <span className="max-nav:hidden">{step.n}</span>
                  <span className="nav:hidden">{i + 1}</span>
                </span>
              </span>
              <Reveal>
                <Spotlight className="glass grid gap-6 rounded-panel p-6 nav:grid-cols-[4fr_7fr] nav:gap-12 nav:p-10">
                  <h2 className="u-track font-display text-h3 font-semibold leading-tight tracking-[-0.02em]">
                    {p(step.t)}
                  </h2>
                  <div>
                    <p className="max-w-[620px] text-[17px] leading-[1.65] text-muted">
                      {p(step.d)}
                    </p>
                    <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-card border border-border-chip px-4 py-3">
                      <span className="u-mono font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                        {p('out_label')}
                      </span>
                      <span className="text-sm text-ink-2">{p(step.out)}</span>
                    </p>
                  </div>
                </Spotlight>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
