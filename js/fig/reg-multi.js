/* 다중회귀 pop-up: 3D scatter of (X1, X2, Y) with the fitted regression plane and residual sticks.
   When r12 is high the points collapse onto the X1 = X2 diagonal and the plane is pinned down only along that
   line, so each resample tilts it wildly — multicollinearity you can see. */
BookFig.add('reg-multi', {
  height: 0.72, caption: '회귀평면 · 점이 대각선에 몰리면 평면이 흔들린다', yaw: -0.32, pitch: 0.1,
  build(api) {
    const T = api.T, root = api.root, d = api.d;
    const S = 0.27;                       // half-size of the plotting cube in figure units
    const cy = 0.17;                      // height of Y = 0
    // no plinth: a yawed plinth would stick out of the placeholder
    const box = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(2 * S, 2 * S * 0.42, 2 * S)), api.ink({ opacity: 0.25 }));
    box.position.set(0, cy, 0); root.add(box);
    // axes
    const ax = (a, b, lab, pos) => { root.add(api.line([a, b], { opacity: 0.85 })); const l = api.label(lab, { size: 0.05, weight: 700 }); l.position.set(...pos); root.add(l); };
    ax([-S, cy - S * 0.42, S], [S, cy - S * 0.42, S], 'X1', [S + 0.05, cy - S * 0.42, S]);
    ax([-S, cy - S * 0.42, S], [-S, cy - S * 0.42, -S], 'X2', [-S, cy - S * 0.42, -S - 0.05]);
    ax([-S, cy - S * 0.42, S], [-S, cy + S * 0.42, S], 'Y', [-S, cy + S * 0.42 + 0.04, S]);
    const MAXN = 160;
    const dotGeo = new T.SphereGeometry(0.011, 10, 8);
    const dots = new T.InstancedMesh(dotGeo, api.mat('prob', { tint: 0.95 }), MAXN); root.add(dots);
    const sticks = new T.LineSegments(new T.BufferGeometry(), api.ink({ color: 'marker', opacity: 0.75 })); root.add(sticks);
    const planeGeo = new T.PlaneGeometry(2 * S, 2 * S, 8, 8);
    const plane = new T.Mesh(planeGeo, api.mat('accent', { tint: 0.35, hatch: 0.4, opacity: 0.55 })); root.add(plane);
    const grid = new T.LineSegments(new T.BufferGeometry(), api.ink({ color: 'accent', opacity: 0.6 })); root.add(grid);
    const m4 = new T.Matrix4();
    let seed = 1;
    const sy = S * 0.42 / 3;              // Y units → figure units (±3 fills the box)
    const sx = S / 2.4;                   // X units → figure units (±2.4 fills the box)
    function render(p) {
      const r = api.rng(seed * 7919 + 11), n = Math.min(MAXN, Math.round(p.n || 100));
      const r12 = p.r12 ?? 0.3, b1 = p.b1 ?? 0.5, b2 = p.b2 ?? 0.3;
      const X = [];
      for (let i = 0; i < n; i++) { const z1 = api.randn(r), z2 = api.randn(r); const x1 = z1, x2 = r12 * z1 + Math.sqrt(1 - r12 * r12) * z2; X.push([x1, x2, b1 * x1 + b2 * x2 + api.randn(r)]); }
      // OLS with intercept via normal equations (3×3)
      let s = { n, a: 0, b: 0, y: 0, aa: 0, bb: 0, ab: 0, ay: 0, by: 0 };
      X.forEach(([a, b, y]) => { s.a += a; s.b += b; s.y += y; s.aa += a * a; s.bb += b * b; s.ab += a * b; s.ay += a * y; s.by += b * y; });
      const ma = s.a / n, mb = s.b / n, my = s.y / n;
      const Saa = s.aa - n * ma * ma, Sbb = s.bb - n * mb * mb, Sab = s.ab - n * ma * mb, Say = s.ay - n * ma * my, Sby = s.by - n * mb * my;
      const det = Saa * Sbb - Sab * Sab || 1e-9;
      const c1 = (Sbb * Say - Sab * Sby) / det, c2 = (Saa * Sby - Sab * Say) / det, c0 = my - c1 * ma - c2 * mb;
      const clampY = (v) => Math.max(-S * 0.42, Math.min(S * 0.42, v));
      dots.count = n; const seg = [];
      X.forEach(([a, b, y], i) => {
        const px = Math.max(-S, Math.min(S, a * sx)), pz = -Math.max(-S, Math.min(S, b * sx)), py = cy + clampY(y * sy), fy = cy + clampY((c0 + c1 * a + c2 * b) * sy);
        m4.makeTranslation(px, py, pz); dots.setMatrixAt(i, m4); seg.push(px, py, pz, px, fy, pz);
      });
      dots.instanceMatrix.needsUpdate = true;
      sticks.geometry.dispose(); sticks.geometry = new T.BufferGeometry(); sticks.geometry.setAttribute('position', new T.Float32BufferAttribute(seg, 3));
      // plane over the cube's footprint
      const pos = planeGeo.attributes.position, gl = [];
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i), v = pos.getY(i);               // PlaneGeometry lies in XY before we map it
        const a = u / sx, b = v / sx, yv = cy + clampY((c0 + c1 * a + c2 * b) * sy);
        pos.setXYZ(i, u, yv, -v);
      }
      pos.needsUpdate = true; planeGeo.computeVertexNormals();
      for (let k = 0; k <= 4; k++) {
        const t = -S + (2 * S * k) / 4;
        const f = (u, v) => [u, cy + clampY((c0 + c1 * (u / sx) + c2 * (v / sx)) * sy), -v];
        gl.push(...f(t, -S), ...f(t, S), ...f(-S, t), ...f(S, t));
      }
      grid.geometry.dispose(); grid.geometry = new T.BufferGeometry(); grid.geometry.setAttribute('position', new T.Float32BufferAttribute(gl, 3));
    }
    return {
      update(p, changed) { if (changed === 'resample') seed++; render(p); },
    };
  },
});
