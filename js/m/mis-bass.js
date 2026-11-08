/* MIS · Bass 혁신확산 모형 — discrete Bass recursion, innovator/imitator split, Rogers adopter categories. */
Lab.add({
  id: 'mis-bass', subject: 'mis', order: 3,
  title: '혁신확산 Bass 모형', en: 'Bass diffusion model (Bass, 1969)',
  summary: '혁신계수 p와 모방계수 q를 바꾸며 신기술 도입 곡선이 언제 정점을 찍고 S자로 포화되는지 확인합니다.',
  keywords: 'bass diffusion 확산 혁신 모방 rogers S-curve 수용자',
  controls: [
    { type: 'select', key: 'preset', label: '예시 값', options: [['meta', '메타분석 평균'], ['viral', '입소문형'], ['push', '광고형'], ['custom', '직접 조절']], value: 'meta' },
    { type: 'slider', key: 'p', label: '혁신계수 p (외부 영향)', min: 0.001, max: 0.1, step: 0.001, value: 0.03, hint: '광고·언론 등 다른 사람과 무관하게 도입하는 경향' },
    { type: 'slider', key: 'q', label: '모방계수 q (내부 영향)', min: 0, max: 0.9, step: 0.01, value: 0.38, hint: '이미 도입한 사람의 입소문·관찰 효과' },
    { type: 'slider', key: 'm', label: '잠재시장 m (만 명)', min: 10, max: 1000, step: 10, value: 500 },
    { type: 'slider', key: 'T', label: '관찰 기간 (년)', min: 10, max: 40, step: 1, value: 25 },
    { type: 'toggle', key: 'rogers', label: 'Rogers 수용자 범주 표시', value: true },
  ],
  concept: `
    <p>Bass(1969)는 신제품을 처음 사는 사람을 두 부류로 나눴습니다. <b>혁신자</b>는 광고나 언론 같은 외부 정보만으로 도입하고(계수 p), <b>모방자</b>는 이미 쓰고 있는 사람에게 영향을 받아 도입합니다(계수 q). 아직 도입하지 않은 사람 중에서 매 기간 도입하는 비율(위험률)은 p + q·F(t)입니다.</p>
    <ul>
      <li>q > p이면 도입량이 처음엔 작다가 점점 커져 정점을 찍고 줄어드는 종 모양이 됩니다. 누적 도입은 <b>S자 곡선</b>입니다.</li>
      <li>정점 시점은 t* = ln(q/p) / (p+q)입니다. q/p가 클수록 정점이 늦고 뾰족해집니다.</li>
      <li>Sultan, Farley & Lehmann(1990)의 메타분석에서 평균값은 p ≈ 0.03, q ≈ 0.38이었습니다.</li>
    </ul>
    <p>Rogers(1962)의 <em>혁신확산 이론</em>은 도입 시점에 따라 혁신자 2.5%, 조기수용자 13.5%, 조기다수 34%, 후기다수 34%, 지각수용자 16%로 나눕니다. 조기수용자에서 조기다수로 넘어가는 16% 지점은 Moore(1991)가 말한 <b>캐즘</b>입니다.</p>
    <p>MIS에서는 ERP·클라우드·모바일 결제 같은 기술의 시장 수요 예측과 IT 투자 시점 결정에 Bass 모형을 사용합니다. 초기 몇 기간의 판매 데이터로 p, q, m을 비선형회귀로 추정합니다.</p>`,
  formula: `<var>f</var>(<var>t</var>) / (1 − <var>F</var>(<var>t</var>)) = <var>p</var> + <var>q</var>·<var>F</var>(<var>t</var>)<br><var>F</var>(<var>t</var>) = (1 − e<sup>−(p+q)t</sup>) / (1 + (q/p)·e<sup>−(p+q)t</sup>)<br><var>n</var>(<var>t</var>) = <var>p</var>(<var>m</var> − <var>N</var>) + <var>q</var>(<var>N</var>/<var>m</var>)(<var>m</var> − <var>N</var>) &nbsp;<span class="c">혁신자 + 모방자</span><br><var>t</var>* = ln(<var>q</var>/<var>p</var>) / (<var>p</var> + <var>q</var>)`,
  tasks: [
    'q를 0으로 내려 보세요. 정점이 사라지고 첫 해 도입량이 가장 큰 이유는 무엇일까요?',
    'p = 0.01, q = 0.5로 맞추면 정점 시점 t*는 몇 년인가요? 공식 ln(q/p)/(p+q)로 직접 계산해 확인하세요.',
    '입소문형과 광고형 예시를 비교하세요. 혁신자(아래 영역)와 모방자(위 영역)의 비중이 어떻게 다른가요?',
    'Rogers 범주를 켜고, 캐즘(누적 16%)을 넘는 시점이 p에 얼마나 민감한지 확인해 보세요.',
  ],
  tools: {
    r: (p) => `# Bass 모형 시뮬레이션
p <- ${p.p}; q <- ${p.q}; m <- ${p.m}   # m: 만 명
t <- 0:${p.T}
F <- (1 - exp(-(p + q) * t)) / (1 + (q / p) * exp(-(p + q) * t))
N <- m * F; n <- diff(N)
barplot(n, names.arg = 1:${p.T}, xlab = "년", ylab = "신규 도입 (만 명)")
log(q / p) / (p + q)   # 정점 시점 t*

# 실제 판매 데이터(sales)로 p, q, m 추정
fit <- nls(sales ~ M * (((P + Q)^2 / P) * exp(-(P + Q) * year)) /
                     (1 + (Q / P) * exp(-(P + Q) * year))^2,
           start = list(M = ${p.m}, P = 0.03, Q = 0.38))
summary(fit)`,
    Excel: (p) => `[엑셀로 따라 하기]
A열: 연도 0..${p.T}
B2 (누적 N):  =B1 + C2
C2 (신규 n):  =(${p.p} + ${p.q}*B1/${p.m}) * (${p.m} - B1)
D2 (혁신자):  =${p.p} * (${p.m} - B1)
E2 (모방자):  =C2 - D2
B1 = 0 으로 시작, 아래로 채우기 → C열로 막대차트`,
  },
  init(ctx) {
    ctx.state.per = ctx.plot({ x: [0, 25], y: [0, 50], height: 270, xLabel: '연도', yLabel: '신규 도입 (만 명)', title: '연도별 신규 도입: 혁신자 + 모방자' });
    ctx.state.cum = ctx.plot({ x: [0, 25], y: [0, 500], height: 270, xLabel: '연도', yLabel: '누적 도입 (만 명)', title: '누적 도입 S자 곡선' });
  },
  update(ctx, v, changed) {
    if (changed === 'preset' && v.preset !== 'custom') {
      const pr = { meta: [0.03, 0.38], viral: [0.005, 0.7], push: [0.08, 0.1] }[v.preset];
      ctx.set('p', pr[0], true); ctx.set('q', pr[1], true);
    } else if (changed === 'p' || changed === 'q') ctx.set('preset', 'custom', true);
    const { p, q, m, T } = v, C = Lab.C;
    const N = [0], inn = [], imi = [];
    for (let t = 1; t <= T; t++) { const prev = N[t - 1], a = p * (m - prev), b = q * (prev / m) * (m - prev); inn.push(a); imi.push(b); N.push(prev + a + b); }
    const tot = inn.map((a, i) => a + imi[i]), peakIdx = tot.indexOf(Math.max(...tot));
    const tstar = q > p ? Math.log(q / p) / (p + q) : 0;
    const share = S.sum(inn) / (S.sum(inn) + S.sum(imi));

    const per = ctx.state.per.setX([0, T]).setY([0, Math.max(...tot) * 1.15 || 1]); per.clear();
    const g = per.g('under');
    const xs = (i) => per.x(i + 0.5);
    const areaI = d3.area().x((d, i) => xs(i)).y0(per.y(0)).y1((d) => per.y(d)).curve(d3.curveMonotoneX);
    const areaM = d3.area().x((d, i) => xs(i)).y0((d, i) => per.y(inn[i])).y1((d, i) => per.y(inn[i] + imi[i])).curve(d3.curveMonotoneX);
    g.append('path').attr('d', areaM(imi)).style('fill', C.s2).style('opacity', 0.35);
    g.append('path').attr('d', areaI(inn)).style('fill', C.s1).style('opacity', 0.45);
    per.line(tot.map((y, i) => [i + 0.5, y]), { color: C.ink2, width: 1.5, curve: 'smooth' });
    per.dots(tot.map((y, i) => ({ x: i + 0.5, y })), { r: 3, color: C.ink2, opacity: 0.9, tip: (d) => `<b>${d.i + 1}년차</b><br>신규 ${S.f(d.y, 1)}만 명<br>혁신자 ${S.f(inn[d.i], 1)} · 모방자 ${S.f(imi[d.i], 1)}` });
    if (q > p) per.vline(tstar, { color: C.marker, dash: true, label: `t* = ${S.f(tstar, 1)}년`, anchor: tstar > T * 0.7 ? 'end' : 'start' });
    per.legend([{ label: '혁신자 (p)', color: C.s1, type: 'box' }, { label: '모방자 (q)', color: C.s2, type: 'box' }, { label: '신규 도입 합계', color: C.ink2, type: 'line' }]);

    const cum = ctx.state.cum.setX([0, T]).setY([0, m * 1.05]); cum.clear();
    const crossAt = (frac) => { for (let t = 1; t <= T; t++) if (N[t] >= frac * m) { const f0 = N[t - 1], f1 = N[t]; return t - 1 + (frac * m - f0) / (f1 - f0); } return T; };
    if (v.rogers) {
      const cuts = [[0, 0.025, '혁신자'], [0.025, 0.16, '조기수용'], [0.16, 0.5, '조기다수'], [0.5, 0.84, '후기다수'], [0.84, 1, '지각']];
      const cols = [C.s1, C.s3, C.s4, C.s2, C.s7];
      cuts.forEach(([a, b, lab], i) => {
        const x0 = a === 0 ? 0 : crossAt(a), x1 = b === 1 ? T : crossAt(b);
        if (x1 > x0) { cum.rect(x0, x1, 0, m * 1.05, { color: cols[i], opacity: 0.09 }); if (x1 - x0 > T * 0.07) cum.text((x0 + x1) / 2, m * 0.9, lab, { size: 10.5 }); }
      });
      const chasm = crossAt(0.16); if (chasm < T) cum.vline(chasm, { color: C.ink2, dash: true, label: '캐즘 16%', labelY: cum.y(m * 0.8), anchor: chasm > T * 0.7 ? 'end' : 'start' });
    }
    cum.hline(m, { color: C.muted, dash: true, label: `잠재시장 m = ${m}만 명`, anchor: 'end' });
    cum.area(N.map((y, t) => [t, y]), { color: C.s1, opacity: 0.1 });
    cum.line(N.map((y, t) => [t, y]), { color: C.s1, curve: 'smooth' });
    if (q > p && tstar <= T) { const i0 = Math.min(T - 1, Math.floor(tstar)), nt = N[i0] + (N[i0 + 1] - N[i0]) * (tstar - i0); cum.dots([[tstar, nt]], { color: C.marker, r: 5, tip: () => `변곡점 t* = ${S.f(tstar, 1)}년<br>누적 ${S.f(nt, 0)}만 명 (${S.pct(nt / m, 0)})` }); }

    const t50 = crossAt(0.5);
    ctx.readout([
      { label: '정점 시점 t*', value: q > p ? S.f(tstar, 1) + '년' : '1년차', sub: `최대 신규 ${S.f(tot[peakIdx], 1)}만 명`, tone: 'accent' },
      { label: '누적 50% 도달', value: t50 < T ? S.f(t50, 1) + '년' : `${T}년 초과` },
      { label: `${T}년 후 보급률`, value: S.pct(N[T] / m, 0) },
      { label: '혁신자 비중', value: S.pct(share, 0), sub: `q/p = ${S.f(q / p, 1)}` },
    ]);
    let msg;
    if (q <= p) msg = `모방효과(q = ${q})가 혁신효과(p = ${p})보다 약해서 정점이 없습니다. 도입량이 처음부터 가장 크고 점점 줄어드는 지수 감소형이며, 광고에 의존하는 제품에서 나타납니다.`;
    else if (q / p > 30) msg = `q/p = ${S.f(q / p, 0)}로 입소문 의존도가 매우 큽니다. 처음 몇 년은 거의 팔리지 않다가 ${S.f(tstar, 1)}년차 전후에 폭발적으로 늘어납니다. 초기 혁신자 확보가 성패를 가릅니다.`;
    else msg = `도입자의 ${S.pct(1 - share, 0)}가 모방자입니다. 신규 도입은 ${S.f(tstar, 1)}년차에 정점을 찍고, 누적 보급률 50%에는 ${t50 < T ? S.f(t50, 1) + '년' : '관찰 기간 이후'}에 도달합니다.`;
    ctx.insight(msg);
  },
});
