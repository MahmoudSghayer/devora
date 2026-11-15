/** GLSL for the particle mark (static attributes; spring/repulsion/pulse run on the GPU). */

export const MARK_VERT = /* glsl */ `
uniform float uTime, uSizeScale, uGlow;
uniform vec2 uPointer;
uniform float uActive;
uniform vec3 uPulse;
uniform vec3 uAmber, uAmberHi;
attribute vec3 aData; // seed, size, kind (1 = dot)
varying vec3 vColor;
varying float vAlpha;
void main() {
  float seed = aData.x;
  bool lead = aData.z > 0.5;
  float t = uTime;
  vec3 p = position;
  p *= 1.0 + 0.018 * sin(t * 0.7);
  p.xy += 0.02 * vec2(sin(t * 0.9 + seed * 40.0), cos(t * 0.8 + seed * 31.0));
  p.z += 0.05 * sin(t * 0.6 + seed * 20.0);

  vec2 d = p.xy - uPointer;
  float r = length(d);
  float f = smoothstep(1.1, 0.0, r);
  f *= f * uActive;
  p.xy += d / (r + 0.001) * f * 0.5;
  p.z += f * 0.4;

  float boost = 0.0;
  float age = t - uPulse.z;
  if (uPulse.z >= 0.0 && age < 4.0) {
    vec2 o = p.xy - uPulse.xy;
    float od = length(o);
    float x = od - age * 3.4;
    float front = exp(-x * x / 0.12);
    float wake = x < 0.0 ? sin(x * 9.0) * exp(x * 2.5) * 0.35 : 0.0;
    float k = (front + wake) * exp(-age * 1.2);
    p.xy += o / (od + 0.001) * k * 0.6;
    p.z += k * 0.3;
    boost = max(front * exp(-age * 1.2), 0.0);
  }

  float beat = lead ? 1.0 + 0.2 * sin(t * 2.1) : 1.0;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = max(1.0, aData.y * 0.04 * beat * (1.0 + boost * 0.8) * uSizeScale / -mv.z);
  gl_Position = projectionMatrix * mv;
  vColor = lead ? uAmberHi * 1.1 : mix(uAmber, uAmberHi, seed * 0.5);
  float halo = aData.y > 3.0 ? 0.2 : 1.0; // a few big soft particles form the dot's glow
  vAlpha = uGlow * (lead ? 0.95 * halo * (0.85 + 0.15 * sin(t * 2.1)) : 0.55 + 0.3 * seed) + boost * 0.4;
}`;

export const DUST_VERT = /* glsl */ `
uniform float uTime, uSizeScale, uGlow;
uniform vec3 uAmber, uSignal;
attribute vec3 aData; // seed, size, tint
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec3 p = position;
  p.x = mod(p.x + uTime * (0.03 + aData.x * 0.05) + 11.0, 22.0) - 11.0;
  p.y += 0.15 * sin(uTime * 0.2 + aData.x * 30.0);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = max(1.0, aData.y * 0.05 * uSizeScale / -mv.z);
  gl_Position = projectionMatrix * mv;
  bool cool = aData.z > 0.85;
  vColor = cool ? uSignal : uAmber;
  vAlpha = uGlow * (cool ? 0.18 : 0.4) * (0.55 + 0.45 * sin(uTime * (0.4 + aData.x) + aData.x * 30.0));
}`;

export const POINT_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  gl_FragColor = vec4(vColor, pow(1.0 - d, 1.6) * vAlpha);
}`;
