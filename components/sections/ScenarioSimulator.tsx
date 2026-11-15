import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import Reveal from '@/components/motion/Reveal';
import SimulatorPanel from './simulator/SimulatorPanel';

/** "3 hours a day on WhatsApp": interactive before/after, numbers from lib/roi. */
export default function ScenarioSimulator() {
  const t = useTranslations('homeB.sim');
  return (
    <section className="relative overflow-x-clip border-b border-border py-section">
      <Container>
        <Reveal>
          <SectionHeader label={t('label')} title={t('title')} />
          <p className="mt-5 max-w-[680px] text-lead text-muted">{t('sub')}</p>
        </Reveal>
        <div className="mt-10 nav:mt-14">
          <SimulatorPanel />
        </div>
      </Container>
    </section>
  );
}
