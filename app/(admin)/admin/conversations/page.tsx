import {redirect} from 'next/navigation';
import {getAdminUser} from '@/lib/admin/auth';
import ConversationsClient from '@/components/admin/ConversationsClient';

export const dynamic = 'force-dynamic';

export default async function ConversationsPage() {
  const admin = await getAdminUser();
  if (!admin) redirect('/admin/login');
  return <ConversationsClient />;
}
