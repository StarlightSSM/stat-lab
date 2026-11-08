/* 확인적 요인분석 pop-up: two latent factors (ellipsoids) loading on indicator boxes. Arrow thickness = λ,
   error ring size = 1 − λ² (unique variance), the curved double arrow on top = factor correlation φ. */
BookFig.add('sem-cfa', {
  height: 0.62, caption: 'CFA · 굵기 = 적재량 λ, 고리 크기 = 오차분산 1−λ²', yaw: -0.12, pitch: 0.58,
  build(api) {
    const P = window.Path3D, d = api.d;
    api.root.add(api.base({ w: 1, d, h: 0.012 }));
    const dyn = P.layer(api);
    return {
      update(p) {
        dyn.clearAll();
        const m = +(p.m || 4), l1 = p.l1 ?? 0.78, weak = p.weak ?? 0.55, l2 = p.l2 ?? 0.72, phi = p.phi ?? 0.45;
        const F1 = P.node(api, dyn, { x: -0.22, z: -d * 0.3, kind: 'lat', label: 'F1', color: 'sem' });
        const F2 = P.node(api, dyn, { x: 0.22, z: -d * 0.3, kind: 'lat', label: 'F2', color: 's7' });
        const total = 2 * m, gap = 0.9 / total;
        for (let f = 0; f < 2; f++) for (let i = 0; i < m; i++) {
          const k = f * m + i, x = -0.45 + gap * (k + 0.5), lam = f === 0 ? (i === m - 1 ? weak : l1) : l2;
          const box = P.node(api, dyn, { x, z: d * 0.14, label: (f ? 'y' : 'x') + (i + 1), size: Math.min(1, gap / 0.2) });
          P.arrow(api, dyn, f ? F2 : F1, box, { value: lam, label: P.fmt(lam), color: f ? 's7' : 'sem', dim: lam < 0.5 });
          const u = 1 - lam * lam;
          const e = P.node(api, dyn, { x, z: d * 0.14 + 0.11, kind: 'err', size: 0.5 + 1.4 * u });
          P.arrow(api, dyn, e, box, { value: 0.1, color: 'muted' });
        }
        P.arrow(api, dyn, F1, F2, { value: phi, via: { x: 0, y: 0.26, z: -d * 0.48 }, both: true, color: 'ink', label: 'φ = ' + P.fmt(phi), dim: phi < 0.1 });
        api.invalidate();
      },
    };
  },
});
