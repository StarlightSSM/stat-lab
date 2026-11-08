/* Bass 확산 pop-up: 앞줄 = 연도별 신규 도입 기둥(아래 혁신자 p·(m−N), 위 모방자 q·N/m·(m−N)),
   뒷벽 = 누적 도입 S자 리본. 바닥 띠는 Rogers 수용자 범주(혁신자 2.5% · 조기수용자 13.5% · 조기다수 34% · 후기다수 34% · 지각수용자 16%). */
BookFig.add('mis-bass', {
  height: 0.62, caption: '신규 도입 기둥과 누적 S자 벽 · 혁신자(아래)와 모방자(위)', yaw: -0.3, pitch: 0,
  build(api) {
    const T = api.T, d = api.d;
    // back-hinged stand: the figure leans away from the reader so heights read upward from the near-overhead page camera
    const stand = new T.Group(), root = new T.Group(); stand.position.z = -d / 2; stand.rotation.x = -0.5; root.position.z = d / 2; stand.add(root); api.root.add(stand);
    const hinge = new T.Mesh(new T.BoxGeometry(0.9, 0.006, 0.012), api.mat('paper', { tint: 0.2, hatch: 0.5 })); hinge.position.set(0, 0.003, -d / 2); api.root.add(hinge);
    root.add(api.base({ w: 1, d, h: 0.01 }));
    const MAXY = 40, W = 0.84, H = 0.22, HC = 0.28;
    const colGeo = new T.BoxGeometry(1, 1, 1); colGeo.translate(0, 0.5, 0);
    const inn = new T.InstancedMesh(colGeo, api.mat('mis', { tint: 0.9 }), MAXY), imi = new T.InstancedMesh(colGeo, api.mat('s1', { tint: 0.75 }), MAXY);
    inn.castShadow = imi.castShadow = true; inn.frustumCulled = imi.frustumCulled = false; root.add(inn, imi);
    const wallGeo = new T.BufferGeometry(), wall = new T.Mesh(wallGeo, api.mat('accent', { tint: 0.35, hatch: 0.7, opacity: 0.6 })); root.add(wall);
    const rim = api.line([[0, 0, 0], [0, 0, 0]], { color: 'accent', opacity: 0.95 }); root.add(rim);
    const bands = new T.Group(); root.add(bands);
    const zFront = 0.06, zWall = -Math.min(0.2, d / 2 - 0.06);
    const labs = new T.Group(); root.add(labs);
    const m4 = new T.Matrix4(), q = new T.Quaternion(), s = new T.Vector3(), pv = new T.Vector3();
    let data = null, reveal = 1;
    function clearGroup(g) { while (g.children.length) { const o = g.children.pop(); o.geometry && o.geometry.dispose(); if (o.material) { o.material.map && o.material.map.dispose(); o.material.dispose(); } } }
    function compute(v) {
      const p = v.p ?? 0.03, qq = v.q ?? 0.38, m = v.m ?? 500, TT = Math.max(2, Math.min(MAXY, Math.round(v.T ?? 25)));
      let N = 0; const rows = [];
      for (let t = 1; t <= TT; t++) { const a = p * (m - N), b = (qq * N / m) * (m - N); N += a + b; rows.push({ a, b, N }); }
      const peak = Math.max(...rows.map((r) => r.a + r.b), 1e-6);
      data = { rows, peak, m, TT, rogers: v.rogers !== false };
      // floor bands for Rogers categories by cumulative share
      clearGroup(bands); clearGroup(labs);
      const dx = W / TT;
      if (data.rogers) {
        const cuts = [0.025, 0.16, 0.5, 0.84, 1.0001], names = ['혁신', '조기수용', '조기다수', '후기다수', '지각'], cols = ['s7', 's1', 's3', 's4', 's2'];
        let start = 0;
        cuts.forEach((c, k) => {
          let end = rows.findIndex((r) => r.N / m >= c); if (end < 0) end = TT; else end += 1;
          if (end > start) {
            const b = new T.Mesh(new T.BoxGeometry(dx * (end - start), 0.004, 0.05), api.mat(cols[k], { tint: 0.55, hatch: 0.3 }));
            b.position.set(-W / 2 + dx * (start + end) / 2, 0.012, zFront + 0.07); bands.add(b);
            if (end - start >= 2) { const l = api.label(names[k], { size: 0.026 }); l.position.set(b.position.x, 0.035, zFront + 0.07); labs.add(l); }
          }
          start = Math.max(start, end);
        });
      }
      const y0 = api.label('1년', { size: 0.028, mono: true, color: 'muted' }); y0.position.set(-W / 2 + dx / 2, 0.03, zFront + 0.12); labs.add(y0);
      const y1 = api.label(TT + '년', { size: 0.028, mono: true, color: 'muted' }); y1.position.set(W / 2 - dx / 2, 0.03, zFront + 0.12); labs.add(y1);
      const ml = api.label('잠재시장 m', { size: 0.03, color: 'accent' }); ml.position.set(-W / 2 - 0.02, 0.01 + HC + 0.03, zWall); labs.add(ml);
      root.add(labs);
    }
    function draw() {
      const { rows, peak, m, TT } = data, dx = W / TT, bw = dx * 0.7, shown = Math.max(1, Math.round(TT * reveal));
      const pos = [], idx = [], rimPts = [];
      rows.forEach((r, i) => {
        const x = -W / 2 + dx / 2 + i * dx, vis = i < shown, ha = vis ? Math.max(0.001, r.a / peak * H) : 0.0001, hb = vis ? Math.max(0.0001, r.b / peak * H) : 0.0001;
        s.set(bw, ha, bw); pv.set(x, 0.01, zFront); m4.compose(pv, q, s); inn.setMatrixAt(i, m4);
        s.set(bw, hb, bw); pv.set(x, 0.01 + ha, zFront); m4.compose(pv, q, s); imi.setMatrixAt(i, m4);
        if (vis) { const yc = 0.01 + (r.N / m) * HC; pos.push(x, 0.01, zWall, x, yc, zWall); rimPts.push([x, yc, zWall]); }
      });
      inn.count = imi.count = TT; inn.instanceMatrix.needsUpdate = imi.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < pos.length / 6 - 1; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      wallGeo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); wallGeo.setIndex(idx); wallGeo.computeVertexNormals(); wallGeo.computeBoundingSphere();
      if (rimPts.length > 1) api.setLine(rim, rimPts);
    }
    return {
      update(v) { compute(v); reveal = 0; draw(); },
      tick(dt) { if (reveal >= 1) return false; reveal = Math.min(1, reveal + dt / 2.2); draw(); return true; },
    };
  },
});
