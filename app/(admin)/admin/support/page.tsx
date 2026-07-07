import {redirect} from 'next/navigation';
import {getAdminUser} from '@/lib/admin/auth';
import SupportClient from '@/components/admin/SupportClient';

export const dynamic = 'force-dynamic';

export default async function SupportPage() {
  const admin = await getAdminUser();
  if (!admin) redirect('/admin/login');
  return <SupportClient />;
}
