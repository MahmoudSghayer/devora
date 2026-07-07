import {NextResponse} from 'next/server';
import {getAdminUser} from '@/lib/admin/auth';
import {listLeads} from '@/lib/admin/queries';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ok: false, error: 'unauthorized'}, {status: 401});
  }
  const status = new URL(request.url).searchParams.get('status') ?? undefined;
  const leads = await listLeads(status);
  return NextResponse.json({ok: true, leads});
}
