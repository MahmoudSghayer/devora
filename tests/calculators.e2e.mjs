// End-to-end tests for the three guided calculators (estimate, automation-roi,
// discuss) in English and Arabic, plus the lead API contract.
//
//   BASE_URL=http://localhost:3000 node tests/calculators.e2e.mjs
//
// The server under test needs a place where a lead can land, otherwise the API
// (correctly) answers 503. Either configure Supabase, or point the SMTP env at
// the local sink:  node tests/support/smtp-catcher.mjs 2525  and start the app
// with ZOHO_SMTP_HOST=127.0.0.1 ZOHO_SMTP_PORT=2525 ZOHO_SMTP_SECURE=false
// ZOHO_SMTP_USER=qa@test.invalid ZOHO_SMTP_PASS=qa-pass
// (LEADS_TEST_REPOSITORY=memory only takes effect outside production builds.)
//
// UI text comes from messages/{en,ar}.json, so locators are label/role based
// and survive copy edits.
import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const BASE = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REF_RE = /DV-\d{4}-[A-Z0-9]{4}/;
const SHOTS = process.env.QA_SHOTS || '';

// ── tiny harness ─────────────────────────────────────────────────────────
let failures = 0;
let current = '';
const check = (name, cond, extra = '') => {
  console.log(`${cond ? '✓' : '✗'} [${current}] ${name}${cond ? '' : ` ${extra}`}`);
  if (!cond) failures++;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── messages (single source of truth for labels) ─────────────────────────
function flatten(o, p = '', out = {}) {
  for (const [k, v] of Object.entries(o)) {
    if (v && typeof v === 'object') flatten(v, `${p}${k}.`, out);
    else out[p + k] = String(v);
  }
  return out;
}
const MSG = Object.fromEntries(
  ['en', 'ar'].map((l) => {
    const j = JSON.parse(readFileSync(path.join(ROOT, 'messages', `${l}.json`), 'utf8'));
    return [l, Object.fromEntries(['estimator', 'roi', 'discuss'].map((ns) => [ns, flatten(j[ns])]))];
  }),
);
const tx = (l, ns) => (key, params = {}) => {
  const raw = MSG[l][ns][key];
  if (raw === undefined) throw new Error(`missing message ${l}.${ns}.${key}`);
  return raw.replace(/\{(\w+)\}/g, (_, n) => String(params[n] ?? `{${n}}`));
};
const exact = (s) => new RegExp(`^\\s*${esc(s)}\\s*$`);
const starts = (s) => new RegExp(`^\\s*${esc(s)}`);

// Arabic-Indic digits and separators → ASCII, so numbers compare across locales.
const norm = (s) =>
  s
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/٫/g, '.')
    .replace(/[٬,،  ‎‏؜]/g, '');

// ── page helpers ─────────────────────────────────────────────────────────
async function until(fn, ms = 8000, step = 100) {
  const end = Date.now() + ms;
  for (;;) {
    try {
      const v = await fn();
      if (v) return v;
    } catch {
      /* retry */
    }
    if (Date.now() > end) return false;
    await sleep(step);
  }
}

async function open(browser, l, route, viewport = {width: 1440, height: 1000}) {
  const ctx = await browser.newContext({locale: l === 'ar' ? 'ar' : 'en-US', viewport});
  const page = await ctx.newPage();
  const posts = [];
  const errors = [];
  page.on('request', (r) => {
    if (r.method() === 'POST' && r.url().includes('/api/')) posts.push(r);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource|vercel|ERR_TUNNEL|net::/i.test(m.text())) errors.push(m.text());
  });
  const url = `${BASE}${l === 'en' ? '/en' : ''}${route}`;
  await page.goto(url, {waitUntil: 'domcontentloaded'});
  await page.waitForLoadState('load');
  return {ctx, page, posts, errors, url};
}

/** Tick a card (input is visually hidden, so click its label) and verify, retrying until React has hydrated. */
async function tick(page, input) {
  const ok = await until(async () => {
    if (!(await input.isChecked())) await input.locator('xpath=ancestor::label[1]').click();
    return input.isChecked();
  }, 8000, 150);
  return ok;
}

