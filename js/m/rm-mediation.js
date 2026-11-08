/* 행동연구방법론 · 매개효과: Baron & Kenny 4단계와 Sobel 검정 */
Lab.add({
  id: 'rm-mediation', subject: 'rm', order: 6,
  title: '매개효과: Baron & Kenny와 Sobel 검정', en: 'Mediation testing · causal steps, Sobel z',
  summary: '고전적인 4단계 매개 검증을 직접 돌려 보고, 1단계(X→Y 총효과)가 유의하지 않아도 매개효과가 존재할 수 있는 경우를 확인합니다.',
  keywords: 'mediation 매개 baron kenny sobel 간접효과 인과단계 process model 4',
  controls: [
    { type: 'slider', key: 'a', label: '경로 a (X → M)', min: -0.8, max: 0.8, step: 0.05, value: 0.4 },
    { type: 'slider', key: 'b', label: '경로 b (M → Y, X 통제)', min: -0.8, max: 0.8, step: 0.05, value: 0.35 },
    { type: 'slider', key: 'c', label: "직접효과 c' (X → Y, M 통제)", min: -0.8, max: 0.8, step: 0.05, value: 0.1 },
    { type: 'slider', key: 'n', label: '표본크기 n', min: 30, max: 500, step: 10, value: 120 },
    { type: 'button', key: 'resample', label: '새 표본 뽑기', primary: true },
    { type: 'button', key: 'preset', label: '비일관 매개 예시' },
  ],
  concept: `
    <p>Baron과 Kenny(1986)의 인과단계 접근은 회귀분석 세 번으로 매개를 판단합니다.</p>
    <ol>
      <li>X → Y 총효과 <b>c</b>가 유의하다</li>
      <li>X → M 경로 <b>a</b>가 유의하다</li>
      <li>X를 통제한 상태에서 M → Y 경로 <b>b</b>가 유의하다</li>
      <li>M을 넣으면 X → Y 계수가 줄어든다 (c′ = 0이면 완전매개, 줄었지만 유의하면 부분매개)</li>
    </ol>
    <p>지금은 이 방법을 그대로 쓰지 않는 편입니다. 매개효과의 크기는 <b>a × b</b> 하나인데, 4단계는 이것을 직접 검정하지 않고 여러 번의 검정을 이어 붙이므로 검정력이 낮습니다. 특히 c′와 a×b의 부호가 반대이면 둘이 상쇄되어 <em>1단계가 실패해도 매개효과는 뚜렷할 수 있습니다</em>.</p>
    <p>Sobel 검정은 a×b를 표준오차로 나눈 z로 간접효과를 직접 검정하지만, a×b의 표본분포가 정규분포가 아니라서 작은 표본에서는 보수적입니다. 현재 표준은 <b>부트스트랩 신뢰구간</b>(PROCESS Model 4, AMOS bootstrap)이며 구조방정식 과목의 부트스트랩 실험에서 다룹니다.</p>`,
  formula: `1단계: Y = <var>c</var>·X + e<br>2단계: M = <var>a</var>·X + e<br>3·4단계: Y = <var>c′</var>·X + <var>b</var>·M + e<br>Sobel z = <var>ab</var> / √(<var>b</var>²·SE<sub>a</sub>² + <var>a</var>²·SE<sub>b</sub>²)`,
  tasks: [
    "'비일관 매개 예시'를 눌러 보세요. 1단계는 실패했는데 Sobel 검정은 어떻게 나오나요?",
    "c'를 0으로 두면 완전매개가 됩니다. 4단계 판정이 '완전매개'로 나오는 데 필요한 n은 대략 얼마인가요?",
    'a = 0.2, b = 0.2, n = 60에서 각 단계의 p값을 보고, n을 400으로 늘리면 판정이 어떻게 달라지는지 비교하세요.',
  ],
  tools: {
    r: (p) => `# Baron & Kenny 3개 회귀
summary(lm(Y ~ X, data = df))        # 1단계: c
summary(lm(M ~ X, data = df))        # 2단계: a
summary(lm(Y ~ X + M, data = df))    # 3·4단계: c', b

# 간접효과 검정 (부트스트랩 권장)
library(mediation)
med <- mediate(lm(M ~ X, df), lm(Y ~ X + M, df), treat = "X", mediator = "M", boot = TRUE, sims = 5000)
summary(med)    # ACME = 간접효과
# 현재 설정: a = ${p.a}, b = ${p.b}, c' = ${p.c}, n = ${p.n}`,
    spss: () => `* Hayes PROCESS v4 Model 4: 단순 매개 (간접효과 부트스트랩 CI)
PROCESS y=Y /x=X /m=M
  /model=4
  /total=1
  /normal=1
  /boot=5000
  /seed=2026.
* /normal=1 이 Sobel 검정, /total=1 이 1단계 총효과를 출력합니다.

* PROCESS 없이 Baron & Kenny 단계
REGRESSION /DEPENDENT Y /METHOD=ENTER X.
REGRESSION /DEPENDENT M /METHOD=ENTER X.
REGRESSION /DEPENDENT Y /METHOD=ENTER X M.`,
  },
  init(ctx) {
    const row = ctx.row(), c1 = ctx.box('', row), c2 = ctx.box('', row);
    ctx.state.d1 = ctx.diagram({ width: 300, height: 220, title: '1단계: 총효과 모형' }, c1);
    ctx.state.d2 = ctx.diagram({ width: 300, height: 220, title: '2~4단계: 매개모형' }, c2);
    ctx.state.tbl = ctx.box('');
    ctx.state.seed = 4;
  },
  update(ctx, v, changed) {
    const st = ctx.state, C = Lab.C;
    if (changed === 'resample') st.seed++;
    if (changed === 'preset') { ctx.set('a', 0.5, true); ctx.set('b', 0.5, true); ctx.set('c', -0.25, true); ctx.set('n', 150, true); v = ctx.p; }
    S.seed(st.seed);
    const n = v.n, X = [], M = [], Y = [];
    const vm = Math.max(0.05, 1 - v.a * v.a), expl = v.c * v.c + v.b * v.b + 2 * v.c * v.b * v.a, vy = Math.max(0.05, 1 - expl);
    for (let i = 0; i < n; i++) { const x = S.randn(), m = v.a * x + Math.sqrt(vm) * S.randn(); X.push(x); M.push(m); Y.push(v.c * x + v.b * m + Math.sqrt(vy) * S.randn()); }
    const zX = S.zscores(X), zM = S.zscores(M), zY = S.zscores(Y);
    const s1 = S.ols(zX.map((x) => [x]), zY), s2 = S.ols(zX.map((x) => [x]), zM), s3 = S.ols(zX.map((x, i) => [x, zM[i]]), zY);
    const c = s1.b[1], pc = s1.p[1], a = s2.b[1], pa = s2.p[1], sa = s2.se[1], cp = s3.b[1], pcp = s3.p[1], b = s3.b[2], pb = s3.p[2], sb = s3.se[2];
    const ab = a * b, sobSE = Math.sqrt(b * b * sa * sa + a * a * sb * sb), z = ab / sobSE, pz = 2 * (1 - S.pnorm(Math.abs(z)));
    const ok1 = pc < 0.05, ok2 = pa < 0.05, ok3 = pb < 0.05, ok4 = Math.abs(cp) < Math.abs(c);
    let verdict;
    if (!(ok1 && ok2 && ok3)) verdict = '매개 없음 (B&K 기준)';
    else if (pcp >= 0.05) verdict = '완전매개';
    else verdict = ok4 ? '부분매개' : '매개 불분명';

    const sig = (p) => p < 0.05;
    const d1 = st.d1.clear();
    d1.node('X', { x: 50, y: 110, label: 'X', w: 70 }); d1.node('Y', { x: 250, y: 110, label: 'Y', w: 70 });
    d1.path('X', 'Y', { value: c, label: `c = ${S.f(c, 2)}${S.stars(pc)}`, dim: !sig(pc) });
    d1.note(150, 195, `p ${S.fp(pc)} · ${ok1 ? '1단계 충족' : '1단계 실패'}`);
    const d2 = st.d2.clear();
    d2.node('X', { x: 45, y: 165, label: 'X', w: 64 }); d2.node('M', { x: 150, y: 45, label: 'M', w: 64 }); d2.node('Y', { x: 255, y: 165, label: 'Y', w: 64 });
    d2.path('X', 'M', { value: a, label: `a ${S.f(a, 2)}${S.stars(pa)}`, dim: !sig(pa) });
    d2.path('M', 'Y', { value: b, label: `b ${S.f(b, 2)}${S.stars(pb)}`, dim: !sig(pb) });
    d2.path('X', 'Y', { value: cp, label: `c′ ${S.f(cp, 2)}${S.stars(pcp)}`, dim: !sig(pcp) });
    d2.note(150, 212, `간접효과 a×b = ${S.f(ab, 3)} · Sobel p ${S.fp(pz)}`);

    const mark = (ok) => `<b style="color:${ok ? 'var(--good)' : 'var(--bad)'}">${ok ? '✓ 충족' : '✗ 미충족'}</b>`;
    st.tbl.innerHTML = Lab.spssTable({
      title: 'Baron & Kenny 인과단계 검증', sub: `표준화 계수, n = ${n}`,
      head: ['단계', '회귀식', '경로', 'β', 'p', '판정'],
      rows: [
        ['1', 'Y ← X', 'c (총효과)', S.f(c, 3), S.fp(pc), mark(ok1)],
        ['2', 'M ← X', 'a', S.f(a, 3), S.fp(pa), mark(ok2)],
        ['3', 'Y ← X + M', 'b', S.f(b, 3), S.fp(pb), mark(ok3)],
        ['4', 'Y ← X + M', "c′ (직접효과)", S.f(cp, 3), S.fp(pcp), `${mark(ok4)} <span style="color:var(--ink-3)">|c′| ${ok4 ? '<' : '≥'} |c|</span>`],
        ['Sobel', '—', 'a × b', S.f(ab, 3), S.fp(pz), mark(pz < 0.05)],
      ],
      note: `B&K 판정: <b>${verdict}</b> · Sobel z = ${S.f(z, 2)} · 간접효과 비율 a×b / c = ${Math.abs(c) > 0.03 ? S.pct(ab / c, 0) : '정의 안 됨 (c ≈ 0)'}`,
    });

    ctx.readout([
      { label: '총효과 c (1단계)', value: S.f(c, 3), sub: `p ${S.fp(pc)}`, tone: ok1 ? 'good' : 'bad' },
      { label: '간접효과 a×b', value: S.f(ab, 3), tone: 'accent' },
      { label: 'Sobel z', value: S.f(z, 2), sub: `p ${S.fp(pz)}`, tone: pz < 0.05 ? 'good' : 'bad' },
      { label: 'B&K 판정', value: verdict },
    ]);
    let msg;
    if (!ok1 && pz < 0.05) msg = `1단계 총효과가 유의하지 않아(p ${S.fp(pc)}) Baron & Kenny 기준으로는 "매개 없음"이지만, 간접효과 a×b = ${S.f(ab, 2)}는 Sobel 검정에서 유의합니다. ${Math.sign(cp) !== Math.sign(ab) ? `직접효과(${S.f(cp, 2)})가 반대 부호라 총효과를 상쇄했기 때문입니다.` : '총효과 검정의 검정력이 부족했기 때문입니다.'} 그래서 현재는 간접효과를 직접 검정합니다.`;
    else if (ok1 && ok2 && ok3) msg = `세 회귀 모두 조건을 충족해 <b>${verdict}</b>로 판정됩니다. M을 통제하자 X의 계수가 ${S.f(c, 2)}에서 ${S.f(cp, 2)}로 ${ok4 ? '줄었습니다' : '줄지 않았습니다'}.`;
    else if (pz >= 0.05) msg = `간접효과 ${S.f(ab, 3)}가 유의하지 않습니다. ${!ok2 ? 'a 경로' : 'b 경로'}가 약해서 M이 X의 영향을 전달하지 못합니다.`;
    else msg = `일부 단계가 충족되지 않아 B&K 기준으로는 매개를 주장하기 어렵지만, Sobel 검정은 유의합니다(p ${S.fp(pz)}). 단계별 판정보다 간접효과 자체의 신뢰구간을 보고하세요.`;
    ctx.insight(msg);
  },
});
