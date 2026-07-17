// End-to-end smoke test for the AI support widget + admin gate.
// Run the app first (npm run dev OR npm start), then: npm run test:e2e
// Requires a Chromium browser: npx playwright install chromium
import {chromium} from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
let failures = 0;
const check = (name, cond) => {
  console.log(`${cond ? '✓' : '✗'} ${name}`);
  if (!cond) failures++;
};

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  // 1. English widget: open, send, stream a grounded reply.
  await page.goto(`${BASE}/en`, {waitUntil: 'domcontentloaded'});
  await page.waitForSelector('button[aria-label="Open the devora assistant"]');
  await page.waitForTimeout(400); // let the widget hydrate
  await page.click('button[aria-label="Open the devora assistant"]');
  await page.fill(
    'textarea[aria-label="Type your message…"]',
    'How much is a landing page?'
  );
  await page.click('button[aria-label="Send message"]');
  await page.waitForFunction(
    () => {
      const b = [...document.querySelectorAll('[role="dialog"] .whitespace-pre-wrap')];
      // Wait until the assistant reply has actually streamed the grounded facts.
      return (
        b.length >= 3 &&
        /\$1,650|launch|studio|growth/i.test(b[b.length - 1].textContent || '')
      );
    },
    {timeout: 20000}
  );
  const reply = await page.evaluate(
    () =>
      [...document.querySelectorAll('[role="dialog"] .whitespace-pre-wrap')].pop()
        ?.textContent || ''
  );
  check('EN widget streams a grounded reply', /\$1,650|launch|studio|growth/i.test(reply));

  // 2. Arabic page is RTL and the launcher is localized.
  await page.goto(`${BASE}/`, {waitUntil: 'domcontentloaded'});
  check('AR page is RTL', (await page.evaluate(() => document.documentElement.dir)) === 'rtl');
  check(
    'AR launcher is localized',
    (await page.locator('button[aria-label="افتح مساعد ديفورا"]').count()) > 0
  );

  // 3. Admin is gated: /admin redirects to the login form.
  await page.goto(`${BASE}/admin`, {waitUntil: 'domcontentloaded'});
  check('admin redirects to /admin/login', page.url().includes('/admin/login'));
  check(
    'login form renders',
    (await page.locator('input[name="email"]').count()) > 0
  );
} catch (err) {
  console.error('e2e error:', err);
  failures++;
} finally {
  await browser.close();
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
