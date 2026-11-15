import {
  AdditiveBlending, BackSide, BufferAttribute, BufferGeometry, CanvasTexture, Color, EdgesGeometry,
  Group, IcosahedronGeometry, LineBasicMaterial, LineSegments, LinearSRGBColorSpace, Material, Mesh,
  MeshBasicMaterial, Object3D, PerspectiveCamera, Points, Scene, ShaderMaterial, Sprite,
  SpriteMaterial, SphereGeometry, TorusGeometry, Vector3, WebGLRenderer,
} from 'three';
import {CORE_FRAG, CORE_VERT, DUST_FRAG, DUST_VERT, HALO_FRAG, HALO_VERT} from './shaders';

/** CSS colour strings read from theme tokens by the caller (no hex lives here). */
export type AuraColors = {amber: string; amberHi: string; bg: string; signal: string};

export type AuraSceneOptions = {
  canvas: HTMLCanvasElement;
  colors: AuraColors;
  dustCount: number;
  antialias: boolean;
  maxDpr: number;
  intensity: number;
};

export type AuraHandle = {
  resize: (width: number, height: number) => void;
  /** Pointer in -1..1 (y up is negative, like screen space). */
  setPointer: (x: number, y: number) => void;
  setIntensity: (value: number) => void;
  render: (dt: number) => void;
  dispose: () => void;
};

const FOV = 42;
const FIT_RADIUS = 3.8;

const css = (value: string) => new Color().setStyle(value, LinearSRGBColorSpace);

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  if (x) {
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,.7)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
  }
  return new CanvasTexture(c);
}

