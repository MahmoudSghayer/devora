import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import Reveal from '@/components/motion/Reveal';

// The "why devora / dev + aura" narrative. Label + title left, two paragraphs
// right — the site's standard 5fr/7fr editorial split.
export default function Story() {
  const a = useTranslations('about');

  return (
    <section className="border-b border-border">
      <Container className="grid gap-10 py-24 nav:grid-cols-[5fr_7fr] nav:gap-16">
        <Reveal>
          <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-amber">
            {a('story_label')}
          </p>
          <h2 className="u-track mt-4 font-display text-h2 font-semibold leading-[1.05] tracking-[-0.02em]">
            {a('story_title')}
          </h2>
        </Reveal>
        <Reveal index={1}>
          <p className="text-[19px] leading-[1.7] text-ink-2">{a('story_p1')}</p>
          <p className="mt-6 text-[17px] leading-[1.7] text-muted">
            {a('story_p2')}
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
