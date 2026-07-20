/* eslint-disable @typescript-eslint/no-explicit-any */
// DEVORA OS — WebGL universe controller.
//
// Ported from the DEVORA.dc.html design-canvas prototype (its DCLogic class),
// rewritten as a framework-agnostic controller so the React homepage can mount
// it against a plain DOM subtree:
//
//   const u = new DevoraUniverse(rootEl, {accent, quality, grain, reducedMotion, copy});
//   // ... on unmount:
//   u.destroy();
//
// three / gsap / lenis are dynamically imported (kept out of the initial bundle
// and off the critical path). A prefers-reduced-motion run skips WebGL, smooth
// scroll and heavy animation entirely while keeping the page fully functional.

export type Quality = 'Cinematic' | 'Balanced' | 'Performance';

export interface DevoraCopy {
  services: {
    items: {name: string; tag: string; caps: string[]}[];
    system_word?: string;
    online?: string;
  };
  build: {stages: {t: string; d: string}[]; stage_word?: string};
  act_labels: Record<string, string>;
}

export interface DevoraOptions {
  accent?: string;
  quality?: Quality;
  grain?: boolean;
  reducedMotion?: boolean;
  copy: DevoraCopy;
}

// Per-service planet colours + per-case scene tints stay in code (language-neutral).
const SERVICE_COLORS = [
  '#F2A84B', '#FF8A3C', '#FFC46B', '#6FD3FF', '#7CF0C6', '#FF6A9C',
  '#9B8CFF', '#FFD36B', '#37E0A0', '#62E0FF', '#B0A0FF', '#FFB24D',
];
// One 3D scene tint per real case (gold, cyan, pink, violet). Keep parallel to
// `CASE_HEX` below and markup `CASE_META`.
const CASE_COLORS = [
  [1.0, 0.72, 0.4], [0.46, 0.84, 1.0], [1.0, 0.42, 0.61], [0.61, 0.55, 1.0],
];
// Same accents as hex, for the DOM dots/flash.
const CASE_HEX = ['#F2A84B', '#6FD3FF', '#FF6A9C', '#9B8CFF'];

export class DevoraUniverse {
  root: HTMLElement;
  canvas: HTMLCanvasElement | null;
  copy: DevoraCopy;
  accent: string;
  quality: Quality;
  grainOn: boolean;
  reducedMotion: boolean;

  // libs (filled by loadLibs)
  THREE: any = null;
  gsap: any = null;
  ScrollTrigger: any = null;
  Lenis: any = null;

  // three objects (typed loosely — integration glue)
  [key: string]: any;

  SERVICES: {name: string; tag: string; caps: string[]; color: string}[];
  BUILD: {t: string; d: string}[];
  CASE_COLORS = CASE_COLORS;

  destroyed = false;
  mouse = {x: 0, y: 0, tx: 0, ty: 0};
  cur: {x: number; y: number; rx: number; ry: number};
  acts: Record<string, number> = {};
  active = 'hero';
  lastActive: string | null = null;
  lastSvc = -1;
  soundOn = false;
  t = 0;

  private _preIv: any = null;
  private _inited = false;
  private _err = 0;
  private _onResize: () => void;

  constructor(root: HTMLElement, opts: DevoraOptions) {
    this.root = root;
    this.canvas = root.querySelector<HTMLCanvasElement>('[data-canvas]');
    this.copy = opts.copy;
    this.accent = opts.accent || '#F2A84B';
    this.quality = opts.quality || 'Balanced';
    this.grainOn = opts.grain !== false;
    this.reducedMotion = !!opts.reducedMotion;
    this.cur = {
      x: window.innerWidth / 2, y: window.innerHeight / 2,
      rx: window.innerWidth / 2, ry: window.innerHeight / 2,
    };

    this.SERVICES = this.copy.services.items.map((s, i) => ({
      ...s, color: SERVICE_COLORS[i] || '#F2A84B',
    }));
    this.BUILD = this.copy.build.stages;

    try {
      this.root.style.setProperty('--accent', this.accent);
    } catch {}
    if (!this.grainOn) {
      const g = this.q('[data-grain]');
      if (g) g.style.display = 'none';
    }

    this.buildServiceList();
    this._onResize = () => this.onResize();
    window.addEventListener('resize', this._onResize);

    if (this.reducedMotion) {
      // No preloader theatre, no libs — go straight to a static, readable page.
      this.init();
    } else {
      this.startPreload();
      // Cap how long the preloader can cover the server-rendered hero: reveal it
      // fast and let the WebGL fade in whenever the libraries finish loading,
      // rather than blocking the first paint behind the Three.js download.
      this._preloaderMax = window.setTimeout(() => {
        if (!this.destroyed) {
          this._preloaderEarly = true;
          this.hidePreloader();
        }
      }, 1800);
      this.loadLibs();
    }
  }

  destroy() {
    this.destroyed = true;
    try {
      cancelAnimationFrame(this.rafId);
    } catch {}
    try {
      clearInterval(this._preIv);
    } catch {}
    try {
      clearTimeout(this._preloaderMax);
    } catch {}
    window.removeEventListener('resize', this._onResize);
    try {
      if (this.renderer) this.renderer.dispose();
    } catch {}
    try {
      if (this.lenis) this.lenis.destroy();
    } catch {}
    try {
      if (this.gsap) this.gsap.ticker.remove(this._tick);
    } catch {}
    try {
      if (this.ScrollTrigger) this.ScrollTrigger.getAll().forEach((s: any) => s.kill());
    } catch {}
    try {
      if (this.audioCtx) this.audioCtx.close();
    } catch {}
  }