/** Choose the first option of every question group on the current step that has no answer yet. */
async function answerStep(page) {
  const sets = page.locator('main fieldset');
  const n = await sets.count();
  for (let i = 0; i < n; i++) {
    const fs = sets.nth(i);
    if (!(await fs.isVisible())) continue;
    if ((await fs.locator('input:checked').count()) > 0) continue;
    const first = fs.locator('input[type=radio], input[type=checkbox]').first();
    if (await first.count()) await tick(page, first);
  }
}

const buttonNamed = (page, labels) => page.getByRole('button', {name: new RegExp(`^\\s*(${labels.map(esc).join('|')})\\s*$`)});
const stepParam = (page) => new URL(page.url()).searchParams.get('step');

/** Visible text of the live estimate panel (aside), '' when none. */
const panelText = async (page) => {
  const a = page.locator('main aside').first();
  return (await a.count()) && (await a.isVisible()) ? (await a.innerText()).replace(/\s+/g, ' ').trim() : '';
};

async function honeypotChecks(page) {
  const info = await page.evaluate(() => {
    const els = document.querySelectorAll('input[name="website"]');
    const el = els[0];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      count: els.length,
      value: el.value,
      ariaHidden: Boolean(el.closest('[aria-hidden="true"]')),
      tabIndex: el.tabIndex,
      tiny: r.width <= 2 && r.height <= 2,
      autocomplete: el.autocomplete,
    };
  });
  check('honeypot `website` field present exactly once', info?.count === 1);
  check('honeypot is empty', info?.value === '');
  check('honeypot hidden from people and assistive tech', Boolean(info?.ariaHidden && info.tabIndex === -1));
}

const FORBIDDEN_KEYS = /^(result|results|estimate|total|totals|price|prices|low|high|range|savedHours|annualValue|monthlyHours|capacityValue|payback|roi)$/i;
function envelopeChecks(body, source, l) {
  // `result` is the documented "what the browser displayed" field: accepted but ignored by the server.
  const allowed = new Set(['result', 'source', 'idempotencyKey', 'locale', 'startedAtMs', 'contact', 'answers', 'timeline', 'utm', 'website']);
  const extra = Object.keys(body).filter((k) => !allowed.has(k));
  check('POST envelope has only the documented keys', extra.length === 0, extra.join(','));
  check(`POST source (fixed by the route when omitted) and locale=${l}`, (body.source === undefined || body.source === source) && body.locale === l);
  check('POST has idempotencyKey (uuid) and startedAtMs', /^[0-9a-f-]{36}$/.test(body.idempotencyKey) && Number.isInteger(body.startedAtMs));
  check('POST contact.consent === true', body.contact?.consent === true);
  check('POST honeypot sent empty', body.website === '');
  const bad = [];
  const walk = (o, p) => {
    if (Array.isArray(o)) o.forEach((v, i) => walk(v, `${p}[${i}]`));
    else if (o && typeof o === 'object')
      for (const [k, v] of Object.entries(o)) {
        if (FORBIDDEN_KEYS.test(k) && !(p === 'body' && k === 'result')) bad.push(`${p}.${k}`);
        walk(v, `${p}.${k}`);
      }
  };
  walk(body, 'body');
  check('POST carries no client-computed totals (server recomputes)', bad.length === 0, bad.join(','));
}

async function snap(page, name) {
  if (SHOTS) await page.screenshot({path: path.join(SHOTS, `${name}.png`), fullPage: true}).catch(() => {});
}

