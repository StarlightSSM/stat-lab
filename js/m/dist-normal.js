/* Reference module: chart-based. Pattern = build plots in init, keep them in ctx.state, redraw everything in update. */
Lab.add({
  id: 'dist-normal', subject: 'prob', order: 5,
  title: '정규분포와 Z점수', en: 'Normal distribution · z-score',
  summary: '평균과 표준편차가 곡선의 위치와 퍼짐을 어떻게 바꾸는지, 특정 구간의 확률이 얼마인지 직접 재 봅니다.',
  keywords: 'normal z 표준화 68-95-99.7',
  controls: [
    { type: 'slider', key: 'mu', label: '평균 μ', min: -3, max: 3, step: 0.1, value: 0 },
    { type: 'slider', key: 'sd', label: '표준편차 σ', min: 0.4, max: 2.5, step: 0.05, value: 1 },
    { type: 'heading', label: '확률을 구할 구간' },
    { type: 'slider', key: 'a', label: '하한 a', min: -6, max: 6, step: 0.1, value: -1 },
    { type: 'slider', key: 'b', label: '상한 b', min: -6, max: 6, step: 0.1, value: 1 },
    { type: 'toggle', key: 'rule', label: '68–95–99.7 규칙 표시', value: false },
    { type: 'toggle', key: 'std', label: '표준정규분포 N(0,1) 겹쳐 보기', value: true },
  ],
  concept: `
    <p>정규분포 <code>N(μ, σ²)</code>는 평균 μ를 중심으로 좌우 대칭인 종 모양 분포입니다. <b>μ는 위치</b>를, <b>σ는 퍼짐</b>을 정합니다. σ가 커지면 곡선은 낮고 넓어지지만 전체 넓이는 항상 1입니다.</p>
    <p>어떤 값 x가 평균에서 표준편차 몇 개만큼 떨어져 있는지를 나타낸 것이 <em>Z점수</em>입니다. 모든 정규분포는 Z로 바꾸면 하나의 표준정규분포 N(0,1)이 되므로, 시험 점수처럼 단위가 다른 값도 비교할 수 있습니다.</p>
    <ul><li>μ ± 1σ 안에 약 68.3%</li><li>μ ± 2σ 안에 약 95.4%</li><li>μ ± 3σ 안에 약 99.7%</li></ul>
    <p>가설검정의 임계값 ±1.96도 여기서 나옵니다. 표준정규분포에서 가운데 95%를 남기는 경계입니다.</p>`,
  formula: `<var>f</var>(<var>x</var>) = 1 / (σ√2π) · exp(−(<var>x</var>−μ)² / 2σ²)<br><var>z</var> = (<var>x</var> − μ) / σ<br>P(<var>a</var> ≤ X ≤ <var>b</var>) = Φ(<var>z<sub>b</sub></var>) − Φ(<var>z<sub>a</sub></var>)`,
  tasks: [
    'σ를 0.5와 2로 바꿔 보세요. 곡선 높이는 달라져도 넓이(확률 총합)가 1로 유지되는 이유를 설명해 보세요.',
    '구간을 a = −1.96, b = 1.96으로 맞추고 μ=0, σ=1일 때 확률이 0.95가 되는지 확인하세요.',
    'μ=1, σ=2일 때 x=3의 Z점수는? 슬라이더로 확인해 보세요.',
    '68–95–99.7 규칙을 켜고 σ를 바꿔도 각 구간의 비율이 그대로인지 보세요.',
  ],
  tools: {
    r: (p) => `# P(a ≤ X ≤ b), X ~ N(${p.mu}, ${p.sd}^2)
pnorm(${p.b}, mean = ${p.mu}, sd = ${p.sd}) - pnorm(${p.a}, mean = ${p.mu}, sd = ${p.sd})

# Z점수
z_a <- (${p.a} - ${p.mu}) / ${p.sd}
z_b <- (${p.b} - ${p.mu}) / ${p.sd}

# 곡선 그리기
curve(dnorm(x, ${p.mu}, ${p.sd}), from = -6, to = 6)
qnorm(0.975)   # 1.959964`,
    spss: (p) => `* 변환 > 변수 계산 에서 누적확률(CDF)을 구합니다.
COMPUTE p_ab = CDF.NORMAL(${p.b}, ${p.mu}, ${p.sd}) - CDF.NORMAL(${p.a}, ${p.mu}, ${p.sd}).
EXECUTE.

* 분석 > 기술통계량 > 기술통계 > '표준화 값을 변수로 저장' 체크 → Z점수 변수 생성
DESCRIPTIVES VARIABLES=score /SAVE.`,
  },
  init(ctx) {
    const p = ctx.plot({ x: [-6, 6], y: [0, 1.05], height: 320, xLabel: 'x', yLabel: '확률밀도 f(x)' });
    ctx.state.p = p;
  },
  update(ctx, v) {
    const { p } = ctx.state, C = Lab.C;
    let a = Math.min(v.a, v.b), b = Math.max(v.a, v.b);
    const f = (x) => S.dnorm(x, v.mu, v.sd), peak = f(v.mu);
    p.setY([0, Math.max(0.45, peak * 1.12)]);
    p.clear();
    const xs = S.linspace(-6, 6, 300);
    if (v.std) p.line(xs.map((x) => [x, S.dnorm(x)]), { color: C.muted, width: 1.5, dash: true });
    if (v.rule) {
      [[3, 0.1], [2, 0.16], [1, 0.24]].forEach(([k, o]) => p.shade(f, v.mu - k * v.sd, v.mu + k * v.sd, { color: C.s3, opacity: o }));
      [1, 2, 3].forEach((k) => { p.vline(v.mu - k * v.sd, { color: C.line, width: 1 }); p.vline(v.mu + k * v.sd, { color: C.line, width: 1 }); });
      p.text(v.mu, f(v.mu) * 0.45, '68.3%'); p.text(v.mu + 1.5 * v.sd, f(v.mu + 1.5 * v.sd) * 0.4, '13.6%', { size: 10 });
    }
    p.shade(f, a, b, { color: C.s1, opacity: 0.3 });
    p.line(xs.map((x) => [x, f(x)]), { color: C.s1 });
    p.vline(a, { color: C.s1, label: 'a', anchor: 'end' }); p.vline(b, { color: C.s1, label: 'b' });
    p.dots([[v.mu, peak]], { color: C.marker, r: 5, tip: () => `<b>평균 μ = ${v.mu}</b><br>최고점 높이 ${S.f(peak, 3)}` });
    p.legend([{ label: `N(${v.mu}, ${v.sd}²)`, color: C.s1, type: 'line' }, ...(v.std ? [{ label: '표준정규 N(0,1)', color: C.muted, type: 'dash' }] : [])]);

    const za = (a - v.mu) / v.sd, zb = (b - v.mu) / v.sd, prob = S.pnorm(zb) - S.pnorm(za);
    ctx.readout([
      { label: 'P(a ≤ X ≤ b)', value: S.f(prob, 4), sub: S.pct(prob), tone: 'accent' },
      { label: 'a의 Z점수', value: S.f(za, 2) },
      { label: 'b의 Z점수', value: S.f(zb, 2) },
      { label: '곡선 최고점', value: S.f(peak, 3), sub: '= 1/(σ√2π)' },
    ]);
    ctx.insight(`a와 b는 평균에서 각각 <b>${S.f(za, 2)}σ</b>, <b>${S.f(zb, 2)}σ</b> 떨어져 있습니다. 이 구간에 전체의 <b>${S.pct(prob)}</b>가 들어갑니다.` +
      (v.sd > 1.5 ? ' σ가 커서 곡선이 낮고 넓게 퍼졌습니다.' : v.sd < 0.7 ? ' σ가 작아 값들이 평균 근처에 몰려 있습니다.' : ''));
  },
});
