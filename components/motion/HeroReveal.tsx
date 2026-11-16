import type {ReactNode} from 'react';

// Hero entrance: fade up 26px on first paint, staggered by explicit index
// (100 + index*110 ms). CSS-only (see .hero-rise in globals.css) so it needs no
// hydration and never delays LCP; reduced motion → no animation.
export default function HeroReveal({
  children,
  index = 0,
  className,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <div
      className={className ? `hero-rise ${className}` : 'hero-rise'}
      style={{animationDelay: `${100 + index * 110}ms`}}
    >
      {children}
    </div>
  );
}
