import {Link} from '@/i18n/navigation';
import DevoraMark from './DevoraMark';

// Nav lockup: devora mark + wordmark, links home. Stays LTR in RTL (brand name).
export default function Logo({className = ''}: {className?: string}) {
  return (
    <Link
      href="/"
      dir="ltr"
      aria-label="devora.design — home"
      className={`inline-flex items-center gap-[10px] ${className}`}
    >
      <DevoraMark size={30} />
      <span className="font-display text-[19px] font-bold leading-none tracking-[-0.01em]">
        <span className="text-ink">devora</span>
        <span className="text-amber">.</span>
        <span className="font-normal text-muted-2">design</span>
      </span>
    </Link>
  );
}
