import {NextResponse} from 'next/server';
import {getAdminUser} from '@/lib/admin/auth';
import {seedKbFromSource} from '@/lib/chat/kb';

export const runtime = 'nodejs';

// Imports the site's own content (messages/*.json + lib/site.ts) into editable
// kb_documents rows. Idempotent.
export async function POST() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ok: false, error: 'unauthorized'}, {status: 401});
  }
  const count = await seedKbFromSource();
  return NextResponse.json({ok: true, count});
}
