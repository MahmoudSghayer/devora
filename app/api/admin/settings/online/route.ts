import {NextResponse} from 'next/server';
import {z} from 'zod';
import {getAdminUser} from '@/lib/admin/auth';
import {setOnline} from '@/lib/admin/queries';
import {broadcastPresence} from '@/lib/realtime/broadcast';

export const runtime = 'nodejs';

const schema = z.object({online: z.boolean()});

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ok: false, error: 'unauthorized'}, {status: 401});
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ok: false, error: 'validation'}, {status: 422});
  }
  await setOnline(parsed.data.online, admin.id);
  await broadcastPresence(parsed.data.online);
  return NextResponse.json({ok: true, online: parsed.data.online});
}
