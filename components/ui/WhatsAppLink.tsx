import {useLocale, useTranslations} from 'next-intl';
import {WHATSAPP_DISPLAY, whatsappUrl} from '@/lib/site';

// WhatsApp deep link with a localized prefilled message. Opens in a new tab.
// The number is always rendered LTR (it sits inside RTL Arabic text).
export default function WhatsAppLink({
  className = '',
  showNumber = true,
  message,
  prompt = false,
}: {
  className?: string;
  showNumber?: boolean;
  message?: string;
  /** show the "Prefer to talk now?" lead-in above the link */
  prompt?: boolean;
}) {
  const t = useTranslations('common');
  const locale = useLocale();
  const link = (
    <a
      href={whatsappUrl(locale, message)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-11 w-fit items-center gap-2 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.7-5.4A8.4 8.4 0 1 1 21 11.5Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{t('whatsapp_cta')}</span>
      {showNumber && (
        <span dir="ltr" className="num text-muted-2">
          {WHATSAPP_DISPLAY}
        </span>
      )}
      <span className="sr-only">{t('opens_new_tab')}</span>
    </a>
  );
  if (!prompt) return link;
  return (
    <div className="flex flex-col">
      <p className="text-sm font-semibold text-ink-2">{t('whatsapp_prefer')}</p>
      {link}
    </div>
  );
}
