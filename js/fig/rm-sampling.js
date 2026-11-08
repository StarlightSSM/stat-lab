/* 표본추출 pop-up: the module's 400-student population as pawns (40 classes × 10, colored by grade).
   Pawns in the current sample rise up out of the board; everyone else sinks and fades.
   Selection is read from the module's own grid so the 3D view matches the chart exactly. */
BookFig.add('rm-sampling', {
  height: 0.5, caption: '모집단 400명 · 솟아오른 말 = 이번 표본', yaw: -0.1, pitch: 0.62,
  build(api) {
    const T = api.T, root = api.root, d = api.d;
    root.add(api.base({ w: 1, d, h: 0.012 }));
    const N = 400, cols = ['s1', 's3', 's4', 's7'];
    const geo = new T.CylinderGeometry(0.0075, 0.009, 0.03, 10); geo.translate(0, 0.015, 0);
    const head = new T.SphereGeometry(0.0085, 10, 8); head.translate(0, 0.036, 0);
    const mats = cols.map((c) => api.mat(c, { tint: 0.9 }));
    // one instanced body+head pair per grade
    const bodies = mats.map((m) => { const b = new T.InstancedMesh(geo, m, 100); const h = new T.InstancedMesh(head, m, 100); root.add(b, h); return [b, h]; });
    const dx = 0.92 / 43, dz = Math.min(0.04, (d - 0.08) / 10);
    const X = (c) => -0.46 + dx * (c + 0.5 + Math.floor(c / 10) * 1), Z = (r) => -dz * 4.5 + r * dz;
    const cur = new Float32Array(N), goal = new Float32Array(N);
    const gradeLabels = [0, 1, 2, 3].map((g) => { const l = api.label(`${g + 1}학년`, { size: 0.035, weight: 600 }); l.position.set(X(g * 10 + 4.5), 0.03, Z(0) - 0.05); root.add(l); return l; });
    const m4 = new T.Matrix4(), q = new T.Quaternion(), s = new T.Vector3(), v = new T.Vector3();
    function readSel(ctx) {
      const out = new Uint8Array(N);
      const svg = ctx && ctx.state.svg; if (!svg) return out;
      svg.selectAll('circle').each(function (dd, i) { if (i < N && +this.style.opacity === 1) out[dd.c * 10 + dd.r] = 1; });
      return out;
    }
    function draw() {
      const k = [0, 0, 0, 0];
      for (let c = 0; c < 40; c++) for (let r = 0; r < 10; r++) {
        const i = c * 10 + r, g = Math.floor(c / 10), t = cur[i];
        v.set(X(c), 0.012 + t * 0.08, Z(r)); s.set(0.75 + t * 0.5, 0.55 + t * 0.85, 0.75 + t * 0.5); m4.compose(v, q, s);
        bodies[g][0].setMatrixAt(k[g], m4); bodies[g][1].setMatrixAt(k[g], m4); k[g]++;
      }
      bodies.forEach(([b, h]) => { b.instanceMatrix.needsUpdate = true; h.instanceMatrix.needsUpdate = true; });
    }
    draw();
    return {
      update(p, changed, ctx) { const sel = readSel(ctx); for (let i = 0; i < N; i++) goal[i] = sel[i]; api.invalidate(); },
      tick(dt) {
        let moving = false;
        for (let i = 0; i < N; i++) { const dlt = goal[i] - cur[i]; if (Math.abs(dlt) > 0.002) { cur[i] += dlt * Math.min(1, dt * 7); moving = true; } else cur[i] = goal[i]; }
        if (moving) draw();
        return moving;
      },
    };
  },
});
