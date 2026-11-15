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

  // One font request: Cairo covers both Arabic and Latin.
  const cairo = await loadOgFont('Cairo', {});
  const fonts: OgFont[] = cairo ? [cairo] : [];
  const family = cairo ? 'Cairo' : 'sans-serif';

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
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            display: 'flex',
            background: `radial-gradient(circle at 600px 250px, ${C.amberGlow} 0%, ${C.amberGlowFaint} 320px, transparent 600px)`,
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

        <Mark size={230} />

        <div
          style={{
            display: 'flex',
            marginTop: -34,
            fontSize: 96,
            lineHeight: 1.1,
            fontWeight: 700,
            color: C.ink,
            fontFamily: family,
            direction: 'ltr',
          }}
        >
          <span>{SITE.name}</span>
          <span style={{color: C.amber}}>.</span>
        </div>

        {/* Satori lays text out left-to-right word by word, so Arabic is set as
            a row-reverse flex row of whole words (Satori ignores `direction`) (each word still shapes
            correctly; letters are never split). */}
        <div
          style={{
            display: 'flex',
            flexDirection: isAr ? 'row-reverse' : 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginTop: 14,
            width: 1060,
            fontSize: isAr ? 36 : 32,
            lineHeight: 1.4,
            fontWeight: 700,
            color: C.muted,
            fontFamily: family,
            direction: isAr ? 'rtl' : 'ltr',
          }}
        >
          {line.split(' ').map((word, i) => (
            <span key={i} style={{display: 'flex', margin: '0 7px'}}>
              {word}
            </span>
          ))}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 56,
            display: 'flex',
            fontSize: 26,
            color: C.amber,
            fontFamily: family,
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
