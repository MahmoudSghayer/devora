import {NextResponse} from 'next/server';
import {z} from 'zod';
import {getAdminUser} from '@/lib/admin/auth';
import {listKb, upsertKbDoc} from '@/lib/admin/queries';
import {invalidateKbCache} from '@/lib/chat/kb';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ok: false, error: 'unauthorized'}, {status: 401});
  }
  const locale = new URL(request.url).searchParams.get('locale') ?? undefined;
  const docs = await listKb(locale);
  return NextResponse.json({ok: true, docs});
}

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  locale: z.enum(['en', 'ar']),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(8000),
  is_active: z.boolean().optional(),
});

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ok: false, error: 'unauthorized'}, {status: 401});
  }
  const parsed = upsertSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ok: false, error: 'validation'}, {status: 422});
  }
  const id = await upsertKbDoc({
    id: parsed.data.id,
    locale: parsed.data.locale,
    title: parsed.data.title,
    body: parsed.data.body,
    is_active: parsed.data.is_active,
    updatedBy: admin.id,
  });
  invalidateKbCache();
  return NextResponse.json({ok: true, id});
}
