// Tiny local SMTP sink for the e2e job: accepts any message, so the lead
// pipeline's "email is the only record" path returns 200 with no Supabase/SMTP
// secrets. Usage: node tests/support/smtp-catcher.mjs [port=2525]
//   server env: ZOHO_SMTP_HOST=127.0.0.1 ZOHO_SMTP_PORT=2525 ZOHO_SMTP_SECURE=false
//               ZOHO_SMTP_USER=qa@test.invalid ZOHO_SMTP_PASS=qa-pass
import {SMTPServer} from 'smtp-server';

const port = Number(process.argv[2] || process.env.SMTP_CATCHER_PORT || 2525);
let count = 0;
const server = new SMTPServer({
  secure: false,
  authOptional: true,
  allowInsecureAuth: true,
  disabledCommands: ['STARTTLS'],
  onAuth: (auth, _s, cb) => cb(null, {user: auth.username}),
  onData(stream, _s, cb) {
    stream.resume();
    stream.on('end', () => {
      count++;
      console.log(`[smtp-catcher] message #${count}`);
      cb();
    });
  },
});
server.listen(port, '127.0.0.1', () => console.log(`[smtp-catcher] listening on ${port}`));
