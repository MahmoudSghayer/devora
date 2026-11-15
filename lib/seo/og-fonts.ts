// Font loading for next/og images. Satori needs raw ttf/otf/woff bytes (not
// woff2), so we read the Google Fonts CSS with a legacy user agent (which makes
// Google answer with a `woff` source) and request only the glyphs we draw via
// `&text=`, keeping each download tiny. Results are cached per module; any
// failure resolves to null so the image still renders with the default font.

const LEGACY_UA =
  'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/11.0.696.65 Safari/534.24';

export type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 700;
  style: 'normal';
};

const cache = new Map<string, Promise<OgFont | null>>();

async function fetchFont(family: string, text: string): Promise<OgFont | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@700&text=${encodeURIComponent(text)}`,
      {headers: {'User-Agent': LEGACY_UA}},
    ).then((r) => (r.ok ? r.text() : ''));
    const url = css.match(/src:\s*url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/)?.[1];
    if (!url) return null;
    const res = await fetch(url);
    if (!res.ok) return null;
    return {name: family, data: await res.arrayBuffer(), weight: 700, style: 'normal'};
  } catch {
    return null;
  }
}

export function loadOgFont(family: 'Cairo' | 'Space Grotesk', text: string): Promise<OgFont | null> {
  const unique = Array.from(new Set(text)).join('');
  const key = `${family}:${unique}`;
  let hit = cache.get(key);
  if (!hit) {
    hit = fetchFont(family, unique).then((f) => {
      // Do not cache failures: allow a retry on the next request.
      if (!f) cache.delete(key);
      return f;
    });
    cache.set(key, hit);
  }
  return hit;
}
