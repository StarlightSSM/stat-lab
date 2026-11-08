// main.js — the 3D book: desk scene, book model, page turning, camera, routing, UI.
// Layering: the CSS3D layer (live HTML pages) sits UNDER a transparent WebGL canvas. Page-shaped "hole"
// meshes write alpha 0, so the HTML shows through exactly where the paper is, while 3D things that are
// in front (a turning sheet, pop-up figures, the ribbon, shadows) are drawn over it.
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as TX from './textures.js';
import { snapshot } from './snap.js';
import { createPages } from './pages.js';
import { createFigs } from './figs.js';

const W = 1, HP = 1.38, BT = 0.014, STK = 0.08, EPS = 0.0007, MAT_Y = 0.006;
const CW = W + 0.032, CH = HP + 0.06;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s) => document.querySelector(s);
const clamp = THREE.MathUtils.clamp, lerp = THREE.MathUtils.lerp;
const easeIO = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeO = (k) => 1 - Math.pow(1 - k, 3);
const body = document.body;

/* ---------------- renderers ---------------- */
const world = $('#world'), stash = $('#stash');
let gl = null;
try { gl = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch (e) { gl = null; }
if (!gl || !gl.getContext()) { body.classList.add('no-gl'); $('#nogl').hidden = false; throw new Error('WebGL unavailable'); }
const css3d = new CSS3DRenderer();
css3d.domElement.className = 'bk-css';
world.appendChild(css3d.domElement);
gl.domElement.className = 'bk-gl';
world.appendChild(gl.domElement);
gl.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
gl.shadowMap.enabled = true;
gl.shadowMap.type = THREE.PCFSoftShadowMap;
gl.toneMapping = THREE.ACESFilmicToneMapping;
gl.toneMappingExposure = 1.0;
const maxAniso = gl.capabilities.getMaxAnisotropy();

const scene = new THREE.Scene(), cssScene = new THREE.Scene();
scene.background = new THREE.Color('#2c2722');
const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.05, 80);
const camTarget = new THREE.Vector3();
function setCam(pos, target) { camera.position.copy(pos); camTarget.copy(target); camera.lookAt(camTarget); camera.updateMatrixWorld(); kick(); }

/* ---------------- lights ---------------- */
const hemi = new THREE.HemisphereLight('#fff3e0', '#5d554a', 1.15);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff0da', 2.5);
sun.position.set(-3.0, 5.2, -2.4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -2.8, right: 2.8, top: 2.4, bottom: -2.4, near: 1, far: 14 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.012;
scene.add(sun, sun.target);
const lamp = new THREE.SpotLight('#ffc98c', 0, 0, 0.78, 0.85, 2);
lamp.position.set(1.9, 2.4, -1.1);
lamp.target.position.set(-0.1, 0, 0.15);
lamp.castShadow = false; // ShadowMaterial would darken by every shadow-casting light, even at 0 intensity
lamp.shadow.mapSize.set(1024, 1024);
lamp.shadow.bias = -0.0005;
scene.add(lamp, lamp.target);

/* window frame: invisible geometry that only casts shadows (soft diagonal light like a sunny desk) */
(function windowShadows() {
  const L = sun.position.clone().sub(sun.target.position).normalize();
  const occ = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  const lift = 2.2;
  const shape = (cx, cz, w, d, rot) => {
    const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, occ); m.rotation.y = rot; m.castShadow = true;
    // a shadow cast straight down from height h lands shifted by -L.xz * h / L.y; pre-compensate so it lands at (cx, cz)
    m.position.set(cx + L.x * lift / L.y, lift, cz + L.z * lift / L.y); scene.add(m);
  };
  shape(-2.55, 0.1, 0.1, 5.2, 0.5);      // mullion across the left of the desk
  shape(-2.05, 1.6, 2.6, 0.1, 0.5);      // transom
  shape(3.4, -0.6, 2.4, 7.0, 0.5);       // wall edge shading the far right
})();

/* ---------------- desk ---------------- */
const desk = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), new THREE.MeshStandardMaterial({ map: TX.woodTexture(), roughness: 0.6 }));
desk.rotation.x = -Math.PI / 2;
desk.receiveShadow = true;
scene.add(desk);
(function deskMat() {
  const w = 3.7, d = 2.55, r = 0.08, s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -d / 2); s.lineTo(w / 2 - r, -d / 2); s.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r); s.lineTo(w / 2, d / 2 - r); s.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  s.lineTo(-w / 2 + r, d / 2); s.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r); s.lineTo(-w / 2, -d / 2 + r); s.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  const g = new THREE.ExtrudeGeometry(s, { depth: MAT_Y, bevelEnabled: false }); g.rotateX(-Math.PI / 2);
  const t = TX.feltTexture(); t.repeat.set(1.2, 1.2);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: t, roughness: 0.97 }));
  m.position.set(0, 0, 0.05); m.receiveShadow = true; scene.add(m);
  // stitched border
  const pts = s.getSpacedPoints(400).map((p) => new THREE.Vector3(p.x * 0.985, MAT_Y + 0.0006, -p.y * 0.985 + 0.05));
  const line = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#c9d3cc', transparent: true, opacity: 0.55 }));
  scene.add(line);
})();

