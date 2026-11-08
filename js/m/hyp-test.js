/* 가설검정: H0/H1 표본분포, α·β·검정력, 관측 통계량과 p값 */
(function () {
  function crit(v) { return v.tail === 'two' ? S.qnorm(1 - v.alpha / 2) : S.qnorm(1 - v.alpha); }
  function powerOf(v, delta) { const c = crit(v); return v.tail === 'two' ? 1 - S.pnorm(c - delta) + S.pnorm(-c - delta) : 1 - S.pnorm(c - delta); }
  Lab.add({
    id: 'hyp-test', subject: 'prob', order: 8,
    title: '가설검정 · p값 · 1종/2종 오류', en: 'Hypothesis testing · p-value · Type I/II errors',
    summary: '귀무가설과 대립가설의 표본분포를 겹쳐 놓고 유의수준 α, 효과크기, 표본크기를 바꾸며 α·β·검정력이 서로 어떻게 맞물리는지 봅니다.',
    keywords: 'hypothesis test p-value 유의수준 alpha beta 1종 오류 2종 오류 검정력 기각역 양측 단측',
    controls: [
      { type: 'slider', key: 'd', label: '참 효과크기 d (σ 단위)', min: 0, max: 1.5, step: 0.05, value: 0.4, hint: 'H1 세계의 참 평균 = μ₀ + d·σ' },
      { type: 'slider', key: 'n', label: '표본 크기 n', min: 5, max: 200, step: 1, value: 30 },
      { type: 'select', key: 'alpha', label: '유의수준 α', options: [[0.1, '.10'], [0.05, '.05'], [0.01, '.01'], [0.001, '.001']], value: 0.05 },
      { type: 'select', key: 'tail', label: '대립가설', options: [['two', '양측 μ ≠ μ₀'], ['right', '단측 μ > μ₀']], value: 'two' },
      { type: 'toggle', key: 'h1', label: 'H1 분포와 β·검정력 표시', value: true },
      { type: 'button', key: 'draw', label: '표본 하나 뽑아 검정하기', primary: true },
    ],
    concept: `
      <p>가설검정은 "효과가 없다"는 <b>귀무가설 H0</b>를 세워 두고, 관측된 데이터가 H0 아래에서 얼마나 드문지 따지는 절차입니다. 검정통계량 z = (x̄ − μ₀)/(σ/√n)가 H0 분포의 꼬리, 즉 <b>기각역</b>에 떨어지면 H0를 기각합니다.</p>
      <ul>
        <li><b>p값</b>: H0가 참일 때 지금만큼 또는 더 극단적인 통계량이 나올 확률. "H0가 참일 확률"이 아닙니다.</li>
        <li><b>1종 오류(α)</b>: H0가 참인데 기각하는 오류. 연구자가 미리 정하는 위험 수준입니다.</li>
        <li><b>2종 오류(β)</b>: H1이 참인데 기각하지 못하는 오류. <b>검정력 = 1 − β</b>는 실제 효과를 잡아낼 확률입니다.</li>
      </ul>
      <p>α를 줄이면 기각역이 좁아져 β가 커집니다. 두 오류를 동시에 줄이는 방법은 표본크기를 늘리는 것입니다. n이 커지면 H1 분포의 중심 δ = d·√n이 H0에서 멀어집니다.</p>
      <p>n이 매우 크면 아주 작은 효과도 유의해집니다. "통계적으로 유의하다"와 "실질적으로 중요하다"는 다른 질문이므로 효과크기와 신뢰구간을 함께 보고해야 합니다. 여기서는 σ를 아는 z검정으로 설명하지만, σ를 모르는 t검정도 원리는 같습니다.</p>`,
    formula: `<var>z</var> = (x̄ − μ₀) / (σ/√<var>n</var>) &nbsp;~ N(0,1) <span class="c">H0 아래</span><br><var>z</var> ~ N(δ, 1), &nbsp; δ = <var>d</var>√<var>n</var> <span class="c">H1 아래</span><br>양측 p = 2·[1 − Φ(|<var>z</var>|)], &nbsp; 검정력 = 1 − Φ(<var>z</var><sub>α/2</sub> − δ) + Φ(−<var>z</var><sub>α/2</sub> − δ)`,
    tasks: [
      'd = 0(H0가 참)으로 두고 "표본 하나 뽑아 검정하기"를 20번 눌러 보세요. 기각이 몇 번 나오나요? 그게 α의 의미입니다.',
      'd = 0.4, n = 30에서 검정력은? 80%가 되려면 n을 얼마까지 늘려야 하나요?',
      'α를 .05에서 .01로 바꾸면 β 영역(보라색)이 어떻게 변하나요?',
      '같은 관측값에서 양측 검정을 단측으로 바꾸면 p값이 정확히 절반이 되는지 확인하세요.',
    ],
    tools: {
      r: (v) => `set.seed(1)
n <- ${v.n}; d <- ${v.d}; alpha <- ${v.alpha}
x <- rnorm(n, mean = d, sd = 1)     # H1 세계 (mu0 = 0, sigma = 1)

# z검정 (sigma 알 때)
z <- (mean(x) - 0) / (1 / sqrt(n))
p <- ${v.tail === 'two' ? '2 * (1 - pnorm(abs(z)))' : '1 - pnorm(z)'}
c(z = z, p = p)

# t검정 (sigma 모를 때)
t.test(x, mu = 0, alternative = "${v.tail === 'two' ? 'two.sided' : 'greater'}")

# 검정력
power.t.test(n = n, delta = d, sd = 1, sig.level = alpha,
             type = "one.sample", alternative = "${v.tail === 'two' ? 'two.sided' : 'one.sided'}")`,
      spss: (v) => `* 분석 > 평균 비교 > 일표본 T검정, 검정값 = 0.
T-TEST /TESTVAL = 0 /VARIABLES = x /CRITERIA = CI(${1 - v.alpha}).
${v.tail === 'right' ? `
* SPSS 27 이상은 출력에 단측 p를 함께 보여줍니다.
* 이전 버전은 양측 유의확률을 2로 나누되, 효과 방향이 가설과 같은지 확인하세요.` : ''}
* 임계값 계산.
COMPUTE zcrit = IDF.NORMAL(${v.tail === 'two' ? 1 - v.alpha / 2 : 1 - v.alpha}, 0, 1).
EXECUTE.`,
    },
    init(ctx) {
      ctx.state.plot = ctx.plot({ x: [-4, 6], y: [0, 0.45], height: 340, xLabel: '검정통계량 z', yLabel: '밀도' });
      ctx.state.noise = 0.35;
      S.seed(99);
    },
    update(ctx, v, changed) {
      const st = ctx.state, C = Lab.C, p = st.plot;
      if (changed === 'draw') st.noise = S.randn();
      const delta = v.d * Math.sqrt(v.n), c = crit(v), two = v.tail === 'two';
      const hi = Math.max(4.2, v.h1 ? delta + 3.8 : 4.2), lo = -4.2;
      p.setX([lo, hi]); p.clear();
      const f0 = (x) => S.dnorm(x), f1 = (x) => S.dnorm(x, delta);
      const zobs = delta + st.noise;
      const pval = two ? 2 * (1 - S.pnorm(Math.abs(zobs))) : 1 - S.pnorm(zobs);
      const pw = powerOf(v, delta);
      if (v.h1) {
        if (two) { p.shade(f1, -c, c, { color: C.s7, opacity: 0.25 }); p.shade(f1, c, hi, { color: C.s3, opacity: 0.3 }); p.shade(f1, lo, -c, { color: C.s3, opacity: 0.3 }); }
        else { p.shade(f1, lo, c, { color: C.s7, opacity: 0.25 }); p.shade(f1, c, hi, { color: C.s3, opacity: 0.3 }); }
      }
      // p-value region (under H0)
      if (two) { p.shade(f0, Math.abs(zobs), hi, { color: C.s8, opacity: 0.35 }); p.shade(f0, lo, -Math.abs(zobs), { color: C.s8, opacity: 0.35 }); }
      else p.shade(f0, zobs, hi, { color: C.s8, opacity: 0.35 });
      // alpha region
      if (two) { p.shade(f0, c, hi, { color: C.s2, opacity: 0.55 }); p.shade(f0, lo, -c, { color: C.s2, opacity: 0.55 }); }
      else p.shade(f0, c, hi, { color: C.s2, opacity: 0.55 });
      const xs = S.linspace(lo, hi, 300);
      p.line(xs.map((x) => [x, f0(x)]), { color: C.ink2, width: 2 });
      if (v.h1) p.line(xs.map((x) => [x, f1(x)]), { color: C.s1, width: 2 });
      p.vline(c, { color: C.s2, dash: true, label: `+${S.f(c, 2)}`, labelY: 12 });
      if (two) p.vline(-c, { color: C.s2, dash: true, label: `−${S.f(c, 2)}`, anchor: 'end', labelY: 12 });
      p.vline(zobs, { color: C.ink, width: 2.5, label: `관측 z = ${S.f(zobs, 2)}`, labelY: p.ih * 0.45, anchor: zobs > (lo + hi) / 2 ? 'end' : 'start' });
      p.legend([{ label: 'H0 분포', color: C.ink2, type: 'line' }, ...(v.h1 ? [{ label: `H1 분포 (δ = ${S.f(delta, 2)})`, color: C.s1, type: 'line' }] : []),
        { label: `α (1종 오류)`, color: C.s2, type: 'box' }, ...(v.h1 ? [{ label: 'β (2종 오류)', color: C.s7, type: 'box' }, { label: '검정력 1−β', color: C.s3, type: 'box' }] : []), { label: 'p값 영역', color: C.s8, type: 'box' }]);

      const reject = pval < v.alpha;
      ctx.readout([
        { label: '관측 z · p값', value: `${S.f(zobs, 2)} · ${S.fp(pval)}`, sub: two ? '양측' : '단측' },
        { label: '결정', value: reject ? 'H0 기각' : 'H0 유지', tone: reject ? 'good' : 'warn', sub: `α = ${S.apa(v.alpha, v.alpha < 0.01 ? 3 : 2)}` },
        { label: '검정력 1−β', value: S.pct(pw), tone: pw >= 0.8 ? 'good' : 'accent', sub: `β = ${S.pct(1 - pw)}` },
        { label: 'H1 중심 δ = d√n', value: S.f(delta, 2), sub: `${v.d} × √${v.n}` },
      ]);
      let msg;
      if (v.d === 0) msg = `지금은 H0가 참인 세계(d = 0)입니다. 이 상태에서 기각이 나오면 모두 1종 오류이고, 장기적으로 ${S.pct(v.alpha, 1)}의 비율로 일어납니다.`;
      else {
        msg = `참 효과 d = ${v.d}, n = ${v.n}이면 H1 분포의 중심이 ${S.f(delta, 2)}에 있어 검정력이 <b>${S.pct(pw)}</b>입니다. 같은 실험을 반복하면 ${S.pct(1 - pw)}는 효과를 놓칩니다(2종 오류).`;
        if (!reject) msg += ` 이번 표본은 p = ${S.fp(pval)}로 기각하지 못했지만, 효과가 없다는 뜻은 아닙니다.`;
      }
      ctx.insight(msg);
    },
  });
})();
