/* 다중회귀와 다중공선성: replicate samples to show how predictor correlation inflates SE of each coefficient. */
Lab.add({
  id: 'reg-multi', subject: 'prob', order: 15,
  title: '다중회귀와 다중공선성', en: 'Multiple regression · multicollinearity · VIF',
  summary: '두 예측변수 X1, X2의 상관을 높여 가며 개별 회귀계수의 표준오차와 VIF가 어떻게 폭증하는지, 반복 표본으로 직접 확인합니다.',
  keywords: 'multiple regression 다중회귀 다중공선성 vif 공차 tolerance 편회귀계수',
  controls: [
    { type: 'slider', key: 'b1', label: '참 계수 β₁ (X1)', min: -0.5, max: 1, step: 0.05, value: 0.5 },
    { type: 'slider', key: 'b2', label: '참 계수 β₂ (X2)', min: -0.5, max: 1, step: 0.05, value: 0.3 },
    { type: 'slider', key: 'r12', label: 'X1–X2 상관 r₁₂', min: 0, max: 0.97, step: 0.01, value: 0.3, hint: '높을수록 두 변수가 같은 정보를 담습니다' },
    { type: 'slider', key: 'n', label: '표본크기 n', min: 30, max: 500, step: 10, value: 100 },
    { type: 'button', key: 'resample', label: '새 표본 뽑기', primary: true },
  ],
  concept: `
    <p>다중회귀 Y = β₀ + β₁X₁ + β₂X₂ + ε 에서 b₁은 <b>X₂를 일정하게 통제했을 때</b> X₁의 효과(편회귀계수)입니다. 이를 추정하려면 X₁ 중에서 X₂와 겹치지 않는 고유한 변동이 있어야 합니다.</p>
    <ul>
      <li>X₁과 X₂의 상관이 높으면 고유 변동이 줄어들어 b₁, b₂의 <b>표준오차가 커집니다</b>. 계수가 표본마다 크게 흔들리고 부호가 뒤집히기도 합니다.</li>
      <li><em>VIF</em> = 1 / (1 − R²ⱼ). R²ⱼ는 Xⱼ를 나머지 예측변수로 회귀한 결정계수입니다. 예측변수가 2개면 R²ⱼ = r₁₂²입니다. √VIF가 SE의 팽창 배수입니다.</li>
      <li>흔한 기준: VIF &gt; 10 (공차 = 1/VIF &lt; .1)이면 심각, 연구 분야에 따라 5를 쓰기도 합니다.</li>
    </ul>
    <p>다중공선성은 <b>전체 R²와 예측력에는 거의 영향을 주지 않습니다</b>. 문제는 "어느 변수가 중요한가"를 가려낼 수 없게 된다는 것입니다. 왼쪽 그림에서 (b̂₁, b̂₂) 구름이 대각선으로 길게 늘어나는 이유는 두 계수가 서로의 몫을 주고받기 때문입니다.</p>
    <p>대처: 개념이 겹치는 변수 하나 빼기, 합성점수로 묶기, 표본 늘리기, 능형(ridge) 회귀 등.</p>`,
  formula: `SE(<var>b<sub>j</sub></var>) = <var>σ</var> / √[ <var>n</var>·Var(<var>X<sub>j</sub></var>)·(1 − <var>R<sub>j</sub></var>²) ]<br>
    VIF<sub><var>j</var></sub> = 1 / (1 − <var>R<sub>j</sub></var>²), &nbsp; 공차 = 1 − <var>R<sub>j</sub></var>²<br>
    <span class="c">두 예측변수일 때 R<sub>j</sub>² = r₁₂²</span>`,
  tasks: [
    'r₁₂를 0에서 0.95까지 천천히 올리며 VIF와 SE(b₁)을 기록하세요. r₁₂ = 0.95일 때 SE는 r₁₂ = 0일 때의 몇 배인가요?',
    'r₁₂ = 0.95, n = 50에서 "새 표본 뽑기"를 반복하세요. b̂₁의 부호가 뒤집히는 표본이 나오나요? 그때 R²는 어떤가요?',
    'r₁₂ = 0.9일 때 n을 50에서 500으로 늘려 보세요. 표본을 늘리는 것이 다중공선성의 해결책이 될 수 있나요?',
    'β₂ = 0으로 두고 r₁₂를 높여 보세요. 실제로 효과가 없는 X2가 유의하게 나오는 표본이 있나요?',
  ],
  tools: {
    r: (p) => `set.seed(1)
library(MASS)
n <- ${p.n}
X <- mvrnorm(n, mu = c(0, 0), Sigma = matrix(c(1, ${p.r12}, ${p.r12}, 1), 2))
x1 <- X[, 1]; x2 <- X[, 2]
y  <- ${p.b1} * x1 + ${p.b2} * x2 + rnorm(n)

fit <- lm(y ~ x1 + x2)
summary(fit)          # 계수, SE, t, p, R²
confint(fit)
car::vif(fit)         # VIF (공차 = 1/VIF)
cor(x1, x2)`,
    spss: () => `* 메뉴: 분석 > 회귀분석 > 선형
*   종속변수 = y, 독립변수 = x1, x2, 방법 = 입력
*   [통계량] 추정값, 신뢰구간, 모형 적합, 공선성 진단 체크
REGRESSION
  /MISSING LISTWISE
  /STATISTICS COEFF OUTS CI(95) R ANOVA COLLIN TOL
  /CRITERIA=PIN(.05) POUT(.10)
  /NOORIGIN
  /DEPENDENT y
  /METHOD=ENTER x1 x2.

* 계수 표의 '공선성 통계량' 열에서 공차와 VIF를 읽습니다.`,
  },
  init(ctx) {
    const row = ctx.row(), a = ctx.box('', row), b = ctx.box('', row);
    ctx.state.cloud = ctx.plot({ x: [-1, 2], y: [-1, 2], height: 320, xLabel: 'b̂₁ 추정치', yLabel: 'b̂₂ 추정치', title: '반복 표본 200개의 (b̂₁, b̂₂)' }, a);
    ctx.state.sep = ctx.plot({ x: [0, 1], y: [0, 0.6], height: 320, xLabel: 'X1–X2 상관 r₁₂', yLabel: 'SE(b₁)', title: '상관이 높을수록 표준오차가 커진다' }, b);
    ctx.state.cip = ctx.plot({ x: [-1, 2], y: [0.4, 2.6], height: 150, yTicks: 2, xLabel: '회귀계수 (현재 표본, 95% CI)', yFmt: (d) => (d === 2 ? 'β₁ (X1)' : d === 1 ? 'β₂ (X2)' : ''), margin: { l: 66 } });
    ctx.state.seed = 61;
  },
  update(ctx, v, changed) {
    const st = ctx.state, C = Lab.C;
    if (changed === 'resample') st.seed++;
    const r = v.r12, s = Math.sqrt(1 - r * r);
    const draw = (n) => { const X = [], y = []; for (let i = 0; i < n; i++) { const z1 = S.randn(), x2 = r * z1 + s * S.randn(); X.push([z1, x2]); y.push(v.b1 * z1 + v.b2 * x2 + S.randn()); } return { X, y }; };
    // replications (fixed seed stream so the cloud is stable while sliders move)
    S.seed(9000 + st.seed);
    const reps = [];
    for (let k = 0; k < 200; k++) { // closed-form 2-predictor OLS (fast enough for slider drags)
      let s1 = 0, s2 = 0, sy = 0, s11 = 0, s22 = 0, s12 = 0, s1y = 0, s2y = 0; const n = v.n;
      for (let i = 0; i < n; i++) { const z1 = S.randn(), x2 = r * z1 + s * S.randn(), yy = v.b1 * z1 + v.b2 * x2 + S.randn();
        s1 += z1; s2 += x2; sy += yy; s11 += z1 * z1; s22 += x2 * x2; s12 += z1 * x2; s1y += z1 * yy; s2y += x2 * yy; }
      const c11 = s11 - s1 * s1 / n, c22 = s22 - s2 * s2 / n, c12 = s12 - s1 * s2 / n, c1y = s1y - s1 * sy / n, c2y = s2y - s2 * sy / n, det = c11 * c22 - c12 * c12;
      if (Math.abs(det) > 1e-12) reps.push([(c22 * c1y - c12 * c2y) / det, (c11 * c2y - c12 * c1y) / det]);
    }
    S.seed(st.seed);
    const d = draw(v.n), m = S.ols(d.X, d.y), vif = S.vif(d.X);

    // cloud
    const cp = st.cloud, span = Math.max(0.5, 4 / Math.sqrt(v.n * 0.0975)); // fixed for a given n, so inflation with r12 is visible
    const cx = (v.b1 + v.b2) / 2; cp.setX([cx - span, cx + span]); cp.setY([cx - span, cx + span]); cp.clear();
    cp.vline(0, { color: C.line, width: 1, layer: 'under' }); cp.hline(0, { color: C.line, width: 1, layer: 'under' });
    cp.dots(reps.map((q) => [q[0], q[1]]), { color: C.s1, r: 3, opacity: 0.35, ring: false, tip: (q) => `b̂₁ ${S.f(q.x, 2)}, b̂₂ ${S.f(q.y, 2)}` });
    cp.dots([[v.b1, v.b2]], { color: C.ink, r: 6, opacity: 1, tip: () => `<b>참값</b> (${v.b1}, ${v.b2})` });
    cp.dots([[m.b[1], m.b[2]]], { color: C.marker, r: 6, opacity: 1, tip: () => `<b>현재 표본</b> (${S.f(m.b[1], 2)}, ${S.f(m.b[2], 2)})` });
    cp.legend([{ label: '반복 표본 추정치', color: C.s1, type: 'dot' }, { label: '참값 (β₁, β₂)', color: C.ink, type: 'dot' }, { label: '현재 표본', color: C.marker, type: 'dot' }]);

    // SE vs r12 curve (theory, sigma = 1, Var(X)=1)
    const sep = st.sep, se = (rr) => 1 / Math.sqrt(v.n * (1 - rr * rr)), ymax = Math.max(se(0.97), se(r)) * 1.1;
    sep.setX([0, 1]); sep.setY([0, ymax]); sep.clear();
    sep.area(S.linspace(0, 0.97, 120).map((rr) => [rr, se(rr)]), { color: C.s1, opacity: 0.08 });
    sep.line(S.linspace(0, 0.97, 120).map((rr) => [rr, se(rr)]), { color: C.s1 });
    sep.hline(se(0), { color: C.muted, dash: true, width: 1 });
    sep.legend([{ label: `이론 SE(b₁), n = ${v.n}`, color: C.s1, type: 'line' }, { label: `r₁₂ = 0 기준 ${S.f(se(0), 3)}`, color: C.muted, type: 'dash' }, { label: '현재 r₁₂', color: C.marker, type: 'dot' }]);
    sep.dots([[r, se(r)]], { color: C.marker, r: 6, opacity: 1, tip: () => `r₁₂ = ${r} → 이론 SE ${S.f(se(r), 3)} (×${S.f(Math.sqrt(1 / (1 - r * r)), 2)})` });
    sep.text(r, se(r), `×${S.f(Math.sqrt(1 / (1 - r * r)), 2)}`, { anchor: r > 0.7 ? 'end' : 'middle', dx: r > 0.7 ? -10 : 0, dy: r > 0.7 ? 4 : -12 });

    // current-sample CI
    const ci = st.cip; ci.setX([Math.min(-0.5, m.ci[1][0], m.ci[2][0]) - 0.1, Math.max(1.2, m.ci[1][1], m.ci[2][1]) + 0.1]); ci.clear();
    ci.vline(0, { color: C.ink2, width: 1 });
    [[2, 1, v.b1, C.s1], [1, 2, v.b2, C.s2]].forEach(([yy, j, truth, col]) => {
      ci.segment(m.ci[j][0], yy, m.ci[j][1], yy, { color: col, width: 3 });
      ci.dots([[m.b[j], yy]], { color: col, r: 6, opacity: 1, tip: () => `b̂ = ${S.f(m.b[j], 3)} (SE ${S.f(m.se[j], 3)})<br>95% CI [${S.f(m.ci[j][0], 2)}, ${S.f(m.ci[j][1], 2)}] · p ${S.fp(m.p[j])}` });
      ci.segment(truth, yy - 0.3, truth, yy + 0.3, { color: C.ink, width: 2 });
    });

    const signFlip = reps.filter((q) => Math.sign(q[0]) !== Math.sign(v.b1) && v.b1 !== 0).length;
    ctx.readout([
      { label: 'b̂₁ (SE)', value: S.f(m.b[1], 3), sub: `SE ${S.f(m.se[1], 3)} · p ${S.fp(m.p[1])}` },
      { label: 'b̂₂ (SE)', value: S.f(m.b[2], 3), sub: `SE ${S.f(m.se[2], 3)} · p ${S.fp(m.p[2])}` },
      { label: 'VIF', value: S.f(vif[0], 2), sub: `공차 ${S.f(1 / vif[0], 3)}`, tone: vif[0] > 10 ? 'bad' : vif[0] > 5 ? 'warn' : null },
      { label: 'R²', value: S.apa(m.r2, 3), sub: `F(${m.df1}, ${m.df2}) = ${S.f(m.F, 1)}` },
      { label: 'b̂₁ 부호 뒤집힘', value: `${signFlip}/200`, sub: '반복 표본 중' },
    ]);
    let msg = `X1과 X2의 상관이 ${S.f(r, 2)}이라 VIF = <b>${S.f(vif[0], 1)}</b>, 계수의 표준오차가 상관이 없을 때보다 약 <b>${S.f(Math.sqrt(1 / (1 - r * r)), 1)}배</b> 큽니다.`;
    if (r > 0.9) msg += ` R²는 ${S.apa(m.r2, 2)}로 멀쩡하지만, 반복 표본의 ${S.pct(signFlip / 200, 0)}에서 b̂₁의 부호가 뒤집힐 만큼 개별 계수가 불안정합니다.`;
    else if (r < 0.4) msg += ' 이 정도 상관은 문제가 되지 않습니다. 계수 구름이 참값 주위에 둥글게 모여 있습니다.';
    else msg += ' 구름이 대각선 방향으로 늘어나기 시작했습니다. 한 계수가 커지면 다른 계수가 작아지는 식으로 몫을 주고받습니다.';
    ctx.insight(msg);
  },
});
