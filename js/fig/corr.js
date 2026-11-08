/* 상관분석 pop-up: the bivariate normal density as a translucent hill. At ρ = 0 it is a round mound; as |ρ|
   grows it stretches into a narrow diagonal ridge. The module's own sample sits on the floor underneath. */
BookFig.add('corr', {
  height: 0.72, caption: '이변량 정규분포 언덕 · ρ가 커질수록 대각선 능선', yaw: -0.2, pitch: 0.3,
  build(api) {
    const T = api.T, root = api.root, d = api.d;
    const R = 0.36, SC = R / 3;                       // ±3 SD fills the square
    { const pl = api.base({ w: 1, d: api.d, h: 0.01 }); pl.material = api.mat('paper', { tint: 0.08, hatch: 0.15 }); root.add(pl); }
    const N = 48, geo = new T.PlaneGeometry(2 * R, 2 * R, N, N);
    geo.rotateX(-Math.PI / 2);                        // lie on the floor: x → x, plane y → -z
    const base = geo.attributes.position.array.slice();
    const hill = new T.Mesh(geo, api.mat('accent', { tint: 0.6, hatch: 1, opacity: 0.88 })); hill.renderOrder = 2; root.add(hill);
    const wire = new T.LineSegments(new T.BufferGeometry(), api.ink({ color: 'accent', opacity: 0.4 })); root.add(wire);
    const frame = api.line([[-R, 0.012, -R], [R, 0.012, -R], [R, 0.012, R], [-R, 0.012, R], [-R, 0.012, -R]], { opacity: 0.45 }); root.add(frame);
    const lx = api.label('X', { size: 0.045, weight: 700 }); lx.position.set(R + 0.04, 0.02, R); root.add(lx);
    const ly = api.label('Y', { size: 0.045, weight: 700 }); ly.position.set(-R, 0.02, -R - 0.04); root.add(ly);
    const MAX = 502;
    const dots = new T.InstancedMesh(new T.SphereGeometry(0.0075, 6, 4), api.mat('#ffffff', { tint: 0.95 }), MAX); root.add(dots);
    const cA = api.color('ink'), cB = api.color('marker');
    let rLab = null;
    const m4 = new T.Matrix4();
    const clampXY = (v) => Math.max(-3, Math.min(3, v));
    function render(p, st) {
      const rho = p.rho ?? 0.5, k = Math.sqrt(1 - rho * rho);
      const f = (x, y) => Math.exp(-(x * x - 2 * rho * x * y + y * y) / (2 * k * k)) / (2 * Math.PI * k);
      const pk = 1 / (2 * Math.PI * k), HS = (0.2 + 0.14 * Math.abs(rho)) / pk;   // peak height grows gently with |ρ|
      const pos = geo.attributes.position, wl = [], dens = [];
      for (let i = 0; i < pos.count; i++) { const x = base[i * 3] / SC, y = -base[i * 3 + 2] / SC, v = f(x, y); dens.push(v / pk); pos.setY(i, 0.012 + v * HS); }
      pos.needsUpdate = true;
      // keep only the island where the density is visible (drop the flat skirt)
      const idx = []; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i, b = a + 1, e = a + N + 1, g2 = e + 1; if (Math.max(dens[a], dens[b], dens[e], dens[g2]) > 0.05) idx.push(a, e, b, b, e, g2); }
      geo.setIndex(idx); geo.computeVertexNormals();
      for (let j = 0; j <= N; j += 4) for (let i = 0; i < N; i++) {
        const a = j * (N + 1) + i, b = a + 1, c = i * (N + 1) + j, e = (i + 1) * (N + 1) + j;
        if (Math.max(dens[a], dens[b]) > 0.05) wl.push(pos.getX(a), pos.getY(a), pos.getZ(a), pos.getX(b), pos.getY(b), pos.getZ(b));
        if (Math.max(dens[c], dens[e]) > 0.05) wl.push(pos.getX(c), pos.getY(c), pos.getZ(c), pos.getX(e), pos.getY(e), pos.getZ(e));
      }
      wire.geometry.dispose(); wire.geometry = new T.BufferGeometry(); wire.geometry.setAttribute('position', new T.Float32BufferAttribute(wl, 3));
      // sample: use the module's own data when present, otherwise our own
      const n = Math.min(500, Math.round(p.n || 50));
      let z1 = st && st.z1, z2 = st && st.z2;
      if (!z1 || !z2) { const r = api.rng(41); z1 = []; z2 = []; for (let i = 0; i < 500; i++) { z1.push(api.randn(r)); z2.push(api.randn(r)); } }
      let c = 0;
      for (let i = 0; i < n; i++) { const x = z1[i], y = rho * x + k * z2[i]; m4.makeTranslation(clampXY(x) * SC, 0.016, -clampXY(y) * SC); dots.setMatrixAt(c, m4); dots.setColorAt(c, cA); c++; }
      if (p.outlier) { m4.makeTranslation(3 * SC, 0.02, -(rho >= 0 ? -3 : 3) * SC); dots.setMatrixAt(c, m4); dots.setColorAt(c, cB); c++; }
      dots.count = c; dots.instanceMatrix.needsUpdate = true; if (dots.instanceColor) dots.instanceColor.needsUpdate = true;
      if (rLab) { root.remove(rLab); rLab.material.map.dispose(); rLab.geometry.dispose(); }
      rLab = api.label(`ρ = ${rho.toFixed(2)}`, { size: 0.05, weight: 700, color: 'accent', bg: 'paper' });
      rLab.position.set(0, 0.012 + f(0, 0) * HS + 0.05, 0); root.add(rLab);
    }
    let ctxRef = null;
    return { update(p, changed, ctx) { ctxRef = ctx || ctxRef; render(p, ctxRef && ctxRef.state); } };
  },
});
