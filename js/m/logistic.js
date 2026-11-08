/* 로지스틱 회귀: sigmoid over 0/1 outcomes, odds ratio, threshold → confusion matrix. */
Lab.add({
  id: 'logistic', subject: 'prob', order: 16,
  title: '로지스틱 회귀', en: 'Logistic regression · odds ratio · classification',
  summary: '결과가 0/1일 때 확률을 S자 곡선으로 모형화합니다. 계수를 바꾸며 오즈비의 의미를 익히고, 분류 기준값을 옮겨 혼동행렬이 어떻게 달라지는지 봅니다.',
  keywords: 'logistic regression 로지스틱 오즈비 odds ratio 혼동행렬 민감도 특이도 glm',
  controls: [
    { type: 'slider', key: 'b0', label: '참 절편 β₀', min: -4, max: 4, step: 0.1, value: -0.5 },
    { type: 'slider', key: 'b1', label: '참 기울기 β₁', min: -3, max: 3, step: 0.1, value: 1.2, hint: 'x가 1 늘 때 로그오즈의 변화량' },
    { type: 'slider', key: 'n', label: '표본크기 n', min: 30, max: 500, step: 10, value: 150 },
    { type: 'slider', key: 'thr', label: '분류 기준값 (cutoff)', min: 0.05, max: 0.95, step: 0.05, value: 0.5 },
    { type: 'toggle', key: 'truth', label: '참 확률곡선 표시', value: true },
    { type: 'button', key: 'resample', label: '새 표본 뽑기', primary: true },
  ],
  concept: `
    <p>구매 여부, 합격 여부처럼 종속변수가 0/1이면 선형회귀는 0보다 작거나 1보다 큰 확률을 예측해 버립니다. 로지스틱 회귀는 확률 p 대신 <b>로그오즈 log(p / (1−p))</b>를 X의 선형식으로 놓아 예측값이 항상 0과 1 사이에 머무르게 합니다.</p>
    <ul>
      <li><b>오즈(odds)</b> = p / (1 − p). p = .8이면 오즈는 4, 즉 "성공이 실패보다 4배 흔하다"입니다.</li>
      <li>β₁은 X가 1 늘 때 로그오즈의 변화량이고, <em>e<sup>β₁</sup> = 오즈비(OR)</em>는 X가 1 늘 때 오즈가 몇 배가 되는지를 뜻합니다. OR = 1이면 효과 없음.</li>
      <li>확률 자체의 변화량은 곡선의 위치마다 다릅니다. p = .5 근처에서 가장 가파르고 양 끝에서는 완만합니다.</li>
    </ul>
    <p>계수는 최소제곱이 아니라 <b>최대우도법</b>으로 추정합니다. 모형 적합은 −2LL, 모형 χ², Nagelkerke R²(유사 R²)로 봅니다.</p>
    <p>예측확률을 0/1로 바꾸려면 <b>기준값(cutoff)</b>이 필요합니다. 기준값을 낮추면 1을 더 많이 잡아내지만(민감도↑) 0을 1로 잘못 분류하는 경우도 늘어납니다(특이도↓). 이 교환관계를 모든 기준값에 대해 그린 것이 ROC 곡선입니다.</p>`,
  formula: `log( <var>p</var> / (1−<var>p</var>) ) = β₀ + β₁<var>x</var><br>
    <var>p</var> = 1 / (1 + e<sup>−(β₀ + β₁<var>x</var>)</sup>)<br>
    OR = e<sup>β₁</sup> &nbsp; <span class="c">x가 1 늘 때 오즈의 배수</span><br>
    민감도 = TP/(TP+FN), &nbsp; 특이도 = TN/(TN+FP)`,
  tasks: [
    'β₁ = 0.7로 맞추고 오즈비를 확인하세요. "x가 1 늘면 확률이 0.7 늘어난다"는 해석이 왜 틀렸는지 설명해 보세요.',
    'β₀만 −3에서 +3으로 움직여 보세요. 곡선의 모양은 그대로인데 무엇이 바뀌나요? p = .5가 되는 x는 −β₀/β₁입니다.',
    '기준값을 0.2와 0.8로 바꾸며 민감도와 특이도를 기록하세요. 질병 선별검사라면 어느 쪽을 택하겠습니까?',
    'β₁ = 3으로 두면 곡선이 계단처럼 가팔라집니다. n = 30에서 추정치와 표준오차가 불안정해지는지 확인하세요(완전 분리 문제).',
  ],
  tools: {
    r: (p) => `set.seed(1)
n <- ${p.n}
x <- runif(n, -4, 4)
y <- rbinom(n, 1, plogis(${p.b0} + ${p.b1} * x))

fit <- glm(y ~ x, family = binomial)
summary(fit)                      # 계수(로그오즈), SE, z, p
exp(cbind(OR = coef(fit), confint(fit)))   # 오즈비와 95% CI

phat <- predict(fit, type = "response")
pred <- ifelse(phat >= ${p.thr}, 1, 0)
table(실제 = y, 예측 = pred)       # 혼동행렬
pROC::roc(y, phat)                # AUC`,
    spss: (p) => `* 메뉴: 분석 > 회귀분석 > 이분형 로지스틱
*   종속변수 = y, 공변량 = x
*   [옵션] 분류도표, exp(B)에 대한 신뢰구간 95%, 분류 기준값 ${p.thr}
LOGISTIC REGRESSION VARIABLES y
  /METHOD=ENTER x
  /CLASSPLOT
  /PRINT=GOODFIT CI(95)
  /CRITERIA=PIN(0.05) POUT(0.10) ITERATE(20) CUT(${p.thr}).

* 'Exp(B)' 열이 오즈비, '분류표'가 혼동행렬입니다.`,
  },
  init(ctx) {
    ctx.state.sp = ctx.plot({ x: [-4, 4], y: [-0.08, 1.08], height: 320, xLabel: 'x', yLabel: 'P(y = 1)', title: '관측값(0/1)과 추정 확률곡선' });
    const row = ctx.row(), a = ctx.box('', row), b = ctx.box('', row);
    ctx.state.cm = a;
    ctx.state.op = ctx.plot({ x: [-4, 4], y: [0, 10], height: 220, xLabel: 'x', yLabel: '오즈 p/(1−p)', title: '같은 모형을 오즈로 보면 (로그 축 아님)' }, b);
    ctx.state.seed = 71;
    ctx.state.gen = () => { S.seed(ctx.state.seed); ctx.state.ux = Array.from({ length: 500 }, () => S.runif(-4, 4)); ctx.state.uu = Array.from({ length: 500 }, () => S.rand()); ctx.state.jj = Array.from({ length: 500 }, () => S.runif(-1, 1)); };
    ctx.state.gen();
  },
  update(ctx, v, changed) {
    const st = ctx.state, C = Lab.C, sig = (z) => 1 / (1 + Math.exp(-z));
    if (changed === 'resample') { st.seed++; st.gen(); }
    const x = st.ux.slice(0, v.n), y = x.map((xi, i) => (st.uu[i] < sig(v.b0 + v.b1 * xi) ? 1 : 0));
    const ones = S.sum(y), degenerate = ones === 0 || ones === v.n;
    const m = degenerate ? null : S.logit(x.map((a) => [a]), y);
    const bh0 = m ? m.b[0] : NaN, bh1 = m ? m.b[1] : NaN, ph = (xx) => sig(bh0 + bh1 * xx);

    const sp = st.sp; sp.clear();
    sp.hline(v.thr, { color: C.s7, dash: true, width: 1.2, label: `기준값 ${v.thr}`, anchor: 'start', layer: 'under' });
    const xs = S.linspace(-4, 4, 160);
    if (v.truth) sp.line(xs.map((xx) => [xx, sig(v.b0 + v.b1 * xx)]), { color: C.muted, width: 1.5, dash: true });
    const pts = x.map((xi, i) => ({ x: xi, y: y[i] + (y[i] ? -1 : 1) * (0.025 + 0.03 * Math.abs(st.jj[i])), color: y[i] ? C.s1 : C.s2 }));
    sp.dots(pts, { r: v.n > 250 ? 2.6 : 3.4, opacity: 0.55, ring: false, tip: (d) => `x = ${S.f(d.x, 2)}, y = ${y[d.i]}${m ? `<br>추정 p = ${S.f(ph(d.x), 3)}` : ''}` });
    let cut = NaN;
    if (m) {
      sp.line(xs.map((xx) => [xx, ph(xx)]), { color: C.ink, width: 2.5 });
      cut = (Math.log(v.thr / (1 - v.thr)) - bh0) / bh1;
      if (isFinite(cut) && cut > -4 && cut < 4) { sp.vline(cut, { color: C.s7, width: 1.2, label: `x* = ${S.f(cut, 2)}`, labelY: 50, anchor: cut > 2 ? 'end' : 'start' }); sp.dots([[cut, v.thr]], { color: C.s7, r: 5, opacity: 1 }); }
    }
    sp.legend([{ label: 'y = 1', color: C.s1, type: 'dot' }, { label: 'y = 0', color: C.s2, type: 'dot' }, { label: '추정 확률곡선', color: C.ink, type: 'line' }, ...(v.truth ? [{ label: '참 확률곡선', color: C.muted, type: 'dash' }] : []), { label: '기준값', color: C.s7, type: 'dash' }]);

    // odds plot
    const op = st.op, oddsMax = 12; op.setY([0, oddsMax]); op.clear();
    if (m) {
      op.line(xs.map((xx) => { const o = Math.exp(bh0 + bh1 * xx); return [xx, o <= oddsMax ? o : NaN]; }), { color: C.ink, width: 2 });
      op.hline(1, { color: C.muted, dash: true, width: 1, label: '오즈 = 1 (p = .5)', anchor: bh1 >= 0 ? 'start' : 'end' });
      const x0 = S.clamp(Math.round(-bh0 / bh1), -3, 2);
      [x0, x0 + 1].forEach((xx) => { const o = Math.exp(bh0 + bh1 * xx); if (o < oddsMax) op.dots([[xx, o]], { color: C.marker, r: 5, opacity: 1, tip: () => `x = ${xx}: 오즈 ${S.f(o, 2)}` }); });
      const o0 = Math.exp(bh0 + bh1 * x0), o1 = Math.exp(bh0 + bh1 * (x0 + 1));
      if (o1 < oddsMax && o0 < oddsMax) op.text(x0 + 0.5, Math.max(o0, o1), `×${S.f(m.or[1], 2)}`, { dy: -10 });
    }

    // confusion matrix
    let TP = 0, FP = 0, TN = 0, FN = 0;
    if (m) x.forEach((xi, i) => { const pr = ph(xi) >= v.thr ? 1 : 0; if (pr && y[i]) TP++; else if (pr && !y[i]) FP++; else if (!pr && !y[i]) TN++; else FN++; });
    const sens = TP / (TP + FN || 1), spec = TN / (TN + FP || 1), acc = (TP + TN) / v.n;
    const cell = (lab, val, good) => `<td style="padding:10px 12px;text-align:center;background:${good ? 'color-mix(in srgb, var(--good) 14%, transparent)' : 'color-mix(in srgb, var(--bad) 10%, transparent)'}"><div style="font-size:20px;font-weight:600;font-family:var(--f-sans)">${val}</div><div style="font-size:11px;color:var(--ink-3)">${lab}</div></td>`;
    st.cm.innerHTML = `<div class="spss-out"><div class="spss-title">분류표 (혼동행렬) · 기준값 ${v.thr}</div>
      <div class="tbl-scroll"><table class="data-tbl" style="margin-top:8px"><thead><tr><th></th><th style="text-align:center">예측 0</th><th style="text-align:center">예측 1</th><th>정분류</th></tr></thead><tbody>
      <tr><th style="text-align:left">실제 0</th>${cell('TN 참음성', TN, true)}${cell('FP 거짓양성', FP, false)}<td>${S.pct(spec)}</td></tr>
      <tr><th style="text-align:left">실제 1</th>${cell('FN 거짓음성', FN, false)}${cell('TP 참양성', TP, true)}<td>${S.pct(sens)}</td></tr>
      <tr><th style="text-align:left">전체</th><td></td><td></td><td><b>${S.pct(acc)}</b></td></tr></tbody></table></div>
      <div class="spss-note">정분류 열: 실제 0 행 = 특이도, 실제 1 행 = 민감도, 전체 = 정확도</div></div>`;

    if (!m) { ctx.readout([{ label: '추정 불가', value: '—', sub: 'y가 모두 0이거나 모두 1입니다' }]); ctx.insight('표본의 결과가 한쪽으로만 나와 모형을 추정할 수 없습니다. β₀를 0 쪽으로 옮기거나 n을 늘려 보세요.'); return; }
    ctx.readout([
      { label: 'β̂₁ (로그오즈)', value: S.f(bh1, 3), sub: `SE ${S.f(m.se[1], 3)} · p ${S.fp(m.p[1])} · 참값 ${v.b1}` },
      { label: '오즈비 e^β̂₁', value: S.f(m.or[1], 2), sub: `95% CI [${S.f(Math.exp(bh1 - 1.96 * m.se[1]), 2)}, ${S.f(Math.exp(bh1 + 1.96 * m.se[1]), 2)}]`, tone: 'accent' },
      { label: '정확도', value: S.pct(acc), sub: `민감도 ${S.pct(sens, 0)} · 특이도 ${S.pct(spec, 0)}` },
      { label: 'Nagelkerke R²', value: S.apa(m.nagelkerke, 3), sub: `모형 χ² ${S.f(m.chi2, 1)}` },
    ]);
    const or = m.or[1];
    let msg = `x가 1 늘 때 y = 1일 <b>오즈가 ${S.f(or, 2)}배</b>${or >= 1 ? `(${S.pct(or - 1, 0)} 증가)` : `(${S.pct(1 - or, 0)} 감소)`}가 됩니다. 확률이 아니라 오즈의 배수라는 점에 주의하세요.`;
    if (isFinite(cut)) msg += ` 기준값 ${v.thr}에서는 x ${bh1 > 0 ? '≥' : '≤'} ${S.f(cut, 2)}이면 1로 분류하며, 민감도 ${S.pct(sens, 0)} · 특이도 ${S.pct(spec, 0)}입니다.`;
    if (v.thr <= 0.3) msg += ' 기준값이 낮아 1을 놓치는 경우(FN)는 줄었지만 거짓양성(FP)이 늘었습니다.';
    else if (v.thr >= 0.7) msg += ' 기준값이 높아 거짓양성은 줄었지만 실제 1을 많이 놓칩니다.';
    if (Math.abs(bh1) > 4 || m.se[1] > 2) msg += ' 추정치가 매우 크고 불안정합니다. 두 집단이 거의 완전히 분리되어 최대우도 추정이 발산하는 상황입니다.';
    ctx.insight(msg);
  },
});
