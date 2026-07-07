import {NextResponse} from 'next/server';
import {getAdminUser} from '@/lib/admin/auth';
import {listSupport} from '@/lib/admin/queries';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ok: false, error: 'unauthorized'}, {status: 401});
  }
  const status = new URL(request.url).searchParams.get('status') ?? undefined;
  const requests = await listSupport(status);
  return NextResponse.json({ok: true, requests});
}
