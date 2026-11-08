// figs.js — pop-up 3D figures that stand up from a page.
// A page holds a placeholder <figure class="fig3d" data-fig="id">; the figure registered with
// BookFig.add(id, {height, caption, build(api)}) is drawn in WebGL above that spot, in a hatched
// line-art style, and folds flat whenever the page turns.
import * as THREE from 'three';

const HATCH_VS = `
varying vec3 vN; varying vec3 vTint;
void main(){
  vec4 p = vec4(position, 1.0); vec3 nn = normal; vTint = vec3(1.0);
  #ifdef USE_INSTANCING
    p = instanceMatrix * p; nn = mat3(instanceMatrix) * nn;
  #endif
  #ifdef USE_INSTANCING_COLOR
    vTint = instanceColor;
  #endif
  vN = normalize(normalMatrix * nn); gl_Position = projectionMatrix * modelViewMatrix * p;
}`;
const HATCH_FS = `
uniform vec3 uColor; uniform vec3 uPaper; uniform vec3 uInk; uniform vec3 uL;
uniform float uTint; uniform float uHatch; uniform float uDpr; uniform float uOpacity; uniform vec3 uLamp;
varying vec3 vN; varying vec3 vTint;
float lines(float v, float w){ float aa = fwidth(v) * 0.9; float d = abs(fract(v) - 0.5); return 1.0 - smoothstep(w - aa, w + aa, d); }
void main(){
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  float lam = max(dot(n, normalize(uL)), 0.0);
  float light = clamp(0.30 + 0.78 * lam, 0.0, 1.0);
  float D = 1.0 - light;
  vec3 base = mix(uPaper, uColor * vTint, uTint) * mix(1.0, 0.82, D);
  vec2 p = gl_FragCoord.xy / uDpr;
  float h1 = lines((p.x + p.y) / 4.6, clamp(D * 0.55, 0.0, 0.42)) * step(0.12, D);
  float h2 = lines((p.x - p.y) / 4.6, clamp((D - 0.42) * 0.7, 0.0, 0.36)) * step(0.42, D);
  float ink = max(h1, h2) * uHatch;
  vec3 col = mix(base, uInk, ink * 0.5) * uLamp;
  gl_FragColor = vec4(col, uOpacity);
  #include <colorspace_fragment>
}`;

