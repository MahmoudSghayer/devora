import {
  createSupabaseServiceClient,
  isSupabaseConfigured,
} from '@/lib/supabase/service';
import type {
  InsertOutcome,
  LeadInsert,
  LeadRef,
  LeadsRepository,
  LeadSource,
} from './types';

// ── Supabase (service-role) repository ──────────────────────────────────────

const UNIQUE_VIOLATION = '23505';

export function createSupabaseRepository(): LeadsRepository {
  return {
    isConfigured: () => isSupabaseConfigured(),

    async insert(row: LeadInsert): Promise<InsertOutcome> {
      const supabase = createSupabaseServiceClient();
      const {data, error} = await supabase
        .from('leads')
        .insert(row)
        .select('id')
        .single();
      if (error || !data) {
        if (error?.code === UNIQUE_VIOLATION) {
          const msg = `${error.message} ${error.details ?? ''}`;
          return {
            ok: false,
            conflict: msg.includes('idempotency') ? 'idempotency_key' : 'lead_ref',
          };
        }
        return {ok: false, error: error?.message ?? 'insert_failed'};
      }
      return {ok: true, id: data.id as string};
    },

    async findByIdempotencyKey(key: string): Promise<LeadRef | null> {
      const supabase = createSupabaseServiceClient();
      const {data, error} = await supabase
        .from('leads')
        .select('id,lead_ref')
        .eq('idempotency_key', key)
        .limit(1);
      if (error) throw new Error(error.message);
      const r = data?.[0];
      return r ? {id: r.id as string, leadRef: r.lead_ref as string} : null;
    },

    async findRecent(email: string, source: LeadSource, sinceMs: number) {
      const supabase = createSupabaseServiceClient();
      const {data, error} = await supabase
        .from('leads')
        .select('id,lead_ref')
        .ilike('email', email.replace(/[\\%_]/g, (c) => `\\${c}`))
        .eq('source', source)
        .gte('created_at', new Date(sinceMs).toISOString())
        .not('lead_ref', 'is', null)
        .order('created_at', {ascending: false})
        .limit(1);
      if (error) throw new Error(error.message);
      const r = data?.[0];
      return r ? {id: r.id as string, leadRef: r.lead_ref as string} : null;
    },

    async markEmail(id, result) {
      const supabase = createSupabaseServiceClient();
      const {error} = await supabase
        .from('leads')
        .update({
          email_delivered: result.delivered,
          email_error: result.error ? result.error.slice(0, 500) : null,
        })
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
  };
}

// ── In-memory repository (unit tests + Playwright E2E, never production) ────

export interface MemoryLead extends LeadInsert {
  id: string;
  created_at_ms: number;
  email_delivered: boolean;
  email_error: string | null;
}

export interface MemoryRepository extends LeadsRepository {
  rows: MemoryLead[];
  /** Test hook: make the next insert(s) fail. */
  failInserts: boolean;
}

export function createMemoryRepository(
  now: () => number = Date.now
): MemoryRepository {
  const rows: MemoryLead[] = [];
  let seq = 0;
  const repo: MemoryRepository = {
    rows,
    failInserts: false,
    isConfigured: () => true,
    async insert(row) {
      if (repo.failInserts) return {ok: false, error: 'simulated_db_failure'};
      if (row.idempotency_key && rows.some((r) => r.idempotency_key === row.idempotency_key))
        return {ok: false, conflict: 'idempotency_key'};
      if (rows.some((r) => r.lead_ref === row.lead_ref))
        return {ok: false, conflict: 'lead_ref'};
      const id = `mem-${++seq}`;
      rows.push({
        ...row,
        id,
        created_at_ms: now(),
        email_delivered: false,
        email_error: null,
      });
      return {ok: true, id};
    },
    async findByIdempotencyKey(key) {
      const r = rows.find((x) => x.idempotency_key === key);
      return r ? {id: r.id, leadRef: r.lead_ref} : null;
    },
    async findRecent(email, source, sinceMs) {
      const r = [...rows]
        .reverse()
        .find(
          (x) =>
            x.email.toLowerCase() === email.toLowerCase() &&
            x.source === source &&
            x.created_at_ms >= sinceMs
        );
      return r ? {id: r.id, leadRef: r.lead_ref} : null;
    },
    async markEmail(id, result) {
      const r = rows.find((x) => x.id === id);
      if (r) {
        r.email_delivered = result.delivered;
        r.email_error = result.error ?? null;
      }
    },
  };
  return repo;
}

/**
 * Test-only gate. The memory repository can ONLY be selected outside
 * production: NODE_ENV !== 'production' AND no VERCEL env var. Pass `env` to
 * unit-test the guard.
 */
export function isMemoryRepositoryEnabled(
  env: Record<string, string | undefined> = process.env
): boolean {
  return (
    env.LEADS_TEST_REPOSITORY === 'memory' &&
    env.NODE_ENV !== 'production' &&
    !env.VERCEL
  );
}

const globalForMemory = globalThis as unknown as {__devoraLeadsMemory?: MemoryRepository};

export function resolveRepository(
  env: Record<string, string | undefined> = process.env
): LeadsRepository {
  if (isMemoryRepositoryEnabled(env)) {
    globalForMemory.__devoraLeadsMemory ??= createMemoryRepository();
    return globalForMemory.__devoraLeadsMemory;
  }
  return createSupabaseRepository();
}
