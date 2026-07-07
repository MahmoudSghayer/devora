import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import Reveal from '@/components/motion/Reveal';

const INDUSTRIES = [
  {n: '01', t: 'i1_t', d: 'i1_d'},
  {n: '02', t: 'i2_t', d: 'i2_d'},
  {n: '03', t: 'i3_t', d: 'i3_d'},
  {n: '04', t: 'i4_t', d: 'i4_d'},
  {n: '05', t: 'i5_t', d: 'i5_d'},
  {n: '06', t: 'i6_t', d: 'i6_d'},
] as const;

export default function IndustryGrid() {
  const i = useTranslations('industries');

  return (
    <section>
      <Container className="py-24">
        <div className="grid gap-px bg-border [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
          {INDUSTRIES.map((row, idx) => (
            <Reveal key={row.n} index={idx} className="h-full">
              <div className="group h-full bg-bg px-8 pb-11 pt-9 transition-[background-color,transform] duration-300 hover:-translate-y-1.5 hover:bg-surface-2">
                <span className="font-mono text-sm text-amber">{row.n}</span>
                <h2 className="mt-6 font-display text-[22px] font-semibold">
                  {i(row.t)}
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">
                  {i(row.d)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
