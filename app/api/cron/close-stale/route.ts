import {NextResponse} from 'next/server';
import {closeStaleConversations} from '@/lib/admin/queries';
import {getAdminUser} from '@/lib/admin/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Scheduled by Vercel Cron (see vercel.json). Vercel sends
// `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set. If CRON_SECRET
// is set we require it (or a logged-in admin for manual runs); if it's unset we
// allow the call — the action is idempotent and low-risk (a new message
// re-activates a closed conversation).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const validSecret =
    !!secret && request.headers.get('authorization') === `Bearer ${secret}`;

  if (secret && !validSecret) {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ok: false, error: 'unauthorized'}, {status: 401});
    }
  }

  const minutes = Number(process.env.AUTO_CLOSE_MINUTES || 15);
  const closed = await closeStaleConversations(minutes);
  return NextResponse.json({ok: true, closed, minutes});
}
