import {NextResponse} from 'next/server';
import {getAdminUser} from '@/lib/admin/auth';
import {listLeads} from '@/lib/admin/queries';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ok: false, error: 'unauthorized'}, {status: 401});
  }
  const sp = new URL(request.url).searchParams;
  try {
    const leads = await listLeads({
      status: sp.get('status') ?? undefined,
      source: sp.get('source') ?? undefined,
      q: sp.get('q') ?? undefined,
    });
    return NextResponse.json({ok: true, leads});
  } catch (err) {
    console.error('[admin/leads] list failed:', err);
    return NextResponse.json({ok: false, error: 'query_failed'}, {status: 500});
  }
}
