/* 네트워크 효과 pop-up: 사용자 n명(가치 곡선 슬라이더)을 노드로 세우고, 가입한 사람끼리 링크로 잇습니다.
   가입 비율은 모듈과 같은 동학 xₜ₊₁ = 1 − Φ((가격 − k·xₜ − 0.5)/0.2)를 30기 동안 재생합니다.
   임계점 위에서 출발하면 노드가 연쇄적으로 켜지고, 아래면 꺼져 갑니다. 링크 수는 n(n−1)/2로 늘어납니다. */
BookFig.add('mis-network', {
  height: 0.66, caption: '가입자끼리 잇는 링크 · 임계점을 넘으면 연쇄 가입', yaw: -0.2, pitch: 0.55,
  build(api) {
    const T = api.T, root = api.root, d = api.d;
    root.add(api.base({ w: 1, d, h: 0.01 }));
    const MAX = 60, R = Math.min(0.4, d / 2 - 0.06);
    const geo = new T.SphereGeometry(1, 16, 12);
    const nodes = new T.InstancedMesh(geo, api.mat('#ffffff', { tint: 0.9 }), MAX); root.add(nodes); nodes.setColorAt(0, new T.Color(1, 1, 1));
    const links = new T.LineSegments(new T.BufferGeometry(), api.ink({ color: 'mis', opacity: 0.35 })); root.add(links);
    const pulses = new T.InstancedMesh(new T.SphereGeometry(0.008, 8, 6), api.mat('marker', { tint: 1 }), 24); pulses.count = 0; pulses.frustumCulled = nodes.frustumCulled = false; root.add(pulses);
    let lab = api.label(' ', { size: 0.04, bg: 'paper' }); root.add(lab);
    const cOn = api.color('mis'), cOff = new T.Color('#d6d0c4'), cOn2 = api.color('s1');
    const m4 = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(), pv = new T.Vector3();
    let pos = [], path = [], share = 0, tStep = 0, step = 0, N = 30, two = false, pulseList = [], rnd = api.rng(3), shown = 0;
    const PHI = 2.39996323;
    function layout(n) {
      pos = [];
      for (let i = 0; i < n; i++) { const rr = R * Math.sqrt((i + 0.5) / n), a = i * PHI; pos.push(new T.Vector3(Math.cos(a) * rr, 0.05 + 0.2 * (1 - (rr / R) ** 2) + 0.02 * Math.sin(i * 1.7), Math.sin(a) * rr)); }
    }
    function relabel(text) { const f = api.label(text, { size: 0.04, bg: 'paper' }); root.remove(lab); lab.geometry.dispose(); lab.material.map.dispose(); lab.material.dispose(); lab = f; lab.position.set(0, 0.33, -R - 0.03); root.add(lab); }
    let drawn = -1;
    function draw(sh, force) {
      const on = Math.round(N * sh), seg = [];
      if (on === drawn && !force) return on; drawn = on;
      for (let i = 0; i < N; i++) {
        const act = i < on, side2 = two && i % 2 === 1, s = act ? 0.016 + 0.01 * Math.min(1, on / 40) : 0.011;
        sc.set(s, s, s); m4.compose(pos[i], q, sc); nodes.setMatrixAt(i, m4); nodes.setColorAt(i, act ? (side2 ? cOn2 : cOn) : cOff);
      }
      for (let i = 0; i < on; i++) for (let j = i + 1; j < on; j++) { if (two && (i % 2) === (j % 2)) continue; seg.push(pos[i].x, pos[i].y, pos[i].z, pos[j].x, pos[j].y, pos[j].z); }
      nodes.count = N; nodes.instanceMatrix.needsUpdate = true; if (nodes.instanceColor) nodes.instanceColor.needsUpdate = true;
      links.geometry.dispose(); links.geometry = new T.BufferGeometry(); links.geometry.setAttribute('position', new T.Float32BufferAttribute(seg, 3));
      links.material.opacity = Math.max(0.12, 0.45 - on / 160);
      if (on !== shown) { shown = on; const L = two ? Math.ceil(on / 2) * Math.floor(on / 2) : (on * (on - 1)) / 2; relabel(`가입 ${on}/${N}명 · 링크 ${L}개`); }
      return on;
    }
    return {
      update(v) {
        N = Math.max(2, Math.min(MAX, Math.round(v.N ?? 30))); two = !!v.two;
        const k = v.k ?? 1.2, pr = v.price ?? 0.9, SD = 0.2;
        const A = [v.x0 ?? 0.25], B = [(v.x0 ?? 0.25) * 0.5];
        for (let t = 0; t < 30; t++) {
          if (two) { const a = A[t], b = B[t]; A.push(1 - S.pnorm((pr - k * b - 0.5) / SD)); B.push(1 - S.pnorm((pr * 0.8 - k * a - 0.5) / SD)); }
          else A.push(1 - S.pnorm((pr - k * A[t] - 0.5) / SD));
        }
        path = A; step = 0; tStep = 0; share = A[0]; layout(N); shown = -1; draw(share, true);
      },
      tick(dt) {
        tStep += dt;
        if (step < path.length - 1) { const u = Math.min(1, tStep / 0.35); share = path[step] + (path[step + 1] - path[step]) * u; if (u >= 1) { step++; tStep = 0; } }
        const on = draw(share);
        // signals travelling along random links between members
        if (on > 1 && pulseList.length < 24 && rnd() < dt * 18) { const i = Math.floor(rnd() * on); let j = Math.floor(rnd() * on); if (j === i) j = (j + 1) % on; if (!(two && i % 2 === j % 2)) pulseList.push({ i, j, t: 0 }); }
        pulseList.forEach((p) => { p.t += dt * 1.6; });
        pulseList = pulseList.filter((p) => p.t < 1 && p.i < on && p.j < on);
        pulseList.forEach((p, n) => { pv.lerpVectors(pos[p.i], pos[p.j], p.t); m4.makeTranslation(pv.x, pv.y, pv.z); pulses.setMatrixAt(n, m4); });
        pulses.count = pulseList.length; pulses.instanceMatrix.needsUpdate = true;
        return true;
      },
    };
  },
});
