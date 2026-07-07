import {redirect} from 'next/navigation';
import {getAdminUser} from '@/lib/admin/auth';
import {getSettings} from '@/lib/admin/queries';
import OnlineToggle from '@/components/admin/OnlineToggle';
import EmailTest from '@/components/admin/EmailTest';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const admin = await getAdminUser();
  if (!admin) redirect('/admin/login');
  const settings = await getSettings();

  return (
    <div className="p-6 lg:p-8">
      <h1 className="mb-4 text-[20px] font-bold">Settings</h1>
      <div className="flex max-w-2xl flex-col gap-4">
        <OnlineToggle initial={settings.representative_online} />
        <EmailTest />
      </div>
    </div>
  );
}
