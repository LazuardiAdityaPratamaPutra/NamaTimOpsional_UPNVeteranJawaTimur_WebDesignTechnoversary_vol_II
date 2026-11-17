// GLSL untuk hero 3D. Elips zona api memakai rumus yang sama dengan mesin simulasi (lib/simulasi.js):
// pusat digeser sejauh c searah penjalaran (phi), sumbu panjang a, sumbu pendek b.

export const GLSL_ELIPS = /* glsl */`
float elips(vec2 en, float a, float b, float c, float phi, out float ang) {
  vec2 dir = vec2(sin(phi), cos(phi));
  vec2 rel = en - c * dir;
  float u = dot(rel, dir);
  float v = dot(rel, vec2(dir.y, -dir.x));
  ang = atan(v / b, u / a);
  return sqrt((u * u) / (a * a) + (v * v) / (b * b));
}`

export const VERT_MEDAN = /* glsl */`
varying vec3 vPos; varying vec3 vN; varying float vJarak;
void main() {
  vPos = position; vN = normal;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vJarak = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}`

export const FRAG_MEDAN = /* glsl */`
varying vec3 vPos; varying vec3 vN; varying float vJarak;
uniform float uPhi, uTime, uKabut;
uniform vec3 uA, uB, uC;   // x = zona 3 jam, y = 6 jam, z = 12 jam
uniform vec3 uBg;
${GLSL_ELIPS}

float garis(float d) { return 1.0 - smoothstep(0.0, 1.6 * fwidth(d), abs(d - 1.0)); }
float sungaiX(float z) { return -9.0 + 6.0 * sin(z * 0.13) + 3.0 * sin(z * 0.31 + 1.0); }

void main() {
  vec2 en = vec2(vPos.x, -vPos.z);
  vec3 n = normalize(vN);
  float sinar = 0.55 + 0.45 * max(dot(n, normalize(vec3(-0.45, 0.8, 0.35))), 0.0);
  float tt = clamp(vPos.y / 1.8, 0.0, 1.0);
  // tanah gambut gelap yang makin hijau-keabuan di bukit
  vec3 col = mix(vec3(0.050, 0.060, 0.042), vec3(0.085, 0.130, 0.100), tt) * sinar;
  col *= 0.88 + 0.12 * sin(vPos.x * 3.1) * sin(vPos.z * 2.7);

  // kontur tiap 0,25 km dan grid 5 km (samar)
  float hh = vPos.y * 4.0;
  float kf = abs(fract(hh - 0.5) - 0.5) / max(fwidth(hh), 0.0001);
  col += vec3(0.30, 0.56, 0.43) * (1.0 - min(kf, 1.0)) * 0.10;
  vec2 g = en / 5.0;
  vec2 gf = abs(fract(g - 0.5) - 0.5) / max(fwidth(g), vec2(0.0001));
  col += vec3(0.50, 0.72, 0.62) * (1.0 - min(min(gf.x, gf.y), 1.0)) * 0.035;

  // sungai
  float dr = abs(vPos.x - sungaiX(vPos.z));
  float air = 1.0 - smoothstep(0.75, 1.05, dr);
  vec3 warnaAir = vec3(0.020, 0.055, 0.075) + vec3(0.035, 0.070, 0.095) * pow(0.5 + 0.5 * sin(vPos.z * 5.0 + uTime * 0.6 + vPos.x * 2.0), 6.0);
  warnaAir += vec3(1.0, 0.42, 0.16) * 0.09 * exp(-length(en) * 0.11);   // pantulan api
  col = mix(col, warnaAir, air * 0.96);

  // zona api
  float a3, a6, a12;
  float d3 = elips(en, uA.x, uB.x, uC.x, uPhi, a3);
  float d6 = elips(en, uA.y, uB.y, uC.y, uPhi, a6);
  float d12 = elips(en, uA.z, uB.z, uC.z, uPhi, a12);
  float kedip = 0.92 + 0.08 * sin(uTime * 3.1 + en.x * 1.7 + en.y * 1.3);

  col += vec3(1.0, 0.72, 0.10) * exp(-max(d12 - 1.0, 0.0) * 2.6) * 0.06;
  col = mix(col, vec3(1.00, 0.72, 0.10), (1.0 - smoothstep(0.9, 1.0, d12)) * 0.10);
  col = mix(col, vec3(1.00, 0.40, 0.17), (1.0 - smoothstep(0.9, 1.0, d6)) * 0.22 * kedip);
  vec3 panas = mix(vec3(1.00, 0.80, 0.40), vec3(0.80, 0.14, 0.08), smoothstep(0.0, 1.0, d3));
  col = mix(col, panas, (1.0 - smoothstep(0.85, 1.0, d3)) * 0.70 * kedip);

  // tepi zona: padat (3 jam), putus-putus (6 jam), titik-titik (12 jam), terbaca tanpa bergantung warna
  col += vec3(1.00, 0.55, 0.30) * garis(d3) * 0.95;
  col += vec3(1.00, 0.55, 0.28) * garis(d6) * step(0.45, fract(a6 * 10.0 / 6.2832)) * 0.85;
  col += vec3(1.00, 0.80, 0.25) * garis(d12) * step(0.62, fract(a12 * 26.0 / 6.2832)) * 0.80;

  // kabut jarak (sama dengan FogExp2) dan pudar di tepi medan
  float kabut = 1.0 - exp(-uKabut * uKabut * vJarak * vJarak);
  col = mix(col, uBg, clamp(kabut + smoothstep(14.0, 21.0, length(vPos.xz)), 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
}`

