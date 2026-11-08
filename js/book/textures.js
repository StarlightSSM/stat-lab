// textures.js — procedural canvas textures for the desk, cover cloth, page edges and generic flying pages.
import * as THREE from 'three';

const rnd = (() => { let s = 1234567; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, { repeat = 1, srgb = true, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  if (repeat !== 1) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); }
  return t;
}
function speckle(g, w, h, n, colors, rmin = 0.4, rmax = 1.2, alpha = 0.08) {
  for (let i = 0; i < n; i++) { g.globalAlpha = alpha * (0.4 + rnd()); g.fillStyle = colors[(rnd() * colors.length) | 0]; const r = rmin + rnd() * (rmax - rmin); g.fillRect(rnd() * w, rnd() * h, r, r); }
  g.globalAlpha = 1;
}

export function woodTexture() {
  const [c, g] = canvas(1024, 1024);
  g.fillStyle = '#b48a5e'; g.fillRect(0, 0, 1024, 1024);
  // planks running along x
  const plank = 256;
  for (let p = 0; p < 4; p++) {
    const y0 = p * plank, tone = ['#b88f62', '#ad8457', '#b98e5f', '#a87f53'][p];
    g.fillStyle = tone; g.fillRect(0, y0, 1024, plank);
    for (let i = 0; i < 70; i++) {
      const y = y0 + rnd() * plank, amp = 2 + rnd() * 6, f = 0.004 + rnd() * 0.01, ph = rnd() * 6;
      g.strokeStyle = rnd() < 0.5 ? 'rgba(90,58,30,.16)' : 'rgba(255,230,190,.10)'; g.lineWidth = 0.6 + rnd() * 1.6;
      g.beginPath(); for (let x = 0; x <= 1024; x += 8) { const yy = y + Math.sin(x * f + ph) * amp + Math.sin(x * f * 3.1 + ph) * amp * 0.3; x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke();
    }
    g.fillStyle = 'rgba(50,30,15,.35)'; g.fillRect(0, y0, 1024, 2);
  }
  speckle(g, 1024, 1024, 9000, ['#5a3a1e', '#e9c99b'], 0.5, 1.5, 0.06);
  return tex(c, { repeat: 3 });
}

export function feltTexture(base = '#8c9f95') {
  const [c, g] = canvas(512, 512);
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  speckle(g, 512, 512, 26000, ['#6f8379', '#a9b9b0', '#7d9086', '#c2cfc7'], 0.5, 1.4, 0.18);
  return tex(c, { repeat: 4 });
}

export function clothTexture(base = '#c9952f', { title = false } = {}) {
  const W = 1024, H = 1412; const [c, g] = canvas(W, H);
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  // weave
  for (let y = 0; y < H; y += 3) { g.fillStyle = `rgba(0,0,0,${0.025 + rnd() * 0.03})`; g.fillRect(0, y, W, 1); }
  for (let x = 0; x < W; x += 3) { g.fillStyle = `rgba(255,255,255,${0.02 + rnd() * 0.025})`; g.fillRect(x, 0, 1, H); }
  speckle(g, W, H, 14000, ['#5b3f10', '#f3d58d'], 0.6, 1.6, 0.08);
  // worn edges
  const grd = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.78); grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(60,35,0,.22)');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  if (title) {
    const ink = '#1f1b14';
    const deb = (fn) => { g.save(); g.translate(0, 2); g.globalAlpha = 0.35; g.fillStyle = g.strokeStyle = '#f6dc98'; fn(); g.restore(); g.save(); g.fillStyle = g.strokeStyle = ink; fn(); g.restore(); };
    g.textAlign = 'center';
    deb(() => { g.font = '600 30px "IBM Plex Sans KR", "Malgun Gothic", sans-serif'; g.fillText('APPLIED STATISTICS · METHODS · SEM · SPSS · R · MIS', W / 2, 190); });
    deb(() => { g.font = '700 118px "Noto Serif KR", "Batang", serif'; g.fillText('연구통계', W / 2, 400); g.fillText('실험실', W / 2, 540); });
    deb(() => { g.font = 'italic 500 40px "Noto Serif KR", "Batang", serif'; g.fillText('숫자를 움직이면 개념이 보이는 책', W / 2, 630); });
    // emblem: bell curve + histogram line art
    deb(() => {
      g.lineWidth = 5; const cx = W / 2, by = 1010, sw = 420;
      g.beginPath(); for (let i = 0; i <= 200; i++) { const x = -3 + 6 * i / 200, y = Math.exp(-x * x / 2); const px = cx + x / 3 * sw / 1, py = by - y * 230; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke();
      g.lineWidth = 3; for (let k = -6; k <= 6; k++) { const x = k / 2, y = Math.exp(-x * x / 2) * 230; g.strokeRect(cx + (x / 3) * sw - 15, by - y * 0.92, 30, y * 0.92); }
      g.lineWidth = 4; g.beginPath(); g.moveTo(cx - sw - 40, by); g.lineTo(cx + sw + 40, by); g.stroke();
    });
    deb(() => { g.font = '600 30px "IBM Plex Sans KR", "Malgun Gothic", sans-serif'; g.fillText('6개 과목 · 48개 실험 · 공개 강의자료 73건', W / 2, 1180); });
    g.strokeStyle = 'rgba(31,27,20,.55)'; g.lineWidth = 3; g.strokeRect(60, 60, W - 120, H - 120); g.strokeRect(74, 74, W - 148, H - 148);
  }
  return tex(c);
}

