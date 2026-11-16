import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, Group, LinearSRGBColorSpace,
  PerspectiveCamera, Points, Scene, ShaderMaterial, WebGLRenderer,
} from 'three';
import {DUST_VERT, MARK_VERT, POINT_FRAG} from './shaders';
import {sampleMark} from './mark-geometry';

/** CSS colour strings read from theme tokens by the caller (no hex lives here). */
export type MarkColors = {amber: string; amberHi: string; signal: string};

export type MarkOptions = {
  canvas: HTMLCanvasElement;
  colors: MarkColors;
  count: number;
  dustCount: number;
  antialias: boolean;
  maxDpr: number;
  intensity: number;
};

export type MarkHandle = {
  resize: (width: number, height: number) => void;
  /** Pointer in NDC (-1..1, y up); null when it left the page. */
  setPointer: (x: number, y: number) => void;
  clearPointer: () => void;
  pulse: (x: number, y: number) => void;
  setIntensity: (value: number) => void;
  render: (dt: number) => void;
  dispose: () => void;
};

const FOV = 40;
const HALF = 2; // world half-extent of the 512 viewBox
const MARGIN = 1.3; // poster draws the viewBox at 1/MARGIN of the box's short side
const TAN = Math.tan((FOV * Math.PI) / 360);

const css = (v: string) => new Color().setStyle(v, LinearSRGBColorSpace);
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function geometry(pos: Float32Array, data: Float32Array) {
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('aData', new BufferAttribute(data, 3));
  return g;
}

function markGeometry(count: number) {
  const {pos: xy, kind} = sampleMark(count);
  const pos = new Float32Array(count * 3);
  const data = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const lead = kind[i] > 0.5;
    pos[i * 3] = xy[i * 2] * HALF;
    pos[i * 3 + 1] = xy[i * 2 + 1] * HALF;
    pos[i * 3 + 2] = rnd(-0.12, 0.12);
    data.set([Math.random(), lead ? (Math.random() < 0.05 ? rnd(5, 7) : rnd(1.2, 2.0)) : rnd(0.8, 1.5), kind[i]], i * 3);
  }
  return geometry(pos, data);
}

function dustGeometry(count: number) {
  const pos = new Float32Array(count * 3);
  const data = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos.set([rnd(-11, 11), rnd(-8, 8), rnd(-10, -3)], i * 3);
    data.set([Math.random(), rnd(0.6, 1.8), Math.random()], i * 3);
  }
  return geometry(pos, data);
}

export function createMarkScene(o: MarkOptions): MarkHandle {
  const renderer = new WebGLRenderer({
    canvas: o.canvas, antialias: o.antialias, alpha: true, powerPreference: 'high-performance',
  });
  const pix = Math.min(window.devicePixelRatio || 1, o.maxDpr);
  renderer.setPixelRatio(pix);
  renderer.setClearColor(0x000000, 0);

  const amber = css(o.colors.amber);
  const time = {value: 0};
  const glow = {value: 1};
  const sizeScale = {value: 1};
  const base = {transparent: true, depthWrite: false, blending: AdditiveBlending, fragmentShader: POINT_FRAG} as const;

  const uPointer = {value: {x: 0, y: 0}};
  const uPulse = {value: {x: 0, y: 0, z: -1}};
  const uActive = {value: 0};
  const markMat = new ShaderMaterial({
    ...base,
    vertexShader: MARK_VERT,
    uniforms: {
      uTime: time, uGlow: glow, uSizeScale: sizeScale, uPointer, uPulse, uActive,
      uAmber: {value: amber}, uAmberHi: {value: css(o.colors.amberHi)},
    },
  });
  const dustMat = new ShaderMaterial({
    ...base,
    vertexShader: DUST_VERT,
    uniforms: {
      uTime: time, uGlow: glow, uSizeScale: sizeScale,
      uAmber: {value: amber}, uSignal: {value: css(o.colors.signal)},
    },
  });

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 60);
  const mark = new Group();
  const dust = new Group();
  const markPoints = new Points(markGeometry(o.count), markMat);
  const dustPoints = new Points(dustGeometry(o.dustCount), dustMat);
  markPoints.frustumCulled = dustPoints.frustumCulled = false;
  mark.add(markPoints);
  dust.add(dustPoints);
  scene.add(dust, mark);

  glow.value = Math.max(0, o.intensity);
  let aspect = 1;
  let dist = 10;
  // Pointer spring (x, y), parallax ease, and influence spring: underdamped, so release overshoots.
  const sp = {x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, seen: false};
  const act = {v: 0, vel: 0, target: 0};
  const par = {x: 0, y: 0, tx: 0, ty: 0};

  const toWorld = (nx: number, ny: number) => [
    nx * dist * TAN * aspect - mark.position.x,
    ny * dist * TAN - mark.position.y,
  ] as const;

  return {
    resize(w, h) {
      if (w < 1 || h < 1) return;
      aspect = w / h;
      dist = (HALF * MARGIN) / TAN / Math.min(1, aspect);
      camera.aspect = aspect;
      camera.position.set(0, 0, dist);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      sizeScale.value = (h * pix) / 2 / TAN;
    },
    setPointer(x, y) {
      [sp.tx, sp.ty] = toWorld(x, y);
      if (!sp.seen) {
        sp.x = sp.tx;
        sp.y = sp.ty;
        sp.seen = true;
      }
      par.tx = x;
      par.ty = y;
      act.target = 1;
    },
    clearPointer() {
      act.target = 0;
      par.tx = par.ty = 0;
    },
    pulse(x, y) {
      const [wx, wy] = toWorld(x, y);
      uPulse.value = {x: wx, y: wy, z: time.value};
    },
    setIntensity(v) {
      glow.value = Math.max(0, v);
    },
    render(dt) {
      time.value += dt;
      for (let left = dt; left > 0; left -= 1 / 120) {
        const h = Math.min(left, 1 / 120);
        sp.vx += (90 * (sp.tx - sp.x) - 10 * sp.vx) * h;
        sp.vy += (90 * (sp.ty - sp.y) - 10 * sp.vy) * h;
        sp.x += sp.vx * h;
        sp.y += sp.vy * h;
        act.vel += (40 * (act.target - act.v) - 8 * act.vel) * h;
        act.v += act.vel * h;
      }
      const k = 1 - Math.exp(-dt * 3);
      par.x += (par.tx - par.x) * k;
      par.y += (par.ty - par.y) * k;
      mark.position.set(par.x * 0.2, par.y * 0.14, 0);
      mark.rotation.set(-par.y * 0.1, par.x * 0.16, 0);
      dust.position.set(par.x * 0.06, par.y * 0.04, 0);
      uPointer.value = {x: sp.x, y: sp.y};
      uActive.value = Math.max(0, act.v);
      renderer.render(scene, camera);
    },
    dispose() {
      markPoints.geometry.dispose();
      dustPoints.geometry.dispose();
      markMat.dispose();
      dustMat.dispose();
      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
