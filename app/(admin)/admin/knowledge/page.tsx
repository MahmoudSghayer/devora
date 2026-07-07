import {redirect} from 'next/navigation';
import {getAdminUser} from '@/lib/admin/auth';
import KnowledgeClient from '@/components/admin/KnowledgeClient';

export const dynamic = 'force-dynamic';

export default async function KnowledgePage() {
  const admin = await getAdminUser();
  if (!admin) redirect('/admin/login');
  return <KnowledgeClient />;
}
