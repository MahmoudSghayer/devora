import {NextResponse} from 'next/server';
import {getAdminUser} from '@/lib/admin/auth';
import {listConversations} from '@/lib/admin/queries';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ok: false, error: 'unauthorized'}, {status: 401});
  }
  const url = new URL(request.url);
  const conversations = await listConversations({
    status: url.searchParams.get('status') ?? undefined,
    q: url.searchParams.get('q') ?? undefined,
  });
  return NextResponse.json({ok: true, conversations});
}
