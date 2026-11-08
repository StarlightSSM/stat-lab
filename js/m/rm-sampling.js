/* 행동연구방법론 · 표본추출 방법과 편향 */
Lab.add({
  id: 'rm-sampling', subject: 'rm', order: 3,
  title: '표본추출 방법과 편향', en: 'Sampling designs · bias and variance',
  summary: '400명의 학생 모집단에서 단순무작위·층화·군집·편의 표본을 뽑아 보고, 수백 번 반복했을 때 추정치가 얼마나 치우치고 흔들리는지 비교합니다.',
  keywords: 'sampling 표집 층화 군집 편의표본 무작위 설계효과 design effect',
  controls: [
    { type: 'select', key: 'method', label: '표본추출 방법', options: [['srs', '단순무작위'], ['strat', '층화'], ['cluster', '군집'], ['conv', '편의']], value: 'srs' },
    { type: 'slider', key: 'n', label: '표본크기 n', min: 20, max: 100, step: 20, value: 40 },
    { type: 'slider', key: 'icc', label: '같은 반 학생끼리 닮은 정도', min: 0, max: 8, step: 0.5, value: 4, hint: '반(군집) 효과의 표준편차' },
    { type: 'button', key: 'draw', label: '표본 한 번 뽑기', primary: true },
    { type: 'button', key: 'rep', label: '500번 다시 반복' },
  ],
  concept: `
    <p>모집단 전체를 조사할 수 없을 때 표본을 뽑습니다. 좋은 표본설계는 <b>편향</b>(평균적으로 정답에서 벗어난 정도)이 없고, <b>분산</b>(표본마다 추정치가 흔들리는 정도)이 작습니다.</p>
    <ul>
      <li><b>단순무작위추출</b>: 모든 사람이 같은 확률로 뽑힙니다. 편향은 없고, 다른 설계를 비교하는 기준이 됩니다.</li>
      <li><b>층화추출</b>: 학년처럼 결과와 관련된 기준으로 모집단을 나눈 뒤 층마다 비율대로 뽑습니다. 층 간 차이가 클수록 분산이 줄어듭니다.</li>
      <li><b>군집추출</b>: 반 단위로 통째로 뽑습니다. 비용은 싸지만, 같은 반 학생들이 서로 닮았으면 실질 정보가 줄어 분산이 커집니다(설계효과 &gt; 1).</li>
      <li><b>편의추출</b>: 가까이 있는 사람부터 조사합니다. 표본을 늘려도 <em>편향은 줄지 않습니다</em>.</li>
    </ul>
    <p>표본크기를 키우면 분산은 줄지만 편향은 그대로입니다. 그래서 대규모 온라인 설문이라도 응답자가 스스로 선택했다면 결과를 모집단에 일반화하기 어렵습니다.</p>`,
  formula: `MSE = 편향² + 분산<br>SE(단순무작위) ≈ σ / √<var>n</var><br>설계효과 deff = Var(설계) / Var(단순무작위) ≈ 1 + (<var>m</var>−1)·ICC &nbsp;<span class="c">(m = 군집 크기)</span>`,
  tasks: [
    "'편의'를 고르고 n을 20에서 100으로 늘려 보세요. 편향이 줄어드나요, 분산이 줄어드나요?",
    "반 효과를 8로 올리고 '군집'과 '단순무작위'의 흩어짐을 비교하세요. 설계효과는 얼마인가요?",
    '반 효과를 0으로 내리면 군집추출의 설계효과가 1에 가까워지는 이유를 설명해 보세요.',
    '층화추출이 단순무작위보다 표준오차가 작은 이유를 학년별 평균 차이로 설명해 보세요.',
  ],
  tools: {
    r: (p) => `library(dplyr)
# pop: id, grade(1~4), class(1~40), score
srs    <- slice_sample(pop, n = ${p.n})
strat  <- pop %>% group_by(grade) %>% slice_sample(n = ${p.n / 4}) %>% ungroup()
cls    <- sample(unique(pop$class), ${p.n / 10})
clus   <- filter(pop, class %in% cls)

# 반복추출로 표본분포 비교
est <- replicate(500, mean(slice_sample(pop, n = ${p.n})$score))
c(bias = mean(est) - mean(pop$score), se = sd(est))

# 복합표본 분석은 survey 패키지
library(survey)
des <- svydesign(ids = ~class, data = clus)   # 군집설계
svymean(~score, des, deff = TRUE)`,
    spss: (p) => `* 데이터 > 케이스 선택 > 케이스의 무작위 표본 (단순무작위).
SAMPLE ${p.n} FROM 400.

* 층화추출: 분석 > 복합표본 > 표본 선택 (CSPLAN)
CSPLAN SAMPLE
  /PLAN FILE='strat.csplan'
  /DESIGN STRATA=grade
  /METHOD TYPE=SIMPLE_WOR
  /SIZE VALUE=${p.n / 4}.

* 군집설계 분석: 분석 > 복합표본 > 기술통계 (설계효과 출력)
CSDESCRIPTIVES /PLAN FILE='clus.csplan'
  /SUMMARY VARIABLES=score /MEAN /STATISTICS SE DEFF.`,
  },
  init(ctx) {
    const st = ctx.state;
    const fig = ctx.box('plot'); fig.innerHTML = '<figcaption class="plot-title">모집단: 학생 400명 (열 하나 = 한 반 10명, 학년이 오를수록 점수가 높음)</figcaption><div class="plot-legend"></div>';
    st.legendEl = fig.querySelector('.plot-legend');
    st.svg = d3.select(fig).append('svg').attr('viewBox', '0 0 820 238').attr('width', '100%').attr('class', 'plot-svg');
    st.dist = ctx.plot({ xBand: ['단순무작위', '층화', '군집', '편의'], y: [55, 85], height: 280, yLabel: '표본 평균 점수', title: '500번 반복했을 때 표본 평균의 분포', bandPad: 0.25 });
    st.popSeed = 21; st.drawSeed = 1; st.repSeed = 100;
  },
  update(ctx, v, changed) {
    const st = ctx.state, C = Lab.C, gm = [62, 68, 74, 80];
    const names = { srs: '단순무작위', strat: '층화', cluster: '군집', conv: '편의' };
    const gcol = [C.s1, C.s3, C.s4, C.s7];
    if (changed === 'init' || changed === 'icc' || !st.pop) {
      S.seed(st.popSeed);
      const u = Array.from({ length: 40 }, () => S.randn(0, v.icc));
      st.pop = [];
      for (let c = 0; c < 40; c++) for (let r = 0; r < 10; r++) { const g = Math.floor(c / 10); st.pop.push({ c, r, g, y: gm[g] + u[c] + S.randn(0, 6) }); }
      st.mu = S.mean(st.pop.map((d) => d.y));
    }
    const pop = st.pop, idx = pop.map((_, i) => i);
    const byG = [0, 1, 2, 3].map((g) => idx.filter((i) => pop[i].g === g));
    const draw = (m, n) => {
      if (m === 'srs') return S.sample(idx, n);
      if (m === 'strat') return byG.flatMap((ids) => S.sample(ids, n / 4));
      if (m === 'cluster') { const cs = new Set(S.sample(Array.from({ length: 40 }, (_, c) => c), n / 10)); return idx.filter((i) => cs.has(pop[i].c)); }
      return idx.map((i) => [i, pop[i].c + pop[i].r * 0.4 + S.randn(0, 4)]).sort((a, b) => a[1] - b[1]).slice(0, n).map((d) => d[0]);
    };
    if (['init', 'n', 'icc', 'rep'].includes(changed) || !st.reps) {
      if (changed === 'rep') st.repSeed++;
      S.seed(st.repSeed);
      st.reps = {};
      for (const m of ['srs', 'strat', 'cluster', 'conv']) st.reps[m] = Array.from({ length: 500 }, () => S.mean(draw(m, v.n).map((i) => pop[i].y)));
    }
    if (changed === 'draw') st.drawSeed++;
    S.seed(st.drawSeed * 7919 + v.n);
    const sel = new Set(draw(v.method, v.n));
    const est = S.mean([...sel].map((i) => pop[i].y));

    // population grid
    const svg = st.svg; svg.selectAll('*').remove();
    const X = (c) => 30 + c * 19.5 + Math.floor(c / 10) * 6, Y = (r) => 40 + r * 19.5;
    [0, 1, 2, 3].forEach((g) => {
      svg.append('text').attr('x', X(g * 10) + 90).attr('y', 18).attr('text-anchor', 'middle').attr('class', 'mk-label').text(`${g + 1}학년 (평균 ${S.f(S.mean(byG[g].map((i) => pop[i].y)), 1)})`);
    });
    if (v.method === 'cluster') {
      const cs = [...new Set([...sel].map((i) => pop[i].c))];
      svg.append('g').selectAll('rect').data(cs).join('rect').attr('x', (c) => X(c) - 9).attr('y', Y(0) - 9).attr('width', 18).attr('height', 19.5 * 9 + 18).attr('rx', 4)
        .style('fill', 'none').style('stroke', C.marker).style('stroke-width', 1.5);
    }
    if (v.method === 'conv') svg.append('text').attr('x', 6).attr('y', Y(0) + 4).attr('class', 'mk-label').style('fill', C.marker).text('▶');
    svg.append('g').selectAll('circle').data(pop).join('circle')
      .attr('cx', (d) => X(d.c)).attr('cy', (d) => Y(d.r)).attr('r', (d, i) => (sel.has(i) ? 6.5 : 5))
      .style('fill', (d) => gcol[d.g]).style('opacity', (d, i) => (sel.has(i) ? 1 : 0.18))
      .style('stroke', (d, i) => (sel.has(i) ? 'var(--ink)' : 'none')).style('stroke-width', 1.2);
    st.legendEl.innerHTML = [0, 1, 2, 3].map((g) => `<span class="lg-item"><i class="lg-key lg-dot" style="--k:${gcol[g]}"></i>${g + 1}학년</span>`).join('') + `<span class="lg-item">진한 점 = 이번 ${names[v.method]} 표본 ${sel.size}명${v.method === 'conv' ? ' (왼쪽 위 입구에서 가까운 순)' : ''}</span>`;

    // sampling distributions
    const all = Object.values(st.reps).flat();
    const lo = Math.floor(Math.min(...all, st.mu) - 1), hi = Math.ceil(Math.max(...all, st.mu) + 1);
    const dp = st.dist; dp.setY([lo, hi]); dp.clear();
    const bw = dp.xs.bandwidth();
    const sum = {};
    Object.entries(st.reps).forEach(([m, arr]) => {
      const mean = S.mean(arr), sd = S.sd(arr); sum[m] = { mean, sd, bias: mean - st.mu };
      const on = m === v.method, cx = dp.x(names[m]);
      S.seed(m.length * 31);
      dp.g().append('g').selectAll('circle').data(arr.slice(0, 250)).join('circle')
        .attr('cx', () => cx + (S.rand() - 0.5) * bw * 0.7).attr('cy', (d) => dp.y(d)).attr('r', 2.4)
        .style('fill', on ? C.s1 : C.muted).style('opacity', on ? 0.5 : 0.28);
      dp.g().append('line').attr('x1', cx - bw * 0.42).attr('x2', cx + bw * 0.42).attr('y1', dp.y(mean)).attr('y2', dp.y(mean)).style('stroke', on ? C.ink : C.ink2).style('stroke-width', on ? 3 : 2);
      dp.g().append('line').attr('x1', cx).attr('x2', cx).attr('y1', dp.y(mean - sd)).attr('y2', dp.y(mean + sd)).style('stroke', on ? C.ink : C.ink2).style('stroke-width', 2);
    });
    dp.hline(st.mu, { color: C.marker, dash: true, label: `모집단 평균 μ = ${S.f(st.mu, 1)}` });
    dp.dots([[names[v.method], est]], { color: C.marker, r: 6, tip: () => `<b>이번 표본 평균</b><br>${S.f(est, 2)}` });
    dp.legend([{ label: '선택한 방법의 반복 추정치', color: C.s1, type: 'dot' }, { label: '추정치 평균 ± 1 SD', color: C.ink, type: 'line' }, { label: '모집단 평균', color: C.marker, type: 'dash' }, { label: '이번 표본', color: C.marker, type: 'dot' }]);

    const cur = sum[v.method], deff = (cur.sd / sum.srs.sd) ** 2;
    ctx.readout([
      { label: '모집단 평균 μ', value: S.f(st.mu, 2) },
      { label: '이번 표본 평균', value: S.f(est, 2), sub: `오차 ${est - st.mu >= 0 ? '+' : ''}${S.f(est - st.mu, 2)}` },
      { label: `편향 (${names[v.method]})`, value: (cur.bias >= 0 ? '+' : '') + S.f(cur.bias, 2), tone: Math.abs(cur.bias) > 1 ? 'bad' : 'good' },
      { label: '표준오차 (반복 SD)', value: S.f(cur.sd, 2) },
      { label: '설계효과 deff', value: S.f(deff, 2), sub: '단순무작위 대비 분산 비', tone: deff > 1.5 ? 'warn' : null },
    ]);
    const m = v.method;
    let msg;
    if (m === 'conv') msg = `편의표본은 입구 가까운 1학년 위주로 뽑혀 평균을 <b>${S.f(Math.abs(cur.bias), 1)}점 ${cur.bias < 0 ? '낮게' : '높게'}</b> 추정합니다. n을 키워도 흩어짐만 줄고 이 치우침은 남습니다.`;
    else if (m === 'cluster') msg = `반 ${v.n / 10}개를 통째로 뽑았습니다. 같은 반 학생들이 닮아 있어 분산이 단순무작위의 <b>${S.f(deff, 1)}배</b>입니다. 실질적으로는 약 ${Math.round(v.n / deff)}명을 무작위로 뽑은 만큼의 정보입니다.`;
    else if (m === 'strat') msg = `학년마다 ${v.n / 4}명씩 뽑아 학년 간 차이에서 오는 변동을 없앴습니다. 표준오차가 단순무작위(${S.f(sum.srs.sd, 2)})보다 작은 ${S.f(cur.sd, 2)}입니다.`;
    else msg = `단순무작위 표본은 평균적으로 μ를 맞히고(편향 ${S.f(cur.bias, 2)}), 표본마다 약 ±${S.f(cur.sd, 1)}점 흔들립니다. 다른 설계와 비교하는 기준입니다.`;
    ctx.insight(msg);
  },
});
