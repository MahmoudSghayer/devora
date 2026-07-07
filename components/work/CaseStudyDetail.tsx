import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import Reveal from '@/components/motion/Reveal';
import Parallax from '@/components/motion/Parallax';
import SiteImage from '@/components/ui/SiteImage';
import ArrowLink from '@/components/ui/ArrowLink';
import type {CaseStudy} from '@/lib/site';

// Case-study detail. The bilingual narrative lives in lib/site.ts (typed,
// no runtime translation lookups) so it stays with the case data.
export default function CaseStudyDetail({
  data,
  locale,
}: {
  data: CaseStudy;
  locale: string;
}) {
  const w = useTranslations('work');
  const copy = locale === 'ar' ? data.ar : data.en;

  const blocks = [
    {label: w('detail_challenge'), body: copy.challenge},
    {label: w('detail_approach'), body: copy.approach},
    {label: w('detail_outcome'), body: copy.outcome},
  ];

  return (
    <>
      <section className="border-b border-border">
        <Container className="pb-16 pt-[110px]">
          <Reveal>
            <ArrowLink href="/work" label={w('detail_back')} />
          </Reveal>
          <Reveal index={1}>
            <h1
              dir="ltr"
              className="u-track mt-6 font-display text-h1-sub font-bold leading-[1.02] tracking-[-0.03em]"
            >
              {data.domain}
            </h1>
          </Reveal>
          <Reveal index={2}>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                {w('detail_disc')}
              </span>
              <span className="rounded-pill border border-border-chip px-4 py-[9px] font-mono text-xs text-ink-2">
                {copy.industry}
              </span>
              <span className="font-mono text-xs text-faint">{copy.tags}</span>
            </div>
            <p className="u-mono mt-8 font-mono text-xs uppercase tracking-[0.22em] text-muted-2">
              {w('detail_overview')}
            </p>
            <p className="mt-3 max-w-[620px] text-[19px] leading-[1.65] text-muted">
              {copy.summary}
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="border-b border-border">
        <Container className="py-16">
          <Reveal>
            <Parallax speed={0.06} className="aspect-[16/9] rounded-[16px]">
              <SiteImage
                src={data.image}
                alt={`${data.domain} — website`}
                label={data.domain}
              />
            </Parallax>
          </Reveal>
        </Container>
      </section>

      <section className="border-b border-border">
        <Container className="grid gap-10 py-24 nav:grid-cols-3 nav:gap-14">
          {blocks.map((b, i) => (
            <Reveal key={b.label} index={i}>
              <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-amber">
                {b.label}
              </p>
              <p className="mt-4 text-[16px] leading-[1.7] text-ink-2">
                {b.body}
              </p>
            </Reveal>
          ))}
        </Container>
      </section>

      <section>
        <Container className="flex flex-wrap items-center gap-4 py-16">
          <a
            href={data.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-pill bg-amber px-8 py-4 text-sm font-semibold text-on-amber transition-colors hover:bg-amber-hi"
          >
            {w('visit')} <span dir="ltr">↗</span>
          </a>
          <ArrowLink href="/work" label={w('detail_next')} />
        </Container>
      </section>
    </>
  );
}
