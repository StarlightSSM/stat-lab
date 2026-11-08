/* 큰수의 법칙: 시행 횟수가 늘수록 표본 비율이 참 확률로 수렴 */
(function () {
  const KINDS = {
    coin: { p: 0.5, label: '동전 앞면', r: 'rbinom(N, 1, 0.5)', spss: 'RV.BERNOULLI(0.5)' },
    die: { p: 1 / 6, label: '주사위 6', r: 'sample(1:6, N, replace = TRUE) == 6', spss: '(TRUNC(RV.UNIFORM(1,7)) = 6)' },
    biased: { p: 0.3, label: '찌그러진 동전', r: 'rbinom(N, 1, 0.3)', spss: 'RV.BERNOULLI(0.3)' },
  };
  const logFmt = (v) => { const m = +(v / 10 ** Math.floor(Math.log10(v))).toFixed(5); return [1, 2, 5].includes(m) ? d3.format('~s')(v) : ''; };
  const SERIES = ['s1', 's2', 's3', 's7', 's5', 's6', 's4', 's8'];

  function render(ctx) {
    const st = ctx.state, v = ctx.p, C = Lab.C, k = KINDS[v.kind], pp = k.p, N = st.N, shown = Math.max(1, Math.min(N, Math.round(st.shown)));
    const plot = st.plot; plot.clear();
    // ±1.96 SE band around p
    const ns = st.idx.filter((i) => i <= shown);
    const band = d3.area().x((n) => plot.x(n)).y0((n) => plot.y(Math.max(0, pp - 1.96 * Math.sqrt(pp * (1 - pp) / n)))).y1((n) => plot.y(Math.min(1, pp + 1.96 * Math.sqrt(pp * (1 - pp) / n))));
    plot.g('under').append('path').attr('d', band(st.idx)).style('fill', C.muted).style('opacity', 0.14);
    plot.hline(pp, { color: C.ink, width: 1.5, dash: true, label: `참 확률 p = ${S.f(pp, 3)}` });
    st.runs.forEach((run, r) => {
      const pts = ns.map((n) => [n, run[n - 1]]);
      plot.line(pts, { color: C[SERIES[r]], width: r === 0 ? 2.2 : 1.6, opacity: r === 0 ? 1 : 0.8 });
      const last = run[shown - 1];
      plot.dots([[shown, last]], { color: C[SERIES[r]], r: 4, tip: () => `<b>실험 ${r + 1}</b><br>${S.comma(shown)}회 시행 후 비율 ${S.f(last, 4)}` });
    });
    plot.legend([{ label: '참 확률', color: C.ink, type: 'dash' }, { label: '±1.96·SE 범위', color: C.muted, type: 'box' },
      ...st.runs.map((_, r) => ({ label: `실험 ${r + 1}`, color: C[SERIES[r]], type: 'line' }))]);

    const cur = st.runs.map((run) => run[shown - 1]), se = Math.sqrt(pp * (1 - pp) / shown);
    const err = Math.abs(cur[0] - pp);
    ctx.readout([
      { label: '참 확률 p', value: S.f(pp, 3), sub: k.label },
      { label: `실험 1 비율 (${S.comma(shown)}회)`, value: S.f(cur[0], 4), tone: 'accent' },
      { label: '|비율 − p|', value: S.f(err, 4), tone: err < 2 * se ? 'good' : 'warn' },
      { label: '이론적 표준오차', value: S.f(se, 4), sub: '√(p(1−p)/n)' },
    ]);
    const range = (n) => { const a = st.runs.map((run) => run[n - 1]); return [S.min(a), S.max(a)]; };
    let msg;
    if (shown < 10) msg = '아직 시행이 몇 번 되지 않아 비율이 크게 출렁입니다.';
    else {
      const r10 = range(10), rn = range(shown);
      msg = `10회 시행 때 실험들의 비율은 <b>${S.f(r10[0], 2)}–${S.f(r10[1], 2)}</b>로 흩어져 있었지만, ${S.comma(shown)}회에서는 <b>${S.f(rn[0], 3)}–${S.f(rn[1], 3)}</b>로 좁아졌습니다. 표준오차는 1/√n 속도로 줄어서, 오차를 절반으로 줄이려면 시행을 4배 늘려야 합니다.`;
      if (st.runs.length === 1) msg = `실험 1의 비율은 ${S.comma(shown)}회 시행 후 ${S.f(cur[0], 4)}로, 참값과 ${S.f(err, 4)} 차이입니다. 표준오차 ${S.f(se, 4)}의 ${S.f(err / se, 1)}배입니다.`;
    }
    ctx.insight(msg);
  }

  Lab.add({
    id: 'prob-lln', subject: 'prob', order: 1,
    title: '큰수의 법칙', en: 'Law of large numbers',
    summary: '동전과 주사위를 수천 번 던지며 표본 비율이 참 확률로 다가가는 과정을 여러 실험으로 비교합니다.',
    keywords: 'law of large numbers 대수의 법칙 수렴 확률 시행',
    controls: [
      { type: 'select', key: 'kind', label: '실험 종류', options: [['coin', '동전 (p=.5)'], ['die', '주사위 6 (p=1/6)'], ['biased', '찌그러진 동전 (p=.3)']], value: 'coin' },
      { type: 'slider', key: 'N', label: '시행 횟수 N', min: 10, max: 5000, step: 10, value: 2000, fmt: (v) => S.comma(v) + '회' },
      { type: 'slider', key: 'runs', label: '동시에 돌릴 실험 수', min: 1, max: 8, step: 1, value: 4 },
      { type: 'toggle', key: 'anim', label: '시행 과정을 애니메이션으로', value: true },
      { type: 'button', key: 'resample', label: '다시 던지기', primary: true },
    ],
    concept: `
      <p>독립적인 시행을 반복할 때, 사건이 일어난 비율(표본평균)은 시행 횟수 n이 커질수록 참 확률 p에 가까워집니다. 이것이 <b>큰수의 법칙</b>입니다. 확률을 "장기적인 상대도수"로 해석할 수 있는 근거이기도 합니다.</p>
      <p>수렴 속도는 표준오차 <code>√(p(1−p)/n)</code>로 정해집니다. 오차는 1/√n에 비례하므로 n을 100배 늘려야 오차가 1/10로 줄어듭니다. 회색 띠는 각 n에서 비율의 약 95%가 들어가는 범위입니다.</p>
      <ul>
        <li><b>도박사의 오류</b>와 구분해야 합니다. 앞면이 다섯 번 연속 나왔다고 다음에 뒷면이 나올 확률이 커지지는 않습니다. 과거의 편차는 "보정"되는 것이 아니라 이후의 많은 시행 속에 <em>희석</em>될 뿐입니다.</li>
        <li>작은 표본에서는 극단적인 비율이 쉽게 나옵니다. 작은 병원에서 남아 출생 비율이 60%를 넘는 날이 더 자주 생기는 것과 같은 원리입니다.</li>
      </ul>`,
    formula: `<var>p̂<sub>n</sub></var> = (X<sub>1</sub> + … + X<sub>n</sub>) / <var>n</var> &nbsp;→&nbsp; <var>p</var> &nbsp;(n → ∞)<br>SE(<var>p̂<sub>n</sub></var>) = √(<var>p</var>(1−<var>p</var>) / <var>n</var>)<br>P(|<var>p̂<sub>n</sub></var> − <var>p</var>| &gt; ε) → 0 <span class="c">(약한 큰수의 법칙)</span>`,
    tasks: [
      '실험 수를 8로 늘리고 시행 10회 근처의 선들이 얼마나 흩어지는지, 1,000회 이후와 비교해 보세요.',
      '주사위(p=1/6)로 바꾸면 동전보다 띠가 좁습니다. p(1−p)가 0.25보다 작기 때문인지 계산해 보세요.',
      'N = 100과 N = 400에서 이론적 표준오차를 비교하세요. 정확히 절반이 되나요?',
      '다시 던지기를 여러 번 눌러, 초반 10회에서 한 실험이 0.8 이상까지 치솟는 경우가 있는지 찾아보세요.',
    ],
    tools: {
      r: (p) => `set.seed(1)
N <- ${p.N}
x <- ${KINDS[p.kind].r}       # 1 = 사건 발생
running <- cumsum(x) / seq_len(N)   # 누적 비율
tail(running, 1)

plot(running, type = "l", log = "x", ylim = c(0, 1),
     xlab = "시행 횟수", ylab = "누적 비율")
abline(h = ${S.f(KINDS[p.kind].p, 4)}, lty = 2)

# 여러 실험을 한 번에
runs <- replicate(${p.runs}, cumsum(${KINDS[p.kind].r}) / seq_len(N))
matplot(runs, type = "l", log = "x", lty = 1)`,
      spss: (p) => `* ${p.N}개 케이스 생성 후 베르누이 시행.
INPUT PROGRAM.
LOOP #i = 1 TO ${p.N}.
  COMPUTE trial = #i.
  END CASE.
END LOOP.
END FILE.
END INPUT PROGRAM.
SET SEED = 1.
COMPUTE x = ${KINDS[p.kind].spss}.
CREATE cumx = CSUM(x).
COMPUTE running = cumx / trial.
EXECUTE.
GRAPH /LINE(SIMPLE) = VALUE(running) BY trial.`,
    },
    init(ctx) {
      ctx.state.plot = ctx.plot({ x: [1, 2000], xLog: true, xFmt: logFmt, y: [0, 1], height: 340, xLabel: '시행 횟수 n (로그 눈금)', yLabel: '사건 발생 비율' });
      ctx.state.seed = 3;
    },
    update(ctx, v, changed) {
      const st = ctx.state;
      if (changed === 'anim' && !v.anim) { if (st.stop) st.stop(); st.shown = st.N; render(ctx); return; }
      if (changed === 'anim') return;
      if (changed === 'resample') st.seed++;
      S.seed(st.seed * 97 + v.runs);
      const N = v.N, pp = KINDS[v.kind].p;
      st.N = N;
      st.runs = Array.from({ length: v.runs }, () => { const out = new Float64Array(N); let c = 0; for (let i = 0; i < N; i++) { if (S.rand() < pp) c++; out[i] = c / (i + 1); } return out; });
      const set = new Set(); for (let i = 1; i <= Math.min(N, 60); i++) set.add(i);
      S.linspace(Math.log(1), Math.log(N), 260).forEach((l) => set.add(Math.min(N, Math.max(1, Math.round(Math.exp(l))))));
      set.add(N); st.idx = [...set].sort((a, b) => a - b);
      st.plot.setX([1, N]);
      if (st.stop) st.stop();
      if (v.anim && !ctx.reducedMotion && changed !== 'init') {
        let el = 0; st.shown = 1;
        st.stop = ctx.loop((dt) => { el += dt; st.shown = Math.exp(Math.log(N) * Math.min(1, el / 2600)); render(ctx); if (el >= 2600) return false; });
      } else { st.shown = N; render(ctx); }
    },
  });
})();
