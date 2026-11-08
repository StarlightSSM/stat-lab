/* 정규분포 pop-up: the density as a standing paper ribbon; the probability P(a ≤ X ≤ b) is a thicker,
   raised slab in accent colour. Optional ghost N(0,1) and μ ± kσ guides follow the toggles. */
BookFig.add('dist-normal', {
  height: 0.5, caption: '밀도 곡선 조각 · 색칠된 덩어리가 P(a ≤ X ≤ b)', yaw: -0.22, pitch: 0.12,
  build(api) {
    const T = api.T, root = api.root;
    const SX = 0.072, HS = 0.42;                 // x units → figure units, density → height
    const X = (x) => x * SX;
    { const pl = api.base({ w: 1, d: api.d, h: 0.01 }); pl.material = api.mat('paper', { tint: 0.08, hatch: 0.15 }); root.add(pl); }
    const matBody = api.mat('paper', { tint: 0.25, hatch: 0.8 }), matArea = api.mat('accent', { tint: 0.85 }), matRule = api.mat('s3', { tint: 0.7, opacity: 0.55 });
    // a pop-up card leaning back toward the (near-overhead) camera; the ribbons stand on it
    const CZ = api.d / 2 - 0.13, LEAN = 0.72;
    const g = new T.Group(); g.position.z = CZ; g.rotation.x = -LEAN; root.add(g);
    // floor axis + ticks
    root.add(api.line([[X(-6), 0.012, CZ + 0.03], [X(6), 0.012, CZ + 0.03]], { opacity: 0.7 }));
    [-4, -2, 0, 2, 4].forEach((v) => {
      root.add(api.line([[X(v), 0.012, CZ + 0.03], [X(v), 0.012, CZ + 0.055]], { opacity: 0.7 }));
      const l = api.label(String(v), { size: 0.034, mono: true, color: 'muted' }); l.position.set(X(v), 0.03, CZ + 0.085); root.add(l);
    });
    function slab(f, x0, x1, depth, mat, lift = 1) {
      const s = new T.Shape(), n = Math.max(8, Math.round((x1 - x0) * 22));
      s.moveTo(X(x0), 0);
      for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; s.lineTo(X(x), f(x) * HS * lift + (lift > 1 ? 0.002 : 0)); }
      s.lineTo(X(x1), 0); s.closePath();
      const geo = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false, steps: 1 });
      geo.translate(0, 0.01, -depth / 2);
      const m = new T.Mesh(geo, mat); m.castShadow = true; api.edges(m, { angle: 40, opacity: 0.55 }); return m;
    }
    let pLabel = null;
    function clear() { while (g.children.length) { const c = g.children.pop(); c.traverse((o) => { if (o.geometry) o.geometry.dispose(); const m = o.material; if (m && ![matBody, matArea, matRule].includes(m)) { if (m.map) m.map.dispose(); m.dispose(); } }); } }
    return {
      update(p) {
        clear();
        const mu = p.mu ?? 0, sd = p.sd ?? 1, a = Math.max(-6, Math.min(p.a ?? -1, p.b ?? 1)), b = Math.min(6, Math.max(p.a ?? -1, p.b ?? 1));
        const f = (x) => S.dnorm(x, mu, sd);
        g.add(slab(f, -6, 6, 0.05, matBody));
        if (b > a) g.add(slab(f, a, b, 0.085, matArea, 1.006));
        if (p.rule) [3, 2, 1].forEach((k, i) => { const lo = Math.max(-6, mu - k * sd), hi = Math.min(6, mu + k * sd); if (hi > lo) { const m = slab(f, lo, hi, 0.055 + 0.012 * (3 - k) + 0.001, matRule, 1 + 0.002 * (i + 1)); g.add(m); } });
        if (p.std) { const pts = []; for (let i = 0; i <= 120; i++) { const x = -6 + 12 * i / 120; pts.push([X(x), 0.01 + S.dnorm(x) * HS, -0.06]); } g.add(api.line(pts, { dashed: true, opacity: 0.7, color: 'muted' })); }
        g.add(api.line([[X(mu), 0.012, 0.045], [X(mu), 0.01 + f(mu) * HS + 0.02, 0.045]], { opacity: 0.85 }));
        const pr = b > a ? S.pnorm(b, mu, sd) - S.pnorm(a, mu, sd) : 0;
        pLabel = api.label(`P = ${pr.toFixed(3).replace(/^0/, '')}`, { size: 0.048, weight: 700, color: 'accent', bg: 'paper' });
        const xm = Math.max(-5, Math.min(5, (a + b) / 2));
        pLabel.position.set(X(xm), 0.01 + Math.min(0.42, f(Math.max(a, Math.min(b, mu))) * HS + 0.07), 0);
        g.add(pLabel);
        g.traverse((o) => { if (o.isMesh && !o.userData.billboard) o.castShadow = true; });
      },
    };
  },
});
