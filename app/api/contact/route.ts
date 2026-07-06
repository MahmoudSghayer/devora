import {NextResponse} from 'next/server';
import {contactSchema} from '@/lib/validation';

// Contact endpoint — STUB. Validates the payload and acknowledges it, but does
// NOT deliver anywhere yet.
// TODO(devora): wire a real destination — transactional email (Resend /
// Postmark / SES), a CRM, or a form service — then remove the console.log.
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

  console.log('[contact] submission (stub — not delivered):', parsed.data);
  return NextResponse.json({ok: true});
}
