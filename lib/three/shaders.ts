/** GLSL for the aura scene (ported from the legacy experience shaders). */

export const SIMPLEX_NOISE = `vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
    float snoise(vec3 v){const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}`;

export const CORE_VERT = SIMPLEX_NOISE + `
uniform float uTime, uAmp;
varying float vN; varying vec3 vNw; varying vec3 vV;
void main(){
  vec3 p = position;
  float n = snoise(normalize(position) * 1.5 + uTime * 0.22);
  float n2 = snoise(normalize(position) * 3.4 - uTime * 0.16) * 0.5;
  float d = (n + n2) * uAmp;
  p += normal * d; vN = d;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vV = -mv.xyz; vNw = normalMatrix * normal;
  gl_Position = projectionMatrix * mv;
}`;

export const CORE_FRAG = `
uniform vec3 uAccent, uHot, uDeep, uLight;
uniform float uGlow;
varying float vN; varying vec3 vNw; varying vec3 vV;
void main(){
  vec3 N = normalize(vNw); vec3 V = normalize(vV);
  float f = pow(1.0 - max(dot(N, V), 0.0), 2.4);
  float lit = max(dot(N, normalize(uLight)), 0.0);
  vec3 base = mix(uDeep, uHot, smoothstep(-0.3, 0.6, vN));
  vec3 col = base + uAccent * f * 1.5 * uGlow + uAccent * max(vN, 0.0) * 0.7 * uGlow + uAccent * lit * 0.22 * uGlow;
  gl_FragColor = vec4(col, clamp(0.45 + f + lit * 0.15, 0.0, 1.0));
}`;

export const HALO_VERT = `
varying vec3 vNw; varying vec3 vV;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vV = -mv.xyz; vNw = normalMatrix * normal;
  gl_Position = projectionMatrix * mv;
}`;

export const HALO_FRAG = `
uniform vec3 uAccent; uniform float uGlow;
varying vec3 vNw; varying vec3 vV;
void main(){
  float f = pow(1.0 - max(dot(normalize(vNw), normalize(vV)), 0.0), 3.0);
  gl_FragColor = vec4(uAccent, f * uGlow * 0.9);
}`;

export const DUST_VERT = `
uniform float uTime, uSize, uPix;
attribute float aSize, aSeed; attribute vec3 aColor;
varying vec3 vC; varying float vT;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float tw = 0.55 + 0.45 * sin(uTime * 1.4 + aSeed * 6.28);
  gl_PointSize = clamp(aSize * uSize * uPix * (300.0 / max(-mv.z, 0.001)), 1.0, 14.0 * uPix);
  gl_Position = projectionMatrix * mv;
  vC = aColor; vT = tw;
}`;

export const DUST_FRAG = `
uniform float uOpacity;
varying vec3 vC; varying float vT;
void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  gl_FragColor = vec4(vC * (0.6 + vT * 0.7), smoothstep(0.5, 0.0, d) * uOpacity * vT);
}`;