// Contact form shared across the three flows. `f` maps logical fields → label text.
async function submitFlow(page, ctx, f) {
  const {posts, source, endpoint, l} = ctx;
  // consent is required: with everything else valid, submit must be blocked.
  await page.getByLabel(f.name, {exact: false}).first().fill('QA Tester');
  await page.getByLabel(f.email, {exact: true}).first().fill(`qa+${Date.now()}@example.com`);
  await page.getByLabel(f.notes, {exact: false}).first().fill('Free text note from the E2E run: ملاحظة تجريبية ✓');
  const cta = page.getByRole('button', {name: exact(f.cta)});
  const before = posts.length;
  await cta.click();
  const blocked = await until(() => page.getByText(f.consentErr).first().isVisible(), 4000);
  check('missing consent shows the consent error', blocked);
  await sleep(300);
  check('missing consent sends NO request', posts.length === before);

  check('consent ticked', await tick(page, page.getByRole('checkbox', {name: starts(f.consent.slice(0, 24))})));
  await honeypotChecks(page);
  // Slow the endpoint a little so both clicks of the double-click land while the request is in flight.
  await page.route(`**${endpoint}`, async (route) => {
    await sleep(700);
    await route.continue();
  });
  await cta.dblclick();
  const ref = await until(async () => {
    const m = (await page.locator('main').innerText()).match(REF_RE);
    return m ? m[0] : null;
  }, 15000, 200);
  check('success screen shows a lead ref (DV-yymm-XXXX)', Boolean(ref), ref || '');
  const mine = posts.filter((r) => r.url().endsWith(endpoint));
  // before-count is 0 (consent-blocked) so exactly one POST must exist in total.
  check('double-click submits exactly ONE POST', mine.length === 1, `got ${mine.length}`);
  if (mine[0]) envelopeChecks(mine[0].postDataJSON(), source, l);
  await page.unroute(`**${endpoint}`);
  return {ref, body: mine[0]?.postDataJSON()};
}

// ═════════════════════════════════════════════════════════════════════════
// 1. Estimator
// ═════════════════════════════════════════════════════════════════════════
async function estimatorFlow(browser, l) {
  current = `estimate ${l}`;
  const t = tx(l, 'estimator');
  const {ctx, page, posts, errors} = await open(browser, l, '/estimate');
  const next = (extra = []) => buttonNamed(page, [t('btn_next'), t('review.continue'), ...extra]);
  const heading = (n) => page.getByRole('heading', {level: 2, name: exact(t(`flow.s${n}.title`))});
  try {
    check('step 1 heading', await until(() => heading(1).isVisible()));
    await answerStep(page);
    await next().click();
    check('goes to step 2 (URL ?step=2)', await until(async () => stepParam(page) === '2'));
    await answerStep(page);
    await next().click();

    // Step 3 needs a project type: Continue must not advance without one.
    check('step 3 heading', await until(() => heading(3).isVisible()));
    const types = page.locator('main fieldset').first().locator('input[type=checkbox], input[type=radio]');
    // Types are pre-suggested from the goals; clear them to exercise the guard.
    for (let i = 0, n = await types.count(); i < n; i++) {
      if (await types.nth(i).isChecked()) await types.nth(i).locator('xpath=ancestor::label[1]').click();
    }
    await next().click({force: true});
    await sleep(300);
    check('step 3 blocks Continue until a type is chosen', stepParam(page) === '3');
    await tick(page, types.first());
    check('live estimate panel shows a range after choosing a type', (await until(async () => /₪|ILS|\d{3}/.test(await panelText(page)))) );
    const p1 = await panelText(page);
    const last = types.last();
    await tick(page, last);
    check('toggling another type updates the live panel', await until(async () => (await panelText(page)) !== p1, 4000), p1);
    await last.locator('xpath=ancestor::label[1]').click(); // back to a single type
    if ((await page.locator('main fieldset').first().locator('input:checked').count()) === 0) await tick(page, types.first());
    await next().click();

    for (const n of [4, 5, 6]) {
      check(`step ${n} heading`, await until(() => heading(n).isVisible()));
      await answerStep(page);
      const before = await panelText(page);
      // flip the last still-unchecked option of the first group to prove interactivity
      const inputs = page.locator('main fieldset').first().locator('input[type=checkbox], input[type=radio]');
      const k = await inputs.count();
      if (k > 1) {
        const lastIn = inputs.nth(k - 1);
        if (!(await lastIn.isChecked())) await tick(page, lastIn);
      }
      void before;
      await next().click();
    }
    check('step 7 (review) heading', await until(() => heading(7).isVisible()));
    await next().click();
    check('summary step heading', await until(() => heading(8).isVisible()));
    await snap(page, `calc-estimate-${l}-summary`);

    // Edit → jumps back to step 1 → Continue returns to the summary.
    await page.getByRole('button', {name: exact(t('sum.edit_section', {section: t('sum.goals')}))}).click();
    check('Edit goals jumps to step 1', (await until(() => heading(1).isVisible())) && stepParam(page) === '1');
    for (let i = 0; i < 9 && !(await heading(8).isVisible()); i++) {
      await next().click();
      await sleep(250);
    }
    check('stepping forward returns to the summary', await until(() => heading(8).isVisible()));

    const out = await submitFlow(page, {posts, source: 'website_estimate', endpoint: '/api/estimate', l}, {
      name: t('f.name'),
      email: t('f.email'),
      notes: t('f.details'),
      cta: t('cta'),
      consent: t('f.consent'),
      consentErr: t('err.consent'),
    });
    check('success title shown', await page.getByRole('heading', {name: starts(t('success.title'))}).first().isVisible());
    await snap(page, `calc-estimate-${l}-success`);
    check('no console/page errors', errors.length === 0, errors.join(' | '));
    return out;
  } catch (e) {
    check('flow completed without throwing', false, e.message);
    await snap(page, `calc-estimate-${l}-FAIL`);
    return {};
  } finally {
    await ctx.close();
  }
}

