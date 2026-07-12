import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import Reveal from '@/components/motion/Reveal';
import Chip from '@/components/ui/Chip';
import SiteImage from '@/components/ui/SiteImage';

// About-page crew block: senior-team framing + discipline chips (reused from
// home) + a team-photo slot. TODO(devora): supply a real team photo.
const CHIPS = ['tc1', 'tc2', 'tc3', 'tc4', 'tc5', 'tc6'] as const;

export default function Crew() {
  const a = useTranslations('about');
  const h = useTranslations('home');

  return (
    <section className="border-b border-border">
      <Container className="py-24">
        <div className="grid items-center gap-12 nav:grid-cols-2 nav:gap-16">
          <Reveal>
            <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-amber">
              {a('team_label')}
            </p>
            <h2 className="u-track mt-4 font-display text-h2 font-semibold leading-[1.05] tracking-[-0.02em]">
              {a('team_title')}
            </h2>
            <p className="mt-5 max-w-[440px] text-[17px] leading-relaxed text-muted">
              {a('team_sub')}
            </p>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {CHIPS.map((k) => (
                <Chip key={k}>{h(k)}</Chip>
              ))}
            </div>
          </Reveal>

          <Reveal index={1}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[16px]">
              {/* TODO(devora): supply a real team photo. */}
              <SiteImage label="Team photo" />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
