'use client';

import {motion, useReducedMotion} from 'motion/react';
import {EASE} from '@/lib/motion';

type Tag = 'h1' | 'h2' | 'h3' | 'span' | 'p';

// Headline word-reveal: each word rises from translateY(120%) inside an
// overflow-hidden mask, staggered. Full text is exposed to AT via aria-label;
// the visual word-spans are aria-hidden. Reduced motion → instant (no rise).
// initial is identical on server and client (no hydration mismatch); the
// animation completes to visible on hydration, so no content stays hidden.
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
  const reduced = useReducedMotion();
  const words = text.split(/\s+/).filter(Boolean);
  const Wrapper = TagName as Tag;

  return (
    <Wrapper className={className} aria-label={text}>
      {words.map((word, i) => (
        <span
          key={i}
          aria-hidden
          className="inline-block overflow-hidden align-top"
          style={{paddingBottom: '0.12em', marginBottom: '-0.12em'}}
        >
          <motion.span
            className="inline-block"
            initial={{y: '120%'}}
            animate={{y: 0}}
            transition={
              reduced
                ? {duration: 0}
                : {duration: 0.95, ease: EASE, delay: (delayBase + i * stagger) / 1000}
            }
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </Wrapper>
  );
}
