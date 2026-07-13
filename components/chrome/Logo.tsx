import {Link} from '@/i18n/navigation';
import DevoraMark from './DevoraMark';

// Nav lockup: DEVORA OS wordmark — mark + "DEVORA" + a mono "dev + aura"
// tagline, echoing the homepage HUD. Links home. Stays LTR in RTL (brand name).
export default function Logo({className = ''}: {className?: string}) {
  return (
    <Link
      href="/"
      dir="ltr"
      aria-label="devora — home"
      className={`inline-flex items-center gap-[10px] ${className}`}
    >
      <DevoraMark size={26} />
      <span className="font-display text-[19px] font-semibold leading-none tracking-[0.2em] text-ink">
        DEVORA
      </span>
      <span className="hidden font-mono text-[9px] lowercase leading-none tracking-[0.28em] text-faint nav:inline">
        dev + aura
      </span>
    </Link>
  );
}