/* ---------------- book ---------------- */
const book = new THREE.Group();
book.position.y = MAT_Y;
scene.add(book);
const mCloth = new THREE.MeshStandardMaterial({ map: TX.clothTexture('#c9952f'), roughness: 0.86, side: THREE.DoubleSide });
const mTitle = new THREE.MeshStandardMaterial({ map: TX.clothTexture('#c9952f'), roughness: 0.86 });
const mEnd = new THREE.MeshStandardMaterial({ map: TX.endpaperTexture(), roughness: 0.92 });
const mEdge = new THREE.MeshStandardMaterial({ map: TX.edgeTexture(), roughness: 0.95 });
const mPaper = new THREE.MeshStandardMaterial({ color: '#f3ede0', roughness: 0.95 });
const mClothPlain = new THREE.MeshStandardMaterial({ map: TX.clothTexture('#c9952f'), roughness: 0.86 });

const back = new THREE.Mesh(new THREE.BoxGeometry(CW, BT, CH), [mClothPlain, mClothPlain, mEnd, mClothPlain, mClothPlain, mClothPlain]);
back.position.set(CW / 2, BT / 2, 0); back.castShadow = back.receiveShadow = true; book.add(back);
const coverPivot = new THREE.Group(); book.add(coverPivot);
const front = new THREE.Mesh(new THREE.BoxGeometry(CW, BT, CH), [mClothPlain, mClothPlain, mTitle, mEnd, mClothPlain, mClothPlain]);
front.position.set(CW / 2, BT / 2, 0); front.castShadow = front.receiveShadow = true; coverPivot.add(front);
const spineGeo = new THREE.CylinderGeometry(1, 1, CH, 28, 1, true, Math.PI, Math.PI); spineGeo.rotateX(Math.PI / 2);
const spine = new THREE.Mesh(spineGeo, mCloth); spine.castShadow = true; book.add(spine);

const stackGeo = new THREE.BoxGeometry(W, 1, HP);
const stackL = new THREE.Mesh(stackGeo, [mEdge, mEdge, mPaper, mPaper, mEdge, mEdge]);
const stackR = new THREE.Mesh(stackGeo, [mEdge, mEdge, mPaper, mPaper, mEdge, mEdge]);
stackL.receiveShadow = stackR.receiveShadow = true;
book.add(stackL, stackR);

const holeMat = new THREE.ShaderMaterial({ vertexShader: 'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}', fragmentShader: 'void main(){gl_FragColor=vec4(0.0);}', blending: THREE.NoBlending });
const pageGeo = new THREE.PlaneGeometry(W, HP); pageGeo.rotateX(-Math.PI / 2);
const holeL = new THREE.Mesh(pageGeo, holeMat), holeR = new THREE.Mesh(pageGeo, holeMat);
const shadeMat = new THREE.ShadowMaterial({ opacity: 0.2, depthWrite: false });
const shadeL = new THREE.Mesh(pageGeo, shadeMat), shadeR = new THREE.Mesh(pageGeo, shadeMat);
shadeL.receiveShadow = shadeR.receiveShadow = true; shadeL.renderOrder = shadeR.renderOrder = 2;
book.add(holeL, holeR, shadeL, shadeR);

/* ribbon bookmark */
const ribbonMat = new THREE.MeshStandardMaterial({ color: '#1f2d5c', roughness: 0.55, side: THREE.DoubleSide });
const ribbon = new THREE.Mesh(new THREE.BufferGeometry(), ribbonMat); ribbon.castShadow = true; book.add(ribbon);
let ribbonTop = -1;
function buildRibbon(top) {
  if (Math.abs(top - ribbonTop) < 1e-4) return; ribbonTop = top;
  const c = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.006, top + 0.0012, HP / 2 - 0.05), new THREE.Vector3(0.02, top + 0.0016, HP / 2 - 0.012),
    new THREE.Vector3(0.05, top * 0.55, HP / 2 + 0.045), new THREE.Vector3(0.085, 0.0016, HP / 2 + 0.13), new THREE.Vector3(0.16, 0.0012, HP / 2 + 0.33),
  ]);
  const n = 48, wdt = 0.03, pos = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const p = c.getPointAt(i / n), tng = c.getTangentAt(i / n), side = new THREE.Vector3().crossVectors(tng, new THREE.Vector3(0, 1, 0)).normalize().multiplyScalar(wdt / 2);
    pos.push(p.x - side.x, p.y, p.z - side.z, p.x + side.x, p.y, p.z + side.z);
    if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  ribbon.geometry.dispose(); ribbon.geometry = g;
}

