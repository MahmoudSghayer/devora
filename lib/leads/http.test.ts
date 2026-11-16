import {describe, expect, it} from 'vitest';
import {handleLeadRequest} from './http';
import {estimateBody, makeKit} from './testkit';

const req = (body: string, headers: Record<string, string> = {}) =>
  new Request('https://devora.design/api/estimate', {
    method: 'POST',
    headers: {
      host: 'devora.design',
      origin: 'https://devora.design',
      'content-type': 'application/json',
      ...headers,
    },
    body,
  });

describe('handleLeadRequest', () => {
  it('413 for bodies over 64 KB', async () => {
    const res = await handleLeadRequest(req('x'.repeat(70_000)), 'website_estimate', makeKit().deps);
    expect(res.status).toBe(413);
  });

  it('400 for invalid JSON', async () => {
    const res = await handleLeadRequest(req('{nope'), 'website_estimate', makeKit().deps);
    expect(res.status).toBe(400);
  });

  it('400 when the body names a different source than the endpoint', async () => {
    const body = JSON.stringify(estimateBody({source: 'automation_roi'}));
    const res = await handleLeadRequest(req(body), 'website_estimate', makeKit().deps);
    expect(res.status).toBe(400);
  });

  it('200 with the documented shape; source is injected by the route', async () => {
    const kit = makeKit();
    const b = estimateBody() as Record<string, unknown>;
    delete b.source;
    const res = await handleLeadRequest(req(JSON.stringify(b)), 'website_estimate', kit.deps);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ok: true, persisted: true, emailQueued: true});
    expect(json.leadRef).toMatch(/^DV-/);
    expect(json.status).toBeUndefined();
  });

  it('429 carries Retry-After', async () => {
    const kit = makeKit();
    kit.state.limitIp = true;
    const res = await handleLeadRequest(req(JSON.stringify(estimateBody())), 'website_estimate', kit.deps);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('120');
  });

  it('503 body is retryable', async () => {
    const kit = makeKit();
    kit.repo.failInserts = true;
    kit.state.mailConfigured = false;
    const res = await handleLeadRequest(req(JSON.stringify(estimateBody())), 'website_estimate', kit.deps);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ok: false, error: 'unavailable', retryable: true});
  });
});

