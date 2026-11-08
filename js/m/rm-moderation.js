/* 행동연구방법론 · 조절효과 (상호작용, 단순기울기, Johnson–Neyman) */
Lab.add({
  id: 'rm-moderation', subject: 'rm', order: 5,
  title: '조절효과: 상호작용과 단순기울기', en: 'Moderation · interaction, simple slopes, Johnson–Neyman',
  summary: '직무스트레스가 소진에 미치는 영향이 사회적 지지 수준에 따라 달라지는지, 상호작용항과 단순기울기, 평균중심화를 직접 조작해 봅니다.',
  keywords: 'moderation 조절 상호작용 interaction simple slope 단순기울기 centering 평균중심화 johnson-neyman process model 1',
  controls: [
    { type: 'slider', key: 'b3', label: '상호작용 b₃ (X×W)', min: -0.8, max: 0.8, step: 0.05, value: -0.35 },
    { type: 'slider', key: 'b1', label: 'W 평균에서 X의 효과', min: -1, max: 1, step: 0.05, value: 0.5 },
    { type: 'slider', key: 'b2', label: 'W의 효과', min: -1, max: 1, step: 0.05, value: -0.3 },
    { type: 'slider', key: 'wm', label: '조절변수 W의 평균', min: 0, max: 5, step: 0.5, value: 3.5, hint: '5점 척도 평균이라고 생각하세요' },
    { type: 'slider', key: 'n', label: '표본크기 n', min: 40, max: 600, step: 20, value: 200 },
    { type: 'toggle', key: 'center', label: 'X와 W를 평균중심화', value: false },
    { type: 'button', key: 'resample', label: '새 표본 뽑기', primary: true },
  ],
  concept: `
    <p>조절효과는 X가 Y에 미치는 영향의 <b>크기나 방향이 제3의 변수 W에 따라 달라지는</b> 현상입니다. 회귀식에 X와 W의 곱(상호작용항)을 넣고, 그 계수 b₃가 유의하면 조절효과가 있다고 봅니다.</p>
    <p>b₃만으로는 해석이 끝나지 않습니다. W가 낮을 때·평균일 때·높을 때(보통 −1SD, 평균, +1SD) X의 기울기를 따로 계산한 <em>단순기울기</em>를 그려야 "지지가 높으면 스트레스의 영향이 약해진다" 같은 문장을 쓸 수 있습니다.</p>
    <ul>
      <li>상호작용항이 있으면 b₁은 "W = 0일 때 X의 효과"입니다. 5점 척도에서 W = 0은 존재하지 않는 값이라 b₁이 의미 없는 숫자가 됩니다.</li>
      <li><b>평균중심화</b>하면 b₁은 "W가 평균일 때 X의 효과"가 됩니다. b₃와 단순기울기, R²는 변하지 않습니다.</li>
      <li><b>Johnson–Neyman 구간</b>은 W의 어느 범위에서 X의 효과가 유의한지 경계값을 찾아 줍니다.</li>
    </ul>`,
  formula: `Y = <var>b</var>₀ + <var>b</var>₁X + <var>b</var>₂W + <var>b</var>₃(X·W) + ε<br>X의 조건부 효과 θ(W) = <var>b</var>₁ + <var>b</var>₃W<br>SE(θ) = √(Var<var>b</var>₁ + W²·Var<var>b</var>₃ + 2W·Cov(<var>b</var>₁,<var>b</var>₃))`,
  tasks: [
    '중심화를 끈 상태에서 W 평균을 0에서 5로 옮겨 보세요. b₁ 추정치가 크게 바뀌는데 단순기울기 선은 그대로인지 확인하세요.',
    '중심화를 켜고 같은 실험을 반복하세요. 이제 b₁은 무엇을 뜻하나요?',
    'b₃ = −0.6으로 두고 Johnson–Neyman 그래프에서 X의 효과가 유의하지 않게 되는 W 값을 찾아보세요.',
    'b₃ = 0.1, n = 60에서 상호작용이 유의한지 보고, n을 600으로 늘리면 어떻게 되는지 비교하세요.',
  ],
  tools: {
    r: (p) => `${p.center ? `df$X_c <- df$X - mean(df$X)
df$W_c <- df$W - mean(df$W)
fit <- lm(Y ~ X_c * W_c, data = df)` : 'fit <- lm(Y ~ X * W, data = df)'}
summary(fit)        # X:W 계수 = 상호작용 b3

library(interactions)
sim_slopes(fit, pred = ${p.center ? 'X_c' : 'X'}, modx = ${p.center ? 'W_c' : 'W'}, johnson_neyman = TRUE)
interact_plot(fit, pred = ${p.center ? 'X_c' : 'X'}, modx = ${p.center ? 'W_c' : 'W'})`,
    spss: (p) => `* Hayes PROCESS 매크로 (v4) Model 1: 단순 조절
* 분석 > Regression > PROCESS v4 에서도 같은 설정 가능.
PROCESS y=burnout /x=stress /w=support
  /model=1
  /center=${p.center ? 1 : 0}
  /moments=1
  /jn=1
  /plot=1.

* PROCESS 없이: 곱항을 만들어 회귀
COMPUTE XW = stress * support.
REGRESSION /DEPENDENT burnout /METHOD=ENTER stress support /METHOD=ENTER XW.`,
  },
  init(ctx) {
    const row = ctx.row(), c1 = ctx.box('', row), c2 = ctx.box('', row);
    ctx.state.sp = ctx.plot({ x: [0, 6], y: [0, 6], height: 300, xLabel: 'X: 직무스트레스', yLabel: 'Y: 소진', title: '단순기울기 (W = −1SD · 평균 · +1SD)' }, c1);
    ctx.state.jn = ctx.plot({ x: [0, 6], y: [-1, 1], height: 300, xLabel: 'W: 사회적 지지', yLabel: 'X의 조건부 효과 θ(W)', title: 'Johnson–Neyman: W에 따른 X의 효과와 95% CI' }, c2);
    ctx.state.seed = 9;
  },
  update(ctx, v, changed) {
    const st = ctx.state, C = Lab.C;
    if (changed === 'resample') st.seed++;
    S.seed(st.seed);
    const n = v.n, xm = 3, X = [], W = [], Y = [];
    for (let i = 0; i < n; i++) {
      const x = xm + S.randn(0, 0.9), w = v.wm + S.randn(0, 0.9);
      X.push(x); W.push(w);
      Y.push(3 + v.b1 * (x - xm) + v.b2 * (w - v.wm) + v.b3 * (x - xm) * (w - v.wm) + S.randn(0, 0.7));
    }
    const mx = S.mean(X), mw = S.mean(W), sw = S.sd(W);
    const Xu = v.center ? X.map((x) => x - mx) : X, Wu = v.center ? W.map((w) => w - mw) : W;
    // OLS with covariance
    const D = Xu.map((x, i) => [1, x, Wu[i], x * Wu[i]]), Dt = S.T(D), XtXi = S.inv(S.mmul(Dt, D));
    const b = S.mvec(XtXi, S.mvec(Dt, Y)), res = Y.map((y, i) => y - D[i].reduce((s, d, j) => s + d * b[j], 0));
    const dfe = n - 4, mse = S.sum(res.map((e) => e * e)) / dfe, cov = XtXi.map((r) => r.map((c) => c * mse));
    const se = cov.map((r, i) => Math.sqrt(r[i])), pv = b.map((bb, i) => 2 * (1 - S.pt(Math.abs(bb / se[i]), dfe)));
    const main = S.ols(Xu.map((x, i) => [x, Wu[i]]), Y), full = S.ols(Xu.map((x, i) => [x, Wu[i], x * Wu[i]]), Y);
    const dR2 = full.r2 - main.r2;
    const tq = S.qt(0.975, dfe);
    const theta = (wRaw) => { const w = v.center ? wRaw - mw : wRaw; const t = b[1] + b[3] * w; const s = Math.sqrt(cov[1][1] + w * w * cov[3][3] + 2 * w * cov[1][3]); return { t, s, lo: t - tq * s, hi: t + tq * s }; };
    const pred = (xRaw, wRaw) => { const x = v.center ? xRaw - mx : xRaw, w = v.center ? wRaw - mw : wRaw; return b[0] + b[1] * x + b[2] * w + b[3] * x * w; };

    // simple slopes
    const sp = st.sp; sp.clear();
    const ys = Y.concat([0]);
    sp.setY([Math.min(0, Math.floor(S.min(ys))), Math.max(6, Math.ceil(S.max(Y)))]);
    sp.dots(X.slice(0, 300).map((x, i) => [S.clamp(x, 0, 6), Y[i]]), { color: C.muted, r: 2.5, opacity: 0.35, ring: false });
    const lv = [[mw - sw, '−1SD', C.s1], [mw, '평균', C.s3], [mw + sw, '+1SD', C.s2]];
    const slopes = lv.map(([w, lab, col]) => {
      const th = theta(w); sp.line([[0.5, pred(0.5, w)], [5.5, pred(5.5, w)]], { color: col, width: 2.5 });
      sp.text(5.55, pred(5.5, w), `${lab}: ${S.f(th.t, 2)}${S.stars(2 * (1 - S.pt(Math.abs(th.t / th.s), dfe)))}`, { anchor: 'end', dy: -7, size: 11 });
      return { lab, w, ...th };
    });
    sp.legend(lv.map(([w, lab, col]) => ({ label: `W ${lab} (${S.f(w, 2)})`, color: col, type: 'line' })));

    // Johnson–Neyman
    const jp = st.jn, wlo = Math.max(-1, mw - 3 * sw), whi = mw + 3 * sw; jp.setX([wlo, whi]);
    const grid = S.linspace(wlo, whi, 120).map((w) => ({ w, ...theta(w) }));
    const ymax = Math.max(0.3, ...grid.map((g) => Math.abs(g.hi)), ...grid.map((g) => Math.abs(g.lo))) * 1.1;
    jp.setY([-ymax, ymax]); jp.clear();
    const band = d3.area().x((d) => jp.x(d.w)).y0((d) => jp.y(d.lo)).y1((d) => jp.y(d.hi));
    jp.g('under').append('path').attr('d', band(grid)).style('fill', C.s1).style('opacity', 0.14);
    // significant regions shaded
    grid.forEach((g, i) => { if (i < grid.length - 1 && (g.lo > 0 || g.hi < 0)) jp.rect(g.w, grid[i + 1].w, -ymax, ymax, { color: C.s3, opacity: 0.07 }); });
    jp.hline(0, { color: C.ink2, width: 1 });
    jp.line(grid.map((g) => [g.w, g.t]), { color: C.s1 });
    const jnPts = [];
    for (let i = 1; i < grid.length; i++) {
      const s0 = grid[i - 1].lo > 0 || grid[i - 1].hi < 0, s1 = grid[i].lo > 0 || grid[i].hi < 0;
      if (s0 !== s1) jnPts.push((grid[i - 1].w + grid[i].w) / 2);
    }
    jnPts.forEach((w, k) => jp.vline(w, { color: C.marker, dash: true, label: `W = ${S.f(w, 2)}`, labelY: 12 + k * 16 }));
    [mw - sw, mw, mw + sw].forEach((w, k) => jp.dots([[w, theta(w).t]], { color: lv[k][2], r: 5, tip: () => `<b>W ${lv[k][1]}</b> = ${S.f(w, 2)}<br>θ = ${S.f(theta(w).t, 3)} [${S.f(theta(w).lo, 2)}, ${S.f(theta(w).hi, 2)}]` }));
    jp.legend([{ label: 'θ(W) = b₁ + b₃W', color: C.s1, type: 'line' }, { label: '95% 신뢰구간', color: C.s1 }, { label: 'X의 효과가 유의한 W 구간', color: C.s3 }]);

    ctx.readout([
      { label: '상호작용 b₃', value: S.f(b[3], 3) + S.stars(pv[3]), sub: `p ${S.fp(pv[3])}`, tone: pv[3] < 0.05 ? 'accent' : null },
      { label: v.center ? 'b₁ (W 평균에서 X 효과)' : 'b₁ (W = 0에서 X 효과)', value: S.f(b[1], 3), sub: `p ${S.fp(pv[1])}`, tone: !v.center && v.wm > 1 ? 'warn' : null },
      { label: '단순기울기 −1SD / +1SD', value: `${S.f(slopes[0].t, 2)} / ${S.f(slopes[2].t, 2)}` },
      { label: 'ΔR² (상호작용 추가)', value: S.apa(dR2, 3), sub: `R² = ${S.apa(full.r2, 3)}` },
    ]);
    let msg = '';
    if (pv[3] < 0.05) {
      const weaker = Math.abs(slopes[2].t) < Math.abs(slopes[0].t);
      msg = `상호작용이 유의합니다. 사회적 지지가 ${weaker ? '높을수록' : '낮을수록'} 스트레스가 소진에 주는 영향이 약해집니다(−1SD: ${S.f(slopes[0].t, 2)}, +1SD: ${S.f(slopes[2].t, 2)}). `;
      if (jnPts.length) msg += `Johnson–Neyman 경계는 W = ${jnPts.map((w) => S.f(w, 2)).join(', ')}입니다. `;
    } else msg = `상호작용 b₃가 유의하지 않습니다(p ${S.fp(pv[3])}). 세 단순기울기가 거의 평행하니 X의 효과는 W와 관계없이 비슷하다고 보는 편이 안전합니다. `;
    if (!v.center && v.wm > 1) msg += `중심화하지 않아서 b₁(${S.f(b[1], 2)})은 W = 0, 즉 척도에 없는 값에서의 효과입니다. 중심화를 켜면 해석 가능한 값이 됩니다.`;
    else if (v.center) msg += `중심화했으므로 b₁ = ${S.f(b[1], 2)}은 지지가 평균일 때 스트레스의 효과이고, 초록 단순기울기와 같은 값입니다.`;
    ctx.insight(msg);
  },
});
