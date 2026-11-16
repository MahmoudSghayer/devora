import {Space_Grotesk, Space_Mono} from 'next/font/google';

// Latin display + body.
// Variable font (300–700): lets KineticHeadline animate weight smoothly.
export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

// Latin mono — labels, numbers, tags, marquee.
export const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

// Arabic (Cairo) is self-hosted: see @font-face in app/globals.css and the
// AR-only preload in app/[locale]/layout.tsx.
