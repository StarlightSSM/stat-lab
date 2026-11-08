/* Galton board pop-up: balls bounce left/right through rows of pegs and pile up into a binomial → normal shape.
   Used on the title page (10 rows, p = .5) and in 이항분포 (rows = n up to 16, right-bounce probability = p). */
(function () {
  function galton(opts) {
    return {
      height: opts.height || 0.62, caption: opts.caption, yaw: -0.12, pitch: 0.62,
      build(api) {
        const T = api.T, root = api.root, d = api.d, rng = api.rng(7);
        const board = new T.Group(); root.add(board);
        const base = api.base({ w: 1, d, h: 0.016 }); root.add(base);
        const pegGeo = new T.CylinderGeometry(0.008, 0.008, 0.045, 10);
        const ballGeo = new T.SphereGeometry(0.016, 14, 10);
        const pegMat = api.mat('ink', { tint: 0.75 }), ballMat = api.mat(opts.color || 'marker', { tint: 0.9 }), binMat = api.mat(opts.binColor || 'prob', { tint: 0.85 });
        const MAXB = 900;
        const pile = new T.InstancedMesh(ballGeo, binMat, MAXB); pile.count = 0; root.add(pile);
        const fly = new T.InstancedMesh(ballGeo, ballMat, 60); fly.count = 0; root.add(fly);
        let pegs = null, walls = [], rows = 0, prob = 0.5, counts = [], balls = [], spawnT = 0, curve = null;
        const z0 = -d / 2 + 0.07, zBins = d / 2 - 0.30;
        let dx = 0.06, dz = 0.03;
        const m4 = new T.Matrix4();
        function layout(r, pr) {
          rows = r; prob = pr; counts = Array(rows + 1).fill(0); balls = [];
          dx = Math.min(0.065, 0.86 / (rows + 1)); dz = (zBins - z0 - 0.04) / rows;
          if (pegs) { root.remove(pegs); pegs.dispose(); }
          const nPeg = (rows * (rows + 1)) / 2; pegs = new T.InstancedMesh(pegGeo, pegMat, nPeg); let k = 0;
          for (let i = 0; i < rows; i++) for (let j = 0; j <= i; j++) { m4.makeTranslation((j - i / 2) * dx, 0.038, z0 + i * dz); pegs.setMatrixAt(k++, m4); }
          pegs.castShadow = true; root.add(pegs);
          walls.forEach((w) => root.remove(w)); walls = [];
          for (let j = 0; j <= rows + 1; j++) {
            const x = (j - (rows + 1) / 2) * dx, w = new T.Mesh(new T.BoxGeometry(0.004, 0.05, d / 2 - zBins + (d / 2 - zBins) * 0 - 0.02), api.mat('paper', { tint: 0.2, hatch: 0.5 }));
            w.position.set(x, 0.04, (zBins + d / 2 - 0.02) / 2 + 0.005); api.edges(w, { opacity: 0.55 }); w.castShadow = true; root.add(w); walls.push(w);
          }
          // seed the pile with a binomial sample so the first view is complete
          for (let i = 0; i < 160; i++) { let kk = 0; for (let t = 0; t < rows; t++) if (rng() < prob) kk++; counts[kk]++; }
          drawPile();
        }
        const cap = () => Math.max(4, Math.floor((d / 2 - zBins - 0.03) / 0.03) * 3);
        function drawPile() {
          let maxC = Math.max(1, ...counts), per = cap(), scale = maxC > per ? per / maxC : 1, n = 0;
          for (let k = 0; k <= rows; k++) {
            const h = Math.round(counts[k] * scale), x = (k - rows / 2) * dx;
            for (let s = 0; s < h && n < MAXB; s++) { const col = s % 3, layer = Math.floor(s / 3); m4.makeTranslation(x + (col - 1) * Math.min(0.012, dx * 0.2), 0.034 + (col === 1 ? 0.012 : 0), d / 2 - 0.04 - layer * 0.03); pile.setMatrixAt(n++, m4); }
          }
          pile.count = n; pile.instanceMatrix.needsUpdate = true;
          // expected-shape curve over the bins
          const tot = counts.reduce((a, b) => a + b, 0), mu = rows * prob, sd = Math.sqrt(Math.max(rows * prob * (1 - prob), 0.05)), pts = [];
          for (let i = 0; i <= 80; i++) { const kk = -0.5 + (rows + 1) * i / 80, dens = Math.exp(-((kk - mu) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI)); pts.push([(kk - rows / 2) * dx, 0.075, d / 2 - 0.04 - (tot * dens * scale / 3) * 0.03]); }
          if (!curve) { curve = api.line(pts, { color: 'ink', opacity: 0.9 }); root.add(curve); } else api.setLine(curve, pts);
        }
        function stepBalls(dt) {
          spawnT += dt; if (spawnT > 0.11 && balls.length < 55) { spawnT = 0; balls.push({ r: -1, k: 0, t: 0 }); }
          const speed = 5.5;
          balls.forEach((b) => { b.t += dt * speed; while (b.t >= 1) { b.t -= 1; b.r++; if (b.r >= 0 && b.r < rows && rng() < prob) b.k++; } });
          balls = balls.filter((b) => { if (b.r >= rows) { counts[b.k]++; const tot = counts.reduce((a, c) => a + c, 0); if (tot > 1200) counts = counts.map((c) => Math.round(c * 0.75)); return false; } return true; });
          fly.count = balls.length;
          balls.forEach((b, i) => {
            const r = Math.max(b.r, 0), prevK = b.r < 0 ? 0 : b.k, x0 = (prevK - r / 2) * dx;
            const zA = b.r < 0 ? z0 - 0.06 : z0 + r * dz, zB = z0 + (r + 1) * dz;
            const x = b.r < 0 ? 0 : x0 + (b.t) * 0 ;
            const tx = (b.k - (b.r + 1) / 2) * dx;
            const px = b.r < 0 ? 0 : x0 + (tx - x0) * b.t, pz = zA + (zB - zA) * b.t, py = 0.035 + Math.sin(Math.PI * b.t) * 0.03;
            m4.makeTranslation(b.r < 0 ? 0 : px, py, pz); fly.setMatrixAt(i, m4);
          });
          fly.instanceMatrix.needsUpdate = true;
        }
        let lastKey = '';
        const conf = (p) => opts.conf ? opts.conf(p) : { rows: 10, prob: 0.5 };
        let acc = 0;
        return {
          update(p) { const c = conf(p), key = c.rows + ':' + c.prob; if (key !== lastKey) { lastKey = key; layout(c.rows, c.prob); } },
          tick(dt) { stepBalls(dt); acc += dt; if (acc > 0.25) { acc = 0; drawPile(); } return true; },
        };
      },
    };
  }
  BookFig.add('title', galton({ caption: '갈톤 보드 · 좌우 50:50이 쌓이면 정규분포', height: 0.66 }));
  BookFig.add('dist-binomial', galton({ caption: '갈톤 보드 · 핀마다 오른쪽으로 갈 확률 = p', height: 0.62,
    conf: (p) => ({ rows: Math.max(1, Math.min(16, Math.round(p.n || 10))), prob: Math.round((p.p ?? 0.5) * 100) / 100 }) }));
})();
