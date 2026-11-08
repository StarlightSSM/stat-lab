/* 신뢰구간: 100개 구간 중 몇 개가 모평균을 포함하는가 */
(function () {
  const MU = 50, SIGMA = 10, SHOW = 100;
  function intervals(st, v) {
    const a = 1 - v.conf;
    return st.samples.map((s) => {
      const crit = v.known ? S.qnorm(1 - a / 2) : st.tcrit, sd = v.known ? SIGMA : s.sd, half = crit * sd / Math.sqrt(v.n);
      return { m: s.m, lo: s.m - half, hi: s.m + half, half, hit: s.m - half <= MU && MU <= s.m + half };
    });
  }
  function addSamples(st, v, k) {
    for (let j = 0; j < k; j++) { const x = S.rnormVec(v.n, MU, SIGMA); st.samples.push({ m: S.mean(x), sd: S.sd(x) }); }
    if (st.samples.length > 10000) st.samples = st.samples.slice(-10000);
  }
  Lab.add({
    id: 'ci', subject: 'prob', order: 7,
    title: '신뢰구간', en: 'Confidence intervals',
    summary: '같은 모집단에서 100번 표본을 뽑아 구간을 만들면 몇 개가 참값을 포함할까요? 신뢰수준, 표본크기, σ를 아는지에 따라 구간이 어떻게 바뀌는지 봅니다.',
    keywords: 'confidence interval 신뢰수준 오차한계 표준오차 t분포 coverage',
    controls: [
      { type: 'slider', key: 'conf', label: '신뢰수준', min: 0.5, max: 0.99, step: 0.01, value: 0.95, fmt: (v) => Math.round(v * 100) + '%' },
      { type: 'slider', key: 'n', label: '표본 크기 n', min: 3, max: 200, step: 1, value: 10 },
      { type: 'toggle', key: 'known', label: 'σ를 안다고 가정 (z 구간)', value: false },
      { type: 'button', key: 'resample', label: '새로 100개', primary: true },
      { type: 'button', key: 'more', label: '1,000개 더 (누적)' },
    ],
    concept: `
      <p>모집단 평균 μ(여기서는 50)는 고정된 값이고, 표본에 따라 달라지는 것은 구간입니다. <b>95% 신뢰구간</b>의 뜻은 "같은 방법으로 구간을 무수히 만들면 그중 95%가 μ를 포함한다"입니다. 이미 계산된 구간 하나가 μ를 포함할 확률이 95%라는 뜻이 아닙니다. 그 구간은 μ를 포함하거나, 포함하지 않거나 둘 중 하나입니다.</p>
      <ul>
        <li><b>오차한계</b> = 임계값 × 표준오차. 신뢰수준을 올리면 임계값이 커져 구간이 넓어집니다.</li>
        <li>n을 4배 늘리면 표준오차가 절반이 되어 구간 폭도 절반이 됩니다.</li>
        <li>σ를 모르면 표본표준편차 s로 대신하고 z 대신 <b>t분포</b> 임계값(자유도 n−1)을 씁니다. s가 표본마다 달라서 구간 폭도 들쭉날쭉하고, 작은 n에서는 t 임계값이 z보다 커서 구간이 넓어집니다.</li>
      </ul>
      <p>σ를 모르는데 z를 쓰면 작은 표본에서 실제 포함률이 명목 신뢰수준보다 낮아집니다. n = 5 정도에서 σ 토글을 켠 채로 s를 쓰는 상황을 상상해 보세요. 그래서 실무에서는 거의 항상 t 구간을 씁니다.</p>`,
    formula: `σ를 알 때: x̄ ± <var>z</var><sub>α/2</sub> · σ/√<var>n</var><br>σ를 모를 때: x̄ ± <var>t</var><sub>α/2, n−1</sub> · <var>s</var>/√<var>n</var><br><span class="c">95%: z = 1.960, &nbsp; t(df=9) = 2.262, &nbsp; t(df=29) = 2.045</span>`,
    tasks: [
      '신뢰수준 95%, n = 10에서 "새로 100개"를 여러 번 눌러 보세요. 빨간 구간이 매번 정확히 5개인가요?',
      '신뢰수준을 80%로 낮추면 빨간 구간이 몇 개쯤 되나요? 구간 폭은 어떻게 변하나요?',
      'σ 토글을 켜고 끄며 구간 폭이 일정한 경우와 들쭉날쭉한 경우를 비교하세요.',
      '"1,000개 더"로 누적 포함률이 신뢰수준에 수렴하는지 확인하세요. n = 3에서도 그런가요?',
    ],
    tools: {
      r: (v) => `set.seed(1)
mu <- ${MU}; sigma <- ${SIGMA}; n <- ${v.n}; conf <- ${v.conf}

# 표본 하나의 구간
x <- rnorm(n, mu, sigma)
${v.known ? `mean(x) + c(-1, 1) * qnorm(1 - (1 - conf) / 2) * sigma / sqrt(n)` : `t.test(x, conf.level = conf)$conf.int`}

# 100번 반복해 포함률 확인
covered <- replicate(100, {
  x <- rnorm(n, mu, sigma)
  ci <- ${v.known ? 'mean(x) + c(-1, 1) * qnorm(1 - (1 - conf) / 2) * sigma / sqrt(n)' : 't.test(x, conf.level = conf)$conf.int'}
  ci[1] <= mu & mu <= ci[2]
})
mean(covered)`,
      spss: (v) => `* 분석 > 기술통계량 > 데이터 탐색 > 통계량: 평균에 대한 신뢰구간 ${Math.round(v.conf * 100)}%.
EXAMINE VARIABLES = x
  /STATISTICS DESCRIPTIVES
  /CINTERVAL ${Math.round(v.conf * 100)}
  /PLOT NONE.

* 또는 일표본 T검정의 신뢰구간 (검정값 0이면 평균 자체의 CI).
T-TEST /TESTVAL = 0 /VARIABLES = x /CRITERIA = CI(${v.conf}).`,
    },
    init(ctx) {
      ctx.state.plot = ctx.plot({ x: [30, 70], y: [SHOW + 1, 0], yTicks: 5, height: 520, xLabel: '값 (모평균 μ = 50)', yLabel: '표본 번호', margin: { t: 18 } });
      ctx.state.seed = 21;
    },
    update(ctx, v, changed) {
      const st = ctx.state, C = Lab.C;
      if (['init', 'n', 'resample'].includes(changed)) { if (changed === 'resample') st.seed++; S.seed(st.seed * 31 + v.n); st.samples = []; addSamples(st, v, SHOW); }
      if (changed === 'more') addSamples(st, v, 1000);
      st.tcrit = S.qt(1 - (1 - v.conf) / 2, v.n - 1);
      const all = intervals(st, v), shown = all.slice(-SHOW);
      const maxHalf = Math.max(...shown.map((d) => d.half), 3);
      const w = Math.min(60, Math.max(8, maxHalf * 1.35 + 4));
      const p = st.plot; p.setX([MU - w, MU + w]); p.clear();
      p.vline(MU, { color: C.ink, width: 1.5, label: 'μ = 50', labelY: -6 });
      const g = p.g('data');
      const rows = shown.map((d, i) => Object.assign({ i: i + 1 }, d));
      const sel = g.selectAll('g.ci').data(rows).join('g').attr('class', 'ci');
      sel.append('line').attr('x1', (d) => p.x(Math.max(d.lo, MU - w))).attr('x2', (d) => p.x(Math.min(d.hi, MU + w))).attr('y1', (d) => p.y(d.i)).attr('y2', (d) => p.y(d.i))
        .style('stroke', (d) => (d.hit ? C.s1 : C.s8)).style('stroke-width', (d) => (d.hit ? 2 : 2.6)).style('opacity', (d) => (d.hit ? 0.75 : 1));
      sel.append('circle').attr('cx', (d) => p.x(d.m)).attr('cy', (d) => p.y(d.i)).attr('r', 2.4).style('fill', (d) => (d.hit ? C.s1 : C.s8));
      sel.append('rect').attr('x', 0).attr('width', p.iw).attr('y', (d) => p.y(d.i) - 2.5).attr('height', 5).style('fill', 'transparent')
        .on('mouseenter', (ev, d) => Lab.tip.show(`<b>표본 #${d.i}</b><br>x̄ = ${S.f(d.m, 2)}<br>[${S.f(d.lo, 2)}, ${S.f(d.hi, 2)}]<br>${d.hit ? 'μ 포함' : '<b>μ를 놓침</b>'}`, ev))
        .on('mousemove', (ev) => Lab.tip.move(ev)).on('mouseleave', () => Lab.tip.hide());
      p.legend([{ label: 'μ를 포함한 구간', color: C.s1, type: 'line' }, { label: 'μ를 놓친 구간', color: C.s8, type: 'line' }, { label: '참 평균 μ', color: C.ink, type: 'line' }]);

      const hits = shown.filter((d) => d.hit).length, cov = all.filter((d) => d.hit).length / all.length;
      const crit = v.known ? S.qnorm(1 - (1 - v.conf) / 2) : st.tcrit, avgW = 2 * S.mean(shown.map((d) => d.half));
      ctx.readout([
        { label: '최근 100개 중 포함', value: `${hits}개`, sub: `놓침 ${SHOW - hits}개`, tone: 'accent' },
        { label: `누적 포함률 (${S.comma(all.length)}개)`, value: S.pct(cov), sub: `목표 ${Math.round(v.conf * 100)}%`, tone: Math.abs(cov - v.conf) < 0.02 || all.length <= SHOW ? 'good' : 'warn' },
        { label: '임계값', value: S.f(crit, 3), sub: v.known ? 'z' : `t (df = ${v.n - 1})` },
        { label: '평균 구간 폭', value: S.f(avgW, 2), sub: `2 × ${S.f(crit, 2)} × ${v.known ? 'σ' : 's'}/√${v.n}` },
      ]);
      let msg = `${Math.round(v.conf * 100)}% 구간 100개 중 <b>${hits}개</b>가 μ = 50을 포함했고 <b>${SHOW - hits}개</b>는 놓쳤습니다. 기대값은 ${S.f(SHOW * (1 - v.conf), 0)}개입니다.`;
      if (!v.known && v.n < 15) msg += ` n이 작아 t 임계값(${S.f(crit, 2)})이 z(${S.f(S.qnorm(1 - (1 - v.conf) / 2), 2)})보다 크고, s가 표본마다 달라 구간 폭이 들쭉날쭉합니다.`;
      if (v.known) msg += ' σ를 알기 때문에 모든 구간의 폭이 같고, 표본평균의 위치만 달라집니다.';
      ctx.insight(msg);
    },
  });
})();
