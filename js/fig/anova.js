/* 일원분산분석 pop-up: one leaning card per group, lined up like a ridge plot. Each card is the group's
   N(μ, σ) shape with its mean marked; the module's own observations sit as dots on the floor in front of it,
   and a red plane marks the grand mean. Large σ → shapes overlap → small F. */
BookFig.add('anova', {
  height: 0.7, caption: '집단별 분포 카드 · 빨간 면은 전체 평균', yaw: -0.28, pitch: 0.12,
  build(api) {
    const T = api.T, root = api.root, d = api.d;
    const W = 0.86, LO = 20, HI = 90, X = (v) => -W / 2 + (Math.max(LO, Math.min(HI, v)) - LO) / (HI - LO) * W;
    const HS = 0.2, LEAN = 0.6, GAP = 0.13;
    { const pl = api.base({ w: 1, d: api.d, h: 0.01 }); pl.material = api.mat('paper', { tint: 0.08, hatch: 0.15 }); root.add(pl); }
    const cols = ['s1', 's2', 's3', 's4'], L = ['A', 'B', 'C', 'D'];
    const mats = cols.map((c) => api.mat(c, { tint: 0.7 }));
    const dots = new T.InstancedMesh(new T.SphereGeometry(0.0065, 6, 4), api.mat('#ffffff', { tint: 0.95 }), 400); root.add(dots);
    const dcol = cols.map((c) => api.color(c));
    const m4 = new T.Matrix4(), dyn = [];
    function disposeAll() { while (dyn.length) { const o = dyn.pop(); o.parent && o.parent.remove(o); o.traverse((c) => { c.geometry && c.geometry.dispose(); const m = c.material; if (m && !mats.includes(m)) { m.map && m.map.dispose(); m.dispose(); } }); } }
    const add = (parent, o) => { parent.add(o); dyn.push(o); return o; };
    return {
      update(p, changed, ctx) {
        disposeAll();
        const k = +(p.k ?? 3), sd = p.sd ?? 8, n = Math.min(100, Math.round(p.n ?? 20));
        const mus = [p.m1 ?? 50, p.m2 ?? 54, p.m3 ?? 58, p.m4 ?? 52].slice(0, k);
        const st = ctx && ctx.state;
        const zFront = d / 2 - 0.1, z = (g) => zFront - (k - 1 - g) * GAP;   // A at the back … last group in front
        let c = 0, all = [];
        mus.forEach((mu, g) => {
          const card = new T.Group(); card.position.z = z(g); card.rotation.x = -LEAN; add(root, card);
          const s = new T.Shape(); s.moveTo(X(LO), 0);
          for (let i = 0; i <= 90; i++) { const v = LO + (HI - LO) * i / 90; s.lineTo(X(v), Math.exp(-((v - mu) ** 2) / (2 * sd * sd)) * HS); }
          s.lineTo(X(HI), 0); s.closePath();
          const geo = new T.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false }); geo.translate(0, 0.01, -0.015);
          const mesh = new T.Mesh(geo, mats[g]); mesh.castShadow = true; api.edges(mesh, { angle: 40, opacity: 0.55 }); card.add(mesh);
          card.add(api.line([[X(mu), 0.01, 0.017], [X(mu), 0.01 + HS + 0.012, 0.017]], { opacity: 0.9 }));
          const l = api.label(L[g], { size: 0.04, weight: 700 }); l.position.set(X(mu), 0.01 + HS + 0.04, 0); card.add(l);
          // observations (module data if available)
          const zs = st && st.z && st.z[g], js = st && st.j && st.j[g], r = api.rng(21 + g);
          for (let i = 0; i < n && c < 400; i++) {
            const v = mu + sd * (zs ? zs[i] : api.randn(r)), jt = js ? js[i] : r() * 2 - 1; all.push(v);
            m4.makeTranslation(X(v), 0.016, z(g) + 0.035 + jt * 0.014); dots.setMatrixAt(c, m4); dots.setColorAt(c, dcol[g]); c++;
          }
        });
        dots.count = c; dots.instanceMatrix.needsUpdate = true; if (dots.instanceColor) dots.instanceColor.needsUpdate = true;
        const gm = all.length ? all.reduce((a, b) => a + b, 0) / all.length : mus.reduce((a, b) => a + b, 0) / k;
        const span = (k - 1) * GAP + 0.1;
        const plane = new T.Mesh(new T.BoxGeometry(0.003, HS * 0.9, span), api.mat('marker', { tint: 0.8, opacity: 0.45 }));
        plane.position.set(X(gm), 0.01 + HS * 0.45, zFront - (k - 1) * GAP / 2 + 0.02); add(root, plane);
        const gl = api.label(`전체 평균 ${gm.toFixed(1)}`, { size: 0.034, color: 'marker', bg: 'paper' }); gl.position.set(X(gm), 0.03, zFront + 0.09); add(root, gl);
        const ax = api.line([[X(LO), 0.012, zFront + 0.06], [X(HI), 0.012, zFront + 0.06]], { opacity: 0.55 }); add(root, ax);
        [30, 50, 70].forEach((v) => { const t = api.label(String(v), { size: 0.03, mono: true, color: 'muted' }); t.position.set(X(v), 0.025, zFront + 0.13); add(root, t); });
      },
    };
  },
});
