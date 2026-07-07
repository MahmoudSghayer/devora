import {redirect} from 'next/navigation';
import {getAdminUser} from '@/lib/admin/auth';
import LeadsClient from '@/components/admin/LeadsClient';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const admin = await getAdminUser();
  if (!admin) redirect('/admin/login');
  return <LeadsClient />;
}
