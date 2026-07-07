import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import ArrowLink from '@/components/ui/ArrowLink';
import Reveal from '@/components/motion/Reveal';

const ITEMS = [
  {n: '01', t: 's1_t', d: 's1_d'},
  {n: '02', t: 's2_t', d: 's2_d'},
  {n: '03', t: 's3_t', d: 's3_d'},
  {n: '04', t: 's4_t', d: 's4_d'},
  {n: '05', t: 's5_t', d: 's5_d'},
] as const;

export default function ServicesOverview() {
  const h = useTranslations('home');
  const svc = useTranslations('common.svc');

  return (
    <section className="border-b border-border">
      <Container className="py-24">
        <Reveal>
          <SectionHeader
            label={h('svc_label')}
            title={h('svc_title')}
            link={<ArrowLink href="/services" label={h('svc_link')} />}
          />
        </Reveal>

        <div className="mt-14 grid gap-px bg-border [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
          {ITEMS.map((it, i) => (
            <Reveal key={it.n} index={i} className="h-full">
              <div className="group h-full bg-bg px-8 pb-11 pt-9 transition-[background-color,transform] duration-300 hover:-translate-y-1.5 hover:bg-surface-2">
                <span className="font-mono text-sm text-amber">{it.n}</span>
                <h3 className="mt-6 font-display text-[22px] font-semibold">
                  {svc(it.t)}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">
                  {svc(it.d)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
