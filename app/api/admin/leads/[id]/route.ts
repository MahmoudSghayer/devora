import {NextResponse} from 'next/server';
import {getAdminUser} from '@/lib/admin/auth';
import {updateLeadStatus} from '@/lib/admin/queries';
import {leadIdSchema, leadStatusSchema} from '@/lib/validation';

export const runtime = 'nodejs';

export async function PATCH(
  request: Request,
  {params}: {params: Promise<{id: string}>}
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ok: false, error: 'unauthorized'}, {status: 401});
  }
  const {id} = await params;
  if (!leadIdSchema.safeParse(id).success) {
    return NextResponse.json({ok: false, error: 'invalid_id'}, {status: 400});
  }
  const parsed = leadStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ok: false, error: 'validation'}, {status: 422});
  }
  try {
    const found = await updateLeadStatus(id, parsed.data.status);
    if (!found) {
      return NextResponse.json({ok: false, error: 'not_found'}, {status: 404});
    }
  } catch (err) {
    console.error('[admin/leads] status update failed:', err);
    return NextResponse.json({ok: false, error: 'update_failed'}, {status: 500});
  }
  return NextResponse.json({ok: true});
}
