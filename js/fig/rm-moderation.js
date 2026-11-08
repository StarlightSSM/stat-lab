/* 조절효과 pop-up: the population model Y = 3 + b1(X−3) + b2(W−w̄) + b3(X−3)(W−w̄) as a ruled surface.
   X runs across the page, Y runs up the page, and the moderator W is height: each glass layer holds the simple
   slope of Y on X at one W level (−1SD, mean, +1SD). With b3 = 0 the lines are parallel; a nonzero b3 makes
   them fan out — seen from above you read the interaction directly, drag to see the twisted sheet between them. */
BookFig.add('rm-moderation', {
  height: 0.72, caption: '조절효과 · 층 = W 수준, 선이 부채꼴로 벌어지면 상호작용', yaw: -0.3, pitch: 0.12,
  build(api) {
    const T = api.T, root = api.root, d = api.d;
    root.add(api.base({ w: 1, d, h: 0.01 }));
    const H = d / 2 - 0.07;
    const levels = [-0.9, 0, 0.9], colors = ['s1', 'ink', 's8'], names = ['W −1SD', 'W 평균', 'W +1SD'];
    const layerY = (k) => 0.04 + k * 0.13;
    root.add(api.line([[-0.42, 0.012, H + 0.02], [0.42, 0.012, H + 0.02]], { opacity: 0.75 }));
    root.add(api.line([[-0.42, 0.012, H + 0.02], [-0.42, 0.012, -H - 0.02]], { opacity: 0.75 }));
    const a1 = api.label('X 스트레스 →', { size: 0.032, weight: 600, color: 'muted' }); a1.position.set(0.3, 0.02, H + 0.055); root.add(a1);
    const a2 = api.label('Y 소진 ↑', { size: 0.032, weight: 600, color: 'muted' }); a2.position.set(-0.42, 0.02, -H - 0.045); root.add(a2);
    levels.forEach((_, k) => { const g = new T.Mesh(new T.BoxGeometry(0.86, 0.003, 2 * H + 0.04), api.mat(colors[k] === 'ink' ? 'muted' : colors[k], { tint: 0.3, hatch: 0, opacity: 0.16 })); g.position.y = layerY(k) - 0.004; api.edges(g, { color: colors[k], opacity: 0.4 }); root.add(g); });
    const shadowLines = levels.map((_, k) => { const l = api.line([[0, 0, 0], [0, 0, 0]], { color: colors[k], opacity: 0.35 }); root.add(l); return l; });
    const tubes = [], labels = [];
    const NS = 12;
    const sheet = new T.Mesh(new T.BufferGeometry(), api.mat('rm', { tint: 0.5, hatch: 0.5, opacity: 0.42 })); root.add(sheet);
    return {
      update(p) {
        const b1 = p.b1 ?? 0.5, b2 = p.b2 ?? -0.3, b3 = p.b3 ?? -0.35;
        const f = (x, dw) => b1 * (x - 3) + b2 * dw + b3 * (x - 3) * dw;           // Y − 3 for X ∈ [0, 6]
        const X = (x) => -0.42 + (x / 6) * 0.84, Z = (y) => Math.max(-H, Math.min(H, (-y / 2.4) * H));
        levels.forEach((dw, k) => {
          const a = new T.Vector3(X(0), layerY(k), Z(f(0, dw))), b = new T.Vector3(X(6), layerY(k), Z(f(6, dw)));
          api.setLine(shadowLines[k], [[a.x, 0.012, a.z], [b.x, 0.012, b.z]]);
          if (tubes[k]) { root.remove(tubes[k]); tubes[k].geometry.dispose(); tubes[k].material.dispose(); }
          tubes[k] = new T.Mesh(new T.TubeGeometry(new T.LineCurve3(a, b), 2, 0.006, 8), api.mat(colors[k], { tint: 0.95 })); tubes[k].castShadow = true; root.add(tubes[k]);
          if (!labels[k]) { labels[k] = api.label(names[k], { size: 0.03, weight: 700, bg: 'paper', color: colors[k] }); root.add(labels[k]); }
          labels[k].position.set(b.x + 0.035, b.y + 0.02, b.z);
        });
        const pos = [], idx = [];
        for (let i = 0; i <= NS; i++) for (let j = 0; j <= NS; j++) { const x = (6 * i) / NS, t = j / NS, dw = -0.9 + 1.8 * t; pos.push(X(x), layerY(0) + (layerY(2) - layerY(0)) * t, Z(f(x, dw))); }
        for (let i = 0; i < NS; i++) for (let j = 0; j < NS; j++) { const a = i * (NS + 1) + j, b = a + NS + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
        sheet.geometry.dispose(); sheet.geometry = new T.BufferGeometry(); sheet.geometry.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); sheet.geometry.setIndex(idx); sheet.geometry.computeVertexNormals();
        api.invalidate();
      },
    };
  },
});
