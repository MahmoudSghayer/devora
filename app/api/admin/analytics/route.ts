import {NextResponse} from 'next/server';
import {getAdminUser} from '@/lib/admin/auth';
import {getAnalytics} from '@/lib/admin/queries';

export const runtime = 'nodejs';

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ok: false, error: 'unauthorized'}, {status: 401});
  }
  const analytics = await getAnalytics();
  return NextResponse.json({ok: true, ...analytics});
}
