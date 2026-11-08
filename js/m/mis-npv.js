/* MIS · IT 투자 평가 — NPV, IRR, ROI, payback, ±20% sensitivity tornado. Amounts in 억원. */
Lab.add({
  id: 'mis-npv', subject: 'mis', order: 6,
  title: 'IT 투자 평가: NPV·ROI·회수기간', en: 'IT investment appraisal · NPV, IRR, ROI, payback',
  summary: 'ERP 같은 IT 프로젝트의 초기비용, 연간 효익, 유지보수비, 할인율을 바꾸며 투자 판단 지표와 민감도를 확인합니다.',
  keywords: 'NPV IRR ROI 회수기간 할인율 IT투자 TCO 민감도 순현재가치',
  controls: [
    { type: 'slider', key: 'I', label: '초기 투자비 (억원)', min: 1, max: 30, step: 0.5, value: 10 },
    { type: 'slider', key: 'B', label: '1년차 연간 효익 (억원)', min: 0.5, max: 10, step: 0.1, value: 3.2, hint: '인건비 절감, 재고 감소, 매출 증대 등' },
    { type: 'slider', key: 'g', label: '효익 증가율 (%/년)', min: -10, max: 20, step: 1, value: 5 },
    { type: 'slider', key: 'm', label: '연간 유지보수비 (초기비 대비 %)', min: 0, max: 30, step: 1, value: 15, hint: '라이선스·운영 인력·업그레이드 (TCO)' },
    { type: 'slider', key: 'r', label: '할인율 (%)', min: 0, max: 20, step: 0.5, value: 8, hint: '자본비용 또는 요구수익률' },
    { type: 'slider', key: 'Y', label: '사용 기간 (년)', min: 3, max: 10, step: 1, value: 6 },
  ],
  concept: `
    <p>IT 투자는 돈이 먼저 나가고 효익은 여러 해에 걸쳐 들어옵니다. 오늘의 1억 원과 5년 뒤의 1억 원은 가치가 다르므로 미래 현금흐름을 할인율로 <b>현재가치</b>로 바꿔 비교합니다.</p>
    <ul>
      <li><b>NPV(순현재가치)</b> = 할인된 순현금흐름의 합. NPV > 0이면 요구수익률보다 더 버는 투자입니다.</li>
      <li><b>IRR(내부수익률)</b> = NPV를 0으로 만드는 할인율. IRR이 자본비용보다 크면 채택합니다.</li>
      <li><b>ROI</b> = (총효익 − 총비용) / 총비용. 계산은 쉽지만 시간가치를 무시합니다.</li>
      <li><b>회수기간</b> = 누적 현금흐름이 0을 넘는 시점. 위험을 보는 데 유용하지만 회수 이후의 효익은 보지 않습니다.</li>
    </ul>
    <p>IT 투자 평가가 어려운 이유는 효익 추정이 불확실하기 때문입니다. 이른바 생산성 역설(Brynjolfsson, 1993) 논의처럼 IT의 효익은 조직 변화와 함께 늦게 나타나는 경우가 많습니다. 그래서 핵심 가정을 ±20% 흔들어 보는 <em>민감도 분석</em>을 함께 제시합니다.</p>
    <p>비용은 구매가뿐 아니라 운영, 교육, 업그레이드를 모두 포함한 <b>총소유비용(TCO)</b>으로 잡아야 합니다. 정보화 사업 타당성 평가에서도 같은 방식을 씁니다.</p>`,
  formula: `<var>CF</var><sub>0</sub> = −<var>I</var>, &nbsp; <var>CF</var><sub>t</sub> = <var>B</var>(1+<var>g</var>)<sup>t−1</sup> − <var>m</var>·<var>I</var><br>NPV = Σ<sub>t=0..Y</sub> <var>CF</var><sub>t</sub> / (1+<var>r</var>)<sup>t</sup><br>IRR: Σ <var>CF</var><sub>t</sub> / (1+IRR)<sup>t</sup> = 0<br>ROI = (Σ효익 − Σ비용) / Σ비용`,
  tasks: [
    '할인율을 0%에서 15%로 올려 보세요. 같은 현금흐름인데 NPV가 얼마나 줄어드나요? 그때 IRR은 변하나요?',
    '유지보수비를 25%로 올리면 NPV가 음수가 되나요? TCO를 빠뜨리면 어떤 판단 오류가 생길까요?',
    '민감도 차트에서 NPV를 가장 크게 흔드는 가정은 무엇인가요? 그 가정을 검증하는 데 예산을 써야 하는 이유를 생각해 보세요.',
    '사용 기간을 3년으로 줄이면 회수기간 안에 투자를 회수할 수 있나요?',
  ],
  tools: {
    Excel: (p) => `[엑셀]
B1: 할인율 ${p.r}%       B2: 초기투자 ${p.I}
A5:A${5 + p.Y}  연도 0..${p.Y}
B5: =-$B$2
B6: =${p.B}*(1+${p.g}%)^(A6-1) - ${p.m}%*$B$2   ← 아래로 채우기
NPV:  =NPV(B1, B6:B${5 + p.Y}) + B5
IRR:  =IRR(B5:B${5 + p.Y})
누적: C5 =B5,  C6 =C5+B6   (회수기간 = 처음 양수가 되는 연도)`,
    r: (p) => `I <- ${p.I}; B <- ${p.B}; g <- ${p.g / 100}; m <- ${p.m / 100}; r <- ${p.r / 100}; Y <- ${p.Y}
t  <- 1:Y
cf <- c(-I, B * (1 + g)^(t - 1) - m * I)
npv <- function(rate) sum(cf / (1 + rate)^(0:Y))
npv(r)
uniroot(npv, c(-0.99, 5))$root   # IRR
cumsum(cf)                       # 회수기간 확인
# 민감도: 효익 ±20%
sapply(c(0.8, 1.2), function(k) { cf2 <- c(-I, k * B * (1 + g)^(t - 1) - m * I); sum(cf2 / (1 + r)^(0:Y)) })`,
  },
  calc(v) {
    const I = v.I, B = v.B, g = v.g / 100, m = v.m / 100, r = v.r / 100, Y = v.Y;
    const cf = [-I]; for (let t = 1; t <= Y; t++) cf.push(B * (1 + g) ** (t - 1) - m * I);
    const npvAt = (rate) => cf.reduce((s, c, t) => s + c / (1 + rate) ** t, 0);
    const npv = npvAt(r);
    let irr = NaN; if (npvAt(-0.95) * npvAt(10) < 0) { let lo = -0.95, hi = 10; for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (npvAt(mid) > 0) lo = mid; else hi = mid; } irr = (lo + hi) / 2; }
    const benefits = S.sum(cf.slice(1).map((_, t) => B * (1 + g) ** t)), costs = I + m * I * Y, roi = (benefits - costs) / costs;
    const payback = (disc) => { let cum = cf[0]; for (let t = 1; t <= Y; t++) { const c = disc ? cf[t] / (1 + r) ** t : cf[t]; if (cum + c >= 0 && c > 0) return t - 1 + (-cum) / c; cum += c; } return Infinity; };
    return { cf, npv, irr, roi, pb: payback(false), dpb: payback(true), r };
  },
  init(ctx) {
    ctx.state.cf = ctx.plot({ x: [-0.5, 6.5], y: [-10, 5], height: 290, xLabel: '연도', yLabel: '억원', title: '연도별 순현금흐름과 누적 현재가치', xTicks: 7 });
    ctx.state.tor = ctx.plot({ x: [-5, 5], y: [0, 5], height: 250, hideY: true, xLabel: 'NPV (억원)', title: '민감도 분석: 각 가정을 ±20% 바꿨을 때 NPV', margin: { l: 118 } });
  },
  update(ctx, v) {
    const C = Lab.C, mod = Lab.byId['mis-npv'], R = mod.calc(v), Y = v.Y;
    const disc = R.cf.map((c, t) => c / (1 + R.r) ** t), cum = []; disc.reduce((s, c, i) => (cum[i] = s + c), 0);
    const lo = Math.min(0, ...R.cf, ...cum), hi = Math.max(0, ...R.cf, ...cum);
    const p = ctx.state.cf.setX([-0.5, Y + 0.5]).setY([lo * 1.15 - 0.2, hi * 1.2 + 0.2]); p.clear();
    p.hline(0, { color: C.ink2, width: 1 });
    p.bars(R.cf.map((c, t) => ({ x: t, y: c, color: c >= 0 ? C.s1 : C.s8, tip: () => `<b>${t}년차</b><br>순현금흐름 ${S.f(c, 2)}억원<br>현재가치 ${S.f(disc[t], 2)}억원` })), { dw: 0.6 });
    p.line(cum.map((c, t) => [t, c]), { color: C.marker, width: 2 });
    p.dots(cum.map((c, t) => [t, c]), { color: C.marker, r: 4, tip: (d) => `${d.i}년차 누적 현재가치 ${S.f(d.y, 2)}억원` });
    if (isFinite(R.dpb)) p.vline(R.dpb, { color: C.good, dash: true, label: `할인 회수 ${S.f(R.dpb, 1)}년`, anchor: R.dpb > Y * 0.7 ? 'end' : 'start' });
    p.text(Y, cum[Y], `NPV ${S.f(R.npv, 2)}`, { anchor: 'end', dy: R.npv >= 0 ? -10 : 16, dx: -4 });
    p.legend([{ label: '순현금흐름 (+)', color: C.s1, type: 'box' }, { label: '순현금흐름 (−)', color: C.s8, type: 'box' }, { label: '누적 현재가치', color: C.marker, type: 'line' }]);

    // tornado
    const factors = [['B', '연간 효익'], ['I', '초기 투자비'], ['m', '유지보수비율'], ['r', '할인율'], ['g', '효익 증가율']];
    const rows = factors.map(([k, lab]) => {
      const a = mod.calc(Object.assign({}, v, { [k]: v[k] * 0.8 })).npv, b = mod.calc(Object.assign({}, v, { [k]: v[k] * 1.2 })).npv;
      return { k, lab, a, b, span: Math.abs(b - a) };
    }).sort((x, y) => y.span - x.span);
    const ext = Math.max(...rows.map((d) => Math.max(Math.abs(d.a - R.npv), Math.abs(d.b - R.npv)))) * 1.25 + 0.1;
    const tor = ctx.state.tor.setX([R.npv - ext, R.npv + ext]).setY([0, rows.length]); tor.clear();
    rows.forEach((d, i) => {
      const y1 = rows.length - i - 0.2, y0 = rows.length - i - 0.8;
      tor.rect(Math.min(R.npv, d.a), Math.max(R.npv, d.a), y0, y1, { color: C.s2, opacity: 0.85, layer: 'data' });
      tor.rect(Math.min(R.npv, d.b), Math.max(R.npv, d.b), y0, y1, { color: C.s1, opacity: 0.85, layer: 'data' });
      tor.g('over').append('text').attr('class', 'mk-label').attr('x', -8).attr('y', tor.y((y0 + y1) / 2) + 4).attr('text-anchor', 'end').text(d.lab);
    });
    tor.vline(R.npv, { color: C.ink, label: '기준 NPV', labelY: -2 });
    if (R.npv - ext < 0 && R.npv + ext > 0 && Math.abs(R.npv) > ext * 0.05) tor.vline(0, { color: C.bad, dash: true, width: 1 });
    tor.legend([{ label: '가정 −20%', color: C.s2, type: 'box' }, { label: '가정 +20%', color: C.s1, type: 'box' }]);

    const top = rows[0];
    ctx.readout([
      { label: `NPV (할인율 ${v.r}%)`, value: S.f(R.npv, 2) + '억', tone: R.npv >= 0 ? 'good' : 'bad' },
      { label: 'IRR', value: isFinite(R.irr) ? S.pct(R.irr, 1) : '없음', sub: isFinite(R.irr) ? (R.irr > v.r / 100 ? '자본비용보다 높음' : '자본비용보다 낮음') : '부호 변화 없음' },
      { label: 'ROI (단순)', value: S.pct(R.roi, 0), sub: '시간가치 무시' },
      { label: '회수기간', value: isFinite(R.pb) ? S.f(R.pb, 1) + '년' : `${Y}년 내 미회수`, sub: `할인 회수 ${isFinite(R.dpb) ? S.f(R.dpb, 1) + '년' : '불가'}` },
    ]);
    let msg = R.npv >= 0
      ? `할인율 ${v.r}%로 따져도 ${S.f(R.npv, 2)}억 원의 가치를 만드는 투자입니다.`
      : `NPV가 ${S.f(R.npv, 2)}억 원으로 음수입니다. 단순 ROI는 ${S.pct(R.roi, 0)}${R.roi > 0 ? '로 양수지만 시간가치를 반영하면 손해입니다' : '입니다'}.`;
    msg += ` NPV를 가장 크게 흔드는 가정은 <b>${top.lab}</b>이며, ±20% 오차로 NPV가 ${S.f(Math.min(top.a, top.b), 1)} ~ ${S.f(Math.max(top.a, top.b), 1)}억 원 사이에서 움직입니다.`;
    if (Math.min(...rows.map((d) => Math.min(d.a, d.b))) < 0 && R.npv > 0) msg += ' 가정이 조금만 빗나가도 NPV가 음수로 바뀔 수 있습니다.';
    ctx.insight(msg);
  },
});
