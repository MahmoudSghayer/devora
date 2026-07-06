import {useTranslations} from 'next-intl';

// Infinite leftward keyword loop (22s). Stays LTR in RTL (keywords + brand
// tone). Two identical copies + translateX(-50%) make the loop seamless.
// The animation only runs when motion is allowed (see globals.css gate).
export default function Marquee() {
  const t = useTranslations('common');
  const text = t('marquee');
  return (
    <div
      dir="ltr"
      aria-hidden
      className="overflow-hidden border-y border-border bg-bg-alt py-4"
    >
      <div className="flex w-max animate-marquee">
        <span className="whitespace-nowrap font-mono text-[13px] tracking-[0.28em] text-faint">
          {text}&nbsp;
        </span>
        <span className="whitespace-nowrap font-mono text-[13px] tracking-[0.28em] text-faint">
          {text}&nbsp;
        </span>
      </div>
    </div>
  );
}
