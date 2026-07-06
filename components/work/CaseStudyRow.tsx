import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import Reveal from '@/components/motion/Reveal';
import Parallax from '@/components/motion/Parallax';
import SiteImage from '@/components/ui/SiteImage';
import {CASES} from '@/lib/site';

// Alternating case-study row. `reverse` flips BOTH the column ratio
// (7fr/5fr ↔ 5fr/7fr) and the DOM order (image-first ↔ meta-first), exactly
// like the prototype. RTL mirroring is left to dir=rtl — no manual override.
export default function CaseStudyRow({
  index,
  reverse,
}: {
  index: number;
  reverse: boolean;
}) {
  const w = useTranslations('work');
  const data = CASES[index];
  const num = index === 0 ? '01' : '02';
  const tagsKey = index === 0 ? 'c1_tags' : 'c2_tags';
  const descKey = index === 0 ? 'c1_d' : 'c2_d';

  const image = (
    <Parallax speed={0.08} className="aspect-[4/3] rounded-[16px]">
      <SiteImage
        src={data.image}
        alt={`${data.domain} — website`}
        label={data.domain}
      />
    </Parallax>
  );

  const meta = (
    <div>
      <span className="font-mono text-sm text-amber">{num}</span>
      <h2
        dir="ltr"
        className="mt-4 font-display text-case font-semibold tracking-[-0.02em]"
      >
        {data.domain}
      </h2>
      <p className="mt-3 font-mono text-xs text-faint">{w(tagsKey)}</p>
      <p className="mt-5 max-w-[520px] text-base leading-[1.7] text-muted">
        {w(descKey)}
      </p>
      <a
        href={data.href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex items-center gap-2 rounded-pill border border-border-amber px-6 py-3 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber hover:text-amber"
      >
        {w('visit')} <span dir="ltr">↗</span>
      </a>
    </div>
  );

  return (
    <Container className="border-b border-border py-24">
      <div
        className={`grid items-center gap-14 ${
          reverse ? 'nav:grid-cols-[5fr_7fr]' : 'nav:grid-cols-[7fr_5fr]'
        }`}
      >
        {reverse ? (
          <>
            <Reveal>{meta}</Reveal>
            <Reveal index={1}>{image}</Reveal>
          </>
        ) : (
          <>
            <Reveal>{image}</Reveal>
            <Reveal index={1}>{meta}</Reveal>
          </>
        )}
      </div>
    </Container>
  );
}
