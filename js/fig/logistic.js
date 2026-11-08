/* 로지스틱 회귀 pop-up: a leaning card with two rails — y = 0 at the bottom, y = 1 at the top. The module's
   observations hang on the rails (green = classified correctly at the cutoff, red = wrong); the fitted S-curve
   is a tube between them, the true curve dashed, and the cutoff a horizontal bar. */
BookFig.add('logistic', {
  height: 0.58, caption: 'y = 0 · 1 레일 위의 관측값과 S자 확률곡선', yaw: -0.22, pitch: 0.12,
  build(api) {
    const T = api.T, root = api.root, d = api.d;
    const W = 0.84, H = 0.3, LEAN = 0.66, X = (x) => x / 4 * (W / 2);
    { const pl = api.base({ w: 1, d: api.d, h: 0.01 }); pl.material = api.mat('paper', { tint: 0.08, hatch: 0.15 }); root.add(pl); }
    const card = new T.Group(); card.position.z = d / 2 - 0.13; card.rotation.x = -LEAN; root.add(card);
    const back = new T.Mesh(new T.PlaneGeometry(W + 0.04, H + 0.06), api.mat('paper', { tint: 0.12, hatch: 0.25 }));
    back.position.set(0, 0.01 + H / 2, -0.012); api.edges(back, { opacity: 0.35 }); card.add(back);
    const railMat = api.mat('ink', { tint: 0.6 });
    [0, 1].forEach((v) => { const r = new T.Mesh(new T.CylinderGeometry(0.004, 0.004, W, 8), railMat); r.rotation.z = Math.PI / 2; r.position.set(0, 0.01 + v * H, 0); card.add(r);
      const l = api.label(`y = ${v}`, { size: 0.034, mono: true, color: 'muted' }); l.position.set(-W / 2 - 0.075, 0.01 + v * H, 0.01); card.add(l); });
    const MAX = 500;
    const dots = new T.InstancedMesh(new T.SphereGeometry(0.0075, 6, 4), api.mat('#ffffff', { tint: 0.95 }), MAX); card.add(dots);
    const cGood = api.color('good'), cBad = api.color('bad');
    const tubeMat = api.mat('accent', { tint: 0.9 });
    const m4 = new T.Matrix4(), dyn = [];
    const sig = (z) => 1 / (1 + Math.exp(-z));
    function clearDyn() { while (dyn.length) { const o = dyn.pop(); o.parent && o.parent.remove(o); o.geometry && o.geometry.dispose(); const m = o.material; if (m && m !== tubeMat) { m.map && m.map.dispose(); m.dispose(); } } }
    const add = (o) => { card.add(o); dyn.push(o); return o; };
    return {
      update(p, changed, ctx) {
        clearDyn();
        const st = ctx && ctx.state, n = Math.min(MAX, Math.round(p.n ?? 150)), b0 = p.b0 ?? -0.5, b1 = p.b1 ?? 1.2, thr = p.thr ?? 0.5;
        let ux = st && st.ux, uu = st && st.uu, jj = st && st.jj;
        if (!ux || !uu) { const r = api.rng(71); ux = []; uu = []; jj = []; for (let i = 0; i < 500; i++) { ux.push(r() * 8 - 4); uu.push(r()); jj.push(r() * 2 - 1); } }
        const x = ux.slice(0, n), y = x.map((xi, i) => (uu[i] < sig(b0 + b1 * xi) ? 1 : 0));
        const ones = y.reduce((a, b) => a + b, 0);
        let fit = null; if (ones > 0 && ones < n) { try { fit = S.logit(x.map((a) => [a]), y); } catch (e) { fit = null; } }
        const ph = fit ? (xx) => sig(fit.b[0] + fit.b[1] * xx) : (xx) => sig(b0 + b1 * xx);
        for (let i = 0; i < n; i++) {
          const ok = (ph(x[i]) >= thr ? 1 : 0) === y[i];
          m4.makeTranslation(X(x[i]), 0.01 + y[i] * H + 0.009, (jj ? jj[i] : 0) * 0.012); dots.setMatrixAt(i, m4); dots.setColorAt(i, ok ? cGood : cBad);
        }
        dots.count = n; dots.instanceMatrix.needsUpdate = true; if (dots.instanceColor) dots.instanceColor.needsUpdate = true;
        const pts = []; for (let i = 0; i <= 60; i++) { const xx = -4 + 8 * i / 60; pts.push(new T.Vector3(X(xx), 0.01 + ph(xx) * H, 0.004)); }
        const tube = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 80, 0.0055, 6, false), tubeMat); tube.castShadow = true; add(tube);
        if (p.truth !== false) { const tp = []; for (let i = 0; i <= 80; i++) { const xx = -4 + 8 * i / 80; tp.push([X(xx), 0.01 + sig(b0 + b1 * xx) * H, 0.006]); } add(api.line(tp, { dashed: true, color: 'muted', opacity: 0.9 })); }
        add(api.line([[-W / 2, 0.01 + thr * H, 0.008], [W / 2, 0.01 + thr * H, 0.008]], { color: 'marker', opacity: 0.85 }));
        // x where the fitted curve crosses the cutoff
        if (fit && Math.abs(fit.b[1]) > 1e-6) { const xc = (Math.log(thr / (1 - thr)) - fit.b[0]) / fit.b[1]; if (xc > -4 && xc < 4) add(api.line([[X(xc), 0.01, 0.008], [X(xc), 0.01 + H, 0.008]], { color: 'marker', dashed: true, opacity: 0.85 })); }
        const l = api.label(`cutoff ${thr.toFixed(2)}`, { size: 0.032, color: 'marker', bg: 'paper' }); l.position.set(W / 2 - 0.05, 0.01 + thr * H + 0.03, 0.01); add(l);
      },
    };
  },
});
