/* 탐색적 요인분석 pop-up: 회전된 성분행렬을 3D 막대 밭으로. 가로 = 문항, 깊이 = 추출된 성분, 높이 = |적재량|.
   반투명 판은 |λ| = .40 기준선. 교차적재를 올리면 한 문항의 막대가 두 성분 줄에서 동시에 판 위로 솟습니다.
   그림은 표본오차 없는 모집단 상관행렬(ΛΦΛ′)로 계산한 기대 구조입니다 — 왼쪽 표는 실제 표본의 결과. */
BookFig.add('spss-efa', {
  height: 0.68, caption: '회전된 성분행렬 · 판(|λ| = .40) 위로 솟은 막대가 그 성분의 문항', yaw: -0.22, pitch: 0,
  build(api) {
    const T = api.T, d = api.d;
    // back-hinged stand: the figure leans away from the reader so heights read upward from the near-overhead page camera
    const stand = new T.Group(), root = new T.Group(); stand.position.z = -d / 2; stand.rotation.x = -0.45; root.position.z = d / 2; stand.add(root); api.root.add(stand);
    const hinge = new T.Mesh(new T.BoxGeometry(0.9, 0.006, 0.012), api.mat('paper', { tint: 0.2, hatch: 0.5 })); hinge.position.set(0, 0.003, -d / 2); api.root.add(hinge);
    root.add(api.base({ w: 1, d, h: 0.01 }));
    const NAMES = ['PU1', 'PU2', 'PU3', 'EOU1', 'EOU2', 'EOU3', 'BI1', 'BI2', 'BI3'];
    const H = 0.34;                                     // height of |λ| = 1
    const group = new T.Group(); root.add(group);
    const barGeo = new T.BoxGeometry(1, 1, 1); barGeo.translate(0, 0.5, 0);
    const matStrongs = ['spss', 's1', 's3'].map((c) => api.mat(c, { tint: 0.88 })), matWeak = api.mat('spss', { tint: 0.3, hatch: 0.6 }), matNeg = api.mat('bad', { tint: 0.75 });
    const thr = new T.Mesh(new T.PlaneGeometry(1, 1), api.mat('accent', { tint: 0.4, hatch: 0, opacity: 0.22 })); thr.rotation.x = -Math.PI / 2; root.add(thr);
    const thrLab = api.label('|λ| = .40', { size: 0.036, color: 'accent' }); root.add(thrLab);
    function varimax(L) {
      const p = L.length, m = L[0].length; if (m < 2) return L.map((r) => r.slice());
      const h = L.map((r) => Math.sqrt(r.reduce((s, v) => s + v * v, 0)) || 1), A = L.map((r, i) => r.map((v) => v / h[i]));
      for (let it = 0; it < 200; it++) {
        let moved = 0;
        for (let j = 0; j < m - 1; j++) for (let k = j + 1; k < m; k++) {
          let a = 0, b = 0, c = 0, dd = 0;
          for (let i = 0; i < p; i++) { const u = A[i][j] ** 2 - A[i][k] ** 2, v = 2 * A[i][j] * A[i][k]; a += u; b += v; c += u * u - v * v; dd += 2 * u * v; }
          const phi = Math.atan2(dd - 2 * a * b / p, c - (a * a - b * b) / p) / 4; if (Math.abs(phi) < 1e-7) continue; moved = Math.max(moved, Math.abs(phi));
          const cs = Math.cos(phi), sn = Math.sin(phi);
          for (let i = 0; i < p; i++) { const x = A[i][j], y = A[i][k]; A[i][j] = x * cs + y * sn; A[i][k] = -x * sn + y * cs; }
        }
        if (moved < 1e-7) break;
      }
      return A.map((r, i) => r.map((v) => v * h[i]));
    }
    function clear() { while (group.children.length) { const o = group.children.pop(); o.traverse((x) => { if (x.geometry && x.geometry !== barGeo) x.geometry.dispose(); if (x.material && x.material.map) { x.material.map.dispose(); x.material.dispose(); } }); } }
    return {
      update(v) {
        const k = +(v.nf ?? 3), p = k * 3, load = v.load ?? 0.75, cross = v.cross ?? 0, phi = v.phi ?? 0.2;
        const Lam = Array.from({ length: p }, (_, i) => { const r = Array(k).fill(0), f = Math.floor(i / 3); r[f] = load; if (i % 3 === 2) r[(f + 1) % k] = cross; return r; });
        const R = Array.from({ length: p }, (_, i) => Array.from({ length: p }, (_, j) => {
          if (i === j) return 1; let s = 0; for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) s += Lam[i][a] * Lam[j][b] * (a === b ? 1 : phi); return s;
        }));
        const eg = S.eigen(R), ev = eg.values;
        const m = v.ext === 'kaiser' || v.ext == null ? Math.max(1, ev.filter((e) => e > 1).length) : Math.min(+v.ext, p);
        let L = Array.from({ length: p }, (_, i) => Array.from({ length: m }, (_, j) => eg.vectors[i][j] * Math.sqrt(Math.max(ev[j], 0))));
        L = varimax(L);
        const ss = Array.from({ length: m }, (_, j) => L.reduce((s, r) => s + r[j] ** 2, 0)), ord = ss.map((_, j) => j).sort((a, b) => ss[b] - ss[a]);
        L = L.map((r) => ord.map((j) => r[j]));
        for (let j = 0; j < m; j++) { const s = L.reduce((t, r) => t + r[j], 0); if (s < 0) L.forEach((r) => { r[j] = -r[j]; }); }
        clear();
        const W = 0.86, dx = W / p, D = Math.min(d - 0.2, 0.16 * m + 0.06), dz = D / m, bw = dx * 0.62, bd = dz * 0.58;
        const x0 = -W / 2 + dx / 2, z0 = D / 2 - dz / 2;
        L.forEach((row, i) => row.forEach((val, j) => {
          const a = Math.abs(val), hgt = Math.max(0.004, a * H);
          const bar = new T.Mesh(barGeo, val < -0.05 ? matNeg : a >= 0.4 ? matStrongs[j % 3] : matWeak);
          bar.scale.set(bw, hgt, bd); bar.position.set(x0 + i * dx, 0.01, z0 - j * dz); bar.castShadow = true;
          group.add(bar);
          if (a >= 0.4) { const e = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(bw, hgt, bd)), api.ink({ opacity: 0.7 })); e.position.set(bar.position.x, 0.01 + hgt / 2, bar.position.z); group.add(e); }
        }));
        NAMES.slice(0, p).forEach((n, i) => { const l = api.label(n, { size: 0.03, mono: true, color: 'muted' }); l.position.set(x0 + i * dx, 0.03, D / 2 + 0.035); group.add(l); });
        for (let j = 0; j < m; j++) { const l = api.label('성분 ' + (j + 1), { size: 0.034, weight: 700 }); l.position.set(W / 2 + 0.06, 0.04, z0 - j * dz); group.add(l); }
        thr.scale.set(W + 0.02, D, 1); thr.position.set(0, 0.01 + 0.4 * H, 0);
        thrLab.position.set(-W / 2 - 0.02, 0.01 + 0.4 * H + 0.03, -D / 2);
        api.invalidate();
      },
    };
  },
});
