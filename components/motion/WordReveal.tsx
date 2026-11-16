import {Fragment} from 'react';

type Tag = 'h1' | 'h2' | 'h3' | 'span' | 'p';

// Headline word-reveal: each word rises from translateY(120%) inside an
// overflow-hidden mask, staggered. Full text is exposed to AT via aria-label;
// the visual word-spans are aria-hidden. Reduced motion → instant (no rise).
// CSS-only (see .word-rise in globals.css): runs from first paint, no hydration
// needed, and ends visible.
export default function WordReveal({
  text,
  as: TagName = 'span',
  className,
  delayBase = 120,
  stagger = 65,
}: {
  text: string;
  as?: Tag;
  className?: string;
  delayBase?: number;
  stagger?: number;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  const Wrapper = TagName as Tag;

  return (
    <Wrapper className={className} aria-label={text}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span
            aria-hidden
            className="inline-block overflow-hidden align-top"
            style={{paddingBottom: '0.12em', marginBottom: '-0.12em'}}
          >
            <span className="word-rise inline-block" style={{animationDelay: `${delayBase + i * stagger}ms`}}>
              {word}
            </span>
          </span>
          {/* The separator lives outside the inline-block: trailing spaces inside one are collapsed away. */}
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Wrapper>
  );
}
