import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import Reveal from '@/components/motion/Reveal';
import TiltCard from '@/components/motion/TiltCard';
import ArrowLink from '@/components/ui/ArrowLink';

const INDUSTRIES = [
  {n: '01', t: 'i1_t', d: 'i1_d'},
  {n: '02', t: 'i2_t', d: 'i2_d'},
  {n: '03', t: 'i3_t', d: 'i3_d'},
  {n: '04', t: 'i4_t', d: 'i4_d'},
  {n: '05', t: 'i5_t', d: 'i5_d'},
  {n: '06', t: 'i6_t', d: 'i6_d'},
] as const;

// Six kinds of business we are commonly asked to help, as glass tilt cards,
// then a closing note for everyone else. Descriptive only: no client claims.
export default function IndustryGrid() {
  const i = useTranslations('industries');

  return (
    <section aria-label={i('i_title')} className="py-section">
      <Container>
        <ul className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
          {INDUSTRIES.map((row, idx) => (
            <li key={row.n}>
              <Reveal index={idx} className="h-full">
                <TiltCard className="glass h-full rounded-card p-6 nav:p-8">
                  <span className="num font-mono text-sm text-amber">{row.n}</span>
                  <h2 className="mt-6 font-display text-[22px] font-semibold">
                    {i(row.t)}
                  </h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">
                    {i(row.d)}
                  </p>
                </TiltCard>
              </Reveal>
            </li>
          ))}
        </ul>

        <Reveal>
          <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-border pt-8">
            <p className="max-w-[560px] text-lead text-ink-2">{i('i_note')}</p>
            <ArrowLink href="/contact" label={i('i_note_link')} />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
