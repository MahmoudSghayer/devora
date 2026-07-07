import {NextResponse} from 'next/server';
import {contactSchema} from '@/lib/validation';
import {sendMail} from '@/lib/email/send';

// Contact endpoint — delivers the site's contact form to the Zoho mailbox via
// the shared sender (lib/email/send.ts). If SMTP env is missing, sendMail logs
// the payload and reports delivered:false so local dev / previews don't fail.
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

  try {
    const {delivered} = await sendMail({
      subject: `New project enquiry — ${name}`,
      replyTo: email,
      text: [
        `Name:    ${name}`,
        `Email:   ${email}`,
        `Company: ${company || '—'}`,
        `Budget:  ${budget || '—'}`,
        '',
        details,
      ].join('\n'),
    });
    return NextResponse.json({ok: true, delivered});
  } catch (err) {
    console.error('[contact] send failed:', err);
    return NextResponse.json({ok: false, error: 'send_failed'}, {status: 502});
  }
}
