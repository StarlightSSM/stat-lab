/* 중심극한정리 pop-up: two leaning cards. Back card: the population shape. Front card: a histogram of the sample
   means built from stacked blocks; it grows live as the module draws samples (reads ctx.state.ms), with the
   theoretical N(μ, σ/√n) curve over it. */
(function () {
  const POP = {
    normal: { dom: [-4, 4], pdf: (x) => S.dnorm(x), mu: 0, sd: 1 },
    uniform: { dom: [0, 1], pdf: (x) => (x >= 0 && x <= 1 ? 1 : 0), mu: 0.5, sd: Math.sqrt(1 / 12) },
    exp: { dom: [0, 6], pdf: (x) => (x < 0 ? 0 : Math.exp(-x)), mu: 1, sd: 1 },
    skew: { dom: [0, 5], pdf: (x) => (x <= 0 ? 0 : Math.exp(-(Math.log(x) ** 2) / (2 * 0.36)) / (x * 0.6 * Math.sqrt(2 * Math.PI))), mu: Math.exp(0.18), sd: Math.sqrt((Math.exp(0.36) - 1) * Math.exp(0.36)) },
    bimodal: { dom: [-4.5, 4.5], pdf: (x) => 0.5 * S.dnorm(x, -2, 0.7) + 0.5 * S.dnorm(x, 2, 0.7), mu: 0, sd: Math.sqrt(4 + 0.49) },
    dice: { dom: [0.5, 6.5], pdf: null, mu: 3.5, sd: Math.sqrt(35 / 12) },
  };
  BookFig.add('clt', {
    height: 0.62, caption: '뒤: 모집단 모양 · 앞: 표본평균이 쌓인 블록', yaw: -0.22, pitch: 0.12,
    build(api) {
      const T = api.T, root = api.root, d = api.d;
      const W = 0.84, NB = 30, ROWS = 12, LEAN = 0.6;
      { const pl = api.base({ w: 1, d, h: 0.01 }); pl.material = api.mat('paper', { tint: 0.08, hatch: 0.15 }); root.add(pl); }
      const zF = d / 2 - 0.1, zB = zF - 0.2;
      const front = new T.Group(); front.position.z = zF; front.rotation.x = -LEAN; root.add(front);
      const back = new T.Group(); back.position.z = zB; back.rotation.x = -LEAN; root.add(back);
      const bw = W / NB, bh = 0.024;                  // block width / height on the card
      const blocks = new T.InstancedMesh(new T.BoxGeometry(bw * 0.84, bh * 0.82, 0.026), api.mat('prob', { tint: 0.85 }), NB * ROWS); blocks.count = 0; front.add(blocks);
      front.add(api.line([[-W / 2, 0.01, 0.016], [W / 2, 0.01, 0.016]], { opacity: 0.7 }));
      const popMat = api.mat('muted', { tint: 0.45, hatch: 0.9 });
      let popMesh = null, curve = null, lastLine = null, meanLab = null, sig = '', seenLen = -1, seenRef = null, ctxRef = null;
      const m4 = new T.Matrix4();
      const popLab = api.label('모집단', { size: 0.036, color: 'muted' }); popLab.position.set(-W / 2 + 0.07, 0.2, 0); back.add(popLab);
      function drawPop(kind) {
        const P = POP[kind] || POP.exp, [a, b] = P.dom, sx = W / (b - a);
        if (popMesh) { back.remove(popMesh); popMesh.traverse((o) => { o.geometry && o.geometry.dispose(); }); }
        const s = new T.Shape(); let maxD = 0; const pts = [];
        if (P.pdf) { for (let i = 0; i <= 90; i++) { const x = a + (b - a) * i / 90, y = P.pdf(x); pts.push([x, y]); maxD = Math.max(maxD, y); } }
        else { for (let k = 1; k <= 6; k++) pts.push([k - 0.4, 0], [k - 0.4, 1], [k + 0.4, 1], [k + 0.4, 0]); maxD = 1; }
        const H = 0.16 / maxD;
        s.moveTo(-W / 2, 0); pts.forEach(([x, y]) => s.lineTo(-W / 2 + (x - a) * sx, Math.min(0.2, y * H))); s.lineTo(W / 2, 0); s.closePath();
        const g = new T.ExtrudeGeometry(s, { depth: 0.024, bevelEnabled: false }); g.translate(0, 0.01, -0.012);
        popMesh = new T.Mesh(g, popMat); popMesh.castShadow = true; api.edges(popMesh, { angle: 40, opacity: 0.5 }); back.add(popMesh);
      }
      const drop = (o) => { if (!o) return null; o.parent && o.parent.remove(o); o.geometry && o.geometry.dispose(); if (o.material) { o.material.map && o.material.map.dispose(); o.material.dispose(); } return null; };
      function drawHist(p, st) {
        const kind = p.pop || 'exp', P = POP[kind] || POP.exp, [a, b] = P.dom, n = p.n || 5;
        const ms = (st && st.ms) || [];
        const counts = Array(NB).fill(0); ms.forEach((m) => { const k = Math.floor((m - a) / (b - a) * NB); if (k >= 0 && k < NB) counts[k]++; });
        const maxC = Math.max(1, ...counts); let c = 0;
        for (let k = 0; k < NB; k++) {
          const h = counts[k] ? Math.max(1, Math.round(counts[k] / maxC * ROWS)) : 0, x = -W / 2 + (k + 0.5) * bw;
          for (let j = 0; j < h; j++) { m4.makeTranslation(x, 0.01 + bh * (j + 0.5), 0); blocks.setMatrixAt(c++, m4); }
        }
        blocks.count = c; blocks.instanceMatrix.needsUpdate = true;
        curve = drop(curve); lastLine = drop(lastLine); meanLab = drop(meanLab);
        if (p.overlay !== false && ms.length) {
          const se = P.sd / Math.sqrt(n), tot = ms.length, binW = (b - a) / NB, pts = [];
          for (let i = 0; i <= 140; i++) { const x = a + (b - a) * i / 140, y = S.dnorm(x, P.mu, se) * tot * binW / maxC * ROWS * bh; pts.push([-W / 2 + (x - a) / (b - a) * W, 0.01 + Math.min(ROWS * bh * 1.25, y), 0.016]); }
          curve = api.line(pts, { color: 's2', opacity: 0.95 }); front.add(curve);
        }
        if (ms.length) {
          const m = ms[ms.length - 1], x = -W / 2 + (m - a) / (b - a) * W;
          lastLine = api.line([[x, 0.0, 0.018], [x, 0.01 + ROWS * bh * 1.1, 0.018]], { color: 'ink', opacity: 0.8 }); front.add(lastLine);
        }
        meanLab = api.label(`표본평균 ${ms.length.toLocaleString()}개 · n = ${n}`, { size: 0.034, color: 'ink', bg: 'paper' });
        meanLab.position.set(0, 0.03, zF + 0.075); root.add(meanLab);
      }
      return {
        update(p, changed, ctx) {
          ctxRef = ctx || ctxRef;
          if (sig !== (p.pop || 'exp')) { sig = p.pop || 'exp'; drawPop(sig); }
          const st = ctxRef && ctxRef.state; drawHist(p, st); seenRef = st && st.ms; seenLen = seenRef ? seenRef.length : 0;
        },
        tick() {
          const st = ctxRef && ctxRef.state; if (!st || !st.ms) return false;
          if (st.ms.length !== seenLen || st.ms !== seenRef) { seenLen = st.ms.length; seenRef = st.ms; drawHist(ctxRef.p, st); return true; }
          return false;
        },
      };
    },
  });
})();
