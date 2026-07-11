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

  const port = Number(process.env.ZOHO_SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({
    host: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com',
    port,
    secure: port === 465, // 465 = implicit SSL/TLS; 587 = STARTTLS
    auth: {user, pass},
    // Fail fast on a serverless function: without these, an unreachable or slow
    // Zoho SMTP hangs until Vercel kills the function (surfaces as a platform 502
    // with nothing logged). Bounded timeouts turn that into a clean, logged
    // ETIMEDOUT the route can report and the admin diagnostic can interpret.
    connectionTimeout: 8000, // TCP connect
    greetingTimeout: 8000, // wait for SMTP banner
    socketTimeout: 10000, // inactivity during the exchange
  });

  try {
    await transporter.sendMail({
      from: `devora.design <${user}>`, // must match the authenticated mailbox
      to,
      replyTo: opts.replyTo,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return {delivered: true};
  } catch (err) {
    // Surface the real SMTP error (auth / connection / relaying) in the logs.
    console.error('[email] send failed:', err);
    throw err;
  }
}