function buildDust(count: number, c: {amber: Color; signal: Color}, pix: number) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const siz = new Float32Array(count);
  const seed = new Float32Array(count);
  const white = new Color(1, 1, 1);
  for (let i = 0; i < count; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    const r = 2.9 + Math.pow(Math.random(), 0.6) * 3.6;
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.cos(ph) * 0.7;
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    const pick = Math.random();
    const k = pick > 0.86 ? c.amber : pick > 0.72 ? c.signal : white;
    col.set([k.r, k.g, k.b], i * 3);
    siz[i] = 0.5 + Math.random() * 1.8;
    seed[i] = Math.random();
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new BufferAttribute(col, 3));
  geo.setAttribute('aSize', new BufferAttribute(siz, 1));
  geo.setAttribute('aSeed', new BufferAttribute(seed, 1));
  const mat = new ShaderMaterial({
    uniforms: {uTime: {value: 0}, uSize: {value: 0.075}, uPix: {value: pix}, uOpacity: {value: 1}},
    vertexShader: DUST_VERT,
    fragmentShader: DUST_FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  return new Points(geo, mat);
}

export function createAuraScene(o: AuraSceneOptions): AuraHandle {
  const renderer = new WebGLRenderer({
    canvas: o.canvas, antialias: o.antialias, alpha: true, powerPreference: 'high-performance',
  });
  const pix = Math.min(window.devicePixelRatio || 1, o.maxDpr);
  renderer.setPixelRatio(pix);
  renderer.setClearColor(0x000000, 0);

  const amber = css(o.colors.amber);
  const amberHi = css(o.colors.amberHi);
  const bg = css(o.colors.bg);
  const signal = css(o.colors.signal);
  const hot = bg.clone().lerp(amber, 0.16);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 60);
  const core = new Group();
  scene.add(core);

  const coreMat = new ShaderMaterial({
    uniforms: {
      uTime: {value: 0}, uAmp: {value: 0.34}, uAccent: {value: amber.clone()},
      uHot: {value: hot}, uDeep: {value: bg.clone()}, uLight: {value: new Vector3(0, 0, 1)},
      uGlow: {value: 1},
    },
    vertexShader: CORE_VERT, fragmentShader: CORE_FRAG, transparent: true, depthWrite: false,
  });
  core.add(new Mesh(new IcosahedronGeometry(1.15, 5), coreMat));

  const haloMat = new ShaderMaterial({
    uniforms: {uAccent: {value: amber.clone()}, uGlow: {value: 1}},
    vertexShader: HALO_VERT, fragmentShader: HALO_FRAG, transparent: true, side: BackSide,
    blending: AdditiveBlending, depthWrite: false,
  });
  core.add(new Mesh(new SphereGeometry(1.75, 40, 40), haloMat));

  const additive = {transparent: true, blending: AdditiveBlending, depthWrite: false} as const;
  const innerMat = new MeshBasicMaterial({color: amberHi, opacity: 0.45, ...additive});
  core.add(new Mesh(new SphereGeometry(0.45, 24, 24), innerMat));

  const wireMat = new LineBasicMaterial({color: amber, transparent: true, opacity: 0.16, blending: AdditiveBlending});
  core.add(new LineSegments(new EdgesGeometry(new IcosahedronGeometry(2.15, 1)), wireMat));

  const rings = [[2.4, 0.011], [2.82, 0.009], [3.2, 0.007]].map(([radius, tube], i) => {
    const ring = new Mesh(
      new TorusGeometry(radius, tube, 8, 120),
      new MeshBasicMaterial({color: amber, opacity: 0.4, ...additive}),
    );
    ring.rotation.set(Math.PI / 2 + (i - 1) * 0.42, i * 0.6, 0);
    ring.userData = {spin: (0.05 + i * 0.03) * (i % 2 ? 1 : -1)};
    core.add(ring);
    return ring;
  });

  const bloomMat = new SpriteMaterial({map: glowTexture(), color: amber, opacity: 0.32, ...additive});
  const bloom = new Sprite(bloomMat);
  bloom.scale.set(7.5, 7.5, 1);
  bloom.renderOrder = -3;
  core.add(bloom);

  const dust = buildDust(o.dustCount, {amber: amberHi, signal}, pix);
  scene.add(dust);
  const dustMat = dust.material as ShaderMaterial;

  let intensity = o.intensity;
  let time = 0;
  let aspect = 1;
  const ptr = {x: 0, y: 0, tx: 0, ty: 0};

  const applyIntensity = () => {
    const k = Math.max(0, intensity);
    coreMat.uniforms.uGlow.value = 0.4 + 0.6 * k;
    haloMat.uniforms.uGlow.value = k;
    dustMat.uniforms.uOpacity.value = Math.min(1, k) * 0.75;
    bloomMat.opacity = 0.32 * k;
  };
  applyIntensity();

  const place = () => {
    const dist = FIT_RADIUS / Math.tan((FOV * Math.PI) / 360) / Math.min(1, aspect);
    camera.position.set(ptr.x * 0.9, 0.35 - ptr.y * 0.6, dist);
    camera.lookAt(0, 0, 0);
  };

  return {
    resize(w, h) {
      if (w < 1 || h < 1) return;
      aspect = w / h;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    },
    setPointer(x, y) {
      ptr.tx = x;
      ptr.ty = y;
    },
    setIntensity(v) {
      intensity = v;
      applyIntensity();
    },
    render(dt) {
      time += dt;
      const k = 1 - Math.exp(-dt * 4);
      ptr.x += (ptr.tx - ptr.x) * k;
      ptr.y += (ptr.ty - ptr.y) * k;
      coreMat.uniforms.uTime.value = time;
      dustMat.uniforms.uTime.value = time;
      (coreMat.uniforms.uLight.value as Vector3).set(ptr.x * 2.2, -ptr.y * 2.2, 1.4);
      core.rotation.y += dt * 0.12;
      dust.rotation.y += dt * 0.03;
      dust.rotation.x = ptr.y * 0.08;
      for (const r of rings) r.rotation.z += dt * (r.userData.spin as number);
      place();
      renderer.render(scene, camera);
    },
    dispose() {
      scene.traverse((obj: Object3D) => {
        const m = obj as Mesh;
        m.geometry?.dispose();
        const mats = (m.material ?? []) as Material | Material[];
        for (const mat of Array.isArray(mats) ? mats : [mats]) {
          (mat as SpriteMaterial).map?.dispose();
          mat.dispose();
        }
      });
      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
