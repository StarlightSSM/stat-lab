/* MIS · 채찍효과 — 4-stage serial supply chain, order-up-to policy with moving-average forecast (Chen et al., 2000). */
Lab.add({
  id: 'mis-bullwhip', subject: 'mis', order: 4,
  title: '채찍효과: 공급망의 수요 왜곡', en: 'Bullwhip effect (Lee, Padmanabhan & Whang, 1997)',
  summary: '소비자 수요의 작은 흔들림이 소매→도매→유통→공장으로 올라가며 커지는 과정을, 리드타임·예측 방식·정보 공유를 바꿔 가며 관찰합니다.',
  keywords: 'bullwhip 채찍효과 공급망 SCM 정보공유 리드타임 수요예측',
  controls: [
    { type: 'slider', key: 'noise', label: '소비자 수요 변동 (표준편차)', min: 2, max: 30, step: 1, value: 10, hint: '평균 수요 100개/주' },
    { type: 'slider', key: 'L', label: '리드타임 L (주)', min: 1, max: 6, step: 1, value: 2 },
    { type: 'slider', key: 'w', label: '이동평균 예측 기간 (주)', min: 2, max: 20, step: 1, value: 8, hint: '짧을수록 최근 변동에 민감하게 반응' },
    { type: 'toggle', key: 'share', label: 'POS 정보 공유 (모든 단계가 소비자 수요로 예측)', value: false },
    { type: 'toggle', key: 'step', label: '20주차 수요 20% 증가 (프로모션)', value: false },
    { type: 'button', key: 'resample', label: '새 수요 시나리오', primary: true },
  ],
  concept: `
    <p><b>채찍효과</b>는 공급망 상류로 갈수록 주문량의 변동이 실제 소비자 수요의 변동보다 커지는 현상입니다. P&G가 기저귀 판매는 안정적인데 도매상 주문이 크게 출렁이는 것을 발견하면서 알려졌고, Lee, Padmanabhan & Whang(1997)이 원인을 네 가지로 정리했습니다.</p>
    <ul>
      <li><b>수요 예측 갱신</b>: 각 단계가 하위 단계의 주문을 수요로 보고 예측하므로, 이미 증폭된 신호를 다시 증폭합니다.</li>
      <li><b>주문 일괄처리</b>: 운송비 때문에 주문을 모아서 하면 주문이 몰렸다 끊겼다 합니다.</li>
      <li><b>가격 변동</b>: 할인 행사 때 미리 사 두는 선구매가 생깁니다.</li>
      <li><b>배급과 부족 게임</b>: 공급이 부족하면 필요보다 부풀려 주문합니다.</li>
    </ul>
    <p>주문량은 음수가 될 수 없어 0에서 잘리므로, 증폭이 큰 상류 단계일수록 시뮬레이션 값이 이론 하한보다 더 커집니다. Chen 외(2000)는 이동평균 예측과 목표재고 정책에서 한 단계의 증폭이 최소 1 + 2L/w + 2L²/w²임을 보였습니다. 리드타임이 길고 예측 기간이 짧을수록 커집니다.</p>
    <p>정보시스템의 역할은 여기서 나옵니다. POS 데이터를 공유(EDI, VMI, CPFR)하면 모든 단계가 실제 소비자 수요로 예측하므로 증폭이 단계마다 곱해지지 않고 더해지는 수준으로 줄어듭니다. 채찍효과를 줄여도 리드타임 자체가 남아 있는 한 완전히 없어지지는 않습니다.</p>`,
  formula: `예측: <var>m</var><sub>t</sub> = (1/<var>w</var>) Σ<sub>i=0..w−1</sub> <var>d</var><sub>t−i</sub><br>목표재고: <var>S</var><sub>t</sub> = (<var>L</var>+1)·<var>m</var><sub>t</sub> &nbsp;&nbsp; 주문: <var>q</var><sub>t</sub> = <var>d</var><sub>t</sub> + <var>S</var><sub>t</sub> − <var>S</var><sub>t−1</sub><br>Var(<var>q</var>)/Var(<var>d</var>) ≥ 1 + 2<var>L</var>/<var>w</var> + 2<var>L</var>²/<var>w</var>² &nbsp;<span class="c">한 단계, Chen et al. 2000</span><br>정보 비공유 k단계: Π(1 + 2L/w + 2L²/w²) &nbsp; 공유: 1 + 2kL/w + 2k²L²/w²`,
  tasks: [
    '리드타임을 1주에서 4주로 늘려 보세요. 공장 단계의 변동 증폭 배수가 얼마나 커지나요?',
    '이동평균 기간을 2주와 15주로 비교하세요. 예측을 덜 민감하게 하면 왜 채찍효과가 줄어들까요?',
    'POS 정보 공유를 켜고 공장의 증폭 배수를 비교하세요. 공유해도 1이 되지 않는 이유는?',
    '프로모션(20주차 수요 증가)을 켜면 상류 단계의 주문이 일시적으로 얼마나 치솟는지 확인하세요.',
  ],
  tools: {
    r: (p) => `set.seed(1)
T <- 80; L <- ${p.L}; w <- ${p.w}
d <- round(rnorm(T, 100, ${p.noise}))${p.step ? '\nd[20:T] <- d[20:T] * 1.2' : ''}
stage_orders <- function(dem, base) {        # base: 예측에 쓰는 수요
  m <- stats::filter(base, rep(1 / w, w), sides = 1)
  S <- (L + 1) * m
  q <- dem + c(NA, diff(S))
  pmax(q, 0)
}
orders <- list(d)
for (k in 1:4) {
  inp <- orders[[k]]
  base <- ${p.share ? 'd               # 정보 공유: 소비자 수요로 예측' : 'inp             # 비공유: 하위 단계 주문으로 예측'}
  orders[[k + 1]] <- stage_orders(inp, base)
}
sapply(orders[-1], function(q) var(q, na.rm = TRUE) / var(d))  # 증폭 배수
matplot(do.call(cbind, orders), type = "l", lty = 1, ylab = "주문량")`,
  },
  init(ctx) {
    ctx.state.ts = ctx.plot({ x: [0, 80], y: [0, 250], height: 300, xLabel: '주차', yLabel: '주문량 (개/주)', title: '단계별 주문량 시계열' });
    ctx.state.bar = ctx.plot({ xBand: ['소매', '도매', '유통', '공장'], y: [0, 10], height: 240, yLabel: 'Var(주문) / Var(소비자 수요)', title: '변동 증폭 배수' });
    ctx.state.seed = 3;
  },
  update(ctx, v, changed) {
    if (changed === 'resample') ctx.state.seed++;
    S.seed(ctx.state.seed);
    const T = 80, L = v.L, w = v.w, burn = w + 2, C = Lab.C;
    const d = Array.from({ length: T }, (_, t) => Math.max(0, 100 * (v.step && t >= 20 ? 1.2 : 1) + S.randn(0, v.noise)));
    const stageOrders = (dem, base) => {
      const q = [], Sprev = [];
      for (let t = 0; t < T; t++) {
        const lo = Math.max(0, t - w + 1), win = base.slice(lo, t + 1), m = S.mean(win), St = (L + 1) * m;
        q.push(t === 0 ? dem[t] : Math.max(0, dem[t] + St - Sprev[t - 1])); Sprev.push(St);
      }
      return q;
    };
    const names = ['소매', '도매', '유통', '공장'], series = [d];
    for (let k = 0; k < 4; k++) series.push(stageOrders(series[k], v.share ? d : series[k]));
    const varD = S.variance(d.slice(burn)), ratios = series.slice(1).map((q) => S.variance(q.slice(burn)) / varD);
    const one = 1 + 2 * L / w + 2 * L * L / (w * w);
    const theo = names.map((_, i) => (v.share ? 1 + 2 * (i + 1) * L / w + 2 * ((i + 1) * L) ** 2 / (w * w) : one ** (i + 1)));

    const cols = [C.s1, C.s3, C.s4, C.s2], ts = ctx.state.ts;
    const ymax = Math.min(600, Math.max(200, ...series.slice(1).map((q) => S.quantile(q.slice(burn), 0.98))) * 1.1);
    ts.setY([0, ymax]); ts.clear();
    if (v.step) ts.vline(20, { color: C.ink2, dash: true, label: '프로모션' });
    for (let k = 4; k >= 1; k--) ts.line(series[k].map((y, t) => [t, Math.min(y, ymax)]), { color: cols[k - 1], width: k === 4 ? 2 : 1.6, opacity: 0.9 });
    ts.line(d.map((y, t) => [t, y]), { color: C.ink, width: 2.4 });
    ts.legend([{ label: '소비자 수요', color: C.ink, type: 'line' }, ...names.map((n, i) => ({ label: n + ' 주문', color: cols[i], type: 'line' }))]);

    const bar = ctx.state.bar, ym = Math.max(...ratios, ...theo.map((t) => Math.min(t, 60))) * 1.18;
    bar.setY([0, Math.max(3, ym)]); bar.clear();
    bar.hline(1, { color: C.muted, dash: true });
    bar.bars(names.map((n, i) => ({ x: n, y: ratios[i], color: cols[i], tip: () => `<b>${n}</b><br>시뮬레이션 ${S.f(ratios[i], 2)}배<br>이론 하한 ${S.f(theo[i], 2)}배` })), { labels: (d) => S.f(d.y, 1) + '배' });
    bar.dots(names.map((n, i) => ({ x: n, y: Math.min(theo[i], bar.o.y[1]) })), { color: C.ink, r: 4.5, opacity: 1 });
    bar.legend([{ label: '시뮬레이션 증폭 배수', color: C.s1, type: 'box' }, { label: 'Chen 외(2000) 이론 하한', color: C.ink, type: 'dot' }]);

    const sdD = Math.sqrt(varD), sdF = Math.sqrt(S.variance(series[4].slice(burn)));
    ctx.readout([
      { label: '공장 증폭 배수', value: S.f(ratios[3], 1) + '배', tone: ratios[3] > 8 ? 'bad' : ratios[3] < 3 ? 'good' : 'warn', sub: `이론 하한 ${S.f(theo[3], 1)}배` },
      { label: '소매 1단계 증폭', value: S.f(ratios[0], 2) + '배', sub: `1 + 2L/w + 2L²/w² = ${S.f(one, 2)}` },
      { label: '소비자 수요 표준편차', value: S.f(sdD, 1) + '개' },
      { label: '공장 주문 표준편차', value: S.f(sdF, 1) + '개' },
    ]);
    let msg = `소비자 수요는 주당 ±${S.f(sdD, 0)}개 정도 흔들리지만 공장에 도착하는 주문은 ±${S.f(sdF, 0)}개로 흔들립니다(분산 ${S.f(ratios[3], 1)}배).`;
    if (v.share) msg += ' 정보 공유로 모든 단계가 같은 소비자 수요를 보고 예측하므로 증폭이 단계마다 곱해지지 않습니다.';
    else if (L >= 4) msg += ` 리드타임 ${L}주 동안의 수요를 미리 확보하려다 보니 예측 오차가 크게 부풀려집니다.`;
    else if (w <= 3) msg += ` 예측 기간이 ${w}주로 짧아 우연한 변동을 추세로 오인합니다.`;
    ctx.insight(msg);
  },
});
