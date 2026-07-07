import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import Reveal from '@/components/motion/Reveal';
import Chip from '@/components/ui/Chip';

const DISCIPLINES = [
  {n: '01', t: 's1_t', d: 'sb1_d', chips: ['d11', 'd12', 'd13', 'd14']},
  {n: '02', t: 's2_t', d: 'sb2_d', chips: ['d21', 'd22', 'd23', 'd24']},
  {n: '03', t: 's3_t', d: 'sb3_d', chips: ['d31', 'd32', 'd33', 'd34']},
  {n: '04', t: 's4_t', d: 'sb4_d', chips: ['d41', 'd42', 'd43', 'd44']},
  {n: '05', t: 's5_t', d: 'sb5_d', chips: ['d51', 'd52', 'd53', 'd54']},
] as const;

export default function DisciplineRows() {
  const svc = useTranslations('common.svc');
  const s = useTranslations('services');

  return (
    <section>
      <Container>
        {DISCIPLINES.map((row) => (
          <Reveal
            key={row.n}
            className="grid gap-8 border-b border-border-sub py-16 nav:grid-cols-[5fr_7fr]"
          >
            <div className="flex items-baseline gap-6">
              <span className="font-mono text-sm text-amber">{row.n}</span>
              <h2
                className="u-track font-display font-semibold tracking-[-0.02em]"
                style={{fontSize: 'clamp(28px, 3vw, 40px)'}}
              >
                {svc(row.t)}
              </h2>
            </div>
            <div>
              <p className="max-w-[600px] text-[17px] leading-[1.65] text-muted">
                {s(row.d)}
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                {row.chips.map((ch) => (
                  <Chip key={ch}>{s(ch)}</Chip>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </Container>
    </section>
  );
}
