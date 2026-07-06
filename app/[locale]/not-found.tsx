import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import Container from '@/components/ui/Container';

export default function NotFound() {
  const c = useTranslations('common');
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-mono text-sm tracking-[0.2em] text-amber">404</p>
      <h1 className="u-track mt-4 font-display text-h2 font-bold tracking-[-0.02em]">
        {c('nf_title')}
      </h1>
      <Link
        href="/"
        className="mt-8 rounded-pill bg-amber px-7 py-3 font-display font-semibold text-on-amber transition-colors hover:bg-amber-hi"
      >
        {c('nav_home')}
      </Link>
    </Container>
  );
}
