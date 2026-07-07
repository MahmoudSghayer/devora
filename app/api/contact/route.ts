import {NextResponse} from 'next/server';
import nodemailer from 'nodemailer';
import {contactSchema} from '@/lib/validation';

// Contact endpoint — delivers submissions to a Zoho mailbox over SMTP.
// Requires ZOHO_SMTP_USER / ZOHO_SMTP_PASS (an app-specific password) and
// CONTACT_TO in the environment (see .env.example). If they're missing the
// route still validates and 200s (logging the payload) so local dev / previews
// don't fail — it just doesn't send.
export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ok: false, error: 'invalid_json'}, {status: 400});
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ok: false, error: 'validation'}, {status: 422});
  }
  const {name, email, company, budget, details} = parsed.data;

  const user = process.env.ZOHO_SMTP_USER;
  const pass = process.env.ZOHO_SMTP_PASS;
  const to = process.env.CONTACT_TO || user;

  if (!user || !pass || !to) {
    console.warn(
      '[contact] SMTP not configured (ZOHO_SMTP_USER/PASS/CONTACT_TO) — logging instead:',
      parsed.data
    );
    return NextResponse.json({ok: true, delivered: false});
  }

  const transporter = nodemailer.createTransport({
    host: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com',
    port: Number(process.env.ZOHO_SMTP_PORT || 465),
    secure: true, // 465 = implicit TLS
    auth: {user, pass},
  });

  try {
    await transporter.sendMail({
      from: `devora.design <${user}>`,
      to,
      replyTo: email,
      subject: `New project enquiry — ${name}`,
      text: [
        `Name:    ${name}`,
        `Email:   ${email}`,
        `Company: ${company || '—'}`,
        `Budget:  ${budget || '—'}`,
        '',
        details,
      ].join('\n'),
    });
    return NextResponse.json({ok: true, delivered: true});
  } catch (err) {
    console.error('[contact] send failed:', err);
    return NextResponse.json({ok: false, error: 'send_failed'}, {status: 502});
  }
}
