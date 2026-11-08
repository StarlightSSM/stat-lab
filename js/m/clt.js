/* 중심극한정리: 어떤 모집단이든 표본평균의 분포는 정규에 가까워진다 */
(function () {
  const POP = {
    normal: { label: '정규', dom: [-4, 4], r: 'rnorm(n)', spss: 'RV.NORMAL(0, 1)' },
    uniform: { label: '균등', dom: [0, 1], r: 'runif(n)', spss: 'RV.UNIFORM(0, 1)' },
    exp: { label: '지수 (오른쪽 꼬리)', dom: [0, 6], r: 'rexp(n, 1)', spss: 'RV.EXP(1)' },
    skew: { label: '로그정규 (강한 비대칭)', dom: [0, 5], r: 'rlnorm(n, 0, 0.6)', spss: 'EXP(RV.NORMAL(0, 0.6))' },
    bimodal: { label: '쌍봉', dom: [-4.5, 4.5], r: 'ifelse(runif(n) < .5, rnorm(n, -2, .7), rnorm(n, 2, .7))', spss: '(RV.BERNOULLI(0.5)*4 - 2) + RV.NORMAL(0, 0.7)' },
    dice: { label: '주사위', dom: [0.5, 6.5], r: 'sample(1:6, n, replace = TRUE)', spss: 'TRUNC(RV.UNIFORM(1, 7))' },
  };
  const cache = {};
  function popInfo(kind) {
    if (cache[kind]) return cache[kind];
    S.seed(424242); const xs = Array.from({ length: 40000 }, () => S.rdist(kind));
    const d = POP[kind].dom, nb = kind === 'dice' ? 6 : 40;
    return (cache[kind] = { mu: S.mean(xs), sd: S.sd(xs), skew: S.skew(xs.slice(0, 8000)), bins: S.bin(xs, d[0], d[1], nb) });
  }

  function render(ctx) {
    const st = ctx.state, v = ctx.p, C = Lab.C, info = popInfo(v.pop), dom = POP[v.pop].dom;
    // population + current sample
    const pp = st.pop; pp.setX(dom); pp.setY([0, Math.max(...info.bins.map((b) => b.density)) * 1.25]); pp.clear();
    pp.hist(info.bins, { value: 'density', color: C.muted, opacity: 0.45, tip: (b) => `${S.f(b.x0, 2)}–${S.f(b.x1, 2)}<br>밀도 ${S.f(b.density, 3)}` });
    pp.vline(info.mu, { color: C.ink2, dash: true, label: `μ = ${S.f(info.mu, 2)}` });
    if (st.last) {
      const yTop = pp.o.y[1];
      pp.dots(st.last.map((x, i) => [x, yTop * (0.08 + 0.1 * ((i * 7919) % 10) / 10)]), { color: C.s1, r: v.n > 50 ? 2.5 : 3.5, opacity: 0.8 });
      const m = S.mean(st.last);
      pp.vline(m, { color: C.ink, width: 2.5, label: `표본평균 ${S.f(m, 2)}`, labelY: 26, anchor: m > (dom[0] + dom[1]) / 2 ? 'end' : 'start' });
    }
    pp.legend([{ label: `모집단: ${POP[v.pop].label}`, color: C.muted, type: 'box' }, { label: `방금 뽑은 표본 (n=${v.n})`, color: C.s1, type: 'dot' }, { label: '그 표본의 평균', color: C.ink, type: 'line' }]);

    // sampling distribution of the mean
    const mp = st.means, ms = st.ms, se = info.sd / Math.sqrt(v.n);
    const nb = v.pop === 'dice' && v.n === 1 ? 6 : 48;
    const bins = S.bin(ms, dom[0], dom[1], nb);
    const peak = S.dnorm(info.mu, info.mu, se);
    const ymax = Math.max(ms.length ? Math.max(...bins.map((b) => b.density)) : 0, v.overlay ? peak : 0, 0.5);
    mp.setX(dom); mp.setY([0, ymax * 1.12]); mp.clear();
    if (ms.length) mp.hist(bins, { value: 'density', color: C.s1, opacity: 0.75, tip: (b) => `표본평균 ${S.f(b.x0, 2)}–${S.f(b.x1, 2)}<br>${b.n}개 (${S.pct(b.n / ms.length)})` });
    if (v.overlay) mp.line(S.linspace(dom[0], dom[1], 300).map((x) => [x, S.dnorm(x, info.mu, se)]), { color: C.s2, width: 2 });
    if (ms.length) mp.vline(ms[ms.length - 1], { color: C.ink, width: 2 });
    mp.legend([{ label: `표본평균 ${S.comma(ms.length)}개`, color: C.s1, type: 'box' }, ...(v.overlay ? [{ label: `이론 N(μ, σ/√n = ${S.f(se, 3)})`, color: C.s2, type: 'line' }] : []), { label: '가장 최근 평균', color: C.ink, type: 'line' }]);

    const mm = ms.length > 1 ? S.mean(ms) : NaN, msd = ms.length > 2 ? S.sd(ms) : NaN, sk = ms.length > 30 ? S.skew(ms) : NaN;
    ctx.readout([
      { label: '뽑은 표본 수', value: S.comma(ms.length), sub: `각 표본 n = ${v.n}` },
      { label: '평균들의 평균', value: S.f(mm, 3), sub: `μ = ${S.f(info.mu, 3)}` },
      { label: '평균들의 표준편차', value: S.f(msd, 3), sub: `σ/√n = ${S.f(se, 3)}`, tone: 'accent' },
      { label: '평균 분포의 왜도', value: S.f(sk, 2), sub: `모집단 왜도 ${S.f(info.skew, 2)}`, tone: Math.abs(sk) < 0.3 ? 'good' : 'warn' },
    ]);
    let msg;
    if (ms.length < 30) msg = '표본을 더 뽑아 보세요. 아래 히스토그램이 쌓이면서 모양이 드러납니다.';
    else if (v.n === 1) msg = 'n = 1이면 표본평균은 관측값 하나와 같아서, 평균들의 분포가 모집단 모양을 그대로 따라갑니다.';
    else {
      msg = `n = ${v.n}인 표본평균 ${S.comma(ms.length)}개의 표준편차는 <b>${S.f(msd, 3)}</b>로, 이론값 σ/√n = ${S.f(se, 3)}와 거의 같습니다.`;
      msg += Math.abs(sk) < 0.3 ? ` 모집단이 ${POP[v.pop].label} 모양인데도 평균들의 분포는 거의 대칭인 종 모양입니다(왜도 ${S.f(sk, 2)}).` : ` 모집단의 비대칭이 아직 남아 있습니다(왜도 ${S.f(sk, 2)}). n을 더 키워 보세요.`;
    }
    ctx.insight(msg);
  }

  function draw(ctx, k) { const st = ctx.state, v = ctx.p; for (let i = 0; i < k; i++) { const s = Array.from({ length: v.n }, () => S.rdist(v.pop)); st.ms.push(S.mean(s)); st.last = s; } }

  Lab.add({
    id: 'clt', subject: 'prob', order: 6,
    title: '중심극한정리', en: 'Central limit theorem',
    summary: '모집단 모양을 바꾸고 표본을 계속 뽑아 보세요. 표본평균들의 분포는 n이 커질수록 정규분포가 되고 폭은 σ/√n으로 줄어듭니다.',
    keywords: 'central limit theorem CLT 표본분포 표준오차 표본평균',
    controls: [
      { type: 'select', key: 'pop', label: '모집단 분포', options: Object.entries(POP).map(([k, o]) => [k, o.label]), value: 'exp', dropdown: true },
      { type: 'slider', key: 'n', label: '표본 크기 n', min: 1, max: 100, step: 1, value: 5 },
      { type: 'button', key: 'd1', label: '1개 뽑기' },
      { type: 'button', key: 'd100', label: '100개' },
      { type: 'button', key: 'd1000', label: '1,000개', primary: true },
      { type: 'button', key: 'clear', label: '지우기' },
      { type: 'toggle', key: 'overlay', label: '이론적 정규곡선 겹쳐 보기', value: true },
    ],
    concept: `
      <p>모집단에서 크기 n인 표본을 뽑아 평균을 내는 일을 수없이 반복하면, 그 표본평균들의 분포(<b>표본분포</b>)가 생깁니다. 중심극한정리는 모집단이 어떤 모양이든(분산만 유한하면) n이 충분히 클 때 이 표본분포가 <b>정규분포 N(μ, σ²/n)</b>에 가까워진다는 정리입니다.</p>
      <ul>
        <li>표본평균의 평균은 모평균 μ와 같습니다(불편성).</li>
        <li>표본평균의 표준편차, 즉 <b>표준오차</b>는 σ/√n입니다. n을 4배로 늘리면 표준오차가 절반이 됩니다.</li>
        <li>"충분히 큰 n"은 모집단 모양에 달려 있습니다. 대칭 분포는 n = 5~10이면 충분하지만, 지수나 로그정규처럼 꼬리가 긴 분포는 30 이상이 필요할 수 있습니다.</li>
      </ul>
      <p>t검정, 신뢰구간, 회귀계수의 검정처럼 정규성을 가정하는 많은 방법이 원자료가 정규분포가 아니어도 작동하는 이유가 이 정리입니다. 정규성이 필요한 것은 <em>원자료가 아니라 표본평균(추정량)의 분포</em>입니다.</p>`,
    formula: `X̄ = (X<sub>1</sub> + … + X<sub>n</sub>) / <var>n</var><br>E[X̄] = μ, &nbsp; SE(X̄) = σ / √<var>n</var><br>(X̄ − μ) / (σ/√<var>n</var>) → N(0, 1) &nbsp;(<var>n</var> → ∞)`,
    tasks: [
      '지수분포에서 n = 1로 1,000개를 뽑으면 아래 분포가 어떤 모양인가요? n = 2, 5, 30으로 올려 가며 비교하세요.',
      '쌍봉 분포에서 n = 2일 때 평균들의 분포에 봉우리가 몇 개 생기나요? 왜 그럴까요?',
      'n = 25와 n = 100에서 "평균들의 표준편차"를 비교하세요. 정확히 절반이 되나요?',
      '주사위로 n = 2를 해 보고, 두 주사위 합(평균)의 분포가 삼각형이 되는 이유를 설명해 보세요.',
    ],
    tools: {
      r: (v) => `set.seed(1)
n <- ${v.n}; reps <- 1000
means <- replicate(reps, mean(${POP[v.pop].r}))
mean(means); sd(means)    # 이론: mu, sigma / sqrt(n)

hist(means, breaks = 40, freq = FALSE,
     main = paste("표본평균의 분포, n =", n))
curve(dnorm(x, mean(means), sd(means)), add = TRUE, lwd = 2)
qqnorm(means); qqline(means)   # 정규성 확인`,
      spss: (v) => `* 1000개 표본 × ${v.n}개 관측치를 생성한 뒤 표본별 평균을 집계.
SET SEED = 1.
INPUT PROGRAM.
LOOP #s = 1 TO 1000.
  LOOP #i = 1 TO ${v.n}.
    COMPUTE sample = #s.
    COMPUTE x = ${POP[v.pop].spss}.
    END CASE.
  END LOOP.
END LOOP.
END FILE.
END INPUT PROGRAM.
AGGREGATE /OUTFILE = * /BREAK = sample /xbar = MEAN(x).
FREQUENCIES xbar /FORMAT = NOTABLE /HISTOGRAM NORMAL
  /STATISTICS = MEAN STDDEV SKEWNESS.`,
    },
    init(ctx) {
      const st = ctx.state;
      st.pop = ctx.plot({ x: [0, 6], y: [0, 1], height: 220, xLabel: '값', yLabel: '밀도', title: '① 모집단과 방금 뽑은 표본' });
      st.means = ctx.plot({ x: [0, 6], y: [0, 1], height: 280, xLabel: '표본평균 x̄', yLabel: '밀도', title: '② 표본평균들의 분포 (표본분포)' });
      st.ms = []; st.seed = 5;
    },
    update(ctx, v, changed) {
      const st = ctx.state;
      if (changed === 'overlay') return render(ctx);
      if (['init', 'pop', 'n', 'clear'].includes(changed)) {
        if (st.stop) st.stop();
        st.ms = []; st.last = null; S.seed(st.seed++);
        if (changed !== 'clear') draw(ctx, 300); // complete first view
        return render(ctx);
      }
      const k = changed === 'd1' ? 1 : changed === 'd100' ? 100 : changed === 'd1000' ? 1000 : 0;
      if (!k) return;
      if (st.stop) st.stop();
      if (k === 1 || ctx.reducedMotion) { draw(ctx, k); return render(ctx); }
      let left = k; const per = Math.max(1, Math.ceil(k / 60));
      st.stop = ctx.loop(() => { const m = Math.min(per, left); draw(ctx, m); left -= m; render(ctx); if (left <= 0) return false; });
    },
  });
})();
