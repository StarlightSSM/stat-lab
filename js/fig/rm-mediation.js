/* 매개효과 pop-up: X → M → Y as 3D blocks; tube thickness follows a, b, c' and the indirect path glows with a×b. */
BookFig.add('rm-mediation', {
  height: 0.6, caption: "매개모형 · 관의 굵기 = 경로계수, 위의 호 = 간접효과 a×b", yaw: -0.15, pitch: 0.55,
  build(api) {
    const P = window.Path3D, d = api.d;
    api.root.add(api.base({ w: 1, d, h: 0.012 }));
    const dyn = P.layer(api);
    return {
      update(p) {
        dyn.clearAll();
        const a = p.a ?? 0.4, b = p.b ?? 0.35, c = p.c ?? 0.1, ind = a * b;
        const X = P.node(api, dyn, { x: -0.33, z: d * 0.22, label: 'X 독립' });
        const M = P.node(api, dyn, { x: 0, z: -d * 0.2, label: 'M 매개', color: 'rm' });
        const Y = P.node(api, dyn, { x: 0.33, z: d * 0.22, label: 'Y 종속' });
        P.arrow(api, dyn, X, M, { value: a, label: 'a = ' + P.fmt(a) });
        P.arrow(api, dyn, M, Y, { value: b, label: 'b = ' + P.fmt(b) });
        P.arrow(api, dyn, X, Y, { value: c, label: "c' = " + P.fmt(c), dim: Math.abs(c) < 0.05 });
        // indirect effect: a ghost arc over the top whose thickness is a×b
        P.arrow(api, dyn, X, Y, { value: ind * 2.2, via: { x: 0, y: 0.34, z: -d * 0.42 }, color: 'rm', label: 'a×b = ' + P.fmt(ind, 3), dim: Math.abs(ind) < 0.02 });
        api.invalidate();
      },
    };
  },
});
