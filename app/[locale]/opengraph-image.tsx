import {ImageResponse} from 'next/og';

// Image metadata
export const size = {width: 1200, height: 630};
export const contentType = 'image/png';
export const alt = 'devora.design — full-stack web studio';

const BG = '#0f0f0f';
const INK = '#f2f2ef';
const MUTED = '#8f8f8a';
const AMBER = '#f4c542';

// devora "< • >" mark (dev brackets + aura dot) as a data URI for Satori.
const MARK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none"><g stroke="#f4c542" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"><path d="M214 156 L150 256 L214 356"/><path d="M298 156 L362 256 L298 356"/></g><circle cx="256" cy="256" r="40" fill="#ffce4d"/></svg>';

const taglines: Record<string, string> = {
  en: 'dev + aura — full-stack web studio',
  ar: 'استوديو ويب متكامل — dev + aura',
};

// Shared generator so twitter-image can re-use the exact same artwork.
// No external font fetch — uses the default ImageResponse font (build-safe).
export async function ogImage(locale: string) {
  const isAr = locale === 'ar';
  const tagline = taglines[locale] ?? taglines.en;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: BG,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* devora mark */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          width={112}
          height={112}
          alt=""
          src={'data:image/svg+xml,' + encodeURIComponent(MARK)}
          style={{marginBottom: 48}}
        />

        {/* wordmark: devora . design */}
        <div style={{display: 'flex', fontSize: 120, fontWeight: 700}}>
          <span style={{color: INK}}>devora</span>
          <span style={{color: AMBER}}>.</span>
          <span style={{color: MUTED}}>design</span>
        </div>

        {/* localized tagline */}
        <div
          style={{
            display: 'flex',
            marginTop: 32,
            fontSize: 40,
            color: MUTED,
            direction: isAr ? 'rtl' : 'ltr',
          }}
        >
          {tagline}
        </div>
      </div>
    ),
    {...size},
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  return ogImage(locale);
}
