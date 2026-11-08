/* MIS · A/B 테스트 — many simulated experiments; fixed-horizon vs daily peeking (optional stopping). */
Lab.add({
  id: 'mis-abtest', subject: 'mis', order: 7,
  title: 'A/B 테스트와 데이터 기반 의사결정', en: 'A/B testing · sample size · peeking problem',
  summary: '전환율 실험을 수백 번 반복해, 결과를 매일 들여다보다 p < .05가 나오면 멈추는 습관이 거짓 승자를 얼마나 늘리는지 확인합니다.',
  keywords: 'AB test A/B 전환율 peeking optional stopping 표본크기 실험 검정력',
  controls: [
    { type: 'slider', key: 'base', label: '기존 전환율 (A안)', min: 0.01, max: 0.2, step: 0.005, value: 0.05, fmt: (v) => (v * 100).toFixed(1) + '%' },
    { type: 'slider', key: 'lift', label: 'B안의 실제 상대 개선', min: 0, max: 0.3, step: 0.01, value: 0.1, fmt: (v) => '+' + Math.round(v * 100) + '%' },
    { type: 'slider', key: 'traffic', label: '하루 방문자 (안별)', min: 200, max: 5000, step: 100, value: 1000 },
    { type: 'slider', key: 'days', label: '계획한 실험 기간 (일)', min: 7, max: 60, step: 1, value: 28 },
    { type: 'slider', key: 'alpha', label: '유의수준 α', min: 0.01, max: 0.1, step: 0.01, value: 0.05 },
    { type: 'toggle', key: 'aa', label: '경로 그림: 실제 차이 없음 (A/A 테스트)', value: true },
    { type: 'button', key: 'resample', label: '실험 400회 다시 돌리기', primary: true },
  ],
  concept: `
    <p><b>A/B 테스트</b>는 사용자를 무작위로 두 화면(A, B)에 나눠 전환율을 비교하는 온라인 통제실험입니다. 무작위 배정 덕분에 다른 요인이 통제되므로 차이를 B안의 효과로 해석할 수 있습니다. 데이터 기반 의사결정(Kohavi 외, 2020)의 기본 도구입니다.</p>
    <ul>
      <li>두 비율의 차이는 <b>z검정</b>(또는 카이제곱 검정)으로 판단합니다.</li>
      <li>실험 전에 <b>최소탐지효과(MDE)</b>, α, 검정력(보통 80%)으로 필요한 표본크기를 정하고 그 기간만큼 돌립니다.</li>
      <li>전환율이 낮고 개선 폭이 작을수록 필요한 방문자 수가 급격히 늘어납니다.</li>
    </ul>
    <p>흔한 실수는 <em>엿보기(peeking)</em>입니다. 매일 p값을 확인하다 처음으로 p < .05가 나오는 날 멈추면, 실제로 차이가 없어도 "B가 이겼다"는 결론이 5%보다 훨씬 자주 나옵니다. p값은 데이터가 쌓이는 동안 무작위로 오르내리기 때문에 여러 번 보면 한 번쯤 기준선 아래로 내려갈 가능성이 큽니다. 다중비교 문제와 같은 원리입니다.</p>
    <p>중간에 확인해야 한다면 검정 횟수를 미리 정하고 α를 나눠 쓰는 순차검정(O'Brien-Fleming 경계 등)이나 베이지안 방법을 써야 합니다.</p>`,
  formula: `<var>z</var> = (<var>p̂<sub>B</sub></var> − <var>p̂<sub>A</sub></var>) / √( <var>p̄</var>(1−<var>p̄</var>)(1/<var>n<sub>A</sub></var> + 1/<var>n<sub>B</sub></var>) )<br>안별 표본크기 <var>n</var> = [<var>z</var><sub>1−α/2</sub>√(2<var>p̄</var>(1−<var>p̄</var>)) + <var>z</var><sub>1−β</sub>√(<var>p₁</var>(1−<var>p₁</var>) + <var>p₂</var>(1−<var>p₂</var>))]² / (<var>p₂</var> − <var>p₁</var>)²`,
  tasks: [
    'A/A 테스트(실제 차이 없음)에서 "매일 확인" 방식의 거짓 승자 비율을 보세요. α = 5%보다 몇 배 높나요?',
    '실험 기간을 7일에서 60일로 늘리면 엿보기의 거짓 양성률은 어떻게 변하나요? 확인 횟수가 늘기 때문입니다.',
    '기존 전환율 2%, 개선 +5%일 때 필요한 표본크기는 하루 1,000명 기준 며칠 분량인가요?',
    '실제 개선 +10%에서 계획 기간의 검정력이 80%에 못 미치면, 기간이나 방문자를 어떻게 바꿔야 할까요?',
  ],
  tools: {
    r: (p) => `# 필요한 표본크기 (안별)
power.prop.test(p1 = ${p.base}, p2 = ${+(p.base * (1 + p.lift)).toFixed(4)}, sig.level = ${p.alpha}, power = 0.8)

# 실험 종료 후 검정 (예: 전환 수 xA, xB / 방문 nA, nB)
prop.test(x = c(xA, xB), n = c(nA, nB), correct = FALSE)

# 엿보기 시뮬레이션
set.seed(1); days <- ${p.days}; n <- ${p.traffic}; pA <- ${p.base}
peek_fp <- replicate(2000, {
  a <- cumsum(rbinom(days, n, pA)); b <- cumsum(rbinom(days, n, pA))
  N <- n * (1:days)
  pv <- sapply(1:days, function(d) prop.test(c(a[d], b[d]), c(N[d], N[d]), correct = FALSE)$p.value)
  any(pv < ${p.alpha})
})
mean(peek_fp)   # 실제 차이 없는데 '승자'를 선언한 비율`,
    Excel: (p) => `[엑셀 / 스프레드시트에서 최종 검정]
B2: A 방문자   C2: A 전환     B3: B 방문자   C3: B 전환
D2: =C2/B2     D3: =C3/B3                       (전환율)
E2: =(C2+C3)/(B2+B3)                             (합동 비율)
F2: =(D3-D2)/SQRT(E2*(1-E2)*(1/B2+1/B3))         (z)
G2: =2*(1-NORM.S.DIST(ABS(F2),TRUE))             (양측 p값)
→ 계획한 ${p.days}일이 끝난 뒤 한 번만 판단, α = ${p.alpha}`,
  },
  init(ctx) {
    ctx.state.traj = ctx.plot({ x: [1, 28], y: [0, 1], height: 280, xLabel: '실험 경과일', yLabel: '누적 데이터의 p값', title: '실험 20개의 p값 경로' });
    ctx.state.bar = ctx.plot({ xBand: ['A/A: 거짓 승자', 'A/B: 진짜 승자 발견'], y: [0, 1], height: 250, yLabel: '실험 중 비율', title: '400회 실험 결과: 계획대로 vs 매일 확인', yFmt: d3.format('.0%') });
    ctx.state.seed = 21;
  },
  update(ctx, v, changed) {
    if (changed === 'resample') ctx.state.seed++;
    S.seed(ctx.state.seed);
    const C = Lab.C, D = v.days, n = v.traffic, pA = v.base, pB = Math.min(0.99, v.base * (1 + v.lift)), za = S.qnorm(1 - v.alpha / 2);
    const draw = (p) => Math.max(0, Math.round(n * p + Math.sqrt(n * p * (1 - p)) * S.randn()));
    const runOne = (pb) => {
      let a = 0, b = 0; const pv = [];
      for (let d = 1; d <= D; d++) {
        a += draw(pA); b += draw(pb); const N = n * d, pa = a / N, pbh = b / N, pbar = (a + b) / (2 * N);
        const se = Math.sqrt(Math.max(1e-12, pbar * (1 - pbar) * 2 / N)), z = (pbh - pa) / se;
        pv.push(2 * (1 - S.pnorm(Math.abs(z))));
      }
      return pv;
    };
    const R = 400, res = { aaFix: 0, aaPeek: 0, abFix: 0, abPeek: 0 }, keep = { aa: [], ab: [] };
    for (let i = 0; i < R; i++) {
      const p0 = runOne(pA), p1 = runOne(pB);
      if (p0[D - 1] < v.alpha) res.aaFix++; if (p0.some((x) => x < v.alpha)) res.aaPeek++;
      if (p1[D - 1] < v.alpha) res.abFix++; if (p1.some((x) => x < v.alpha)) res.abPeek++;
      if (i < 20) { keep.aa.push(p0); keep.ab.push(p1); }
    }
    Object.keys(res).forEach((k) => (res[k] /= R));

    // required n per arm
    const pbar = (pA + pB) / 2, zb = S.qnorm(0.8), diff = pB - pA;
    const nReq = diff > 0 ? Math.ceil((za * Math.sqrt(2 * pbar * (1 - pbar)) + zb * Math.sqrt(pA * (1 - pA) + pB * (1 - pB))) ** 2 / diff ** 2) : Infinity;
    const daysReq = nReq / n;

    const tr = ctx.state.traj.setX([1, D]); tr.clear();
    const set = v.aa ? keep.aa : keep.ab;
    tr.rect(1, D, 0, v.alpha, { color: C.s8, opacity: 0.1 });
    set.forEach((pv) => {
      const hit = pv.some((x) => x < v.alpha), finalSig = pv[D - 1] < v.alpha;
      tr.line(pv.map((y, d) => [d + 1, y]), { color: hit ? (finalSig ? C.s1 : C.s2) : C.muted, width: hit ? 1.6 : 1.1, opacity: hit ? 0.9 : 0.45 });
    });
    tr.hline(v.alpha, { color: C.s8, dash: true, label: `α = ${v.alpha}` });
    tr.legend([{ label: '중간에 한 번이라도 p < α (엿보면 "승자" 선언)', color: C.s2, type: 'line' }, { label: '마지막 날에도 p < α', color: C.s1, type: 'line' }, { label: '끝까지 유의하지 않음', color: C.muted, type: 'line' }]);

    const bp = ctx.state.bar; bp.clear();
    const bw = 34;
    bp.hline(v.alpha, { color: C.s8, dash: true, label: `α = ${S.pct(v.alpha, 0)}`, anchor: 'start' });
    bp.hline(0.8, { color: C.muted, dash: true, label: '검정력 80%' });
    bp.bars([
      { x: 'A/A: 거짓 승자', y: res.aaFix, color: C.s1, off: -bw / 2 - 3, w: bw, tip: () => `계획대로 ${D}일 후 1회 검정<br>거짓 양성 ${S.pct(res.aaFix)}` },
      { x: 'A/A: 거짓 승자', y: res.aaPeek, color: C.s2, off: bw / 2 + 3, w: bw, tip: () => `매일 확인하다 p<α면 중단<br>거짓 양성 ${S.pct(res.aaPeek)}` },
      { x: 'A/B: 진짜 승자 발견', y: res.abFix, color: C.s1, off: -bw / 2 - 3, w: bw, tip: () => `계획대로: 검정력 ${S.pct(res.abFix)}` },
      { x: 'A/B: 진짜 승자 발견', y: res.abPeek, color: C.s2, off: bw / 2 + 3, w: bw, tip: () => `매일 확인: ${S.pct(res.abPeek)}` },
    ], { labels: (d) => S.pct(d.y, 0), maxW: bw });
    bp.legend([{ label: `계획대로 ${D}일 후 한 번 검정`, color: C.s1, type: 'box' }, { label: '매일 확인, p < α면 즉시 중단', color: C.s2, type: 'box' }]);

    ctx.readout([
      { label: '거짓 승자 비율 (매일 확인)', value: S.pct(res.aaPeek, 1), tone: res.aaPeek > v.alpha * 2 ? 'bad' : 'warn', sub: `계획대로 ${S.pct(res.aaFix, 1)}` },
      { label: '검정력 (계획대로)', value: S.pct(res.abFix, 0), tone: res.abFix >= 0.8 ? 'good' : null, sub: `B안 전환율 ${S.pct(pB, 2)}` },
      { label: '필요 표본크기 (안별)', value: isFinite(nReq) ? S.comma(nReq) + '명' : '—', sub: '검정력 80% 기준' },
      { label: '필요 기간', value: isFinite(daysReq) ? S.f(daysReq, 1) + '일' : '—', sub: `하루 ${S.comma(n)}명 기준` },
    ]);
    let msg = `실제 차이가 없는데도 매일 확인하면 ${S.pct(res.aaPeek, 0)}의 실험에서 "B가 이겼다"고 잘못 결론 내립니다. 계획대로 한 번만 검정하면 ${S.pct(res.aaFix, 0)}로 α 근처에 머뭅니다.`;
    if (v.lift > 0 && isFinite(daysReq)) msg += daysReq > D ? ` 또한 +${Math.round(v.lift * 100)}% 개선을 80% 확률로 잡으려면 ${S.f(daysReq, 0)}일이 필요해서, 계획한 ${D}일은 부족합니다.` : ` 계획한 ${D}일이면 +${Math.round(v.lift * 100)}% 개선을 ${S.pct(res.abFix, 0)} 확률로 찾아냅니다.`;
    ctx.insight(msg);
  },
});