// ═════════════════════════════════════════════════════════════════════════
// 2. Automation ROI
// ═════════════════════════════════════════════════════════════════════════
async function roiFlow(browser, l) {
  current = `roi ${l}`;
  const t = tx(l, 'roi');
  const {ctx, page, posts, errors} = await open(browser, l, '/automation-roi');
  const title = (id) => page.getByRole('heading', {level: 2, name: new RegExp(esc(t(`step.title.${id}`)))});
  const nextBtn = buttonNamed(page, [t('nav.next'), t('nav.toResults'), t('nav.toForm')]);
  const field = (label) => page.getByLabel(label, {exact: false}).and(page.locator('input:not([type=radio]):not([type=checkbox])'));
  const text = async () => norm((await page.locator('main').innerText()).replace(/\s+/g, ' '));
  try {
    // Step 1: tasks. Next with nothing chosen must block.
    check('step 1 heading', await until(() => title('tasks').isVisible()));
    await nextBtn.click();
    check('step 1 blocks Next without a task', (await until(() => page.getByRole('alert').first().isVisible(), 3000)) && stepParam(page) !== '2');
    const task = page.getByRole('checkbox', {name: starts(t('task.whatsappReplies'))});
    check('task picked', await tick(page, task));
    await nextBtn.click();

    // Step 2: workload via "Enter exact numbers" — the worked example 4 × 30 min × 3 people.
    check('step 2 heading', await until(() => title('workload').isVisible()));
    const exactBox = page.getByLabel(t('exact.label'), {exact: false}).first();
    await until(async () => {
      if (!(await exactBox.isChecked())) await exactBox.check();
      return exactBox.isChecked();
    });
    await field(t('workload.times')).first().fill('4');
    await field(t('workload.minutes')).first().fill('30');
    await field(t('workload.employees')).first().fill('3');
    await nextBtn.click();

    // Step 3: labour cost — hourly 60.
    check('step 3 heading', await until(() => title('labor').isVisible()));
    check('hourly-cost mode chosen', await tick(page, page.getByRole('radio', {name: starts(t('labor.mode.hourly'))})));
    const exactLabor = page.getByLabel(t('exact.label'), {exact: false}).first();
    await until(async () => {
      if (!(await exactLabor.isChecked())) await exactLabor.check();
      return exactLabor.isChecked();
    });
    await field(t('labor.hourly')).first().fill('60');
    await nextBtn.click();

    // Step 4: potential (default 70% for WhatsApp replies).
    check('step 4 heading', await until(() => title('potential').isVisible()));
    await nextBtn.click();

    // Step 5: results — assert the worked example.
    check('step 5 heading', await until(() => title('results').isVisible()));
    const txt = await until(async () => {
      const s = await text();
      // headline figures count up (CountUp), so wait for the final values
      return s.includes('92.4') && s.includes('5544') && s.includes('66528') ? s : '';
    }, 12000);
    check('worked example: 132 hours a month today', Boolean(txt) && /(^|[^\d.])132([^\d]|$)/.test(txt));
    check('worked example: 92.4 hours reclaimed per month', Boolean(txt) && txt.includes('92.4'));
    check('worked example: 5,544 per month', Boolean(txt) && /5544/.test(txt));
    check('worked example: 66,528 per year', Boolean(txt) && /66528/.test(txt));
    if (l === 'en') check('worked example renders ₪5,544 and ₪66,528', (await page.locator('main').innerText()).includes('₪5,544') && (await page.locator('main').innerText()).includes('₪66,528'));
    await snap(page, `calc-roi-${l}-results`);
    await nextBtn.click();

    // Step 6: summary + form.
    check('step 6 heading', await until(() => title('form').isVisible()));
    check('summary lists the chosen task', (await page.locator('main').innerText()).includes(t('task.whatsappReplies')));
    await snap(page, `calc-roi-${l}-summary`);

    // Edit → step 1 → progress nav back to step 6.
    await page.getByRole('button', {name: exact(t('summary.editLabel', {section: t('summary.tasks')}))}).click();
    check('Edit tasks jumps to step 1', (await until(() => title('tasks').isVisible())) && stepParam(page) === '1');
    await page.getByRole('button', {name: starts(t('step.go', {n: 6, title: t('step.short.form')}).split(':')[0])}).click();
    check('progress nav returns to the summary step', await until(() => title('form').isVisible()));

    const out = await submitFlow(page, {posts, source: 'automation_roi', endpoint: '/api/automation-roi', l}, {
      name: t('form.name'),
      email: t('form.email'),
      notes: t('form.details'),
      cta: t('form.submit'),
      consent: t('form.consent'),
      consentErr: t('form.err.consent'),
    });
    check('success title shown', await page.getByRole('heading', {name: starts(t('success.title'))}).first().isVisible());
    await snap(page, `calc-roi-${l}-success`);
    check('no console/page errors', errors.length === 0, errors.join(' | '));
    return out;
  } catch (e) {
    check('flow completed without throwing', false, e.message);
    await snap(page, `calc-roi-${l}-FAIL`);
    return {};
  } finally {
    await ctx.close();
  }
}

