import type {ReactNode} from 'react';
import type {Metadata} from 'next';
import {spaceGrotesk, spaceMono} from '@/lib/fonts';
import {getAdminUser} from '@/lib/admin/auth';
import AdminNav from '@/components/admin/AdminNav';

// The admin app is unlocalized (English, LTR) and owns its own <html>/<body>
// (the root layout is a pass-through). proxy.ts gates access; this layout adds
// defense-in-depth chrome: the nav only renders for an authenticated admin, so
// the /login page (reached when unauthenticated) is shown bare.
export const metadata: Metadata = {
  title: 'devora admin',
  robots: {index: false, follow: false},
};

export default async function AdminLayout({children}: {children: ReactNode}) {
  const admin = await getAdminUser();

  return (
    <html
      lang="en"
      dir="ltr"
      className={`${spaceGrotesk.variable} ${spaceMono.variable}`}
    >
      <body className="min-h-dvh bg-bg font-display text-ink antialiased">
        {admin ? (
          <div className="flex min-h-dvh">
            <AdminNav admin={admin} />
            <main className="flex-1 overflow-x-hidden">{children}</main>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
