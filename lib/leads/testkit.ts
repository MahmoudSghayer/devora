import {randomUUID} from 'node:crypto';
import {createMemoryRepository, type MemoryRepository} from './repository';
import type {OutgoingMail, RequestMeta, SubmitDeps} from './types';

// Test helpers (kept out of the production import graph; only *.test.ts use it).

export const NOW = Date.parse('2026-11-15T10:00:00Z');

export function goodMeta(over: Partial<RequestMeta> = {}): RequestMeta {
  return {
    ip: '203.0.113.7',
    host: 'devora.design',
    origin: 'https://devora.design',
    referer: null,
    userAgent: 'vitest',
    dev: false,
    ...over,
  };
}

export function estimateBody(over: Record<string, unknown> = {}) {
  return {
    source: 'website_estimate',
    idempotencyKey: randomUUID(),
    locale: 'en',
    startedAtMs: NOW - 60_000,
    contact: {name: 'Dana Levi', email: 'dana@example.com', consent: true},
    answers: {types: ['business'], pages: 6, features: ['blog']},
    timeline: [{step: 'types', tsMs: NOW - 50_000}],
    ...over,
  };
}

export function roiBody(over: Record<string, unknown> = {}) {
  return {
    source: 'automation_roi',
    idempotencyKey: randomUUID(),
    locale: 'en',
    startedAtMs: NOW - 60_000,
    contact: {name: 'Omar', email: 'omar@example.com', consent: true},
    answers: {
      tasks: [{taskId: 'invoices', timesPerDay: 5, minutesEach: 10, employees: 2, automationPct: 70}],
    },
    ...over,
  };
}

export function discussBody(over: Record<string, unknown> = {}) {
  return {
    source: 'software_discovery',
    idempotencyKey: randomUUID(),
    locale: 'en',
    startedAtMs: NOW - 60_000,
    contact: {
      name: 'Noa Katz',
      email: 'noa@example.com',
      notes: 'We run 3 clinics and need one system.',
      consent: true,
    },
    answers: {
      purpose: ['replace-spreadsheets', 'customer-portal'],
      users: 'team-and-customers',
      mustHaves: ['auth-roles', 'payments'],
      budget: '30-60k',
    },
    timeline: [{step: 'purpose', tsMs: NOW - 50_000}],
    ...over,
  };
}

export function contactBody(over: Record<string, unknown> = {}) {
  return {
    source: 'contact',
    locale: 'en',
    startedAtMs: NOW - 60_000,
    contact: {name: 'Sam', email: 'sam@example.com', consent: true},
    answers: {message: 'Hello, I need a site.'},
    ...over,
  };
}

export interface Kit {
  deps: SubmitDeps;
  repo: MemoryRepository;
  sent: OutgoingMail[];
  deferred: (() => Promise<void>)[];
  limiterCalls: string[];
  flush(): Promise<void>;
  state: {
    mailConfigured: boolean;
    mailFails: boolean;
    limitIp: boolean;
    limitEmail: boolean;
    repoConfigured: boolean;
  };
  errors: unknown[][];
}

export function makeKit(): Kit {
  const repo = createMemoryRepository(() => NOW);
  const sent: OutgoingMail[] = [];
  const deferred: (() => Promise<void>)[] = [];
  const limiterCalls: string[] = [];
  const errors: unknown[][] = [];
  const state = {
    mailConfigured: true,
    mailFails: false,
    limitIp: false,
    limitEmail: false,
    repoConfigured: true,
  };
  let n = 0;
  repo.isConfigured = () => state.repoConfigured;
  const deps: SubmitDeps = {
    repo,
    mailer: {
      isConfigured: () => state.mailConfigured,
      async send(mail) {
        if (state.mailFails) throw new Error('smtp down');
        if (!state.mailConfigured) return {delivered: false};
        sent.push(mail);
        return {delivered: true};
      },
    },
    now: () => NOW,
    async rateLimit(name) {
      limiterCalls.push(name);
      const blocked = name === 'calculator' ? state.limitIp : state.limitEmail;
      return blocked ? {success: false, retryAfterSec: 120} : {success: true};
    },
    newLeadRef: () => `DV-2611-T${String(++n).padStart(3, '0')}`.slice(0, 12),
    hashIp: (ip) => `h:${ip}`,
    deferred: (fn) => void deferred.push(fn),
    log: {warn: () => {}, error: (...a) => void errors.push(a)},
  };
  return {
    deps,
    repo,
    sent,
    deferred,
    limiterCalls,
    errors,
    state,
    async flush() {
      while (deferred.length) await deferred.shift()!();
    },
  };
}
