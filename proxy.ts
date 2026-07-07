import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next internals, root metadata routes (icon/apple-icon —
  // extensionless, so they'd otherwise be locale-redirected), and anything
  // with a file extension (sitemap.xml, robots.txt, images, etc.).
  matcher: '/((?!api|_next|_vercel|icon|apple-icon|.*\\..*).*)',
};