// ═════════════════════════════════════════════════════════════════════════
// 3. Discuss
// ═════════════════════════════════════════════════════════════════════════
async function discussFlow(browser, l) {
  current = `discuss ${l}`;
  const t = tx(l, 'discuss');
  const {ctx, page, posts, errors} = await open(browser, l, '/discuss');
  const next = buttonNamed(page, [t('btn_next'), t('btn_review')]);
  const summaryH = page.getByRole('heading', {level: 2, name: exact(t('flow.s8.title'))});
  try {
    check('step 1 heading', await until(() => page.getByRole('heading', {level: 2, name: exact(t('q.purpose.title'))}).isVisible()));
    await next.click({force: true});
    await sleep(300);
    check('step 1 blocks Next until an option is chosen', stepParam(page) === '1' || stepParam(page) === null);
    for (let n = 1; n <= 7; n++) {
      await until(async () => (stepParam(page) ?? '1') === String(n));
      await answerStep(page);
      if (n === 2) {
        const aside = await until(async () => (await panelText(page)) !== '', 3000);
        if (aside) {
          // The range panel appears once a purpose exists; changing the answer must keep it coherent (₪ range).
          check('live range panel is shown with a ₪ range', /₪|ILS|\d{3}/.test(await panelText(page)));
        }
      }
      await next.click();
      await sleep(200);
    }
    check('summary step reached', await until(() => summaryH.isVisible()));
    await snap(page, `calc-discuss-${l}-summary`);

    await page.getByRole('button', {name: exact(t('sum.edit_section', {section: t('sum.purpose')}))}).click();
    check('Edit jumps back to step 1', await until(async () => stepParam(page) === '1'));
    await buttonNamed(page, [t('btn_back_summary')]).click();
    check('"Back to summary" returns to the summary', await until(() => summaryH.isVisible()));

    const out = await submitFlow(page, {posts, source: 'software_discovery', endpoint: '/api/discuss', l}, {
      name: t('f.name'),
      email: t('f.email'),
      notes: t('f.notes'),
      cta: t('cta'),
      consent: t('f.consent'),
      consentErr: t('err.consent'),
    });
    check('success title shown', await page.getByRole('heading', {name: starts(t('success.title'))}).first().isVisible());
    await snap(page, `calc-discuss-${l}-success`);
    check('no console/page errors', errors.length === 0, errors.join(' | '));
    return out;
  } catch (e) {
    check('flow completed without throwing', false, e.message);
    await snap(page, `calc-discuss-${l}-FAIL`);
    return {};
  } finally {
    await ctx.close();
  }
}

