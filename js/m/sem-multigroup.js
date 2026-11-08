/* sem-multigroup — path difference across two groups (critical ratio) + measurement invariance steps */
(function () {
  function groupFit(n, b, seed) {
    S.seed(seed);
    const X = [], Y = [], e = Math.sqrt(Math.max(0.05, 1 - b * b));
    for (let i = 0; i < n; i++) { const x = S.randn(); X.push(x); Y.push(b * x + e * S.randn()); }
    const f = S.ols(X.map((x) => [x]), Y);
    return { b: f.b[1], se: f.se[1], r2: f.r2 };
  }
  const LAM = 0.7, K = 4; // one factor, 4 indicators per group (illustrative measurement model)
  function invariance(nA, nB, dl, dt) {
    const R = Array.from({ length: K }, (_, i) => Array.from({ length: K }, (_, j) => (i === j ? 1 : LAM * LAM)));
    const Fb = -Math.log(S.det(R)), dfB = 2 * K * (K - 1) / 2;
    const chiB = dfB + (nA - 1 + nB - 1) * Fb;
    const lB = Math.min(0.95, LAM + dl);
    const seA = (1 - LAM * LAM) / Math.sqrt(nA), seB = (1 - lB * lB) / Math.sqrt(nB);
    const absorb = (K - 1) / K; // part of a single-item difference not absorbed by freed factor variance / mean
    const ncM = absorb * dl * dl / (seA * seA + seB * seB);
    const ncS = absorb * dt * dt / (1 / nA + 1 / nB);
    const cfi = (chi, df) => 1 - Math.max(chi - df, 0) / Math.max(chiB - dfB, chi - df, 1e-9);
    const conf = { chi: 4, df: 4 };
    const met = { chi: conf.chi + 3 + ncM, df: 7 };
    const sca = { chi: met.chi + 3 + ncS, df: 10 };
    [conf, met, sca].forEach((m) => { m.cfi = cfi(m.chi, m.df); });
    met.dchi = met.chi - conf.chi; met.p = 1 - S.pchisq(met.dchi, 3); met.dcfi = met.cfi - conf.cfi;
    sca.dchi = sca.chi - met.chi; sca.p = 1 - S.pchisq(sca.dchi, 3); sca.dcfi = sca.cfi - met.cfi;
    return { conf, met, sca, chiB };
  }

  Lab.add({
    id: 'sem-multigroup', subject: 'sem', order: 6,
    title: '다집단 분석과 측정동일성', en: 'Multi-group analysis · critical ratio for differences · measurement invariance',
    summary: '두 집단의 경로계수 차이를 임계비(C.R.)로 검정하고, 집단 간 요인적재량·절편 차이가 측정동일성 단계(형태→측정→절편)에서 어떻게 드러나는지 봅니다.',
    keywords: 'multi-group 다집단 측정동일성 invariance configural metric scalar critical ratio 조절',
    controls: [
      { type: 'heading', label: '구조 경로 X → Y' },
      { type: 'slider', key: 'bA', label: '집단 A 경로계수', min: -0.2, max: 0.8, step: 0.02, value: 0.5 },
      { type: 'slider', key: 'bB', label: '집단 B 경로계수', min: -0.2, max: 0.8, step: 0.02, value: 0.3 },
      { type: 'slider', key: 'nA', label: '집단 A 표본 nA', min: 50, max: 800, step: 10, value: 200 },
      { type: 'slider', key: 'nB', label: '집단 B 표본 nB', min: 50, max: 800, step: 10, value: 200 },
      { type: 'heading', label: '측정동일성 (요인 1개 · 지표 4개)' },
      { type: 'slider', key: 'dl', label: '문항 2 적재량 차이 Δλ', min: 0, max: 0.25, step: 0.01, value: 0.05 },
      { type: 'slider', key: 'dt', label: '문항 3 절편 차이 Δτ (SD 단위)', min: 0, max: 0.5, step: 0.01, value: 0.2 },
      { type: 'button', key: 'resample', label: '새 표본 뽑기' },
    ],
    concept: `
      <p>다집단 분석은 같은 모형을 두 집단(예: 남녀, 국가, 사용자 유형)에 동시에 적합하고, 특정 모수가 집단 간 같은지 검정합니다. 집단변수가 경로를 바꾸는지 보는 것이므로 <b>범주형 조절효과</b> 분석이기도 합니다.</p>
      <p><b>경로계수 비교</b>: AMOS의 "Critical ratios for differences"는 두 추정치의 차이를 차이의 표준오차로 나눈 z값입니다. |C.R.| &gt; 1.96이면 5% 수준에서 차이가 유의합니다. 같은 결과를 "두 경로를 같게 제약한 모형 vs 자유 모형"의 Δχ²(1)으로도 얻을 수 있습니다.</p>
      <p>경로를 비교하기 전에 <b>측정동일성</b>이 먼저 확보되어야 합니다. 측정도구가 집단마다 다르게 작동하면 경로 차이가 실제 차이인지 측정 차이인지 구별할 수 없기 때문입니다.</p>
      <ul>
        <li><b>형태 동일성(configural)</b>: 요인 구조가 같다 (기준 모형)</li>
        <li><b>측정 동일성(metric)</b>: 적재량이 같다 → 관계(경로, 상관)를 비교할 수 있음</li>
        <li><b>절편 동일성(scalar)</b>: 절편까지 같다 → 잠재평균을 비교할 수 있음</li>
      </ul>
      <p>판정은 Δχ²의 p ≥ .05 또는 ΔCFI ≥ −.01(Cheung &amp; Rensvold, 2002)을 씁니다. 이 실험의 동일성 표는 실제 다집단 적합이 아니라 차이 모수의 <em>Wald 근사</em>(차이² / 차이의 분산)로 비중심도를 계산한 기댓값이므로 실제 분석과 수치가 조금 다릅니다.</p>`,
    formula: `C.R. = (<var>b</var><sub>A</sub> − <var>b</var><sub>B</sub>) / √(SE<sub>A</sub>² + SE<sub>B</sub>²)<br>
      Δχ² = χ²<sub>제약</sub> − χ²<sub>자유</sub>, &nbsp; Δdf = 제약한 모수 수<br>
      ΔCFI = CFI<sub>제약</sub> − CFI<sub>자유</sub> &nbsp;<span class="c">(−.01보다 작게 떨어지면 동일성 기각)</span>`,
    tasks: [
      '두 집단 경로를 0.5와 0.3으로 두고 nA = nB = 100일 때 C.R.이 1.96을 넘나요? 각 집단을 400으로 늘리면 어떻게 되나요?',
      'Δλ를 0.15 이상으로 올려 측정동일성이 Δχ² 기준과 ΔCFI 기준 중 어느 쪽에서 먼저 기각되는지 보세요.',
      '표본을 각각 800으로 키우고 Δτ = 0.15로 두세요. Δχ²는 유의한데 ΔCFI는 작은 상황이 만들어지나요? 큰 표본에서 ΔCFI를 함께 보는 이유를 설명해 보세요.',
      '절편 동일성이 기각되면 어떤 비교(경로 비교, 잠재평균 비교)를 포기해야 하는지 정리해 보세요.',
    ],
    tools: {
      amos: (p) => `[AMOS 다집단 분석]
1. Analyze > Manage Groups : "Group A", "Group B" 생성
2. File > Data Files : 각 집단에 같은 파일 + 집단변수 값 지정
3. Analyze > Multiple-Group Analysis 클릭
   → Unconstrained, Measurement weights(측정 동일성),
     Measurement intercepts(절편 동일성), Structural weights ... 자동 생성
4. Analysis Properties > Output ☑ Critical ratios for differences
5. Text Output > Model Comparison : 제약 모형 간 Δχ²(CMIN), p
   Pairwise Parameter Comparisons : 경로 이름(예: b_A, b_B)의 C.R.

현재 값: 집단 A b = ${p.bA} (n=${p.nA}), 집단 B b = ${p.bB} (n=${p.nB})`,
      lavaan: (p) => `library(lavaan)
# 1) 측정동일성 단계
cfa_model <- 'F =~ x1 + x2 + x3 + x4'
configural <- cfa(cfa_model, data = df, group = "g")
metric     <- cfa(cfa_model, data = df, group = "g", group.equal = "loadings")
scalar     <- cfa(cfa_model, data = df, group = "g", group.equal = c("loadings", "intercepts"))
lavTestLRT(configural, metric, scalar)            # Δχ²
sapply(list(configural, metric, scalar), fitMeasures, "cfi")   # ΔCFI

# 2) 경로계수 비교
path_model <- '
  Y ~ c(bA, bB)*X
  diff := bA - bB
'
fit <- sem(path_model, data = df, group = "g")
parameterEstimates(fit)[parameterEstimates(fit)$label == "diff", ]`,
    },
    init(ctx) {
      ctx.state.dg = ctx.diagram({ width: 640, height: 190 });
      ctx.state.bar = ctx.plot({ xBand: ['집단 A', '집단 B'], y: [-0.3, 1], height: 220, yLabel: '경로계수 (95% CI)' });
      ctx.state.tblBox = ctx.box(''); ctx.state.tblBox.style.minWidth = '0';
      ctx.state.seed = 3;
    },
    update(ctx, v, changed) {
      const st = ctx.state, C = Lab.C;
      if (changed === 'resample') st.seed += 2;
      const A = groupFit(v.nA, v.bA, st.seed), B = groupFit(v.nB, v.bB, st.seed + 1000);
      const cr = (A.b - B.b) / Math.sqrt(A.se ** 2 + B.se ** 2), pcr = 2 * (1 - S.pnorm(Math.abs(cr)));

      const dg = st.dg.clear();
      dg.note(150, 24, `집단 A (n = ${v.nA})`); dg.note(470, 24, `집단 B (n = ${v.nB})`);
      dg.node('XA', { x: 55, y: 110, label: 'X', w: 70 }); dg.node('YA', { x: 265, y: 110, label: 'Y', w: 76, sub: `R² ${S.apa(A.r2, 2)}` }); dg.node('eA', { x: 265, y: 46, type: 'err', label: 'e1' });
      dg.node('XB', { x: 375, y: 110, label: 'X', w: 70 }); dg.node('YB', { x: 585, y: 110, label: 'Y', w: 76, sub: `R² ${S.apa(B.r2, 2)}` }); dg.node('eB', { x: 585, y: 46, type: 'err', label: 'e2' });
      dg.path('XA', 'YA', { value: A.b, label: `${S.f(A.b, 2)} (bA)` });
      dg.path('XB', 'YB', { value: B.b, label: `${S.f(B.b, 2)} (bB)` });
      dg.path('eA', 'YA', { label: '1', width: 1.1 }); dg.path('eB', 'YB', { label: '1', width: 1.1 });
      dg.note(320, 176, `C.R. for difference = ${S.f(cr, 2)} · ${Math.abs(cr) > 1.96 ? '|C.R.| > 1.96 → 집단 간 차이 유의' : '|C.R.| ≤ 1.96 → 차이 유의하지 않음'}`);

      const bp = st.bar.clear(); bp.hline(0, { color: C.ink2, width: 1 });
      bp.bars([{ x: '집단 A', y: A.b, color: C.s1, tip: () => `b = ${S.f(A.b, 3)}, SE = ${S.f(A.se, 3)}` }, { x: '집단 B', y: B.b, color: C.s2, tip: () => `b = ${S.f(B.b, 3)}, SE = ${S.f(B.se, 3)}` }], { maxW: 40 });
      [[A, '집단 A'], [B, '집단 B']].forEach(([g, x]) => {
        const lo = g.b - 1.96 * g.se, hi = g.b + 1.96 * g.se, X = bp.x(x);
        bp.g('over').append('line').attr('x1', X).attr('x2', X).attr('y1', bp.y(lo)).attr('y2', bp.y(hi)).style('stroke', C.ink).style('stroke-width', 1.6);
        [lo, hi].forEach((yv) => bp.g('over').append('line').attr('x1', X - 8).attr('x2', X + 8).attr('y1', bp.y(yv)).attr('y2', bp.y(yv)).style('stroke', C.ink).style('stroke-width', 1.6));
        bp.text(x, hi, S.f(g.b, 2), { dy: -8 });
      });

      const iv = invariance(v.nA, v.nB, v.dl, v.dt);
      const verdict = (m) => { const c1 = m.p >= 0.05, c2 = m.dcfi >= -0.01; return c1 && c2 ? '성립' : !c1 && c2 ? 'Δχ²만 기각' : c1 && !c2 ? 'ΔCFI만 기각' : '<b>기각</b>'; };
      const pf = (p) => (p < 0.001 ? '< .001' : S.apa(p));
      st.tblBox.innerHTML = Lab.spssTable({
        title: 'Model Comparison', sub: '측정동일성 단계별 비교 (Wald 근사 기댓값)',
        head: ['모형', 'χ²', 'df', 'Δχ²', 'p', 'CFI', 'ΔCFI', '판정'],
        rows: [
          ['형태 (configural)', S.f(iv.conf.chi, 1), iv.conf.df, '', '', S.apa(iv.conf.cfi), '', '기준'],
          ['측정 (metric)', S.f(iv.met.chi, 1), iv.met.df, S.f(iv.met.dchi, 1), pf(iv.met.p), S.apa(iv.met.cfi), S.f(iv.met.dcfi, 3), verdict(iv.met)],
          ['절편 (scalar)', S.f(iv.sca.chi, 1), iv.sca.df, S.f(iv.sca.dchi, 1), pf(iv.sca.p), S.apa(iv.sca.cfi), S.f(iv.sca.dcfi, 3), verdict(iv.sca)],
        ],
        note: 'Δdf = 3 (문항 4개 중 기준 문항 제외). 판정: Δχ² p ≥ .05 그리고 ΔCFI ≥ −.01',
      });

      const mOk = iv.met.p >= 0.05 || iv.met.dcfi >= -0.01, sOk = iv.sca.p >= 0.05 || iv.sca.dcfi >= -0.01;
      ctx.readout([
        { label: '집단 A / B 경로', value: `${S.f(A.b, 2)} / ${S.f(B.b, 2)}` },
        { label: '차이 C.R. (z)', value: S.f(cr, 2), sub: `p ${pcr < 0.001 ? '< .001' : '= ' + S.apa(pcr)}`, tone: Math.abs(cr) > 1.96 ? 'good' : null },
        { label: '측정동일성 ΔCFI', value: S.f(iv.met.dcfi, 3), sub: `Δχ²(3) = ${S.f(iv.met.dchi, 1)}`, tone: iv.met.dcfi >= -0.01 ? 'good' : 'bad' },
        { label: '절편동일성 ΔCFI', value: S.f(iv.sca.dcfi, 3), sub: `Δχ²(3) = ${S.f(iv.sca.dchi, 1)}`, tone: iv.sca.dcfi >= -0.01 ? 'good' : 'bad' },
      ]);
      let msg = Math.abs(cr) > 1.96
        ? `집단 A(${S.f(A.b, 2)})와 B(${S.f(B.b, 2)})의 경로 차이가 C.R. = ${S.f(cr, 2)}로 유의합니다. 집단변수가 X→Y 관계를 조절한다고 볼 수 있습니다.`
        : `경로 차이(${S.f(A.b - B.b, 2)})가 표준오차에 비해 작아 C.R. = ${S.f(cr, 2)}로 유의하지 않습니다.${Math.abs(v.bA - v.bB) >= 0.15 ? ' 모집단에서는 차이가 있으니 표본을 늘리면 검출될 수 있습니다.' : ''}`;
      if (!mOk) msg += ' 다만 측정동일성이 기각되어, 적재량이 집단마다 달라 경로 비교 자체를 신뢰하기 어렵습니다. 문제 문항을 풀어 주는 부분동일성(partial invariance)을 검토하세요.';
      else if (!sOk) msg += ' 측정동일성은 성립해 경로 비교는 가능하지만, 절편동일성이 기각되어 잠재평균은 비교할 수 없습니다.';
      else if ((iv.met.p < 0.05 && iv.met.dcfi >= -0.01) || (iv.sca.p < 0.05 && iv.sca.dcfi >= -0.01)) msg += ' 일부 단계에서 Δχ²는 유의하지만 ΔCFI는 −.01 이내라 실질적으로는 동일성이 유지된다고 봅니다. 큰 표본에서 흔한 경우입니다.';
      else msg += ' 측정·절편 동일성이 모두 성립해 경로와 잠재평균을 모두 비교할 수 있습니다.';
      ctx.insight(msg);
    },
  });
})();
