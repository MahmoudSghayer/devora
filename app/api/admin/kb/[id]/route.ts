import {NextResponse} from 'next/server';
import {getAdminUser} from '@/lib/admin/auth';
import {deleteKbDoc} from '@/lib/admin/queries';
import {invalidateKbCache} from '@/lib/chat/kb';

export const runtime = 'nodejs';

export async function DELETE(
  _request: Request,
  {params}: {params: Promise<{id: string}>}
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ok: false, error: 'unauthorized'}, {status: 401});
  }
  const {id} = await params;
  await deleteKbDoc(id);
  invalidateKbCache();
  return NextResponse.json({ok: true});
}
