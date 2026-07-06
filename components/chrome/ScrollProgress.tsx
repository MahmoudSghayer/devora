'use client';

import {motion, useScroll, useTransform} from 'motion/react';

// Reading-progress bar. Anchored to the inline-start edge (start-0) so it fills
// left→right in EN and right→left in AR. Width, not scaleX, so it's RTL-correct
// without a transform-origin branch.
export default function ScrollProgress() {
  const {scrollYProgress} = useScroll();
  const width = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  return (
    <motion.div
      style={{width}}
      className="fixed start-0 top-0 z-[100] h-[3px] bg-amber"
    />
  );
}
