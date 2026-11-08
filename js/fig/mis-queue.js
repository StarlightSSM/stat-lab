/* 대기행렬 pop-up: 창구 c개와 줄 선 고객(말)을 디오라마로. 도착은 포아송(λ), 처리는 지수(μ) 시간으로
   그림 전용 난수 시뮬레이션을 돌립니다. ρ = λ/(cμ)가 1에 가까워지면 줄이 길게 늘어지고, ρ ≥ 1이면 끝없이 쌓입니다. */
BookFig.add('mis-queue', {
  height: 0.64, caption: '창구 디오라마 · 도착 λ, 처리 μ, 창구 c', yaw: -0.25, pitch: 0.6,
  build(api) {
    const T = api.T, root = api.root, d = api.d;
    root.add(api.base({ w: 1, d, h: 0.01 }));
    const MAX = 56, CAPQ = 36;
    const bodyGeo = new T.CylinderGeometry(0.017, 0.025, 0.06, 12); bodyGeo.translate(0, 0.04, 0);
    const headGeo = new T.SphereGeometry(0.017, 12, 10); headGeo.translate(0, 0.088, 0);
    const bodies = new T.InstancedMesh(bodyGeo, api.mat('#ffffff', { tint: 0.88 }), MAX), heads = new T.InstancedMesh(headGeo, api.mat('#ffffff', { tint: 0.88 }), MAX);
    bodies.castShadow = heads.castShadow = true; bodies.frustumCulled = heads.frustumCulled = false; root.add(bodies, heads);
    bodies.setColorAt(0, new T.Color(1, 1, 1)); heads.setColorAt(0, new T.Color(1, 1, 1)); bodies.count = heads.count = 0;
    const deskGroup = new T.Group(); root.add(deskGroup);
    let lab = api.label(' ', { size: 0.04, bg: 'paper' }); root.add(lab);
    const cWait = api.color('mis'), cServe = api.color('good'), cLeave = new T.Color('#c9c2b5');
    const backZ = -d / 2 + 0.09, qZ0 = backZ + 0.13, m4 = new T.Matrix4();
    let c = 1, lam = 16, mu = 20, rate = 0.12, t = 0, nextArr = 0, rnd = api.rng(5), people = [], servers = [], queue = [], labTxt = '', labT = 0;
    const expo = (r) => -Math.log(1 - rnd()) / r;
    const serverX = (i) => (c === 1 ? 0 : -0.3 + (0.6 * i) / (c - 1));
    function buildDesks() {
      while (deskGroup.children.length) { const o = deskGroup.children.pop(); o.geometry.dispose(); }
      for (let i = 0; i < c; i++) {
        const m = new T.Mesh(new T.BoxGeometry(0.13, 0.07, 0.05), api.mat('paper', { tint: 0.2, hatch: 0.8 }));
        m.position.set(serverX(i), 0.045, backZ); m.castShadow = true; api.edges(m, { opacity: 0.7 }); deskGroup.add(m);
        const sign = new T.Mesh(new T.BoxGeometry(0.07, 0.03, 0.005), api.mat('mis', { tint: 0.8 })); sign.position.set(serverX(i), 0.11, backZ - 0.018); deskGroup.add(sign);
      }
    }
    function slot(k) { const per = 9, row = Math.floor(k / per), col = k % per, dir = row % 2 ? -1 : 1; return new T.Vector3(dir * (-0.32 + col * 0.075) * -1, 0.01, qZ0 + row * 0.055); }
    function reset() { t = 0; nextArr = expo(lam); people = []; queue = []; servers = Array(c).fill(null); buildDesks(); }
    function relabel() {
      const rho = lam / (c * mu), txt = `ρ = ${rho.toFixed(2)} · 줄 ${queue.length}${queue.length >= CAPQ ? '+' : ''}명`;
      if (txt === labTxt) return; labTxt = txt;
      const f = api.label(txt, { size: 0.04, bg: 'paper' }); root.remove(lab); lab.geometry.dispose(); lab.material.map.dispose(); lab.material.dispose(); lab = f; lab.position.set(-0.28, 0.05, d / 2 - 0.05); root.add(lab);
    }
    function simulate(dtMin) {
      const end = t + dtMin;
      while (true) {
        let nextDone = Infinity, who = -1;
        servers.forEach((s, i) => { if (s && s.done < nextDone) { nextDone = s.done; who = i; } });
        const tn = Math.min(nextArr, nextDone);
        if (tn > end) break;
        t = tn;
        if (tn === nextArr) {
          nextArr = t + expo(lam);
          if (queue.length < CAPQ && people.length < MAX) { const p = { state: 'q', pos: new T.Vector3(0.5, 0.01, d / 2 - 0.02), tgt: new T.Vector3() }; people.push(p); queue.push(p); }
        } else {
          const p = servers[who]; servers[who] = null; p.state = 'out'; p.tgt.set(-0.56, 0.01, backZ + 0.05);
        }
        servers.forEach((s, i) => { if (!s && queue.length) { const p = queue.shift(); p.state = 's'; p.done = t + expo(mu); servers[i] = p; } });
      }
      t = end;
    }
    return {
      update(v, changed) {
        const nc = Math.round(v.c ?? 1), changedC = nc !== c;
        c = nc; lam = v.lam ?? 16; mu = v.mu ?? 20; rate = 0.02 * (v.speed ?? 6);
        if (changedC || changed === 'resample' || changed === 'init') reset();
        relabel();
      },
      tick(dt) {
        simulate(dt * rate);
        queue.forEach((p, k) => p.tgt.copy(slot(k)));
        servers.forEach((p, i) => { if (p) p.tgt.set(serverX(i), 0.01, backZ + 0.065); });
        people = people.filter((p) => !(p.state === 'out' && p.pos.distanceTo(p.tgt) < 0.02));
        people.forEach((p, i) => {
          const step = Math.min(1, dt * 6); p.pos.lerp(p.tgt, step);
          m4.makeTranslation(p.pos.x, p.pos.y, p.pos.z); bodies.setMatrixAt(i, m4); heads.setMatrixAt(i, m4);
          const col = p.state === 's' ? cServe : p.state === 'out' ? cLeave : cWait; bodies.setColorAt(i, col); heads.setColorAt(i, col);
        });
        bodies.count = heads.count = people.length;
        bodies.instanceMatrix.needsUpdate = heads.instanceMatrix.needsUpdate = true;
        if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true; if (heads.instanceColor) heads.instanceColor.needsUpdate = true;
        labT += dt; if (labT > 0.3) { labT = 0; relabel(); }
        return true;
      },
    };
  },
});
