import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import Reveal from '@/components/motion/Reveal';

const STEPS = [
  {n: '01', t: 's1_t', d: 's1_d', out: 's1_out'},
  {n: '02', t: 's2_t', d: 's2_d', out: 's2_out'},
  {n: '03', t: 's3_t', d: 's3_d', out: 's3_out'},
  {n: '04', t: 's4_t', d: 's4_d', out: 's4_out'},
  {n: '05', t: 's5_t', d: 's5_d', out: 's5_out'},
] as const;

// The five moves in depth. Each step shows what happens + what you walk away
// with. First step accented amber, like the Services process strip.
export default function ProcessDetail() {
  const p = useTranslations('process');

  return (
    <section>
      <Container>
        {STEPS.map((step, i) => (
          <Reveal
            key={step.n}
            className="grid gap-8 border-b border-border-sub py-16 nav:grid-cols-[5fr_7fr]"
          >
            <div className="flex items-baseline gap-6">
              <span
                className={`font-mono text-sm ${
                  i === 0 ? 'text-amber' : 'text-faint'
                }`}
              >
                {step.n}
              </span>
              <h2
                className="u-track font-display font-semibold tracking-[-0.02em]"
                style={{fontSize: 'clamp(28px, 3vw, 40px)'}}
              >
                {p(step.t)}
              </h2>
            </div>
            <div>
              <p className="max-w-[620px] text-[17px] leading-[1.65] text-muted">
                {p(step.d)}
              </p>
              <div className="mt-6 inline-flex items-center gap-3 rounded-pill border border-border-chip px-4 py-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                  {p('out_label')}
                </span>
                <span className="text-sm text-ink-2">{p(step.out)}</span>
              </div>
            </div>
          </Reveal>
        ))}
      </Container>
    </section>
  );
}
