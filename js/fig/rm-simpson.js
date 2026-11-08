/* 심슨의 역설 pop-up: each class is a translucent glass layer stacked above the page (1반 lowest).
   On every layer: that class's points and its within-group slope. On the paper underneath: all points' shadow
   and the dashed pooled regression. Seen from above the layers merge into the misleading pooled trend; drag to
   turn the stack and the layers separate. Data follow the module's generating model (private RNG). */
BookFig.add('rm-simpson', {
  height: 0.7, caption: '반마다 유리판 한 장 · 색 선 = 집단 내 기울기, 바닥 점선 = 합동 기울기', yaw: -0.3, pitch: 0.15,
  build(api) {
    const T = api.T, root = api.root, d = api.d;
    root.add(api.base({ w: 1, d, h: 0.01 }));
    const dyn = new T.Group(); root.add(dyn);
    const cols = ['s1', 's2', 's3', 's7', 's5'];
    const dot = new T.SphereGeometry(0.0085, 8, 6), shadowDot = new T.CircleGeometry(0.006, 8); shadowDot.rotateX(-Math.PI / 2);
    let seed = 1;
    const clear = () => { dyn.traverse((o) => { if (o !== dyn) { if (o.geometry && o.geometry !== dot && o.geometry !== shadowDot) o.geometry.dispose(); if (o.material) { o.material.map && o.material.map.dispose(); o.material.dispose(); } } }); while (dyn.children.length) dyn.remove(dyn.children[0]); };
    function render(p) {
      clear();
      const r = api.rng(seed * 131 + 5), G = Math.round(p.g || 4), n = Math.min(40, Math.round(p.n || 40)), w = p.w ?? -0.6, gap = p.gap ?? 2.2, color = p.color !== false, lines = p.lines !== false;
      const data = [];
      for (let j = 0; j < G; j++) { const cx = 2 + j * gap * 0.9, cyy = 2 + j * gap * 1.1; for (let i = 0; i < n; i++) { const x = cx + api.randn(r) * 0.9; data.push({ x, y: cyy + w * (x - cx) + api.randn(r) * 0.55, g: j }); } }
      const xs = data.map((q) => q.x), ys = data.map((q) => q.y);
      const xlo = Math.min(...xs), xhi = Math.max(...xs), ylo = Math.min(...ys), yhi = Math.max(...ys);
      const H = d / 2 - 0.06;
      const X = (x) => -0.42 + ((x - xlo) / (xhi - xlo || 1)) * 0.84, Z = (y) => H - ((y - ylo) / (yhi - ylo || 1)) * 2 * H;   // score runs up the page
      const L = (j) => 0.035 + j * (0.3 / Math.max(1, G - 1));                                                               // layer height
      const fit = (pts) => { const n0 = pts.length, mx = pts.reduce((s, q) => s + q.x, 0) / n0, my = pts.reduce((s, q) => s + q.y, 0) / n0; let sxy = 0, sxx = 0; pts.forEach((q) => { sxy += (q.x - mx) * (q.y - my); sxx += (q.x - mx) ** 2; }); const b = sxy / (sxx || 1); return { b, a: my - b * mx }; };
      // axes on the paper
      dyn.add(api.line([[-0.45, 0.012, H + 0.02], [0.45, 0.012, H + 0.02]], { opacity: 0.7 }));
      dyn.add(api.line([[-0.45, 0.012, H + 0.02], [-0.45, 0.012, -H - 0.02]], { opacity: 0.7 }));
      const ax1 = api.label('공부시간 →', { size: 0.032, weight: 600, color: 'muted' }); ax1.position.set(0.36, 0.02, H + 0.05); dyn.add(ax1);
      const ax2 = api.label('점수 ↑', { size: 0.032, weight: 600, color: 'muted' }); ax2.position.set(-0.45, 0.02, -H - 0.04); dyn.add(ax2);
      const sh = new T.InstancedMesh(shadowDot, new T.MeshBasicMaterial({ color: api.color('ink'), transparent: true, opacity: 0.18, depthWrite: false, toneMapped: false }), data.length); const m4 = new T.Matrix4();
      data.forEach((q, i) => { m4.makeTranslation(X(q.x), 0.0125, Z(q.y)); sh.setMatrixAt(i, m4); }); dyn.add(sh);
      for (let j = 0; j < G; j++) {
        const pts = data.filter((q) => q.g === j), y = L(j), col = color ? cols[j] : 'muted';
        const px = pts.map((q) => X(q.x)), pz = pts.map((q) => Z(q.y));
        const x0 = Math.min(...px) - 0.03, x1 = Math.max(...px) + 0.03, z0 = Math.min(...pz) - 0.03, z1 = Math.max(...pz) + 0.03;
        const glass = new T.Mesh(new T.BoxGeometry(x1 - x0, 0.004, z1 - z0), api.mat(col, { tint: 0.35, hatch: 0, opacity: 0.32 }));
        glass.position.set((x0 + x1) / 2, y - 0.008, (z0 + z1) / 2); api.edges(glass, { color: col, opacity: 0.8 }); dyn.add(glass);
        const inst = new T.InstancedMesh(dot, api.mat(col, { tint: 0.95 }), pts.length);
        pts.forEach((q, i) => { m4.makeTranslation(px[i], y, pz[i]); inst.setMatrixAt(i, m4); }); dyn.add(inst);
        if (lines) { const f = fit(pts), a = Math.min(...pts.map((q) => q.x)), b = Math.max(...pts.map((q) => q.x)); dyn.add(api.line([[X(a), y + 0.004, Z(f.a + f.b * a)], [X(b), y + 0.004, Z(f.a + f.b * b)]], { color: color ? cols[j] : 'ink', opacity: 1 })); }
        const l = api.label(`${j + 1}반`, { size: 0.03, weight: 700, color: color ? cols[j] : 'ink' }); l.position.set(x1 + 0.03, y, z0); dyn.add(l);
      }
      const f = fit(data);
      dyn.add(api.line([[X(xlo), 0.014, Z(f.a + f.b * xlo)], [X(xhi), 0.014, Z(f.a + f.b * xhi)]], { color: 'ink', dashed: true, opacity: 1 }));
      const lab = api.label(`합동 기울기 ${f.b.toFixed(2)}`, { size: 0.032, weight: 700, bg: 'paper' }); lab.position.set(X(xhi) - 0.08, 0.03, Z(f.a + f.b * xhi) + 0.05); dyn.add(lab);
      api.invalidate();
    }
    return { update(p, changed) { if (changed === 'resample') seed++; render(p); } };
  },
});
