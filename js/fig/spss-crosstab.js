/* 교차분석 pop-up: 관측빈도를 3D 막대로, 기대빈도를 철사 상자로 겹쳐 세웁니다.
   막대가 철사 상자를 뚫고 올라가거나 못 미치는 만큼이 (O − E). 수정된 잔차가 ±1.96을 넘는 칸은 붉게 칠합니다.
   표본은 그림 전용 난수로 뽑으므로 왼쪽 SPSS 표의 숫자와 칸마다 조금 다를 수 있습니다. */
BookFig.add('spss-crosstab', {
  height: 0.64, caption: '관측빈도(막대) vs 기대빈도(철사 상자)', yaw: -0.35, pitch: 0,
  build(api) {
    const T = api.T, d = api.d;
    // back-hinged stand: the figure leans away from the reader so heights read upward from the near-overhead page camera
    const stand = new T.Group(), root = new T.Group(); stand.position.z = -d / 2; stand.rotation.x = -0.45; root.position.z = d / 2; stand.add(root); api.root.add(stand);
    const hinge = new T.Mesh(new T.BoxGeometry(0.9, 0.006, 0.012), api.mat('paper', { tint: 0.2, hatch: 0.5 })); hinge.position.set(0, 0.003, -d / 2); api.root.add(hinge);
    root.add(api.base({ w: 1, d, h: 0.01 }));
    const group = new T.Group(); root.add(group);
    const barGeo = new T.BoxGeometry(1, 1, 1); barGeo.translate(0, 0.5, 0);
    const cols = ['spss', 's1', 's3'];
    let seed = 10;
    function clear() { while (group.children.length) { const o = group.children.pop(); if (o.geometry && o.geometry !== barGeo) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } } }
    return {
      update(v, changed) {
        if (changed === 'resample') seed++;
        const two = (v.shape || '2x2') === '2x2', e = v.eff ?? 0.16, n = Math.round(v.n ?? 120);
        const cats = two ? ['구매', '비구매'] : ['모바일', '웹', '매장'], rows = ['남자', '여자'];
        const probs = two ? [[0.4 + e / 2, 0.6 - e / 2], [0.4 - e / 2, 0.6 + e / 2]] : [[0.4 + e / 2, 0.35 - e / 4, 0.25 - e / 4], [0.4 - e / 2, 0.35 + e / 4, 0.25 + e / 4]];
        const r = api.rng(seed * 104729 + n), O = rows.map(() => cats.map(() => 0));
        for (let i = 0; i < n; i++) { const ri = r() < 0.5 ? 0 : 1; let u = r(), c = 0; while (c < cats.length - 1 && u > probs[ri][c]) { u -= probs[ri][c]; c++; } O[ri][c]++; }
        const rs = O.map((row) => row.reduce((a, b) => a + b, 0)), cs = cats.map((_, j) => O[0][j] + O[1][j]);
        const E = O.map((row, i) => row.map((_, j) => (rs[i] * cs[j]) / n));
        const maxV = Math.max(1, ...O.flat(), ...E.flat()), H = 0.32;
        clear();
        const W = 0.78, dx = W / cats.length, D = Math.min(d - 0.22, 0.42), dz = D / 2, bw = dx * 0.38, bd = dz * 0.42;
        O.forEach((row, i) => row.forEach((o, j) => {
          const x = -W / 2 + dx / 2 + j * dx, z = D / 2 - dz / 2 - i * dz, h = Math.max(0.003, (o / maxV) * H), he = (E[i][j] / maxV) * H;
          const adj = E[i][j] > 0 ? (o - E[i][j]) / Math.sqrt(E[i][j] * (1 - rs[i] / n) * (1 - cs[j] / n) || 1) : 0;
          const bar = new T.Mesh(barGeo, api.mat(cols[j], { tint: i ? 0.6 : 0.9 }));
          bar.scale.set(bw, h, bd); bar.position.set(x, 0.01, z); bar.castShadow = true; group.add(bar);
          if (Math.abs(adj) > 1.96 && v.res !== false) { const cap = new T.Mesh(barGeo, api.mat('marker', { tint: 1, hatch: 0 })); cap.scale.set(bw * 1.06, 0.014, bd * 1.06); cap.position.set(x, 0.01 + h - 0.007, z); group.add(cap); }
          const lab = api.label(String(o) + (Math.abs(adj) > 1.96 && v.res !== false ? (adj > 0 ? ' ▲' : ' ▼') : ''), { size: 0.036, mono: true, weight: 600 }); lab.position.set(x, 0.01 + Math.max(h, v.exp !== false ? he : 0) + 0.035, z); group.add(lab);
          if (v.exp !== false) {
            const g = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(bw * 1.25, he, bd * 1.25)), api.ink({ opacity: 0.85 }));
            g.position.set(x, 0.01 + he / 2, z); group.add(g);
          }
        }));
        cats.forEach((c, j) => { const l = api.label(c, { size: 0.036, weight: 600 }); l.position.set(-W / 2 + dx / 2 + j * dx, 0.03, D / 2 + 0.11); group.add(l); });
        rows.forEach((rn, i) => { const l = api.label(rn, { size: 0.04, weight: 700, color: 'muted' }); l.position.set(-W / 2 - 0.05, 0.03, D / 2 - dz / 2 - i * dz); group.add(l); });
        api.invalidate();
      },
    };
  },
});
