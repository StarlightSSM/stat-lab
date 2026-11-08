/* R · ggplot2 레이어 문법 */
(function () {
  const MAJORS = ['MIS', 'Psych', 'Stats'];
  const DATA = (() => {
    S.seed(77); const rows = [], a = { MIS: 52, Psych: 58, Stats: 48 }, b = { MIS: 3.2, Psych: 1.6, Stats: 4.3 };
    for (let i = 0; i < 72; i++) { const major = MAJORS[i % 3], hours = +(S.runif(0.5, 10)).toFixed(1); rows.push({ hours, major, score: +(S.clamp(a[major] + b[major] * hours + S.randn(0, 6), 30, 100)).toFixed(0) }); }
    return rows;
  })();
  const COL = { MIS: Lab.C.s1, Psych: Lab.C.s2, Stats: Lab.C.s3 };
  function fitLine(rows) {
    const x = rows.map((r) => r.hours), y = rows.map((r) => r.score), m = S.ols(x.map((v) => [v]), y);
    const mx = S.mean(x), sxx = S.sum(x.map((v) => (v - mx) ** 2)), q = S.qt(0.975, m.df2);
    return { m, band: (xv) => q * m.sigma * Math.sqrt(1 / x.length + (xv - mx) ** 2 / sxx), xr: [S.min(x), S.max(x)] };
  }

  Lab.add({
    id: 'r-ggplot', subject: 'r', order: 3,
    title: 'ggplot2 레이어 문법', en: 'Grammar of graphics · aes, geom, facet, theme',
    summary: 'ggplot()은 빈 도화지에서 시작해 + 로 레이어를 쌓습니다. 레이어를 하나씩 켜고 끄며 그림과 코드가 같이 바뀌는 것을 봅니다.',
    keywords: 'ggplot2 ggplot geom_point geom_smooth facet_wrap aes theme 시각화',
    controls: [
      { type: 'toggle', key: 'point', label: '+ geom_point()', value: true },
      { type: 'toggle', key: 'color', label: 'aes(color = major)', value: false },
      { type: 'toggle', key: 'smooth', label: '+ geom_smooth(method = "lm")', value: true },
      { type: 'toggle', key: 'se', label: '   se = TRUE (신뢰띠)', value: true },
      { type: 'toggle', key: 'facet', label: '+ facet_wrap(~ major)', value: false },
      { type: 'select', key: 'theme', label: '+ theme_*()', options: [['gray', 'theme_gray'], ['minimal', 'theme_minimal'], ['classic', 'theme_classic']], value: 'gray' },
      { type: 'toggle', key: 'labs', label: '+ labs(제목·축 이름)', value: true },
    ],
    concept: `
      <p>ggplot2는 Wilkinson의 <b>그래픽 문법(Grammar of Graphics)</b>을 구현합니다. 그림 하나를 다음 부품으로 쪼개서 생각합니다.</p>
      <ul>
        <li><b>data</b> + <b>aes()</b> : 어떤 변수를 x, y, 색, 크기에 대응(mapping)시킬지 정합니다. <code>aes(color = major)</code>처럼 변수를 넣으면 범례가 자동으로 생깁니다.</li>
        <li><b>geom_*()</b> : 점, 선, 막대 같은 기하 도형 레이어입니다. <code>+</code>로 여러 개를 쌓을 수 있고, 아래에 쓴 레이어가 위에 그려집니다.</li>
        <li><b>stat</b> : <code>geom_smooth(method = "lm")</code>는 데이터를 그대로 그리지 않고 회귀선을 <em>계산해서</em> 그립니다. color로 집단을 나누면 집단마다 따로 적합합니다.</li>
        <li><b>facet_wrap()</b> : 같은 그림을 집단별 작은 패널로 나눕니다(small multiples). <b>theme_*()</b>는 데이터와 무관한 배경·격자·글꼴을 바꿉니다.</li>
      </ul>
      <p>집단을 색으로 나누었을 때와 나누지 않았을 때 회귀선이 얼마나 다른지 보세요. 전체 회귀선 하나는 집단마다 다른 기울기를 숨길 수 있습니다.</p>`,
    formula: `ggplot(data = df, aes(x = hours, y = score)) +<br>&nbsp;&nbsp;geom_point() +<br>&nbsp;&nbsp;geom_smooth(method = "lm", se = TRUE) +<br>&nbsp;&nbsp;facet_wrap(~ major) +<br>&nbsp;&nbsp;theme_minimal()`,
    tasks: [
      'geom_point와 geom_smooth를 모두 끄면 무엇이 남나요? 레이어가 없으면 축만 있는 빈 좌표계입니다.',
      'aes(color = major)를 켜면 회귀선이 1개에서 3개로 바뀝니다. 어느 전공의 기울기가 가장 가파른가요?',
      'facet_wrap을 켜고 color는 끈 상태와 켠 상태를 비교해 보세요. 패널을 나누면 색은 꼭 필요할까요?',
      'theme만 바꿔 보세요. 데이터 레이어는 그대로이고 배경과 격자만 달라집니다.',
    ],
    tools: { r: (p) => code(p) },
    init(ctx) { ctx.state.leg = ctx.box('plot-legend'); ctx.state.host = ctx.box('stage-row'); ctx.state.code = ctx.box(''); ctx.state.code.style.minWidth = '0'; },
    update(ctx, v) {
      const host = ctx.state.host; host.innerHTML = '';
      const panels = v.facet ? MAJORS.map((m) => ({ title: m, rows: DATA.filter((r) => r.major === m) })) : [{ title: null, rows: DATA }];
      host.style.gridTemplateColumns = v.facet ? 'repeat(auto-fit, minmax(200px, 1fr))' : '1fr';
      const C = Lab.C, slopes = [];
      const slots = panels.map(() => { const d = document.createElement('div'); d.style.minWidth = '0'; host.appendChild(d); return d; });
      panels.forEach((pn, pi) => {
        const p = ctx.plot({ x: [0, 10.5], y: [30, 100], height: v.facet ? 250 : 300, xLabel: v.labs ? '주당 공부 시간' : 'hours', yLabel: (!v.facet || pi === 0) ? (v.labs ? '시험 점수' : 'score') : null, title: pn.title ? `<span style="font-family:var(--f-mono)">major: ${pn.title}</span>` : (v.labs ? '공부 시간과 시험 점수' : null) }, slots[pi]);
        if (v.theme === 'gray') { p.rect(0, 10.5, 30, 100, { color: 'var(--line)', opacity: 0.45 }); p.gridG.selectAll('line').style('stroke', 'var(--paper)').style('opacity', 1); }
        if (v.theme === 'classic') p.gridG.style('display', 'none');
        if (v.theme === 'minimal' || v.theme === 'gray') p.axG.selectAll('.domain').style('display', 'none');
        const groups = v.color ? MAJORS.map((m) => ({ m, rows: pn.rows.filter((r) => r.major === m) })).filter((g) => g.rows.length) : [{ m: null, rows: pn.rows }];
        if (v.smooth) groups.forEach((g) => {
          const f = fitLine(g.rows), col = g.m ? COL[g.m] : C.s7, xs = S.linspace(f.xr[0], f.xr[1], 40);
          if (v.se) p.under.append('path').attr('d', d3.area().x((x) => p.x(x)).y0((x) => p.y(f.m.b[0] + f.m.b[1] * x - f.band(x))).y1((x) => p.y(f.m.b[0] + f.m.b[1] * x + f.band(x)))(xs)).style('fill', g.m ? col : C.muted).style('opacity', 0.18);
          p.line(xs.map((x) => [x, f.m.b[0] + f.m.b[1] * x]), { color: col, width: 2 });
          slopes.push({ m: g.m || pn.title || '전체', b: f.m.b[1] });
        });
        if (v.point) p.dots(pn.rows.map((r) => ({ x: r.hours, y: r.score, color: v.color ? COL[r.major] : C.ink, d: r })), { r: 3.5, opacity: 0.75, tip: (d) => `${d.d.major} · ${d.d.hours}시간 · ${d.d.score}점` });
        if (!v.point && !v.smooth) p.text(5.25, 65, '레이어 없음: 빈 좌표계', { color: C.muted, size: 13 });
        
      });
      ctx.state.code.innerHTML = Lab.console(code(v));
      ctx.state.leg.hidden = !v.color; ctx.state.leg.innerHTML = v.color ? '<span class="lg-item" style="color:var(--ink-3)">major</span>' + MAJORS.map((m) => `<span class="lg-item"><i class="lg-key lg-dot" style="--k:${COL[m]}"></i>${m}</span>`).join('') : '';
      const nLayers = [v.point, v.smooth].filter(Boolean).length;
      ctx.readout([
        { label: '데이터 레이어 수', value: nLayers },
        { label: '패널 수', value: panels.length },
        { label: '회귀선 수', value: slopes.length, tone: 'accent' },
        { label: '기울기 범위', value: slopes.length ? `${S.f(Math.min(...slopes.map((s) => s.b)), 1)} ~ ${S.f(Math.max(...slopes.map((s) => s.b)), 1)}` : '—', sub: '시간당 점수 증가' },
      ]);
      let msg;
      if (!nLayers) msg = 'ggplot(df, aes(...))만으로는 축과 좌표계만 생깁니다. 그림은 geom 레이어를 + 로 더해야 나타납니다.';
      else if (v.smooth && slopes.length > 1) { const s = slopes.slice().sort((a, b) => b.b - a.b); msg = `집단마다 따로 적합하니 기울기가 ${s.map((x) => `${x.m} ${S.f(x.b, 1)}`).join(', ')}로 다릅니다. 전체 회귀선 하나로는 이 차이가 보이지 않습니다.`; }
      else if (v.smooth) msg = `전체 데이터에 회귀선 하나를 적합했습니다(공부 1시간당 ${S.f(slopes[0].b, 1)}점). aes(color = major)를 켜면 전공별 기울기 차이를 볼 수 있습니다.`;
      else msg = `점 레이어만 있습니다. ${v.color ? '색으로 전공을 구분했습니다.' : '전공 정보는 아직 그림에 쓰이지 않았습니다.'}`;
      ctx.insight(msg);
    },
  });
  function code(v) {
    const lines = [`ggplot(df, aes(x = hours, y = score${v.color ? ', color = major' : ''}))`];
    if (v.point) lines.push('geom_point()');
    if (v.smooth) lines.push(`geom_smooth(method = "lm"${v.se ? '' : ', se = FALSE'})`);
    if (v.facet) lines.push('facet_wrap(~ major)');
    if (v.theme !== 'gray') lines.push(`theme_${v.theme}()`);
    if (v.labs) lines.push('labs(title = "공부 시간과 시험 점수",\n       x = "주당 공부 시간", y = "시험 점수")');
    return 'library(ggplot2)\n\n' + lines.join(' +\n  ');
  }
})();
