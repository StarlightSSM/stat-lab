/* MIS · 기술수용모형 (TAM) — simulate survey respondents from chosen population paths, estimate with OLS on z-scores. */
Lab.add({
  id: 'mis-tam', subject: 'mis', order: 1,
  title: '기술수용모형 TAM', en: 'Technology Acceptance Model (Davis, 1989)',
  summary: '인지된 사용용이성과 유용성이 사용의도와 실제 사용으로 이어지는 경로를 조절하고, 설문 표본에서 경로계수를 추정해 봅니다.',
  keywords: 'TAM 기술수용 유용성 용이성 사용의도 UTAUT davis',
  controls: [
    { type: 'slider', key: 'g', label: '외부변수 → 용이성 (γ)', min: 0, max: 0.8, step: 0.05, value: 0.45, hint: '시스템 품질·교육훈련이 사용 편의 인식을 얼마나 높이는가' },
    { type: 'slider', key: 'a', label: '용이성 → 유용성 (a)', min: 0, max: 0.8, step: 0.05, value: 0.4 },
    { type: 'slider', key: 'b1', label: '유용성 → 사용의도 (b₁)', min: 0, max: 0.8, step: 0.05, value: 0.5 },
    { type: 'slider', key: 'b2', label: '용이성 → 사용의도 (b₂)', min: 0, max: 0.6, step: 0.05, value: 0.15 },
    { type: 'slider', key: 'c', label: '사용의도 → 실제 사용 (c)', min: 0, max: 0.9, step: 0.05, value: 0.6 },
    { type: 'heading', label: '도입 조건' },
    { type: 'slider', key: 'train', label: '교육·품질 투자 수준', min: -1, max: 1.5, step: 0.1, value: 0, hint: '외부변수 평균을 이동 (0 = 현재 수준)' },
    { type: 'slider', key: 'n', label: '응답자 수 N', min: 50, max: 800, step: 10, value: 250 },
    { type: 'button', key: 'resample', label: '새 설문 표본', primary: true },
  ],
  concept: `
    <p>Davis(1989)의 <b>기술수용모형</b>은 사람들이 새 정보시스템을 받아들이는 이유를 두 가지 믿음으로 설명합니다. <b>인지된 유용성(PU)</b>은 "이 시스템이 내 업무 성과를 높여 준다"는 믿음, <b>인지된 사용용이성(PEOU)</b>은 "이 시스템은 쓰기 쉽다"는 믿음입니다.</p>
    <ul>
      <li>PEOU는 PU를 높이고(쉬우면 더 쓸모 있어 보임), 둘 다 사용의도(BI)를 높입니다.</li>
      <li>사용의도는 실제 사용 행동의 가장 가까운 선행요인입니다(Fishbein & Ajzen의 합리적 행동이론에서 차용).</li>
      <li>시스템 품질, 교육훈련, 지원 같은 <b>외부변수</b>는 믿음을 거쳐서만 행동에 영향을 줍니다.</li>
    </ul>
    <p>실증연구에서는 대체로 PU → BI 경로가 PEOU → BI 경로보다 강하게 나타납니다. 용이성은 주로 유용성을 거쳐 간접적으로 작용합니다.</p>
    <p>Venkatesh 외(2003)의 <em>UTAUT</em>는 TAM을 확장해 성과기대, 노력기대, 사회적 영향, 촉진조건의 네 요인과 성별·연령·경험·자발성의 조절효과를 넣었습니다. 연구에서는 보통 리커트 척도 설문을 받고 구조방정식(AMOS, lavaan)으로 경로를 추정합니다.</p>`,
  formula: `PEOU = γ·Ext + ζ₁<br>PU = <var>a</var>·PEOU + ζ₂<br>BI = <var>b₁</var>·PU + <var>b₂</var>·PEOU + ζ₃<br>USE = <var>c</var>·BI + ζ₄<br>PEOU → BI 총효과 = <var>b₂</var> + <var>a</var>·<var>b₁</var>`,
  tasks: [
    'b₂를 0으로 내려 보세요. 용이성이 사용의도에 주는 영향이 사라지나요? 간접효과(a×b₁) 막대를 확인하세요.',
    '교육·품질 투자 수준을 0에서 1.5로 올리면 도입률이 얼마나 달라지나요? γ = 0일 때와 비교해 보세요.',
    'N = 50에서 새 설문 표본을 여러 번 뽑아 보세요. 추정된 b₂가 유의하지 않게(점선) 나오는 경우가 생깁니다.',
    'c를 0.3으로 낮추면 의도는 높아도 실제 사용이 따라오지 않습니다. 의도-행동 격차를 줄일 수 있는 관리 방안을 생각해 보세요.',
  ],
  tools: {
    lavaan: (p) => `library(lavaan)
# 설문 문항: ext1-3, peou1-4, pu1-4, bi1-3, use1-2 (리커트 7점)
model <- '
  # 측정모형
  EXT  =~ ext1 + ext2 + ext3
  PEOU =~ peou1 + peou2 + peou3 + peou4
  PU   =~ pu1 + pu2 + pu3 + pu4
  BI   =~ bi1 + bi2 + bi3
  USE  =~ use1 + use2
  # 구조모형
  PEOU ~ g*EXT
  PU   ~ a*PEOU
  BI   ~ b1*PU + b2*PEOU
  USE  ~ c*BI
  ind_peou_bi := a*b1
  tot_peou_bi := b2 + a*b1
'
fit <- sem(model, data = survey, se = "bootstrap", bootstrap = 2000)
summary(fit, standardized = TRUE, fit.measures = TRUE)
# 이 시뮬레이션의 모집단 값: g=${p.g}, a=${p.a}, b1=${p.b1}, b2=${p.b2}, c=${p.c}`,
    amos: (p) => `[AMOS Graphics]
1. 잠재변수(타원) 5개: EXT, PEOU, PU, BI, USE
2. 각 잠재변수에 측정문항(사각형)과 오차항 연결
   (첫 문항 요인적재량을 1로 고정)
3. 경로: EXT→PEOU, PEOU→PU, PU→BI, PEOU→BI, BI→USE
4. 내생 잠재변수(PEOU, PU, BI, USE)에 구조오차 d1-d4 추가
5. Analysis Properties > Output: Standardized estimates,
   Squared multiple correlations, Indirect/direct/total effects
6. Bootstrap 2000회, bias-corrected 95% CI → PEOU→BI 간접효과 유의성

N = ${p.n}`,
    r: (p) => `# 관측변수(척도 평균점수)로 경로를 회귀식 4개로 추정
m1 <- lm(scale(PEOU) ~ scale(EXT), data = survey)
m2 <- lm(scale(PU)   ~ scale(PEOU), data = survey)
m3 <- lm(scale(BI)   ~ scale(PU) + scale(PEOU), data = survey)
m4 <- lm(scale(USE)  ~ scale(BI), data = survey)
lapply(list(m1, m2, m3, m4), summary)
# 간접효과 a*b1 = coef(m2)[2] * coef(m3)[2]`,
  },
  init(ctx) {
    ctx.state.dg = ctx.diagram({ width: 660, height: 300 });
    const row = ctx.row(), c1 = ctx.box('', row), c2 = ctx.box('', row);
    ctx.state.sc = ctx.plot({ x: [-3.5, 3.5], y: [-3.5, 3.5], height: 250, xLabel: '인지된 유용성 PU (z)', yLabel: '사용의도 BI (z)', title: '응답자별 PU와 사용의도' }, c1);
    ctx.state.bar = ctx.plot({ xBand: ['직접 b₂', '간접 a×b₁', '총효과'], y: [0, 0.9], height: 250, yLabel: '표준화 효과', title: '용이성(PEOU)이 사용의도에 주는 효과' }, c2);
    ctx.state.seed = 11;
  },
  update(ctx, v, changed) {
    if (changed === 'resample') ctx.state.seed++;
    S.seed(ctx.state.seed);
    const n = v.n, res = (expl) => Math.sqrt(Math.max(0.05, 1 - expl));
    const E = [], P = [], U = [], B = [], A = [];
    const rBI = res(v.b1 * v.b1 + v.b2 * v.b2 + 2 * v.b1 * v.b2 * v.a);
    for (let i = 0; i < n; i++) {
      const ext = S.randn() + v.train;
      const peou = v.g * ext + res(v.g * v.g) * S.randn();
      const pu = v.a * peou + res(v.a * v.a) * S.randn();
      const bi = v.b1 * pu + v.b2 * peou + rBI * S.randn();
      const use = v.c * bi + res(v.c * v.c) * S.randn();
      E.push(ext); P.push(peou); U.push(pu); B.push(bi); A.push(use);
    }
    // adoption: actual use above a fixed threshold (raw scale, so investment shifts it)
    const adopt = A.filter((x) => x > 0.5).length / n;
    const z = (a) => S.zscores(a), zE = z(E), zP = z(P), zU = z(U), zB = z(B), zA = z(A);
    const f1 = S.ols(zE.map((x) => [x]), zP), f2 = S.ols(zP.map((x) => [x]), zU), f3 = S.ols(zU.map((x, i) => [x, zP[i]]), zB), f4 = S.ols(zB.map((x) => [x]), zA);
    const est = { g: f1.b[1], a: f2.b[1], b1: f3.b[1], b2: f3.b[2], c: f4.b[1], pg: f1.p[1], pa: f2.p[1], pb1: f3.p[1], pb2: f3.p[2], pc: f4.p[1] };

    const dg = ctx.state.dg.clear();
    dg.node('EXT', { x: 75, y: 160, type: 'lat', w: 104, label: '외부변수', sub: '품질·교육' });
    dg.node('PEOU', { x: 235, y: 240, type: 'lat', label: '사용용이성', sub: `PEOU · R²=${S.apa(f1.r2, 2)}` });
    dg.node('PU', { x: 235, y: 75, type: 'lat', label: '유용성', sub: `PU · R²=${S.apa(f2.r2, 2)}` });
    dg.node('BI', { x: 420, y: 160, type: 'lat', label: '사용의도', sub: `BI · R²=${S.apa(f3.r2, 2)}` });
    dg.node('USE', { x: 585, y: 160, type: 'obs', w: 100, h: 46, label: '실제 사용', sub: `R²=${S.apa(f4.r2, 2)}` });
    const sg = (p) => p < 0.05, lab = (b, p) => S.f(b, 2) + S.stars(p);
    dg.path('EXT', 'PEOU', { value: est.g, label: lab(est.g, est.pg), dim: !sg(est.pg) });
    dg.path('PEOU', 'PU', { value: est.a, label: lab(est.a, est.pa), dim: !sg(est.pa) });
    dg.path('PU', 'BI', { value: est.b1, label: lab(est.b1, est.pb1), dim: !sg(est.pb1) });
    dg.path('PEOU', 'BI', { value: est.b2, label: lab(est.b2, est.pb2), dim: !sg(est.pb2) });
    dg.path('BI', 'USE', { value: est.c, label: lab(est.c, est.pc), dim: !sg(est.pc) });
    dg.note(330, 292, `표본 추정치 (N = ${n}) · 점선 = p ≥ .05 · * p<.05 ** p<.01 *** p<.001`);

    const C = Lab.C, sc = ctx.state.sc; sc.clear();
    const step = Math.max(1, Math.floor(n / 300));
    const pts = []; for (let i = 0; i < n; i += step) pts.push({ x: S.clamp(zU[i], -3.4, 3.4), y: S.clamp(zB[i], -3.4, 3.4), color: A[i] > 0.5 ? C.s1 : C.muted });
    sc.dots(pts, { r: 3, opacity: 0.6, ring: false });
    const r = S.cor(zU, zB); sc.line([[-3.5, -3.5 * r], [3.5, 3.5 * r]], { color: C.marker, width: 2 });
    sc.legend([{ label: '실제 사용자', color: C.s1, type: 'dot' }, { label: '미사용자', color: C.muted, type: 'dot' }, { label: `회귀선 r = ${S.f(r, 2)}`, color: C.marker, type: 'line' }]);

    const ind = est.a * est.b1, tot = est.b2 + ind, bp = ctx.state.bar; bp.clear();
    bp.setY([Math.min(0, est.b2, tot) - 0.05, Math.max(0.6, tot + 0.15)]);
    bp.hline(0, { color: C.ink2, width: 1 });
    bp.bars([
      { x: '직접 b₂', y: est.b2, color: C.s1, tip: () => `직접효과 ${S.f(est.b2, 3)}` },
      { x: '간접 a×b₁', y: ind, color: C.s2, tip: () => `간접효과 ${S.f(est.a, 2)} × ${S.f(est.b1, 2)} = ${S.f(ind, 3)}` },
      { x: '총효과', y: tot, color: C.s3, tip: () => `총효과 ${S.f(tot, 3)}` },
    ], { labels: (d) => S.f(d.y, 2) });

    ctx.readout([
      { label: '도입률 (실제 사용 비율)', value: S.pct(adopt, 0), tone: 'accent', sub: `${Math.round(adopt * n)} / ${n}명` },
      { label: '사용의도 R²', value: S.apa(f3.r2, 2), sub: 'PU, PEOU로 설명' },
      { label: 'PEOU → BI 간접효과', value: S.f(ind, 3) },
      { label: 'PU → BI 추정', value: S.f(est.b1, 2) + S.stars(est.pb1) },
    ]);
    let msg;
    if (est.b1 > est.b2 * 2 && ind > est.b2) msg = `용이성의 영향은 주로 유용성을 거쳐 전달됩니다(간접 ${S.f(ind, 2)} vs 직접 ${S.f(est.b2, 2)}). "쉬우니까 쓸모 있어 보인다"는 TAM의 전형적인 결과입니다.`;
    else if (est.b2 >= est.b1) msg = `용이성이 유용성보다 사용의도에 더 직접적으로 작용합니다. 초보 사용자나 사용이 의무가 아닌 상황에서 나타날 수 있는 패턴입니다.`;
    else msg = `유용성과 용이성이 함께 사용의도를 설명합니다 (R² = ${S.apa(f3.r2, 2)}).`;
    if (v.train > 0.5) msg += ` 교육·품질 투자로 외부변수 수준을 올려 도입률이 ${S.pct(adopt, 0)}가 되었습니다.`;
    else if (v.c < 0.35) msg += ' 다만 의도 → 사용 경로가 약해서 의도가 실제 사용으로 잘 이어지지 않습니다.';
    ctx.insight(msg);
  },
});
