import {createNavigation} from 'next-intl/navigation';
import {routing} from './routing';

// Locale-aware wrappers — <Link>, useRouter, usePathname keep the active
// locale in the URL. The language toggle uses useRouter().replace(pathname,
// {locale}) to switch locale while staying on the same page.
export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);
