// Page-level QA sweep: every public page × locale (AR unprefixed, /en) × viewport.
//
//   BASE_URL=http://localhost:3000 QA_SHOTS=./qa-shots node tests/pages.qa.mjs
//
// Per combination: no horizontal overflow, no console/page errors or hydration
// warnings, exactly one <h1>, correct <html lang/dir>, no raw i18n keys, and the
// expected HTTP status. Extra runs: prefers-reduced-motion, WebGL disabled
// (static poster, no canvas) and a touch/mobile-emulated home page (no canvas).
// Full-page screenshots for every combination go to QA_SHOTS (default: OS tmp).
import {chromium, devices} from 'playwright';
import {mkdirSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BASE = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const SHOTS = process.env.QA_SHOTS || path.join(os.tmpdir(), 'devora-qa');
const ONLY = process.env.QA_ONLY ? process.env.QA_ONLY.split(',') : null; // e.g. QA_ONLY=/,/faq
mkdirSync(SHOTS, {recursive: true});

const PAGES = ['/', '/services', '/process', '/about', '/pricing', '/work', '/work/zawiya', '/industries', '/faq', '/contact', '/estimate', '/automation-roi', '/discuss', '/this-page-does-not-exist'];
const LOCALES = ['ar', 'en'];
const VIEWPORTS = [390, 768, 1440];

const IGNORED_CONSOLE =
  /vercel|_vercel|insights|ERR_TUNNEL|ERR_PROXY|ERR_CONNECTION|net::ERR|GPU stall|GL Driver|GL_INVALID|WebGL|swiftshader|Failed to load resource: the server responded with a status of 404|Failed to load resource: net::/i;
// The global 2D StarField canvas (components/chrome/StarField) is fixed behind everything; only
// WebGL scene canvases (the hero particle mark) are forbidden in the no-WebGL / phone runs.
const SCENE_CANVASES = "[...document.querySelectorAll('canvas')].filter((c) => !c.classList.contains('fixed')).length";
const HYDRATION = /hydrat|did not match|server rendered HTML/i;

let failures = 0;
let total = 0;
const failed = [];
const report = (id, name, ok, extra = '') => {
  total++;
  if (!ok) {
    failures++;
    failed.push(`${id} ${name} ${extra}`);
    console.log(`✗ ${id} ${name} ${extra}`);
  }
};

const urlFor = (l, p) => `${BASE}${l === 'en' ? '/en' : ''}${p === '/' ? (l === 'en' ? '' : '/') : p}`;
const slug = (l, p, w, extra = '') => `${l}${p === '/' ? '-home' : p.replace(/\//g, '-')}-${w}${extra}`;

/** Scroll through the page so reveal-on-scroll content mounts, then return to top. */
async function settle(page) {
  await page.evaluate(async () => {
    const step = Math.max(300, window.innerHeight * 0.8);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
}

async function inspect(browser, {l, p, w, ctxOpts = {}, tag = '', shot = true}) {
  const id = `[${l} ${p} ${w}${tag}]`;
  const context = await browser.newContext({
    locale: l === 'ar' ? 'ar' : 'en-US',
    viewport: {width: w, height: w === 1440 ? 900 : w === 768 ? 1024 : 844},
    ...ctxOpts,
  });
  const page = await context.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    const t = m.text();
    if (m.type() === 'error' || m.type() === 'warning') {
      if (HYDRATION.test(t)) problems.push(`hydration: ${t.slice(0, 160)}`);
      else if (m.type() === 'error' && !IGNORED_CONSOLE.test(t)) problems.push(`console.error: ${t.slice(0, 160)}`);
    }
  });
  const expect404 = p === '/this-page-does-not-exist';
  let status = 0;
  try {
    const res = await page.goto(urlFor(l, p), {waitUntil: 'load', timeout: 45000});
    status = res?.status() ?? 0;
    await page.waitForTimeout(700);
    await settle(page);

    const info = await page.evaluate(() => {
      const de = document.documentElement;
      const text = document.body.innerText;
      return {
        sw: de.scrollWidth,
        cw: de.clientWidth,
        h1: document.querySelectorAll('h1').length,
        lang: de.lang,
        dir: de.dir,
        raw: /MISSING_MESSAGE|@@/.test(text) ? (text.match(/.{0,30}(MISSING_MESSAGE|@@).{0,30}/) || [''])[0] : '',
      };
    });
    report(id, 'no horizontal overflow', info.sw <= info.cw, `scrollWidth ${info.sw} > clientWidth ${info.cw}`);
    report(id, 'exactly one h1', info.h1 === 1, `found ${info.h1}`);
    report(id, 'html lang/dir', info.lang === l && info.dir === (l === 'ar' ? 'rtl' : 'ltr'), `${info.lang}/${info.dir}`);
    report(id, 'no raw i18n keys', info.raw === '', info.raw);
    report(id, expect404 ? 'HTTP 404' : 'HTTP 200', expect404 ? status === 404 : status === 200, `status ${status}`);
    report(id, 'no console errors / hydration warnings', problems.length === 0, problems.join(' | '));
    if (shot) await page.screenshot({path: path.join(SHOTS, `${slug(l, p, w, tag)}.png`), fullPage: true}).catch(() => {});
  } catch (e) {
    report(id, 'page load', false, e.message.split('\n')[0]);
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch();
const list = PAGES.filter((p) => !ONLY || ONLY.includes(p));

// 1. Full matrix.
for (const p of list) {
  for (const l of LOCALES) {
    for (const w of VIEWPORTS) await inspect(browser, {l, p, w});
  }
  console.log(`… ${p} done`);
}

// 2. prefers-reduced-motion (phone + desktop).
for (const p of list) {
  for (const l of LOCALES) {
    for (const w of [390, 1440]) await inspect(browser, {l, p, w, ctxOpts: {reducedMotion: 'reduce'}, tag: '-rm', shot: false});
  }
}
console.log('… reduced-motion done');

// 3. Mobile emulation of the home page: touch + isMobile, never loads WebGL.
for (const l of LOCALES) {
  const id = `[${l} / mobile-emulated]`;
  const ctx = await browser.newContext({...devices['Pixel 7'], locale: l === 'ar' ? 'ar' : 'en-US'});
  const page = await ctx.newPage();
  await page.goto(urlFor(l, '/'), {waitUntil: 'load'});
  await page.waitForTimeout(3500); // beyond the idle-load window
  const r = await page.evaluate(`({canvas: ${SCENE_CANVASES}, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})`);
  report(id, 'no <canvas> on a coarse-pointer phone', r.canvas === 0, `canvas=${r.canvas}`);
  report(id, 'no horizontal overflow', r.sw <= r.cw, `${r.sw} > ${r.cw}`);
  await page.screenshot({path: path.join(SHOTS, `${l}-home-mobile-emulated.png`), fullPage: true}).catch(() => {});
  await ctx.close();
}
console.log('… mobile-emulated done');
await browser.close();

// 4. WebGL disabled: the CSS poster stays and no canvas is ever created.
{
  const noGl = await chromium.launch({args: ['--disable-webgl', '--disable-webgl2', '--disable-3d-apis']});
  for (const l of LOCALES) {
    const id = `[${l} / no-webgl]`;
    const ctx = await noGl.newContext({locale: l === 'ar' ? 'ar' : 'en-US', viewport: {width: 1440, height: 900}});
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(urlFor(l, '/'), {waitUntil: 'load'});
    await page.waitForTimeout(3500);
    const r = await page.evaluate(() => {
      const poster = document.querySelector('[class*="poster-module"][class*="__root"]');
      const box = poster?.getBoundingClientRect();
      return {canvas: [...document.querySelectorAll('canvas')].filter((c) => !c.classList.contains('fixed')).length, poster: Boolean(poster && box && box.width > 50 && box.height > 50)};
    });
    report(id, 'static poster visible', r.poster);
    report(id, 'no <canvas> without WebGL', r.canvas === 0, `canvas=${r.canvas}`);
    report(id, 'no page errors without WebGL', errs.length === 0, errs.join(' | '));
    await page.screenshot({path: path.join(SHOTS, `${l}-home-no-webgl.png`)}).catch(() => {});
    await ctx.close();
  }
  await noGl.close();
}
console.log('… no-webgl done');

console.log(failures === 0 ? `\nALL ${total} PAGE QA CHECKS PASSED (screenshots: ${SHOTS})` : `\n${failures}/${total} PAGE QA CHECKS FAILED (screenshots: ${SHOTS})`);
if (failures) console.log(failed.join('\n'));
process.exit(failures === 0 ? 0 : 1);
