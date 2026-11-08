/* 경로분석 pop-up: AMOS path diagram in 3D. Shows the sample estimates when "표본 추정치" is on (non-significant
   paths turn translucent), otherwise the population values. Disturbance rings sit on M and Y. */
BookFig.add('sem-path', {
  height: 0.6, caption: 'AMOS 경로도 · 굵기 = 계수, 반투명 = p ≥ .05', yaw: -0.15, pitch: 0.55,
  build(api) {
    const P = window.Path3D, d = api.d;
    api.root.add(api.base({ w: 1, d, h: 0.012 }));
    const dyn = P.layer(api);
    return {
      update(p, changed, ctx) {
        dyn.clearAll();
        const est = p.est && ctx && ctx.state.last;
        const v = est ? est : { a: p.a, b: p.b, c: p.c, pa: 0, pb: 0, pc: 0 };
        const sig = (q) => !est || q < 0.05;
        const stars = (q) => (!est ? '' : q < 0.001 ? '***' : q < 0.01 ? '**' : q < 0.05 ? '*' : '');
        const X = P.node(api, dyn, { x: -0.34, z: d * 0.2, label: 'X' });
        const M = P.node(api, dyn, { x: 0, z: -d * 0.2, label: 'M', color: 'sem' });
        const Y = P.node(api, dyn, { x: 0.34, z: d * 0.2, label: 'Y', color: 'sem' });
        const eM = P.node(api, dyn, { x: 0, z: -d * 0.2 - 0.14, kind: 'err', label: 'e1' });
        const eY = P.node(api, dyn, { x: 0.34, z: d * 0.2 + 0.15, kind: 'err', label: 'e2' });
        P.arrow(api, dyn, X, M, { value: v.a, label: P.fmt(v.a) + stars(v.pa), dim: !sig(v.pa) });
        P.arrow(api, dyn, M, Y, { value: v.b, label: P.fmt(v.b) + stars(v.pb), dim: !sig(v.pb) });
        P.arrow(api, dyn, X, Y, { value: v.c, label: P.fmt(v.c) + stars(v.pc), dim: !sig(v.pc) });
        P.arrow(api, dyn, eM, M, { value: 0.15, color: 'muted' });
        P.arrow(api, dyn, eY, Y, { value: 0.15, color: 'muted' });
        api.invalidate();
      },
    };
  },
});
