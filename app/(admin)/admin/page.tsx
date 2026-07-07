import {redirect} from 'next/navigation';
import {getAdminUser} from '@/lib/admin/auth';
import {dashboardStats, getAnalytics} from '@/lib/admin/queries';

export const dynamic = 'force-dynamic';

export default async function AdminOverview() {
  const admin = await getAdminUser();
  if (!admin) redirect('/admin/login');

  const stats = await dashboardStats();
  const analytics = await getAnalytics();
  const totalLangs = analytics.languageSplit.reduce((a, l) => a + l.count, 0) || 1;
  const cards = [
    {label: 'Conversations', value: stats.conversations},
    {label: 'Active now', value: stats.activeConversations},
    {label: 'Leads', value: stats.leads},
    {label: 'Open support', value: stats.openSupport},
  ];

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[20px] font-bold">Overview</h1>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] ${
            stats.online
              ? 'border-emerald-500/40 text-emerald-300'
              : 'border-border-card text-muted'
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${stats.online ? 'bg-emerald-400' : 'bg-amber'}`}
          />
          {stats.online ? 'Representative online' : 'AI mode · 24/7'}
        </span>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-[14px] border border-border-sub bg-surface p-5"
          >
            <p className="text-[28px] font-bold text-ink">{c.value}</p>
            <p className="mt-1 text-[13px] text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-[14px] border border-border-sub bg-surface p-5">
          <h2 className="mb-3 text-[15px] font-semibold">Languages</h2>
          {analytics.languageSplit.length === 0 ? (
            <p className="text-[13px] text-muted">No data yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {analytics.languageSplit.map((l) => (
                <div key={l.locale} className="flex items-center gap-3">
                  <span className="w-8 font-mono text-[12px] uppercase text-muted">
                    {l.locale}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-amber"
                      style={{width: `${Math.round((l.count / totalLangs) * 100)}%`}}
                    />
                  </div>
                  <span className="w-8 text-end text-[12px] text-muted">{l.count}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex gap-6 border-t border-border-sub pt-4 text-[13px]">
            <div>
              <p className="text-[20px] font-bold text-ink">
                {Math.round(analytics.takeoverRate * 100)}%
              </p>
              <p className="text-muted">Human takeover</p>
            </div>
            <div>
              <p className="text-[20px] font-bold text-ink">{analytics.totalMessages}</p>
              <p className="text-muted">Messages</p>
            </div>
          </div>
        </div>

        <div className="rounded-[14px] border border-border-sub bg-surface p-5">
          <h2 className="mb-3 text-[15px] font-semibold">Recent questions</h2>
          {analytics.recentQuestions.length === 0 ? (
            <p className="text-[13px] text-muted">No questions yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {analytics.recentQuestions.map((q, i) => (
                <li key={i} className="line-clamp-1 text-[13px] text-ink-2">
                  {q.content}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-[14px] border border-border-sub bg-surface p-5">
        <h2 className="text-[15px] font-semibold">Quick start</h2>
        <ul className="mt-3 flex flex-col gap-1.5 text-[13px] text-muted">
          <li>• Toggle the online representative in Settings to offer live human help.</li>
          <li>• Open Conversations to read threads, take over, and reply as a human.</li>
          <li>• Leads and Support requests from the assistant land in their tabs.</li>
        </ul>
      </div>
    </div>
  );
}