/* ---------------- turning sheets ---------------- */
const NX = 36, NZ = 8;
const SHEET_VS = `varying vec2 vUv; varying vec3 vN;
void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SHEET_FS = `uniform sampler2D mapF; uniform sampler2D mapB; uniform vec3 uL; uniform vec3 uTint; uniform float uOpacity;
varying vec2 vUv; varying vec3 vN;
void main(){
  vec3 n = normalize(vN); vec4 c;
  if (gl_FrontFacing) { c = texture2D(mapF, vUv); } else { n = -n; c = texture2D(mapB, vec2(1.0 - vUv.x, vUv.y)); }
  float sh = clamp(0.5 + 0.5 * dot(n, uL) / max(uL.y, 0.2), 0.45, 1.06);
  gl_FragColor = vec4(c.rgb * sh, uOpacity);
  #include <colorspace_fragment>
  gl_FragColor.rgb *= uTint;
}`;
const sheetLight = new THREE.Vector3(-0.35, 0.85, 0.42).normalize();
const sheetTint = new THREE.Color(1, 1, 1);
class Sheet {
  constructor() {
    const n = (NX + 1) * (NZ + 1), g = new THREE.BufferGeometry();
    this.P = new Float32Array(n * 3); const uv = new Float32Array(n * 2), idx = [];
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const v = j * (NX + 1) + i; uv[v * 2] = i / NX; uv[v * 2 + 1] = 1 - j / NZ; }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + NX + 1, c = a + 1, d = b + 1; idx.push(a, b, c, b, d, c); }
    g.setAttribute('position', new THREE.BufferAttribute(this.P, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
    this.mat = new THREE.ShaderMaterial({ vertexShader: SHEET_VS, fragmentShader: SHEET_FS, side: THREE.DoubleSide, transparent: true,
      uniforms: { mapF: { value: null }, mapB: { value: null }, uL: { value: sheetLight }, uTint: { value: sheetTint }, uOpacity: { value: 1 } } });
    this.mat.shadowSide = THREE.DoubleSide;
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.castShadow = true; this.mesh.frustumCulled = false; this.mesh.visible = false; this.mesh.renderOrder = 3;
    book.add(this.mesh);
  }
  maps(f, b) { this.mat.uniforms.mapF.value = f; this.mat.uniforms.mapB.value = b; this.mat.uniforms.uOpacity.value = 1; this.mesh.visible = true; }
  pose(t, dir, y0, y1) {
    const P = this.P, a = 0.17 * dir, sw = Math.sin(Math.PI * t);
    const H = clamp(Math.PI * (t - a * sw), 0, Math.PI), base = lerp(y0, y1, t) + 0.0012 + 0.006 * sw;
    for (let j = 0; j <= NZ; j++) {
      const v = j / NZ, z = -HP / 2 + HP * v;
      const E = clamp(Math.PI * (t + a * sw) + 0.34 * dir * sw * (v - 0.5), 0, Math.PI), c = (E - H) / W;
      for (let i = 0; i <= NX; i++) {
        const s = (W * i) / NX, o = (j * (NX + 1) + i) * 3; let x, y;
        if (Math.abs(c) < 1e-5) { x = s * Math.cos(H); y = s * Math.sin(H); } else { x = (Math.sin(H + c * s) - Math.sin(H)) / c; y = (Math.cos(H) - Math.cos(H + c * s)) / c; }
        P[o] = x; P[o + 1] = base + y; P[o + 2] = z;
      }
    }
    const g = this.mesh.geometry; g.attributes.position.needsUpdate = true; g.computeVertexNormals();
  }
  hide() { this.mesh.visible = false; this.mat.uniforms.mapF.value = this.mat.uniforms.mapB.value = null; }
}
const sheets = Array.from({ length: 5 }, () => new Sheet());

/* ---------------- HTML page slots (CSS3D) ---------------- */
function makeSlot(side) {
  const el = document.createElement('div'); el.className = `bk-slot is-${side}`;
  const o = new CSS3DObject(el); o.rotation.x = -Math.PI / 2; o.visible = false; cssScene.add(o);
  return { side, el, o, page: null };
}
const slotL = makeSlot('L'), slotR = makeSlot('R');

/* ---------------- pages + figures ---------------- */
let PX = 640, PH = Math.round(640 * HP / W);
const figs = createFigs({ camera, renderer: gl, kick: () => kick(), where });
const pages = createPages({ stash, hooks: {
  onFill(inst) { figs.prune(); [inst.A.L, inst.A.R, inst.B.L, inst.B.R].forEach((el) => figs.scan(el, inst.ctx)); kick(); },
  onStop(inst) { [inst.A.L, inst.A.R, inst.B.L, inst.B.R].forEach((el) => figs.dropPage(el)); },
  onScroll() { kick(); },
} });
const N = pages.spreads.length;

function rel(el, root) {
  let x = 0, y = 0, n = el;
  while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; const p = n.offsetParent; if (p && p !== root) { x -= p.scrollLeft; y -= p.scrollTop; } n = p; }
  return { x, y };
}
function where(figEl) {
  for (const s of [slotL, slotR]) {
    if (!s.page || !s.o.visible || !s.page.contains(figEl)) continue;
    const { x, y } = rel(figEl, s.page), k = W / PX, h = figEl.clientHeight;
    const visible = opened && !orbitOn && y > -h * 0.35 && y + h * 0.65 < PH;
    return { x: (s.side === 'L' ? -W : 0) + x * k, y: book.position.y + s.top, z: -HP / 2 + y * k, k, visible };
  }
  return null;
}

/* ---------------- stacks ---------------- */
let nL = 0, nR = N, opened = false, coverAngle = 0;
const tSheet = STK / (N + 1);
function applyStacks() {
  const hL = Math.max(0.0002, nL * tSheet), hR = Math.max(0.0002, nR * tSheet);
  stackL.visible = nL > 0.01; stackL.scale.y = hL; stackL.position.set(-W / 2, BT + hL / 2, 0);
  stackR.scale.y = hR; stackR.position.set(W / 2, BT + hR / 2, 0);
  const tL = BT + hL, tR = BT + hR;
  slotL.top = tL + EPS; slotR.top = tR + EPS;
  holeL.position.set(-W / 2, tL + EPS * 0.5, 0); holeR.position.set(W / 2, tR + EPS * 0.5, 0);
  shadeL.position.set(-W / 2, tL + EPS * 1.5, 0); shadeR.position.set(W / 2, tR + EPS * 1.5, 0);
  slotL.o.position.set(-W / 2, MAT_Y + tL + EPS, 0); slotR.o.position.set(W / 2, MAT_Y + tR + EPS, 0);
  holeL.visible = shadeL.visible = !!slotL.page && nL > 0.01; holeR.visible = shadeR.visible = !!slotR.page;
  buildRibbon(opened ? Math.max(tL, tR) : tR + BT);
  kick();
}
function applyCover() {
  const s = coverAngle / Math.PI, tR = BT + nR * tSheet;
  coverPivot.rotation.z = coverAngle;
  coverPivot.position.y = lerp(tR, BT, easeIO(s));
  const r0 = (tR + BT) / 2;
  spine.scale.set(lerp(r0, 0.01, s), lerp(r0, BT / 2, s), 1);
  spine.position.y = lerp(r0, BT / 2, s);
  ribbon.visible = s > 0.6;
  kick();
}
function showIn(slot, el) {
  if (slot.page !== el) {
    if (slot.page && slot.page.isConnected) stash.appendChild(slot.page);
    slot.page = el || null;
    if (el) { slot.el.appendChild(el); figs.scan(el, null); }
  }
  slot.o.visible = !!el && (opened || slot.side === 'R');
  applyStacks();
}

/* ---------------- page size ---------------- */
function setPageSize(px) {
  PX = px; PH = Math.round(px * HP / W);
  document.documentElement.style.setProperty('--pw', PX + 'px');
  document.documentElement.style.setProperty('--ph', PH + 'px');
  for (const s of [slotL, slotR]) { s.el.style.width = PX + 'px'; s.el.style.height = PH + 'px'; s.o.scale.setScalar(W / PX); s.page = null; }
  for (const c of texCache.values()) c.tex.dispose();
  texCache.clear();
  pages.setSize(PX, PH);
  figs.prune();
}

/* ---------------- textures from live pages ---------------- */
const texCache = new Map(), texPending = new Map(), retired = [];
const SNAP = Math.min(2, Math.max(1.25, devicePixelRatio || 1));
let blankTex = null;
async function texFor(el) {
  if (!el) return blankTex || (blankTex = TX.genericPage('', 'R', ''));
  const c = texCache.get(el);
  if (c && c.ver === el._ver && !pages.animated(el)) return c.tex;
  if (texPending.has(el)) return texPending.get(el);
  const p = (async () => {
    const ver = el._ver;
    const cv = await snapshot(el, { w: PX, h: PH, scale: SNAP });
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
    const old = texCache.get(el); if (old) retired.push(old.tex);
    texCache.set(el, { tex: t, ver });
    return t;
  })();
  texPending.set(el, p);
  try { return await p; } finally { texPending.delete(el); }
}
function flushRetired() { if (busy) return; while (retired.length) retired.pop().dispose(); for (const [el, c] of texCache) if (!el.isConnected) { c.tex.dispose(); texCache.delete(el); } }

/* ---------------- animation loop ---------------- */
// headless test runs (?test) drive frames with timers: rAF stalls under --virtual-time-budget
const TEST = new URLSearchParams(location.search).has('test');
const RAF = TEST ? (f) => setTimeout(() => f(performance.now()), 90) : (f) => requestAnimationFrame(f);
if (TEST) { gl.setPixelRatio(1); sun.shadow.mapSize.set(1024, 1024); }
const tweens = new Set();
function tween(dur, fn, ease = (k) => k) {
  return new Promise((res) => { if (reduced || dur <= 0) { fn(1); kick(); res(); return; } tweens.add({ t0: performance.now(), dur, fn, ease, res }); kick(); });
}
let dirty = true, last = performance.now();
function kick() { dirty = true; }
function frame(now) {
  if (window.__frozen) { gl.render(scene, camera); css3d.render(cssScene, camera); return; } // test hook: stop the loop so headless screenshots can settle
  RAF(frame);
  window.__frames = (window.__frames || 0) + 1; window.__now = Math.round(now);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  let active = false;
  for (const tw of tweens) { const k = Math.min(1, (now - tw.t0) / tw.dur); tw.fn(tw.ease(k)); active = true; if (k >= 1) { tweens.delete(tw); tw.res(); } }
  if (figs.tick(dt, scene)) active = true;
  if (orbitOn && orbit) { orbit.update(); active = true; }
  if (introSpin && !opened) { const t = now / 1000; const p = introPose(); p.pos.x += Math.sin(t * 0.25) * 0.12; p.pos.z += Math.cos(t * 0.21) * 0.06; setCam(p.pos, p.target); active = true; }
  if (dirty || active) { gl.render(scene, camera); css3d.render(cssScene, camera); dirty = false; }
}

/* ---------------- camera framing ---------------- */
const tmpCam = new THREE.PerspectiveCamera(30, 1, 0.05, 80);
function fitPose(m, sd) {
  const vw = innerWidth, vh = innerHeight;
  tmpCam.fov = camera.fov; tmpCam.aspect = vw / vh; tmpCam.updateProjectionMatrix();
  const y = MAT_Y + BT + STK * 0.5;
  const pg = m === 'page';
  const cx = pg ? (sd === 'L' ? -W / 2 : W / 2) : 0;
  const hw = pg ? W / 2 + 0.03 : W + 0.05, hh = HP / 2 + 0.035;
  const tilt = THREE.MathUtils.degToRad(pg ? 9 : 14);
  const dir = new THREE.Vector3(0, Math.cos(tilt), Math.sin(tilt));
  const bar = vw < 640 ? 76 : 86, edge = vw < 640 ? 6 : 16;
  const lim = { l: -1 + (2 * edge) / vw, r: 1 - (2 * edge) / vw, b: -1 + (2 * bar) / vh, t: 1 - (2 * edge) / vh };
  const corners = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([dx, dz]) => new THREE.Vector3(cx + dx, y, dz));
  const target = new THREE.Vector3(cx, y, 0);
  const proj = (d) => { tmpCam.position.copy(target).addScaledVector(dir, d); tmpCam.lookAt(target); tmpCam.updateMatrixWorld(); return corners.map((c) => c.clone().project(tmpCam)); };
  let d = 3;
  for (let it = 0; it < 3; it++) {
    let lo = 0.3, hi = 40;
    for (let k = 0; k < 36; k++) { const mid = (lo + hi) / 2, p = proj(mid); if (p.every((q) => q.x >= lim.l && q.x <= lim.r && q.y >= lim.b && q.y <= lim.t)) hi = mid; else lo = mid; }
    d = hi;
    const p = proj(d), ymin = Math.min(...p.map((q) => q.y)), ymax = Math.max(...p.map((q) => q.y));
    target.z += ((lim.b + lim.t) / 2 - (ymin + ymax) / 2) * d * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 0.9;
  }
  const pos = target.clone().addScaledVector(dir, d);
  tmpCam.position.copy(pos); tmpCam.lookAt(target); tmpCam.updateMatrixWorld();
  const x0 = pg ? cx - W / 2 : 0;
  const a = new THREE.Vector3(x0, y, 0).project(tmpCam), b = new THREE.Vector3(x0 + W, y, 0).project(tmpCam);
  return { pos, target, pagePx: (Math.abs(b.x - a.x) * vw) / 2 };
}
function introPose() {
  const asp = innerWidth / innerHeight, k = Math.max(1, 1.25 / asp);
  const wide = asp > 1.1, target = new THREE.Vector3(CW / 2 - (wide ? 0.62 : 0), 0.02, wide ? 0.12 : 0.25);
  const pos = target.clone().add(new THREE.Vector3(1.0 * k, 2.5 * k, 2.45 * k));
  return { pos, target };
}
function moveCamera(pose, dur = 900) {
  const p0 = camera.position.clone(), t0 = camTarget.clone();
  return tween(dur, (k) => { setCam(p0.clone().lerp(pose.pos, k), t0.clone().lerp(pose.target, k)); }, easeIO);
}

/* ---------------- modes ---------------- */
let mode = 'spread', side = 'L', userMode = null, orbitOn = false, orbit = null, introSpin = !reduced;
const pose = () => fitPose(mode, side);
function autoMode() { return fitPose('spread').pagePx >= 470 ? 'spread' : 'page'; }
function fixSide() { const sp = pages.get(cur); if (!sp.L) side = 'R'; if (!sp.R) side = 'L'; }

/* ---------------- navigation ---------------- */
let cur = 0, busy = false, queued = null, opening = null;
function labelOf(i) { return pages.spreads[i] ? pages.spreads[i].label : ''; }
async function openBook() {
  if (opened) return;
  if (opening) return opening;
  opening = (async () => {
    introSpin = false; (window.__log||[]).push('open start');
    body.classList.add('is-open');
    figs.setFlipping(true);
    showIn(slotR, pages.get(0).R);
    flipSound(0.9);
    side = 'R';
    await Promise.all([
      tween(1500, (k) => { coverAngle = easeIO(k) * Math.PI; applyCover(); }),
      moveCamera(pose(), 1750),
    ]);
    opened = true; (window.__log||[]).push('opened');
    showIn(slotL, null); showIn(slotR, pages.get(0).R);
    figs.setFlipping(false);
    updateUI(); prefetch();
  })();
  return opening;
}
async function go(target, opts = {}) {
  target = clamp(target | 0, 0, N - 1);
  if (!opened) await openBook();
  if (busy) { queued = { target, opts }; return; }
  if (target === cur) { if (opts.side && mode === 'page') focusSide(opts.side); return; }
  busy = true; body.classList.add('is-turning');
  try { await flipTo(target, opts); } catch (e) { console.error(e); hardSet(target); }
  busy = false; body.classList.remove('is-turning');
  flushRetired();
  if (queued) { const q = queued; queued = null; go(q.target, q.opts); }
}
function hardSet(i) {
  cur = i; const sp = pages.get(i); nL = i; nR = N - i;
  sheets.forEach((s) => s.hide()); showIn(slotL, sp.L); showIn(slotR, sp.R); figs.setFlipping(false); updateUI();
}
window.__log = [];
const dbg = (...a) => { window.__log.push(a.join(' ')); if (window.__log.length > 40) window.__log.shift(); };
async function flipTo(target, opts) {
  dbg('flip', cur, '->', target);
  const dir = target > cur ? 1 : -1, dist = Math.abs(target - cur), n = Math.min(dist, 5);
  const from = pages.get(cur), to = pages.get(target);
  const frontEl = dir > 0 ? from.R : from.L, backEl = dir > 0 ? to.L : to.R;
  body.classList.add('is-loading');
  const [tA, tB] = await Promise.all([texFor(frontEl), texFor(backEl)]);
  body.classList.remove('is-loading');
  dbg('tex ok');
  figs.setFlipping(true);
  const gen = [], g = (i, sd) => { const t = TX.genericPage(pages.pageNo(i, sd), sd, labelOf(i)); gen.push(t); return t; };
  const use = sheets.slice(0, n);
  use.forEach((sh, k) => {
    if (dir > 0) sh.maps(k === 0 ? tA : g(cur + k, 'R'), k === n - 1 ? tB : g(cur + k + 1, 'L'));
    else sh.maps(k === n - 1 ? tB : g(cur - k - 1, 'R'), k === 0 ? tA : g(cur - k, 'L'));
  });
  const nL0 = nL, nR0 = nR, nL1 = target, nR1 = N - target;
  const top = (cnt) => BT + Math.max(0.0002, cnt * tSheet);
  // reveal the page underneath right away (the sheet covers it at first)
  if (dir > 0) { nR = nR1; showIn(slotR, to.R); } else { nL = nL1; showIn(slotL, to.L); }
  const srcTop0 = dir > 0 ? top(nR0) : top(nL0), dstTop1 = dir > 0 ? top(nL1) : top(nR1);
  const durOne = n === 1 ? 980 : 720, stag = n === 1 ? 0 : 130, total = durOne + stag * (n - 1);
  flipSound(n === 1 ? 1 : 1.4);
  let camP = null;
  if (mode === 'page') { side = opts.side || (dir > 0 ? 'L' : 'R'); cur = target; fixSide(); camP = moveCamera(pose(), total + 120); cur = target - dir * dist; }
  await tween(total, (K) => {
    const ms = K * total;
    use.forEach((sh, k) => {
      const loc = easeIO(clamp((ms - k * stag) / durOne, 0, 1));
      const y0 = srcTop0 - k * tSheet * 0.5 - 0.0004 * 0, y1 = dstTop1 + (n - 1 - k) * 0.0003;
      if (dir > 0) sh.pose(loc, 1, y0, y1); else sh.pose(1 - loc, -1, y1, y0);
    });
    if (dir > 0) nL = lerp(nL0, nL1, K); else nR = lerp(nR0, nR1, K);
    applyStacks();
  });
  dbg('tween done');
  if (camP) await camP;
  cur = target; nL = nL1; nR = nR1;
  if (dir > 0) showIn(slotL, to.L); else showIn(slotR, to.R);
  const topSheet = use[n - 1];
  use.slice(0, n - 1).forEach((s) => s.hide());
  await tween(240, (k) => { topSheet.mat.uniforms.uOpacity.value = 1 - k; });
  topSheet.hide();
  gen.forEach((t) => t.dispose());
  figs.setFlipping(false);
  updateUI(); prefetch();
}
function focusSide(sd) { side = sd; fixSide(); moveCamera(pose(), 700); updateUI(); }
function next() {
  if (!opened) return openBook();
  if (mode === 'page' && side === 'L' && pages.get(cur).R) return focusSide('R');
  if (cur < N - 1) go(cur + 1, { side: 'L' });
}
function prev() {
  if (!opened) return;
  if (mode === 'page' && side === 'R' && pages.get(cur).L) return focusSide('L');
  if (cur > 0) go(cur - 1, { side: 'R' });
}

/* prefetch neighbours: build their DOM and snapshot the faces the next turn will need */
let prefetchToken = 0;
const idle = () => new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(() => r(), { timeout: 400 }) : setTimeout(r, 60)));
async function prefetch() {
  const my = ++prefetchToken, i = cur;
  pages.keep([i - 2, i - 1, i, i + 1, i + 2]);
  figs.prune(); flushRetired();
  await idle();
  const here = pages.get(i), jobs = [];
  if (i + 1 < N) { jobs.push(() => texFor(here.R)); jobs.push(() => texFor(pages.get(i + 1).L)); }
  if (i - 1 >= 0) { jobs.push(() => texFor(here.L)); jobs.push(() => texFor(pages.get(i - 1).R)); }
  for (const j of jobs) { if (my !== prefetchToken || busy) return; try { await j(); } catch (e) { /* ignore */ } await idle(); }
}

/* ---------------- routing ---------------- */
function indexOfHash(h) {
  h = decodeURIComponent((h || '').replace(/^#/, ''));
  if (!h || h === 'home') return null;
  if (h in pages.byKey) return pages.byKey[h];
  const base = h.split('/')[0];
  if (base in pages.byKey) return pages.byKey[base];
  return null;
}
addEventListener('hashchange', () => { const i = indexOfHash(location.hash); if (i != null) { closeToc(); go(i, { side: 'L' }); } });

/* ---------------- UI ---------------- */
const bar = $('#bar');
function updateUI() {
  const sp = pages.spreads[cur];
  const no = mode === 'page' ? pages.pageNo(cur, side) : (pages.get(cur).L ? `${pages.pageNo(cur, 'L')}–${pages.pageNo(cur, 'R')}` : pages.pageNo(cur, 'R'));
  $('#b-label .no').textContent = no + '쪽';
  $('#b-label .t').textContent = sp.label;
  $('#b-prev').disabled = cur === 0 && !(mode === 'page' && side === 'R' && pages.get(cur).L);
  $('#b-next').disabled = cur === N - 1 && !(mode === 'page' && side === 'L');
  if (opened) history.replaceState(null, '', '#' + sp.key);
  document.title = (cur ? sp.label + ' · ' : '') + '연구통계 실험실';
  if (sp.kind === 'modA') { const v = Lab.store.get('visited', []); if (!v.includes(sp.m.id)) { v.push(sp.m.id); Lab.store.set('visited', v); } }
  $('#b-view').setAttribute('aria-label', mode === 'page' ? '펼침면으로 보기' : '한 쪽씩 크게 보기');
  $('#b-view').dataset.mode = mode;
  $('#b-flat').href = 'classic' + (sp.m ? '#' + sp.m.id : sp.s ? '#s-' + sp.s.id : sp.kind === 'lib' ? '#lib' : '');
  paintToc();
}
$('#b-prev').addEventListener('click', prev);
$('#b-next').addEventListener('click', next);
$('#b-toc').addEventListener('click', () => openToc());
$('#b-label').addEventListener('click', () => openToc());
$('#b-view').addEventListener('click', () => { if (orbitOn) setOrbit(false); userMode = mode === 'page' ? 'spread' : 'page'; mode = userMode; fixSide(); moveCamera(pose(), 800); updateUI(); });
$('#b-orbit').addEventListener('click', () => setOrbit(!orbitOn));
$('#b-night').addEventListener('click', () => setNight(!body.classList.contains('night')));
$('#b-sound').addEventListener('click', () => { soundOn = !soundOn; $('#b-sound').setAttribute('aria-pressed', String(soundOn)); try { localStorage.setItem('statlab.sound', soundOn ? '1' : '0'); } catch (e) { /* ignore */ } if (soundOn) flipSound(0.6); });
$('#intro-open').addEventListener('click', () => { const i = indexOfHash(location.hash); i ? go(i, { side: 'L' }) : openBook(); });
$('#intro').addEventListener('click', (e) => { if (e.target.closest('a')) return; if (!e.target.closest('button')) openBook(); });

// corners of pages turn the page
world.addEventListener('click', (e) => { const c = e.target.closest('.bk-corner'); if (!c) return; c.dataset.dir === 'next' ? go(cur + 1, { side: 'L' }) : go(cur - 1, { side: 'R' }); });
// swipe on touch screens
let sw = null;
world.addEventListener('touchstart', (e) => { const t = e.touches[0]; if (e.touches.length !== 1 || e.target.closest('input, select, textarea, .fig3d, svg, .code, .tbl-scroll')) { sw = null; return; } sw = { x: t.clientX, y: t.clientY, t: performance.now() }; }, { passive: true });
world.addEventListener('touchend', (e) => { if (!sw) return; const t = e.changedTouches[0], dx = t.clientX - sw.x, dy = t.clientY - sw.y; if (Math.abs(dx) > 70 && Math.abs(dy) < 50 && performance.now() - sw.t < 600) (dx < 0 ? next : prev)(); sw = null; }, { passive: true });

addEventListener('keydown', (e) => {
  const tag = (e.target.tagName || '').toLowerCase();
  if (e.key === 'Escape') { if (!$('#toc').hidden) closeToc(); else if (orbitOn) setOrbit(false); return; }
  if (['input', 'select', 'textarea'].includes(tag) || e.target.isContentEditable || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); next(); }
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
  else if (e.key === 'Home') { e.preventDefault(); go(1); }
  else if (e.key === 'Enter' && !opened) { e.preventDefault(); openBook(); }
});

/* table of contents drawer */
function tocHtml(q) {
  q = (q || '').trim().toLowerCase();
  const visited = Lab.store.get('visited', []);
  const item = (i, label, extra = '') => `<a href="#${pages.spreads[i].key}" data-i="${i}" class="${i === cur || pages.spreads[cur].m && pages.spreads[i].m === pages.spreads[cur].m ? 'on' : ''}">${label}${extra}<span class="toc-p">${pages.pageNo(i, i ? 'L' : 'R')}</span></a>`;
  let html = '';
  if (!q) html += `<div class="tg">${item(0, '표제지')}${item(1, '차례 · 이 책을 읽는 법')}</div>`;
  Lab.subjects.forEach((s, ci) => {
    const ms = Lab.modsOf(s.id).filter((m) => !q || (m.title + ' ' + (m.en || '') + ' ' + (m.keywords || '') + ' ' + s.name).toLowerCase().includes(q));
    if (q && !ms.length) return;
    html += `<div class="tg" style="--subj:${s.color}"><div class="tg-h">${item(pages.byKey['s-' + s.id], `<i></i><b>${ci + 1}. ${s.name}</b>`)}</div>
      ${ms.map((m) => item(pages.byKey[m.id], `<span class="tm">${visited.includes(m.id) ? '<em class="seen">✓</em>' : '<em class="unseen"></em>'}${m.title}</span>`)).join('')}</div>`;
  });
  if (!q) html += `<div class="tg">${item(pages.byKey.lib, '공개 강의자료')}${item(pages.byKey.index, '찾아보기')}${item(pages.byKey.colophon, '맺음말')}</div>`;
  return html || '<p class="muted">찾는 실험이 없습니다.</p>';
}
function paintToc() { if (!$('#toc').hidden) $('#toc-list').innerHTML = tocHtml($('#toc-q').value); }
function openToc() { const t = $('#toc'); t.hidden = false; body.classList.add('toc-open'); $('#toc-list').innerHTML = tocHtml($('#toc-q').value); requestAnimationFrame(() => $('#toc-q').focus({ preventScroll: true })); const on = t.querySelector('a.on'); on && on.scrollIntoView({ block: 'center' }); }
function closeToc() { $('#toc').hidden = true; body.classList.remove('toc-open'); }
$('#toc-x').addEventListener('click', closeToc);
$('#toc-scrim').addEventListener('click', closeToc);
$('#toc-q').addEventListener('input', paintToc);
$('#toc-list').addEventListener('click', (e) => { const a = e.target.closest('a[data-i]'); if (!a) return; e.preventDefault(); closeToc(); go(+a.dataset.i, { side: 'L' }); });

/* orbit ("둘러보기") */
function setOrbit(on) {
  orbitOn = on;
  body.classList.toggle('is-orbit', on);
  $('#b-orbit').setAttribute('aria-pressed', String(on));
  if (on) {
    if (!orbit) { orbit = new OrbitControls(camera, css3d.domElement); orbit.enableDamping = true; orbit.dampingFactor = 0.08; orbit.minDistance = 0.9; orbit.maxDistance = 7; orbit.maxPolarAngle = 1.38; orbit.addEventListener('change', () => { camTarget.copy(orbit.target); kick(); }); }
    orbit.target.copy(camTarget); orbit.enabled = true; orbit.update();
    figs.setFlipping(false);
    toast('끌어서 책상을 둘러보세요 · Esc 또는 같은 버튼으로 돌아갑니다');
  } else { if (orbit) orbit.enabled = false; moveCamera(pose(), 900); }
  kick();
}

/* night lamp */
function setNight(on) {
  body.classList.toggle('night', on);
  $('#b-night').setAttribute('aria-pressed', String(on));
  sun.intensity = on ? 0.05 : 2.5; hemi.intensity = on ? 0.16 : 1.15; lamp.intensity = on ? 26 : 0; lamp.castShadow = on; sun.castShadow = !on;
  scene.background.set(on ? '#0d0b09' : '#2c2722');
  shadeMat.opacity = on ? 0.38 : 0.2;
  gl.toneMappingExposure = on ? 1.1 : 1.0;
  sheetTint.set(on ? 0.92 : 1, on ? 0.82 : 1, on ? 0.66 : 1);
  figs.setNight(on);
  try { localStorage.setItem('statlab.night', on ? '1' : '0'); } catch (e) { /* ignore */ }
  kick();
}

/* page-turn sound (synthesised, off by default) */
let soundOn = false, actx = null;
try { soundOn = localStorage.getItem('statlab.sound') === '1'; } catch (e) { /* ignore */ }
$('#b-sound').setAttribute('aria-pressed', String(soundOn));
function flipSound(len = 1) {
  if (!soundOn) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const dur = 0.42 * len, sr = actx.sampleRate, buf = actx.createBuffer(1, Math.floor(sr * dur), sr), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) { const x = i / d.length; d[i] = (Math.random() * 2 - 1) * Math.pow(Math.sin(Math.PI * Math.min(1, x * 1.6)), 1.5) * (1 - x) * (0.6 + 0.4 * Math.random()); }
    const src = actx.createBufferSource(); src.buffer = buf;
    const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.8; const t = actx.currentTime;
    bp.frequency.setValueAtTime(700, t); bp.frequency.exponentialRampToValueAtTime(3200, t + dur);
    const gn = actx.createGain(); gn.gain.value = 0.32;
    src.connect(bp).connect(gn).connect(actx.destination); src.start();
  } catch (e) { /* audio unavailable */ }
}

let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3200); }

/* ---------------- sizing ---------------- */
function resize() { gl.setSize(innerWidth, innerHeight); css3d.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); kick(); }
let rsT = 0, lastW = innerWidth, lastH = innerHeight;
addEventListener('resize', () => {
  resize();
  clearTimeout(rsT);
  rsT = setTimeout(() => {
    mode = userMode || autoMode(); fixSide();
    const px = clamp(Math.round(fitPose(mode, side).pagePx), 340, 900);
    if (Math.abs(px - PX) / PX > 0.14 && (Math.abs(innerWidth - lastW) > 40 || Math.abs(innerHeight - lastH) > 40)) {
      lastW = innerWidth; lastH = innerHeight;
      if (!busy) { setPageSize(px); const sp = pages.get(cur); showIn(slotL, opened ? sp.L : null); showIn(slotR, sp.R); prefetch(); }
    }
    if (orbitOn) return;
    if (opened) setCam(pose().pos, pose().target); else { const p = introPose(); setCam(p.pos, p.target); }
    updateUI();
  }, 200);
});

/* ---------------- start ---------------- */
function start() {
  resize();
  mode = autoMode();
  setPageSize(clamp(Math.round(fitPose(mode, 'R').pagePx), 340, 900));
  try { if (localStorage.getItem('statlab.night') === '1') setNight(true); } catch (e) { /* ignore */ }
  nL = 0; nR = N; applyStacks(); applyCover();
  showIn(slotR, pages.get(0).R);
  const p = introPose(); setCam(p.pos, p.target);
  RAF(frame);
  body.classList.add('is-ready');
  const i = indexOfHash(location.hash);
  if (i != null || new URLSearchParams(location.search).has('open')) { introSpin = false; setTimeout(() => (i ? go(i, { side: 'L' }) : openBook()), 350); }
  window.__book = { go, next, prev, openBook, get cur() { return cur; }, get busy() { return busy; }, pages, figs, setNight, setOrbit, get mode() { return mode; }, scene, camera,
    // test hook: freeze a forward turn at progress t
    async peek(t) { const sp = pages.get(cur), nx = pages.get(cur + 1); const [a, b] = await Promise.all([texFor(sp.R), texFor(nx.L)]); figs.setFlipping(true); sheets[0].maps(a, b); showIn(slotR, nx.R); sheets[0].pose(t, 1, BT + (N - cur) * tSheet, BT + cur * tSheet); kick(); } };
}
const FACES = ['700 64px "Noto Serif KR"', '500 40px "Noto Serif KR"', '600 30px "IBM Plex Sans KR"', '400 30px "IBM Plex Sans KR"', '500 20px "IBM Plex Mono"'];
const fontsReady = document.fonts ? Promise.all(FACES.map((f) => document.fonts.load(f, '연구통계 실험실 abc 123'))).catch(() => {}) : Promise.resolve();
Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2500))]).then(() => {
  mTitle.map = TX.clothTexture('#c9952f', { title: true }); mTitle.needsUpdate = true;
  start();
});
