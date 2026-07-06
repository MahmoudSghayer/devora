import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import ArrowLink from '@/components/ui/ArrowLink';
import Reveal from '@/components/motion/Reveal';
import Parallax from '@/components/motion/Parallax';
import SiteImage from '@/components/ui/SiteImage';
import {CASES} from '@/lib/site';

const CARDS = [
  {...CASES[0], tags: 'w1_tags', d: 'w1_d'},
  {...CASES[1], tags: 'w2_tags', d: 'w2_d'},
] as const;

export default function SelectedWork() {
  const h = useTranslations('home');

  return (
    <section className="border-b border-border">
      <Container className="py-24">
        <Reveal>
          <div className="flex items-center justify-between gap-6">
            <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-muted-2">
              {h('work_label')}
            </p>
            <ArrowLink href="/work" label={h('work_link')} />
          </div>
        </Reveal>

        <div className="mt-12 grid gap-10 [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
          {CARDS.map((card, i) => (
            <Reveal key={card.domain} index={i}>
              <a
                href={card.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block transition-transform duration-300 hover:-translate-y-1.5"
              >
                <Parallax speed={0.08} className="aspect-[16/10] rounded-[14px]">
                  <SiteImage
                    src={card.image}
                    alt={`${card.domain} — website`}
                    label={card.domain}
                  />
                </Parallax>
                <div className="mt-5 flex items-start justify-between gap-4">
                  <span
                    dir="ltr"
                    className="font-display text-2xl font-semibold transition-colors group-hover:text-amber"
                  >
                    {card.domain}{' '}
                    <span className="text-muted-2 transition-colors group-hover:text-amber">
                      ↗
                    </span>
                  </span>
                  <span className="mt-1 font-mono text-xs text-faint">
                    {h(card.tags)}
                  </span>
                </div>
                <p className="mt-2 text-[15px] text-muted">{h(card.d)}</p>
              </a>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
