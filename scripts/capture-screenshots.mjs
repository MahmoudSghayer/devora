// Capture the live case-study sites for the Work/Home cards.
// Run: node scripts/capture-screenshots.mjs [slug-substring ...]  (e.g. `rabea kareem`)
// A site that fails here just falls back to SiteImage's labelled placeholder,
// so a missing PNG never blocks the build. Re-run when a site goes live.
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';

mkdirSync('public/images', {recursive: true});

const shots = [
  {url: 'https://zawiya.studio', path: 'public/images/zawiya.png'},
  {url: 'https://aldarb.co', path: 'public/images/aldarb.png'},
  {url: 'https://rabea.art', path: 'public/images/rabea.png'},
  {url: 'https://kareem.video', path: 'public/images/kareem.png'},
];

const only = process.argv.slice(2);
const browser = await chromium.launch();
// 1440x1080 = 4:3, matches the Work hero slot; Home's 16:10 just crops it.
const ctx = await browser.newContext({
  viewport: {width: 1440, height: 1080},
  deviceScaleFactor: 2,
  // Some sites 403 headless/curl-style agents; use a normal desktop UA.
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
});

for (const s of shots) {
  if (only.length && !only.some((o) => s.url.includes(o))) continue;
  const page = await ctx.newPage();
  try {
    await page.goto(s.url, {waitUntil: 'load', timeout: 45000});
    await page.waitForTimeout(3500); // let hero animations/images settle
    await page.screenshot({path: s.path});
    console.log('captured', s.url, '->', s.path);
  } catch (e) {
    console.error('FAILED', s.url, e.message);
  } finally {
    await page.close();
  }
}

await browser.close();
