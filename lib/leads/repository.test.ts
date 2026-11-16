import {describe, expect, it} from 'vitest';
import {isMemoryRepositoryEnabled, resolveRepository} from './repository';

describe('memory repository guard', () => {
  it('is enabled in dev/test only when explicitly requested', () => {
    expect(isMemoryRepositoryEnabled({LEADS_TEST_REPOSITORY: 'memory', NODE_ENV: 'development'})).toBe(true);
    expect(isMemoryRepositoryEnabled({LEADS_TEST_REPOSITORY: 'memory', NODE_ENV: 'test'})).toBe(true);
    expect(isMemoryRepositoryEnabled({NODE_ENV: 'development'})).toBe(false);
  });

  it('can never be enabled in production', () => {
    expect(isMemoryRepositoryEnabled({LEADS_TEST_REPOSITORY: 'memory', NODE_ENV: 'production'})).toBe(false);
  });

  it('can never be enabled on Vercel, whatever NODE_ENV says', () => {
    expect(
      isMemoryRepositoryEnabled({LEADS_TEST_REPOSITORY: 'memory', NODE_ENV: 'development', VERCEL: '1'})
    ).toBe(false);
    expect(isMemoryRepositoryEnabled({LEADS_TEST_REPOSITORY: 'memory', VERCEL: '1'})).toBe(false);
  });

  it('resolveRepository falls back to Supabase when the guard fails', () => {
    const repo = resolveRepository({
      LEADS_TEST_REPOSITORY: 'memory',
      NODE_ENV: 'production',
    });
    // Supabase repo: not configured without env, i.e. definitely not memory.
    expect('rows' in repo).toBe(false);
  });
});
