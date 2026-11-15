import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import {PILLARS, pillarItemKeys} from '@/lib/pillars';
import PillarTabs, {type PillarView} from './pillars/PillarTabs';

/**
 * "Three pillars" as an interactive sticky switcher. Server component: all
 * copy for all three pillars is rendered into the HTML (inactive panels are
 * `hidden`), the client island only handles selection.
 */
export default function PillarSwitcher() {
  const t = useTranslations('pillars');
  const h = useTranslations('homeB');

  const views: PillarView[] = PILLARS.map((p) => ({
    id: p.id,
    anchor: p.anchor,
    tint: p.tint,
    calculator: p.calculator,
    name: t(`${p.id}.name`),
    kicker: t(`${p.id}.kicker`),
    headline: t(`${p.id}.headline`),
    desc: t(`${p.id}.desc`),
    items: pillarItemKeys(p.itemCount).map((k) => t(`${p.id}.${k}`)),
    scenarioTitle: t(`${p.id}.scenario_title`),
    scenario: t(`${p.id}.scenario`),
    outcomes: [t(`${p.id}.o1`), t(`${p.id}.o2`), t(`${p.id}.o3`)],
    cta: t(`${p.id}.cta`),
  }));

  return (
    <section className="border-b border-border py-section" aria-labelledby="pillars-title">
      <Container>
        <SectionHeader label={t('label')} title={t('title')} titleId="pillars-title" />
        <p className="mt-5 max-w-[640px] text-lead text-muted">{t('sub')}</p>
        <PillarTabs
          pillars={views}
          labels={{
            tabs: h('tabs_label'),
            scenario: t('scenario_label'),
            outcomes: t('outcomes_label'),
            includes: t('includes_label'),
            explore: t('explore'),
          }}
        />
      </Container>
    </section>
  );
}
