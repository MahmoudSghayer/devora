import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import ArrowLink from '@/components/ui/ArrowLink';
import Chip from '@/components/ui/Chip';
import Reveal from '@/components/motion/Reveal';

const INDUSTRIES = ['i1_t', 'i2_t', 'i3_t', 'i4_t', 'i5_t', 'i6_t'] as const;

export default function IndustriesTeaser() {
  const h = useTranslations('home');
  const i = useTranslations('industries');

  return (
    <section className="border-b border-border">
      <Container className="py-24">
        <Reveal>
          <SectionHeader
            label={h('ind_label')}
            title={h('ind_title')}
            link={<ArrowLink href="/industries" label={h('ind_link')} />}
          />
        </Reveal>
        <Reveal>
          <p className="mt-4 max-w-[600px] text-[17px] text-muted">
            {h('ind_sub')}
          </p>
        </Reveal>
        <Reveal>
          <div className="mt-10 flex flex-wrap gap-2.5">
            {INDUSTRIES.map((k) => (
              <Chip key={k}>{i(k)}</Chip>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
