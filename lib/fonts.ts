import {Space_Grotesk, Space_Mono, IBM_Plex_Sans_Arabic} from 'next/font/google';

// Display + body. Arabic glyphs resolve through the font stack fallback
// (see --font-display in globals.css), so no runtime font switching.
export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

// Labels, numbers, tags, marquee.
export const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

// Arabic glyph fallback. The 'arabic' subset is required — the default latin
// subset omits Arabic glyphs entirely.
export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-arabic',
  display: 'swap',
});
