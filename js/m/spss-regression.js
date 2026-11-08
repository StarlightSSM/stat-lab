/* SPSS · 회귀분석 출력 읽기 */
Lab.add({
  id: 'spss-regression', subject: 'spss', order: 3,
  title: '회귀분석 출력 읽기', en: 'Linear regression output · Model Summary, ANOVA, Coefficients, VIF',
  summary: '세 독립변수의 효과와 두 변수 사이의 상관(다중공선성)을 조절하며 SPSS 회귀 출력 세 표가 어떻게 달라지는지 봅니다.',
  keywords: 'regression 회귀 vif 공차 다중공선성 beta 표준화계수 모형요약 anova',
  controls: [
    { type: 'slider', key: 'b1', label: '서비스품질 → 만족도 (β)', min: -0.6, max: 0.6, step: 0.05, value: 0.4 },
    { type: 'slider', key: 'b2', label: '시스템품질 → 만족도 (β)', min: -0.6, max: 0.6, step: 0.05, value: 0.25 },
    { type: 'slider', key: 'b3', label: '가격공정성 → 만족도 (β)', min: -0.6, max: 0.6, step: 0.05, value: 0.1 },
    { type: 'slider', key: 'r12', label: '서비스품질 ↔ 시스템품질 상관', min: 0, max: 0.97, step: 0.01, value: 0.3, hint: '0.9 이상이면 다중공선성이 심해집니다.' },
    { type: 'slider', key: 'n', label: '표본크기 N', min: 30, max: 600, step: 10, value: 150 },
    { type: 'button', key: 'resample', label: '새 표본 뽑기', primary: true },
  ],
  concept: `
    <p><b>분석 &gt; 회귀분석 &gt; 선형</b>에서 종속변수와 독립변수를 넣고, [통계량]에서 <b>공선성 진단</b>을 체크하면 다음 세 표를 차례로 읽습니다.</p>
    <ul>
      <li><b>모형 요약</b> : R²는 독립변수들이 종속변수 분산의 몇 %를 설명하는지입니다. 변수가 많으면 R²가 저절로 커지므로 <b>수정된 R²</b>를 함께 봅니다.</li>
      <li><b>ANOVA</b> : "모든 회귀계수가 0이다"라는 귀무가설에 대한 F검정입니다. 유의확률 &lt; .05여야 모형 자체가 의미 있습니다.</li>
      <li><b>계수</b> : B(비표준화 계수)는 원래 단위로 X가 1 오를 때 Y의 변화량, <b>베타(표준화 계수)</b>는 변수 간 영향력 비교용입니다. 각 변수의 유의확률은 "다른 변수를 통제했을 때" 그 변수의 효과를 검정합니다.</li>
    </ul>
    <p><em>공차</em>와 <em>VIF</em>는 다중공선성 진단입니다. VIF = 1/공차이고, 보통 <b>VIF &gt; 10</b>(엄격하게는 5)이면 문제로 봅니다. 공선성이 높으면 R²는 그대로인데 개별 계수의 표준오차가 커져서, 실제로 효과가 있는 변수도 유의하지 않게 나오거나 부호가 뒤집힐 수 있습니다.</p>`,
  formula: `<var>Ŷ</var> = <var>b</var>₀ + <var>b</var>₁X₁ + <var>b</var>₂X₂ + <var>b</var>₃X₃<br>R² = SS<sub>회귀</sub> / SS<sub>전체</sub>, &nbsp; 수정 R² = 1 − (1−R²)(<var>n</var>−1)/(<var>n</var>−<var>k</var>−1)<br>VIF<sub><var>j</var></sub> = 1 / (1 − R<sub><var>j</var></sub>²) <span class="c">R<sub>j</sub>²: X<sub>j</sub>를 나머지 X로 회귀한 R²</span>`,
  tasks: [
    '상관을 0.3에서 0.95로 올려 보세요. R²는 거의 그대로인데 서비스품질·시스템품질의 표준오차와 VIF가 어떻게 변하나요?',
    '가격공정성 β를 0.1로 두고 N을 30과 600으로 바꿔 보세요. 같은 효과가 N에 따라 유의하기도, 안 하기도 합니다.',
    '서비스품질 β = 0.4, 시스템품질 β = 0, 상관 0.8로 맞추세요. 시스템품질만 단독으로 상관을 보면 크지만 회귀계수는 0 근처인 이유를 설명해 보세요.',
    'ANOVA 표의 F와 유의확률이 모형 요약의 R²와 어떤 관계인지 확인해 보세요.',
  ],
  tools: {
    spss: (p) => `* 메뉴: 분석 > 회귀분석 > 선형 > [통계량] 추정값, 모형 적합, 공선성 진단
REGRESSION
  /MISSING LISTWISE
  /STATISTICS COEFF OUTS R ANOVA COLLIN TOL
  /CRITERIA=PIN(.05) POUT(.10)
  /NOORIGIN
  /DEPENDENT satisfaction
  /METHOD=ENTER service system price.
* N = ${p.n}, 서비스↔시스템 상관 ${p.r12}`,
    r: (p) => `fit <- lm(satisfaction ~ service + system + price, data = df)
summary(fit)                 # 계수, R², F
library(car)
vif(fit)                     # VIF
library(lm.beta)
lm.beta(fit)                 # 표준화 계수(베타)
# 상관 r(service, system) ≈ ${p.r12}`,
  },
  init(ctx) {
    const row = ctx.row();
    const a = ctx.box('', row), b = ctx.box('', row);
    ctx.state.beta = ctx.plot({ xBand: ['서비스품질', '시스템품질', '가격공정성'], y: [-0.8, 0.8], height: 230, yLabel: '표준화 계수 β', title: '추정 베타 (막대) vs 설정값 (◆) · 오차막대 95% CI' }, a);
    ctx.state.vif = ctx.plot({ xBand: ['서비스품질', '시스템품질', '가격공정성'], y: [0, 12], height: 230, yLabel: 'VIF', title: 'VIF (5, 10 기준선)' }, b);
    ctx.state.tbl = ctx.box('stage');
    ctx.state.seed = 21;
  },
  update(ctx, v, changed) {
    if (changed === 'resample') ctx.state.seed++;
    S.seed(ctx.state.seed);
    const r = v.r12, R = [[1, r, 0.15], [r, 1, 0.15], [0.15, 0.15, 1]];
    const Z = S.mvnorm(v.n, R);
    const bs = [v.b1, v.b2, v.b3];
    let expl = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) expl += bs[i] * bs[j] * R[i][j];
    const se = Math.sqrt(Math.max(0.1, 1 - expl));
    const y = Z.map((z) => 3.5 + 0.8 * (bs[0] * z[0] + bs[1] * z[1] + bs[2] * z[2] + se * S.randn()));
    const X = Z.map((z) => [4 + 0.7 * z[0], 3.8 + 0.8 * z[1], 3.2 + 0.9 * z[2]]);
    const m = S.ols(X, y, ['서비스품질', '시스템품질', '가격공정성']), vif = S.vif(X);
    const C = Lab.C, hi = (s) => `<span class="hi">${s}</span>`, sig = (p) => S.fp(p).replace(' ', '');
    const t1 = Lab.spssTable({ title: '모형 요약', head: ['모형', 'R', 'R 제곱', '수정된 R 제곱', '추정값의 표준오차'],
      rows: [['1', S.apa(Math.sqrt(m.r2)), hi(S.apa(m.r2)), hi(S.apa(m.adjR2)), S.f(m.sigma, 5)]],
      note: 'a. 예측자: (상수), 가격공정성, 시스템품질, 서비스품질' });
    const t2 = Lab.spssTable({ title: 'ANOVA', head: ['모형 1', '제곱합', '자유도', '평균제곱', 'F', '유의확률'],
      rows: [['회귀', S.f(m.ssr, 3), m.df1, S.f(m.ssr / m.df1, 3), hi(S.f(m.F, 3)), hi(sig(m.pF))], ['잔차', S.f(m.sse, 3), m.df2, S.f(m.mse, 3), '', ''], ['전체', S.f(m.sst, 3), m.n - 1, '', '', '']],
      note: 'a. 종속변수: 만족도' });
    const rows = [['(상수)', S.f(m.b[0], 3), S.f(m.se[0], 3), '', S.f(m.t[0], 3), sig(m.p[0]), '', '']];
    m.names.forEach((nm, j) => rows.push([nm, S.f(m.b[j + 1], 3), S.f(m.se[j + 1], 3), hi(S.apa(m.beta[j + 1])), S.f(m.t[j + 1], 3), hi(sig(m.p[j + 1])), S.apa(1 / vif[j]), vif[j] > 10 ? `<span class="hi" style="color:var(--bad)">${S.f(vif[j], 3)}</span>` : hi(S.f(vif[j], 3))]));
    const t3 = Lab.spssTable({ title: '계수', head: ['모형 1', 'B', '표준오차', '베타', 't', '유의확률', '공차', 'VIF'], rows,
      note: 'B·표준오차 = 비표준화 계수 / 베타 = 표준화 계수 / 공차·VIF = 공선성 통계량. a. 종속변수: 만족도' });
    ctx.state.tbl.innerHTML = t1 + t2 + t3;

    // beta chart with CI (CI of beta ≈ CI of B scaled)
    const bp = ctx.state.beta; bp.clear(); bp.hline(0, { color: C.ink2, width: 1 });
    const names = m.names, cols = [C.s1, C.s2, C.s3];
    const items = names.map((nm, j) => { const sc = m.beta[j + 1] / m.b[j + 1]; return { x: nm, y: m.beta[j + 1], lo: m.ci[j + 1][0] * sc, hi: m.ci[j + 1][1] * sc, color: cols[j], p: m.p[j + 1] }; });
    const lim = Math.max(0.8, ...items.map((d) => Math.max(Math.abs(d.lo), Math.abs(d.hi))) ) * 1.1; bp.setY([-lim, lim]);
    bp.bars(items, { opacity: 0.85, maxW: 40, tip: (d) => `<b>${d.x}</b><br>β = ${S.f(d.y, 3)}<br>95% CI [${S.f(d.lo, 2)}, ${S.f(d.hi, 2)}]<br>p ${d.p < 0.001 ? '< .001' : '= ' + S.apa(d.p)}` });
    items.forEach((d, j) => { bp.segment(d.x, d.lo, d.x, d.hi, { color: C.ink, width: 1.5 }); bp.segment(d.x, d.lo, d.x, d.lo, {}); bp.text(d.x, bs[j], '◆', { dy: 4, color: C.marker, size: 13 }); });
    bp.legend([{ label: '추정 베타', color: C.s1 }, { label: '설정한 참값 ◆', color: C.marker, type: 'dot' }]);
    const vp = ctx.state.vif; vp.setY([0, Math.max(12, Math.max(...vif) * 1.15)]); vp.clear();
    vp.bars(names.map((nm, j) => ({ x: nm, y: vif[j], color: vif[j] > 10 ? C.s8 : vif[j] > 5 ? C.s4 : C.s3 })), { maxW: 40, labels: (d) => S.f(d.y, 2), tip: (d) => `${d.x}<br>VIF ${S.f(d.y, 2)} · 공차 ${S.apa(1 / d.y)}` });
    vp.hline(10, { color: C.bad, dash: true, label: 'VIF 10' }); vp.hline(5, { color: C.warn, dash: true, label: '5', anchor: 'start' });

    const maxV = Math.max(...vif);
    ctx.readout([
      { label: 'R²', value: S.apa(m.r2), sub: `수정 R² ${S.apa(m.adjR2)}`, tone: 'accent' },
      { label: 'F검정 (모형)', value: `F = ${S.f(m.F, 1)}`, sub: `p ${S.fp(m.pF)}` },
      { label: '유의한 변수', value: `${m.p.slice(1).filter((p) => p < 0.05).length} / 3`, sub: 'p < .05' },
      { label: '최대 VIF', value: S.f(maxV, 2), tone: maxV > 10 ? 'bad' : maxV > 5 ? 'warn' : 'good' },
    ]);
    let msg;
    if (maxV > 10) msg = `서비스품질과 시스템품질의 상관이 ${v.r12}라 VIF가 ${S.f(maxV, 1)}입니다. R²(${S.apa(m.r2)})는 그대로인데 두 변수의 표준오차가 ${S.f(m.se[1], 2)}, ${S.f(m.se[2], 2)}로 부풀어 개별 효과를 믿기 어렵습니다. 두 변수를 합치거나 하나를 빼는 것을 검토하세요.`;
    else if (m.pF >= 0.05) msg = `ANOVA F검정이 유의하지 않습니다(p = ${S.apa(m.pF)}). 모형 전체가 만족도를 설명하지 못하니 계수 표는 해석하지 않습니다.`;
    else { const top = items.slice().sort((a, b) => Math.abs(b.y) - Math.abs(a.y))[0]; msg = `세 변수가 만족도 분산의 ${S.pct(m.r2, 1)}를 설명합니다. 베타 기준으로 <b>${top.x}</b>(β = ${S.f(top.y, 2)})의 영향이 가장 큽니다. VIF는 모두 ${S.f(maxV, 1)} 이하로 공선성 문제는 없습니다.`; }
    ctx.insight(msg);
  },
});
