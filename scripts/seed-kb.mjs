// Seed the knowledge base: compile messages/*.json (+ lib/site.ts when
// importable) into kb_documents. The chatbot works WITHOUT this — buildKbContext
// falls back to compiling from source — but seeding gives the admin editable
// rows (Phase 5). Idempotent: upserts on (source, locale, ref_key).
//
// Usage:  node scripts/seed-kb.mjs
// Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (reads .env.local).

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createClient} from '@supabase/supabase-js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Minimal .env.local loader (no dependency on dotenv).
function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}
loadEnv(path.join(root, '.env.local'));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (set them in .env.local).'
  );
  process.exit(1);
}

const supabase = createClient(url, key, {auth: {persistSession: false}});

const SKIP_NS = new Set(['chat']);
const GLYPH = /^[→←✦·—]+$/;

function flattenStrings(value, out = []) {
  if (typeof value === 'string') {
    const s = value.trim();
    if (s.length >= 2 && !GLYPH.test(s)) out.push(s);
  } else if (Array.isArray(value)) {
    for (const v of value) flattenStrings(v, out);
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) flattenStrings(v, out);
  }
  return out;
}

async function loadSite() {
  try {
    const mod = await import(path.join(root, 'lib/site.ts'));
    return {SITE: mod.SITE, CASES: mod.CASES};
  } catch (e) {
    console.warn('Could not import lib/site.ts —', e.message, '— seeding messages only.');
    return {SITE: null, CASES: null};
  }
}

function compile(locale, messages, site) {
  const docs = [];

  if (site.SITE) {
    docs.push({
      source: 'site_ts',
      ref_key: 'company.core',
      title: 'Company',
      body: [
        `Name: ${site.SITE.name} (the name means dev + aura).`,
        `Website: ${site.SITE.domain}.`,
        `Contact email: ${site.SITE.email}.`,
        'A full-stack web studio: strategy, brand, design, code, growth and AI — one senior team, end to end.',
        'Remote-first, working across MENA and worldwide. Bilingual EN/AR (RTL done right).',
      ].join('\n'),
    });
  }

  if (site.CASES) {
    for (const c of site.CASES) {
      const cc = c[locale] ?? c.en;
      docs.push({
        source: 'site_ts',
        ref_key: `case.${c.slug}`,
        title: `Case study — ${c.slug}`,
        body: [
          `Client site: ${c.domain} (${c.href})`,
          `Industry: ${cc.industry}`,
          `Scope: ${cc.tags}`,
          `Summary: ${cc.summary}`,
          `Challenge: ${cc.challenge}`,
          `Approach: ${cc.approach}`,
          `Outcome: ${cc.outcome}`,
        ].join('\n'),
      });
    }
  }

  for (const [ns, val] of Object.entries(messages)) {
    if (SKIP_NS.has(ns)) continue;
    const lines = flattenStrings(val);
    if (lines.length) {
      docs.push({source: 'messages_json', ref_key: `site.${ns}`, title: ns, body: lines.join('\n')});
    }
  }

  return docs.map((d) => ({...d, locale, is_active: true}));
}

async function main() {
  const en = JSON.parse(fs.readFileSync(path.join(root, 'messages/en.json'), 'utf8'));
  const ar = JSON.parse(fs.readFileSync(path.join(root, 'messages/ar.json'), 'utf8'));
  const site = await loadSite();

  const rows = [...compile('en', en, site), ...compile('ar', ar, site)];

  const {error} = await supabase
    .from('kb_documents')
    .upsert(rows, {onConflict: 'source,locale,ref_key'});

  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
  console.log(`Seeded ${rows.length} kb_documents (en + ar).`);
}

main();