// Partikel: bara kecil, api (besar, aditif), dan asap (besar, redup). Semuanya lahir di dalam elips zona dan hanyut searah angin.
const KepalaPartikel = /* glsl */`
attribute vec4 aBenih;
uniform float uTime, uPhi, uU, uPx;
uniform vec3 uA, uB, uC;
varying float vAlpha; varying float vT;
vec2 lahir(float zona, float r, float ang) {
  vec2 dir = vec2(sin(uPhi), cos(uPhi));
  vec2 lokal = vec2(zona == 0.0 ? uA.x : uA.y, zona == 0.0 ? uB.x : uB.y) * vec2(r * cos(ang), r * sin(ang));
  return (zona == 0.0 ? uC.x : uC.y) * dir + lokal.x * dir + lokal.y * vec2(dir.y, -dir.x);
}`

export const VERT_BARA = /* glsl */`${KepalaPartikel}
void main() {
  float t = fract(uTime * (0.07 + 0.10 * aBenih.z) + aBenih.w);
  vec2 dir = vec2(sin(uPhi), cos(uPhi));
  vec2 en = lahir(1.0, sqrt(aBenih.y), aBenih.x * 6.2832) + dir * (t * 1.2 + t * t * (0.4 + uU * 0.55));
  float y = 0.05 + t * 3.0 * (0.6 + aBenih.z * 0.6);
  vec4 mv = modelViewMatrix * vec4(en.x, y, -en.y, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (1.0 - t * 0.55) * (0.07 + 0.11 * aBenih.z) * uPx / -mv.z;
  vAlpha = sin(3.14159 * t) * (0.45 + 0.55 * aBenih.z); vT = t;
}`
export const FRAG_BARA = /* glsl */`
varying float vAlpha; varying float vT;
void main() {
  float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)) * vAlpha;
  gl_FragColor = vec4(mix(vec3(1.0, 0.82, 0.40), vec3(1.0, 0.32, 0.12), vT) * a, a);
}`

export const VERT_API = /* glsl */`${KepalaPartikel}
void main() {
  float t = fract(uTime * (0.45 + 0.5 * aBenih.z) + aBenih.w);
  vec2 dir = vec2(sin(uPhi), cos(uPhi));
  vec2 en = lahir(0.0, sqrt(aBenih.y), aBenih.x * 6.2832) + dir * t * 0.5;
  float y = 0.04 + t * (0.55 + 0.8 * aBenih.z);
  vec4 mv = modelViewMatrix * vec4(en.x, y, -en.y, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (0.30 + 0.45 * aBenih.z) * (1.0 - t * 0.65) * uPx / -mv.z;
  vAlpha = sin(3.14159 * min(t * 1.25, 1.0)) * 0.55; vT = t;
}`
export const FRAG_API = /* glsl */`
varying float vAlpha; varying float vT;
void main() {
  float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)) * vAlpha;
  gl_FragColor = vec4(mix(vec3(1.0, 0.86, 0.42), vec3(0.92, 0.18, 0.05), vT) * a, a);
}`

