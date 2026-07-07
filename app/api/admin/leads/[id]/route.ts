import {NextResponse} from 'next/server';
import {z} from 'zod';
import {getAdminUser} from '@/lib/admin/auth';
import {updateLeadStatus} from '@/lib/admin/queries';

export const runtime = 'nodejs';

const schema = z.object({
  status: z.enum(['new', 'qualified', 'contacted', 'won', 'lost']),
});

export async function PATCH(
  request: Request,
  {params}: {params: Promise<{id: string}>}
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ok: false, error: 'unauthorized'}, {status: 401});
  }
  const {id} = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ok: false, error: 'validation'}, {status: 422});
  }
  await updateLeadStatus(id, parsed.data.status);
  return NextResponse.json({ok: true});
}
