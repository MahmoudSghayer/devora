import createMiddleware from 'next-intl/middleware';
import {NextResponse, type NextRequest} from 'next/server';
import {routing} from './i18n/routing';
import {updateAdminSession} from './lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

// Next.js 16 middleware (this file replaces middleware.ts). Two paths:
//  • /admin/*  → refresh the Supabase session, gate on active-admin, and DO NOT
//    run next-intl (the admin app is unlocalized). Unauthed users go to /login.
//  • everything else → the existing next-intl locale middleware.
export default async function proxy(request: NextRequest) {
  const {pathname} = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const {response, isAdmin} = await updateAdminSession(request);
    const isLogin = pathname === '/admin/login';

    if (!isAdmin && !isLogin) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
    if (isAdmin && isLogin) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
    return response;
  }

  return intlMiddleware(request);
}

export const config = {
  // Skip API routes (they self-check auth), Next internals, root metadata routes
  // (icon/apple-icon — extensionless), and anything with a file extension.
  // /admin IS matched (not excluded) so the branch above runs.
  matcher: '/((?!api|_next|_vercel|icon|apple-icon|.*\\..*).*)',
};
