/* 베이즈 정리 pop-up: 1000명을 작은 블록으로 세워 검사 결과별로 나눕니다.
   왼쪽 단상 = 양성 판정 그룹 (빨강 = 실제 환자, 회색 = 위양성), 오른쪽 바닥 = 음성 판정 그룹.
   유병률이 낮으면 양성 단상 위가 거의 회색 블록뿐이라는 것이 한눈에 보입니다. */
BookFig.add('prob-bayes', {
  height: 0.66, caption: '1000명 · 양성 판정 단상 위에서 진짜 환자는 몇 명인가', yaw: -0.3, pitch: 0.55,
  build(api) {
    const T = api.T, root = api.root, d = api.d;
    root.add(api.base({ w: 1, d, h: 0.01 }));
    const cell = 0.024, sz = 0.019;
    const geo = new T.BoxGeometry(sz, sz, sz);
    const people = new T.InstancedMesh(geo, api.mat('#ffffff', { tint: 0.92 }), 1000); root.add(people); people.setColorAt(0, new T.Color(1, 1, 1)); people.frustumCulled = false;
    // podium for the positive group
    const podW = 0.36, podD = d - 0.16;
    const podium = new T.Mesh(new T.BoxGeometry(podW + 0.03, 0.05, podD), api.mat('marker', { tint: 0.12, hatch: 0.25 }));
    podium.position.set(-0.5 + 0.04 + podW / 2, 0.035, 0); api.edges(podium, { opacity: 0.7 }); root.add(podium);
    const labPos = api.label('양성', { size: 0.045, weight: 700 }); root.add(labPos);
    const labNeg = api.label('음성', { size: 0.045, weight: 700, color: 'muted' }); root.add(labNeg);
    let labPPV = api.label(' ', { size: 0.04 }); root.add(labPPV);
    const cSick = api.color('marker'), cWell = new T.Color('#b9b2a4'), cSickNeg = api.color('marker').lerp(new T.Color('#ffffff'), 0.45), cWellNeg = new T.Color('#e4ded2');
    const m4 = new T.Matrix4();
    let ppvLabel = null;
    function setLabel(mesh, text, opts) {
      const fresh = api.label(text, opts); fresh.position.copy(mesh.position); root.remove(mesh); mesh.geometry.dispose(); mesh.material.map.dispose(); mesh.material.dispose(); root.add(fresh); return fresh;
    }
    function place(list, x0, z0, y0, cols, rowsPer) {
      // list: array of colors; fill rows front→back, then stack layers
      list.forEach((c, i) => {
        const layer = Math.floor(i / (cols * rowsPer)), j = i % (cols * rowsPer), row = Math.floor(j / cols), col = j % cols;
        m4.makeTranslation(x0 + col * cell, y0 + sz / 2 + layer * (sz + 0.004), z0 - row * cell);
        people.setMatrixAt(idx, m4); people.setColorAt(idx, c); idx++;
      });
    }
    let idx = 0;
    return {
      update(p) {
        const prev = p.prev ?? 0.01, sens = p.sens ?? 0.9, spec = p.spec ?? 0.95, two = !!p.second;
        const sick = Math.round(1000 * prev), well = 1000 - sick;
        const sPos = two ? sens * sens : sens, wPos = two ? (1 - spec) ** 2 : 1 - spec;
        const TP = Math.round(sick * sPos), FN = sick - TP, FP = Math.round(well * wPos), TN = well - FP;
        idx = 0;
        const rowsPer = Math.floor(podD / cell) - 1;
        const podCols = Math.floor(podW / cell);
        const posList = [...Array(TP).fill(cSick), ...Array(FP).fill(cWell)];
        place(posList, -0.5 + 0.04 + cell / 2 + 0.008, podD / 2 - cell / 2 - 0.01, 0.06, podCols, rowsPer);
        const negCols = Math.floor((1 - podW - 0.14) / cell);
        const negList = [...Array(FN).fill(cSickNeg), ...Array(TN).fill(cWellNeg)];
        place(negList, -0.5 + podW + 0.11, podD / 2 - cell / 2 - 0.01, 0.01, negCols, rowsPer);
        people.count = idx; people.instanceMatrix.needsUpdate = true; if (people.instanceColor) people.instanceColor.needsUpdate = true;
        const posLayers = Math.ceil(posList.length / (podCols * rowsPer));
        const usedRows = Math.max(2, Math.min(rowsPer, Math.ceil(posList.length / podCols)));
        const depth = usedRows * cell + 0.03; podium.scale.z = depth / podD; podium.position.z = podD / 2 - depth / 2;
        labPos.position.set(-0.5 + 0.04 + podW / 2, 0.1 + posLayers * 0.023, podD / 2 - depth - 0.03);
        labNeg.position.set(-0.5 + podW + 0.11 + negCols * cell / 2, 0.06 + Math.ceil(negList.length / (negCols * rowsPer)) * 0.023, -podD / 2 - 0.02);
        const ppv = TP + FP ? TP / (TP + FP) : 0;
        labPPV = setLabel(labPPV, `양성 ${TP + FP}명 중 환자 ${TP}명 (${Math.round(ppv * 100)}%)`, { size: 0.04, bg: 'paper' });
        labPPV.position.set(-0.5 + 0.04 + podW / 2 + 0.12, 0.17 + posLayers * 0.023, podD / 2 + 0.02);
      },
    };
  },
});
