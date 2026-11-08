/* sem-bootstrap — bootstrap distribution of the indirect effect a×b vs Sobel normal approximation */
(function () {
  function makeData(n, a, b, seed) {
    S.seed(seed);
    const X = new Float64Array(n), M = new Float64Array(n), Y = new Float64Array(n), cp = 0.1;
    const vm = Math.max(0.05, 1 - a * a), vy = Math.max(0.05, 1 - (cp * cp + b * b + 2 * cp * b * a));
    for (let i = 0; i < n; i++) { X[i] = S.randn(); M[i] = a * X[i] + Math.sqrt(vm) * S.randn(); Y[i] = cp * X[i] + b * M[i] + Math.sqrt(vy) * S.randn(); }
    return { X, M, Y, n };
  }
  // a (M~X) and b (Y~X+M) from index list, via centred sums
  function abFrom(d, idx) {
    const n = idx.length; let sx = 0, sm = 0, sy = 0, xx = 0, mm = 0, xm = 0, xy = 0, my = 0;
    for (let k = 0; k < n; k++) { const i = idx[k], x = d.X[i], m = d.M[i], y = d.Y[i]; sx += x; sm += m; sy += y; xx += x * x; mm += m * m; xm += x * m; xy += x * y; my += m * y; }
    const cxx = xx - sx * sx / n, cmm = mm - sm * sm / n, cxm = xm - sx * sm / n, cxy = xy - sx * sy / n, cmy = my - sm * sy / n;
    const a = cxm / cxx, b = (cxx * cmy - cxm * cxy) / (cxx * cmm - cxm * cxm);
    return [a, b];
  }

  Lab.add({
    id: 'sem-bootstrap', subject: 'sem', order: 5,
    title: '간접효과 부트스트랩', en: 'Bootstrapping the indirect effect · percentile & bias-corrected CI vs Sobel',
    summary: '표본을 복원추출로 수천 번 다시 뽑아 a×b의 분포를 직접 쌓아 보고, 정규분포를 가정하는 Sobel 검정과 부트스트랩 신뢰구간이 언제 다른 결론을 내는지 확인합니다.',
    keywords: 'bootstrap 부트스트랩 간접효과 sobel 매개 bias-corrected percentile',
    controls: [
      { type: 'slider', key: 'a', label: '경로 a (X → M)', min: -0.6, max: 0.6, step: 0.02, value: 0.24 },
      { type: 'slider', key: 'b', label: '경로 b (M → Y)', min: -0.6, max: 0.6, step: 0.02, value: 0.26 },
      { type: 'slider', key: 'n', label: '표본크기 n', min: 20, max: 500, step: 10, value: 80 },
      { type: 'select', key: 'B', label: '부트스트랩 반복 수 B', options: [[500, '500'], [1000, '1,000'], [2000, '2,000'], [5000, '5,000']], value: 2000 },
      { type: 'button', key: 'rerun', label: '부트스트랩 다시 실행', primary: true },
      { type: 'button', key: 'newdata', label: '새 표본 뽑기' },
    ],
    concept: `
      <p>매개모형의 간접효과는 두 계수의 곱 <b>a×b</b>입니다. a와 b가 각각 정규분포를 따라도 그 곱은 정규분포가 아닙니다. 특히 효과가 작고 표본이 작을수록 <em>한쪽으로 치우친(비대칭) 분포</em>가 됩니다.</p>
      <p><b>Sobel 검정</b>은 a×b가 정규분포라고 가정하고 표준오차 √(b²SE<sub>a</sub>² + a²SE<sub>b</sub>²)로 z를 계산합니다. 분포가 비대칭이면 구간이 틀어지고 검정력이 낮아집니다.</p>
      <p><b>부트스트랩</b>은 가지고 있는 표본에서 n개를 복원추출해 a×b를 다시 계산하는 과정을 B번 반복해 분포를 경험적으로 만듭니다.</p>
      <ul>
        <li><b>백분위(percentile) 구간</b>: 부트스트랩 값의 2.5%와 97.5% 지점</li>
        <li><b>편향수정(bias-corrected) 구간</b>: 원 추정치보다 작은 부트스트랩 값의 비율로 치우침 z₀를 구해 백분위 위치를 옮긴 구간. AMOS의 "Bias-corrected confidence intervals"가 이것입니다.</li>
      </ul>
      <p>구간이 0을 포함하지 않으면 간접효과가 유의하다고 판단합니다. 이 시뮬레이션의 직접효과 c′는 0.1로 고정했습니다.</p>`,
    formula: `Sobel: <var>z</var> = <var>ab</var> / √(<var>b</var>²SE<sub><var>a</var></sub>² + <var>a</var>²SE<sub><var>b</var></sub>²)<br>
      백분위 CI = [ θ*<sub>(.025)</sub>, θ*<sub>(.975)</sub> ]<br>
      BC: <var>z</var>₀ = Φ⁻¹( #{θ* &lt; θ̂} / B ), &nbsp; 하한 = Φ(2<var>z</var>₀ − 1.96), 상한 = Φ(2<var>z</var>₀ + 1.96) 분위`,
    tasks: [
      'a = 0.24, b = 0.26, n = 80에서 Sobel p값과 부트스트랩 구간을 비교하세요. 두 방법의 결론이 다른가요?',
      'n을 400으로 올려 보세요. 부트스트랩 분포의 왜도가 줄고 Sobel 곡선과 히스토그램이 겹치는지 확인하세요.',
      'a = 0으로 두면 간접효과의 참값은 0입니다. "새 표본 뽑기"를 여러 번 눌러 구간이 0을 포함하는 비율을 대략 세어 보세요.',
      'B를 500과 5,000으로 바꿔 "다시 실행"을 반복하세요. 구간 끝점이 흔들리는 정도가 어떻게 달라지나요?',
    ],
    tools: {
      amos: (p) => `[AMOS]
1. X → M → Y, X → Y 경로도를 그리고 M, Y에 오차항 추가
2. Analysis Properties > Bootstrap 탭
   ☑ Perform bootstrap   Number of bootstrap samples: ${p.B}
   ☑ Percentile confidence intervals   (90 → 95로 변경)
   ☑ Bias-corrected confidence intervals (95)
3. Output 탭: ☑ Indirect, direct & total effects
4. Text Output > Estimates > Matrices > Indirect Effects
   → 아래 "Bootstrap" 단추로 Lower / Upper bound, Two-tailed significance 확인
   (AMOS는 a×b 개별 구간을 위해 Estimand 플러그인이나 user-defined estimand가 필요할 수 있음)`,
      lavaan: (p) => `library(lavaan)
model <- '
  M ~ a*X
  Y ~ b*M + c*X
  ab := a*b
'
set.seed(1)
fit <- sem(model, data = df, se = "bootstrap", bootstrap = ${p.B})
parameterEstimates(fit, boot.ci.type = "perc")        # 백분위
parameterEstimates(fit, boot.ci.type = "bca.simple")  # 편향수정 (BC)`,
      r: (p) => `# 직접 구현한 부트스트랩
boot_ab <- replicate(${p.B}, {
  i <- sample(nrow(df), replace = TRUE); d <- df[i, ]
  a <- coef(lm(M ~ X, d))["X"]
  b <- coef(lm(Y ~ X + M, d))["M"]
  a * b
})
quantile(boot_ab, c(.025, .975))   # 백분위 구간
hist(boot_ab, breaks = 50)`,
    },
    init(ctx) {
      ctx.state.pl = ctx.plot({ x: [-0.1, 0.3], y: [0, 10], height: 320, xLabel: '간접효과 a×b', yLabel: '밀도' });
      ctx.state.seed = 7; ctx.state.bootSeed = 101;
    },
    update(ctx, v, changed) {
      const st = ctx.state;
      if (changed === 'newdata') st.seed++;
      if (changed === 'rerun') st.bootSeed++;
      st.d = makeData(v.n, v.a, v.b, st.seed);
      const n = v.n, all = Array.from({ length: n }, (_, i) => i);
      const X = Array.from(st.d.X), M = Array.from(st.d.M), Y = Array.from(st.d.Y);
      const fm = S.ols(X.map((x) => [x]), M), fy = S.ols(X.map((x, i) => [x, M[i]]), Y);
      const a = fm.b[1], b = fy.b[2], sa = fm.se[1], sb = fy.se[2], ab = a * b;
      const se = Math.sqrt(b * b * sa * sa + a * a * sb * sb), z = ab / se, pS = 2 * (1 - S.pnorm(Math.abs(z)));
      Object.assign(st, { a, b, ab, se, z, pS, boot: [], B: +v.B, idx: new Int32Array(n) });
      st.lo = Math.min(ab - 4.5 * se, -0.02); st.hi = Math.max(ab + 4.5 * se, 0.02);
      st.pl.setX([st.lo, st.hi]);
      if (st.stop) st.stop();
      S.seed(st.bootSeed);
      const draw = (k) => { for (let r = 0; r < k && st.boot.length < st.B; r++) { for (let i = 0; i < n; i++) st.idx[i] = Math.floor(S.rand() * n); const [ba, bb] = abFrom(st.d, st.idx); st.boot.push(ba * bb); } };
      if (ctx.reducedMotion || changed === 'init') { draw(st.B); render(ctx); return; }
      const chunk = Math.max(25, Math.round(st.B / 45));
      st.stop = ctx.loop(() => { draw(chunk); render(ctx); return st.boot.length < st.B; });
    },
  });

  function render(ctx) {
    const st = ctx.state, C = Lab.C, pl = st.pl, bt = st.boot, done = bt.length >= st.B;
    const bins = S.bin(bt, st.lo, st.hi, 50);
    const normPk = S.dnorm(0, 0, st.se), ymax = Math.max(normPk, S.max(bins.map((d) => d.density))) * 1.3;
    pl.setY([0, ymax]); pl.clear();
    pl.hist(bins, { value: 'density', color: C.s1, opacity: 0.55, tip: (d) => `${S.f(d.x0, 3)} ~ ${S.f(d.x1, 3)}<br>${d.n}개 (${S.pct(d.n / bt.length)})` });
    pl.line(S.linspace(st.lo, st.hi, 200).map((x) => [x, S.dnorm(x, st.ab, st.se)]), { color: C.ink2, width: 1.6, dash: true });
    pl.vline(0, { color: C.s8, width: 1.2 });
    pl.vline(st.ab, { color: C.ink, width: 1.2, y0: 0, y1: ymax * 0.7 });

    const sorted = bt.slice().sort((x, y) => x - y), q = (p) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))))];
    const perc = [q(0.025), q(0.975)];
    const below = bt.filter((x) => x < st.ab).length / Math.max(1, bt.length);
    const z0 = S.qnorm(S.clamp(below, 0.001, 0.999));
    const bc = [q(S.pnorm(2 * z0 - 1.96)), q(S.pnorm(2 * z0 + 1.96))];
    const sob = [st.ab - 1.96 * st.se, st.ab + 1.96 * st.se];
    const rows = [[perc, C.s1, '백분위'], [bc, C.s2, '편향수정'], [sob, C.ink2, 'Sobel']];
    rows.forEach(([ci, col, lab], i) => {
      const y = ymax * (0.95 - i * 0.075);
      pl.segment(ci[0], y, ci[1], y, { color: col, width: 3 });
      pl.segment(ci[0], y - ymax * 0.018, ci[0], y + ymax * 0.018, { color: col, width: 2 });
      pl.segment(ci[1], y - ymax * 0.018, ci[1], y + ymax * 0.018, { color: col, width: 2 });
      pl.text(ci[1], y, lab, { anchor: 'start', dx: 6, dy: 4 });
    });
    pl.legend([{ label: `부트스트랩 a×b (${S.comma(bt.length)} / ${S.comma(st.B)})`, color: C.s1, type: 'box' }, { label: 'Sobel 정규근사', color: C.ink2, type: 'dash' }, { label: '0 (효과 없음)', color: C.s8, type: 'line' }]);

    const has0 = (ci) => ci[0] <= 0 && ci[1] >= 0;
    const sk = bt.length > 10 ? S.skew(bt) : 0;
    const ciTxt = (ci) => `[${S.apa(ci[0], 3)}, ${S.apa(ci[1], 3)}]`;
    ctx.readout([
      { label: '간접효과 a×b', value: S.f(st.ab, 3), sub: `a = ${S.f(st.a, 2)}, b = ${S.f(st.b, 2)}` },
      { label: 'Sobel 검정', value: `p ${st.pS < 0.001 ? '< .001' : '= ' + S.apa(st.pS)}`, sub: `z = ${S.f(st.z, 2)}`, tone: st.pS < 0.05 ? 'good' : 'bad' },
      { label: '백분위 95% CI', value: ciTxt(perc), tone: has0(perc) ? 'bad' : 'good' },
      { label: '편향수정 95% CI', value: ciTxt(bc), tone: has0(bc) ? 'bad' : 'good' },
      { label: '부트스트랩 분포 왜도', value: S.f(sk, 2), sub: Math.abs(sk) > 0.3 ? '비대칭' : '거의 대칭' },
    ]);
    if (!done) { ctx.insight(`부트스트랩 표본을 쌓는 중입니다 (${S.comma(bt.length)} / ${S.comma(st.B)}).`); return; }
    const sobSig = st.pS < 0.05, bootSig = !has0(bc);
    let msg;
    if (sobSig !== bootSig) msg = `두 방법의 결론이 다릅니다. Sobel은 ${sobSig ? '유의' : '유의하지 않음'}(p = ${S.apa(st.pS)}), 편향수정 부트스트랩 구간은 0을 ${bootSig ? '포함하지 않아 유의' : '포함해 유의하지 않음'}입니다. 분포의 왜도가 ${S.f(sk, 2)}라 정규 가정이 맞지 않기 때문입니다.`;
    else if (bootSig) msg = `Sobel과 부트스트랩 모두 간접효과가 유의하다고 봅니다. 부트스트랩 구간 ${ciTxt(bc)}가 0을 포함하지 않습니다.`;
    else msg = `두 방법 모두 간접효과가 유의하지 않습니다. 부트스트랩 구간 ${ciTxt(bc)}가 0을 포함합니다.`;
    if (Math.abs(sk) > 0.3) msg += ` 히스토그램이 ${sk > 0 ? '오른쪽' : '왼쪽'}으로 꼬리가 길어 Sobel 구간(대칭)과 위치가 어긋납니다.`;
    ctx.insight(msg);
  }
})();
