/* R · lm()과 summary() 출력 읽기 */
(function () {
  // upper-tail helpers that keep precision for tiny p-values
  const pT2 = (t, df) => S.ibeta(df / (df + t * t), df / 2, 0.5);
  const pFup = (F, d1, d2) => S.ibeta(d2 / (d2 + d1 * F), d2 / 2, d1 / 2);
  const sig4 = (x) => { if (x === 0) return '0'; const s = Number(x.toPrecision(4)); return Math.abs(s) >= 1e5 || Math.abs(s) < 1e-4 ? s.toExponential(3).replace(/e([+-])(\d)$/, 'e$10$2') : String(s); };
  const pv = (p) => (p < 2e-16 ? '< 2e-16' : p < 1e-4 ? p.toExponential(2).replace(/e([+-])(\d)$/, 'e$10$2') : String(Number(p.toPrecision(3))));
  const pvF = (p) => (p < 2.2e-16 ? '< 2.2e-16' : p < 1e-4 ? p.toExponential(3).replace(/e([+-])(\d)$/, 'e$10$2') : String(Number(p.toPrecision(4))));
  const star = (p) => (p < 0.001 ? '***' : p < 0.01 ? '**' : p < 0.05 ? '*' : p < 0.1 ? '.' : '');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const mark = (s, n) => `<span style="background:var(--accent-soft);border-radius:3px">${esc(s)}</span><span style="color:var(--marker);font-weight:600">${n}</span>`;

  function summaryText(m, names, formula) {
    const res = m.resid, q = [0, 0.25, 0.5, 0.75, 1].map((p) => S.quantile(res, p));
    const mx = Math.max(...q.map(Math.abs)), dq = mx < 10 ? 4 : mx < 100 ? 3 : 2;
    const qs = q.map((v) => v.toFixed(dq).replace('-', '-')), qh = ['Min', '1Q', 'Median', '3Q', 'Max'], qwAll = Math.max(...qs.map((s) => s.length), 6), qw = qs.map(() => qwAll);
    const rows = ['(Intercept)', ...names];
    const minSE = Math.min(...m.se), de = Math.max(0, Math.min(6, 4 - Math.floor(Math.log10(minSE)) - 1));
    const est = m.b.map((v) => v.toFixed(de)), se = m.se.map((v) => v.toFixed(de)), tv = m.t.map((v) => v.toFixed(3)), pp = m.p.map((p, i) => pv(pT2(m.t[i], m.df2))), st = m.p.map((p, i) => star(pT2(m.t[i], m.df2)));
    const w = [Math.max(...rows.map((r) => r.length)), Math.max(8, ...est.map((s) => s.length)), Math.max(10, ...se.map((s) => s.length)), Math.max(7, ...tv.map((s) => s.length)), Math.max(8, ...pp.map((s) => s.length))];
    const L = [];
    L.push(['Call:', `lm(formula = ${formula}, data = df)`, '', 'Residuals:']);
    const head = qh.map((h, i) => h.padStart(qw[i])).join(' ') + ' ', vals = qs.map((s, i) => s.padStart(qw[i])).join(' ') + ' ';
    const coefHead = ' '.repeat(w[0]) + ' ' + 'Estimate'.padStart(w[1]) + ' ' + 'Std. Error'.padStart(w[2]) + ' ' + 't value'.padStart(w[3]) + ' ' + 'Pr(>|t|)'.padStart(w[4]) + '    ';
    const coefRows = rows.map((r, i) => ({ name: r.padEnd(w[0]), est: est[i].padStart(w[1]), se: se[i].padStart(w[2]), t: tv[i].padStart(w[3]), p: pp[i].padStart(w[4]), s: st[i] }));
    const rse = `Residual standard error: ${sig4(m.sigma)} on ${m.df2} degrees of freedom`;
    const r2 = `Multiple R-squared:  ${sig4(m.r2)},\tAdjusted R-squared:  ${sig4(m.adjR2)} `;
    const F = `F-statistic: ${sig4(m.F).padStart(5)} on ${m.df1} and ${m.df2} DF,  p-value: ${pvF(pFup(m.F, m.df1, m.df2))}`;
    return { L, head, vals, coefHead, coefRows, rse, r2, F, q, plain: null };
  }

  Lab.add({
    id: 'r-lm', subject: 'r', order: 4,
    title: 'lm()과 summary() 출력 읽기', en: 'Linear models in R · reading summary(lm)',
    summary: '기울기, 잡음, 표본크기, 두 번째 예측변수를 바꾸며 summary(lm) 출력의 각 줄이 무엇을 말하는지 번호를 따라 읽습니다.',
    keywords: 'r lm summary 회귀 coefficients r-squared residual standard error f-statistic',
    controls: [
      { type: 'slider', key: 'b1', label: 'x의 참 기울기 β₁', min: -2, max: 2, step: 0.05, value: 0.8 },
      { type: 'slider', key: 'sd', label: '잡음 표준편차 σ', min: 0.5, max: 8, step: 0.1, value: 3 },
      { type: 'slider', key: 'n', label: '표본크기 n', min: 10, max: 300, step: 5, value: 60 },
      { type: 'slider', key: 'b2', label: 'z의 참 효과 β₂ (z는 x와 r = .5)', min: -2, max: 2, step: 0.05, value: 1 },
      { type: 'toggle', key: 'fit2', label: '모형에 z 포함: y ~ x + z', value: false },
      { type: 'button', key: 'resample', label: '새 데이터 (다른 seed)', primary: true },
    ],
    concept: `
      <p><code>fit &lt;- lm(y ~ x, data = df)</code>로 회귀모형을 적합하고 <code>summary(fit)</code>로 결과를 봅니다. 출력의 번호를 따라 읽으세요.</p>
      <ol>
        <li><b>Residuals</b> : 잔차의 다섯 숫자 요약. 중앙값이 0 근처이고 1Q와 3Q, Min과 Max의 절댓값이 비슷하면 잔차가 대칭이라는 신호입니다.</li>
        <li><b>Estimate</b> : 회귀계수. x가 1 증가할 때 y의 평균 변화량입니다. 절편은 x = 0일 때의 예측값입니다.</li>
        <li><b>Pr(&gt;|t|)</b> : "이 계수가 0이다"에 대한 t검정의 p값. 오른쪽 별표는 아래 <code>Signif. codes</code> 범례로 읽습니다.</li>
        <li><b>Residual standard error</b> : 잔차의 표준편차 추정값(σ̂). 예측이 평균적으로 얼마나 빗나가는지를 y 단위로 알려 줍니다. 자유도 = n − 추정한 계수 수.</li>
        <li><b>R-squared</b> : 설명된 분산 비율. 예측변수를 늘리면 무조건 커지므로 Adjusted R²도 봅니다.</li>
        <li><b>F-statistic</b> : 모든 기울기가 0이라는 귀무가설에 대한 검정. 단순회귀에서는 F = t²입니다.</li>
      </ol>
      <p>z가 y에 영향을 주고 x와도 상관이 있는데 모형에서 빠지면, x의 계수가 z의 효과까지 떠안아 편향됩니다(<em>누락변수 편향</em>). 토글로 확인해 보세요.</p>`,
    formula: `<var>y</var> = β₀ + β₁<var>x</var> + β₂<var>z</var> + ε, &nbsp; ε ~ N(0, σ²)<br>σ̂ = √(SSE / (<var>n</var> − <var>k</var> − 1)) &nbsp;&nbsp; <var>t</var> = <var>b</var> / SE(<var>b</var>)<br>누락변수 편향: E[<var>b</var>₁] = β₁ + β₂ · cov(<var>x</var>,<var>z</var>)/var(<var>x</var>)`,
    tasks: [
      '잡음 σ를 0.5에서 8로 올리세요. Estimate는 비슷한데 ④ Residual standard error와 ⑤ R²는 어떻게 바뀌나요?',
      'β₁ = 0.2, σ = 6으로 두고 n을 20과 300으로 바꿔 보세요. 같은 효과의 p값과 별표가 어떻게 달라지나요?',
      'β₂ = 1.5로 두고 "모형에 z 포함"을 끄고 켜 보세요. x의 Estimate가 참값 β₁에서 얼마나 벗어났다가 돌아오나요?',
      '단순회귀(z 미포함)에서 x의 t value를 제곱해 F-statistic과 같은지 확인하세요.',
    ],
    tools: {
      r: (p) => `set.seed(1)
n <- ${p.n}
x <- rnorm(n, 10, 3)
z <- 0.5 * (x - 10) / 3 * 2 + rnorm(n, 0, sqrt(1 - 0.25) * 2)   # x와 r ≈ .5
y <- 5 + ${p.b1} * x + ${p.b2} * z + rnorm(n, 0, ${p.sd})
df <- data.frame(x, z, y)

fit <- lm(${p.fit2 ? 'y ~ x + z' : 'y ~ x'}, data = df)
summary(fit)
confint(fit)                # 계수의 95% 신뢰구간
plot(fit, which = 1)        # 잔차 vs 적합값`,
    },
    init(ctx) {
      const row = ctx.row();
      const a = ctx.box('', row), b = ctx.box('', row);
      ctx.state.sc = ctx.plot({ x: [0, 20], y: [0, 30], height: 240, xLabel: 'x', yLabel: 'y', title: '데이터와 적합선' }, a);
      ctx.state.rp = ctx.plot({ x: [0, 30], y: [-10, 10], height: 240, xLabel: '적합값 ŷ', yLabel: '잔차', title: '잔차 vs 적합값' }, b);
      ctx.state.con = ctx.box(''); ctx.state.con.style.minWidth = '0';
      ctx.state.ann = ctx.box('');
      ctx.state.seed = 1;
    },
    update(ctx, v, changed) {
      if (changed === 'resample') ctx.state.seed++;
      S.seed(ctx.state.seed);
      const n = v.n, x = [], z = [], y = [];
      for (let i = 0; i < n; i++) { const xi = S.randn(10, 3), zi = 0.5 * ((xi - 10) / 3) * 2 + S.randn(0, Math.sqrt(0.75) * 2); x.push(xi); z.push(zi); y.push(5 + v.b1 * xi + v.b2 * zi + S.randn(0, v.sd)); }
      const X = v.fit2 ? x.map((xi, i) => [xi, z[i]]) : x.map((xi) => [xi]), names = v.fit2 ? ['x', 'z'] : ['x'];
      const m = S.ols(X, y, names), T = summaryText(m, names, v.fit2 ? 'y ~ x + z' : 'y ~ x');
      const lines = [];
      lines.push('> summary(fit)', '', 'Call:', esc(T.L[0][1]), '', 'Residuals:' + '<span style="color:var(--marker);font-weight:600">①</span>', esc(T.head), mark(T.vals, ''), '', 'Coefficients:', esc(T.coefHead));
      T.coefRows.forEach((r, i) => lines.push(esc(r.name) + ' ' + (i > 0 ? mark(r.est, i === 1 ? '②' : '') : esc(r.est)) + ' ' + esc(r.se) + ' ' + esc(r.t) + ' ' + (i > 0 ? mark(r.p, i === 1 ? '③' : '') : esc(r.p)) + ' ' + esc(r.s)));
      lines.push('---', "Signif. codes:  0 ‘***’ 0.001 ‘**’ 0.01 ‘*’ 0.05 ‘.’ 0.1 ‘ ’ 1", '', mark(T.rse, '④'), mark(T.r2, '⑤'), mark(T.F, '⑥'));
      ctx.state.con.innerHTML = `<pre class="r-console">${lines.join('\n')}</pre>`;

      const C = Lab.C, sc = ctx.state.sc, rp = ctx.state.rp;
      const xr = [Math.min(...x) - 0.5, Math.max(...x) + 0.5], yr = [Math.min(...y), Math.max(...y)], pad = (yr[1] - yr[0]) * 0.08 + 0.5;
      sc.setX(xr); sc.setY([yr[0] - pad, yr[1] + pad]); sc.clear();
      sc.dots(x.map((xi, i) => ({ x: xi, y: y[i] })), { r: 3.5, color: C.s7, opacity: 0.6, tip: (d) => `x = ${S.f(d.x, 2)}<br>y = ${S.f(d.y, 2)}` });
      const zbar = S.mean(z), line = (xx) => m.b[0] + m.b[1] * xx + (v.fit2 ? m.b[2] * zbar : 0);
      sc.line(xr.map((xx) => [xx, line(xx)]), { color: C.marker, width: 2.5 });
      sc.line(xr.map((xx) => [xx, 5 + v.b1 * xx + v.b2 * zbar]), { color: C.ink2, width: 1.5, dash: true });
      sc.legend([{ label: `추정선 (b₁ = ${S.f(m.b[1], 3)})`, color: C.marker, type: 'line' }, { label: `참 관계 (β₁ = ${v.b1}${v.fit2 ? '' : ', z 평균에서'})`, color: C.ink2, type: 'dash' }]);
      const fr = [Math.min(...m.fitted), Math.max(...m.fitted)], rr = Math.max(...m.resid.map(Math.abs)) * 1.15 + 0.1;
      rp.setX([fr[0] - 0.5, fr[1] + 0.5]); rp.setY([-rr, rr]); rp.clear();
      rp.hline(0, { color: C.ink2, width: 1 });
      rp.dots(m.fitted.map((f, i) => ({ x: f, y: m.resid[i] })), { r: 3.5, color: C.s7, opacity: 0.6, tip: (d) => `ŷ = ${S.f(d.x, 2)}<br>잔차 = ${S.f(d.y, 2)}` });
      rp.hline(m.sigma, { color: C.s4, dash: true, label: '+σ̂' }); rp.hline(-m.sigma, { color: C.s4, dash: true, label: '−σ̂' });

      const bias = m.b[1] - v.b1, pX = pT2(m.t[1], m.df2);
      ctx.state.ann.innerHTML = `<div class="card" style="padding:12px 16px"><div class="prose" style="max-width:none;font-size:14px">
        <b style="color:var(--marker)">②</b> x가 1 오르면 y가 평균 <b>${S.f(m.b[1], 3)}</b> 변합니다 (참값 ${v.b1}). &nbsp;
        <b style="color:var(--marker)">③</b> p ${pX < 2e-16 ? '< 2e-16' : '= ' + pv(pX)} ${pX < 0.05 ? '→ 0과 유의하게 다름' : '→ 0과 구별되지 않음'}. &nbsp;
        <b style="color:var(--marker)">④</b> 예측은 평균 ±${sig4(m.sigma)}만큼 빗나갑니다 (설정한 σ = ${v.sd}). &nbsp;
        <b style="color:var(--marker)">⑤</b> y 분산의 ${S.pct(m.r2, 1)} 설명. &nbsp;
        <b style="color:var(--marker)">⑥</b> ${v.fit2 ? 'x와 z 기울기가 모두 0인지' : `F = t² = ${S.f(m.t[1] ** 2, 2)}`} 검정.</div></div>`;
      ctx.readout([
        { label: 'x의 Estimate', value: S.f(m.b[1], 3), sub: `참값 ${v.b1}`, tone: 'accent' },
        { label: 'x의 Pr(>|t|)', value: pv(pX), tone: pX < 0.05 ? 'good' : null, sub: star(pX) || 'n.s.' },
        { label: 'Residual SE', value: sig4(m.sigma), sub: `df = ${m.df2}` },
        { label: 'R²', value: S.f(m.r2, 4), sub: `Adj ${S.f(m.adjR2, 4)}` },
      ]);
      let msg;
      if (!v.fit2 && Math.abs(v.b2) > 0.3 && Math.abs(bias) > 0.15) msg = `z를 모형에서 뺐더니 x의 계수가 ${S.f(m.b[1], 2)}로 참값 ${v.b1}에서 <b>${bias > 0 ? '+' : ''}${S.f(bias, 2)}</b>만큼 벗어났습니다. x와 상관된 z의 효과를 x가 떠안은 누락변수 편향입니다. 토글을 켜 보세요.`;
      else if (pX >= 0.05) msg = `x의 효과(${S.f(m.b[1], 2)})가 잡음(σ̂ = ${sig4(m.sigma)})에 비해 작거나 n = ${n}이 작아 p = ${pv(pX)}로 유의하지 않습니다.`;
      else msg = `x의 계수 ${S.f(m.b[1], 3)}는 참값 ${v.b1}에 가깝고 유의합니다(${star(pX)}). R² = ${S.f(m.r2, 3)}은 효과 크기뿐 아니라 잡음 σ에도 크게 좌우된다는 점을 기억하세요.`;
      ctx.insight(msg);
    },
  });
})();
