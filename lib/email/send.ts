import nodemailer from 'nodemailer';

// Reusable Zoho SMTP sender — the transport pattern from the original contact
// route, now shared by the contact form, lead capture, and support requests.
// Degrades to a logged no-op when SMTP env is absent (local dev / previews).

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.ZOHO_SMTP_USER &&
      process.env.ZOHO_SMTP_PASS &&
      (process.env.CONTACT_TO || process.env.ZOHO_SMTP_USER)
  );
}

export async function sendMail(opts: {
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<{delivered: boolean}> {
  const user = process.env.ZOHO_SMTP_USER;
  const pass = process.env.ZOHO_SMTP_PASS;
  const to = process.env.CONTACT_TO || user;

  if (!user || !pass || !to) {
    console.warn('[email] SMTP not configured — logging instead:', {
      subject: opts.subject,
    });
    return {delivered: false};
  }

  const transporter = nodemailer.createTransport({
    host: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com',
    port: Number(process.env.ZOHO_SMTP_PORT || 465),
    secure: true, // 465 = implicit TLS
    auth: {user, pass},
  });

  await transporter.sendMail({
    from: `devora.design <${user}>`,
    to,
    replyTo: opts.replyTo,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
  return {delivered: true};
}
