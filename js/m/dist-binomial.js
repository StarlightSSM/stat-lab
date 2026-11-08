/* 이항분포: n, p, 누적확률, 정규근사 */
(function () {
  const TAILS = { le: 'P(X ≤ k)', ge: 'P(X ≥ k)', eq: 'P(X = k)' };
  const inSet = (i, k, t) => (t === 'le' ? i <= k : t === 'ge' ? i >= k : i === k);
  Lab.add({
    id: 'dist-binomial', subject: 'prob', order: 3,
    title: '이항분포', en: 'Binomial distribution',
    summary: '성공확률 p인 시행을 n번 할 때 성공 횟수의 분포. 누적확률을 칠하고 정규근사가 언제 잘 맞는지 비교합니다.',
    keywords: 'binomial 베르누이 성공 횟수 정규근사 연속성 수정',
    controls: [
      { type: 'slider', key: 'n', label: '시행 횟수 n', min: 1, max: 100, step: 1, value: 20 },
      { type: 'slider', key: 'p', label: '성공확률 p', min: 0.01, max: 0.99, step: 0.01, value: 0.3 },
      { type: 'heading', label: '확률을 구할 사건' },
      { type: 'select', key: 'tail', label: '사건', options: [['le', 'X ≤ k'], ['eq', 'X = k'], ['ge', 'X ≥ k']], value: 'le' },
      { type: 'slider', key: 'k', label: '기준값 k', min: 0, max: 100, step: 1, value: 4 },
      { type: 'toggle', key: 'approx', label: '정규근사 곡선 겹쳐 보기', value: true },
    ],
    concept: `
      <p>성공/실패 두 결과만 있는 독립 시행(베르누이 시행)을 n번 반복할 때, 성공 횟수 X는 <b>이항분포 B(n, p)</b>를 따릅니다. 설문 응답자 중 "예"의 수, 불량품 개수, 클릭 수처럼 사회과학과 경영 데이터에서 아주 흔합니다.</p>
      <ul>
        <li>평균 <code>np</code>, 분산 <code>np(1−p)</code>. p = 0.5일 때 분산이 가장 크고 분포가 좌우대칭입니다.</li>
        <li>p가 0이나 1에 가까우면 분포가 한쪽으로 치우칩니다(왜도).</li>
      </ul>
      <p>n이 크면 이항분포는 정규분포 <code>N(np, np(1−p))</code>로 근사할 수 있습니다. 보통 <b>np ≥ 5, n(1−p) ≥ 5</b>를 기준으로 삼고, 이산 분포를 연속 분포로 근사하므로 경계에 0.5를 더하거나 빼는 <em>연속성 수정</em>을 합니다. 비율에 대한 z검정과 신뢰구간이 이 근사에 기대고 있습니다.</p>`,
    formula: `P(X = <var>k</var>) = C(<var>n</var>, <var>k</var>) · <var>p</var><sup><var>k</var></sup> (1−<var>p</var>)<sup><var>n</var>−<var>k</var></sup><br>E[X] = <var>np</var>, &nbsp; Var(X) = <var>np</var>(1−<var>p</var>)<br>P(X ≤ <var>k</var>) ≈ Φ((<var>k</var> + 0.5 − <var>np</var>) / √(<var>np</var>(1−<var>p</var>))) <span class="c">(연속성 수정)</span>`,
    tasks: [
      'n = 10, p = 0.05로 두고 정규근사가 실제 막대와 얼마나 어긋나는지 보세요. np가 얼마인가요?',
      'n = 100, p = 0.5에서 P(X ≤ 45)의 정확한 값과 정규근사값을 비교하세요.',
      'p를 0.5에서 0.9로 옮기며 분포의 꼬리가 어느 쪽으로 늘어지는지 관찰하세요.',
      '객관식 20문항(4지선다)을 찍어서 10개 이상 맞힐 확률은? (n=20, p=0.25, X ≥ 10)',
    ],
    tools: {
      r: (v) => {
        const k = Math.min(v.k, v.n);
        const expr = v.tail === 'le' ? `pbinom(${k}, size = ${v.n}, prob = ${v.p})` : v.tail === 'ge' ? `1 - pbinom(${k - 1}, size = ${v.n}, prob = ${v.p})` : `dbinom(${k}, size = ${v.n}, prob = ${v.p})`;
        return `# ${TAILS[v.tail].replace('k', k)},  X ~ B(${v.n}, ${v.p})
${expr}

# 확률질량함수 막대그래프
barplot(dbinom(0:${v.n}, ${v.n}, ${v.p}), names.arg = 0:${v.n})

# 정규근사 (연속성 수정)
m <- ${v.n} * ${v.p}; s <- sqrt(${v.n} * ${v.p} * ${S.f(1 - v.p, 2)})
pnorm(${k} + 0.5, m, s)

# 정확 이항검정: 성공 ${k}회가 p = ${v.p}와 다른가?
binom.test(${k}, ${v.n}, p = ${v.p})`;
      },
      spss: (v) => {
        const k = Math.min(v.k, v.n);
        const expr = v.tail === 'le' ? `CDF.BINOM(${k}, ${v.n}, ${v.p})` : v.tail === 'ge' ? `1 - CDF.BINOM(${k - 1}, ${v.n}, ${v.p})` : `PDF.BINOM(${k}, ${v.n}, ${v.p})`;
        return `* 변환 > 변수 계산.
COMPUTE prob = ${expr}.
EXECUTE.

* 이항검정: 분석 > 비모수검정 > 레거시 대화상자 > 이항.
NPAR TESTS /BINOMIAL (${v.p}) = success.`;
      },
    },
    init(ctx) {
      ctx.state.plot = ctx.plot({ x: [-0.5, 20.5], y: [0, 0.3], height: 320, xLabel: '성공 횟수 k', yLabel: 'P(X = k)' });
    },
    update(ctx, v) {
      const C = Lab.C, n = v.n, pr = v.p, k = Math.min(v.k, n), plot = ctx.state.plot;
      if (v.k > n) ctx.set('k', n, true);
      const pm = d3.range(n + 1).map((i) => S.dbinom(i, n, pr));
      const mu = n * pr, sd = Math.sqrt(n * pr * (1 - pr));
      // zoom x to where the mass is when n is large
      const lo = n > 30 ? Math.max(-0.5, Math.floor(mu - 5 * sd) - 0.5) : -0.5, hi = n > 30 ? Math.min(n + 0.5, Math.ceil(mu + 5 * sd) + 0.5) : n + 0.5;
      plot.setX([Math.min(lo, k - 0.5), Math.max(hi, k + 0.5)]);
      const ymax = Math.max(...pm, sd > 0 ? S.dnorm(mu, mu, sd) : 0);
      plot.setY([0, Math.min(1, ymax * 1.15)]);
      plot.clear();
      const items = pm.map((y, i) => ({ x: i, y, color: inSet(i, k, v.tail) ? C.s1 : C.muted, opacity: inSet(i, k, v.tail) ? 0.9 : 0.45, tip: () => `<b>X = ${i}</b><br>P = ${S.f(y, 4)}<br>누적 P(X ≤ ${i}) = ${S.f(S.pbinom(i, n, pr), 4)}` }));
      plot.bars(items.filter((d) => d.x >= plot.o.x[0] && d.x <= plot.o.x[1]), { dw: 1, gap: n > 60 ? 1 : 2, tip: (d) => d.tip() });
      let approx = null;
      if (v.approx && sd > 0) {
        plot.line(S.linspace(plot.o.x[0], plot.o.x[1], 240).map((x) => [x, S.dnorm(x, mu, sd)]), { color: C.s2, width: 2 });
        approx = v.tail === 'le' ? S.pnorm(k + 0.5, mu, sd) : v.tail === 'ge' ? 1 - S.pnorm(k - 0.5, mu, sd) : S.pnorm(k + 0.5, mu, sd) - S.pnorm(k - 0.5, mu, sd);
      }
      plot.vline(mu, { color: C.ink2, dash: true, label: `평균 np = ${S.f(mu, 1)}`, anchor: mu > (plot.o.x[0] + plot.o.x[1]) / 2 ? 'end' : 'start' });
      plot.legend([{ label: `${TAILS[v.tail].replace('k', k)}에 포함`, color: C.s1, type: 'box' }, { label: '포함 안 됨', color: C.muted, type: 'box' }, ...(v.approx ? [{ label: `정규근사 N(${S.f(mu, 1)}, ${S.f(sd, 2)}²)`, color: C.s2, type: 'line' }] : [])]);

      const exact = S.sum(pm.filter((_, i) => inSet(i, k, v.tail)));
      const ok = mu >= 5 && n * (1 - pr) >= 5;
      ctx.readout([
        { label: TAILS[v.tail].replace('k', k), value: S.f(exact, 4), sub: '정확한 이항확률', tone: 'accent' },
        { label: '정규근사값', value: approx == null ? '—' : S.f(approx, 4), sub: approx == null ? '근사 꺼짐' : `오차 ${S.f(approx - exact, 4)}` },
        { label: '평균 np · 표준편차', value: `${S.f(mu, 1)} · ${S.f(sd, 2)}` },
        { label: 'np, n(1−p) ≥ 5?', value: ok ? '충족' : '미충족', tone: ok ? 'good' : 'warn', sub: `${S.f(mu, 1)}, ${S.f(n * (1 - pr), 1)}` },
      ]);
      const skew = (1 - 2 * pr) / (sd || 1);
      let msg = `B(${n}, ${pr})에서 ${TAILS[v.tail].replace('k', k)} = <b>${S.f(exact, 4)}</b>입니다.`;
      if (approx != null) msg += ok ? ` 정규근사(${S.f(approx, 4)})와의 차이가 ${S.f(Math.abs(approx - exact), 4)}로 작습니다.` : ` 기대 성공(또는 실패) 횟수가 5보다 작아서 정규근사가 ${S.f(Math.abs(approx - exact), 4)}만큼 어긋납니다.`;
      if (Math.abs(skew) > 0.5) msg += ` 분포가 ${skew > 0 ? '오른쪽' : '왼쪽'}으로 꼬리가 깁니다(왜도 ${S.f(skew, 2)}).`;
      ctx.insight(msg);
    },
  });
})();
