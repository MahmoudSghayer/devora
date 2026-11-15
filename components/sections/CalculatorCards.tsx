import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import Reveal from '@/components/motion/Reveal';
import EstimatorCard from './calculators/EstimatorCard';
import RoiCard from './calculators/RoiCard';
import DiscussCard from './calculators/DiscussCard';

/** Three entry points: a mini chooser, a mini chart and a system map. */
export default function CalculatorCards() {
  const t = useTranslations('homeB.calc');
  return (
    <section className="relative overflow-x-clip border-b border-border py-section">
      <Container>
        <Reveal>
          <SectionHeader label={t('label')} title={t('title')} />
          <p className="mt-5 max-w-[680px] text-lead text-muted">{t('sub')}</p>
        </Reveal>
        <div className="mt-10 grid gap-6 nav:mt-14 grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] nav:gap-8">
          <Reveal index={0}>
            <EstimatorCard />
          </Reveal>
          <Reveal index={1}>
            <RoiCard />
          </Reveal>
          <Reveal index={2}>
            <DiscussCard />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
