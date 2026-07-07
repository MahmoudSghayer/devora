import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import Reveal from '@/components/motion/Reveal';

const VALUES = [
  {t: 'val_1_t', d: 'val_1_d'},
  {t: 'val_2_t', d: 'val_2_d'},
  {t: 'val_3_t', d: 'val_3_d'},
  {t: 'val_4_t', d: 'val_4_d'},
] as const;

export default function Values() {
  const a = useTranslations('about');

  return (
    <section className="border-b border-border">
      <Container className="py-24">
        <Reveal>
          <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-muted-2">
            {a('val_label')}
          </p>
          <h2 className="u-track mt-4 font-display text-h2 font-semibold leading-[1.05] tracking-[-0.02em]">
            {a('val_title')}
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-px bg-border [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
          {VALUES.map((v, i) => (
            <Reveal key={v.t} index={i} className="h-full">
              <div className="h-full bg-bg px-8 pb-11 pt-9 transition-colors duration-300 hover:bg-surface-2">
                <h3 className="font-display text-[20px] font-semibold">
                  {a(v.t)}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">
                  {a(v.d)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