  /* ---------- helpers ---------- */
  q<T extends HTMLElement = HTMLElement>(s: string): T | null {
    return this.root ? this.root.querySelector<T>(s) : null;
  }
  qa<T extends HTMLElement = HTMLElement>(s: string): T[] {
    return this.root ? Array.from(this.root.querySelectorAll<T>(s)) : [];
  }
  clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v));
  }
  lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }
  hexToRgb(h: string) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  startPreload() {
    const bar = this.q('[data-preload-bar]'), num = this.q('[data-preload-num]');
    let p = 0;
    const iv = setInterval(() => {
      p = Math.min(100, p + Math.random() * 14);
      if (bar) bar.style.width = p + '%';
      if (num) num.textContent = String(Math.floor(p));
      if (p >= 100) clearInterval(iv);
    }, 130);
    this._preIv = iv;
  }
  hidePreloader() {
    const pl = this.q('[data-preloader]');
    if (!pl || pl.style.display === 'none') return;
    const bar = this.q('[data-preload-bar]'), num = this.q('[data-preload-num]');
    if (bar) bar.style.width = '100%';
    if (num) num.textContent = '100';
    clearInterval(this._preIv);
    if (this.gsap && !this.reducedMotion) {
      this.gsap.to(pl, {
        opacity: 0, duration: 0.7, delay: 0.15, ease: 'power2.out',
        onComplete: () => {
          pl.style.display = 'none';
        },
      });
    } else {
      pl.style.transition = 'opacity .4s';
      pl.style.opacity = '0';
      setTimeout(() => {
        pl.style.display = 'none';
      }, this.reducedMotion ? 60 : 450);
    }
    // Hard fallback: gsap's fade (and the CSS dvSafety fade) both run on rAF,
    // which the browser PAUSES while the tab is hidden — a page opened in a
    // background tab would otherwise keep the preloader up. A plain setTimeout
    // still fires when hidden, so force the frame away regardless.
    setTimeout(() => {
      pl.style.display = 'none';
    }, 2200);
  }

  async loadLibs() {
    try {
      const [THREE, gsapMod, stMod, lenisMod] = await Promise.all([
        import('three'),
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('lenis'),
      ]);
      this.THREE = THREE;
      this.gsap = (gsapMod as any).gsap || (gsapMod as any).default || gsapMod;
      this.ScrollTrigger =
        (stMod as any).ScrollTrigger || (stMod as any).default || stMod;
      this.Lenis = (lenisMod as any).default || lenisMod;
    } catch (e) {
      console.warn('devora: library load failed — degrading gracefully', e);
    }
    if (!this.destroyed) this.init();
    // Safety: if something above hangs, still reveal the page.
    setTimeout(() => {
      if (!this._inited && !this.destroyed) this.init();
    }, 12000);
  }

  init() {
    if (this._inited) return;
    this._inited = true;
    const motionOK = !this.reducedMotion;

    if (this.gsap && this.ScrollTrigger && motionOK) {
      try {
        this.gsap.registerPlugin(this.ScrollTrigger);
      } catch {}
    }
    if (this.THREE && motionOK) {
      try {
        this.setupThree();
      } catch (e) {
        console.warn('devora: three setup failed', e);
      }
    }
    this.setupScroll();
    this.setupCursor();
    this.setupNav();
    this.setupReveals();
    this.setupCounters();
    this.setupSound();
    this.setupMagnetic();

    if (motionOK) {
      this.startLoop();
    } else {
      this.bindStaticScroll();
    }

    setTimeout(() => this.measure(), 300);
    setTimeout(() => this.measure(), 1200);
    this.hidePreloader();

    if (this.gsap && motionOK && !this._preloaderEarly) {
      // Skip the entrance if the hero was already revealed by the preloader cap
      // (slow load) — otherwise it would re-fade from 0 and flash.
      this.gsap.from(this.qa('#act-hero [data-reveal]'), {
        y: 44, opacity: 0, duration: 1.1, stagger: 0.13, ease: 'power3.out', delay: 0.5,
      });
    }
    const hc = this.q('[data-hud-center]');
    if (hc) hc.style.display = 'flex';
  }

  /* ---------- THREE ---------- */
  setupThree() {
    const THREE = this.THREE;
    const nav = navigator as Navigator & {deviceMemory?: number};
    const mobile =
      window.innerWidth < 820 ||
      (window.matchMedia && window.matchMedia('(pointer:coarse)').matches);
    // Cut GPU/fill cost on phones and low-core / low-memory machines.
    const lowPower =
      mobile || (nav.hardwareConcurrency || 8) <= 4 || (nav.deviceMemory || 8) <= 4;
    const counts =
      this.quality === 'Cinematic' ? {u: 9600, d: 1700, det: 5}
      : this.quality === 'Performance' ? {u: 3000, d: 600, det: 2}
      : {u: 6000, d: 1100, det: 4};
    if (lowPower) {
      counts.u = Math.min(counts.u, 4200);
      counts.d = Math.min(counts.d, 800);
      counts.det = Math.min(counts.det, 3);
    }
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !lowPower && this.quality !== 'Performance',
      alpha: true,
      powerPreference: 'high-performance',
      // preserveDrawingBuffer was only needed for the design-canvas export;
      // in production it forces an extra buffer copy every frame.
      preserveDrawingBuffer: false,
    });
    this.renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
        lowPower ? 1.4 : this.quality === 'Performance' ? 1.3 : 1.9
      )
    );
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60, window.innerWidth / window.innerHeight, 0.01, 300
    );
    this.camera.position.set(0, 0.5, 6.4);
    this.tPos = new THREE.Vector3(0, 0.5, 6.4);
    this.tLook = new THREE.Vector3(0, 0, 0);
    this.curLook = new THREE.Vector3(0, 0, 0);
    this.tFov = 60;
    this.clock = new THREE.Clock();
    this.acol = new THREE.Color(this.accent);
    this.uniTint = new THREE.Color(1, 1, 1);
    this.buildCore(counts.det);
    this.buildUniverse(counts.u);
    this.buildDust(counts.d);
    this.buildBeams();
    this.buildPlanets();
    this.scene.add(this.camera);
    this.buildWarp();
    this.buildCrystals();
  }

  glowTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d')!;
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,.7)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    return new this.THREE.CanvasTexture(c);
  }

  buildCore(det: number) {
    const THREE = this.THREE;
    this.core = new THREE.Group();
    const SN = `vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
    float snoise(vec3 v){const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}`;
    this.coreMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: {value: 0}, uAmp: {value: 0.34}, uAccent: {value: this.acol.clone()},
        uHot: {value: new THREE.Color('#3a2a14')}, uDeep: {value: new THREE.Color('#0a0b10')},
        uOpacity: {value: 1}, uGold: {value: 0},
      },
      vertexShader: SN + `uniform float uTime,uAmp;varying float vN;varying vec3 vNw;varying vec3 vV;void main(){vec3 p=position;float n=snoise(normalize(position)*1.5+uTime*0.22);float n2=snoise(normalize(position)*3.4-uTime*0.16)*0.5;float d=(n+n2)*uAmp;p+=normal*d;vN=d;vec4 mv=modelViewMatrix*vec4(p,1.0);vV=-mv.xyz;vNw=normalMatrix*normal;gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `uniform vec3 uAccent,uHot,uDeep;uniform float uOpacity,uGold;varying float vN;varying vec3 vNw;varying vec3 vV;void main(){vec3 N=normalize(vNw);vec3 V=normalize(vV);float f=pow(1.0-max(dot(N,V),0.0),2.4);vec3 base=mix(uDeep,uHot,smoothstep(-0.3,0.6,vN));vec3 col=base+uAccent*f*(1.5+uGold*1.2)+uAccent*max(vN,0.0)*(0.7+uGold);float a=clamp(0.45+f,0.0,1.0)*uOpacity;gl_FragColor=vec4(col,a);}`,
      transparent: true, depthWrite: false, blending: THREE.NormalBlending,
    });
    this.coreMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, det), this.coreMat);
    this.core.add(this.coreMesh);
    this.glowMat = new THREE.ShaderMaterial({
      uniforms: {uAccent: {value: this.acol.clone()}, uOpacity: {value: 1}},
      vertexShader: `varying vec3 vNw;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vV=-mv.xyz;vNw=normalMatrix*normal;gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `uniform vec3 uAccent;uniform float uOpacity;varying vec3 vNw;varying vec3 vV;void main(){vec3 N=normalize(vNw);vec3 V=normalize(vV);float f=pow(1.0-max(dot(N,V),0.0),3.0);gl_FragColor=vec4(uAccent,f*uOpacity*0.9);}`,
      transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.glow = new THREE.Mesh(new THREE.SphereGeometry(1.75, 48, 48), this.glowMat);
    this.core.add(this.glow);
    this.innerMat = new THREE.MeshBasicMaterial({
      color: this.acol.clone(), transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.inner = new THREE.Mesh(new THREE.SphereGeometry(0.45, 32, 32), this.innerMat);
    this.core.add(this.inner);
    const wireGeo = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.15, 1));
    this.wireMat = new THREE.LineBasicMaterial({
      color: this.acol.clone(), transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending,
    });
    this.wire = new THREE.LineSegments(wireGeo, this.wireMat);
    this.core.add(this.wire);
    this.rings = [];
    const _rs = [[2.4, 0.011], [2.82, 0.009], [3.2, 0.007]];
    _rs.forEach((rr, i) => {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(rr[0], rr[1], 8, 150),
        new THREE.MeshBasicMaterial({
          color: this.acol.clone(), transparent: true, opacity: 0.4,
          blending: THREE.AdditiveBlending, depthWrite: false,
        })
      );
      m.rotation.x = Math.PI / 2 + (i - 1) * 0.42;
      m.rotation.y = i * 0.6;
      m.userData = {sx: (0.05 + i * 0.03) * (i % 2 ? 1 : -1), sy: 0.05 - i * 0.012};
      this.core.add(m);
      this.rings.push(m);
    });
    this.bloomMat = new THREE.SpriteMaterial({
      map: this.glowTexture(), color: this.acol.clone(), transparent: true,
      opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.bloom = new THREE.Sprite(this.bloomMat);
    this.bloom.scale.set(7.5, 7.5, 1);
    this.bloom.renderOrder = -3;
    this.core.add(this.bloom);
    this.scene.add(this.core);
  }

  makePoints(n: number, rMin: number, rMax: number) {
    const THREE = this.THREE;
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3),
      siz = new Float32Array(n), seed = new Float32Array(n);
    const white = [1, 1, 1], acc = this.hexToRgb(this.accent), cyan = [0.55, 0.85, 1.0];
    for (let i = 0; i < n; i++) {
      const u = Math.random(), v = Math.random();
      const th = u * Math.PI * 2, ph = Math.acos(2 * v - 1);
      const r = rMin + Math.pow(Math.random(), 0.6) * (rMax - rMin);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph) * 0.7;
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      const pick = Math.random();
      const c = pick > 0.86 ? acc : pick > 0.72 ? cyan : white;
      col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
      siz[i] = 0.5 + Math.random() * 1.8;
      seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uTime: {value: 0}, uSize: {value: 0.12}, uPix: {value: this.renderer.getPixelRatio()},
        uOpacity: {value: 1}, uTint: {value: new THREE.Color(1, 1, 1)},
      },
      vertexShader: `uniform float uTime,uSize,uPix;attribute float aSize,aSeed;attribute vec3 aColor;varying vec3 vC;varying float vT;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);float tw=0.55+0.45*sin(uTime*1.4+aSeed*6.28);gl_PointSize=aSize*uSize*uPix*(300.0/max(-mv.z,0.001));gl_Position=projectionMatrix*mv;vC=aColor;vT=tw;}`,
      fragmentShader: `uniform float uOpacity;uniform vec3 uTint;varying vec3 vC;varying float vT;void main(){vec2 c=gl_PointCoord-0.5;float d=length(c);if(d>0.5)discard;float a=smoothstep(0.5,0.0,d);gl_FragColor=vec4(vC*uTint*(0.6+vT*0.7),a*uOpacity*vT);}`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    return new THREE.Points(g, m);
  }
  buildUniverse(n: number) {
    this.universe = this.makePoints(n, 12, 62);
    this.universe.material.uniforms.uSize.value = 0.13;
    this.scene.add(this.universe);
  }
  buildDust(n: number) {
    this.dust = this.makePoints(n, 1.8, 8);
    this.dust.material.uniforms.uSize.value = 0.16;
    this.scene.add(this.dust);
  }

  buildBeams() {
    const THREE = this.THREE;
    this.beams = new THREE.Group();
    const mat = () => new THREE.ShaderMaterial({
      uniforms: {uAccent: {value: this.acol.clone()}, uOpacity: {value: 1}},
      vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `uniform vec3 uAccent;uniform float uOpacity;varying vec2 vUv;void main(){float len=smoothstep(0.0,0.15,vUv.y)*smoothstep(1.0,0.82,vUv.y);float wid=smoothstep(0.5,0.0,abs(vUv.x-0.5));gl_FragColor=vec4(uAccent,len*wid*uOpacity*0.5);}`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 26), mat());
      p.rotation.z = (i * Math.PI) / 4 + 0.3;
      p.rotation.x = i * 0.5;
      this.beams.add(p);
    }
    this.scene.add(this.beams);
  }

  buildWarp() {
    const THREE = this.THREE;
    const N = this.quality === 'Performance' ? 120 : this.quality === 'Cinematic' ? 340 : 220;
    this.warpN = N;
    this.warpData = [];
    const pos = new Float32Array(N * 2 * 3);
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2, rad = 1.2 + Math.random() * 24;
      this.warpData.push({
        x: Math.cos(a) * rad, y: (Math.random() - 0.5) * 22, z: -Math.random() * 72,
        len: 0.6 + Math.random() * 2.4, spd: 22 + Math.random() * 46,
      });
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.LineBasicMaterial({
      color: this.acol.clone(), transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.warp = new THREE.LineSegments(g, m);
    this.warp.frustumCulled = false;
    this.warp.visible = false;
    this.warpGeo = g;
    this.camera.add(this.warp);
  }
  buildCrystals() {
    const THREE = this.THREE;
    this.crystals = new THREE.Group();
    const N = this.quality === 'Performance' ? 5 : 9;
    for (let i = 0; i < N; i++) {
      const edges = new THREE.EdgesGeometry(
        new THREE.OctahedronGeometry(0.26 + Math.random() * 0.5, 0)
      );
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color: this.acol.clone(), transparent: true, opacity: 0,
          blending: THREE.AdditiveBlending, depthWrite: false,
        })
      );
      const a = Math.random() * Math.PI * 2, rad = 4.5 + Math.random() * 7;
      line.position.set(Math.cos(a) * rad, (Math.random() - 0.5) * 6, Math.sin(a) * rad);
      line.userData = {
        rx: (Math.random() - 0.5) * 0.35, ry: (Math.random() - 0.5) * 0.35,
        bob: Math.random() * 6.28, baseY: line.position.y,
      };
      this.crystals.add(line);
    }
    this.scene.add(this.crystals);
  }

  buildPlanets() {
    const THREE = this.THREE;
    this.planets = new THREE.Group();
    this.planetNodes = [];
    const R = 4.2, tex = this.glowTexture();
    this.SERVICES.forEach((s, i) => {
      const a = (i / this.SERVICES.length) * Math.PI * 2;
      const node = new THREE.Group();
      node.position.set(Math.cos(a) * R, i % 2 ? 0.5 : -0.5, Math.sin(a) * R);
      node.userData.a = a;
      node.userData.bob = Math.random() * 6.28;
      const col = new THREE.Color(s.color);
      const sph = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 26, 26), new THREE.MeshBasicMaterial({color: col})
      );
      node.add(sph);
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tex, color: col, transparent: true, opacity: 0.9,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      spr.scale.set(1.7, 1.7, 1);
      node.add(spr);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.44, 0.47, 40),
        new THREE.MeshBasicMaterial({
          color: col, transparent: true, opacity: 0.5, side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending, depthWrite: false,
        })
      );
      ring.rotation.x = Math.PI / 2.2;
      node.add(ring);
      const ring2 = new THREE.Mesh(
        new THREE.RingGeometry(0.56, 0.585, 44),
        new THREE.MeshBasicMaterial({
          color: col, transparent: true, opacity: 0.2, side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending, depthWrite: false,
        })
      );
      ring2.rotation.x = Math.PI / 1.7;
      ring2.rotation.y = 0.6;
      node.add(ring2);
      let moon: any = null;
      if (i % 3 === 0) {
        moon = new THREE.Group();
        const mm = new THREE.Mesh(
          new THREE.SphereGeometry(0.065, 12, 12), new THREE.MeshBasicMaterial({color: col})
        );
        mm.position.x = 0.66;
        moon.add(mm);
        moon.rotation.x = 0.5;
        node.add(moon);
      }
      node.userData.core = sph;
      node.userData.spr = spr;
      node.userData.ring = ring;
      node.userData.ring2 = ring2;
      node.userData.moon = moon;
      node.userData.col = col;
      this.planets.add(node);
      this.planetNodes.push(node);
    });
    const ptsArr = [];
    for (let i = 0; i <= 120; i++) {
      const a = (i / 120) * Math.PI * 2;
      ptsArr.push(new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R));
    }
    const trail = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(ptsArr),
      new THREE.LineBasicMaterial({
        color: this.acol.clone(), transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending,
      })
    );
    this.planets.add(trail);
    this.spokes = [];
    this.planetNodes.forEach((n: any) => {
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0), n.position.clone(),
      ]);
      const l = new THREE.Line(
        g,
        new THREE.LineBasicMaterial({
          color: this.acol.clone(), transparent: true, opacity: 0.05,
          blending: THREE.AdditiveBlending, depthWrite: false,
        })
      );
      this.planets.add(l);
      this.spokes.push(l);
    });
    this.planets.scale.setScalar(0.001);
    this.planets.visible = false;
    this.scene.add(this.planets);
  }

  applyAccent3D() {
    if (!this.THREE) return;
    const c = new this.THREE.Color(this.accent);
    try {
      this.acol.copy(c);
      if (this.coreMat) this.coreMat.uniforms.uAccent.value.copy(c);
      if (this.glowMat) this.glowMat.uniforms.uAccent.value.copy(c);
      if (this.innerMat) this.innerMat.color.copy(c);
      if (this.wireMat) this.wireMat.color.copy(c);
      if (this.beams) this.beams.children.forEach((b: any) => b.material.uniforms && b.material.uniforms.uAccent.value.copy(c));
      if (this.rings) this.rings.forEach((m: any) => m.material.color.copy(c));
      if (this.bloomMat) this.bloomMat.color.copy(c);
      if (this.warp) this.warp.material.color.copy(c);
      if (this.crystals) this.crystals.children.forEach((l: any) => l.material.color.copy(c));
    } catch {}
  }

  /* ---------- SCROLL ---------- */
  setupScroll() {
    if (this.Lenis && !this.reducedMotion) {
      try {
        this.lenis = new this.Lenis({lerp: 0.09, wheelMultiplier: 1.0, smoothWheel: true});
        if (this.gsap) {
          this._tick = (time: number) => {
            this.lenis.raf(time * 1000);
          };
          this.gsap.ticker.add(this._tick);
          this.gsap.ticker.lagSmoothing(0);
          if (this.ScrollTrigger) this.lenis.on('scroll', this.ScrollTrigger.update);
        } else {
          const raf = (t: number) => {
            this.lenis.raf(t);
            requestAnimationFrame(raf);
          };
          requestAnimationFrame(raf);
        }
      } catch {
        this.lenis = null;
      }
    }
    this.measure();
  }
  measure() {
    const names = ['hero', 'dive', 'manifesto', 'build', 'services', 'cases', 'stats', 'cta'];
    this.sections = names
      .map((n) => {
        const el = this.q('#act-' + n);
        return el ? {name: n, top: el.offsetTop, h: el.offsetHeight} : null;
      })
      .filter(Boolean);
    this.docH = document.documentElement.scrollHeight;
    if (this.ScrollTrigger) {
      try {
        this.ScrollTrigger.refresh();
      } catch {}
    }
  }
  getScroll() {
    return this.lenis ? this.lenis.scroll : window.scrollY || window.pageYOffset || 0;
  }
  updateScroll() {
    if (!this.sections) return;
    const y = this.getScroll(), vh = window.innerHeight, mid = y + vh * 0.5;
    let active = this.sections[0].name;
    for (const s of this.sections) {
      if (mid >= s.top && mid < s.top + s.h) active = s.name;
      const travel = Math.max(s.h - vh, 1);
      this.acts[s.name] = this.clamp((y - s.top) / travel, 0, 1);
    }
    this.active = active;
    const gp = this.clamp(y / Math.max(this.docH - vh, 1), 0, 1);
    const pn = this.q('[data-progress-num]'), pb = this.q('[data-progress]');
    if (pn) pn.textContent = String(Math.round(gp * 100));
    if (pb) pb.style.width = gp * 100 + '%';
    const cx = this.q('[data-coord-x]'), cy = this.q('[data-coord-y]');
    if (cx) cx.textContent = (this.mouse.x * 40 + 20).toFixed(2);
    if (cy) cy.textContent = (this.mouse.y * 40 + 20).toFixed(2);
    const cue = this.q('[data-scrollcue]');
    if (cue) cue.style.opacity = y > 140 ? '0' : '1';
    if (active !== this.lastActive) {
      this.onActChange(active);
      this.lastActive = active;
    }
    this.updateDive();
    this.updateServicesDOM();
    this.updateCasesDOM();
    this.updateBuildDOM();
  }
  onActChange(a: string) {
    const labels = this.copy.act_labels;
    const el = this.q('[data-hud-act]');
    if (el) el.textContent = labels[a] || a;
    this.qa('[data-rail]').forEach((r) => {
      const on =
        r.getAttribute('data-rail') === a ||
        (a === 'dive' && r.getAttribute('data-rail') === 'hero') ||
        (a === 'stats' && r.getAttribute('data-rail') === 'cases');
      const dot = r.querySelector<HTMLElement>('[data-rail-dot]'),
        lab = r.querySelector<HTMLElement>('[data-rail-label]');
      if (dot) {
        dot.style.background = on ? 'var(--accent,#F2A84B)' : 'transparent';
        dot.style.borderColor = on ? 'var(--accent,#F2A84B)' : 'rgba(245,246,248,.35)';
        dot.style.boxShadow = on ? '0 0 10px var(--accent,#F2A84B)' : 'none';
        dot.style.transform = on ? 'scale(1.3)' : 'scale(1)';
      }
      if (lab) lab.style.opacity = on ? '1' : '0';
      r.style.color = on ? '#fff' : 'rgba(245,246,248,.35)';
    });
    if (this.soundOn) this.blip();
  }

  updateDive() {
    const p = this.acts.dive || 0;
    const vw = window.innerWidth, vh = window.innerHeight;
    const R = Math.min(vw, vh) * 0.42;
    const center = this.q('[data-dive-center]'), out = this.q('[data-dive-out]');
    if (center) center.style.opacity = String(this.clamp(1 - p * 1.6, 0, 1));
    if (out) out.style.opacity = String(this.clamp((p - 0.7) / 0.25, 0, 1));
    const shards = this.qa('[data-shard]');
    shards.forEach((s, i) => {
      const a = (i / shards.length) * Math.PI * 2 - Math.PI / 2;
      const e = this.clamp((p - 0.5) / 0.4, 0, 1);
      const ee = e * e * (3 - 2 * e);
      const dist = ee * R;
      const x = Math.cos(a) * dist, yy = Math.sin(a) * dist * 0.82;
      const op = this.clamp((p - 0.52) / 0.18, 0, 1) * this.clamp(1 - (p - 0.95) / 0.05, 0, 1);
      s.style.transform = `translate(-50%,-50%) translate(${x}px,${yy}px) scale(${0.6 + ee * 0.5}) rotate(${(i % 2 ? 1 : -1) * ee * 8}deg)`;
      s.style.opacity = String(op);
    });
  }

  buildServiceList() {
    const list = this.q('[data-svc-list]');
    if (!list) return;
    list.innerHTML = this.SERVICES.map(
      (s, i) =>
        `<div data-svc="${i}" style="display:flex;align-items:center;gap:10px;padding:5px 0;transition:all .3s;opacity:.4;"><span style="width:5px;height:5px;border-radius:50%;background:${s.color};transition:all .3s;"></span><span style="font-family:var(--font-mono),'Space Mono',monospace;font-size:12px;letter-spacing:.06em;color:rgba(245,246,248,.8);">${String(i + 1).padStart(2, '0')} ${s.name}</span></div>`
    ).join('');
  }
  updateServicesDOM() {
    if (this.active !== 'services') return;
    const p = this.acts.services || 0;
    const idx = this.clamp(Math.round(p * (this.SERVICES.length - 1)), 0, this.SERVICES.length - 1);
    if (idx === this.lastSvc) return;
    this.lastSvc = idx;
    const s = this.SERVICES[idx];
    const setT = (sel: string, v: string) => {
      const e = this.q(sel);
      if (e) e.textContent = v;
    };
    setT('[data-svc-idx]', `${this.copy.services.system_word ?? 'SYSTEM'} ${String(idx + 1).padStart(2, '0')}/12`);
    setT('[data-svc-name]', s.name);
    setT('[data-svc-tag]', s.tag);
    const caps = this.q('[data-svc-caps]');
    if (caps) {
      caps.innerHTML = s.caps
        .map(
          (c) =>
            `<div style="display:flex;align-items:center;gap:10px;font-size:13px;color:rgba(245,246,248,.72);"><span style="width:14px;height:1px;background:${s.color};"></span>${c}</div>`
        )
        .join('');
    }
    const nm = this.q('[data-svc-name]');
    if (nm) nm.style.color = s.color;
    const rtl = getComputedStyle(this.root).direction === 'rtl';
    this.qa('[data-svc]').forEach((el) => {
      const on = +el.getAttribute('data-svc')! === idx;
      el.style.opacity = on ? '1' : '0.4';
      el.style.transform = on ? `translateX(${rtl ? -8 : 8}px)` : 'none';
      (el.querySelector('span:last-child') as HTMLElement).style.color = on ? '#fff' : 'rgba(245,246,248,.8)';
      (el.querySelector('span:first-child') as HTMLElement).style.boxShadow = on ? `0 0 10px ${s.color}` : 'none';
      (el.querySelector('span:first-child') as HTMLElement).style.transform = on ? 'scale(1.6)' : 'scale(1)';
    });
    if (this.soundOn) this.blip(660 + idx * 20);
  }

  updateBuildDOM() {
    if (this.active !== 'build') return;
    const p = this.acts.build || 0;
    const idx = this.clamp(Math.floor(p * 9), 0, 8);
    const fill = this.q('[data-build-rail-fill]');
    if (fill) fill.style.width = p * 100 + '%';
    if (idx === this.lastBuild) return;
    this.lastBuild = idx;
    const b = this.BUILD[idx];
    const num = this.q('[data-build-num]');
    if (num) num.textContent = String(idx + 1).padStart(2, '0');
    const st = this.q('[data-build-stage]');
    if (st) st.textContent = `${this.copy.build.stage_word ?? 'Stage'} ${String(idx + 1).padStart(2, '0')} / 09`;
    const ti = this.q('[data-build-title]');
    if (ti) ti.textContent = b.t;
    const de = this.q('[data-build-desc]');
    if (de) de.textContent = b.d;
    this.qa('[data-scene]').forEach((sc) => {
      sc.style.opacity = +sc.getAttribute('data-scene')! === idx ? '1' : '0';
    });
    if (this.soundOn) this.blip(500 + idx * 30);
  }

  updateCasesDOM() {
    if (this.active !== 'cases') return;
    const p = this.acts.cases || 0;
    // Derived from the rendered dots so adding a case needs no change here.
    const dots = this.qa('[data-case-dot]');
    const N = dots.length || 1;
    const colors = CASE_HEX;
    const track = this.q('[data-case-track]');
    const rtl = getComputedStyle(this.root).direction === 'rtl';
    // The track is `left:0` and N*100% wide, but a `direction:rtl` flex row lays
    // world 01 at the FAR RIGHT. So RTL has to start scrolled fully left (-span)
    // and travel back to 0, rather than mirroring the LTR sign — mirroring parks
    // world 01 off-screen and scrolls into empty space, showing only one case.
    const span = ((N - 1) / N) * 100;
    if (track) {
      track.style.transform = `translateX(${rtl ? span * (p - 1) : -span * p}%)`;
    }
    const focus = this.clamp(Math.round(p * (N - 1)), 0, N - 1);
    dots.forEach((d) => {
      const i = +d.getAttribute('data-case-dot')!;
      const on = i === focus;
      d.style.background = on ? colors[i] || '#F2A84B' : 'rgba(255,255,255,.25)';
      d.style.width = on ? '34px' : '22px';
      d.style.boxShadow = on ? `0 0 10px ${colors[i]}` : 'none';
    });
    if (focus !== this._lastCaseFocus) {
      this._lastCaseFocus = focus;
      const fl = this.q('[data-case-flash]');
      if (fl) {
        const c = colors[focus] || '#F2A84B';
        fl.style.background = `radial-gradient(60% 60% at 50% 50%, ${c}55, transparent 70%)`;
        fl.style.transition = 'none';
        fl.style.opacity = '0.8';
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            fl.style.transition = 'opacity .75s ease';
            fl.style.opacity = '0';
          })
        );
      }
      if (this.soundOn) this.blip(340 + focus * 45);
    }
    this.caseFocus = focus;
  }

  /* ---------- CAMERA / OBJECTS ---------- */
  computeTargets() {
    const t = this.t, A = this.active, acts = this.acts;
    let px = 0, py = 0.5, pz = 6.4;
    const lx = 0, ly = 0, lz = 0;
    let fov = 60;
    let coreDim = 1, beamOp = 1, dustOp = 1;
    const uniOp = 1;
    let planetK = 0, gold = 0, tint = [1, 1, 1];
    const ei = (x: number) => x * x;
    if (A === 'hero') {
      const p = acts.hero || 0;
      const a = t * 0.05, r = 6.4 - p * 0.5;
      px = Math.sin(a) * r; pz = Math.cos(a) * r; py = 0.5 + Math.sin(t * 0.3) * 0.15;
    } else if (A === 'dive') {
      const p = acts.dive || 0;
      const a = t * 0.05;
      let r;
      if (p < 0.8) r = 6.4 - ei(p / 0.8) * 6.15;
      else r = 0.25 + ((p - 0.8) / 0.2) * 3.0;
      px = Math.sin(a) * r; pz = Math.cos(a) * r; py = 0.4 * (1 - p);
      fov = 60 + (p < 0.8 ? (p / 0.8) * 38 : (1 - (p - 0.8) / 0.2) * 38);
      coreDim = p < 0.86 ? 1 : this.clamp(1 - (p - 0.86) / 0.14, 0, 1);
      beamOp = 0.6;
    } else if (A === 'manifesto') {
      const a = t * 0.03, r = 11;
      px = Math.sin(a) * r; pz = Math.cos(a) * r; py = 1.4; fov = 55; coreDim = 0.55; dustOp = 0.3; beamOp = 0.2;
    } else if (A === 'build') {
      const p = acts.build || 0, r = 9 - p * 1.4;
      px = Math.sin(0.55) * r; pz = Math.cos(0.55) * r; py = 1.6; fov = 52; coreDim = 0.26; dustOp = 0.18; beamOp = 0.14;
    } else if (A === 'services') {
      const a = t * 0.02, r = 9.6;
      px = Math.sin(a) * 1.6; pz = r; py = 2.5; fov = 55; coreDim = 1; gold = 1; planetK = 1; dustOp = 0.28; beamOp = 0.4;
    } else if (A === 'cases') {
      const a = t * 0.03, r = 6.2;
      px = Math.sin(a) * r; pz = Math.cos(a) * r; py = 0.4; fov = 62; coreDim = 0; dustOp = 0.14; beamOp = 0.1;
      tint = this.CASE_COLORS[this.caseFocus || 0] || [1, 1, 1];
    } else if (A === 'stats') {
      const a = t * 0.03, r = 12;
      px = Math.sin(a) * r; pz = Math.cos(a) * r; py = 1; fov = 55; coreDim = 0.4; dustOp = 0.2; beamOp = 0.2;
    } else if (A === 'cta') {
      const a = t * 0.05, r = 4.9;
      px = Math.sin(a) * r; pz = Math.cos(a) * r; py = 0.3 + Math.sin(t * 0.4) * 0.1; fov = 58; coreDim = 1; gold = 1; beamOp = 1; dustOp = 0.8;
    }
    px += this.mouse.tx * 0.7;
    py += -this.mouse.ty * 0.5;
    this.tPos.set(px, py, pz);
    this.tLook.set(lx, ly, lz);
    this.tFov = fov;
    this._coreDim = coreDim; this._beamOp = beamOp; this._dustOp = dustOp;
    this._uniOp = uniOp; this._planetK = planetK; this._gold = gold; this._tint = tint;
  }

  render3D(dt: number) {
    if (!this.renderer) return;
    const THREE = this.THREE, t = this.t;
    this.computeTargets();
    const _A = this.active, _dp = this.acts.dive || 0, _hp = this.acts.hero || 0;
    this._warpOp =
      _A === 'dive'
        ? this.clamp(_dp / 0.26, 0, 1) * this.clamp(1 - (_dp - 0.72) / 0.26, 0, 1) * 0.95
        : _A === 'hero'
        ? this.clamp((_hp - 0.82) / 0.18, 0, 1) * 0.28
        : 0;
    this._roll = _A === 'dive' ? Math.sin(_dp * Math.PI) * 0.22 : 0;
    let f = 0.06;
    if (this.active === 'dive') f = 0.14;
    else if (this.active === 'services' || this.active === 'cta') f = 0.05;
    this.camera.position.lerp(this.tPos, f);
    this.curLook.lerp(this.tLook, f);
    this.curRoll = this.lerp(this.curRoll || 0, this._roll || 0, 0.05);
    this.camera.up.set(Math.sin(this.curRoll), Math.cos(this.curRoll), 0);
    this.camera.lookAt(this.curLook);
    if (Math.abs(this.camera.fov - this.tFov) > 0.05) {
      this.camera.fov = this.lerp(this.camera.fov, this.tFov, 0.08);
      this.camera.updateProjectionMatrix();
    }
    if (this.core) {
      this.core.rotation.y += dt * 0.12;
      this.core.rotation.x = Math.sin(t * 0.2) * 0.1;
      this.coreMat.uniforms.uTime.value = t;
      this.coreMat.uniforms.uOpacity.value = this.lerp(this.coreMat.uniforms.uOpacity.value, this._coreDim, 0.05);
      this.coreMat.uniforms.uGold.value = this.lerp(this.coreMat.uniforms.uGold.value, this._gold, 0.05);
      this.glowMat.uniforms.uOpacity.value = this.coreMat.uniforms.uOpacity.value;
      this.innerMat.opacity = this.coreMat.uniforms.uOpacity.value * (0.7 + this._gold * 0.5);
      const sc = 1 + Math.sin(t * 1.4) * 0.05 + this._gold * 0.25;
      this.inner.scale.setScalar(sc);
      this.wireMat.opacity = this.coreMat.uniforms.uOpacity.value * 0.16;
      this.wire.rotation.y -= dt * 0.06;
      this.wire.rotation.z += dt * 0.03;
      this.coreMat.uniforms.uAmp.value = this.lerp(this.coreMat.uniforms.uAmp.value, 0.34 + this._gold * 0.2, 0.03);
      this.core.position.x = this.lerp(this.core.position.x, this.mouse.tx * 0.22, 0.05);
      this.core.position.y = this.lerp(this.core.position.y, -this.mouse.ty * 0.18, 0.05);
      if (this.rings)
        this.rings.forEach((m: any, i: number) => {
          m.rotation.x += dt * m.userData.sx;
          m.rotation.y += dt * m.userData.sy;
          m.material.opacity = (0.46 - i * 0.12) * this.coreMat.uniforms.uOpacity.value * (0.7 + this._gold * 0.6);
        });
      if (this.bloomMat) {
        this.bloomMat.opacity = this.coreMat.uniforms.uOpacity.value * (0.32 + this._gold * 0.35) + Math.sin(t * 1.2) * 0.02;
        const bs = 7.5 + this._gold * 3 + Math.sin(t * 1.1) * 0.4;
        this.bloom.scale.set(bs, bs, 1);
      }
      this.core.visible = this.coreMat.uniforms.uOpacity.value > 0.01;
    }
    if (this.universe) {
      this.universe.rotation.y += dt * 0.012 + this.mouse.tx * 0.0006;
      this.universe.rotation.x = this.mouse.ty * 0.05;
      const u = this.universe.material.uniforms;
      u.uTime.value = t;
      u.uOpacity.value = this.lerp(u.uOpacity.value, this._uniOp, 0.05);
      const tint = this._tint;
      u.uTint.value.r = this.lerp(u.uTint.value.r, tint[0], 0.04);
      u.uTint.value.g = this.lerp(u.uTint.value.g, tint[1], 0.04);
      u.uTint.value.b = this.lerp(u.uTint.value.b, tint[2], 0.04);
    }
    if (this.dust) {
      this.dust.rotation.y -= dt * 0.05;
      this.dust.rotation.z += dt * 0.02;
      const u = this.dust.material.uniforms;
      u.uTime.value = t;
      u.uOpacity.value = this.lerp(u.uOpacity.value, this._dustOp, 0.06);
      const ds = this.lerp(this.dust.scale.x, this.active === 'dive' ? 1 + (this.acts.dive || 0) * 1.4 : 1, 0.06);
      this.dust.scale.setScalar(ds);
    }
    if (this.beams) {
      this.beams.rotation.y += dt * 0.05;
      this.beams.rotation.x += dt * 0.01;
      this.beams.children.forEach((b: any) => {
        if (b.material.uniforms)
          b.material.uniforms.uOpacity.value = this.lerp(b.material.uniforms.uOpacity.value, this._beamOp, 0.05);
      });
    }
    if (this.warp) {
      const wo = this._warpOp || 0;
      this.warp.material.opacity = this.lerp(this.warp.material.opacity, wo, 0.09);
      this.warp.visible = this.warp.material.opacity > 0.008;
      if (this.warp.visible) {
        const arr = this.warpGeo.attributes.position.array, spdK = 0.35 + wo * 1.8;
        for (let i = 0; i < this.warpN; i++) {
          const d = this.warpData[i];
          d.z += dt * d.spd * spdK;
          if (d.z > 4) d.z = -72;
          const o = i * 6, tail = d.len * (0.5 + wo * 2.6);
          arr[o] = d.x; arr[o + 1] = d.y; arr[o + 2] = d.z;
          arr[o + 3] = d.x; arr[o + 4] = d.y; arr[o + 5] = d.z - tail;
        }
        this.warpGeo.attributes.position.needsUpdate = true;
      }
    }
    if (this.crystals) {
      const co = this._beamOp * 0.4;
      this.crystals.rotation.y += dt * 0.012;
      this.crystals.children.forEach((l: any) => {
        l.rotation.x += dt * l.userData.rx;
        l.rotation.y += dt * l.userData.ry;
        l.position.y = l.userData.baseY + Math.sin(t * 0.5 + l.userData.bob) * 0.5;
        l.material.opacity = this.lerp(l.material.opacity, co, 0.05);
      });
    }
    if (this.planets) {
      const k = this.lerp(this.planets.scale.x, this._planetK < 0.5 ? 0.001 : 1, 0.08);
      this.planets.scale.setScalar(k);
      this.planets.visible = k > 0.02;
      if (this.planets.visible) {
        const idx = this.clamp(Math.round((this.acts.services || 0) * (this.SERVICES.length - 1)), 0, this.SERVICES.length - 1);
        const focusA = this.planetNodes[idx].userData.a;
        const targetRot = -focusA + Math.PI / 2;
        this.planets.rotation.y = this.lerp(this.planets.rotation.y, targetRot, 0.07);
        this.planetNodes.forEach((n: any, i: number) => {
          const on = i === idx;
          const s = this.lerp(n.scale.x, on ? 2.1 : 0.7, 0.1);
          n.scale.setScalar(s);
          n.position.y = (i % 2 ? 0.5 : -0.5) + Math.sin(t * 0.8 + n.userData.bob) * 0.18;
          if (n.userData.spr) n.userData.spr.material.opacity = this.lerp(n.userData.spr.material.opacity, on ? 1 : 0.4, 0.12);
          if (n.userData.ring) n.userData.ring.rotation.z += dt * (on ? 0.7 : 0.2);
          if (n.userData.ring2) {
            n.userData.ring2.rotation.z -= dt * (on ? 0.5 : 0.15);
            n.userData.ring2.material.opacity = this.lerp(n.userData.ring2.material.opacity, on ? 0.4 : 0.14, 0.12);
          }
          if (n.userData.moon) n.userData.moon.rotation.y += dt * (on ? 1.5 : 0.6);
        });
        if (this.spokes) this.spokes.forEach((l: any, i: number) => {
          l.material.opacity = this.lerp(l.material.opacity, i === idx ? 0.5 : 0.05, 0.1);
        });
        const rt = this.q('[data-svc-reticle]');
        if (rt) {
          const wp = new THREE.Vector3();
          this.planetNodes[idx].getWorldPosition(wp);
          const pr = wp.clone().project(this.camera);
          const sx = (pr.x * 0.5 + 0.5) * window.innerWidth, sy = (-pr.y * 0.5 + 0.5) * window.innerHeight;
          rt.style.transform = `translate(${sx}px,${sy}px)`;
          rt.style.opacity = pr.z < 1 && this.active === 'services' ? '1' : '0';
          const box = this.q('[data-svc-reticle-box]');
          if (box) box.style.transform = `translate(-50%,-50%) rotate(${t * 14}deg)`;
          const nm = this.q('[data-svc-reticle-name]');
          if (nm && nm.textContent !== this.SERVICES[idx].name) nm.textContent = this.SERVICES[idx].name;
        }
      } else {
        const rt = this.q('[data-svc-reticle]');
        if (rt) rt.style.opacity = '0';
      }
    }
    this.renderer.render(this.scene, this.camera);
  }

  /* ---------- LOOP ---------- */
  startLoop() {
    const loop = () => {
      if (this.destroyed) return;
      this.rafId = requestAnimationFrame(loop);
      const dt = this.clock ? Math.min(this.clock.getDelta(), 0.05) : 0.016;
      this.t += dt;
      this.mouse.tx = this.lerp(this.mouse.tx, this.mouse.x, 0.06);
      this.mouse.ty = this.lerp(this.mouse.ty, this.mouse.y, 0.06);
      this.updateScroll();
      this.cur.rx = this.lerp(this.cur.rx, this.cur.x, 0.18);
      this.cur.ry = this.lerp(this.cur.ry, this.cur.y, 0.18);
      const ring = this.q('[data-cursor-ring]');
      if (ring) ring.style.transform = `translate(${this.cur.rx}px,${this.cur.ry}px)`;
      try {
        this.render3D(dt);
      } catch (e) {
        if (!this._err) {
          console.warn('devora: render error', e);
          this._err = 1;
        }
      }
    };
    loop();
  }

  // Reduced-motion / no-WebGL path: no rAF, no smooth scroll — just keep the
  // DOM act-state (progress, HUD, service/build/case panels) in sync on scroll.
  bindStaticScroll() {
    this._staticScroll = () => this.updateScroll();
    window.addEventListener('scroll', this._staticScroll, {passive: true});
    this.updateScroll();
  }

  onResize() {
    if (this.renderer) {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }
    this.measure();
  }

  /* ---------- CURSOR / NAV / REVEALS / COUNTERS / SOUND ---------- */
  setupCursor() {
    if (this.reducedMotion) return;
    if (window.matchMedia && window.matchMedia('(pointer:coarse)').matches) return;
    const dot = this.q('[data-cursor-dot]'), ring = this.q('[data-cursor-ring]');
    this._onMouse = (e: MouseEvent) => {
      this.mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
      this.cur.x = e.clientX;
      this.cur.y = e.clientY;
      if (dot) {
        dot.style.opacity = '1';
        dot.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
      }
      if (ring) ring.style.opacity = '1';
    };
    window.addEventListener('mousemove', this._onMouse);
    this.qa('a,button,[data-magnetic],[data-goto]').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        if (ring) {
          ring.style.width = '58px'; ring.style.height = '58px';
          ring.style.margin = '-29px 0 0 -29px'; ring.style.borderColor = 'rgba(242,168,75,.9)';
        }
      });
      el.addEventListener('mouseleave', () => {
        if (ring) {
          ring.style.width = '38px'; ring.style.height = '38px';
          ring.style.margin = '-19px 0 0 -19px'; ring.style.borderColor = 'rgba(242,168,75,.5)';
        }
      });
    });
  }
  setupNav() {
    this.qa('[data-goto]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const id = el.getAttribute('data-goto')!;
        const target = this.q('#' + id);
        if (!target) return;
        const y = target.offsetTop + 2;
        if (this.lenis) this.lenis.scrollTo(y, {duration: 1.6});
        else window.scrollTo({top: y, behavior: this.reducedMotion ? 'auto' : 'smooth'});
        if (this.soundOn) this.blip(520);
      });
    });
  }
  setupReveals() {
    const reveals = this.qa('[data-reveal]');
    if (!this.gsap || !this.ScrollTrigger || this.reducedMotion) {
      reveals.forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }
    reveals.forEach((el) => {
      if (el.closest('#act-hero')) return;
      this.gsap.from(el, {
        y: 44, opacity: 0, duration: 1.05, ease: 'power3.out',
        scrollTrigger: {trigger: el, start: 'top 88%'},
      });
    });
  }
  setupCounters() {
    const run = (el: HTMLElement) => {
      const target = +el.getAttribute('data-target')!,
        pre = el.getAttribute('data-prefix') || '',
        suf = el.getAttribute('data-suffix') || '';
      const o = {v: 0};
      if (this.gsap && !this.reducedMotion) {
        this.gsap.to(o, {
          v: target, duration: 2, ease: 'power2.out',
          onUpdate: () => {
            el.textContent = pre + Math.floor(o.v) + suf;
          },
        });
      } else {
        el.textContent = pre + target + suf;
      }
    };
    const els = this.qa('[data-count]');
    if (this.gsap && this.ScrollTrigger && !this.reducedMotion) {
      this.ScrollTrigger.create({
        trigger: this.q('#act-stats'), start: 'top 70%', once: true,
        onEnter: () => els.forEach(run),
      });
    } else {
      const io = new IntersectionObserver(
        (es) => {
          es.forEach((e) => {
            if (e.isIntersecting) {
              els.forEach(run);
              io.disconnect();
            }
          });
        },
        {threshold: 0.3}
      );
      const s = this.q('#act-stats');
      if (s) io.observe(s);
      else els.forEach(run);
    }
  }
  setupMagnetic() {
    if (this.reducedMotion) return;
    this.qa('[data-magnetic]').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - r.left - r.width / 2, my = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${mx * 0.3}px,${my * 0.4}px)`;
        el.style.transition = 'transform .1s';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate(0,0)';
        el.style.transition = 'transform .4s cubic-bezier(.2,.8,.2,1)';
      });
    });
  }
  setupSound() {
    const btn = this.q('[data-sound]');
    if (btn) btn.addEventListener('click', () => this.toggleSound());
  }
  initAudio() {
    if (this.audioCtx) return;
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    this.audioCtx = new AC();
    const ctx = this.audioCtx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    lp.Q.value = 2;
    lp.connect(this.master);
    const mk = (f: number, type: OscillatorType, g: number) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      const gg = ctx.createGain();
      gg.gain.value = g;
      o.connect(gg);
      gg.connect(lp);
      o.start();
      return o;
    };
    mk(55, 'sine', 0.5);
    mk(82.4, 'sine', 0.3);
    mk(110, 'triangle', 0.12);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lg = ctx.createGain();
    lg.gain.value = 180;
    lfo.connect(lg);
    lg.connect(lp.frequency);
    lfo.start();
  }
  toggleSound() {
    this.initAudio();
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    this.soundOn = !this.soundOn;
    const now = this.audioCtx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.linearRampToValueAtTime(this.soundOn ? 0.16 : 0, now + (this.soundOn ? 1.2 : 0.5));
    const lab = this.q('[data-sound-label]');
    if (lab) lab.textContent = this.soundOn ? this._label('sound_on') : this._label('sound');
    const btn = this.q('[data-sound]');
    if (btn) {
      btn.style.color = this.soundOn ? 'var(--accent,#F2A84B)' : 'rgba(245,246,248,.7)';
      btn.setAttribute('aria-pressed', this.soundOn ? 'true' : 'false');
    }
    const bars = this.q('[data-sound-bars]');
    if (bars) bars.style.animation = this.soundOn ? 'dvPulse 1s infinite' : 'none';
  }
  blip(freq?: number) {
    if (!this.audioCtx || !this.soundOn) return;
    try {
      const ctx = this.audioCtx, now = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq || 620;
      g.gain.value = 0;
      o.connect(g);
      g.connect(this.master);
      g.gain.linearRampToValueAtTime(0.06, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      o.start(now);
      o.stop(now + 0.24);
    } catch {}
  }

  // Sound button labels come from data-attributes baked in by the server render.
  private _label(kind: 'sound' | 'sound_on') {
    const btn = this.q('[data-sound]');
    return (btn && btn.getAttribute(kind === 'sound' ? 'data-label-sound' : 'data-label-sound-on')) ||
      (kind === 'sound' ? 'Sound' : 'Sound on');
  }
}
