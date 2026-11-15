#!/usr/bin/env node
// Atomically replace one top-level namespace in messages/{en,ar}.json.
// usage: node scripts/merge-ns.mjs <namespace> <en.json> <ar.json>
//        node scripts/merge-ns.mjs --delete <namespace>
// Keeps both locales in lockstep so key parity can't drift.
import {readFileSync, writeFileSync} from 'node:fs';
const args = process.argv.slice(2);
const load = (p) => JSON.parse(readFileSync(p, 'utf8'));
const save = (p, o) => writeFileSync(p, JSON.stringify(o, null, 2) + '\n');
if (args[0] === '--delete') {
  for (const l of ['en', 'ar']) { const p = `messages/${l}.json`; const m = load(p); delete m[args[1]]; save(p, m); }
  process.exit(0);
}
const [ns, enPath, arPath] = args;
if (!ns || !enPath || !arPath) { console.error('usage: merge-ns.mjs <ns> <en.json> <ar.json>'); process.exit(1); }
const flat = (o, pre = '') => Object.entries(o).flatMap(([k, v]) => typeof v === 'object' && v ? flat(v, pre + k + '.') : [pre + k]);
const en = load(enPath), ar = load(arPath);
const a = flat(en).sort(), b = flat(ar).sort();
const missing = [...a.filter((k) => !b.includes(k)).map((k) => 'ar missing ' + k), ...b.filter((k) => !a.includes(k)).map((k) => 'en missing ' + k)];
if (missing.length) { console.error(missing.join('\n')); process.exit(1); }
for (const [l, o] of [['en', en], ['ar', ar]]) { const p = `messages/${l}.json`; const m = load(p); m[ns] = o; save(p, m); }
console.log(`merged ${ns}: ${a.length} keys`);
