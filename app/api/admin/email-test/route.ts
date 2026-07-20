import {NextResponse} from 'next/server';
import {getAdminUser} from '@/lib/admin/auth';
import {sendMail, isEmailConfigured} from '@/lib/email/send';

export const runtime = 'nodejs';

// Admin-only email diagnostic: attempts a real SMTP send to CONTACT_TO and
// returns the exact result — delivered:true (check inbox/spam) or the precise
// SMTP error (auth / host / connection). Far easier than reading Vercel logs.
export async function POST() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ok: false, error: 'unauthorized'}, {status: 401});
  }

  const host = process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com';
  const port = Number(process.env.ZOHO_SMTP_PORT || 465);
  const to = process.env.CONTACT_TO || process.env.ZOHO_SMTP_USER || null;

  if (!isEmailConfigured()) {
    return NextResponse.json({
      ok: false,
      error: 'not_configured',
      detail: 'ZOHO_SMTP_USER / ZOHO_SMTP_PASS / CONTACT_TO are not all set.',
      host,
      port,
      to,
    });
  }

  try {
    const {delivered} = await sendMail({
      subject: 'devora email test ✅',
      text: `Test message from the devora admin dashboard.\nIf you received this, Zoho SMTP is working.\nSent by: ${admin.email ?? admin.id}`,
      replyTo: admin.email ?? undefined,
    });
    return NextResponse.json({ok: true, delivered, to, host, port});
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: 'send_failed',
      detail: err instanceof Error ? err.message : String(err),
      host,
      port,
      to,
    });
  }
}
