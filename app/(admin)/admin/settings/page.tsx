import {redirect} from 'next/navigation';
import {getAdminUser} from '@/lib/admin/auth';
import {getSettings} from '@/lib/admin/queries';
import OnlineToggle from '@/components/admin/OnlineToggle';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const admin = await getAdminUser();
  if (!admin) redirect('/admin/login');
  const settings = await getSettings();

  return (
    <div className="p-6 lg:p-8">
      <h1 className="mb-4 text-[20px] font-bold">Settings</h1>
      <div className="max-w-2xl">
        <OnlineToggle initial={settings.representative_online} />
      </div>
    </div>
  );
}
