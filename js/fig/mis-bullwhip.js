/* 채찍효과 pop-up: 소비자 → 소매 → 도매 → 유통 → 공장, 다섯 자리의 상자 더미 높이가 그 주의 주문량입니다.
   주차를 재생하면 소비자 쪽 더미는 조금씩 흔들리는데 공장 쪽 더미는 크게 출렁입니다. 철사 기둥은 그 단계 주문량의 최소~최대 범위.
   모듈과 같은 주문 규칙(이동평균 예측 + 리드타임)을 그림 전용 난수로 돌립니다. */
BookFig.add('mis-bullwhip', {
  height: 0.62, caption: '주문량 상자 더미 · 공급망 위로 갈수록 출렁임이 커진다', yaw: -0.2, pitch: 0,
  build(api) {
    const T = api.T, d = api.d;
    // back-hinged stand: the figure leans away from the reader so heights read upward from the near-overhead page camera
    const stand = new T.Group(), root = new T.Group(); stand.position.z = -d / 2; stand.rotation.x = -0.5; root.position.z = d / 2; stand.add(root); api.root.add(stand);
    const hinge = new T.Mesh(new T.BoxGeometry(0.9, 0.006, 0.012), api.mat('paper', { tint: 0.2, hatch: 0.5 })); hinge.position.set(0, 0.003, -d / 2); api.root.add(hinge);
    root.add(api.base({ w: 1, d, h: 0.01 }));
    const NAMES = ['소비자', '소매', '도매', '유통', '공장'], COLS = ['ink', 's1', 's3', 's4', 's2'];
    const CR = 0.042, PER = 25, MAXC = 10;                    // crate size, units per crate, max crates per stack
    const crateGeo = new T.BoxGeometry(CR * 0.92, CR * 0.92, CR * 0.92);
    const stacks = COLS.map((c, i) => { const m = new T.InstancedMesh(crateGeo, api.mat(c, { tint: i ? 0.8 : 0.35 }), MAXC); m.castShadow = true; m.frustumCulled = false; m.count = 0; root.add(m); return m; });
    const xs = NAMES.map((_, i) => -0.4 + i * 0.2), z = 0.02;
    const rangeBoxes = NAMES.map(() => { const l = new T.LineSegments(new T.BufferGeometry(), api.ink({ opacity: 0.45 })); root.add(l); return l; });
    NAMES.forEach((n, i) => { const l = api.label(n, { size: 0.036, weight: 600, color: i ? 'ink' : 'muted' }); l.position.set(xs[i], 0.03, z + 0.085); root.add(l); });
    // order flow arrows (orders travel upstream: consumer → factory)
    for (let i = 0; i < 4; i++) { root.add(api.line([[xs[i] + 0.035, 0.02, z + 0.06], [xs[i + 1] - 0.035, 0.02, z + 0.06]], { opacity: 0.5 })); const cone = new T.Mesh(new T.ConeGeometry(0.008, 0.02, 8), api.mat('ink', { tint: 0.7 })); cone.rotation.z = -Math.PI / 2; cone.position.set(xs[i + 1] - 0.035, 0.02, z + 0.06); root.add(cone); }
    let mults = [], multLabs = [];
    let weekLab = api.label(' ', { size: 0.034, mono: true }); root.add(weekLab);
    const m4 = new T.Matrix4();
    let series = [], week = 0, acc = 0, seed = 3, burn = 10, lastWeek = -1;
    function relabel(old, text, opts, pos) { const f = api.label(text, opts); f.position.copy(pos); if (old) { root.remove(old); old.geometry.dispose(); old.material.map.dispose(); old.material.dispose(); } root.add(f); return f; }
    function compute(v) {
      const r = api.rng(seed * 7717), TT = 80, L = v.L ?? 2, w = v.w ?? 8, noise = v.noise ?? 10;
      const randn = () => api.randn(r);
      const dmd = Array.from({ length: TT }, (_, t) => Math.max(0, 100 * (v.step && t >= 20 ? 1.2 : 1) + noise * randn()));
      const orders = (dem, base) => { const q = [], Sp = []; for (let t = 0; t < TT; t++) { const lo = Math.max(0, t - w + 1), win = base.slice(lo, t + 1), m = win.reduce((a, b) => a + b, 0) / win.length, St = (L + 1) * m; q.push(t === 0 ? dem[t] : Math.max(0, dem[t] + St - Sp[t - 1])); Sp.push(St); } return q; };
      series = [dmd]; for (let k = 0; k < 4; k++) series.push(orders(series[k], v.share ? dmd : series[k]));
      burn = w + 2;
      const vr = (a) => { const s = a.slice(burn), m = s.reduce((x, y) => x + y, 0) / s.length; return s.reduce((x, y) => x + (y - m) ** 2, 0) / s.length; };
      const v0 = vr(dmd) || 1; mults = series.map((s) => vr(s) / v0);
      series.forEach((s, i) => {
        const sl = s.slice(burn), lo = Math.min(...sl) / PER * CR, hi = Math.min(MAXC * CR, Math.max(...sl) / PER * CR);
        const bx = new T.BoxGeometry(CR * 1.25, Math.max(0.002, hi - lo), CR * 1.25); bx.translate(xs[i], 0.01 + (lo + hi) / 2, z);
        rangeBoxes[i].geometry.dispose(); rangeBoxes[i].geometry = new T.EdgesGeometry(bx); bx.dispose();
        multLabs[i] = relabel(multLabs[i], i ? `×${mults[i] < 10 ? mults[i].toFixed(1) : Math.round(mults[i])}` : '×1', { size: 0.034, mono: true, weight: 600, color: i ? 'ink' : 'muted' }, new T.Vector3(xs[i], 0.03, z + 0.14));
      });
      week = burn; lastWeek = -1;
    }
    function draw() {
      series.forEach((s, i) => {
        const n = Math.min(MAXC, Math.max(0, Math.round(s[week] / PER)));
        for (let k = 0; k < n; k++) { m4.makeTranslation(xs[i] + (k % 2 ? 0.002 : -0.002), 0.01 + CR / 2 + k * CR, z); stacks[i].setMatrixAt(k, m4); }
        stacks[i].count = n; stacks[i].instanceMatrix.needsUpdate = true;
      });
      weekLab = relabel(weekLab, `${week}주차`, { size: 0.034, mono: true }, new T.Vector3(-0.4, 0.03, -d / 2 + 0.06));
    }
    return {
      update(v, changed) { if (changed === 'resample') seed++; compute(v); draw(); },
      tick(dt) {
        acc += dt; if (acc < 0.3) return true; acc = 0;
        week = week + 1 >= 80 ? burn : week + 1;
        if (week !== lastWeek) { lastWeek = week; draw(); }
        return true;
      },
    };
  },
});
