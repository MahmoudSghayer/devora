// Server-rendered markup for the DEVORA OS homepage experience.
//
// Returns the inner HTML of the experience root as a string. It's produced on
// the server (SSR) so every headline, paragraph and label ships in the initial
// HTML — crawlable and readable with JS off — while the client-side
// DevoraUniverse controller animates it via the data-* hooks preserved here.
//
// Ported from the DEVORA.dc.html prototype template, with three production
// changes: copy comes from next-intl, hard-coded font families become CSS
// variables (so Arabic renders through the Cairo fallback), and the four
// case-study image slots become self-contained placeholder frames.

import type {DevoraCopy} from '@/lib/experience/devora-universe';

// Full copy shape (superset of the controller's DevoraCopy).
export interface ExperienceCopy extends DevoraCopy {
  preloader_init: string;
  preloader_compiling: string;
  tagline: string;
  os_version: string;
  sound: string;
  sound_on: string;
  sound_aria: string;
  book_call: string;
  skip_link: string;
  scroll_initiate: string;
  lat: string;
  lon: string;
  lang_switch_aria: string;
  rail: string[];
  hero: {eyebrow: string; h1a: string; h1b: string; sub: string; cta1: string; cta2: string};
  dive: {label: string; title: string; out: string; shards: string[]};
  manifesto: {
    label: string; h2a: string; h2b: string; h2c: string;
    principles: {n: string; d: string}[];
  };
  build: DevoraCopy['build'] & {label_a: string; label_b: string; viewport: string; stage_word: string};
  services: DevoraCopy['services'] & {
    label_a: string; label_b: string; system_word: string; online: string; traverse: string;
  };
  cases: {
    label_a: string; label_b: string;
    items: {tag: string; name: string; metric: string; meta: string; desc: string; tags: string[]}[];
  };
  stats: {label: string; title: string; items: {value: string; label: string}[]};
  cta: {label: string; h2a: string; h2b: string; sub: string; btn: string; meta: string[]};
  footer: {
    tag: string; navigate: string; connect: string;
    nav: {k: string; label: string}[];
    email_label: string; instagram: string; copy: string; back: string;
  };
}

export interface MarkupOptions {
  otherLocaleHref: string; // e.g. /ar  (switch-language link target)
  otherLocaleLabel: string; // e.g. عربي / EN
  contactHref: string; // e.g. /en/contact
  email: string; // support@devora.design
  instagramHref: string;
}

// Font stacks — Clash/General with a Space-Grotesk fallback if the local faces
// aren't present, then the Arabic (Cairo) face, then a generic family.
// Display (headings) + mono (labels). Body text inherits the General/Grotesk
// stack from the experience root element (see DevoraExperience.tsx).
const FD = "var(--font-clash, var(--font-space-grotesk)), var(--font-arabic), sans-serif";
const FM = "var(--font-mono), var(--font-arabic), monospace";

const esc = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Per-case visual identity (accent, glow, ghost-number side, live domain, screenshot).
// Two entries = two real case studies (see messages `experience.cases.items`).
const CASE_META = [
  {c: '#F2A84B', side: 'left', pos: '18% 45%', domain: 'zawiya.studio', image: '/images/zawiya.png'},
  {c: '#6FD3FF', side: 'right', pos: '82% 55%', domain: 'aldarb.co', image: '/images/aldarb.png'},
];

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

const monoLabel = (extra = '') =>
  `font-family:${FM};font-size:11px;letter-spacing:.36em;text-transform:uppercase;${extra}`;

function caseWorld(i: number, item: ExperienceCopy['cases']['items'][number]) {
  const m = CASE_META[i];
  const num = String(i + 1).padStart(2, '0');
  const ghost = `<div aria-hidden="true" style="position:absolute;${m.side === 'left' ? 'left' : 'right'}:clamp(24px,6vw,80px);top:12vh;font-family:${FD};font-weight:700;font-size:clamp(80px,14vw,200px);line-height:.8;color:rgba(255,255,255,.035);pointer-events:none;user-select:none;">${num}</div>`;
  const textBlock = `<div style="flex:1;position:relative;min-width:0;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;"><span style="width:26px;height:1px;background:${m.c};"></span><span style="${monoLabel(`color:${m.c};font-size:11px;letter-spacing:.3em;`)}">${esc(item.tag)}</span></div>
    <h3 style="margin:0;font-family:${FD};font-weight:600;font-size:clamp(38px,5.6vw,88px);line-height:.9;letter-spacing:-.01em;color:#fff;">${esc(item.name)}</h3>
    <div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin:16px 0 14px;"><span style="font-family:${FD};font-weight:600;font-size:clamp(26px,3.4vw,46px);line-height:1;background:linear-gradient(120deg,#fff,${m.c});-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">${esc(item.metric)}</span><span style="font-family:${FM};font-size:11px;letter-spacing:.14em;color:rgba(245,246,248,.5);border-inline-start:1px solid rgba(255,255,255,.18);padding-inline-start:14px;">${esc(item.meta)}</span></div>
    <p style="margin:0;max-width:400px;font-size:15px;line-height:1.65;color:rgba(245,246,248,.6);">${esc(item.desc)}</p>
    <div style="display:flex;gap:8px;margin-top:22px;flex-wrap:wrap;">${item.tags.map((tg) => `<span style="font-family:${FM};font-size:10px;letter-spacing:.15em;color:rgba(245,246,248,.55);border:1px solid rgba(255,255,255,.14);border-radius:100px;padding:6px 12px;">${esc(tg)}</span>`).join('')}</div>
  </div>`;
  const imageBlock = `<div style="flex:1;position:relative;min-width:0;max-width:520px;">
    <div style="position:relative;border-radius:14px;overflow:hidden;border:1px solid ${hexA(m.c, 0.34)};box-shadow:0 40px 110px rgba(0,0,0,.6),0 0 70px ${hexA(m.c, 0.16)};background:#0a0c12;">
      <div style="height:34px;display:flex;align-items:center;gap:7px;padding:0 13px;border-bottom:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03);"><span style="width:9px;height:9px;border-radius:50%;background:#ff5f57;"></span><span style="width:9px;height:9px;border-radius:50%;background:#febc2e;"></span><span style="width:9px;height:9px;border-radius:50%;background:#28c840;"></span><span style="flex:1;text-align:center;font-family:${FM};font-size:10px;letter-spacing:.12em;color:rgba(245,246,248,.42);" dir="ltr">${m.domain}</span></div>
      <div style="aspect-ratio:16/10;position:relative;background:linear-gradient(160deg, #0c0e15, #070810);">
        <img src="${m.image}" alt="${esc(item.name)} — ${m.domain}" loading="lazy" decoding="async" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top center;display:block;">
        <div aria-hidden="true" style="position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 90% at 50% 0%, ${hexA(m.c, 0.14)}, transparent 55%);"></div>
      </div>
    </div>
  </div>`;
  const inner = i % 2 === 0 ? textBlock + imageBlock : imageBlock + textBlock;
  return `<div data-world="${num}" data-screen-label="Dimension ${num} — ${esc(item.name)}" style="width:50%;height:100%;position:relative;display:flex;align-items:center;padding:0 clamp(40px,8vw,130px);gap:clamp(28px,4vw,64px);">
    <div aria-hidden="true" style="position:absolute;inset:0;background:radial-gradient(70% 90% at ${m.pos}, ${hexA(m.c, 0.16)}, transparent 62%);pointer-events:none;"></div>
    ${ghost}
    ${inner}
  </div>`;
}

