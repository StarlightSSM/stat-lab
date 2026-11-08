/* R · dplyr 파이프라인 */
(function () {
  const STYLE_ID = 'rd-style';
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const st = document.createElement('style'); st.id = STYLE_ID;
    st.textContent = `
      .rd-flow{display:flex;flex-wrap:wrap;align-items:stretch;gap:6px;background:var(--paper);border:1px solid var(--line);border-radius:var(--r);padding:12px}
      .rd-step{display:grid;gap:2px;padding:7px 11px;border:1px solid var(--line);border-radius:8px;background:var(--paper-2);min-width:92px}
      .rd-step b{font-family:var(--f-mono);font-size:12.5px;color:var(--ink)}
      .rd-step span{font-size:12px;color:var(--ink-3)}
      .rd-step.on{border-color:var(--c-r);background:color-mix(in srgb,var(--c-r) 12%,var(--paper))}
      .rd-step.on span{color:var(--ink-2)}
      .rd-step.skip{opacity:.45;border-style:dashed}
      .rd-pipe{align-self:center;font-family:var(--f-mono);color:var(--ink-3);font-size:13px}
      .rd-src{background:var(--paper);border:1px solid var(--line);border-radius:var(--r);padding:8px 10px;min-width:0}
      .rd-src .plot-title{padding:0 0 4px}
      .rd-src .data-tbl td:nth-child(2),.rd-src .data-tbl td:nth-child(3){text-align:left}`;
    document.head.appendChild(st);
  }
  // fixed demo data: 20 students
  const DATA = (() => {
    S.seed(2026); const depts = ['MIS', 'Psych', 'Stats'], rows = [];
    for (let i = 0; i < 20; i++) { const dept = depts[i % 3], gender = S.rand() < 0.5 ? 'F' : 'M', year = S.rint(1, 4);
      const score = Math.round(S.clamp(68 + (dept === 'Stats' ? 6 : dept === 'Psych' ? 2 : 0) + year * 2 + S.randn(0, 8), 45, 99));
      rows.push({ id: i + 1, dept, gender, year, score }); }
    return rows;
  })();
  const TYPES = { id: 'int', dept: 'chr', gender: 'chr', year: 'int', score: 'dbl', grade: 'chr', n: 'int', mean_score: 'dbl' };
  const pfmt = (v, t) => (t === 'chr' ? v : t === 'dbl' ? (Number.isInteger(v) ? String(v) : String(+v.toPrecision(3))) : String(v));
  function tibble(rows, cols, groups) {
    const n = rows.length, rw = String(n).length;
    const cs = cols.map((c) => { const t = TYPES[c] || 'dbl', vals = rows.map((r) => pfmt(r[c], t)), ty = `<${t}>`; return { c, t, vals, ty, w: Math.max(c.length, ty.length, ...vals.map((s) => s.length)) }; });
    const al = (s, c) => (c.t === 'chr' ? s.padEnd(c.w) : s.padStart(c.w));
    const lines = [`# A tibble: ${n} × ${cols.length}`];
    if (groups && groups.vars.length) lines.push(`# Groups:   ${groups.vars.join(', ')} [${groups.k}]`);
    lines.push(' '.repeat(rw) + ' ' + cs.map((c) => al(c.c, c)).join(' ').replace(/\s+$/, ''));
    lines.push(' '.repeat(rw) + ' ' + cs.map((c) => al(c.ty, c)).join(' ').replace(/\s+$/, ''));
    rows.forEach((r, i) => lines.push(String(i + 1).padStart(rw) + ' ' + cs.map((c) => al(c.vals[i], c)).join(' ').replace(/\s+$/, '')));
    return lines.join('\n');
  }

  Lab.add({
    id: 'r-dplyr', subject: 'r', order: 2,
    title: 'dplyr 파이프라인', en: 'filter · mutate · group_by · summarise · arrange',
    summary: '학생 20명 데이터에 dplyr 동사를 하나씩 켜고 끄며, 파이프(|>)를 지날 때마다 행과 열이 어떻게 바뀌는지 따라갑니다.',
    keywords: 'dplyr tidyverse pipe 파이프 filter group_by summarise mutate arrange tibble',
    controls: [
      { type: 'toggle', key: 'f', label: 'filter(year >= k)', value: true },
      { type: 'slider', key: 'k', label: '학년 기준 k', min: 1, max: 4, step: 1, value: 2 },
      { type: 'toggle', key: 'mut', label: 'mutate(grade = …)', value: false },
      { type: 'select', key: 'grp', label: 'group_by()', options: [['none', '없음'], ['dept', 'dept'], ['gender', 'gender'], ['dept,gender', 'dept, gender']], value: 'dept' },
      { type: 'toggle', key: 'sum', label: 'summarise(n, mean_score)', value: true },
      { type: 'select', key: 'arr', label: 'arrange()', options: [['none', '없음'], ['desc', 'desc(점수)'], ['asc', '점수 오름차순']], value: 'desc' },
    ],
    concept: `
      <p><b>dplyr</b>는 데이터프레임을 다루는 동사(verb) 다섯 개로 대부분의 전처리를 해결합니다. 파이프 <code>|&gt;</code>(또는 <code>%&gt;%</code>)는 "왼쪽 결과를 오른쪽 함수의 첫 인자로 넘긴다"는 뜻이라, 코드를 위에서 아래로 작업 순서대로 읽을 수 있습니다.</p>
      <table><thead><tr><th>동사</th><th>하는 일</th><th>SPSS로 치면</th></tr></thead><tbody>
        <tr><td><code>filter()</code></td><td>조건에 맞는 <b>행</b>만 남김</td><td>데이터 &gt; 케이스 선택</td></tr>
        <tr><td><code>mutate()</code></td><td>새 <b>열</b>을 계산해 추가</td><td>변환 &gt; 변수 계산</td></tr>
        <tr><td><code>group_by()</code></td><td>집단 표시만 붙임 (행 수는 그대로)</td><td>데이터 &gt; 파일 분할</td></tr>
        <tr><td><code>summarise()</code></td><td>집단마다 한 행으로 요약</td><td>데이터 &gt; 데이터 통합</td></tr>
        <tr><td><code>arrange()</code></td><td>행 정렬</td><td>데이터 &gt; 케이스 정렬</td></tr>
      </tbody></table>
      <p><em>group_by만으로는 아무것도 계산되지 않습니다.</em> 뒤에 summarise가 와야 집단별 요약이 나옵니다. 집단 변수가 두 개면 summarise 뒤에도 첫 번째 변수로 묶인 상태가 남아서 R이 안내 메시지를 출력합니다.</p>`,
    formula: `df |&gt;<br>&nbsp;&nbsp;filter(year &gt;= 2) |&gt;<br>&nbsp;&nbsp;group_by(dept) |&gt;<br>&nbsp;&nbsp;summarise(n = n(), mean_score = mean(score)) |&gt;<br>&nbsp;&nbsp;arrange(desc(mean_score))`,
    tasks: [
      'summarise를 끄고 group_by(dept)만 남겨 보세요. 행 수는 그대로이고 "# Groups:" 줄만 생깁니다.',
      'group_by를 "dept, gender"로 바꾸면 결과가 몇 행이 되나요? 콘솔에 나오는 summarise() 안내 메시지도 읽어 보세요.',
      'k를 4로 올리면 filter 뒤에 몇 명이 남나요? 어떤 학과는 결과에서 사라질 수도 있습니다.',
      'mutate를 켜고 summarise를 끄세요. grade 열이 맨 오른쪽에 추가됩니다.',
    ],
    tools: { r: (p, ctx) => `library(dplyr)\n\n# df: id, dept, gender, year, score (20명)\n${ctx.state.code || ''}` },
    init(ctx) {
      ensureStyle();
      ctx.state.flow = ctx.box('rd-flow');
      const row = ctx.row();
      ctx.state.src = ctx.box('rd-src', row);
      const right = ctx.box('stage', row); right.style.minWidth = '0';
      ctx.state.con = ctx.box('', right); ctx.state.con.style.minWidth = '0';
      ctx.state.plot = ctx.plot({ xBand: ['MIS'], y: [0, 100], height: 200, yLabel: 'mean_score', title: '요약 결과' }, right);
    },
    update(ctx, v) {
      let rows = DATA.map((r) => Object.assign({}, r)), cols = ['id', 'dept', 'gender', 'year', 'score'];
      const steps = [], code = ['df |>']; const n0 = rows.length;
      steps.push({ b: 'df', s: `${n0}행 × 5열`, on: true });
      if (v.f) { rows = rows.filter((r) => r.year >= v.k); code.push(`  filter(year >= ${v.k}) |>`); }
      steps.push({ b: 'filter()', s: v.f ? `${rows.length}행 남음` : '건너뜀', on: v.f, skip: !v.f });
      if (v.mut) { rows.forEach((r) => { r.grade = r.score >= 80 ? 'A' : 'B'; }); cols.push('grade'); code.push('  mutate(grade = if_else(score >= 80, "A", "B")) |>'); }
      steps.push({ b: 'mutate()', s: v.mut ? '+ grade 열' : '건너뜀', on: v.mut, skip: !v.mut });
      const gv = v.grp === 'none' ? [] : v.grp.split(',');
      const key = (r) => gv.map((g) => r[g]).join('|');
      const gk = [...new Set(rows.map(key))];
      if (gv.length) code.push(`  group_by(${gv.join(', ')}) |>`);
      steps.push({ b: 'group_by()', s: gv.length ? `${gk.length}개 집단 표시` : '건너뜀', on: !!gv.length, skip: !gv.length });
      let groups = gv.length ? { vars: gv, k: gk.length } : null, message = '';
      if (v.sum) {
        const out = (gv.length ? gk : ['']).map((kk) => { const g = gv.length ? rows.filter((r) => key(r) === kk) : rows; const o = {}; gv.forEach((name) => { o[name] = g[0] ? g[0][name] : ''; }); o.n = g.length; o.mean_score = g.length ? S.mean(g.map((r) => r.score)) : NaN; return o; });
        out.sort((a, b) => gv.map((g) => String(a[g]).localeCompare(String(b[g]))).find((x) => x) || 0);
        rows = out; cols = [...gv, 'n', 'mean_score']; code.push('  summarise(n = n(), mean_score = mean(score)) |>');
        if (gv.length > 1) { message = `\`summarise()\` has grouped output by '${gv[0]}'. You can override using the\n\`.groups\` argument.`; groups = { vars: [gv[0]], k: new Set(rows.map((r) => r[gv[0]])).size }; }
        else groups = null;
      }
      steps.push({ b: 'summarise()', s: v.sum ? `${rows.length}행으로 요약` : '건너뜀', on: v.sum, skip: !v.sum });
      const sk = v.sum ? 'mean_score' : 'score';
      if (v.arr !== 'none') { rows.sort((a, b) => (v.arr === 'desc' ? b[sk] - a[sk] : a[sk] - b[sk])); code.push(`  arrange(${v.arr === 'desc' ? `desc(${sk})` : sk}) |>`); }
      steps.push({ b: 'arrange()', s: v.arr === 'none' ? '건너뜀' : v.arr === 'desc' ? `${sk} 내림차순` : `${sk} 오름차순`, on: v.arr !== 'none', skip: v.arr === 'none' });
      code[code.length - 1] = code[code.length - 1].replace(/ \|>$/, '');
      if (code.length === 1) code[0] = 'df';
      const codeStr = 'result <- ' + code.join('\n'); ctx.state.code = codeStr + '\nresult';

      ctx.state.flow.innerHTML = steps.map((s, i) => `${i ? '<span class="rd-pipe">|&gt;</span>' : ''}<div class="rd-step ${s.on ? 'on' : ''} ${s.skip ? 'skip' : ''}"><b>${s.b}</b><span>${s.s}</span></div>`).join('');
      const pass = (r) => !v.f || r.year >= v.k;
      ctx.state.src.innerHTML = `<div class="plot-title">원자료 df (filter를 통과한 행 강조)</div>` + Lab.dataTable({ head: ['id', 'dept', 'gender', 'year', 'score'], rows: DATA.map((r) => [r.id, r.dept, r.gender, r.year, r.score]), highlight: (i) => v.f && pass(DATA[i]) });
      ctx.state.con.innerHTML = Lab.console(`> ${codeStr.replace(/\n/g, '\n+ ')}\n${message ? message + '\n' : ''}> result\n${tibble(rows, cols, groups)}`);

      const p = ctx.state.plot;
      if (v.sum && gv.length) {
        p.wrap.hidden = false; const lab = (r) => gv.map((g) => r[g]).join(' · ');
        p.setX(rows.map(lab)); p.setY([0, 100]); p.clear();
        p.bars(rows.map((r) => ({ x: lab(r), y: r.mean_score, n: r.n, color: Lab.C.s7 })), { maxW: 36, labels: (d) => S.f(d.y, 1), tip: (d) => `<b>${d.x}</b><br>n = ${d.n}<br>mean_score = ${S.f(d.y, 2)}` });
      } else p.wrap.hidden = true;

      ctx.readout([
        { label: '원자료 행', value: n0 },
        { label: '결과 행 수', value: rows.length, tone: 'accent' },
        { label: '결과 열 수', value: cols.length },
        { label: '집단 수', value: gv.length ? gk.length : '—' },
      ]);
      let msg;
      if (gv.length && !v.sum) msg = `group_by(${gv.join(', ')})는 ${gk.length}개 집단 표시만 붙였을 뿐, 행은 ${rows.length}개 그대로입니다. 출력 맨 위 "# Groups:" 줄로만 티가 납니다.`;
      else if (v.sum && gv.length > 1) msg = `두 변수로 묶으면 ${rows.length}개 조합이 각각 한 행이 됩니다. 결과에는 여전히 ${gv[0]} 묶음이 남아 있어서, 이어서 계산하기 전에 <code>ungroup()</code>이나 <code>.groups = "drop"</code>을 쓰는 습관이 좋습니다.`;
      else if (v.sum && gv.length) { const top = rows.slice().sort((a, b) => b.mean_score - a.mean_score)[0]; msg = `${v.f ? `${v.k}학년 이상 학생만 남긴 뒤 ` : ''}${gv[0]}별로 요약하니 <b>${top[gv[0]]}</b>의 평균 점수(${S.f(top.mean_score, 1)})가 가장 높습니다.`; }
      else if (v.sum) msg = `group_by 없이 summarise하면 전체가 한 행으로 요약됩니다: n = ${rows[0].n}, 평균 ${S.f(rows[0].mean_score, 1)}.`;
      else msg = `${v.f ? `filter로 ${rows.length}명을 남겼습니다.` : '원자료 그대로입니다.'} summarise를 켜면 집단별 한 행으로 줄어듭니다.`;
      ctx.insight(msg);
    },
  });
})();
