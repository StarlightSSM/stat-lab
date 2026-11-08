/* r-lavaan — toggle model parts → live lavaan syntax, path diagram and a simulated summary() */
(function () {
  const N = 300;
  const POP = { lq: [0.82, 0.76, 0.71], li: [0.85, 0.79, 0.74], a: 0.58, b: 0.41, c: 0.27, cOnly: 0.52, ecov: 0.12 };

  function spec(v) {
    const meas = v.meas, med = v.med, direct = med ? v.direct : true, ecov = meas && v.ecov, defined = med && v.defined;
    const X = meas ? 'Quality' : 'quality', Y = meas ? 'Intent' : 'intent', M = 'sat';
    const obs = (meas ? 6 : 2) + (med ? 1 : 0);
    const parts = [];
    if (meas) parts.push(['요인적재량 (자유)', 4], ['지표 오차분산', 6], [`${X} 분산`, 1]); else parts.push([`${X} 분산`, 1]);
    parts.push([`${Y} (잔차)분산`, 1]);
    if (med) { parts.push(['회귀계수 a, b' + (direct ? ', c' : ''), direct ? 3 : 2], [`${M} 잔차분산`, 1]); } else parts.push(['회귀계수', 1]);
    if (ecov) parts.push(['오차공분산 q1 ~~ q2', 1]);
    const t = S.sum(parts.map((p) => p[1])), moments = obs * (obs + 1) / 2, df = moments - t;
    return { meas, med, direct, ecov, defined, X, Y, M, obs, parts, t, moments, df, std: v.std };
  }
  function syntax(s) {
    const L = [];
    if (s.meas) { L.push('  # 측정모형 (=~ : "~로 측정된다")', `  ${s.X} =~ q1 + q2 + q3`, `  ${s.Y}  =~ i1 + i2 + i3`); }
    L.push('  # 구조모형 (~ : 회귀)');
    if (s.med) { L.push(`  ${s.M} ~ a*${s.X}`); L.push(`  ${s.Y} ~ b*${s.M}${s.direct ? ` + c*${s.X}` : ''}`); }
    else L.push(`  ${s.Y} ~ ${s.X}`);
    if (s.ecov) L.push('  # (잔차)공분산 (~~)', '  q1 ~~ q2');
    if (s.defined) { L.push('  # 정의된 모수 (:=)', '  indirect := a*b'); if (s.direct) L.push('  total    := c + a*b'); }
    return L.join('\n');
  }

  // ---- lavaan-like summary text ----
  const pad = (x, w) => { x = String(x); return x.length >= w ? x : ' '.repeat(w - x.length) + x; };
  const padR = (x, w) => { x = String(x); return x.length >= w ? x : x + ' '.repeat(w - x.length); };
  const num = (x) => (x == null ? '' : x.toFixed(3));
  function row(label, e, std, showStd) {
    let line = padR('    ' + label, 20) + pad(num(e.est), 9);
    if (e.se != null) line += pad(num(e.se), 9) + pad(num(e.est / e.se), 9) + pad(num(Math.max(0, 2 * (1 - S.pnorm(Math.abs(e.est / e.se))))), 9);
    else line += ' '.repeat(27);
    if (showStd) line += pad(num(std), 10);
    return line;
  }
  function summary(s, seed) {
    S.seed(seed);
    const jit = (sd = 0.02) => S.randn(0, sd), se = (r) => Math.sqrt((1 - r * r) / N) * (1.1 + 0.2 * S.rand());
    const out = [];
    const misfit = s.med && !s.direct ? N * POP.c * POP.c * 0.55 : 0;
    const chi = s.df > 0 ? Math.max(0.5, s.df + jit(Math.sqrt(2 * s.df) * 0.6) + misfit) : 0;
    out.push('lavaan 0.6-19 ended normally after ' + (24 + Math.round(S.rand() * 20)) + ' iterations', '');
    out.push(padR('  Estimator', 50) + pad('ML', 6), padR('  Optimization method', 50) + pad('NLMINB', 6), padR('  Number of model parameters', 50) + pad(s.t, 6), '');
    out.push(padR('  Number of observations', 50) + pad(N, 6), '', 'Model Test User Model:', '');
    out.push(padR('  Test statistic', 47) + pad(chi.toFixed(3), 9), padR('  Degrees of freedom', 47) + pad(s.df, 9));
    if (s.df > 0) out.push(padR('  P-value (Chi-square)', 47) + pad((1 - S.pchisq(chi, s.df)).toFixed(3), 9));
    out.push('', 'Parameter Estimates:', '');
    const hdr = padR('', 20) + pad('Estimate', 9) + pad('Std.Err', 9) + pad('z-value', 9) + pad('P(>|z|)', 9) + (s.std ? pad('Std.all', 10) : '');
    const stdL = {};
    if (s.meas) {
      out.push('Latent Variables:', hdr);
      [[s.X, 'q', POP.lq], [s.Y, 'i', POP.li]].forEach(([f, p, ls]) => {
        out.push(`  ${f} =~`);
        ls.forEach((l, i) => { const st = S.clamp(l + jit(), 0.3, 0.97); stdL[p + (i + 1)] = st; out.push(row(p + (i + 1), i === 0 ? { est: 1 } : { est: (st / ls[0]) * (1 + jit(0.03)), se: 0.06 + 0.02 * S.rand() }, st, s.std)); });
      });
      out.push('');
    }
    out.push('Regressions:', hdr);
    const est = {};
    if (s.med) {
      est.a = POP.a + jit(); est.b = POP.b + jit(); est.c = s.direct ? POP.c + jit() : 0;
      if (!s.direct) est.b += 0.08; // b absorbs part of the omitted direct path
      out.push(`  ${s.M} ~`, row(`${s.X}    (a)`, { est: est.a, se: se(est.a) }, est.a, s.std));
      out.push(`  ${s.Y} ~`, row(`${s.M}        (b)`, { est: est.b, se: se(est.b) }, est.b, s.std));
      if (s.direct) out.push(row(`${s.X}    (c)`, { est: est.c, se: se(est.c) }, est.c, s.std));
    } else { est.c = POP.cOnly + jit(); out.push(`  ${s.Y} ~`, row(s.X, { est: est.c, se: se(est.c) }, est.c, s.std)); }
    out.push('');
    if (s.ecov) { const e = POP.ecov + jit(); out.push('Covariances:', hdr, '  .q1 ~~', row('.q2', { est: e, se: 0.03 }, e / Math.sqrt((1 - stdL.q1 ** 2) * (1 - stdL.q2 ** 2)), s.std), ''); }
    out.push('Variances:', hdr);
    if (s.meas) ['q1', 'q2', 'q3', 'i1', 'i2', 'i3'].forEach((nm) => { const r = 1 - stdL[nm] ** 2; out.push(row('.' + nm, { est: r * (1 + jit(0.03)), se: 0.03 + 0.01 * S.rand() }, r, s.std)); });
    out.push(row(s.X, { est: 1 + jit(0.05), se: 0.09 }, 1, s.std));
    const r2Y = s.med ? Math.min(0.9, est.b ** 2 + est.c ** 2 + 2 * est.b * est.c * est.a) : est.c ** 2;
    if (s.med) out.push(row('.' + s.M, { est: 1 - est.a ** 2, se: 0.07 }, 1 - est.a ** 2, s.std));
    out.push(row('.' + s.Y, { est: 1 - r2Y, se: 0.07 }, 1 - r2Y, s.std));
    if (s.defined) {
      out.push('', 'Defined Parameters:', hdr);
      const ind = est.a * est.b, seI = Math.sqrt(est.b ** 2 * se(est.a) ** 2 + est.a ** 2 * se(est.b) ** 2);
      out.push(row('indirect', { est: ind, se: seI }, ind, s.std));
      if (s.direct) out.push(row('total', { est: ind + est.c, se: Math.sqrt(seI ** 2 + se(est.c) ** 2) }, ind + est.c, s.std));
    }
    return { text: out.join('\n'), chi, est, r2Y, stdL };
  }

  Lab.add({
    id: 'r-lavaan', subject: 'r', order: 6,
    title: 'lavaan 문법 빌더', en: 'lavaan model syntax · =~  ~  ~~  :=',
    summary: '측정모형, 회귀, 공분산, 정의된 모수를 하나씩 켜고 끄며 lavaan 모형 문법이 어떻게 바뀌는지, 그에 따라 경로도와 summary() 출력, 자유도가 어떻게 달라지는지 봅니다.',
    keywords: 'lavaan r sem 구조방정식 문법 syntax cfa summary',
    controls: [
      { type: 'toggle', key: 'meas', label: '측정모형 =~ (잠재변수로 추정)', value: true },
      { type: 'toggle', key: 'med', label: '매개변수 sat 추가 (~)', value: true },
      { type: 'toggle', key: 'direct', label: '직접경로 c (Quality → Intent)', value: true },
      { type: 'toggle', key: 'ecov', label: '오차공분산 q1 ~~ q2', value: false },
      { type: 'toggle', key: 'defined', label: '간접효과 정의 :=', value: true },
      { type: 'toggle', key: 'std', label: 'standardized = TRUE (Std.all 열)', value: true },
      { type: 'button', key: 'reseed', label: '다른 표본으로 다시 추정' },
    ],
    concept: `
      <p>lavaan은 R에서 구조방정식을 추정하는 패키지입니다. 모형을 따옴표 안의 문자열로 쓰는데, 연산자 네 개만 알면 대부분의 모형을 쓸 수 있습니다.</p>
      <table><thead><tr><th>연산자</th><th>뜻</th><th>예</th></tr></thead><tbody>
        <tr><td><code>=~</code></td><td>잠재변수가 지표로 측정된다 (AMOS의 타원 → 사각형)</td><td><code>Quality =~ q1 + q2 + q3</code></td></tr>
        <tr><td><code>~</code></td><td>회귀 (왼쪽이 종속변수)</td><td><code>Intent ~ sat</code></td></tr>
        <tr><td><code>~~</code></td><td>분산 또는 공분산 (양방향 화살표)</td><td><code>q1 ~~ q2</code></td></tr>
        <tr><td><code>:=</code></td><td>라벨을 이용해 새 모수를 정의</td><td><code>indirect := a*b</code></td></tr>
      </tbody></table>
      <p>계수 앞에 <code>a*</code>처럼 붙인 것은 <b>라벨</b>입니다. 라벨이 있어야 <code>:=</code>로 간접효과를 정의하거나, 두 경로에 같은 라벨을 붙여 동일화 제약을 걸 수 있습니다. 숫자를 붙이면(<code>1*q1</code>) 그 값으로 고정됩니다.</p>
      <p><code>cfa()</code>와 <code>sem()</code>은 기본으로 각 잠재변수의 첫 지표 적재량을 1로 고정하고(마커 방식), 오차분산과 외생 잠재변수 간 공분산을 자동으로 추가합니다. 아래 summary() 출력은 실제 추정이 아니라 이 모형 구조에 맞게 <em>시뮬레이션한 예시</em>이며, 자유모수 수와 자유도는 정확히 계산한 값입니다.</p>`,
    formula: `df = <var>p</var>(<var>p</var>+1)/2 − <var>t</var> &nbsp;<span class="c">(p: 관측변수 수, t: 자유모수 수)</span><br>
      indirect := <var>a</var>×<var>b</var> &nbsp;&nbsp; total := <var>c</var> + <var>a</var>×<var>b</var>`,
    tasks: [
      '측정모형을 끄면 관측변수가 7개에서 3개로 줄고 df가 0이 됩니다. 이때 χ² 검정이 왜 의미가 없는지 설명해 보세요.',
      '직접경로 c를 끄면 df가 1 늘고 χ²가 커집니다. "완전매개 모형"을 검정한다는 것이 이런 뜻입니다. b 추정치는 어떻게 바뀌나요?',
      '매개변수를 끈 상태에서 간접효과 정의를 켜 보세요. 문법에서 := 줄이 사라지는 이유는 무엇인가요?',
      '오차공분산 q1 ~~ q2를 추가하면 자유모수와 df가 각각 얼마나 변하나요? summary()의 어느 블록에 새 줄이 생기나요?',
    ],
    tools: {
      r: (p) => {
        const s = spec(p);
        return `library(lavaan)
model <- '
${syntax(s)}
'
fit <- sem(model, data = df${s.med && s.defined ? ', se = "bootstrap", bootstrap = 2000' : ''})
summary(fit, fit.measures = TRUE${s.std ? ', standardized = TRUE' : ''})
fitMeasures(fit, c("npar", "df", "chisq", "cfi", "rmsea"))
${s.defined ? 'parameterEstimates(fit, boot.ci.type = "perc")   # indirect의 부트스트랩 CI' : 'modindices(fit, sort. = TRUE, maximum.number = 5)'}`;
      },
      amos: (p) => {
        const s = spec(p);
        return `[같은 모형을 AMOS로]
${s.meas ? `· 타원 ${s.X}, ${s.Y} 에 각각 사각형 지표 3개 (q1~q3, i1~i3) + 오차항\n` : `· 사각형 ${s.X}, ${s.Y} (관측변수)\n`}${s.med ? `· 사각형 ${s.M} 추가, ${s.X} → ${s.M} → ${s.Y}${s.direct ? `, ${s.X} → ${s.Y}` : ' (직접경로 없음)'}\n` : `· ${s.X} → ${s.Y}\n`}· 내생변수(${s.med ? s.M + ', ' : ''}${s.Y})에 잔차항 추가
${s.ecov ? '· e1 ↔ e2 양방향 화살표 (q1, q2 오차공분산)\n' : ''}${s.defined ? '· Analysis Properties > Output ☑ Indirect, direct & total effects\n  + Bootstrap 탭에서 간접효과 신뢰구간\n' : ''}· Notes for Model 에서 distinct sample moments = ${s.moments}, parameters = ${s.t}, df = ${s.df} 확인`;
      },
    },
    init(ctx) {
      ctx.state.dg = ctx.diagram({ width: 640, height: 400 });
      ctx.state.code = ctx.box(''); ctx.state.code.style.minWidth = '0';
      ctx.state.out = ctx.box(''); ctx.state.out.style.minWidth = '0';
      ctx.state.seed = 2026;
    },
    update(ctx, v, changed) {
      const st = ctx.state;
      if (changed === 'reseed') st.seed++;
      const s = spec(v), sm = summary(s, st.seed);

      // ---- diagram ----
      const dg = st.dg.clear(), lat = s.meas ? 'lat' : 'obs';
      const std = (x) => S.f(x, 2);
      dg.node('X', { x: 120, y: 190, type: lat, label: s.X });
      dg.node('Y', { x: 520, y: 190, type: lat, label: s.Y });
      dg.node('dY', { x: 615, y: 120, type: 'err', label: 'd1' }); dg.path('dY', 'Y', { label: null, width: 1.1 });
      if (s.meas) {
        ['q1', 'q2', 'q3'].forEach((nm, i) => { const x = 50 + i * 70; dg.node(nm, { x, y: 300, label: nm, w: 56, h: 32 }); dg.node('e' + nm, { x, y: 358, type: 'err', label: 'e' + (i + 1) }); dg.path('X', nm, { label: std(sm.stdL[nm]), width: 1.4, labelPos: 0.62 }); dg.path('e' + nm, nm, { width: 1 }); });
        ['i1', 'i2', 'i3'].forEach((nm, i) => { const x = 450 + i * 70; dg.node(nm, { x, y: 300, label: nm, w: 56, h: 32 }); dg.node('e' + nm, { x, y: 358, type: 'err', label: 'e' + (i + 4) }); dg.path('Y', nm, { label: std(sm.stdL[nm]), width: 1.4, labelPos: 0.62 }); dg.path('e' + nm, nm, { width: 1 }); });
        if (s.ecov) dg.path('eq1', 'eq2', { kind: 'cov', bend: 20, color: 'var(--marker)', label: '~~', width: 1.4 });
      }
      if (s.med) {
        dg.node('M', { x: 320, y: 62, label: s.M });
        dg.node('dM', { x: 420, y: 30, type: 'err', label: 'd2' }); dg.path('dM', 'M', { width: 1.1 });
        dg.path('X', 'M', { value: sm.est.a, label: 'a = ' + std(sm.est.a) });
        dg.path('M', 'Y', { value: sm.est.b, label: 'b = ' + std(sm.est.b) });
        if (s.direct) dg.path('X', 'Y', { value: sm.est.c, label: 'c = ' + std(sm.est.c) });
      } else dg.path('X', 'Y', { value: sm.est.c, label: std(sm.est.c) });
      dg.note(320, s.meas ? 393 : 300, `관측변수 ${s.obs}개 · 정보 ${s.moments} − 자유모수 ${s.t} = df ${s.df}`);

      // ---- syntax + summary ----
      st.code.innerHTML = `<div class="plot-title">model 문자열</div>` + Lab.console(`model <- '\n${syntax(s)}\n'`);
      st.out.innerHTML = `<div class="plot-title">summary(fit${s.std ? ', standardized = TRUE' : ''}) <span class="muted">· 시뮬레이션 출력 예시 (N = ${N})</span></div>` + Lab.console(sm.text);

      const pv = s.df > 0 ? 1 - S.pchisq(sm.chi, s.df) : null;
      ctx.readout([
        { label: '관측변수 p', value: s.obs, sub: `정보 ${s.moments}개` },
        { label: '자유모수 t', value: s.t, sub: 'npar' },
        { label: '자유도 df', value: s.df, tone: s.df > 0 ? 'good' : 'warn', sub: s.df === 0 ? '정확식별' : '과대식별' },
        { label: 'χ² 검정', value: pv == null ? '검정 불가' : `p = ${S.apa(pv)}`, sub: pv == null ? 'df = 0' : `χ² = ${S.f(sm.chi, 1)}`, tone: pv == null ? null : pv > 0.05 ? 'good' : 'bad' },
      ]);
      const notes = [];
      if (!s.med && v.defined) notes.push('매개변수가 없으면 a, b 라벨이 없으므로 := 로 간접효과를 정의할 수 없어 문법에서 빠졌습니다');
      if (!s.med && !v.direct) notes.push('매개변수가 없을 때는 Quality → Intent 회귀를 항상 포함했습니다');
      if (!s.meas && v.ecov) notes.push('오차공분산 q1 ~~ q2는 측정모형이 있을 때만 쓸 수 있습니다');
      let msg = s.df === 0 ? `모형이 정확식별(df = 0)이라 자료를 완벽히 재현합니다. 계수는 해석할 수 있지만 모형 적합도는 검정할 수 없습니다.`
        : s.med && !s.direct ? `직접경로를 0으로 고정한 완전매개 모형입니다. df가 ${s.df}로 늘었지만 참모형에는 직접효과가 있어 χ² = ${S.f(sm.chi, 1)}로 커졌고, 빠진 경로의 몫을 b가 일부 흡수했습니다.`
          : `자유모수 ${s.t}개로 정보 ${s.moments}개를 설명하는 과대식별 모형(df = ${s.df})입니다.${s.defined ? ' := 로 정의한 indirect가 Defined Parameters 블록에 나타납니다.' : ''}`;
      if (notes.length) msg += ' ' + notes.join('. ') + '.';
      ctx.insight(msg);
    },
  });
})();
