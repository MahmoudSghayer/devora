'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {logoutAction} from '@/lib/admin/actions';
import type {AdminUser} from '@/lib/admin/auth';

const NAV = [
  {href: '/admin', label: 'Overview'},
  {href: '/admin/conversations', label: 'Conversations'},
  {href: '/admin/leads', label: 'Leads'},
  {href: '/admin/support', label: 'Support'},
  {href: '/admin/knowledge', label: 'Knowledge'},
  {href: '/admin/settings', label: 'Settings'},
];

export default function AdminNav({admin}: {admin: AdminUser}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-e border-border-sub bg-bg-alt">
      <div className="border-b border-border-sub px-5 py-4">
        <p className="text-[15px] font-bold text-ink">
          devora<span className="text-amber"> admin</span>
        </p>
        <p className="mt-0.5 truncate text-[12px] text-muted">
          {admin.displayName || admin.email}
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {NAV.map((item) => {
          const active =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-[10px] px-3 py-2 text-[14px] transition-colors ${
                active
                  ? 'bg-surface-2 text-ink'
                  : 'text-muted hover:bg-surface hover:text-ink'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <form action={logoutAction} className="border-t border-border-sub p-3">
        <button
          type="submit"
          className="w-full rounded-[10px] px-3 py-2 text-start text-[14px] text-muted transition-colors hover:bg-surface hover:text-ink"
        >
          Sign out
        </button>
      </form>
    </aside>
  );
}
