import {ImageResponse} from 'next/og';
import {getTranslations} from 'next-intl/server';
import {SITE} from '@/lib/site';
import {OG_PALETTE as C} from './og-palette';
import {loadOgFont, type OgFont} from './og-fonts';

export const OG_SIZE = {width: 1200, height: 630};
export const OG_CONTENT_TYPE = 'image/png';

const ALT: Record<'en' | 'ar', string> = {
  en: 'devora — websites, automation & custom software',
  ar: 'devora — مواقع وأتمتة وبرمجيات مخصصة',
};
const FALLBACK_TAG: Record<'en' | 'ar', string> = {
  en: 'Websites, automation & custom software that grow your business.',
  ar: 'مواقع وأتمتة وبرمجيات مخصصة تُنمّي أعمالك.',
};

// Route-segment `alt` must be a static export, so both languages share one string.
export const OG_ALT = `${ALT.en} · ${ALT.ar}`;

async function tagline(locale: 'en' | 'ar'): Promise<string> {
  try {
    const t = await getTranslations({locale, namespace: 'common'});
    return t('footer_tag');
  } catch {
    return FALLBACK_TAG[locale];
  }
}

// DevoraMark `< • >` from simple shapes (two chevrons + a dot).
function Mark({size}: {size: number}) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none">
      <path
        d="M214 156 L150 256 L214 356"
        stroke={C.amber}
        strokeWidth={46}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M298 156 L362 256 L298 356"
        stroke={C.amber}
        strokeWidth={46}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={256} cy={256} r={40} fill={C.amberHi} />
    </svg>
  );
}

export async function renderOgImage(rawLocale: string) {
  const locale: 'en' | 'ar' = rawLocale === 'ar' ? 'ar' : 'en';
  const isAr = locale === 'ar';
  const line = await tagline(locale);

  const [latin, arabic] = await Promise.all([
    loadOgFont('Space Grotesk', {text: `${SITE.name}${SITE.domain}${isAr ? '' : line}`}),
    isAr ? loadOgFont('Cairo', {}) : Promise.resolve(null),
  ]);
  const fonts: OgFont[] = [latin, arabic].filter((f): f is OgFont => f !== null);
  const bodyFamily = isAr && arabic ? 'Cairo' : latin ? 'Space Grotesk' : 'sans-serif';
  const brandFamily = latin ? 'Space Grotesk' : 'sans-serif';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: C.bg,
        }}
      >
        {/* aura */}
        <div
          style={{
            position: 'absolute',
            top: -180,
            left: 100,
            width: 1000,
            height: 760,
            display: 'flex',
            background: `radial-gradient(ellipse at center, ${C.amberGlow} 0%, ${C.amberGlowFaint} 45%, transparent 70%)`,
          }}
        />
        {/* hairline frame */}
        <div
          style={{
            position: 'absolute',
            top: 28,
            left: 28,
            right: 28,
            bottom: 28,
            display: 'flex',
            border: `1px solid ${C.borderCard}`,
            borderRadius: 28,
          }}
        />

        <Mark size={132} />

        <div
          style={{
            display: 'flex',
            marginTop: 28,
            fontSize: 104,
            fontWeight: 700,
            color: C.ink,
            fontFamily: brandFamily,
            direction: 'ltr',
          }}
        >
          <span>{SITE.name}</span>
          <span style={{color: C.amber}}>.</span>
        </div>

        <div
          style={{
            display: 'block',
            marginTop: 22,
            width: 980,
            textAlign: 'center',
            fontSize: isAr ? 38 : 40,
            lineHeight: 1.4,
            fontWeight: 700,
            color: C.muted,
            fontFamily: bodyFamily,
            direction: isAr ? 'rtl' : 'ltr',
          }}
        >
          {line}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 50,
            display: 'flex',
            fontSize: 26,
            color: C.amber,
            fontFamily: brandFamily,
            direction: 'ltr',
          }}
        >
          {SITE.domain}
        </div>
      </div>
    ),
    {...OG_SIZE, fonts},
  );
}