export function endpaperTexture() {
  const W = 1024, H = 1412; const [c, g] = canvas(W, H);
  g.fillStyle = '#e9dfc8'; g.fillRect(0, 0, W, H);
  speckle(g, W, H, 9000, ['#b7a888', '#fff8e8'], 0.5, 1.3, 0.12);
  g.strokeStyle = 'rgba(40,60,110,.42)'; g.lineWidth = 2.2;
  const glyph = [
    (x, y) => { g.beginPath(); for (let i = 0; i <= 30; i++) { const t = -2.5 + 5 * i / 30; const px = x + t * 9, py = y + 14 - Math.exp(-t * t / 2) * 28; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); },
    (x, y) => { g.strokeRect(x - 16, y - 10, 14, 14); g.beginPath(); g.arc(x + 12, y + 2, 9, 0, 7); g.stroke(); g.beginPath(); g.moveTo(x - 2, y - 3); g.lineTo(x + 3, y + 1); g.stroke(); },
    (x, y) => { for (let i = 0; i < 5; i++) g.strokeRect(x - 20 + i * 8, y + 14 - (6 + ((i * 7) % 5) * 6), 6, 6 + ((i * 7) % 5) * 6); },
    (x, y) => { g.beginPath(); g.moveTo(x - 20, y + 12); g.lineTo(x + 20, y - 12); g.stroke(); for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(x - 18 + i * 6, y + 10 - i * 4 + ((i * 13) % 7) - 3, 2, 0, 7); g.stroke(); } },
  ];
  let k = 0; for (let y = 60; y < H; y += 90) for (let x = 60 + ((y / 90) % 2) * 60; x < W; x += 120) glyph[(k++) % glyph.length](x, y);
  return tex(c);
}

export function edgeTexture() {
  const [c, g] = canvas(64, 512);
  g.fillStyle = '#efe7d6'; g.fillRect(0, 0, 64, 512);
  for (let y = 0; y < 512; y += 2) { g.fillStyle = `rgba(120,100,70,${0.08 + rnd() * 0.14})`; g.fillRect(0, y, 64, 1); }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

/* generic page for sheets that fly past during a multi-page riffle */
export function genericPage(no, side, label = '') {
  const W = 512, H = 707; const [c, g] = canvas(W, H);
  g.fillStyle = '#faf6ee'; g.fillRect(0, 0, W, H);
  speckle(g, W, H, 2500, ['#cbbf9f'], 0.5, 1.2, 0.08);
  const mL = side === 'L' ? 34 : 44, mR = side === 'L' ? 44 : 34;
  g.fillStyle = '#3b382f'; g.globalAlpha = 0.75; g.font = '700 22px "Noto Serif KR", serif'; g.fillText(label.slice(0, 18), mL, 76); g.globalAlpha = 1;
  let y = 108;
  const block = (lines, w = 1) => { for (let i = 0; i < lines; i++) { const ww = (W - mL - mR) * (i === lines - 1 ? 0.55 : 0.9 + rnd() * 0.1) * w; g.fillStyle = 'rgba(60,56,47,.22)'; g.fillRect(mL, y, ww, 5); y += 13; } y += 12; };
  block(3); g.strokeStyle = 'rgba(60,56,47,.25)'; g.strokeRect(mL, y, W - mL - mR, 170); y += 190; block(5); block(4); g.strokeRect(mL, y, (W - mL - mR) * 0.48, 110); g.strokeRect(mL + (W - mL - mR) * 0.52, y, (W - mL - mR) * 0.48, 110); y += 128; block(3);
  g.fillStyle = 'rgba(60,56,47,.5)'; g.font = '500 14px "IBM Plex Mono", monospace'; g.textAlign = side === 'L' ? 'left' : 'right'; g.fillText(String(no), side === 'L' ? mL : W - mR, H - 26);
  return tex(c);
}

/* window light gobo is geometry (see main.js); this is the paper grain the DOM pages also use */
export function paperGrainDataURL() {
  const [c, g] = canvas(160, 160);
  g.clearRect(0, 0, 160, 160);
  speckle(g, 160, 160, 1100, ['#8a7a58', '#ffffff'], 0.5, 1.2, 0.09);
  return c.toDataURL('image/png');
}
