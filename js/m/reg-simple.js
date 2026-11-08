/* 단순회귀분석: OLS line vs true line, residual segments, residual plot. */
Lab.add({
  id: 'reg-simple', subject: 'prob', order: 14,
  title: '단순회귀분석', en: 'Simple linear regression · OLS',
  summary: '참 회귀선(절편·기울기)과 오차의 크기를 정해 데이터를 만들고, 최소제곱 추정선이 얼마나 정확히 복원하는지 잔차와 R²로 확인합니다.',
  keywords: 'regression ols 최소제곱 잔차 결정계수 기울기 lm',
  controls: [
    { type: 'slider', key: 'b0', label: '참 절편 β₀', min: -5, max: 5, step: 0.5, value: 2 },
    { type: 'slider', key: 'b1', label: '참 기울기 β₁', min: -2, max: 2, step: 0.05, value: 0.8 },
    { type: 'slider', key: 'sigma', label: '오차 표준편차 σ', min: 0.2, max: 6, step: 0.1, value: 1.5 },
    { type: 'slider', key: 'n', label: '표본크기 n', min: 8, max: 300, step: 1, value: 40 },
    { type: 'toggle', key: 'resid', label: '잔차 선분 표시', value: true },
    { type: 'toggle', key: 'truth', label: '참 회귀선 표시', value: true },
    { type: 'button', key: 'resample', label: '새 표본 뽑기', primary: true },
  ],
  concept: `
    <p>단순회귀는 Y = β₀ + β₁X + ε 모형으로 X 한 단위 변화에 따른 Y의 평균 변화(기울기 β₁)를 추정합니다. 최소제곱법(OLS)은 <b>잔차 제곱합 Σ(y − ŷ)²을 최소로 만드는 직선</b>을 고릅니다. 그림의 주황 세로선이 잔차입니다.</p>
    <ul>
      <li><b>R²</b> = SSR / SST : Y의 전체 변동 중 회귀선이 설명하는 비율. σ가 커지면 같은 기울기라도 R²는 떨어집니다.</li>
      <li><b>추정의 표준오차(잔차 SE)</b> : 관측값이 회귀선에서 평균적으로 떨어진 거리로 σ의 추정치입니다.</li>
      <li>기울기의 t = b₁ / SE(b₁). SE(b₁)는 σ가 작을수록, n이 클수록, X가 넓게 퍼질수록 작아집니다.</li>
    </ul>
    <p>R²가 낮아도 기울기는 유의할 수 있고(큰 n), R²가 높아도 모형이 틀릴 수 있습니다(곡선 관계). 그래서 <em>잔차도</em>를 봅니다. 잔차가 0 주위에 패턴 없이 고르게 흩어져야 선형성과 등분산 가정이 맞습니다.</p>`,
  formula: `<var>b</var>₁ = Σ(<var>x</var>−<var>x̄</var>)(<var>y</var>−<var>ȳ</var>) / Σ(<var>x</var>−<var>x̄</var>)², &nbsp; <var>b</var>₀ = <var>ȳ</var> − <var>b</var>₁<var>x̄</var><br>
    SE(<var>b</var>₁) = <var>s</var> / √Σ(<var>x</var>−<var>x̄</var>)², &nbsp; <var>s</var> = √(SSE / (<var>n</var>−2))<br>
    <var>R</var>² = 1 − SSE / SST`,
  tasks: [
    'σ를 0.5에서 5로 올려 보세요. 추정 기울기 b₁은 여전히 β₁ 근처인데 R²는 어떻게 변하나요?',
    'β₁ = 0.2, σ = 4로 두고 n을 20과 300으로 비교하세요. R²는 둘 다 낮은데 p값은 어떻게 다른가요?',
    'n = 8로 줄이고 "새 표본 뽑기"를 여러 번 눌러 보세요. 추정선(실선)이 참 회귀선(점선) 주위에서 얼마나 흔들리나요?',
    '잔차도에서 점들이 0을 중심으로 띠 모양인지 확인하세요. 어떤 모양이면 선형 회귀가 부적절하다고 판단하나요?',
  ],
  tools: {
    r: (p) => `set.seed(1)
n <- ${p.n}
x <- runif(n, 0, 10)
y <- ${p.b0} + ${p.b1} * x + rnorm(n, sd = ${p.sigma})

fit <- lm(y ~ x)
summary(fit)        # 계수, SE, t, p, R², 잔차 SE
confint(fit)        # 95% CI
plot(x, y); abline(fit, col = "blue"); abline(${p.b0}, ${p.b1}, lty = 2)
plot(fitted(fit), resid(fit)); abline(h = 0)   # 잔차도`,
    spss: () => `* 메뉴: 분석 > 회귀분석 > 선형
*   종속변수 = y, 독립변수 = x, 방법 = 입력
*   [통계량] 추정값, 신뢰구간, 모형 적합 / [도표] Y: *ZRESID, X: *ZPRED
REGRESSION
  /MISSING LISTWISE
  /STATISTICS COEFF OUTS CI(95) R ANOVA
  /CRITERIA=PIN(.05) POUT(.10)
  /NOORIGIN
  /DEPENDENT y
  /METHOD=ENTER x
  /SCATTERPLOT=(*ZRESID ,*ZPRED)
  /SAVE PRED RESID.`,
  },
  init(ctx) {
    ctx.state.sp = ctx.plot({ x: [0, 10], y: [-10, 25], height: 330, xLabel: 'X', yLabel: 'Y', title: '산점도와 회귀선' });
    ctx.state.rp = ctx.plot({ x: [-10, 25], y: [-10, 10], height: 190, xLabel: '예측값 ŷ', yLabel: '잔차 e', title: '잔차도 (잔차 vs 예측값)' });
    ctx.state.seed = 51;
    ctx.state.gen = () => { S.seed(ctx.state.seed); ctx.state.ux = Array.from({ length: 300 }, () => S.runif(0, 10)); ctx.state.z = S.rnormVec(300); };
    ctx.state.gen();
  },
  update(ctx, v, changed) {
    const st = ctx.state, C = Lab.C;
    if (changed === 'resample') { st.seed++; st.gen(); }
    const x = st.ux.slice(0, v.n), y = x.map((xi, i) => v.b0 + v.b1 * xi + v.sigma * st.z[i]);
    const m = S.ols(x.map((a) => [a]), y), b0 = m.b[0], b1 = m.b[1];

    const sp = st.sp, lo = Math.min(S.min(y), v.b0, v.b0 + 10 * v.b1), hi = Math.max(S.max(y), v.b0, v.b0 + 10 * v.b1), pad = (hi - lo) * 0.08 + 0.5;
    sp.setY([lo - pad, hi + pad]); sp.clear();
    if (v.resid) x.forEach((xi, i) => { if (i < 150) sp.segment(xi, y[i], xi, m.fitted[i], { color: C.marker, width: 1.2, opacity: 0.6, layer: 'under' }); });
    if (v.truth) sp.line([[0, v.b0], [10, v.b0 + 10 * v.b1]], { color: C.muted, width: 1.5, dash: true });
    sp.line([[0, b0], [10, b0 + 10 * b1]], { color: C.s1, width: 2.5 });
    sp.dots(x.map((xi, i) => [xi, y[i]]), { color: C.s1, r: v.n > 150 ? 3 : 4, opacity: 0.75, tip: (d) => `x = ${S.f(d.x, 2)}, y = ${S.f(d.y, 2)}<br>ŷ = ${S.f(m.fitted[d.i], 2)} · 잔차 ${S.f(m.resid[d.i], 2)}` });
    sp.dots([[S.mean(x), S.mean(y)]], { color: C.ink, r: 5, opacity: 1, tip: () => '<b>(x̄, ȳ)</b><br>OLS 직선은 항상 이 점을 지납니다' });
    sp.legend([{ label: `추정선 ŷ = ${S.f(b0, 2)} + ${S.f(b1, 2)}x`, color: C.s1, type: 'line' }, ...(v.truth ? [{ label: `참 회귀선 (β₀=${v.b0}, β₁=${v.b1})`, color: C.muted, type: 'dash' }] : []), ...(v.resid ? [{ label: '잔차', color: C.marker, type: 'line' }] : []), { label: '평균점 (x̄, ȳ)', color: C.ink, type: 'dot' }]);

    const rp = st.rp, rm = Math.max(1, S.max(m.resid.map(Math.abs))) * 1.15;
    rp.setX([Math.min(...m.fitted) - 0.5, Math.max(...m.fitted) + 0.5]); rp.setY([-rm, rm]); rp.clear();
    rp.rect(rp.o.x[0], rp.o.x[1], -2 * m.sigma, 2 * m.sigma, { color: C.s1, opacity: 0.07 });
    rp.hline(0, { color: C.ink2, width: 1.2 });
    rp.dots(m.fitted.map((f, i) => [f, m.resid[i]]), { color: C.s2, r: 3.2, opacity: 0.75, tip: (d) => `ŷ = ${S.f(d.x, 2)}, e = ${S.f(d.y, 2)}` });
    rp.text(rp.o.x[1], 2 * m.sigma, '±2s', { anchor: 'end', dy: -4, dx: -4 });

    const sig = m.p[1] < 0.05;
    ctx.readout([
      { label: '추정 기울기 b₁', value: S.f(b1, 3), sub: `SE ${S.f(m.se[1], 3)} · 참값 ${v.b1}`, tone: 'accent' },
      { label: '추정 절편 b₀', value: S.f(b0, 2), sub: `참값 ${v.b0}` },
      { label: 'R²', value: S.apa(m.r2, 3), sub: `수정 R² ${S.apa(m.adjR2, 3)}` },
      { label: '잔차 SE (s)', value: S.f(m.sigma, 2), sub: `참 σ = ${v.sigma}` },
      { label: `t(${m.df2}) · p`, value: S.f(m.t[1], 2), sub: 'p ' + S.fp(m.p[1]), tone: sig ? null : 'warn' },
    ]);
    const inCI = v.b1 >= m.ci[1][0] && v.b1 <= m.ci[1][1];
    let msg = `X가 1 늘 때 Y는 평균 <b>${S.f(b1, 2)}</b>만큼 ${b1 >= 0 ? '증가' : '감소'}한다고 추정됩니다(95% CI [${S.f(m.ci[1][0], 2)}, ${S.f(m.ci[1][1], 2)}], 참값 ${v.b1} ${inCI ? '포함' : '미포함'}). 회귀선이 Y 변동의 <b>${S.pct(m.r2, 0)}</b>를 설명합니다.`;
    if (m.r2 < 0.2 && sig) msg += ' R²는 낮지만 표본이 커서 기울기는 유의합니다. 설명력과 유의성은 다른 질문입니다.';
    else if (!sig) msg += ' 기울기가 0이라는 가설을 기각하지 못했습니다. 오차가 크거나 표본이 작습니다.';
    ctx.insight(msg);
  },
});
