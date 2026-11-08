/* 검정력과 표본크기: t검정 검정력 곡선, 80%에 필요한 n, 모의실험 */
(function () {
  function powerT(n, d, alpha, tail, design) {
    if (n < 2) return NaN;
    const df = design === 'two' ? 2 * n - 2 : n - 1, delta = design === 'two' ? d * Math.sqrt(n / 2) : d * Math.sqrt(n);
    const tc = S.qt(tail === 'two' ? 1 - alpha / 2 : 1 - alpha, df);
    return 1 - S.pt(tc - delta, df) + (tail === 'two' ? S.pt(-tc - delta, df) : 0);
  }
  function needN(d, alpha, tail, design, target = 0.8) {
    let lo = 2, hi = 2; while (powerT(hi, d, alpha, tail, design) < target && hi < 100000) hi *= 2;
    if (hi >= 100000) return Infinity;
    while (hi - lo > 1) { const m = Math.floor((lo + hi) / 2); if (powerT(m, d, alpha, tail, design) >= target) hi = m; else lo = m; }
    return hi;
  }
  const REF = [[0.2, '작은 효과 d=.2', 's7'], [0.5, '중간 효과 d=.5', 's3'], [0.8, '큰 효과 d=.8', 's2']];

  Lab.add({
    id: 'power', subject: 'prob', order: 9,
    title: '검정력과 표본크기', en: 'Statistical power · sample size planning',
    summary: '효과크기와 유의수준을 정하면 검정력 80%에 필요한 표본이 몇 명인지 계산하고, 실제로 실험 500번을 돌려 확인합니다.',
    keywords: 'power analysis 검정력 분석 표본크기 G*Power 효과크기 Cohen d',
    controls: [
      { type: 'slider', key: 'd', label: '예상 효과크기 d', min: 0.1, max: 1.5, step: 0.05, value: 0.5 },
      { type: 'slider', key: 'n', label: '집단당 표본 n', min: 3, max: 300, step: 1, value: 30 },
      { type: 'select', key: 'alpha', label: '유의수준 α', options: [[0.1, '.10'], [0.05, '.05'], [0.01, '.01']], value: 0.05 },
      { type: 'select', key: 'tail', label: '검정 방향', options: [['two', '양측'], ['one', '단측']], value: 'two' },
      { type: 'select', key: 'design', label: '설계', options: [['two', '독립 두 집단'], ['one', '단일·대응 표본']], value: 'two' },
      { type: 'button', key: 'sim', label: '실험 500번 모의 실행', primary: true },
    ],
    concept: `
      <p><b>검정력</b>은 실제로 효과가 있을 때 그것을 통계적으로 유의하게 잡아낼 확률(1 − β)입니다. 검정력은 네 가지가 함께 정합니다: <b>효과크기, 표본크기, 유의수준 α, 검정 방향</b>. 셋을 정하면 나머지 하나가 결정되므로, 연구 전에 표본크기를 계산할 수 있습니다(사전 검정력 분석).</p>
      <ul>
        <li>관례적인 목표는 <b>검정력 0.80</b>, α = .05입니다. Cohen의 기준으로 d = .2/.5/.8이 작은/중간/큰 효과입니다.</li>
        <li>독립 두 집단 t검정에서 중간 효과(d = .5)를 80% 검정력으로 잡으려면 집단당 약 64명, 작은 효과(d = .2)는 집단당 약 394명이 필요합니다.</li>
        <li>대응표본(같은 사람을 두 번 측정)은 개인차가 상쇄되어 같은 d에서도 훨씬 적은 표본이 필요합니다.</li>
      </ul>
      <p>검정력이 낮은 연구는 효과를 놓칠 뿐 아니라, 운 좋게 유의한 결과가 나와도 효과크기를 과대추정하는 경향이 있습니다(<em>승자의 저주</em>). 이것이 재현성 위기의 한 원인입니다. 사후 검정력(관측된 효과로 계산한 검정력)은 p값과 정보가 같아서 해석에 도움이 되지 않습니다.</p>`,
    formula: `δ = <var>d</var>·√(<var>n</var>/2) <span class="c">(독립 두 집단, 집단당 n)</span> &nbsp; δ = <var>d</var>·√<var>n</var> <span class="c">(단일·대응)</span><br>검정력 ≈ 1 − F<sub>t,df</sub>(<var>t</var><sub>crit</sub> − δ) + F<sub>t,df</sub>(−<var>t</var><sub>crit</sub> − δ)<br><var>n</var> ≈ 2(<var>z</var><sub>1−α/2</sub> + <var>z</var><sub>1−β</sub>)² / <var>d</var>² <span class="c">(정규근사, 집단당)</span>`,
    tasks: [
      'd = 0.5, α = .05, 양측, 독립 두 집단에서 80% 검정력에 필요한 집단당 n을 찾아보세요. 64 근처인가요?',
      'd를 0.25로 절반 줄이면 필요한 n은 몇 배가 되나요? (힌트: n ∝ 1/d²)',
      '설계를 "단일·대응 표본"으로 바꾸면 필요한 n이 어떻게 달라지나요?',
      'n = 20에서 "실험 500번 모의 실행"을 눌러 모의 검정력이 이론 곡선 위의 점과 맞는지 확인하세요.',
    ],
    tools: {
      r: (v) => `# 이론 검정력과 필요 표본
power.t.test(n = ${v.n}, delta = ${v.d}, sd = 1, sig.level = ${v.alpha},
             type = "${v.design === 'two' ? 'two.sample' : 'one.sample'}", alternative = "${v.tail === 'two' ? 'two.sided' : 'one.sided'}")
power.t.test(power = 0.80, delta = ${v.d}, sd = 1, sig.level = ${v.alpha},
             type = "${v.design === 'two' ? 'two.sample' : 'one.sample'}", alternative = "${v.tail === 'two' ? 'two.sided' : 'one.sided'}")

# pwr 패키지 (G*Power와 같은 계산)
library(pwr)
pwr.t.test(d = ${v.d}, power = 0.80, sig.level = ${v.alpha}, type = "${v.design === 'two' ? 'two.sample' : 'paired'}")

# 모의실험 검정력
set.seed(1)
p <- replicate(500, {
${v.design === 'two' ? `  a <- rnorm(${v.n}, 0, 1); b <- rnorm(${v.n}, ${v.d}, 1)
  t.test(b, a, var.equal = TRUE, alternative = "${v.tail === 'two' ? 'two.sided' : 'greater'}")$p.value` : `  x <- rnorm(${v.n}, ${v.d}, 1)
  t.test(x, mu = 0, alternative = "${v.tail === 'two' ? 'two.sided' : 'greater'}")$p.value`}
})
mean(p < ${v.alpha})`,
      spss: (v) => `* SPSS 27 이상: 분석 > 검정력 분석 > 평균 > ${v.design === 'two' ? '독립표본 T검정' : '대응표본 T검정'}.
${v.design === 'two' ? `POWER MEANS INDEPENDENT
  /PARAMETERS TEST = ${v.tail === 'two' ? 'NONDIRECTIONAL' : 'DIRECTIONAL'} SIGNIFICANCE = ${v.alpha}
    POWER = 0.8 NRATIO = 1 MEAN = 0 ${v.d} SD = 1 1.` : `POWER MEANS RELATED
  /PARAMETERS TEST = ${v.tail === 'two' ? 'NONDIRECTIONAL' : 'DIRECTIONAL'} SIGNIFICANCE = ${v.alpha}
    POWER = 0.8 MEAN = 0 ${v.d} SD = 1 1 CORR = 0.`}

* 이전 버전은 무료 프로그램 G*Power를 사용:
* t tests > Means: Difference between two independent means,
* A priori, d = ${v.d}, α = ${v.alpha}, power = 0.80.`,
    },
    init(ctx) {
      ctx.state.curve = ctx.plot({ x: [2, 300], y: [0, 1], yFmt: (v) => Math.round(v * 100) + '%', height: 320, xLabel: '집단당 표본 크기 n', yLabel: '검정력 1−β', title: '표본크기에 따른 검정력' });
      ctx.state.hist = ctx.plot({ x: [0, 1], y: [0, 10], height: 200, xLabel: 'p값', yLabel: '실험 수', title: '모의실험 500번의 p값 분포' });
      ctx.state.seed = 1;
    },
    update(ctx, v, changed) {
      const st = ctx.state, C = Lab.C;
      if (['d', 'alpha', 'tail', 'design', 'n'].includes(changed)) st.sim = null;
      if (changed === 'sim') {
        S.seed(st.seed++);
        const ps = [];
        for (let i = 0; i < 500; i++) {
          if (v.design === 'two') { const a = S.rnormVec(v.n, 0, 1), b = S.rnormVec(v.n, v.d, 1), r = S.ttest2(b, a, true); ps.push(v.tail === 'two' ? r.p : 1 - S.pt(r.t, r.df)); }
          else { const x = S.rnormVec(v.n, v.d, 1), r = S.ttest1(x, 0); ps.push(v.tail === 'two' ? r.p : 1 - S.pt(r.t, r.df)); }
        }
        st.sim = { ps, n: v.n, power: ps.filter((p) => p < v.alpha).length / 500 };
      }
      const req = needN(v.d, v.alpha, v.tail, v.design);
      const xmax = Math.max(300, Math.min(2000, isFinite(req) ? Math.ceil(req * 1.2 / 50) * 50 : 2000));
      const cp = st.curve; cp.setX([2, xmax]); cp.clear();
      const ns = [...new Set(S.linspace(2, xmax, 90).map(Math.round))];
      REF.forEach(([d, , s]) => cp.line(ns.map((n) => [n, powerT(n, d, v.alpha, v.tail, v.design)]), { color: C[s], width: 1.5, opacity: 0.5, dash: '3 4' }));
      cp.line(ns.map((n) => [n, powerT(n, v.d, v.alpha, v.tail, v.design)]), { color: C.s1, width: 2.5 });
      cp.hline(0.8, { color: C.ink2, dash: true, label: '80%', anchor: 'start' });
      cp.hline(v.alpha, { color: C.muted, width: 1, label: `α = ${v.alpha}` });
      const pw = powerT(v.n, v.d, v.alpha, v.tail, v.design);
      if (isFinite(req) && req <= xmax) { cp.vline(req, { color: C.s1, dash: true, label: `n = ${req}`, labelY: cp.y(0.3), anchor: req > xmax * 0.7 ? 'end' : 'start' }); cp.dots([[req, powerT(req, v.d, v.alpha, v.tail, v.design)]], { color: C.s1, r: 5, tip: () => `<b>80% 달성: 집단당 n = ${req}</b>` }); }
      cp.dots([[v.n, pw]], { color: C.ink, r: 6, tip: () => `<b>현재 n = ${v.n}</b><br>검정력 ${S.pct(pw)}` });
      if (st.sim) cp.dots([[st.sim.n, st.sim.power]], { color: C.s2, r: 6, tip: () => `<b>모의실험 검정력 ${S.pct(st.sim.power)}</b><br>500번 중 ${Math.round(st.sim.power * 500)}번 유의` });
      cp.legend([{ label: `d = ${v.d}`, color: C.s1, type: 'line' }, ...REF.map(([, l, s]) => ({ label: l, color: C[s], type: 'dash' })), { label: '현재 n', color: C.ink, type: 'dot' }, ...(st.sim ? [{ label: '모의실험 결과', color: C.s2, type: 'dot' }] : [])]);

      const hp = st.hist; hp.clear();
      if (st.sim) {
        const bins = S.bin(st.sim.ps, 0, 1, 20);
        bins.forEach((b) => { b.color = b.x0 < v.alpha ? C.s3 : C.muted; });
        hp.setY([0, Math.max(...bins.map((b) => b.n)) * 1.15]);
        hp.hist(bins, { tip: (b) => `p ${S.f(b.x0, 2)}–${S.f(b.x1, 2)}: ${b.n}번` });
        hp.vline(v.alpha, { color: C.s2, dash: true, label: `α = ${v.alpha}` });
        hp.legend([{ label: `p < ${v.alpha} 를 포함한 구간 (유의)`, color: C.s3, type: 'box' }, { label: '그 외', color: C.muted, type: 'box' }]);
      } else { hp.setY([0, 10]); hp.text(0.5, 5, '"실험 500번 모의 실행"을 누르면 p값이 쌓입니다', { color: C.muted, size: 13 }); hp.legend([]); }

      const total = v.design === 'two' ? 2 * req : req;
      ctx.readout([
        { label: `현재 검정력 (n = ${v.n})`, value: S.pct(pw), tone: pw >= 0.8 ? 'good' : 'warn' },
        { label: '80%에 필요한 n', value: isFinite(req) ? `${S.comma(req)}명` : '—', sub: v.design === 'two' ? `집단당 · 총 ${S.comma(total)}명` : '전체', tone: 'accent' },
        { label: '90%에 필요한 n', value: S.comma(needN(v.d, v.alpha, v.tail, v.design, 0.9)) + '명' },
        { label: '모의실험 검정력', value: st.sim ? S.pct(st.sim.power) : '—', sub: st.sim ? `500번 중 ${Math.round(st.sim.power * 500)}번 유의` : '아직 실행 안 함' },
      ]);
      let msg = `d = ${v.d}인 효과를 α = ${v.alpha}, ${v.tail === 'two' ? '양측' : '단측'}으로 검정할 때 집단당 ${v.n}명이면 검정력이 <b>${S.pct(pw)}</b>입니다.`;
      msg += pw < 0.8 ? ` 80%에 도달하려면 ${v.design === 'two' ? '집단당 ' : ''}<b>${S.comma(req)}명</b>이 필요합니다.` : ' 이미 관례적 기준(80%)을 넘었습니다.';
      if (st.sim) msg += ` 실제로 500번 실험해 보니 ${S.pct(st.sim.power)}가 유의했습니다.`;
      ctx.insight(msg);
    },
  });
})();