export const VERT_ASAP = /* glsl */`${KepalaPartikel}
void main() {
  float t = fract(uTime * (0.028 + 0.035 * aBenih.z) + aBenih.w);
  vec2 dir = vec2(sin(uPhi), cos(uPhi));
  vec2 en = lahir(1.0, sqrt(aBenih.y), aBenih.x * 6.2832) + dir * (t * 2.2 + t * t * (0.8 + uU * 0.9));
  float y = 0.5 + t * 4.4;
  vec4 mv = modelViewMatrix * vec4(en.x, y, -en.y, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (0.9 + 1.7 * t) * (0.8 + aBenih.z * 0.6) * uPx / -mv.z;
  vAlpha = sin(3.14159 * t) * 0.20; vT = t;
}`
export const FRAG_ASAP = /* glsl */`
varying float vAlpha; varying float vT;
void main() {
  float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)) * vAlpha;
  vec3 c = mix(vec3(0.62, 0.30, 0.15), vec3(0.15, 0.16, 0.17), smoothstep(0.0, 0.3, vT));
  gl_FragColor = vec4(c, a);
}`

export const VERT_RANGKA = /* glsl */`
varying float vY;
void main() { vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
export const FRAG_RANGKA = /* glsl */`
varying float vY;
void main() {
  float t = clamp((vY + 1.6) / 3.2, 0.0, 1.0);
  vec3 c = mix(vec3(0.012, 0.022, 0.018), vec3(0.075, 0.105, 0.085), t);
  float lap = abs(fract(vY * 2.2) - 0.5);
  c += vec3(0.06, 0.09, 0.07) * (1.0 - smoothstep(0.0, 0.05, lap)) * 0.8;
  gl_FragColor = vec4(c, 1.0);
}`

// Kunang-kunang dan lampu rumah: titik cahaya aditif yang berkedip. uGerak=1 membuatnya melayang pelan.
export const VERT_KILAU = /* glsl */`
attribute vec4 aBenih;
uniform float uTime, uPx, uUkuran, uGerak, uLaju;
varying float vAlpha;
void main() {
  float ph = aBenih.x * 6.2832;
  vec3 p = position + uGerak * vec3(sin(uTime * 0.35 + ph) * 1.1 + sin(uTime * 0.9 + ph * 2.0) * 0.3, sin(uTime * 0.6 + ph * 1.7) * 0.35, cos(uTime * 0.3 + ph * 1.3) * 1.1);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uUkuran * (0.7 + 0.5 * aBenih.y) * uPx / -mv.z;
  float k = 0.5 + 0.5 * sin(uTime * uLaju * (0.8 + aBenih.z * 1.4) + ph * 3.0);
  vAlpha = mix(0.8 + 0.2 * k, k * k, uGerak);
}`
export const FRAG_KILAU = /* glsl */`
uniform vec3 uWarna;
varying float vAlpha;
void main() {
  float a = pow(smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)), 1.5) * vAlpha;
  gl_FragColor = vec4(uWarna * a, a);
}`

// Semprotan air dari truk pemadam: titik-titik melengkung dari nozzle ke garis api.
export const VERT_AIR = /* glsl */`
attribute vec4 aBenih;
uniform float uTime, uPx, uAktif;
uniform vec3 uDari, uKe;
varying float vAlpha;
void main() {
  float t = fract(uTime * 0.85 + aBenih.w);
  vec3 p = mix(uDari, uKe, t);
  p.y += 4.0 * t * (1.0 - t) * 1.7;
  p += (aBenih.xyz - 0.5) * 0.16 * (0.3 + t * 1.6);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (0.10 + 0.10 * aBenih.z) * (0.8 + t) * uPx / -mv.z;
  vAlpha = uAktif * smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.82, 1.0, t)) * 0.85;
}`
export const FRAG_AIR = /* glsl */`
varying float vAlpha;
void main() {
  float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)) * vAlpha;
  gl_FragColor = vec4(vec3(0.62, 0.84, 1.0) * a, a);
}`
