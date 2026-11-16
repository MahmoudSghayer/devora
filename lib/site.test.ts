import {describe, expect, it} from 'vitest';
import {CASES, whatsappUrl, SITE} from './site';

describe('case studies', () => {
  it('only active cases are exposed (aldarb is paused)', () => {
    expect(CASES.every((c) => c.active)).toBe(true);
    expect(CASES.map((c) => c.slug)).not.toContain('aldarb');
    expect(CASES.map((c) => c.slug)).toEqual(expect.arrayContaining(['zawiya', 'rabea', 'kareem']));
  });
  it('every active case has an image and bilingual copy', () => {
    for (const c of CASES) {
      expect(c.image).toBeTruthy();
      expect(c.en.summary.length).toBeGreaterThan(10);
      expect(c.ar.summary.length).toBeGreaterThan(10);
    }
  });
});

describe('whatsapp', () => {
  it('builds a wa.me link with a url-encoded localized message', () => {
    expect(SITE.whatsapp).toBe('+972542182646');
    const en = whatsappUrl('en');
    expect(en.startsWith('https://wa.me/972542182646?text=')).toBe(true);
    expect(decodeURIComponent(en.split('text=')[1]!)).toMatch(/devora/i);
    const ar = whatsappUrl('ar');
    expect(decodeURIComponent(ar.split('text=')[1]!)).toMatch(/[؀-ۿ]/);
  });
});
