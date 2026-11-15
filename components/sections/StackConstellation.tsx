import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import Reveal from '@/components/motion/Reveal';
import {STACK_GROUPS, STAGE, groupLines, labelPos, placeNodes} from '@/lib/stack';
import StackMap from './stack/StackMap';
import type {MapGroup} from './stack/types';

const BENEFITS = ['b1', 'b2', 'b3'] as const;

/**
 * Section 7: the real stack, grouped. Server component: it resolves every
 * string and icon path, then hands plain data to the one client island.
 */
export default function StackConstellation() {
  const t = useTranslations('stack');

  const groups: MapGroup[] = STACK_GROUPS.map((g) => {
    const pos = labelPos(g);
    const placed = placeNodes(g);
    return {
      id: g.id,
      label: t(`g_${g.id}`),
      tone: g.tone,
      stroke: g.stroke,
      depth: g.depth,
      labelX: pos.x,
      labelY: pos.y,
      lines: groupLines(g),
      nodes: placed.map((n) => ({
        id: n.id,
        name: t(`n_${n.id}`),
        use: t(`u_${n.id}`),
        path: n.path,
        mono: n.mono,
        x: n.x,
        y: n.y,
      })),
    };
  });

  return (
    <section className="relative overflow-x-clip border-b border-border py-section">
      <Container>
        <Reveal>
          <SectionHeader label={t('label')} title={t('title')} />
          <p className="mt-5 max-w-[680px] text-lead leading-[1.6] text-muted">{t('sub')}</p>
        </Reveal>

        <div className="mt-10 nav:mt-14">
          <StackMap
            groups={groups}
            stage={STAGE}
            hubLabel={t('hub')}
            hint={t('hint')}
            listAria={t('list_aria')}
          />
        </div>

        <ul className="mt-12 grid gap-8 nav:mt-16 nav:grid-cols-3 nav:gap-10">
          {BENEFITS.map((b) => (
            <li key={b} className="border-t border-border-card pt-5">
              <h3 className="font-display text-[20px] font-semibold tracking-[-0.01em]">{t(`${b}_t`)}</h3>
              <p className="mt-2 leading-[1.65] text-muted">{t(`${b}_d`)}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
