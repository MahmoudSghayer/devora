import {NextResponse} from 'next/server';
import {z} from 'zod';
import {getAdminUser} from '@/lib/admin/auth';
import {getConversationDetail, setConversationStatus} from '@/lib/admin/queries';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  {params}: {params: Promise<{id: string}>}
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ok: false, error: 'unauthorized'}, {status: 401});
  }
  const {id} = await params;
  const detail = await getConversationDetail(id);
  if (!detail) {
    return NextResponse.json({ok: false, error: 'not_found'}, {status: 404});
  }
  return NextResponse.json({ok: true, ...detail});
}

const patchSchema = z.object({status: z.enum(['active', 'idle', 'closed'])});

export async function PATCH(
  request: Request,
  {params}: {params: Promise<{id: string}>}
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ok: false, error: 'unauthorized'}, {status: 401});
  }
  const {id} = await params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ok: false, error: 'validation'}, {status: 422});
  }
  await setConversationStatus(id, parsed.data.status);
  return NextResponse.json({ok: true});
}
