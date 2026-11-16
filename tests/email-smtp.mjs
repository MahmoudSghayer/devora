// SMTP integration test (not vitest): spins up a local plain-text SMTP server,
// points lib/email/send.ts at it through env, sends the four team emails
// (estimate, ROI, discuss, contact) and asserts delivery + well-formed MIME.
//   node tests/email-smtp.mjs
import {SMTPServer} from 'smtp-server';
import {createJiti} from 'jiti';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jiti = createJiti(import.meta.url, {alias: {'@': root}, interopDefault: true});

let failures = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? '✓' : '✗'} ${name}${cond ? '' : ` ${extra}`}`);
  if (!cond) failures++;
};

const received = [];
const server = new SMTPServer({
  secure: false,
  authOptional: false,
  allowInsecureAuth: true,
  disabledCommands: ['STARTTLS'],
  onAuth(auth, _session, cb) {
    if (auth.username === 'user@test.invalid' && auth.password === 'dummy-pass')
      return cb(null, {user: auth.username});
    return cb(new Error('Invalid credentials'));
  },
  onData(stream, _session, cb) {
    const chunks = [];
    stream.on('data', (c) => chunks.push(c));
    stream.on('end', () => {
      received.push(Buffer.concat(chunks).toString('utf8'));
      cb();
    });
  },
});
await new Promise((res, rej) => {
  server.once('error', rej);
  server.listen(2525, '127.0.0.1', res);
});

process.env.ZOHO_SMTP_HOST = '127.0.0.1';
process.env.ZOHO_SMTP_PORT = '2525';
process.env.ZOHO_SMTP_SECURE = 'false';
process.env.ZOHO_SMTP_USER = 'user@test.invalid';
process.env.ZOHO_SMTP_PASS = 'dummy-pass';
process.env.CONTACT_TO = 'inbox@test.invalid';

function parseMime(raw) {
  const [head, ...rest] = raw.split(/\r?\n\r?\n/);
  const unfolded = head.replace(/\r?\n[ \t]+/g, ' ');
  const headers = {};
  for (const line of unfolded.split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i > 0) headers[line.slice(0, i).toLowerCase()] = line.slice(i + 1).trim();
  }
  return {headers, body: rest.join('\n\n')};
}

function decodeQP(s) {
  return s
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

try {
  const {sendMail} = await jiti.import(path.join(root, 'lib/email/send.ts'));
  const t = await jiti.import(path.join(root, 'lib/email/templates.ts'));
  const {estimateProject} = await jiti.import(path.join(root, 'lib/estimator/engine.ts'));
  const {computeRoi} = await jiti.import(path.join(root, 'lib/roi/engine.ts'));
  const {estimateDiscuss} = await jiti.import(path.join(root, 'lib/discuss/engine.ts'));

  const base = {
    locale: 'en',
    submittedAt: new Date().toISOString(),
    contact: {
      name: 'Dana Levi',
      businessName: 'Acme "Studio"',
      email: 'visitor@example.test',
      phone: '+972500000000',
      notes: 'Call me <after> 5',
      preferredContact: 'email',
    },
  };
  const estAnswers = {types: ['business'], pages: 6, features: ['blog']};
  const roiAnswers = {
    tasks: [{taskId: 'invoices', timesPerDay: 5, minutesEach: 10, employees: 2, automationPct: 70}],
  };
  const discussAnswers = {
    purpose: ['replace-spreadsheets', 'ai-tool'],
    users: 'team-2-10',
    mustHaves: ['auth-roles', 'dashboards'],
    budget: '3-7k',
  };
  const mails = [
    ['estimate', 'DV-2611-EST1', t.websiteEstimateEmail({...base, leadRef: 'DV-2611-EST1', answers: estAnswers, result: estimateProject(estAnswers)})],
    ['roi', 'DV-2611-ROI1', t.automationRoiEmail({...base, leadRef: 'DV-2611-ROI1', answers: roiAnswers, result: computeRoi(roiAnswers)})],
    ['discuss', 'DV-2611-DIS1', t.softwareDiscoveryEmail({...base, leadRef: 'DV-2611-DIS1', answers: discussAnswers, result: estimateDiscuss(discussAnswers)})],
    ['contact', 'DV-2611-CON1', t.contactEmail({...base, leadRef: 'DV-2611-CON1', message: 'Hello there', budget: '10k'})],
  ];

  for (const [name, ref, mail] of mails) {
    const {delivered} = await sendMail(mail);
    check(`${name}: sendMail reports delivered`, delivered === true);
    const raw = received.at(-1) ?? '';
    const {headers, body} = parseMime(raw);
    check(`${name}: subject carries lead ref`, (headers.subject ?? '').includes(ref), headers.subject);
    check(`${name}: To is CONTACT_TO`, (headers.to ?? '').includes('inbox@test.invalid'), headers.to);
    check(`${name}: Reply-To is the visitor`, (headers['reply-to'] ?? '').includes('visitor@example.test'), headers['reply-to']);
    const ct = headers['content-type'] ?? '';
    const boundary = /boundary="?([^";]+)"?/.exec(ct)?.[1];
    check(`${name}: multipart/alternative with boundary`, /multipart\/alternative/.test(ct) && !!boundary, ct);
    if (boundary) {
      check(`${name}: closing boundary present`, body.includes(`--${boundary}--`));
      const text = decodeQP(body);
      check(`${name}: text/plain part`, /Content-Type: text\/plain/i.test(body));
      check(`${name}: text/html part`, /Content-Type: text\/html/i.test(body));
      check(`${name}: lead ref in body`, text.includes(ref));
      check(`${name}: raw <script>/<after> not injected into HTML`, !/<after>/.test(text.split(/text\/html/i)[1] ?? ''));
    }
  }
  check('four messages received', received.length === 4, String(received.length));
} catch (err) {
  console.error(err);
  failures++;
} finally {
  server.close();
}

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll SMTP checks passed');
