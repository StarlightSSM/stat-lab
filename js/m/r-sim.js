/* R · 시뮬레이션: set.seed와 replicate */
(function () {
  const pT2 = (t, df) => S.ibeta(df / (df + t * t), df / 2, 0.5);
  const STATS = [['pi', '원주율 π 추정'], ['pval', 'H₀에서 p값의 분포'], ['mean', '표본평균의 분포 (지수분포)']];
  function run(stat, seed, reps, n) {
    S.seed(seed);
    const vals = [], pts = [], running = [];
    let acc = 0;
    for (let r = 0; r < reps; r++) {
      let v;
      if (stat === 'pi') { const x = S.rand(), y = S.rand(), inside = x * x + y * y <= 1 ? 1 : 0; if (pts.length < 1500) pts.push({ x, y, inside }); v = inside; }
      else if (stat === 'pval') {
        const a = [], b = []; for (let i = 0; i < n; i++) { a.push(S.randn()); b.push(S.randn()); }
        const va = S.variance(a) / n, vb = S.variance(b) / n, t = (S.mean(a) - S.mean(b)) / Math.sqrt(va + vb), df = (va + vb) ** 2 / (va * va / (n - 1) + vb * vb / (n - 1));
        v = pT2(t, df);
      } else { let s = 0; for (let i = 0; i < n; i++) s += S.rexp(1); v = s / n; }
      vals.push(v);
      acc += stat === 'pval' ? (v < 0.05 ? 1 : 0) : v;
      const est = stat === 'pi' ? 4 * acc / (r + 1) : acc / (r + 1);
      if (r < 50 || r % Math.ceil(reps / 300) === 0 || r === reps - 1) running.push([r + 1, est]);
    }
    const est = running[running.length - 1][1];
    return { vals, pts, running, est };
  }

  Lab.add({
    id: 'r-sim', subject: 'r', order: 5,
    title: 'R로 시뮬레이션: set.seed와 replicate', en: 'Monte Carlo simulation · reproducibility',
    summary: '같은 seed는 같은 난수를 만듭니다. replicate()로 실험을 수천 번 반복해 π를 추정하고, 귀무가설에서 p값이 균등분포를 따르는 것을 확인합니다.',
    keywords: 'simulation 시뮬레이션 set.seed replicate monte carlo 몬테카를로 p-value uniform 재현성',
    controls: [
      { type: 'select', key: 'stat', label: '무엇을 시뮬레이션할까', options: STATS, value: 'pval', dropdown: true },
      { type: 'slider', key: 'seed', label: 'set.seed( )', min: 1, max: 999, step: 1, value: 42 },
      { type: 'select', key: 'reps', label: '반복 횟수 (replicate)', options: [[100, '100'], [1000, '1,000'], [5000, '5,000']], value: 1000 },
      { type: 'slider', key: 'n', label: '한 번 실험의 표본크기 n', min: 3, max: 50, step: 1, value: 20, hint: 'p값·표본평균 시뮬레이션에서 사용' },
      { type: 'button', key: 'again', label: '같은 seed로 다시 실행', primary: true },
      { type: 'button', key: 'next', label: 'seed + 1' },
    ],
    concept: `
      <p>컴퓨터의 난수는 정해진 공식으로 만든 <b>의사난수</b>입니다. <code>set.seed(42)</code>로 출발점을 고정하면 몇 번을 다시 실행해도 똑같은 "무작위" 수열이 나옵니다. 논문·과제의 분석을 재현 가능하게 만드는 첫 줄입니다.</p>
      <p><b>몬테카를로 시뮬레이션</b>은 수식으로 풀기 어려운 확률을 "많이 해 보고 세는" 방식으로 구합니다. <code>replicate(B, 실험)</code>은 실험을 B번 반복해 결과를 벡터로 돌려줍니다. 추정 오차는 대략 1/√B로 줄어서, 정밀도를 10배 높이려면 반복을 100배 늘려야 합니다.</p>
      <ul>
        <li><b>π 추정</b> : 단위 정사각형에 점을 뿌리면 사분원 안에 들어갈 확률이 π/4입니다.</li>
        <li><b>귀무가설에서 p값</b> : 두 집단이 정말 같을 때(H₀ 참) t검정 p값은 0~1 사이 <em>균등분포</em>를 따릅니다. 그래서 p &lt; .05가 나올 확률이 정확히 5%, 즉 1종 오류율입니다.</li>
        <li><b>표본평균</b> : 한쪽으로 치우친 지수분포에서도 n이 커지면 표본평균의 분포가 정규분포에 가까워집니다(중심극한정리).</li>
      </ul>
      <p>참고: 이 사이트의 난수 생성기는 R의 기본 생성기(Mersenne-Twister)와 달라서 숫자 자체는 R 결과와 다릅니다. "같은 seed → 같은 결과"라는 성질과 분포의 모양은 같습니다.</p>`,
    formula: `π̂ = 4 × (원 안의 점 수 / B)<br>H₀ 참일 때 &nbsp; P(p &lt; α) = α &nbsp; (p ~ Uniform(0, 1))<br>몬테카를로 표준오차 ≈ √(p̂(1−p̂) / B)`,
    tasks: [
      "'같은 seed로 다시 실행'을 여러 번 눌러 보세요. 첫 세 값과 추정치가 한 자리도 바뀌지 않습니다. 이번엔 'seed + 1'을 누르세요.",
      'π 추정에서 반복을 100, 1,000, 5,000으로 늘리며 오른쪽 수렴 그래프의 흔들림이 얼마나 줄어드는지 보세요.',
      "'H₀에서 p값의 분포'를 고르고 반복 5,000번으로 두세요. 히스토그램이 평평하고, p < .05 비율이 0.05 근처인지 확인하세요.",
      "'표본평균의 분포'에서 n을 3과 50으로 바꿔 히스토그램이 정규곡선에 얼마나 가까워지는지 비교하세요.",
    ],
    tools: {
      r: (p) => {
        const body = p.stat === 'pi'
          ? `inside <- replicate(${p.reps}, {\n  x <- runif(1); y <- runif(1)\n  x^2 + y^2 <= 1\n})\n4 * mean(inside)            # π 추정\nplot(4 * cumsum(inside) / seq_along(inside), type = "l")`
          : p.stat === 'pval'
            ? `pvals <- replicate(${p.reps}, {\n  a <- rnorm(${p.n}); b <- rnorm(${p.n})   # H0 참: 두 집단 동일\n  t.test(a, b)$p.value\n})\nhist(pvals, breaks = 20)     # 평평한 균등분포\nmean(pvals < 0.05)          # 1종 오류율 ≈ 0.05`
            : `means <- replicate(${p.reps}, mean(rexp(${p.n}, rate = 1)))\nhist(means, breaks = 40, freq = FALSE)\ncurve(dnorm(x, 1, 1 / sqrt(${p.n})), add = TRUE)   # CLT 근사`;
        return `set.seed(${p.seed})\n${body}\n\n# 재현성 확인\nset.seed(${p.seed}); runif(3)\nset.seed(${p.seed}); runif(3)   # 위와 똑같은 세 수`;
      },
    },
    init(ctx) {
      const row = ctx.row();
      const a = ctx.box('', row), b = ctx.box('', row);
      ctx.state.left = ctx.plot({ x: [0, 1], y: [0, 1], height: 260, title: '결과' }, a);
      ctx.state.conv = ctx.plot({ x: [1, 1000], y: [0, 1], height: 260, xLabel: '반복 횟수', yLabel: '누적 추정치', title: '반복할수록 참값에 수렴' }, b);
      ctx.state.con = ctx.box(''); ctx.state.con.style.minWidth = '0';
      ctx.state.runs = 0;
      const cp = ctx.state.conv, cid = 'rsim-clip-' + Math.random().toString(36).slice(2, 8);
      cp.svg.append('defs').append('clipPath').attr('id', cid).append('rect').attr('width', cp.iw).attr('height', cp.ih);
      cp.data.attr('clip-path', `url(#${cid})`); cp.under.attr('clip-path', `url(#${cid})`);
    },
    update(ctx, v, changed) {
      if (changed === 'next') ctx.set('seed', Math.min(999, v.seed + 1), true);
      if (changed === 'again') ctx.state.runs++; else if (changed !== 'init') ctx.state.runs = 0;
      const reps = +v.reps, n = v.n, R = run(v.stat, v.seed, reps, n), C = Lab.C;
      S.seed(v.seed); const fp = [S.rand(), S.rand(), S.rand()];
      const truth = v.stat === 'pi' ? Math.PI : v.stat === 'pval' ? 0.05 : 1;
      const lp = ctx.state.left; lp.clear();
      if (v.stat === 'pi') {
        lp.setX([0, 1]); lp.setY([0, 1]);
        lp.dots(R.pts.map((p) => ({ x: p.x, y: p.y, color: p.inside ? C.s7 : C.s4 })), { r: 2.2, ring: false, opacity: 0.7 });
        lp.line(S.linspace(0, Math.PI / 2, 80).map((t) => [Math.cos(t), Math.sin(t)]), { color: C.ink, width: 1.5 });
        lp.legend([{ label: '원 안 (x² + y² ≤ 1)', color: C.s7, type: 'dot' }, { label: '원 밖', color: C.s4, type: 'dot' }]);
      } else if (v.stat === 'pval') {
        const bins = S.bin(R.vals, 0, 1, 20); lp.setX([0, 1]); lp.setY([0, Math.max(2, ...bins.map((b) => b.density)) * 1.1]);
        bins.forEach((b) => { b.color = b.x1 <= 0.05 + 1e-9 ? C.s8 : C.s7; });
        lp.hist(bins, { value: 'density', tip: (b) => `p ∈ [${S.f(b.x0, 2)}, ${S.f(b.x1, 2)})<br>${b.n}회 (${S.pct(b.n / reps)})` });
        lp.hline(1, { color: C.ink2, dash: true, label: '균등 = 1' });
        lp.legend([{ label: 'p < .05 (1종 오류)', color: C.s8 }, { label: 'p ≥ .05', color: C.s7 }]);
      } else {
        const lo = 0, hi = Math.max(2.5, S.quantile(R.vals, 0.995)), bins = S.bin(R.vals, lo, hi, 40);
        lp.setX([lo, hi]); lp.setY([0, Math.max(...bins.map((b) => b.density), S.dnorm(1, 1, 1 / Math.sqrt(n))) * 1.12]);
        lp.hist(bins, { value: 'density', color: C.s7, tip: (b) => `${S.f(b.x0, 2)}–${S.f(b.x1, 2)}: ${b.n}회` });
        lp.line(S.linspace(lo, hi, 200).map((x) => [x, S.dnorm(x, 1, 1 / Math.sqrt(n))]), { color: C.marker, width: 2 });
        lp.legend([{ label: `mean(rexp(${n}))의 분포`, color: C.s7 }, { label: `정규 근사 N(1, 1/${n})`, color: C.marker, type: 'line' }]);
      }
      const cp = ctx.state.conv, ests = R.running.map((r) => r[1]);
      const spread = Math.max(...ests.slice(Math.min(10, ests.length - 1)).map((e) => Math.abs(e - truth)), v.stat === 'pval' ? 0.05 : 0.1);
      cp.setX([1, reps]); cp.setY([truth - spread * 1.2, truth + spread * 1.2]); cp.clear();
      cp.hline(truth, { color: C.ink2, dash: true, label: v.stat === 'pi' ? 'π = 3.1416' : v.stat === 'pval' ? 'α = 0.05' : '모평균 = 1' });
      const se = v.stat === 'pi' ? (r) => 4 * Math.sqrt((Math.PI / 4) * (1 - Math.PI / 4) / r) : v.stat === 'pval' ? (r) => Math.sqrt(0.05 * 0.95 / r) : (r) => 1 / Math.sqrt(n * r);
      const band = S.linspace(Math.max(5, 1), reps, 120);
      cp.under.append('path').attr('d', d3.area().x((r) => cp.x(r)).y0((r) => cp.y(truth - 1.96 * se(r))).y1((r) => cp.y(truth + 1.96 * se(r)))(band)).style('fill', C.s7).style('opacity', 0.1);
      cp.line(R.running, { color: C.s7, width: 2 });
      cp.dots([R.running[R.running.length - 1]], { r: 5, layer: 'over', color: C.marker, tip: () => `B = ${reps}<br>추정치 ${S.f(R.est, 4)}` });

      const label = v.stat === 'pi' ? 'π 추정' : v.stat === 'pval' ? 'mean(pvals < 0.05)' : 'mean(means)';
      const runLine = (k) => `> set.seed(${v.seed}); runif(3)\n[1] ${fp.map((x) => x.toFixed(7)).join(' ')}`;
      ctx.state.con.innerHTML = Lab.console(`${runLine()}\n${ctx.state.runs ? `# ↑ '다시 실행' ${ctx.state.runs}번째: 같은 seed라 결과가 완전히 같습니다\n` : ''}> ${v.stat === 'pi' ? `4 * mean(inside)` : v.stat === 'pval' ? 'mean(pvals < 0.05)' : 'mean(means); sd(means)'}\n[1] ${S.f(R.est, 5).replace('−', '-')}${v.stat === 'mean' ? `\n[1] ${S.f(S.sd(R.vals), 5)}` : ''}\n# (이 사이트의 난수 생성기는 R과 달라 숫자 자체는 R 결과와 다릅니다)`);
      const err = R.est - truth, mcse = se(reps);
      ctx.readout([
        { label: label, value: S.f(R.est, 4), tone: 'accent', sub: `참값 ${S.f(truth, 4)}` },
        { label: '오차', value: (err >= 0 ? '+' : '') + S.f(err, 4), sub: `|오차| / MC 표준오차 = ${S.f(Math.abs(err) / mcse, 2)}` },
        { label: 'MC 표준오차', value: S.f(mcse, 4), sub: '≈ 1/√B 비례' },
        { label: 'seed 지문 (첫 난수)', value: fp[0].toFixed(5), sub: ctx.state.runs ? `재실행 ${ctx.state.runs}회 · 동일` : `seed ${v.seed}` },
      ]);
      let msg;
      if (changed === 'again') msg = `seed ${v.seed}로 ${ctx.state.runs}번째 다시 실행했지만 추정치 ${S.f(R.est, 4)}와 첫 난수 ${fp[0].toFixed(5)}가 그대로입니다. 이것이 set.seed()의 재현성입니다.`;
      else if (v.stat === 'pval') msg = `H₀가 참인데도 ${reps}번 중 ${S.pct(R.est, 1)}에서 p < .05가 나왔습니다. 기대값 5%와의 차이(${S.f(err * 100, 2)}%p)는 몬테카를로 오차 범위(±${S.f(1.96 * mcse * 100, 2)}%p) ${Math.abs(err) < 1.96 * mcse ? '안입니다' : '밖입니다'}. p값 히스토그램이 평평하다는 것이 핵심입니다.`;
      else if (v.stat === 'pi') msg = `${reps}개 점 중 원 안 비율 × 4 = ${S.f(R.est, 4)}. 참값과의 오차 ${S.f(Math.abs(err), 4)}는 반복을 4배 늘리면 대략 절반으로 줄어듭니다.`;
      else msg = `지수분포는 오른쪽으로 치우쳤지만, n = ${n}개의 평균 ${reps}개를 모으니 ${n >= 20 ? '정규곡선과 거의 겹칩니다' : '아직 오른쪽 꼬리가 남아 있습니다'}. 평균들의 표준편차 ${S.f(S.sd(R.vals), 3)}는 이론값 1/√n = ${S.f(1 / Math.sqrt(n), 3)}에 가깝습니다.`;
      ctx.insight(msg);
    },
  });
})();
