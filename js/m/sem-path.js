/* Reference module: diagram-based (AMOS style). Pattern = simulate data from chosen population paths, estimate, redraw diagram. */
Lab.add({
  id: 'sem-path', subject: 'sem', order: 2,
  title: '경로분석: 직접·간접·총효과', en: 'Path analysis · direct, indirect, total effects',
  summary: 'X → M → Y 경로의 계수를 바꾸며 간접효과(a×b)와 총효과가 어떻게 쪼개지는지 AMOS 경로도로 확인합니다.',
  keywords: 'path analysis 경로 간접효과 총효과 amos',
  controls: [
    { type: 'slider', key: 'a', label: '경로 a (X → M)', min: -0.8, max: 0.8, step: 0.05, value: 0.5 },
    { type: 'slider', key: 'b', label: '경로 b (M → Y)', min: -0.8, max: 0.8, step: 0.05, value: 0.4 },
    { type: 'slider', key: 'c', label: "직접경로 c' (X → Y)", min: -0.8, max: 0.8, step: 0.05, value: 0.2 },
    { type: 'slider', key: 'n', label: '표본크기 N', min: 30, max: 1000, step: 10, value: 200 },
    { type: 'toggle', key: 'est', label: '모집단 값 대신 표본 추정치 표시', value: true },
    { type: 'button', key: 'resample', label: '새 표본 뽑기', primary: true },
  ],
  concept: `
    <p>경로분석은 여러 개의 회귀식을 하나의 그림(경로도)으로 동시에 추정합니다. 화살표 하나가 회귀계수 하나이고, AMOS에서는 표준화 계수를 화살표 위에 표시합니다.</p>
    <ul>
      <li><b>직접효과</b> c′ : X가 M을 거치지 않고 Y에 주는 영향</li>
      <li><b>간접효과</b> a × b : X가 M을 통해 Y에 주는 영향 (경로 계수의 곱)</li>
      <li><b>총효과</b> c = c′ + a×b : X 하나로 Y를 회귀했을 때의 계수</li>
    </ul>
    <p>c′와 a×b의 부호가 반대이면 총효과가 0에 가까워져서 "X는 Y와 관계없다"는 잘못된 결론이 나올 수 있습니다. 이것을 <em>비일관 매개(inconsistent mediation)</em> 또는 억제효과라고 합니다.</p>
    <p>내생변수(M, Y)에는 설명되지 않은 부분을 나타내는 오차항(e1, e2)이 붙습니다. 오차의 크기는 1 − R²로 읽을 수 있습니다.</p>`,
  formula: `M = <var>a</var>·X + e1<br>Y = <var>c′</var>·X + <var>b</var>·M + e2<br>간접효과 = <var>a</var> × <var>b</var> &nbsp;&nbsp; 총효과 <var>c</var> = <var>c′</var> + <var>a</var><var>b</var>`,
  tasks: [
    "c′를 0으로 두면 X의 효과가 모두 M을 거치는 '완전매개'가 됩니다. 총효과와 간접효과가 같아지는지 확인하세요.",
    "a = 0.6, b = 0.5, c′ = −0.3으로 맞춰 보세요. 총효과가 거의 0인데도 매개효과는 뚜렷합니다.",
    'N을 30으로 줄이고 새 표본을 여러 번 뽑아 보세요. 추정치가 모집단 값 주위에서 얼마나 흔들리나요?',
  ],
  tools: {
    amos: (p) => `[AMOS Graphics 순서]
1. Draw observed variables 로 X, M, Y 사각형 3개
2. Draw paths: X→M, M→Y, X→Y
3. Add unique variable: M, Y에 오차항 e1, e2 (경로 1로 고정)
4. Analysis Properties > Output: Standardized estimates,
   Indirect, direct & total effects 체크
5. Bootstrap 탭: Perform bootstrap (2000), Bias-corrected CI 95
6. Calculate Estimates → 경로 위 계수 확인

모집단 값: a=${p.a}, b=${p.b}, c'=${p.c}  (N=${p.n})`,
    lavaan: (p) => `library(lavaan)
model <- '
  M ~ a*X
  Y ~ c*X + b*M
  indirect := a*b
  total    := c + a*b
'
fit <- sem(model, data = df, se = "bootstrap", bootstrap = 2000)
summary(fit, standardized = TRUE)
parameterEstimates(fit, boot.ci.type = "bca.simple")`,
  },
  init(ctx) {
    ctx.state.dg = ctx.diagram({ width: 640, height: 300 });
    const row = ctx.row();
    ctx.state.bar = ctx.plot({ xBand: ['직접효과 c′', '간접효과 a×b', '총효과 c'], y: [-1, 1], height: 220, yLabel: '표준화 효과' }, row);
    ctx.state.seed = 7;
  },
  update(ctx, v, changed) {
    if (changed === 'resample') ctx.state.seed++;
    S.seed(ctx.state.seed);
    // simulate standardized data from population paths
    const n = v.n, X = [], M = [], Y = [];
    const vm = Math.max(0.05, 1 - v.a * v.a);
    for (let i = 0; i < n; i++) {
      const x = S.randn(), m = v.a * x + Math.sqrt(vm) * S.randn();
      const expl = v.c * v.c + v.b * v.b + 2 * v.c * v.b * v.a, vy = Math.max(0.05, 1 - expl);
      X.push(x); M.push(m); Y.push(v.c * x + v.b * m + Math.sqrt(vy) * S.randn());
    }
    const zX = S.zscores(X), zM = S.zscores(M), zY = S.zscores(Y);
    const fm = S.ols(zX.map((x) => [x]), zM), fy = S.ols(zX.map((x, i) => [x, zM[i]]), zY), ft = S.ols(zX.map((x) => [x]), zY);
    const est = { a: fm.b[1], c: fy.b[1], b: fy.b[2], pa: fm.p[1], pc: fy.p[1], pb: fy.p[2], r2m: fm.r2, r2y: fy.r2, tot: ft.b[1] };
    const show = v.est ? est : { a: v.a, b: v.b, c: v.c, pa: 0, pb: 0, pc: 0, r2m: v.a * v.a, r2y: Math.min(0.99, v.c * v.c + v.b * v.b + 2 * v.c * v.b * v.a) };
    ctx.state.last = est;

    const dg = ctx.state.dg.clear();
    dg.node('X', { x: 90, y: 220, label: 'X', sub: '독립변수' });
    dg.node('M', { x: 320, y: 70, label: 'M', sub: `R² = ${S.apa(show.r2m, 2)}` });
    dg.node('Y', { x: 550, y: 220, label: 'Y', sub: `R² = ${S.apa(show.r2y, 2)}` });
    dg.node('e1', { x: 320, y: 16, type: 'err', label: 'e1' });
    dg.node('e2', { x: 610, y: 150, type: 'err', label: 'e2' });
    const sig = (p) => !v.est || p < 0.05;
    dg.path('X', 'M', { value: show.a, label: S.f(show.a, 2) + (v.est ? S.stars(show.pa) : ''), dim: !sig(show.pa) });
    dg.path('M', 'Y', { value: show.b, label: S.f(show.b, 2) + (v.est ? S.stars(show.pb) : ''), dim: !sig(show.pb) });
    dg.path('X', 'Y', { value: show.c, label: S.f(show.c, 2) + (v.est ? S.stars(show.pc) : ''), dim: !sig(show.pc) });
    dg.path('e1', 'M', { label: '1', width: 1.2 });
    dg.path('e2', 'Y', { label: '1', width: 1.2 });
    dg.note(320, 290, v.est ? `표본 추정치 (N = ${n}) · 점선 = p ≥ .05 · * p<.05 ** p<.01 *** p<.001` : '모집단(참) 경로계수');

    const ind = show.a * show.b, tot = v.est ? est.tot : show.c + ind, C = Lab.C;
    const bp = ctx.state.bar; bp.clear(); bp.hline(0, { color: C.ink2, width: 1 });
    bp.bars([
      { x: '직접효과 c′', y: show.c, color: C.s1, tip: () => `직접효과 ${S.f(show.c, 3)}` },
      { x: '간접효과 a×b', y: ind, color: C.s2, tip: () => `간접효과 ${S.f(show.a, 2)} × ${S.f(show.b, 2)} = ${S.f(ind, 3)}` },
      { x: '총효과 c', y: tot, color: C.s3, tip: () => `총효과 ${S.f(tot, 3)}` },
    ], { labels: (d) => S.f(d.y, 2) });

    const ratio = Math.abs(tot) > 0.02 ? ind / tot : NaN;
    ctx.readout([
      { label: '간접효과 a×b', value: S.f(ind, 3), tone: 'accent' },
      { label: "직접효과 c′", value: S.f(show.c, 3) },
      { label: '총효과 c', value: S.f(tot, 3) },
      { label: '매개 비율 (a×b / c)', value: isFinite(ratio) ? S.pct(ratio, 0) : '—', sub: '총효과 중 간접효과 몫' },
    ]);
    let msg;
    if (Math.sign(ind) !== Math.sign(show.c) && Math.abs(show.c) > 0.08 && Math.abs(ind) > 0.05) msg = `직접효과(${S.f(show.c, 2)})와 간접효과(${S.f(ind, 2)})의 부호가 반대라서 서로 상쇄됩니다. 총효과만 보면 X의 영향을 과소평가하게 됩니다.`;
    else if (Math.abs(show.c) < 0.06 && Math.abs(ind) > 0.08) msg = 'X의 영향이 거의 전부 M을 거쳐 Y로 갑니다. 완전매개에 가까운 모형입니다.';
    else if (Math.abs(ind) < 0.03) msg = 'a나 b 중 하나가 0에 가까워 간접효과가 사라졌습니다. M은 매개변수 역할을 하지 못합니다.';
    else msg = `총효과 ${S.f(tot, 2)} 중 ${isFinite(ratio) ? S.pct(ratio, 0) : '일부'}가 M을 거쳐 전달됩니다. 직접효과도 남아 있는 부분매개입니다.`;
    ctx.insight(msg);
  },
});