// ═════════════════════════════════════════════════════════════════════════
// 4. API contract (no browser)
// ═════════════════════════════════════════════════════════════════════════
async function apiChecks(sample) {
  current = 'api';
  const post = (route, body, headers = {}, raw = false) =>
    fetch(`${BASE}${route}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Origin: BASE, ...headers},
      body: raw ? body : JSON.stringify(body),
    });
  const base = sample
    ? {...sample, idempotencyKey: crypto.randomUUID(), startedAtMs: Date.now() - 60_000, website: ''}
    : null;

  let r = await post('/api/estimate', '{not json', {}, true);
  check('invalid JSON ⇒ 400', r.status === 400, String(r.status));
  r = await post('/api/estimate', {});
  check('empty object ⇒ 400 (validation)', r.status === 400, String(r.status));
  r = await post('/api/estimate', []);
  check('array body ⇒ 400', r.status === 400, String(r.status));
  r = await post('/api/estimate', {source: 'contact'});
  check('wrong source for the endpoint ⇒ 400', r.status === 400, String(r.status));
  r = await post('/api/estimate', 'x'.repeat(70 * 1024), {}, true);
  check('oversize body (70 KiB) ⇒ 413', r.status === 413, String(r.status));
  r = await post('/api/automation-roi', {junk: true});
  check('/api/automation-roi invalid ⇒ 400', r.status === 400, String(r.status));
  r = await post('/api/discuss', {junk: true});
  check('/api/discuss invalid ⇒ 400', r.status === 400, String(r.status));

  if (!base) {
    check('API tests that need a valid body were skipped (no sample)', false);
    return;
  }
  r = await post('/api/estimate', {...base, idempotencyKey: crypto.randomUUID()}, {Origin: 'https://evil.example'});
  check('wrong Origin ⇒ 403', r.status === 403, String(r.status));
  r = await post('/api/estimate', base, {Origin: ''});
  check('missing Origin/Referer (non-browser) ⇒ 403 in production', r.status === 403 || r.status === 200, String(r.status));
  r = await post('/api/estimate', {...base, idempotencyKey: crypto.randomUUID(), website: 'http://spam.example'});
  const j = await r.json().catch(() => ({}));
  check('honeypot filled ⇒ 200 silent-ok, not persisted', r.status === 200 && j.ok === true && j.persisted === false && REF_RE.test(j.leadRef || ''), JSON.stringify(j));
  r = await post('/api/estimate', {...base, idempotencyKey: crypto.randomUUID(), startedAtMs: Date.now()});
  const j2 = await r.json().catch(() => ({}));
  check('submitted faster than the minimum fill time ⇒ never a real success', !(r.status === 200 && j2.persisted === true), JSON.stringify(j2));
  r = await post('/api/estimate', {...base, idempotencyKey: crypto.randomUUID(), extra: 1});
  check('unknown envelope key ⇒ 400 (strict)', r.status === 400, String(r.status));
}

// ═════════════════════════════════════════════════════════════════════════
const browser = await chromium.launch();
try {
  const results = {};
  results.estimateEn = await estimatorFlow(browser, 'en');
  results.estimateAr = await estimatorFlow(browser, 'ar');
  results.roiEn = await roiFlow(browser, 'en');
  results.roiAr = await roiFlow(browser, 'ar');
  results.discussEn = await discussFlow(browser, 'en');
  results.discussAr = await discussFlow(browser, 'ar');
  await apiChecks(results.estimateEn.body);
} finally {
  await browser.close();
}

console.log(failures === 0 ? '\nALL CALCULATOR CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