export function createFigs({ camera, renderer, kick, where }) {
  const recs = new Map(); // placeholder element -> record
  const lightDir = new THREE.Vector3(-0.45, 0.8, 0.55).normalize();
  const lamp = new THREE.Vector3(1, 1, 1);
  const css = getComputedStyle(document.documentElement);
  const named = (k) => {
    const map = { prob: '--c-prob', rm: '--c-rm', sem: '--c-sem', spss: '--c-spss', r: '--c-r', mis: '--c-mis', accent: '--accent', marker: '--marker', good: '--good', bad: '--bad', warn: '--warn',
      s1: '--s1', s2: '--s2', s3: '--s3', s4: '--s4', s5: '--s5', s6: '--s6', s7: '--s7', s8: '--s8' };
    if (k === 'ink') return '#2b2925'; if (k === 'paper') return '#fbf8f1'; if (k === 'muted') return '#8a8377';
    if (map[k]) return css.getPropertyValue(map[k]).trim() || '#888';
    return k;
  };
  const color = (k) => new THREE.Color(named(k));
  let flipping = false;

  function hatchMat(c = 'accent', { tint = 0.82, hatch = 1, opacity = 1, side = THREE.DoubleSide } = {}) {
    return new THREE.ShaderMaterial({
      vertexShader: HATCH_VS, fragmentShader: HATCH_FS, side, transparent: opacity < 1, depthWrite: opacity >= 1,
      uniforms: { uColor: { value: color(c) }, uPaper: { value: color('paper') }, uInk: { value: color('ink') }, uL: { value: lightDir },
        uTint: { value: tint }, uHatch: { value: hatch }, uDpr: { value: renderer.getPixelRatio() }, uOpacity: { value: opacity }, uLamp: { value: lamp } },
    });
  }
  function inkMat({ color: c = 'ink', opacity = 0.9 } = {}) { return new THREE.LineBasicMaterial({ color: color(c), transparent: opacity < 1, opacity, toneMapped: false }); }

  function makeApi(rec) {
    const api = {
      T: THREE, root: rec.inner, d: rec.d, ctx: rec.ctx, get p() { return rec.ctx ? rec.ctx.p : {}; }, get state() { return rec.ctx ? rec.ctx.state : {}; },
      color, named, mat: hatchMat, ink: inkMat,
      edges(mesh, { angle = 28, color: c = 'ink', opacity = 0.85 } = {}) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, angle), inkMat({ color: c, opacity })); e.raycast = () => {}; mesh.add(e); return e; },
      line(pts, { color: c = 'ink', opacity = 0.9, dashed = false } = {}) {
        const g = new THREE.BufferGeometry().setFromPoints(pts.map((q) => (q.isVector3 ? q : new THREE.Vector3(q[0], q[1], q[2]))));
        const m = dashed ? new THREE.LineDashedMaterial({ color: color(c), dashSize: 0.02, gapSize: 0.014, transparent: true, opacity, toneMapped: false }) : inkMat({ color: c, opacity });
        const l = new THREE.Line(g, m); if (dashed) l.computeLineDistances(); return l;
      },
      setLine(line, pts) { const g = line.geometry; const n = pts.length; let a = g.getAttribute('position'); if (!a || a.count !== n) { g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); a = g.getAttribute('position'); } pts.forEach((q, i) => a.setXYZ(i, q[0] ?? q.x, q[1] ?? q.y, q[2] ?? q.z)); a.needsUpdate = true; g.computeBoundingSphere(); if (line.material.isLineDashedMaterial) line.computeLineDistances(); },
      label(text, { size = 0.05, color: c = 'ink', weight = 600, mono = false, bg = null } = {}) {
        const cv = document.createElement('canvas'), g = cv.getContext('2d'), fs = 64;
        const font = `${weight} ${fs}px ${mono ? '"IBM Plex Mono", monospace' : '"IBM Plex Sans KR", "Malgun Gothic", sans-serif'}`;
        g.font = font; const w = Math.ceil(g.measureText(text).width) + 24; cv.width = w; cv.height = fs + 26;
        g.font = font; g.textBaseline = 'middle'; if (bg) { g.fillStyle = named(bg); g.globalAlpha = 0.92; g.beginPath(); g.roundRect(0, 0, cv.width, cv.height, 14); g.fill(); g.globalAlpha = 1; }
        g.fillStyle = named(c); g.fillText(text, 12, cv.height / 2 + 2);
        const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(size * cv.width / cv.height, size), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
        m.renderOrder = 5; m.userData.billboard = true; m.raycast = () => {}; return m;
      },
      base({ w = 1, d = rec.d, h = 0.02, color: c = 'paper' } = {}) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hatchMat(c, { tint: 0.08, hatch: 0.15 })); m.position.y = h / 2; api.edges(m, { opacity: 0.6 }); return m;
      },
      invalidate: () => kick(),
      // private RNG so figures never disturb the modules' seeded S.rand() sequence
      rng(seed = 1) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; },
      randn(r) { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); },
    };
    return api;
  }

  function attach(el, ctx) {
    if (recs.has(el)) return recs.get(el);
    const id = el.dataset.fig, def = window.BookFig && window.BookFig.get(id);
    if (!def) return null;
    const outer = new THREE.Group(), tilt = new THREE.Group(), inner = new THREE.Group();
    outer.add(tilt); tilt.add(inner);
    const d = el.clientHeight / Math.max(1, el.clientWidth);
    const rec = { el, id, def, ctx, outer, tilt, inner, d, pop: 0, target: 0, yaw: def.yaw ?? -0.35, pitch: def.pitch ?? 0.42, inst: null, alive: true };
    tilt.position.z = d / 2; inner.position.z = -d / 2;
    outer.visible = false;
    try { rec.inst = def.build(makeApi(rec)) || {}; } catch (e) { console.error('figure', id, e); rec.inst = {}; }
    outer.traverse((o) => { if (o.isMesh && !o.userData.billboard) o.castShadow = true; if (o.isInstancedMesh) o.frustumCulled = false; });
    if (ctx && !ctx._figWrap) {
      const orig = ctx._run; ctx._figWrap = true; ctx._figs = [];
      ctx._run = (k) => { orig(k); ctx._figs.forEach((r) => { try { r.inst.update && r.inst.update(ctx.p, k, ctx); } catch (e) { console.error('figure', r.id, e); } }); kick(); };
    }
    if (ctx) ctx._figs.push(rec);
    try { rec.inst.update && rec.inst.update(ctx ? ctx.p : {}, 'init', ctx); } catch (e) { console.error('figure', id, e); }
    // drag to rotate
    let drag = null;
    el.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; drag = { x: e.clientX, y: e.clientY, yaw: rec.yaw, pitch: rec.pitch }; el.setPointerCapture(e.pointerId); el.classList.add('dragging'); e.preventDefault(); });
    el.addEventListener('pointermove', (e) => { if (!drag) return; rec.yaw = drag.yaw + (e.clientX - drag.x) * 0.012; rec.pitch = THREE.MathUtils.clamp(drag.pitch + (e.clientY - drag.y) * 0.006, -1.0, 1.15); kick(); });
    const end = () => { drag = null; el.classList.remove('dragging'); };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    el.addEventListener('dblclick', () => { rec.yaw = def.yaw ?? -0.35; rec.pitch = def.pitch ?? 0.42; kick(); });
    recs.set(el, rec);
    return rec;
  }
  function detach(rec) {
    rec.alive = false; recs.delete(rec.el);
    try { rec.inst.dispose && rec.inst.dispose(); } catch (e) { /* ignore */ }
    if (rec.ctx && rec.ctx._figs) rec.ctx._figs = rec.ctx._figs.filter((r) => r !== rec);
    rec.outer.parent && rec.outer.parent.remove(rec.outer);
    rec.outer.traverse((o) => { o.geometry && o.geometry.dispose(); const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach((x) => { x.map && x.map.dispose(); x.dispose(); }); });
  }

  const tmpQ = new THREE.Quaternion();
  const ease = (k) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
  function place(rec, scene) {
    const w = where(rec.el);
    if (!w || !rec.el.isConnected) { rec.target = 0; return false; }
    if (!rec.outer.parent) scene.add(rec.outer);
    const pw = rec.el.clientWidth, ph = rec.el.clientHeight;
    const cx = w.x + (pw / 2) * w.k, cz = w.z + (ph / 2) * w.k;
    rec.outer.position.set(cx, w.y + 0.002, cz);
    const s = pw * w.k; rec.outer.scale.set(s, s, s);
    rec.target = flipping || !w.visible ? 0 : 1;
    return true;
  }

  return {
    scan(pageEl, ctx) { pageEl.querySelectorAll('.fig3d[data-fig]').forEach((el) => attach(el, ctx)); },
    dropPage(pageEl) { for (const rec of [...recs.values()]) if (pageEl.contains(rec.el) || !rec.el.isConnected) detach(rec); },
    prune() { for (const rec of [...recs.values()]) if (!rec.el.isConnected) detach(rec); },
    setFlipping(v) { flipping = v; kick(); },
    setNight(on) { lamp.set(on ? 0.86 : 1, on ? 0.76 : 1, on ? 0.6 : 1); },
    tick(dt, scene) {
      let active = false;
      for (const rec of recs.values()) {
        const placed = place(rec, scene);
        const goal = placed ? rec.target : 0;
        if (rec.pop !== goal) { const sp = goal > rec.pop ? 1.9 : 6; rec.pop = goal > rec.pop ? Math.min(goal, rec.pop + dt * sp) : Math.max(goal, rec.pop - dt * sp); active = true; }
        const k = rec.pop;
        rec.outer.visible = k > 0.001;
        if (!rec.outer.visible) continue;
        const e = goal > 0 ? ease(k) : k;
        // pitch > 0: hinge at the front edge, back rises (floor faces the reader)
        // pitch < 0: hinge at the back edge, front rises (local up leans away, so heights read from above)
        const hz = rec.pitch >= 0 ? rec.d / 2 : -rec.d / 2; rec.tilt.position.z = hz; rec.inner.position.z = -hz;
        rec.tilt.rotation.x = rec.pitch * Math.min(1, e);
        rec.inner.rotation.y = rec.yaw;
        rec.inner.scale.set(1, Math.max(0.001, e), 1);
        if (rec.inst.tick) { try { if (rec.inst.tick(dt, k) && k > 0.99) active = true; } catch (err) { console.error('figure', rec.id, err); rec.inst.tick = null; } }
        rec.outer.traverse((o) => { if (o.userData.billboard && o.parent) { o.parent.getWorldQuaternion(tmpQ); o.quaternion.copy(tmpQ.invert().multiply(camera.quaternion)); } });
        active = active || k < 1;
      }
      return active;
    },
    get count() { return recs.size; },
  };
}
