/* SPSS · 탐색적 요인분석 (주성분 추출 + 베리맥스 회전) */
(function () {
  /* Varimax with Kaiser normalisation (pairwise-rotation algorithm) */
  function varimax(L) {
    const p = L.length, m = L[0].length; if (m < 2) return L.map((r) => r.slice());
    const h = L.map((r) => Math.sqrt(r.reduce((s, v) => s + v * v, 0)) || 1);
    const A = L.map((r, i) => r.map((v) => v / h[i]));
    for (let it = 0; it < 200; it++) {
      let moved = 0;
      for (let j = 0; j < m - 1; j++) for (let k = j + 1; k < m; k++) {
        let a = 0, b = 0, c = 0, d = 0;
        for (let i = 0; i < p; i++) { const u = A[i][j] ** 2 - A[i][k] ** 2, v = 2 * A[i][j] * A[i][k]; a += u; b += v; c += u * u - v * v; d += 2 * u * v; }
        const phi = Math.atan2(d - 2 * a * b / p, c - (a * a - b * b) / p) / 4;
        if (Math.abs(phi) < 1e-7) continue; moved = Math.max(moved, Math.abs(phi));
        const cs = Math.cos(phi), sn = Math.sin(phi);
        for (let i = 0; i < p; i++) { const x = A[i][j], y = A[i][k]; A[i][j] = x * cs + y * sn; A[i][k] = -x * sn + y * cs; }
      }
      if (moved < 1e-7) break;
    }
    return A.map((r, i) => r.map((v) => v * h[i]));
  }
  const NAMES = ['PU1', 'PU2', 'PU3', 'EOU1', 'EOU2', 'EOU3', 'BI1', 'BI2', 'BI3'];
  const FACT = ['지각된 유용성', '지각된 용이성', '사용의도'];

  Lab.add({
    id: 'spss-efa', subject: 'spss', order: 4,
    title: '탐색적 요인분석', en: 'Exploratory factor analysis · KMO, scree, varimax',
    summary: '설문 문항의 요인 구조를 바꾸면서 KMO, 고유값과 스크리 도표, 회전된 성분행렬이 어떻게 반응하는지 봅니다.',
    keywords: 'efa factor analysis 요인분석 kmo bartlett scree 고유값 varimax 회전 교차적재',
    controls: [
      { type: 'select', key: 'nf', label: '실제 요인 수', options: [[2, '2요인 (6문항)'], [3, '3요인 (9문항)']], value: 3 },
      { type: 'slider', key: 'load', label: '주 요인적재량 λ', min: 0.3, max: 0.9, step: 0.05, value: 0.75 },
      { type: 'slider', key: 'cross', label: '교차적재 (각 요인 3번 문항)', min: 0, max: 0.6, step: 0.05, value: 0, hint: 'PU3, EOU3, BI3이 다음 요인에도 걸칩니다.' },
      { type: 'slider', key: 'phi', label: '요인 간 상관', min: 0, max: 0.7, step: 0.05, value: 0.2 },
      { type: 'slider', key: 'n', label: '표본크기 N', min: 50, max: 800, step: 10, value: 250 },
      { type: 'select', key: 'ext', label: '추출할 요인 수', options: [['kaiser', '고유값 > 1'], ['1', '1개'], ['2', '2개'], ['3', '3개']], value: 'kaiser' },
      { type: 'button', key: 'resample', label: '새 표본 뽑기', primary: true },
    ],
    concept: `
      <p><b>분석 &gt; 차원 축소 &gt; 요인분석</b>은 여러 문항이 몇 개의 공통 요인으로 묶이는지 탐색합니다. 설문 척도를 만들거나 확인적 요인분석(CFA) 전에 구조를 살펴볼 때 씁니다.</p>
      <ul>
        <li><b>KMO와 Bartlett 검정</b> : 요인분석을 해도 되는 데이터인지 확인합니다. KMO ≥ .60(좋음 .80 이상), Bartlett 유의확률 &lt; .05이면 진행합니다.</li>
        <li><b>설명된 총분산과 스크리 도표</b> : 고유값은 각 성분이 설명하는 분산의 양(문항 몇 개 분량)입니다. Kaiser 기준은 고유값 &gt; 1인 성분만 남기고, 스크리 도표는 곡선이 꺾여 평평해지기 직전까지를 봅니다.</li>
        <li><b>회전된 성분행렬</b> : 베리맥스(직교) 회전은 각 문항이 한 요인에만 크게 걸리도록 축을 돌립니다. 보통 |적재량| ≥ .40이면 그 요인에 속한다고 보고, 두 요인에 동시에 .40 이상 걸리는 <em>교차적재</em> 문항은 삭제를 검토합니다.</li>
      </ul>
      <p>SPSS 기본값은 <b>주성분</b> 추출입니다. 엄밀한 의미의 "요인"분석을 원하면 [요인추출]에서 주축 요인추출이나 최대우도를, 요인 간 상관이 클 것으로 예상되면 사각 회전(오블리민, 프로맥스)을 고르는 편이 낫습니다. 이 실험은 SPSS 기본값(주성분 + 베리맥스)을 재현합니다.</p>`,
    formula: `KMO = ΣΣ<var>r<sub>ij</sub></var>² / (ΣΣ<var>r<sub>ij</sub></var>² + ΣΣ<var>a<sub>ij</sub></var>²) <span class="c">a: 편상관</span><br>Bartlett χ² = −[(<var>n</var>−1) − (2<var>p</var>+5)/6] · ln|<b>R</b>|, &nbsp; <var>df</var> = <var>p</var>(<var>p</var>−1)/2<br>성분적재량 = 고유벡터 × √고유값, &nbsp; 공통성 <var>h</var>² = Σ 적재량²`,
    tasks: [
      '교차적재를 0.45 이상으로 올려 보세요. 회전된 성분행렬에서 어느 문항이 두 요인에 동시에 걸리나요?',
      '주 적재량을 0.4로 낮추고 N을 80으로 줄이세요. KMO와 고유값 > 1 기준의 요인 수가 어떻게 흔들리나요?',
      "실제 요인을 3개로 두고 '추출할 요인 수'를 2개로 강제해 보세요. 두 요인이 한 성분으로 합쳐지는 모습을 확인하세요.",
      '요인 간 상관을 0.7로 올리면 첫 번째 고유값만 커지고 나머지는 1 근처로 내려갑니다. 왜 그런지 생각해 보세요.',
    ],
    tools: {
      spss: (p) => `* 메뉴: 분석 > 차원 축소 > 요인분석
*   [기술통계] KMO와 Bartlett의 구형성 검정 / [요인추출] 주성분, 스크리 도표
*   [요인회전] 베리맥스 / [옵션] 계수 출력 형식: 크기순 정렬, 작은 계수 표시 안 함 .40
FACTOR
  /VARIABLES ${NAMES.slice(0, p.nf * 3).join(' ')}
  /PRINT INITIAL KMO EXTRACTION ROTATION
  /FORMAT SORT BLANK(.40)
  /PLOT EIGEN ROTATION
  /CRITERIA ${p.ext === 'kaiser' ? 'MINEIGEN(1)' : 'FACTORS(' + p.ext + ')'} ITERATE(25)
  /EXTRACTION PC
  /ROTATION VARIMAX.`,
      r: (p) => `library(psych)
items <- df[, c(${NAMES.slice(0, p.nf * 3).map((s) => `"${s}"`).join(', ')})]
KMO(items)
cortest.bartlett(cor(items), n = nrow(items))
scree(items)                                   # 스크리 도표
pc <- principal(items, nfactors = ${p.ext === 'kaiser' ? p.nf : p.ext}, rotate = "varimax")
print(pc$loadings, cutoff = 0.40, sort = TRUE)`,
    },
    init(ctx) {
      const row = ctx.row();
      const a = ctx.box('', row), b = ctx.box('', row);
      ctx.state.scree = ctx.plot({ x: [0.5, 9.5], y: [0, 4], height: 240, xLabel: '성분 번호', yLabel: '고유값', title: '스크리 도표', xTicks: 9 }, a);
      ctx.state.lp = ctx.plot({ x: [-0.3, 1], y: [-0.3, 1], height: 240, xLabel: '성분 1', yLabel: '성분 2', title: '회전 공간의 성분 도표 (성분 1 × 2)' }, b);
      ctx.state.tbl = ctx.box('stage');
      ctx.state.seed = 5;
    },
    update(ctx, v, changed) {
      if (changed === 'resample') ctx.state.seed++;
      S.seed(ctx.state.seed);
      const k = +v.nf, p = k * 3, names = NAMES.slice(0, p);
      const Lam = Array.from({ length: p }, (_, i) => { const r = Array(k).fill(0), f = Math.floor(i / 3); r[f] = v.load; if (i % 3 === 2) r[(f + 1) % k] = v.cross; return r; });
      const Phi = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => (i === j ? 1 : v.phi)));
      const F = S.mvnorm(v.n, Phi);
      const X = F.map((f) => Lam.map((l) => { const comm = l.reduce((s, a, i) => s + l.reduce((t, b, j) => t + a * b * Phi[i][j], 0), 0); return l.reduce((s, a, i) => s + a * f[i], 0) + Math.sqrt(Math.max(0.05, 1 - comm)) * S.randn(); }));
      const cols = names.map((_, j) => X.map((r) => r[j])), R = S.corMatrix(cols);
      // KMO & Bartlett
      const Ri = S.inv(R); let r2 = 0, a2 = 0;
      for (let i = 0; i < p; i++) for (let j = 0; j < p; j++) if (i !== j) { r2 += R[i][j] ** 2; a2 += (-Ri[i][j] / Math.sqrt(Ri[i][i] * Ri[j][j])) ** 2; }
      const kmo = r2 / (r2 + a2), detR = S.det(R), bchi = -((v.n - 1) - (2 * p + 5) / 6) * Math.log(detR), bdf = p * (p - 1) / 2, bp = 1 - S.pchisq(bchi, bdf);
      // PCA
      const eg = S.eigen(R), ev = eg.values;
      const m = v.ext === 'kaiser' ? Math.max(1, ev.filter((e) => e > 1).length) : Math.min(+v.ext, p);
      const L = Array.from({ length: p }, (_, i) => Array.from({ length: m }, (_, j) => eg.vectors[i][j] * Math.sqrt(Math.max(ev[j], 0))));
      let Rot = varimax(L);
      // order factors by SS loading, make column sums positive
      const ss = Array.from({ length: m }, (_, j) => Rot.reduce((s, r) => s + r[j] ** 2, 0));
      const ord = ss.map((_, j) => j).sort((a, b) => ss[b] - ss[a]);
      Rot = Rot.map((r) => ord.map((j) => r[j]));
      for (let j = 0; j < m; j++) { const s = Rot.reduce((t, r) => t + r[j], 0); if (s < 0) Rot.forEach((r) => { r[j] = -r[j]; }); }
      const ssR = ord.map((j) => ss[j]), comm = Rot.map((r) => r.reduce((s, x) => s + x * x, 0));

      const C = Lab.C, hi = (s) => `<span class="hi">${s}</span>`, sig = (q) => S.fp(q).replace(' ', '');
      const t1 = Lab.spssTable({ title: 'KMO와 Bartlett의 검정', head: ['', '', '값'], rows: [
        ['표본 적절성의 Kaiser-Meyer-Olkin 측도', '', hi(S.apa(kmo))],
        ['Bartlett의 구형성 검정', '근사 카이제곱', S.f(bchi, 3)], ['', '자유도', bdf], ['', '유의확률', hi(sig(bp))]] });
      let cum = 0, cumR = 0;
      const vrows = ev.map((e, j) => { cum += e / p * 100; const r = [String(j + 1), j < m ? hi(S.f(e, 3)) : S.f(e, 3), S.f(e / p * 100, 3), S.f(cum, 3)];
        if (j < m) { cumR += ssR[j] / p * 100; r.push(S.f(ssR[j], 3), S.f(ssR[j] / p * 100, 3), j === m - 1 ? hi(S.f(cumR, 3)) : S.f(cumR, 3)); } else r.push('', '', ''); return r; });
      const t2 = Lab.spssTable({ title: '설명된 총분산', head: ['성분', '초기 고유값<br>합계', '% 분산', '누적 %', '회전 제곱합<br>합계', '% 분산', '누적 %'], rows: vrows, note: '추출 방법: 주성분 분석.' });
      // rotated matrix sorted (SPSS: SORT)
      const prim = Rot.map((r) => { let b = 0; r.forEach((x, j) => { if (Math.abs(x) > Math.abs(r[b])) b = j; }); return b; });
      const idx = names.map((_, i) => i).sort((a, b) => prim[a] - prim[b] || Math.abs(Rot[b][prim[b]]) - Math.abs(Rot[a][prim[a]]));
      const crossItems = [];
      const mrows = idx.map((i) => { const big = Rot[i].filter((x) => Math.abs(x) >= 0.4).length; if (big > 1) crossItems.push(names[i]);
        return [big > 1 ? `<span class="hi" style="color:var(--bad)">${names[i]}</span>` : names[i], ...Rot[i].map((x) => (Math.abs(x) < 0.4 ? '' : big > 1 ? hi(S.apa(x)) : S.apa(x))), S.apa(comm[i])]; });
      const t3 = Lab.spssTable({ title: '회전된 성분행렬', head: ['', ...Array.from({ length: m }, (_, j) => `성분 ${j + 1}`), '공통성'], rows: mrows,
        note: `추출 방법: 주성분 분석. 회전 방법: Kaiser 정규화가 있는 베리맥스. |적재량| < .40 표시 안 함. ${crossItems.length ? `<b>교차적재: ${crossItems.join(', ')}</b>` : ''}` });
      ctx.state.tbl.innerHTML = t1 + t2 + t3;

      // scree
      const sp = ctx.state.scree; sp.setX([0.5, p + 0.5]); sp.setY([0, Math.max(3, ev[0] * 1.15)]); sp.clear();
      sp.hline(1, { color: C.bad, dash: true, label: 'Kaiser 기준 고유값 = 1' });
      sp.line(ev.map((e, j) => [j + 1, e]), { color: C.s4 });
      sp.dots(ev.map((e, j) => ({ x: j + 1, y: e, color: j < m ? C.s4 : C.muted })), { r: 5, opacity: 1, tip: (d) => `성분 ${d.x}<br>고유값 ${S.f(d.y, 3)}<br>분산 ${S.f(d.y / p * 100, 1)}%` });
      // loading plot
      const lp = ctx.state.lp; lp.clear();
      const has2 = m >= 2, minv = Math.min(-0.3, ...Rot.map((r) => Math.min(r[0], has2 ? r[1] : 0))) - 0.05; lp.setX([minv, 1]); lp.setY([minv, 1]);
      lp.hline(0, { color: C.line, width: 1 }); lp.vline(0, { color: C.line, width: 1 });
      const fc = [C.s1, C.s2, C.s3];
      lp.dots(Rot.map((r, i) => ({ x: r[0], y: has2 ? r[1] : 0, color: fc[Math.floor(i / 3)], name: names[i] })), { r: 5, opacity: 1, tip: (d) => `<b>${d.name}</b> (${FACT[NAMES.indexOf(d.name) / 3 | 0]})<br>성분1 ${S.f(d.x, 2)} · 성분2 ${S.f(d.y, 2)}` });
      const placed = []; Rot.forEach((r, i) => { const x = r[0], y = has2 ? r[1] : 0; if (placed.some(([u, w]) => Math.hypot(u - x, w - y) < 0.09)) return; placed.push([x, y]); lp.text(x, y, names[i], { dx: 7, dy: -6, anchor: 'start', size: 10 }); });
      lp.legend(FACT.slice(0, k).map((f, j) => ({ label: f + ' 문항', color: fc[j], type: 'dot' })));

      const varPct = S.sum(ssR) / p;
      ctx.readout([
        { label: 'KMO', value: S.apa(kmo), tone: kmo >= 0.8 ? 'good' : kmo >= 0.6 ? null : 'bad', sub: kmo >= 0.8 ? '좋음' : kmo >= 0.6 ? '보통' : '부적합' },
        { label: 'Bartlett 유의확률', value: S.fp(bp), tone: bp < 0.05 ? 'good' : 'bad' },
        { label: '추출된 요인 수', value: `${m}개`, sub: `실제 ${k}개`, tone: m === k ? 'good' : 'warn' },
        { label: '누적 설명분산', value: S.pct(varPct, 1) },
        { label: '교차적재 문항', value: `${crossItems.length}개`, tone: crossItems.length ? 'bad' : null },
      ]);
      let msg;
      if (kmo < 0.6) msg = `KMO가 ${S.apa(kmo)}로 .60보다 낮습니다. 문항 간 공통 분산이 부족해 요인분석에 적합하지 않은 데이터입니다.`;
      else if (crossItems.length) msg = `${crossItems.join(', ')} 문항이 두 성분에 .40 이상 걸립니다. 어느 요인을 재는 문항인지 분명하지 않으므로 문항을 고치거나 삭제한 뒤 다시 분석하는 것이 일반적입니다.`;
      else if (m !== k) msg = `실제로는 ${k}개 요인인데 ${m}개가 추출되었습니다. ${m < k ? '요인 간 상관이 높거나 적재량이 낮으면 요인이 합쳐져 보입니다.' : '표본이 작으면 고유값이 1을 살짝 넘는 가짜 성분이 생깁니다.'} 스크리 도표의 꺾이는 지점도 함께 보세요.`;
      else msg = `${m}개 성분이 전체 분산의 ${S.pct(varPct, 1)}를 설명하고, 모든 문항이 설계한 요인에 깔끔하게 묶였습니다(단순구조).`;
      ctx.insight(msg);
    },
  });
})();
