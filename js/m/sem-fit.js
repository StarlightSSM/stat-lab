/* sem-fit — population ML fit of a misspecified 2-factor CFA → χ², RMSEA, CFI, TLI, SRMR across N */
(function () {
  const P = 6, PHI = 0.3;
  const fac = [0, 0, 0, 1, 1, 1];

  function trueSigma(lam, type, delta) {
    const L = fac.map((f) => (f === 0 ? [lam, 0] : [0, lam]));
    let d = delta;
    if (type === 'cross') { // F1 → x4 cross-loading, keep residual variance ≥ .10
      const dmax = -lam * PHI + Math.sqrt((lam * PHI) ** 2 - (lam * lam - 0.9));
      d = Math.min(delta, dmax); L[3][0] = d;
    }
    const Ph = [[1, PHI], [PHI, 1]];
    const C = S.mmul(S.mmul(L, Ph), S.T(L));
    const Sg = C.map((r, i) => r.map((v, j) => (i === j ? 1 : v)));
    if (type === 'ecov') { const th = 1 - lam * lam; d = Math.min(delta, 0.9 * th); Sg[0][1] += d; Sg[1][0] += d; }
    return { Sg, dUsed: type === 'none' ? 0 : d };
  }
  function implied(th) {
    const L = fac.map((f, i) => (f === 0 ? [th[i], 0] : [0, th[i]]));
    const C = S.mmul(S.mmul(L, [[1, th[6]], [th[6], 1]]), S.T(L));
    for (let i = 0; i < P; i++) C[i][i] += th[7 + i];
    return { Sig: C, L };
  }
  function fml(th, Smat, ldS) {
    const { Sig } = implied(th), inv = S.inv(Sig), dt = S.det(Sig);
    if (!inv || dt <= 0) return Infinity;
    let tr = 0; for (let i = 0; i < P; i++) for (let j = 0; j < P; j++) tr += Smat[i][j] * inv[j][i];
    return Math.log(dt) + tr - ldS - P;
  }
  function grad(th, Smat) {
    const { Sig, L } = implied(th), inv = S.inv(Sig);
    const D = Sig.map((r, i) => r.map((v, j) => v - Smat[i][j]));
    const W = S.mmul(S.mmul(inv, D), inv);
    const WLP = S.mmul(S.mmul(W, L), [[1, th[6]], [th[6], 1]]);
    const LWL = S.mmul(S.mmul(S.T(L), W), L);
    const g = [];
    for (let i = 0; i < P; i++) g.push(2 * WLP[i][fac[i]]);
    g.push(2 * LWL[0][1]);
    for (let i = 0; i < P; i++) g.push(W[i][i]);
    return g;
  }
  /* Newton iterations with finite-difference Hessian of the analytic gradient + backtracking */
  function fit(Smat, start) {
    const ldS = Math.log(S.det(Smat));
    let th = start.slice(), f = fml(th, Smat, ldS);
    for (let it = 0; it < 40; it++) {
      const g = grad(th, Smat), n = th.length, h = 1e-5;
      const H = [];
      for (let j = 0; j < n; j++) { const t2 = th.slice(); t2[j] += h; const g2 = grad(t2, Smat); H.push(g2.map((v, i) => (v - g[i]) / h)); }
      for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) { const a = (H[i][j] + H[j][i]) / 2; H[i][j] = H[j][i] = a; }
      for (let i = 0; i < n; i++) H[i][i] += 1e-8;
      const Hi = S.inv(H); let step = Hi ? S.mvec(Hi, g) : g;
      if (S.sum(step.map((s, i) => s * g[i])) <= 0) step = g; // not a descent direction → gradient
      let a = 1, nt, nf;
      for (let k = 0; k < 30; k++) { nt = th.map((v, i) => v - a * step[i]); for (let i = 7; i < 13; i++) nt[i] = Math.max(0.005, nt[i]); nf = fml(nt, Smat, ldS); if (nf <= f) break; a /= 2; }
      if (!(nf <= f)) break;
      const done = f - nf < 1e-12; th = nt; f = nf; if (done) break;
    }
    return { th, F: Math.max(0, f), Sig: implied(th).Sig };
  }
  function srmr(Smat, Sig) {
    let s = 0, c = 0;
    for (let i = 0; i < P; i++) for (let j = 0; j <= i; j++) { const r = Smat[i][j] / Math.sqrt(Smat[i][i] * Smat[j][j]) - Sig[i][j] / Math.sqrt(Sig[i][i] * Sig[j][j]); s += r * r; c++; }
    return Math.sqrt(s / c);
  }

  const DF = 8, DFB = 15;
  const nN = (v) => { const e = Math.floor(v) - 1; return Math.round(10 ** v / 10 ** e) * 10 ** e; };
  function indices(F0, Fb, N) {
    const lam = (N - 1) * F0, lamB = (N - 1) * Fb, chi = DF + lam, chiB = DFB + lamB;
    const p = 1 - S.pchisq(chi, DF), rmsea = Math.sqrt(Math.max(0, lam) / (DF * (N - 1)));
    const sdl = Math.sqrt(2 * (DF + 2 * lam)), lo = Math.max(0, lam - 1.645 * sdl), hi = lam + 1.645 * sdl;
    const cfi = 1 - Math.max(lam, 0) / Math.max(lamB, lam, 1e-12);
    const tli = (chiB / DFB - chi / DF) / (chiB / DFB - 1);
    return { chi, p, rmsea, rLo: Math.sqrt(lo / (DF * (N - 1))), rHi: Math.sqrt(hi / (DF * (N - 1))), cfi, tli: Math.min(1.05, tli), chiB };
  }

  const names = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6'];
  Lab.add({
    id: 'sem-fit', subject: 'sem', order: 4,
    title: '모형 적합도 지수', en: 'Model fit · χ², RMSEA, CFI, TLI, SRMR',
    summary: '참모형에 있는 교차적재나 오차공분산을 빼먹은 모형을 추정하고, 오류의 크기와 표본크기 N에 따라 χ²·RMSEA·CFI·SRMR이 어떻게 반응하는지 비교합니다.',
    keywords: 'fit index 적합도 chi-square rmsea cfi tli srmr hu bentler',
    controls: [
      { type: 'select', key: 'type', label: '빠뜨린 모수 (설정오류)', options: [['none', '없음 (정확한 모형)'], ['cross', '교차적재 F1→x4'], ['ecov', '오차공분산 e1↔e2']], value: 'cross' },
      { type: 'slider', key: 'delta', label: '빠뜨린 모수의 크기 δ', min: 0, max: 0.4, step: 0.01, value: 0.2 },
      { type: 'slider', key: 'logN', label: '표본크기 N', min: 1.7, max: 3.7, step: 0.05, value: 2.3, fmt: (v) => S.comma(nN(v)) },
      { type: 'slider', key: 'lam', label: '요인적재량 λ (측정의 질)', min: 0.4, max: 0.9, step: 0.01, value: 0.7 },
    ],
    concept: `
      <p>적합도는 모형이 함축하는 공분산행렬 Σ(θ̂)가 실제 공분산행렬 S를 얼마나 잘 재현하는지를 요약합니다. 여기서는 요인 2개·지표 6개 모형(df = 8)을 추정하되, 참모형에 있는 모수 하나를 일부러 빠뜨렸습니다.</p>
      <ul>
        <li><b>χ² 검정</b>: H₀는 "모형이 정확히 맞다". χ² = (N−1)·F<sub>min</sub>이라 <em>N이 커지면 사소한 오류도 기각</em>됩니다.</li>
        <li><b>RMSEA</b>: 자유도 하나당 오차의 크기. N에 거의 영향받지 않습니다. ≤ .06 좋음, ≤ .08 수용, ≥ .10 나쁨.</li>
        <li><b>CFI · TLI</b>: 아무 관계도 없다고 보는 독립모형과 비교한 개선 정도. ≥ .95 좋음(Hu &amp; Bentler, 1999), ≥ .90 수용.</li>
        <li><b>SRMR</b>: 표준화 잔차 상관의 평균 크기. ≤ .08 좋음.</li>
      </ul>
      <p>계산 방식: 참모형의 공분산행렬에 틀린 모형을 실제 ML로 적합해 모집단 불일치 F₀를 구한 뒤, χ²는 기댓값 df + (N−1)F₀로 표시했습니다. 따라서 표본마다 생기는 무작위 변동은 빠져 있고, RMSEA 90% 구간은 비중심 χ²의 <em>정규근사</em>입니다. 실제 분석의 수치와는 조금 다를 수 있습니다.</p>
      <p>적합도 지수는 측정의 질과도 얽혀 있습니다. 적재량이 높을수록 같은 크기의 오류도 RMSEA에서는 더 크게 드러나고(신뢰도 역설), CFI는 독립모형이 나빠지는 만큼 좋아 보일 수 있습니다.</p>`,
    formula: `χ² = (<var>N</var>−1)·F<sub>ML</sub>, &nbsp; F<sub>ML</sub> = ln|Σ(θ)| + tr(SΣ(θ)⁻¹) − ln|S| − <var>p</var><br>
      RMSEA = √[ max(χ² − df, 0) / (df·(<var>N</var>−1)) ]<br>
      CFI = 1 − max(χ² − df, 0) / max(χ²<sub>b</sub> − df<sub>b</sub>, χ² − df, 0)<br>
      TLI = (χ²<sub>b</sub>/df<sub>b</sub> − χ²/df) / (χ²<sub>b</sub>/df<sub>b</sub> − 1)`,
    tasks: [
      '설정오류를 "없음"으로 두고 N을 5,000까지 올려 보세요. χ²의 p값이 그대로인 이유는?',
      '교차적재 δ = 0.15에서 N을 100 → 5,000으로 바꾸며 χ² p값이 .05 아래로 떨어지는 N을 찾으세요. 그때 RMSEA와 CFI는 어떻게 변했나요?',
      'δ = 0.3으로 두고 λ를 0.5와 0.9로 바꿔 보세요. RMSEA와 CFI 중 어느 쪽이 "더 나빠 보이는지" 비교하세요.',
      '오차공분산 유형(δ = 0.3)에서 가장 큰 잔차 상관이 x1–x2가 아닐 수 있습니다. ML이 빠뜨린 공분산을 x1, x2의 적재량을 키워 흡수하기 때문인데, 이것이 잔차보다 수정지수를 보는 이유입니다. 확인해 보세요.',
    ],
    tools: {
      amos: (p) => `[AMOS]
Analysis Properties > Output 탭:
  ☑ Standardized estimates  ☑ Modification indices (Threshold 4)
Calculate Estimates 후 Text Output > Model Fit:
  CMIN      → χ² = CMIN, DF, P, CMIN/DF
  RMR, GFI  → (SRMR은 Plugins > Standardized RMR 로 따로 계산)
  Baseline Comparisons → CFI, TLI
  RMSEA     → RMSEA, LO 90, HI 90, PCLOSE

현재 설정: ${p.type === 'none' ? '정확한 모형' : p.type === 'cross' ? '교차적재 F1→x4 누락' : '오차공분산 e1↔e2 누락'}, δ = ${p.delta}, N = ${nN(p.logN)}`,
      lavaan: (p) => `library(lavaan)
model <- '
  F1 =~ x1 + x2 + x3
  F2 =~ x4 + x5 + x6
'
fit <- cfa(model, data = df)        # N = ${nN(p.logN)}
fitMeasures(fit, c("chisq", "df", "pvalue", "cfi", "tli",
                   "rmsea", "rmsea.ci.lower", "rmsea.ci.upper", "srmr"))
modindices(fit, sort. = TRUE, maximum.number = 5)
# 누락된 모수 추가: ${p.type === 'ecov' ? "x1 ~~ x2" : "F1 =~ x4 (교차적재)"}`,
    },
    init(ctx) {
      ctx.state.curve = ctx.plot({ x: [50, 5000], xLog: true, y: [0, 1], height: 290, xLabel: '표본크기 N (로그 눈금)', yLabel: '지수 값', xFmt: (d) => ([50, 100, 200, 500, 1000, 2000, 5000].includes(d) ? S.comma(d) : '') });
      ctx.state.tbl = ctx.box(''); ctx.state.tbl.style.minWidth = '0';
      ctx.state.cache = {};
    },
    update(ctx, v) {
      const N = nN(v.logN), C = Lab.C;
      const key = [v.type, v.delta, v.lam].join('|');
      let res = ctx.state.cache[key];
      if (!res) {
        const { Sg, dUsed } = trueSigma(v.lam, v.type, v.delta);
        const start = [...Array(6).fill(v.lam), PHI, ...Array(6).fill(1 - v.lam * v.lam)];
        const f = fit(Sg, start);
        const Fb = -Math.log(S.det(Sg));
        // largest standardized residual
        let best = { r: 0, i: 0, j: 1 };
        for (let i = 0; i < P; i++) for (let j = 0; j < i; j++) { const r = Sg[i][j] - f.Sig[i][j] / Math.sqrt(f.Sig[i][i] * f.Sig[j][j]); if (Math.abs(r) > Math.abs(best.r)) best = { r, i, j }; }
        res = { F0: f.F, Fb, srmr: srmr(Sg, f.Sig), th: f.th, dUsed, best };
        ctx.state.cache[key] = res;
      }
      const ix = indices(res.F0, res.Fb, N);

      // ---- curves over N ----
      const pl = ctx.state.curve.clear();
      const Ns = S.linspace(Math.log10(50), Math.log10(5000), 120).map((x) => 10 ** x);
      const pts = Ns.map((n) => [n, indices(res.F0, res.Fb, n)]);
      pl.rect(50, 5000, 0.9, 0.95, { color: C.s3, opacity: 0.06 }); pl.rect(50, 5000, 0.95, 1, { color: C.s3, opacity: 0.12 });
      pl.rect(50, 5000, 0, 0.06, { color: C.s2, opacity: 0.1 });
      pl.hline(0.05, { color: C.s1, width: 1, dash: '2 3' });
      pl.line(pts.map(([n, r]) => [n, r.rHi]), { color: C.s2, width: 1.2, dash: true });
      pl.line(pts.map(([n, r]) => [n, r.rLo]), { color: C.s2, width: 1.2, dash: true });
      pl.line(pts.map(([n, r]) => [n, r.p]), { color: C.s1 });
      pl.line(pts.map(([n, r]) => [n, r.cfi]), { color: C.s3 });
      pl.line(pts.map(([n, r]) => [n, r.rmsea]), { color: C.s2 });
      pl.vline(N, { color: C.ink, width: 1, label: 'N = ' + S.comma(N), anchor: N > 1500 ? 'end' : 'start', labelY: 0.5 * pl.ih });
      pl.dots([[N, ix.p], [N, ix.cfi], [N, ix.rmsea]].map(([x, y], i) => ({ x, y, color: [C.s1, C.s3, C.s2][i] })), { r: 5, tip: (d) => [`χ² p = ${S.fp(ix.p)}`, `CFI = ${S.apa(ix.cfi)}`, `RMSEA = ${S.apa(ix.rmsea)}`][d.i] });
      pl.legend([{ label: 'χ² 검정 p값', color: C.s1, type: 'line' }, { label: 'CFI (음영: ≥ .90 / ≥ .95)', color: C.s3, type: 'line' }, { label: 'RMSEA (음영: ≤ .06)', color: C.s2, type: 'line' }, { label: 'RMSEA 90% 구간', color: C.s2, type: 'dash' }]);

      // ---- AMOS-style fit summary ----
      const v_ = (ok, warn) => (ok ? '좋음' : warn ? '수용' : '<b>나쁨</b>');
      const rows = [
        ['CMIN (χ²)', S.f(ix.chi, 2), `df = ${DF}, p ${ix.p < 0.001 ? '< .001' : '= ' + S.apa(ix.p)}`, 'p > .05', ix.p > 0.05 ? '좋음' : '<b>기각</b>'],
        ['CMIN/DF', S.f(ix.chi / DF, 2), '', '≤ 3', v_(ix.chi / DF <= 2, ix.chi / DF <= 3)],
        ['RMSEA', S.apa(ix.rmsea), `90% CI [${S.apa(ix.rLo)}, ${S.apa(ix.rHi)}]`, '≤ .06', v_(ix.rmsea <= 0.06, ix.rmsea <= 0.08)],
        ['CFI', S.apa(ix.cfi), '', '≥ .95', v_(ix.cfi >= 0.95, ix.cfi >= 0.9)],
        ['TLI', S.apa(ix.tli), '', '≥ .95', v_(ix.tli >= 0.95, ix.tli >= 0.9)],
        ['SRMR', S.apa(res.srmr), 'N과 무관 (모집단 값)', '≤ .08', v_(res.srmr <= 0.08, res.srmr <= 0.1)],
      ];
      ctx.state.tbl.innerHTML = Lab.spssTable({ title: 'Model Fit Summary', sub: `Default model · N = ${S.comma(N)} · 독립모형 χ²<sub>b</sub>(15) = ${S.f(ix.chiB, 1)}`, head: ['지수', '값', '비고', '기준 (Hu & Bentler)', '판정'], rows });

      ctx.readout([
        { label: 'χ²(8) p값', value: S.fp(ix.p), sub: `χ² = ${S.f(ix.chi, 1)}`, tone: ix.p > 0.05 ? 'good' : 'bad' },
        { label: 'RMSEA', value: S.apa(ix.rmsea), sub: `[${S.apa(ix.rLo)}, ${S.apa(ix.rHi)}]`, tone: ix.rmsea <= 0.06 ? 'good' : ix.rmsea <= 0.08 ? 'warn' : 'bad' },
        { label: 'CFI / TLI', value: `${S.apa(ix.cfi)} / ${S.apa(ix.tli)}`, tone: ix.cfi >= 0.95 ? 'good' : ix.cfi >= 0.9 ? 'warn' : 'bad' },
        { label: 'SRMR', value: S.apa(res.srmr), tone: res.srmr <= 0.08 ? 'good' : 'bad' },
      ]);
      let msg;
      const pair = `${names[res.best.j]}–${names[res.best.i]}`;
      if (v.type === 'none' || res.dUsed < 0.005) msg = '모형이 정확하므로 F₀ = 0입니다. N이 아무리 커도 χ²의 기댓값은 df(8)이고, RMSEA = 0, CFI = 1입니다.';
      else if (ix.p < 0.05 && ix.rmsea <= 0.06 && ix.cfi >= 0.95) msg = `N = ${S.comma(N)}에서는 χ² 검정이 모형을 기각하지만 RMSEA(${S.apa(ix.rmsea)})와 CFI(${S.apa(ix.cfi)})는 좋은 적합 기준을 통과합니다. 큰 표본에서 χ²만으로 판단하지 않는 이유입니다.`;
      else if (ix.p > 0.05 && (ix.rmsea > 0.06 || ix.cfi < 0.95)) msg = `오류가 꽤 크지만 N이 작아 χ² 검정력이 부족해 모형이 기각되지 않습니다. RMSEA 구간 상한(${S.apa(ix.rHi)})이 넓다는 점도 함께 보세요.`;
      else if (ix.p > 0.05) msg = `오류가 작고 N도 크지 않아 모든 지수가 양호합니다. 하지만 참모형과는 다른 모형입니다.`;
      else msg = `오류가 커서 χ², RMSEA(${S.apa(ix.rmsea)}), CFI(${S.apa(ix.cfi)})가 모두 나쁜 적합을 가리킵니다.`;
      if (v.type !== 'none' && res.dUsed >= 0.005) msg += ` 가장 큰 잔차 상관은 ${pair} (${S.f(res.best.r, 3)})입니다. ML은 빠뜨린 모수를 다른 적재량으로 흡수하므로 잔차가 꼭 그 자리에 생기지는 않지만, 수정지수(MI)는 대개 빠뜨린 ${v.type === 'ecov' ? 'e1↔e2' : 'F1→x4'}를 가장 크게 가리킵니다.`;
      if (v.type !== 'none' && res.dUsed < v.delta - 0.005) msg += ` (분산이 1을 넘지 않도록 δ를 ${S.f(res.dUsed, 2)}로 제한했습니다.)`;
      ctx.insight(msg);
    },
  });
})();
