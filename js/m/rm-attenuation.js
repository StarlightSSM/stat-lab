/* 행동연구방법론 · 측정오차와 상관의 희석 */
Lab.add({
  id: 'rm-attenuation', subject: 'rm', order: 7,
  title: '측정오차와 상관의 희석', en: 'Measurement error · attenuation of correlation',
  summary: '진점수 사이의 실제 상관이 같아도, 측정 신뢰도가 낮으면 관찰된 상관이 얼마나 작아지는지 산점도로 비교합니다.',
  keywords: 'attenuation 희석 측정오차 신뢰도 disattenuation spearman 교정 진점수',
  controls: [
    { type: 'slider', key: 'rho', label: '진점수 간 실제 상관 ρ', min: 0, max: 0.95, step: 0.05, value: 0.6 },
    { type: 'slider', key: 'rxx', label: 'X 측정의 신뢰도 rₓₓ', min: 0.3, max: 1, step: 0.05, value: 0.7 },
    { type: 'slider', key: 'ryy', label: 'Y 측정의 신뢰도 r_yy', min: 0.3, max: 1, step: 0.05, value: 0.6 },
    { type: 'slider', key: 'n', label: '표본크기 n', min: 50, max: 1000, step: 50, value: 300 },
    { type: 'button', key: 'resample', label: '새 표본 뽑기', primary: true },
  ],
  concept: `
    <p>고전검사이론에서 관찰점수는 진점수에 무선 측정오차가 더해진 값입니다. 오차는 무작위라서 다른 변수와 상관이 없으므로, 오차가 섞일수록 두 변수의 관찰된 상관은 <b>0 쪽으로 줄어듭니다</b>. 이것을 상관의 희석(attenuation)이라고 합니다.</p>
    <p>줄어드는 정도는 두 측정 신뢰도의 곱의 제곱근입니다. 신뢰도 .70과 .60인 척도로 재면 실제 상관 .60이 약 .39로 보입니다. 연구자는 "관계가 약하다"고 결론 내리기 쉽습니다.</p>
    <ul>
      <li>관찰 상관의 최댓값은 √(rₓₓ·r_yy)입니다. 신뢰도가 낮은 척도는 다른 변수와 높은 상관을 가질 수 없습니다.</li>
      <li>Spearman의 교정 공식으로 진점수 상관을 추정할 수 있지만, 신뢰도 추정이 부정확하면 1을 넘는 값이 나오기도 합니다.</li>
      <li>구조방정식의 잠재변수는 여러 지표로 측정오차를 분리하므로, 같은 원리로 희석되지 않은 관계를 추정합니다.</li>
    </ul>`,
  formula: `X = T<sub>X</sub> + E<sub>X</sub>, &nbsp; rₓₓ = σ²<sub>T</sub> / σ²<sub>X</sub><br>r<sub>XY</sub> = ρ<sub>T</sub> · √(rₓₓ · r_yy)<br>교정 상관 ρ̂ = r<sub>XY</sub> / √(rₓₓ · r_yy)`,
  tasks: [
    'ρ = 0.6에서 두 신뢰도를 모두 1로 올렸다가 0.5로 내려 보세요. 관찰 상관은 얼마로 떨어지나요?',
    'ρ = 0.9인데 신뢰도가 0.5씩이면 관찰 상관의 기댓값은? 이 값으로 "중간 정도 관계"라고 해석하면 어떤 오류인가요?',
    'n = 50으로 줄이고 표본을 여러 번 뽑아 교정 상관이 1을 넘는 경우가 있는지 확인하세요.',
  ],
  tools: {
    r: (p) => `r_obs <- cor(df$X, df$Y)
rxx <- psych::alpha(df[, x_items])$total$raw_alpha   # 예: ${p.rxx}
ryy <- psych::alpha(df[, y_items])$total$raw_alpha   # 예: ${p.ryy}
r_obs / sqrt(rxx * ryy)                  # 희석 교정 상관
psych::correct.cor(cor(df[, c("X","Y")]), c(rxx, ryy))

# 잠재변수로 측정오차를 분리하는 방법
library(lavaan)
fit <- sem('FX =~ x1 + x2 + x3
            FY =~ y1 + y2 + y3
            FY ~~ FX', data = df, std.lv = TRUE)
standardizedSolution(fit)   # FX~~FY 가 희석되지 않은 상관`,
    spss: (p) => `* 1) 각 척도의 신뢰도
RELIABILITY /VARIABLES=x1 x2 x3 /MODEL=ALPHA.
RELIABILITY /VARIABLES=y1 y2 y3 /MODEL=ALPHA.
* 2) 관찰 상관
CORRELATIONS /VARIABLES=X Y.
* 3) 교정 상관은 변환 > 변수 계산 또는 계산기로
COMPUTE r_corr = r_obs / SQRT(${p.rxx} * ${p.ryy}).
EXECUTE.`,
  },
  init(ctx) {
    const row = ctx.row(), c1 = ctx.box('', row), c2 = ctx.box('', row);
    ctx.state.tp = ctx.plot({ x: [-3.5, 3.5], y: [-3.5, 3.5], height: 280, xLabel: '진점수 Tₓ', yLabel: '진점수 T_y', title: '측정오차가 없다면 (진점수)' }, c1);
    ctx.state.op = ctx.plot({ x: [-3.5, 3.5], y: [-3.5, 3.5], height: 280, xLabel: '관찰점수 X (표준화)', yLabel: '관찰점수 Y (표준화)', title: '실제로 관찰되는 점수' }, c2);
    ctx.state.cp = ctx.plot({ x: [0, 1], y: [0, 1], height: 220, xLabel: '√(rₓₓ · r_yy)  신뢰도 지수', yLabel: '관찰 상관', title: '신뢰도에 따라 줄어드는 관찰 상관' });
    ctx.state.seed = 8;
  },
  update(ctx, v, changed) {
    const st = ctx.state, C = Lab.C;
    if (changed === 'resample') st.seed++;
    S.seed(st.seed);
    const d = S.corrPair(v.n, v.rho);
    const ex = Math.sqrt((1 - v.rxx) / v.rxx), ey = Math.sqrt((1 - v.ryy) / v.ryy);
    const X = d.x.map((t) => t + S.randn(0, ex)), Y = d.y.map((t) => t + S.randn(0, ey));
    const zX = S.zscores(X), zY = S.zscores(Y);
    const rT = S.cor(d.x, d.y), rO = S.cor(X, Y), k = Math.sqrt(v.rxx * v.ryy), rExp = v.rho * k, rCorr = rO / k;
    const show = Math.min(v.n, 350);
    const drawScatter = (p, xs, ys, r, col) => {
      p.clear();
      p.dots(xs.slice(0, show).map((x, i) => [S.clamp(x, -3.4, 3.4), S.clamp(ys[i], -3.4, 3.4)]), { color: col, r: 2.8, opacity: 0.45, ring: false });
      const m = S.ols(xs.map((x) => [x]), ys);
      p.line([[-3.4, m.b[0] - 3.4 * m.b[1]], [3.4, m.b[0] + 3.4 * m.b[1]]], { color: C.ink, width: 2 });
      p.text(-3.3, 3.0, `r = ${S.apa(r, 2)}`, { anchor: 'start', size: 14, weight: 600, color: C.ink });
    };
    drawScatter(st.tp, d.x, d.y, rT, C.s3);
    drawScatter(st.op, zX, zY, rO, C.s2);
    st.tp.legend([]); st.op.legend([]);

    const cp = st.cp; cp.clear();
    cp.line([[0, 0], [1, v.rho]], { color: C.s1 });
    cp.line([[0, 0], [1, 1]], { color: C.muted, dash: true, width: 1.2 });
    cp.vline(k, { color: C.line, width: 1 });
    cp.dots([[k, rExp]], { color: C.s1, r: 5, tip: () => `<b>기대 관찰 상관</b><br>${S.apa(v.rho, 2)} × ${S.f(k, 3)} = ${S.apa(rExp, 3)}` });
    cp.dots([[k, S.clamp(rO, 0, 1)]], { color: C.marker, r: 5, tip: () => `<b>이번 표본 관찰 상관</b><br>${S.apa(rO, 3)}` });
    cp.dots([[1, v.rho]], { color: C.s3, r: 5, tip: () => `<b>진점수 상관 ρ</b><br>${v.rho}` });
    cp.legend([{ label: `ρ = ${v.rho}일 때 관찰 상관의 기댓값`, color: C.s1, type: 'line' }, { label: '관찰 상관 상한 √(rₓₓr_yy)', color: C.muted, type: 'dash' }, { label: '이번 표본', color: C.marker, type: 'dot' }, { label: '진점수 상관', color: C.s3, type: 'dot' }]);

    ctx.readout([
      { label: '실제 상관 ρ', value: S.apa(v.rho, 2), sub: `진점수 표본 r ${S.apa(rT, 2)}` },
      { label: '관찰 상관 기댓값', value: S.apa(rExp, 3), sub: `= ρ × ${S.f(k, 2)}` },
      { label: '이번 표본 관찰 r', value: S.apa(rO, 3), tone: 'warn' },
      { label: '교정 상관', value: S.apa(rCorr, 3), sub: rCorr > 1 ? '1 초과: 교정 한계' : 'r / √(rₓₓr_yy)', tone: rCorr > 1 ? 'bad' : 'good' },
      { label: '줄어든 비율', value: S.pct(1 - k, 0), sub: '상관 손실' },
    ]);
    let msg;
    if (k > 0.95) msg = '두 측정 모두 신뢰도가 거의 완벽해서 관찰 상관이 진점수 상관과 거의 같습니다.';
    else msg = `진점수 상관은 ${S.apa(v.rho, 2)}인데, 신뢰도 ${v.rxx}와 ${v.ryy}로 재면 관찰 상관은 평균 <b>${S.apa(rExp, 2)}</b>로 ${S.pct(1 - k, 0)} 줄어듭니다. 이번 표본은 ${S.apa(rO, 2)}이고, 교정하면 ${S.apa(rCorr, 2)}입니다.`;
    if (rCorr > 1) msg += ' 교정값이 1을 넘었습니다. 표본이 작거나 신뢰도 추정이 부정확할 때 생기는 교정 공식의 한계입니다.';
    ctx.insight(msg);
  },
});
