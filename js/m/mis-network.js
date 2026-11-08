/* MIS · 네트워크 효과와 임계질량 — value laws + fulfilled-expectations adoption dynamics (x_{t+1} = 1 − F(p − k·x_t)). */
Lab.add({
  id: 'mis-network', subject: 'mis', order: 2,
  title: '네트워크 효과와 임계질량', en: 'Network effects · critical mass · tipping',
  summary: '사용자가 늘수록 가치가 커지는 플랫폼에서, 가격과 네트워크 효과의 세기가 임계질량과 쏠림(tipping)을 어떻게 만드는지 시뮬레이션합니다.',
  keywords: 'network effect metcalfe 임계질량 플랫폼 tipping 외부성',
  controls: [
    { type: 'slider', key: 'k', label: '네트워크 효과 세기 k', min: 0, max: 2, step: 0.05, value: 1.2, hint: '가입자 비율 1%p가 1인당 효용을 얼마나 올리는가' },
    { type: 'slider', key: 'price', label: '가격 (월 이용료 지수)', min: 0, max: 1.6, step: 0.02, value: 0.9 },
    { type: 'slider', key: 'x0', label: '초기 사용자 비율', min: 0, max: 0.8, step: 0.01, value: 0.25, hint: '무료 체험·보조금으로 확보한 출발점' },
    { type: 'toggle', key: 'two', label: '양면 플랫폼 (판매자 ↔ 구매자)', value: false },
    { type: 'heading', label: '가치 법칙 비교' },
    { type: 'slider', key: 'N', label: '사용자 수 n (가치 곡선)', min: 5, max: 60, step: 1, value: 30 },
  ],
  concept: `
    <p><b>네트워크 효과</b>(네트워크 외부성)는 같은 제품을 쓰는 사람이 많을수록 각 사용자가 얻는 가치가 커지는 현상입니다(Katz & Shapiro, 1985). 전화, 메신저, 운영체제, 결제 서비스가 대표적입니다.</p>
    <ul>
      <li><b>Sarnoff 법칙</b> ∝ n : 방송처럼 일방향 네트워크</li>
      <li><b>Metcalfe 법칙</b> ∝ n² : 사용자 쌍 사이 연결 수 n(n−1)/2</li>
      <li><b>Odlyzko 법칙</b> ∝ n·log n : 모든 연결이 똑같이 가치 있지는 않다는 보정</li>
      <li><b>Reed 법칙</b> ∝ 2ⁿ : 그룹 형성이 가능한 네트워크</li>
    </ul>
    <p>사용자마다 제품 자체의 가치 v가 다르고(평균 0.5인 정규분포), 가입하면 v + k·(가입자 비율)를 얻는다고 해 봅시다. 가입자 비율이 x일 때 실제로 가입하려는 사람의 비율 f(x)와 x가 같아지는 점이 <b>균형</b>입니다. 균형이 세 개 생기면 가운데 균형은 불안정하며, 그 점이 <em>임계질량</em>입니다. 출발점이 임계질량보다 위면 시장은 높은 균형으로 쏠리고, 아래면 무너집니다.</p>
    <p>그래서 플랫폼 기업은 초기 손실을 감수하고 보조금·무료 정책으로 임계질량을 넘기려 합니다. 양면 플랫폼(Rochet & Tirole, 2003)에서는 한쪽 집단의 수가 다른 쪽의 가치를 결정하는 교차 네트워크 효과가 작동합니다.</p>`,
  formula: `개인 효용: <var>u</var> = <var>v</var> + <var>k</var>·<var>x</var> − <var>p</var>,  &nbsp;<var>v</var> ~ N(0.5, 0.2²) &nbsp;<span class="c">제품 자체 가치는 사람마다 다름</span><br>가입 비율: <var>f</var>(<var>x</var>) = P(<var>v</var> > <var>p</var> − <var>k</var><var>x</var>) = 1 − Φ((<var>p</var> − <var>k</var><var>x</var> − 0.5) / 0.2)<br>동학: <var>x</var><sub>t+1</sub> = <var>f</var>(<var>x</var><sub>t</sub>) &nbsp;&nbsp; 균형: <var>f</var>(<var>x</var>*) = <var>x</var>*<br>Metcalfe: <var>V</var> ∝ <var>n</var>(<var>n</var>−1)/2`,
  tasks: [
    'k = 1.2, 가격 0.9에서 초기 사용자 비율을 0.1과 0.3으로 바꿔 보세요. 최종 점유율이 극적으로 갈리는 경계(임계질량)는 어디인가요?',
    'k를 0.5 이하로 낮추면 균형이 하나만 남습니다. 네트워크 효과가 약하면 왜 쏠림이 일어나지 않을까요?',
    '가격을 내리면 임계질량이 어떻게 이동하나요? 무료 정책이 플랫폼 초기 전략으로 쓰이는 이유를 설명해 보세요.',
    '양면 플랫폼을 켜고 같은 실험을 반복하세요. 판매자와 구매자가 서로를 끌어들이는 경로가 어떻게 보이나요?',
  ],
  tools: {
    r: (p) => `# 기대충족 균형 동학: x_{t+1} = 1 - pnorm((price - k * x_t - 0.5) / 0.2)
k <- ${p.k}; price <- ${p.price}; x <- ${p.x0}
f <- function(x) 1 - pnorm((price - k * x - 0.5) / 0.2)
path <- numeric(30); for (t in 1:30) { x <- f(x); path[t] <- x }
plot(path, type = "b", ylim = c(0, 1), xlab = "기간", ylab = "가입자 비율")

# 균형점 찾기 (f(x) = x)
xs <- seq(0, 1, by = 0.001)
xs[which(diff(sign(f(xs) - xs)) != 0)]

# 가치 법칙 비교
n <- 1:${p.N}
matplot(n, cbind(n, n * log(n), n^2), type = "l", log = "y")`,
  },
  init(ctx) {
    const row = ctx.row(), c1 = ctx.box('', row), c2 = ctx.box('', row);
    ctx.state.ph = ctx.plot({ x: [0, 1], y: [0, 1], height: 290, xLabel: '현재 가입자 비율 xₜ', yLabel: '다음 기 가입 비율 f(xₜ)', title: '균형 찾기: f(x)와 45°선의 교점' }, c1);
    ctx.state.ts = ctx.plot({ x: [0, 30], y: [0, 1], height: 290, xLabel: '기간 t', yLabel: '가입자 비율', title: '시간에 따른 확산 경로' }, c2);
    ctx.state.law = ctx.plot({ x: [1, 60], y: [0, 10], height: 230, xLabel: '사용자 수 n', yLabel: 'log₁₀ 네트워크 가치', title: '네트워크 가치 법칙 (로그 축)' });
  },
  update(ctx, v) {
    const C = Lab.C, { ph, ts, law } = ctx.state;
    const k = v.k, pr = v.price;
    const SD = 0.2, f = (x) => 1 - S.pnorm((pr - k * x - 0.5) / SD);
    // equilibria
    const grid = S.linspace(0, 1, 2001), eq = [];
    for (let i = 1; i < grid.length; i++) {
      const a = f(grid[i - 1]) - grid[i - 1], b = f(grid[i]) - grid[i];
      if (a === 0) eq.push({ x: grid[i - 1], stable: true });
      else if (a * b < 0) eq.push({ x: (grid[i - 1] + grid[i]) / 2, stable: a > 0 });
    }
    if (f(1) >= 1 && !eq.some((e) => e.x > 0.995)) eq.push({ x: 1, stable: true });
    if (f(0) <= 0 && !eq.some((e) => e.x < 0.005)) eq.unshift({ x: 0, stable: true });
    // dedupe close points
    const E = eq.filter((e, i) => i === 0 || Math.abs(e.x - eq[i - 1].x) > 0.004);
    const crit = E.find((e) => !e.stable);

    // dynamics (two-sided: two groups each responding to the other's share)
    const T = 30, A = [v.x0], Bs = [v.x0 * 0.5];
    for (let t = 0; t < T; t++) {
      if (v.two) { const a = A[t], b = Bs[t]; A.push(1 - S.pnorm((pr - k * b - 0.5) / SD)); Bs.push(1 - S.pnorm((pr * 0.8 - k * a - 0.5) / SD)); }
      else A.push(f(A[t]));
    }
    const final = A[T];

    ph.clear();
    if (crit) ph.rect(0, crit.x, 0, 1, { color: C.s8, opacity: 0.06 });
    if (crit) ph.rect(crit.x, 1, 0, 1, { color: C.s3, opacity: 0.06 });
    ph.line([[0, 0], [1, 1]], { color: C.muted, width: 1.5, dash: true });
    ph.line(grid.filter((_, i) => i % 10 === 0).map((x) => [x, f(x)]), { color: C.s1 });
    if (!v.two) {
      const cw = []; let x = v.x0; cw.push([x, 0]);
      for (let t = 0; t < 14; t++) { const y = f(x); cw.push([x, y]); cw.push([y, y]); x = y; }
      ph.line(cw, { color: C.marker, width: 1.4, opacity: 0.85 });
    }
    ph.dots(E.map((e) => ({ x: e.x, y: e.x, color: e.stable ? C.ink : C.paper })), { r: 6, opacity: 1, tip: (d) => `균형 x* = ${S.f(d.x, 3)}<br>${E[d.i].stable ? '안정 균형' : '불안정 균형 = 임계질량'}` });
    ph.g('data').selectAll('.mk-dots circle').style('stroke', 'var(--ink)').style('stroke-width', 1.5);
    if (crit) ph.text(crit.x, Math.min(0.95, crit.x + 0.1), `임계질량 ${S.pct(crit.x, 0)}`, { anchor: crit.x > 0.6 ? 'end' : 'start', dx: crit.x > 0.6 ? -8 : 8 });
    ph.legend([{ label: 'f(x) 가입하려는 비율', color: C.s1, type: 'line' }, { label: '45°선 (f = x)', color: C.muted, type: 'dash' }, ...(v.two ? [] : [{ label: '거미줄 경로', color: C.marker, type: 'line' }])]);

    ts.clear();
    if (crit && !v.two) ts.hline(crit.x, { color: C.s8, dash: true, label: '임계질량' });
    ts.line(A.map((y, t) => [t, y]), { color: C.s1 });
    ts.dots(A.map((y, t) => [t, y]).filter((_, t) => t % 3 === 0), { color: C.s1, r: 3.5 });
    if (v.two) { ts.line(Bs.map((y, t) => [t, y]), { color: C.s2 }); ts.legend([{ label: '구매자 비율', color: C.s1, type: 'line' }, { label: '판매자 비율', color: C.s2, type: 'line' }]); }
    else ts.legend([]);

    law.clear();
    const ns = S.seq(1, 60, 1), L = Math.log10;
    const capR = (n) => Math.min(n * Math.log10(2), 10);
    law.setY([0, 10]);
    law.line(ns.map((n) => [n, L(n)]), { color: C.s1 });
    law.line(ns.map((n) => [n, L(n * Math.max(1, Math.log(n)))]), { color: C.s3 });
    law.line(ns.map((n) => [n, L(Math.max(1, n * (n - 1) / 2))]), { color: C.s2 });
    law.line(ns.map((n) => [n, capR(n)]).filter((d) => d[1] < 10), { color: C.s7 });
    law.vline(v.N, { color: C.ink2, dash: true, label: `n = ${v.N}` });
    law.legend([{ label: 'Sarnoff n', color: C.s1, type: 'line' }, { label: 'Odlyzko n·log n', color: C.s3, type: 'line' }, { label: 'Metcalfe n(n−1)/2', color: C.s2, type: 'line' }, { label: 'Reed 2ⁿ', color: C.s7, type: 'line' }]);

    const n = v.N;
    ctx.readout([
      { label: '30기 후 가입자 비율', value: S.pct(final, 0), tone: final > 0.6 ? 'good' : final < 0.1 ? 'bad' : null },
      { label: '임계질량', value: crit ? S.pct(crit.x, 1) : '없음', sub: crit ? '불안정 균형' : '균형이 하나뿐' },
      { label: '균형점 수', value: String(E.length), sub: E.map((e) => S.f(e.x, 2)).join(' · ') },
      { label: `Metcalfe 연결 수 (n=${n})`, value: S.comma(n * (n - 1) / 2), sub: `Sarnoff ${n}` },
    ]);
    let msg;
    if (v.two) msg = `양면 플랫폼에서는 구매자가 판매자를, 판매자가 구매자를 끌어옵니다. 30기 후 구매자 ${S.pct(final, 0)}, 판매자 ${S.pct(Bs[T], 0)}입니다.`;
    else if (crit && v.x0 > crit.x) msg = `출발점 ${S.pct(v.x0, 0)}가 임계질량 ${S.pct(crit.x, 0)}보다 높아서 시장이 높은 균형(${S.pct(final, 0)})으로 쏠립니다.`;
    else if (crit) msg = `출발점 ${S.pct(v.x0, 0)}가 임계질량 ${S.pct(crit.x, 0)}에 못 미쳐 사용자가 계속 빠져나갑니다. 초기 사용자를 ${S.pct(crit.x - v.x0 + 0.01, 0)}p 이상 더 확보해야 합니다.`;
    else if (k < 0.6) msg = `네트워크 효과가 약해서(k = ${k}) 균형이 하나뿐입니다. 출발점과 관계없이 ${S.pct(final, 0)}로 수렴하며 쏠림이 일어나지 않습니다.`;
    else msg = final > 0.5 ? `균형이 하나뿐이라 어디서 시작하든 ${S.pct(final, 0)}로 수렴합니다. 가격이 낮고 네트워크 효과가 강해서 임계질량을 걱정할 필요가 없는 시장입니다.` : `균형이 하나뿐이고 그 값이 ${S.pct(final, 0)}입니다. 가격이 너무 높아 초기 사용자를 아무리 늘려도 시장이 유지되지 않습니다.`;
    ctx.insight(msg);
  },
});
