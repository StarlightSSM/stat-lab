/* 행동연구방법론 · 실험설계: 무작위배정과 교란변수 */
Lab.add({
  id: 'rm-experiment', subject: 'rm', order: 4,
  title: '실험설계: 무작위배정과 교란변수', en: 'Random assignment · confounding',
  summary: '학습 앱의 효과를 추정하는 가상 실험입니다. 참가자가 스스로 처치를 고르면 학습동기라는 교란변수가 효과를 부풀리는 과정을 봅니다.',
  keywords: 'experiment 실험 무작위배정 교란 confounding selection bias 내적타당도 ancova',
  controls: [
    { type: 'select', key: 'assign', label: '집단 배정 방식', options: [['random', '무작위배정'], ['self', '자기선택']], value: 'self' },
    { type: 'slider', key: 'eff', label: '앱의 실제 효과 (점)', min: 0, max: 10, step: 0.5, value: 3 },
    { type: 'slider', key: 'conf', label: '동기 → 점수 영향', min: 0, max: 10, step: 0.5, value: 6, hint: '교란변수가 결과에 미치는 영향' },
    { type: 'slider', key: 'sel', label: '동기 → 앱 사용 경향', min: 0, max: 3, step: 0.1, value: 1.5, hint: '자기선택일 때만 작동' },
    { type: 'slider', key: 'n', label: '참가자 수', min: 40, max: 400, step: 20, value: 160 },
    { type: 'button', key: 'resample', label: '실험 다시 하기', primary: true },
  ],
  concept: `
    <p>처치(예: 학습 앱 사용)의 인과효과를 알려면, 처치를 받은 집단과 받지 않은 집단이 <b>처치 말고는 모든 면에서 같아야</b> 합니다. 결과와 처치 모두에 영향을 주는 제3의 변수를 <em>교란변수</em>라고 합니다.</p>
    <p>참가자가 스스로 앱을 고르게 하면 의욕 높은 학생이 앱을 더 많이 씁니다. 이 학생들은 앱이 없어도 점수가 높으므로, 두 집단의 평균 차이에는 앱 효과와 동기 효과가 섞입니다. 이것이 <b>선택편향</b>이며 내적타당도를 위협합니다.</p>
    <p><b>무작위배정</b>은 동전 던지기로 집단을 나누어, 잰 변수든 재지 않은 변수든 평균적으로 두 집단에 고르게 퍼뜨립니다. 그래서 단순 평균 차이가 실제 효과의 불편추정치가 됩니다.</p>
    <p>교란변수를 측정했다면 공분산분석(ANCOVA)이나 회귀로 통제할 수 있지만, 측정하지 못한 교란변수는 통제할 수 없습니다. 무작위배정이 실험의 핵심인 이유입니다.</p>`,
  formula: `점수 = 70 + τ·처치 + γ·동기 + ε<br>자기선택: P(처치=1) = 1 / (1 + e<sup>−s·동기</sup>)<br>단순 평균차의 기대값 ≈ τ + γ·(동기<sub>처치</sub> − 동기<sub>통제</sub>)`,
  tasks: [
    '실제 효과를 0으로 두고 자기선택으로 실험해 보세요. 효과가 없는데도 차이가 나오나요?',
    '같은 설정에서 무작위배정으로 바꾸면 200번 반복한 추정치의 평균이 어디에 모이는지 확인하세요.',
    "'동기 → 점수 영향'을 0으로 낮추면 자기선택이어도 편향이 사라집니다. 교란이 성립하려면 어떤 두 조건이 필요한가요?",
    'ANCOVA 추정치(동기 통제)가 실제 효과를 복원하는지 보고, 동기를 측정하지 못했다면 어떻게 될지 생각해 보세요.',
  ],
  tools: {
    r: (p) => `# 무작위배정
df$treat <- sample(rep(0:1, each = ${p.n / 2}))

# 단순 비교 (t검정)
t.test(score ~ treat, data = df, var.equal = TRUE)

# 교란변수 통제 (ANCOVA)
summary(lm(score ~ treat + motivation, data = df))

# 집단 간 공변량 균형 점검
t.test(motivation ~ treat, data = df)
# 현재 설정: 효과 = ${p.eff}, 동기 영향 = ${p.conf}, 배정 = ${p.assign === 'random' ? '무작위' : '자기선택'}`,
    spss: () => `* 무작위배정 변수 만들기
SET SEED=2026.
COMPUTE treat = RV.BERNOULLI(0.5).
EXECUTE.

* 분석 > 평균비교 > 독립표본 T 검정
T-TEST GROUPS=treat(0 1) /VARIABLES=score motivation.

* 분석 > 일반선형모형 > 일변량 (ANCOVA: 동기를 공변량으로)
UNIANOVA score BY treat WITH motivation
  /PRINT=PARAMETER ETASQ
  /DESIGN=motivation treat.`,
  },
  init(ctx) {
    const row = ctx.row(), c1 = ctx.box('', row), c2 = ctx.box('', row);
    ctx.state.sc = ctx.plot({ x: [-3, 3], y: [40, 100], height: 300, xLabel: '학습동기 (표준점수)', yLabel: '시험 점수', title: '이번 실험의 참가자' }, c1);
    ctx.state.hist = ctx.plot({ x: [-5, 15], y: [0, 1], height: 300, xLabel: '추정된 효과 (평균 차이, 점)', yLabel: '실험 횟수', title: '같은 실험을 200번 반복하면' }, c2);
    ctx.state.seed = 5;
  },
  update(ctx, v, changed) {
    const st = ctx.state, C = Lab.C;
    if (changed === 'resample') st.seed++;
    const run = (n) => {
      const Z = [], T = [], Y = [];
      for (let i = 0; i < n; i++) {
        const z = S.randn();
        const t = v.assign === 'random' ? (i % 2) : S.rbern(1 / (1 + Math.exp(-v.sel * z)));
        Z.push(z); T.push(t); Y.push(70 + v.eff * t + v.conf * z + S.randn(0, 8));
      }
      if (v.assign === 'random') { const sh = S.shuffle(T); T.splice(0, n, ...sh); for (let i = 0; i < n; i++) Y[i] = 70 + v.eff * T[i] + v.conf * Z[i] + S.randn(0, 8); }
      return { Z, T, Y };
    };
    const diff = (d) => { const y1 = d.Y.filter((_, i) => d.T[i]), y0 = d.Y.filter((_, i) => !d.T[i]); return y1.length && y0.length ? S.mean(y1) - S.mean(y0) : NaN; };
    S.seed(st.seed);
    const d = run(v.n), est = diff(d);
    const z1 = d.Z.filter((_, i) => d.T[i]), z0 = d.Z.filter((_, i) => !d.T[i]);
    const anc = S.ols(d.T.map((t, i) => [t, d.Z[i]]), d.Y);
    S.seed(st.seed * 101 + 7);
    const reps = Array.from({ length: 200 }, () => diff(run(v.n))).filter(isFinite);
    const repMean = S.mean(reps);

    // scatter
    const sc = st.sc; sc.clear();
    const pts = d.Z.map((z, i) => ({ x: S.clamp(z, -2.95, 2.95), y: S.clamp(d.Y[i], 41, 99), color: d.T[i] ? C.s2 : C.s1 }));
    sc.dots(pts, { r: 3.5, opacity: 0.7, tip: (p) => `동기 ${S.f(d.Z[p.i], 2)} · 점수 ${S.f(d.Y[p.i], 1)}<br>${d.T[p.i] ? '앱 사용' : '미사용'}` });
    const m1 = S.mean(d.Y.filter((_, i) => d.T[i])), m0 = S.mean(d.Y.filter((_, i) => !d.T[i]));
    sc.hline(m1, { color: C.s2, width: 2, label: `앱 사용 평균 ${S.f(m1, 1)}` });
    sc.hline(m0, { color: C.s1, width: 2, label: `미사용 평균 ${S.f(m0, 1)}`, anchor: 'start' });
    sc.vline(S.mean(z1), { color: C.s2, dash: true, y0: 40, y1: 46 });
    sc.vline(S.mean(z0), { color: C.s1, dash: true, y0: 40, y1: 46 });
    sc.legend([{ label: `앱 사용 (n=${z1.length})`, color: C.s2, type: 'dot' }, { label: `미사용 (n=${z0.length})`, color: C.s1, type: 'dot' }, { label: '집단 평균', color: C.ink2, type: 'line' }]);

    // histogram of repeated estimates
    const lo = Math.min(-5, Math.floor(Math.min(...reps) - 1)), hi = Math.max(15, Math.ceil(Math.max(...reps) + 1));
    const bins = S.bin(reps, lo, hi, 40);
    const hp = st.hist; hp.setX([lo, hi]).setY([0, Math.max(...bins.map((b) => b.n)) * 1.15]); hp.clear();
    hp.hist(bins, { color: v.assign === 'random' ? C.s3 : C.s2, opacity: 0.7, tip: (b) => `${S.f(b.x0, 1)} ~ ${S.f(b.x1, 1)}점<br>${b.n}회` });
    hp.vline(v.eff, { color: C.ink, width: 2, label: `실제 효과 ${v.eff}`, anchor: v.eff > repMean ? 'start' : 'end' });
    hp.vline(repMean, { color: C.marker, dash: true, label: `추정치 평균 ${S.f(repMean, 1)}`, labelY: 28, anchor: repMean >= v.eff ? 'start' : 'end' });
    hp.vline(est, { color: C.marker, width: 1, y0: 0, y1: Math.max(...bins.map((b) => b.n)) * 0.12 });
    hp.legend([{ label: '200번 반복한 추정치', color: v.assign === 'random' ? C.s3 : C.s2 }, { label: '실제 효과', color: C.ink, type: 'line' }, { label: '추정치 평균', color: C.marker, type: 'dash' }]);

    const bias = repMean - v.eff, zgap = S.mean(z1) - S.mean(z0);
    ctx.readout([
      { label: '실제 효과 τ', value: S.f(v.eff, 1) + '점' },
      { label: '이번 실험 평균 차이', value: S.f(est, 2) + '점', tone: Math.abs(est - v.eff) > 2 ? 'bad' : 'good' },
      { label: '200회 평균 (편향)', value: S.f(repMean, 2), sub: `편향 ${bias >= 0 ? '+' : ''}${S.f(bias, 2)}`, tone: Math.abs(bias) > 0.8 ? 'bad' : 'good' },
      { label: '동기 차이 (처치−통제)', value: S.f(zgap, 2), sub: '0이면 균형', tone: Math.abs(zgap) > 0.2 ? 'warn' : null },
      { label: 'ANCOVA 추정 (동기 통제)', value: anc ? S.f(anc.b[1], 2) + '점' : '—', tone: 'accent' },
    ]);
    let msg;
    if (v.assign === 'self' && v.conf > 0 && v.sel > 0.2) msg = `앱을 고른 학생들의 동기가 평균 ${S.f(zgap, 2)}SD 더 높습니다. 그래서 단순 비교는 실제 효과 ${v.eff}점을 평균 <b>${S.f(repMean, 1)}점</b>으로 부풀립니다. 동기를 통제한 ANCOVA는 ${anc ? S.f(anc.b[1], 1) : '—'}점으로 실제에 가깝습니다.`;
    else if (v.assign === 'self') msg = `자기선택이지만 ${v.conf === 0 ? '동기가 점수에 영향을 주지 않아' : '동기가 앱 선택에 거의 영향을 주지 않아'} 교란이 생기지 않습니다. 교란은 처치와 결과 <b>둘 다</b>에 관련될 때만 생깁니다.`;
    else msg = `무작위배정으로 동기가 두 집단에 고르게 퍼졌습니다(차이 ${S.f(zgap, 2)}SD). 반복 추정치의 평균 ${S.f(repMean, 2)}점이 실제 효과 ${v.eff}점과 일치합니다. 한 번의 실험 값은 우연에 따라 흔들립니다.`;
    ctx.insight(msg);
  },
});
