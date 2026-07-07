import {Space_Grotesk, Space_Mono, Cairo} from 'next/font/google';

// Latin display + body.
export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
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

// Arabic display + body. Cairo is a modern geometric Arabic face that pairs
// with Space Grotesk and (as a variable font) covers the 400–700 weights the
// design uses. It renders every Arabic glyph via the font-stack fallback in
// globals.css; Latin brand names stay in Space Grotesk. The 'arabic' subset is
// required — the latin subset omits Arabic glyphs.
export const arabic = Cairo({
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
});
