import en from '@/messages/en.json';
import ar from '@/messages/ar.json';
import {SITE, CASES} from '@/lib/site';
import {createSupabaseServiceClient, isSupabaseConfigured} from '@/lib/supabase/service';
import type {ChatLocale, KbDocument} from './types';

// ---------------------------------------------------------------------------
// KB compiler — turns the site's own content (messages/*.json + lib/site.ts)
// into a set of grounding documents. This is the SOURCE import used by
// scripts/seed-kb.mjs and the live FALLBACK when the DB isn't seeded yet.
// The served source of truth at runtime is kb_documents in Supabase (admin-
// editable); this compile mirrors it so the bot works before/without seeding.
// ---------------------------------------------------------------------------

const MESSAGES: Record<ChatLocale, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  ar: ar as Record<string, unknown>,
};

// Collect every human-meaningful string in document order (preserves e.g. FAQ
// question→answer adjacency). Skips glyphs/very short tokens (arrows, dots).
function flattenStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    const s = value.trim();
    if (s.length >= 2 && !/^[→←✦·—]+$/.test(s)) out.push(s);
  } else if (Array.isArray(value)) {
    for (const v of value) flattenStrings(v, out);
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) flattenStrings(v, out);
  }
  return out;
}

export function compileKbDocuments(locale: ChatLocale): KbDocument[] {
  const docs: KbDocument[] = [];

  // Company core facts.
  docs.push({
    ref_key: 'company.core',
    title: 'Company',
    body: [
      `Name: ${SITE.name} (the name means dev + aura).`,
      `Website: ${SITE.domain}.`,
      `Contact email: ${SITE.email}.`,
      'A full-stack web studio: strategy, brand, design, code, growth and AI — one senior team, end to end.',
      'Remote-first, working across MENA and worldwide. Bilingual EN/AR (RTL done right).',
    ].join('\n'),
  });

  // Case studies live in lib/site.ts, not in the message dictionaries.
  for (const c of CASES) {
    const cc = (c as {en: Record<string, string>; ar: Record<string, string>})[locale] ?? c.en;
    docs.push({
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

  // Every content namespace from the message dictionary for this locale.
  // Skip the chatbot's own UI copy — it's not company knowledge.
  const SKIP_NS = new Set(['chat']);
  const messages = MESSAGES[locale];
  for (const [ns, val] of Object.entries(messages)) {
    if (SKIP_NS.has(ns)) continue;
    const lines = flattenStrings(val);
    if (lines.length) {
      docs.push({ref_key: `site.${ns}`, title: ns, body: lines.join('\n')});
    }
  }

  return docs;
}

function docsToContext(docs: {ref_key: string; title: string; body: string}[]): string {
  return docs
    .map((d) => `<doc key="${d.ref_key}" title="${d.title}">\n${d.body}\n</doc>`)
    .join('\n\n');
}

// ---------------------------------------------------------------------------
// Runtime KB context — DB first (admin-editable), source fallback. Cached with
// a short TTL; call invalidateKbCache() after admin edits (Phase 5).
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<ChatLocale, {value: string; expires: number}>();

export function invalidateKbCache() {
  cache.clear();
}

export async function buildKbContext(locale: ChatLocale): Promise<string> {
  const hit = cache.get(locale);
  const now = Date.now();
  if (hit && hit.expires > now) return hit.value;

  let context: string | null = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createSupabaseServiceClient();
      const {data, error} = await supabase
        .from('kb_documents')
        .select('ref_key,title,body')
        .eq('locale', locale)
        .eq('is_active', true)
        .order('ref_key');
      if (!error && data && data.length > 0) {
        context = docsToContext(data);
      }
    } catch {
      // fall through to source compile
    }
  }

  if (!context) context = docsToContext(compileKbDocuments(locale));

  cache.set(locale, {value: context, expires: now + CACHE_TTL_MS});
  return context;
}

// Import the site's content into editable kb_documents rows (for the admin KB
// editor). Idempotent upsert on (source, locale, ref_key). Returns row count.
export async function seedKbFromSource(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const supabase = createSupabaseServiceClient();
  const rows: Record<string, unknown>[] = [];
  for (const locale of ['en', 'ar'] as ChatLocale[]) {
    for (const d of compileKbDocuments(locale)) {
      const source =
        d.ref_key.startsWith('company.') || d.ref_key.startsWith('case.')
          ? 'site_ts'
          : 'messages_json';
      rows.push({
        source,
        locale,
        ref_key: d.ref_key,
        title: d.title,
        body: d.body,
        is_active: true,
      });
    }
  }
  await supabase
    .from('kb_documents')
    .upsert(rows, {onConflict: 'source,locale,ref_key'});
  invalidateKbCache();
  return rows.length;
}