const SHARD_GLYPHS = ['◆', '✦', '▲', '◣', '⬡', '∞'];

export function buildExperienceMarkup(c: ExperienceCopy, o: MarkupOptions): string {
  const shard = (txt: string, i: number) =>
    `<div data-shard style="position:absolute;left:50%;top:50%;opacity:0;padding:10px 16px;border-radius:12px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);font-family:${FM};font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#fff;white-space:nowrap;box-shadow:0 14px 44px rgba(0,0,0,.5);">${SHARD_GLYPHS[i] || '◆'} ${esc(txt)}</div>`;

  const railLink = (id: string, key: string, label: string, n: string) =>
    `<a data-goto="act-${id}" data-rail="${key}" href="#act-${id}" style="display:flex;align-items:center;gap:10px;cursor:pointer;${monoLabel('font-size:10px;letter-spacing:.2em;color:rgba(245,246,248,.35);')}transition:color .3s;"><span data-rail-label style="opacity:0;transition:opacity .3s;">${esc(label)}</span><span style="font-size:9px;">${n}</span><span data-rail-dot aria-hidden="true" style="width:6px;height:6px;border-radius:50%;border:1px solid rgba(245,246,248,.35);transition:all .3s;"></span></a>`;

  const build0 = c.build.stages[0];
  const svc0 = c.services.items[0];

  return `
  <a href="#main" class="dvx-skip">${esc(c.skip_link)}</a>
  <noscript><style>[data-preloader],[data-cursor-ring],[data-cursor-dot]{display:none!important}</style></noscript>

  <!-- WEBGL UNIVERSE -->
  <canvas data-canvas aria-hidden="true" style="position:fixed;inset:0;width:100vw;height:100vh;z-index:0;"></canvas>

  <!-- ATMOSPHERE OVERLAYS -->
  <div aria-hidden="true" style="position:fixed;inset:0;z-index:1;pointer-events:none;background:radial-gradient(115% 115% at 50% 50%, transparent 55%, rgba(3,4,7,.55) 100%, rgba(2,3,5,.9));"></div>
  <div data-grain aria-hidden="true" style="position:fixed;inset:-50%;z-index:2;pointer-events:none;width:200%;height:200%;opacity:.05;mix-blend-mode:overlay;animation:dvGrain 7s steps(9) infinite;background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22140%22 height=%22140%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E');"></div>
  <div aria-hidden="true" style="position:fixed;inset:0;z-index:2;pointer-events:none;background:repeating-linear-gradient(0deg, rgba(255,255,255,.014) 0, rgba(255,255,255,.014) 1px, transparent 2px, transparent 4px);opacity:.5;"></div>

  <!-- CUSTOM CURSOR -->
  <div data-cursor-ring aria-hidden="true" style="position:fixed;top:0;left:0;z-index:300;pointer-events:none;width:38px;height:38px;margin:-19px 0 0 -19px;border:1px solid rgba(242,168,75,.5);border-radius:50%;transition:width .25s,height .25s,margin .25s,border-color .25s,opacity .3s;mix-blend-mode:screen;opacity:0;"></div>
  <div data-cursor-dot aria-hidden="true" style="position:fixed;top:0;left:0;z-index:301;pointer-events:none;width:5px;height:5px;margin:-2.5px 0 0 -2.5px;border-radius:50%;background:var(--accent,#F2A84B);box-shadow:0 0 12px var(--accent,#F2A84B);opacity:0;"></div>

  <!-- PRELOADER -->
  <div data-preloader style="position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#050609;animation:dvSafety .8s ease 7s forwards;">
    <div style="${monoLabel('font-size:10px;letter-spacing:.55em;color:rgba(245,246,248,.4);margin-bottom:26px;')}">${esc(c.preloader_init)}</div>
    <div data-latin style="font-family:${FD};font-weight:600;font-size:clamp(38px,7vw,86px);letter-spacing:.14em;background:linear-gradient(100deg,#fff 20%,var(--accent,#F2A84B) 40%,#fff 60%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:dvShimmer 2.4s linear infinite;">DEVORA</div>
    <div style="width:min(280px,60vw);height:1px;background:rgba(255,255,255,.1);margin-top:34px;overflow:hidden;">
      <div data-preload-bar style="height:100%;width:0%;background:linear-gradient(90deg,transparent,var(--accent,#F2A84B));box-shadow:0 0 14px var(--accent,#F2A84B);"></div>
    </div>
    <div style="font-family:${FM};font-size:11px;letter-spacing:.3em;color:rgba(245,246,248,.55);margin-top:16px;"><span data-preload-num>0</span>%<span style="color:var(--accent,#F2A84B);"> · ${esc(c.preloader_compiling)}</span></div>
  </div>

  <!-- TOP HUD -->
  <header style="position:fixed;top:0;left:0;right:0;z-index:60;display:flex;align-items:center;justify-content:space-between;padding:22px clamp(18px,3vw,40px);pointer-events:none;">
    <div style="display:flex;align-items:baseline;gap:12px;pointer-events:auto;">
      <a data-goto="act-hero" href="#act-hero" data-latin aria-label="DEVORA — home" style="font-family:${FD};font-weight:600;font-size:19px;letter-spacing:.22em;color:#fff;cursor:pointer;text-decoration:none;">DEVORA</a>
      <span style="${monoLabel('font-size:9px;letter-spacing:.3em;color:rgba(245,246,248,.4);')}">${esc(c.tagline)}</span>
    </div>
    <div style="display:none;align-items:center;gap:9px;${monoLabel('font-size:10px;letter-spacing:.25em;color:rgba(245,246,248,.5);')}" data-hud-center>
      <span aria-hidden="true" style="width:6px;height:6px;border-radius:50%;background:var(--accent,#F2A84B);box-shadow:0 0 8px var(--accent,#F2A84B);animation:dvBlink 2s infinite;"></span>
      <span>${esc(c.os_version)}</span><span style="opacity:.4;">/</span><span data-hud-act style="color:#fff;min-width:88px;display:inline-block;">${esc(c.act_labels.hero)}</span>
    </div>
    <div style="display:flex;align-items:center;gap:14px;pointer-events:auto;">
      <a href="${o.otherLocaleHref}" aria-label="${esc(c.lang_switch_aria)}" style="display:inline-flex;align-items:center;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);border-radius:100px;padding:8px 13px;color:rgba(245,246,248,.7);font-family:${FM};font-size:10px;letter-spacing:.15em;text-decoration:none;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);">${esc(o.otherLocaleLabel)}</a>
      <button data-sound type="button" aria-label="${esc(c.sound_aria)}" aria-pressed="false" data-label-sound="${esc(c.sound)}" data-label-sound-on="${esc(c.sound_on)}" style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);border-radius:100px;padding:8px 13px;color:rgba(245,246,248,.7);font-family:${FM};font-size:9px;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);">
        <span data-sound-bars aria-hidden="true" style="display:flex;align-items:flex-end;gap:2px;height:11px;">
          <span style="width:2px;height:4px;background:currentColor;"></span><span style="width:2px;height:9px;background:currentColor;"></span><span style="width:2px;height:6px;background:currentColor;"></span>
        </span><span data-sound-label>${esc(c.sound)}</span>
      </button>
      <a data-goto="act-cta" data-magnetic href="#act-cta" style="display:inline-flex;align-items:center;gap:8px;background:var(--accent,#F2A84B);color:#0a0805;border-radius:100px;padding:9px 17px;font-size:12px;font-weight:600;letter-spacing:.02em;cursor:pointer;text-decoration:none;box-shadow:0 8px 30px rgba(242,168,75,.28);">${esc(c.book_call)}</a>
    </div>
  </header>

  <!-- RIGHT RAIL -->
  <nav data-rail-nav aria-label="Sections" style="position:fixed;right:clamp(14px,2.2vw,30px);top:50%;transform:translateY(-50%);z-index:60;display:flex;flex-direction:column;gap:18px;align-items:flex-end;">
    ${railLink('hero', 'hero', c.rail[0], '01')}
    ${railLink('manifesto', 'manifesto', c.rail[1], '02')}
    ${railLink('build', 'build', c.rail[2], '03')}
    ${railLink('services', 'services', c.rail[3], '04')}
    ${railLink('cases', 'cases', c.rail[4], '05')}
    ${railLink('cta', 'cta', c.rail[5], '06')}
  </nav>

  <!-- BOTTOM HUD -->
  <div aria-hidden="true" style="position:fixed;left:0;right:0;bottom:0;z-index:60;display:flex;align-items:center;justify-content:space-between;padding:16px clamp(18px,3vw,40px);pointer-events:none;font-family:${FM};">
    <div data-scrollcue style="display:flex;align-items:center;gap:12px;font-size:10px;letter-spacing:.28em;color:rgba(245,246,248,.5);text-transform:uppercase;transition:opacity .5s;">
      <span style="display:inline-block;animation:dvCue 1.6s infinite;">▼</span> ${esc(c.scroll_initiate)}
    </div>
    <div style="display:flex;align-items:center;gap:16px;">
      <span data-coords style="font-size:9px;letter-spacing:.2em;color:rgba(245,246,248,.35);text-transform:uppercase;">${esc(c.lat)} <span data-coord-x>00.00</span> · ${esc(c.lon)} <span data-coord-y>00.00</span></span>
      <div style="width:140px;height:2px;background:rgba(255,255,255,.1);border-radius:2px;overflow:hidden;"><div data-progress style="height:100%;width:0%;background:var(--accent,#F2A84B);box-shadow:0 0 8px var(--accent,#F2A84B);"></div></div>
      <span style="font-size:10px;letter-spacing:.15em;color:#fff;min-width:34px;text-align:right;"><span data-progress-num>0</span>%</span>
    </div>
  </div>

  <!-- ============ SCROLL CONTENT ============ -->
  <main id="main" style="position:relative;z-index:10;">

    <!-- ACT 01 — HERO -->
    <section id="act-hero" data-screen-label="Act 01 — Hero / Origin" style="position:relative;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 20px;">
      <div aria-hidden="true" style="position:absolute;inset:0;background:radial-gradient(50% 45% at 50% 52%, rgba(5,6,9,.55), transparent 70%);pointer-events:none;"></div>
      <div data-reveal style="position:relative;${monoLabel('letter-spacing:.42em;color:var(--accent,#F2A84B);margin-bottom:28px;')}">◗ ${esc(c.hero.eyebrow)}</div>
      <h1 data-reveal style="position:relative;margin:0;font-family:${FD};font-weight:600;font-size:clamp(40px,8.4vw,132px);line-height:.92;letter-spacing:-.02em;">
        <span style="display:block;color:#F5F6F8;">${esc(c.hero.h1a)}</span>
        <span style="display:block;background:linear-gradient(180deg,#fff, var(--accent,#F2A84B));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">${esc(c.hero.h1b)}</span>
      </h1>
      <p data-reveal style="position:relative;max-width:640px;margin:32px auto 0;font-size:clamp(15px,1.5vw,19px);line-height:1.6;color:rgba(245,246,248,.62);">${esc(c.hero.sub)}</p>
      <div data-reveal style="position:relative;display:flex;gap:14px;margin-top:40px;flex-wrap:wrap;justify-content:center;">
        <a data-goto="act-cta" data-magnetic href="#act-cta" style="display:inline-flex;align-items:center;gap:10px;background:var(--accent,#F2A84B);color:#0a0805;border-radius:100px;padding:15px 28px;font-size:15px;font-weight:600;cursor:pointer;text-decoration:none;box-shadow:0 10px 40px rgba(242,168,75,.3);">${esc(c.hero.cta1)} <span aria-hidden="true">→</span></a>
        <a data-goto="act-manifesto" data-magnetic href="#act-manifesto" style="display:inline-flex;align-items:center;gap:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.14);color:#fff;border-radius:100px;padding:15px 28px;font-size:15px;font-weight:500;cursor:pointer;text-decoration:none;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);">${esc(c.hero.cta2)} <span aria-hidden="true">▼</span></a>
      </div>
    </section>

    <!-- ACT 02 — DIVE -->
    <section id="act-dive" data-screen-label="Act 02 — Dive into the core" style="position:relative;height:200vh;">
      <div style="position:sticky;top:0;height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden;">
        <div data-dive-center style="position:absolute;text-align:center;pointer-events:none;">
          <div style="${monoLabel('letter-spacing:.4em;color:var(--accent,#F2A84B);margin-bottom:14px;')}">// ${esc(c.dive.label)}</div>
          <div style="font-family:${FD};font-weight:500;font-size:clamp(30px,5.5vw,72px);letter-spacing:-.01em;color:rgba(245,246,248,.92);">${esc(c.dive.title)}</div>
        </div>
        <div data-dive-out style="position:absolute;text-align:center;opacity:0;pointer-events:none;">
          <div style="${monoLabel('letter-spacing:.4em;color:var(--accent,#F2A84B);')}">→ ${esc(c.dive.out)}</div>
        </div>
        ${c.dive.shards.map((s, i) => shard(s, i)).join('\n        ')}
      </div>
    </section>

    <!-- ACT 03 — MANIFESTO -->
    <section id="act-manifesto" data-screen-label="Act 03 — The studio / dev + aura" style="position:relative;min-height:110vh;display:flex;align-items:center;padding:14vh clamp(24px,7vw,140px);">
      <div style="max-width:1100px;">
        <div data-reveal style="${monoLabel('letter-spacing:.4em;color:var(--accent,#F2A84B);margin-bottom:34px;')}">// ${esc(c.manifesto.label)}</div>
        <h2 data-reveal style="margin:0;font-family:${FD};font-weight:500;font-size:clamp(30px,5vw,74px);line-height:1.04;letter-spacing:-.015em;color:#F5F6F8;">${esc(c.manifesto.h2a)}<br><span style="color:rgba(245,246,248,.42);">${esc(c.manifesto.h2b)}</span><span style="background:linear-gradient(120deg,#fff,var(--accent,#F2A84B));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">${esc(c.manifesto.h2c)}</span></h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:28px;margin-top:56px;max-width:900px;">
          ${c.manifesto.principles.map((p) => `<div data-reveal style="border-inline-start:1px solid rgba(242,168,75,.4);padding-inline-start:18px;"><div style="${monoLabel('font-size:10px;letter-spacing:.24em;color:var(--accent,#F2A84B);margin-bottom:10px;')}">${esc(p.n)}</div><p style="margin:0;font-size:15px;line-height:1.6;color:rgba(245,246,248,.6);">${esc(p.d)}</p></div>`).join('\n          ')}
        </div>
      </div>
    </section>

    <!-- ACT 04 — BUILD SEQUENCE -->
    <section id="act-build" data-screen-label="Act 04 — Build sequence" style="position:relative;height:420vh;">
      <div style="position:sticky;top:0;height:100vh;overflow:hidden;display:flex;flex-direction:column;">
        <div style="padding:22px clamp(24px,5vw,80px) 0;${monoLabel('letter-spacing:.36em;color:rgba(245,246,248,.5);')}">// ${esc(c.build.label_a)}<span style="color:var(--accent,#F2A84B);">${esc(c.build.label_b)}</span></div>
        <div style="flex:1;display:grid;grid-template-columns:1fr;align-items:center;position:relative;padding:0 clamp(24px,5vw,80px);">
          <div data-build-num aria-hidden="true" style="position:absolute;left:clamp(10px,4vw,70px);top:50%;transform:translateY(-50%);font-family:${FD};font-weight:700;font-size:clamp(120px,28vw,420px);line-height:.8;color:rgba(255,255,255,.035);pointer-events:none;user-select:none;">01</div>
          <div style="justify-self:center;width:min(46vw,560px);height:min(56vh,440px);position:relative;border-radius:18px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.08);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 40px 120px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.05);overflow:hidden;">
            <div style="position:absolute;top:0;left:0;right:0;height:34px;display:flex;align-items:center;gap:6px;padding:0 12px;border-bottom:1px solid rgba(255,255,255,.06);font-family:${FM};font-size:9px;letter-spacing:.2em;color:rgba(245,246,248,.4);"><span aria-hidden="true" style="width:7px;height:7px;border-radius:50%;background:var(--accent,#F2A84B);"></span> ${esc(c.build.viewport)}</div>
            <div style="position:absolute;inset:34px 0 0 0;">
              <div data-scene="0" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:1;transition:opacity .5s;">
                <div style="position:relative;width:120px;height:120px;display:flex;align-items:center;justify-content:center;">
                  <div style="position:absolute;width:22px;height:22px;border-radius:50%;background:var(--accent,#F2A84B);box-shadow:0 0 40px var(--accent,#F2A84B),0 0 80px var(--accent,#F2A84B);animation:dvPulse 2.4s infinite;"></div>
                  <div style="position:absolute;inset:0;border:1px solid rgba(242,168,75,.4);border-radius:50%;animation:dvRing 3s infinite;"></div>
                  <div style="position:absolute;inset:0;border:1px solid rgba(242,168,75,.3);border-radius:50%;animation:dvRing 3s infinite .8s;"></div>
                </div>
              </div>
              <div data-scene="1" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .5s;">
                <svg width="70%" height="70%" viewBox="0 0 200 150" fill="none" stroke="rgba(242,168,75,.6)" stroke-width="1" stroke-dasharray="4 4"><rect x="12" y="12" width="176" height="24" rx="3"/><rect x="12" y="46" width="80" height="92" rx="3"/><rect x="102" y="46" width="86" height="42" rx="3"/><rect x="102" y="96" width="86" height="42" rx="3"/></svg>
              </div>
              <div data-scene="2" style="position:absolute;inset:0;display:flex;flex-direction:column;gap:8px;padding:22px;opacity:0;transition:opacity .5s;">
                <div style="height:20px;border-radius:5px;background:linear-gradient(90deg,var(--accent,#F2A84B),transparent);opacity:.5;"></div>
                <div style="display:flex;gap:8px;flex:1;"><div style="flex:2;border-radius:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);"></div><div style="flex:1;display:flex;flex-direction:column;gap:8px;"><div style="flex:1;border-radius:6px;background:rgba(242,168,75,.18);"></div><div style="flex:1;border-radius:6px;background:rgba(255,255,255,.06);"></div></div></div>
                <div style="height:16px;width:60%;border-radius:5px;background:rgba(255,255,255,.08);"></div>
              </div>
              <div data-scene="3" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;opacity:0;transition:opacity .5s;">
                <div style="width:100%;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,.1);box-shadow:0 20px 50px rgba(0,0,0,.5);">
                  <div style="height:20px;display:flex;align-items:center;gap:4px;padding:0 8px;background:rgba(255,255,255,.06);"><span style="width:5px;height:5px;border-radius:50%;background:#ff6a6a;"></span><span style="width:5px;height:5px;border-radius:50%;background:#f2c94c;"></span><span style="width:5px;height:5px;border-radius:50%;background:#6ee7a0;"></span></div>
                  <div style="padding:14px;background:linear-gradient(160deg,rgba(242,168,75,.12),rgba(20,22,30,.6));"><div style="height:26px;width:70%;border-radius:5px;background:rgba(255,255,255,.14);margin-bottom:10px;"></div><div style="height:10px;width:90%;border-radius:4px;background:rgba(255,255,255,.08);margin-bottom:6px;"></div><div style="height:10px;width:60%;border-radius:4px;background:rgba(255,255,255,.08);margin-bottom:14px;"></div><div style="height:22px;width:96px;border-radius:100px;background:var(--accent,#F2A84B);"></div></div>
                </div>
              </div>
              <div data-scene="4" style="position:absolute;inset:0;opacity:0;transition:opacity .5s;">
                <svg width="100%" height="100%" viewBox="0 0 240 180" fill="none"><circle cx="120" cy="90" r="14" fill="var(--accent,#F2A84B)" opacity="0.9"/><g stroke="var(--accent,#F2A84B)" stroke-width="1.4" stroke-dasharray="6 8" opacity="0.7" style="animation:dvFlow 1.2s linear infinite;"><path d="M10,20 C70,40 90,70 120,90"/><path d="M230,30 C170,50 150,72 120,90"/><path d="M20,160 C80,130 100,110 120,90"/><path d="M225,150 C165,125 145,108 120,90"/><path d="M120,8 L120,76"/></g></svg>
              </div>
              <div data-scene="5" style="position:absolute;inset:0;opacity:0;transition:opacity .5s;padding:20px;">
                <svg width="100%" height="100%" viewBox="0 0 240 160" preserveAspectRatio="none"><defs><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent,#F2A84B)" stop-opacity="0.5"/><stop offset="1" stop-color="var(--accent,#F2A84B)" stop-opacity="0"/></linearGradient></defs><path d="M0,150 L0,120 C40,110 60,80 100,70 C140,60 160,30 200,22 L240,10 L240,160 Z" fill="url(#ar)"/><path d="M0,120 C40,110 60,80 100,70 C140,60 160,30 200,22 L240,10" fill="none" stroke="var(--accent,#F2A84B)" stroke-width="2" stroke-dasharray="500" stroke-dashoffset="500" style="animation:dvDash 2s ease forwards;"/></svg>
              </div>
              <div data-scene="6" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .5s;">
                <div style="position:relative;width:150px;height:150px;">
                  <div style="position:absolute;inset:40%;border-radius:50%;background:var(--accent,#F2A84B);box-shadow:0 0 30px var(--accent,#F2A84B);"></div>
                  <div style="position:absolute;inset:0;border:1px solid rgba(242,168,75,.5);border-radius:50%;animation:dvRing 2.4s infinite;"></div>
                  <div style="position:absolute;inset:0;border:1px solid rgba(242,168,75,.4);border-radius:50%;animation:dvRing 2.4s infinite .6s;"></div>
                  <div style="position:absolute;inset:0;border:1px solid rgba(242,168,75,.3);border-radius:50%;animation:dvRing 2.4s infinite 1.2s;"></div>
                </div>
              </div>
              <div data-scene="7" style="position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;gap:12px;padding:30px 30px 40px;opacity:0;transition:opacity .5s;">
                <div style="width:26px;height:40%;border-radius:5px 5px 0 0;background:rgba(255,255,255,.12);transform-origin:bottom;animation:dvRiseBar 1s ease;"></div>
                <div style="width:26px;height:60%;border-radius:5px 5px 0 0;background:rgba(242,168,75,.4);transform-origin:bottom;animation:dvRiseBar 1s ease .1s;"></div>
                <div style="width:26px;height:80%;border-radius:5px 5px 0 0;background:rgba(242,168,75,.7);transform-origin:bottom;animation:dvRiseBar 1s ease .2s;"></div>
                <div style="width:26px;height:100%;border-radius:5px 5px 0 0;background:var(--accent,#F2A84B);box-shadow:0 0 24px var(--accent,#F2A84B);transform-origin:bottom;animation:dvRiseBar 1s ease .3s;"></div>
              </div>
              <div data-scene="8" style="position:absolute;inset:0;opacity:0;transition:opacity .5s;">
                <svg width="100%" height="100%" viewBox="0 0 240 180"><g stroke="rgba(242,168,75,.4)" stroke-width="1"><line x1="120" y1="90" x2="50" y2="40"/><line x1="120" y1="90" x2="200" y2="46"/><line x1="120" y1="90" x2="40" y2="140"/><line x1="120" y1="90" x2="205" y2="140"/><line x1="120" y1="90" x2="120" y2="26"/><line x1="50" y1="40" x2="120" y2="26"/><line x1="200" y1="46" x2="205" y2="140"/></g><g fill="var(--accent,#F2A84B)"><circle cx="120" cy="90" r="9"/><circle cx="50" cy="40" r="5"/><circle cx="200" cy="46" r="5"/><circle cx="40" cy="140" r="5"/><circle cx="205" cy="140" r="5"/><circle cx="120" cy="26" r="5"/></g></svg>
              </div>
            </div>
          </div>
          <div data-build-text style="position:absolute;inset-inline-end:clamp(24px,5vw,80px);bottom:16vh;max-width:320px;text-align:end;">
            <div data-build-stage style="${monoLabel('letter-spacing:.3em;color:var(--accent,#F2A84B);margin-bottom:10px;')}">${esc(c.build.stage_word)} 01 / 09</div>
            <div data-build-title style="font-family:${FD};font-weight:600;font-size:clamp(24px,3vw,40px);line-height:1.05;color:#fff;margin-bottom:12px;">${esc(build0.t)}</div>
            <div data-build-desc style="font-size:14px;line-height:1.55;color:rgba(245,246,248,.6);">${esc(build0.d)}</div>
          </div>
        </div>
        <div style="display:flex;gap:5px;padding:0 clamp(24px,5vw,80px) 26px;">
          <div data-build-rail aria-hidden="true" style="height:2px;flex:1;background:rgba(255,255,255,.1);border-radius:2px;overflow:hidden;"><div data-build-rail-fill style="height:100%;width:0%;background:var(--accent,#F2A84B);box-shadow:0 0 8px var(--accent,#F2A84B);"></div></div>
        </div>
      </div>
    </section>

    <!-- ACT 05 — SERVICES -->
    <section id="act-services" data-screen-label="Act 05 — Services ecosystem" style="position:relative;height:520vh;">
      <div style="position:sticky;top:0;height:100vh;overflow:hidden;">
        <div style="position:absolute;top:22px;inset-inline-start:clamp(24px,5vw,80px);${monoLabel('letter-spacing:.36em;color:rgba(245,246,248,.5);')}">// ${esc(c.services.label_a)}<span style="color:var(--accent,#F2A84B);">${esc(c.services.label_b)}</span></div>
        <div data-svc-list style="position:absolute;inset-inline-start:clamp(24px,5vw,80px);top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:3px;"></div>
        <div data-svc-reticle aria-hidden="true" style="position:absolute;z-index:4;left:0;top:0;width:0;height:0;pointer-events:none;opacity:0;transition:opacity .45s;">
          <div data-svc-reticle-box style="position:absolute;left:0;top:0;transform:translate(-50%,-50%);width:118px;height:118px;">
            <div style="position:absolute;left:0;top:0;width:20px;height:20px;border-left:1.5px solid var(--accent,#F2A84B);border-top:1.5px solid var(--accent,#F2A84B);"></div>
            <div style="position:absolute;right:0;top:0;width:20px;height:20px;border-right:1.5px solid var(--accent,#F2A84B);border-top:1.5px solid var(--accent,#F2A84B);"></div>
            <div style="position:absolute;left:0;bottom:0;width:20px;height:20px;border-left:1.5px solid var(--accent,#F2A84B);border-bottom:1.5px solid var(--accent,#F2A84B);"></div>
            <div style="position:absolute;right:0;bottom:0;width:20px;height:20px;border-right:1.5px solid var(--accent,#F2A84B);border-bottom:1.5px solid var(--accent,#F2A84B);"></div>
          </div>
          <div style="position:absolute;left:0;top:0;transform:translate(-50%,46px);white-space:nowrap;font-family:${FM};font-size:9px;letter-spacing:.3em;color:var(--accent,#F2A84B);text-transform:uppercase;">◇ <span data-svc-reticle-name>${esc(svc0.name)}</span></div>
        </div>
        <div style="position:absolute;inset-inline-end:clamp(24px,5vw,70px);top:50%;transform:translateY(-50%);width:min(38vw,420px);padding:30px;border-radius:20px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 40px 120px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.06);">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;"><span data-svc-idx style="font-family:${FM};font-size:11px;letter-spacing:.3em;color:var(--accent,#F2A84B);">${esc(c.services.system_word)} 01/12</span><span style="font-family:${FM};font-size:10px;letter-spacing:.2em;color:rgba(245,246,248,.4);text-transform:uppercase;">${esc(c.services.online)}</span></div>
          <h3 data-svc-name style="margin:0;font-family:${FD};font-weight:600;font-size:clamp(28px,3.4vw,46px);line-height:1;color:#fff;">${esc(svc0.name)}</h3>
          <p data-svc-tag style="margin:14px 0 24px;font-size:16px;line-height:1.5;color:rgba(245,246,248,.7);">${esc(svc0.tag)}</p>
          <div data-svc-caps style="display:flex;flex-direction:column;gap:10px;">${svc0.caps.map((cap) => `<div style="display:flex;align-items:center;gap:10px;font-size:13px;color:rgba(245,246,248,.72);"><span style="width:14px;height:1px;background:var(--accent,#F2A84B);"></span>${esc(cap)}</div>`).join('')}</div>
        </div>
        <div aria-hidden="true" style="position:absolute;left:50%;bottom:8vh;transform:translateX(-50%);${monoLabel('font-size:10px;letter-spacing:.3em;color:rgba(245,246,248,.35);')}">◗ ${esc(c.services.traverse)} ◗</div>
      </div>
    </section>

    <!-- ACT 06 — CASES -->
    <section id="act-cases" data-screen-label="Act 06 — Case study dimensions" style="position:relative;height:240vh;">
      <div style="position:sticky;top:0;height:100vh;overflow:hidden;">
        <div style="position:absolute;z-index:3;top:22px;inset-inline-start:clamp(24px,5vw,80px);${monoLabel('letter-spacing:.36em;color:rgba(245,246,248,.6);')}">// ${esc(c.cases.label_a)}<span style="color:var(--accent,#F2A84B);">${esc(c.cases.label_b)}</span></div>
        <div aria-hidden="true" style="position:absolute;z-index:3;top:22px;inset-inline-end:clamp(24px,5vw,80px);display:flex;gap:8px;">
          <span data-case-dot="0" style="width:22px;height:3px;border-radius:2px;background:#fff;transition:all .4s;"></span>
          <span data-case-dot="1" style="width:22px;height:3px;border-radius:2px;background:rgba(255,255,255,.25);transition:all .4s;"></span>
        </div>
        <div data-case-flash aria-hidden="true" style="position:absolute;inset:0;z-index:2;pointer-events:none;opacity:0;mix-blend-mode:screen;background:radial-gradient(60% 60% at 50% 50%, rgba(242,168,75,.33), transparent 70%);transition:opacity .7s ease;"></div>
        <div data-case-track style="position:absolute;top:0;left:0;height:100%;width:200%;display:flex;will-change:transform;">
          ${c.cases.items.map((it, i) => caseWorld(i, it)).join('\n          ')}
        </div>
      </div>
    </section>

    <!-- ACT 07 — STATS -->
    <section id="act-stats" data-screen-label="Act 07 — Stats" style="position:relative;min-height:110vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14vh clamp(24px,5vw,80px);text-align:center;">
      <div data-reveal style="${monoLabel('letter-spacing:.4em;color:var(--accent,#F2A84B);margin-bottom:20px;')}">// ${esc(c.stats.label)}</div>
      <h2 data-reveal style="margin:0 0 60px;font-family:${FD};font-weight:500;font-size:clamp(26px,4vw,56px);line-height:1.05;color:#F5F6F8;">${esc(c.stats.title)}</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:30px 40px;width:100%;max-width:1000px;">
        ${c.stats.items.map((s) => `<div data-reveal><div style="font-family:${FD};font-weight:600;font-size:clamp(30px,4.4vw,58px);line-height:1.02;letter-spacing:-.01em;background:linear-gradient(130deg,#fff,var(--accent,#F2A84B));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">${esc(s.value)}</div><div style="${monoLabel('font-size:11px;letter-spacing:.2em;color:rgba(245,246,248,.5);margin-top:14px;')}">${esc(s.label)}</div></div>`).join('\n        ')}
      </div>
    </section>

    <!-- ACT 08 — CTA -->
    <section id="act-cta" data-screen-label="Act 08 — CTA / Contact" style="position:relative;height:150vh;">
      <div style="position:sticky;top:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 24px;">
        <div aria-hidden="true" style="position:absolute;inset:0;background:radial-gradient(46% 42% at 50% 52%, rgba(5,6,9,.5), transparent 70%);pointer-events:none;"></div>
        <div data-reveal style="position:relative;${monoLabel('letter-spacing:.42em;color:var(--accent,#F2A84B);margin-bottom:26px;')}">// ${esc(c.cta.label)}</div>
        <h2 data-reveal style="position:relative;margin:0;font-family:${FD};font-weight:600;font-size:clamp(38px,7.5vw,116px);line-height:.94;letter-spacing:-.02em;">${esc(c.cta.h2a)}<br><span style="background:linear-gradient(180deg,#fff,var(--accent,#F2A84B));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">${esc(c.cta.h2b)}</span></h2>
        <p data-reveal style="position:relative;max-width:520px;margin:28px auto 0;font-size:16px;line-height:1.6;color:rgba(245,246,248,.62);">${esc(c.cta.sub)}</p>
        <div data-reveal style="position:relative;display:flex;gap:14px;margin-top:38px;flex-wrap:wrap;justify-content:center;align-items:center;">
          <a href="${o.contactHref}" data-magnetic style="display:inline-flex;align-items:center;gap:10px;background:var(--accent,#F2A84B);color:#0a0805;border-radius:100px;padding:17px 34px;font-size:16px;font-weight:600;cursor:pointer;text-decoration:none;box-shadow:0 12px 46px rgba(242,168,75,.34);">${esc(c.cta.btn)} <span aria-hidden="true">→</span></a>
          <a href="mailto:${esc(o.email)}" data-magnetic style="display:inline-flex;align-items:center;gap:10px;color:#fff;font-family:${FM};font-size:14px;letter-spacing:.05em;border-bottom:1px solid rgba(255,255,255,.3);padding-bottom:3px;text-decoration:none;" dir="ltr">${esc(o.email)}</a>
        </div>
        <div data-reveal aria-hidden="true" style="position:relative;display:flex;gap:26px;margin-top:44px;${monoLabel('font-size:10px;letter-spacing:.2em;color:rgba(245,246,248,.4);')}">
          <span>${esc(c.cta.meta[0])}</span><span style="color:rgba(255,255,255,.15);">/</span><span>${esc(c.cta.meta[1])}</span><span style="color:rgba(255,255,255,.15);">/</span><span>${esc(c.cta.meta[2])}</span>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer style="position:relative;z-index:10;padding:70px clamp(24px,5vw,80px) 40px;border-top:1px solid rgba(255,255,255,.07);background:linear-gradient(180deg,transparent,rgba(3,4,6,.7));">
      <div style="display:flex;flex-wrap:wrap;gap:40px;justify-content:space-between;align-items:flex-start;max-width:1300px;margin:0 auto;">
        <div style="max-width:360px;">
          <div data-latin style="font-family:${FD};font-weight:700;font-size:clamp(46px,9vw,120px);line-height:.9;-webkit-text-stroke:1px rgba(255,255,255,.16);color:transparent;">DEVORA</div>
          <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:rgba(245,246,248,.5);">${esc(c.footer.tag)}</p>
        </div>
        <div style="display:flex;gap:56px;flex-wrap:wrap;">
          <div style="display:flex;flex-direction:column;gap:12px;"><div style="${monoLabel('font-size:10px;letter-spacing:.25em;color:rgba(245,246,248,.4);margin-bottom:4px;')}">${esc(c.footer.navigate)}</div>${c.footer.nav.map((nv) => `<a data-goto="act-${nv.k}" href="#act-${nv.k}" style="font-size:14px;color:rgba(245,246,248,.7);cursor:pointer;text-decoration:none;">${esc(nv.label)}</a>`).join('')}</div>
          <div style="display:flex;flex-direction:column;gap:12px;"><div style="${monoLabel('font-size:10px;letter-spacing:.25em;color:rgba(245,246,248,.4);margin-bottom:4px;')}">${esc(c.footer.connect)}</div><a href="mailto:${esc(o.email)}" style="font-size:14px;color:rgba(245,246,248,.7);text-decoration:none;">${esc(c.footer.email_label)}</a><a href="${o.instagramHref}" target="_blank" rel="noopener noreferrer" style="font-size:14px;color:rgba(245,246,248,.7);text-decoration:none;">${esc(c.footer.instagram)}</a></div>
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:14px;justify-content:space-between;align-items:center;max-width:1300px;margin:50px auto 0;padding-top:24px;border-top:1px solid rgba(255,255,255,.06);${monoLabel('font-size:10px;letter-spacing:.15em;color:rgba(245,246,248,.35);')}">
        <span>${esc(c.footer.copy)}</span>
        <span dir="ltr">${esc(c.os_version)}</span>
        <a data-goto="act-hero" href="#act-hero" style="cursor:pointer;color:var(--accent,#F2A84B);text-decoration:none;">↑ ${esc(c.footer.back)}</a>
      </div>
    </footer>

  </main>
`;
}
