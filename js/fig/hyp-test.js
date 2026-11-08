/* 가설검정 pop-up: two leaning cards — the H0 sampling distribution in front, the H1 distribution (shifted by
   δ = d·√n) behind. Rejection tails α are red on H0; on H1 the part beyond the critical value is the power
   (1 − β, green) and the rest is β. Normal approximation of the test statistic. */
BookFig.add('hyp-test', {
  height: 0.6, caption: '앞: H₀ 분포 · 뒤: H₁ 분포 · 빨강 α, 초록 검정력', yaw: -0.25, pitch: 0.12,
  build(api) {
    const T = api.T, root = api.root, d = api.d;
    const W = 0.86, HS = 0.62, LEAN = 0.62;
    { const pl = api.base({ w: 1, d: api.d, h: 0.01 }); pl.material = api.mat('paper', { tint: 0.08, hatch: 0.15 }); root.add(pl); }
    const zF = d / 2 - 0.12, zB = zF - 0.17;
    const cardF = new T.Group(); cardF.position.z = zF; cardF.rotation.x = -LEAN; root.add(cardF);
    const cardB = new T.Group(); cardB.position.z = zB; cardB.rotation.x = -LEAN; root.add(cardB);
    const mPaper = api.mat('paper', { tint: 0.25, hatch: 0.8 }), mAlpha = api.mat('bad', { tint: 0.85 }), mPow = api.mat('good', { tint: 0.85 }), mBeta = api.mat('muted', { tint: 0.4, hatch: 0.9 });
    const shared = [mPaper, mAlpha, mPow, mBeta];
    const dyn = [];
    function disposeAll() {
      while (dyn.length) { const o = dyn.pop(); o.parent && o.parent.remove(o); o.traverse((c) => { c.geometry && c.geometry.dispose(); const m = c.material; if (m && !shared.includes(m)) { m.map && m.map.dispose(); m.dispose(); } }); }
    }
    function slab(parent, X, f, x0, x1, depth, mat, lift = 0) {
      if (x1 - x0 < 1e-3) return;
      const s = new T.Shape(), n = Math.max(6, Math.round((x1 - x0) * 16));
      s.moveTo(X(x0), 0); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; s.lineTo(X(x), f(x) * HS + lift); } s.lineTo(X(x1), 0); s.closePath();
      const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false }); g.translate(0, 0.01, -depth / 2);
      const m = new T.Mesh(g, mat); m.castShadow = true; api.edges(m, { angle: 40, opacity: 0.5 }); parent.add(m); dyn.push(m);
    }
    function lab(parent, t, x, y, z, o) { const l = api.label(t, Object.assign({ size: 0.04, weight: 700 }, o)); l.position.set(x, y, z); parent.add(l); dyn.push(l); }
    return {
      update(p) {
        disposeAll();
        const dd = p.d ?? 0.4, n = p.n ?? 30, alpha = +(p.alpha ?? 0.05), two = (p.tail || 'two') === 'two';
        const delta = dd * Math.sqrt(n), lo = -4, hi = Math.max(4.5, delta + 3.6);
        const X = (x) => -W / 2 + (x - lo) / (hi - lo) * W;
        const c = S.qnorm(1 - (two ? alpha / 2 : alpha));
        const f0 = (x) => S.dnorm(x), f1 = (x) => S.dnorm(x, delta);
        // H0 (front)
        const h0 = Math.min(hi, 4);
        slab(cardF, X, f0, lo, h0, 0.04, mPaper);
        slab(cardF, X, f0, c, h0, 0.07, mAlpha, 0.002);
        if (two) slab(cardF, X, f0, lo, -c, 0.07, mAlpha, 0.002);
        lab(cardF, 'H₀', X(0), 0.01 + f0(0) * HS + 0.045, 0);
        // H1 (back)
        if (p.h1 !== false) {
          const a1 = Math.max(lo, delta - 4), b1 = Math.min(hi, delta + 4);
          slab(cardB, X, f1, a1, b1, 0.04, mBeta);
          slab(cardB, X, f1, Math.max(c, a1), b1, 0.07, mPow, 0.002);
          if (two && -c > a1) slab(cardB, X, f1, a1, -c, 0.07, mPow, 0.002);
          lab(cardB, `H₁  δ = d√n = ${delta.toFixed(2)}`, X(Math.min(delta, hi - 1.2)), 0.01 + HS * 0.4 + 0.045, 0, { size: 0.036 });
          const pw = 1 - S.pnorm(c - delta) + (two ? S.pnorm(-c - delta) : 0);
          lab(root, `검정력 ≈ ${pw.toFixed(2).replace(/^0/, '')}`, X(hi) - 0.06, 0.03, zF + 0.075, { size: 0.036, color: 'good', bg: 'paper' });
        }
        // critical value(s) on the floor across both cards
        const crit = (x) => { const l = api.line([[X(x), 0.013, zB - 0.02], [X(x), 0.013, zF + 0.04]], { color: 'bad', dashed: true, opacity: 0.9 }); root.add(l); dyn.push(l); };
        crit(c); if (two) crit(-c);
        lab(root, `기각역  α = ${alpha}`, X(c) + 0.02, 0.03, zF + 0.075, { size: 0.034, color: 'bad', bg: 'paper' });
        const ax = api.line([[X(lo), 0.012, zF + 0.035], [X(hi), 0.012, zF + 0.035]], { opacity: 0.6 }); root.add(ax); dyn.push(ax);
      },
    };
  },
});
