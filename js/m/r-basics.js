/* R · 기초: 벡터와 데이터프레임 */
(function () {
  const STYLE_ID = 'rb-style';
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const st = document.createElement('style'); st.id = STYLE_ID;
    st.textContent = `
      .rb-vis{background:var(--paper);border:1px solid var(--line);border-radius:var(--r);padding:12px 14px;display:grid;gap:10px;min-width:0}
      .rb-row{display:grid;grid-template-columns:64px minmax(0,1fr);gap:10px;align-items:center}
      .rb-lab{font-family:var(--f-mono);font-size:12.5px;color:var(--ink-2);text-align:right;line-height:1.3}
      .rb-cells{display:flex;flex-wrap:wrap;gap:4px}
      .rb-cell{display:grid;justify-items:center;min-width:40px;padding:3px 6px 5px;border:1px solid var(--line);border-radius:6px;background:var(--paper-2);font-family:var(--f-mono)}
      .rb-cell small{font-size:10px;color:var(--ink-3)}
      .rb-cell b{font-size:14px;font-weight:600;color:var(--ink)}
      .rb-cell.on{border-color:var(--c-r);background:color-mix(in srgb,var(--c-r) 16%,var(--paper))}
      .rb-cell.off b{color:var(--ink-3)}
      .rb-cell.rec{border-style:dashed}
      .rb-arrow{font-family:var(--f-mono);font-size:12px;color:var(--ink-3);padding-left:74px}
      .rb-warn{color:var(--bad)}`;
    document.head.appendChild(st);
  }
  /* R-style print of an atomic vector */
  function rvec(vals, type = 'num', width = 60) {
    if (!vals.length) return type === 'num' ? 'numeric(0)' : type === 'lgl' ? 'logical(0)' : 'character(0)';
    let s;
    if (type === 'lgl') s = vals.map((v) => (v ? 'TRUE' : 'FALSE'));
    else if (type === 'chr') s = vals.map((v) => `"${v}"`);
    else { const dec = vals.every(Number.isInteger) ? 0 : Math.min(4, Math.max(...vals.map((v) => { const t = String(+v.toFixed(4)); return t.includes('.') ? t.split('.')[1].length : 0; }))); s = vals.map((v) => v.toFixed(dec)); }
    const w = Math.max(...s.map((x) => x.length)), lw = String(vals.length).length + 2;
    const per = Math.max(1, Math.floor((width - lw) / (w + 1)));
    const lines = [];
    for (let i = 0; i < s.length; i += per) {
      const lab = `[${i + 1}]`.padStart(lw), chunk = s.slice(i, i + per).map((x) => (type === 'chr' ? x.padEnd(w) : x.padStart(w)));
      lines.push(lab + ' ' + chunk.join(' ').replace(/\s+$/, ''));
    }
    return lines.join('\n');
  }
  function rdf(cols, rowNames) { // cols: [{name, vals, type}]
    const rn = rowNames.map(String), rw = Math.max(...rn.map((r) => r.length));
    const fmt = cols.map((c) => { const s = c.vals.map((v) => (c.type === 'lgl' ? (v ? 'TRUE' : 'FALSE') : String(v))); const w = Math.max(c.name.length, ...s.map((x) => x.length)); return { s, w, name: c.name }; });
    const head = ' '.repeat(rw) + ' ' + fmt.map((f) => f.name.padStart(f.w)).join(' ');
    const body = rn.map((r, i) => r.padEnd(rw) + ' ' + fmt.map((f) => f.s[i].padStart(f.w)).join(' '));
    return [head, ...body].join('\n');
  }
  const cells = (vals, opt = {}) => `<div class="rb-cells">${vals.map((v, i) => `<div class="rb-cell ${opt.on && opt.on(i) ? 'on' : opt.off && opt.off(i) ? 'off' : ''} ${opt.rec && opt.rec(i) ? 'rec' : ''}"><small>[${i + 1}]</small><b>${v === true ? 'TRUE' : v === false ? 'FALSE' : v}</b></div>`).join('')}</div>`;
  const row = (lab, html) => `<div class="rb-row"><div class="rb-lab">${lab}</div>${html}</div>`;

  const OPS = [['c', 'c() 만들기'], ['seq', 'seq() · : 수열'], ['rep', 'rep() 반복'], ['index', 'x[i] 인덱싱'], ['filter', 'x[x > k] 조건 추출'], ['recycle', '재사용 규칙 (recycling)'], ['df', 'data.frame']];

  Lab.add({
    id: 'r-basics', subject: 'r', order: 1,
    title: 'R 기초: 벡터와 데이터프레임', en: 'Vectors, indexing, recycling, data.frame',
    summary: 'R의 모든 데이터는 벡터에서 시작합니다. c(), seq(), 인덱싱, 조건 추출, 재사용 규칙을 칸 단위 그림과 콘솔 출력으로 확인합니다.',
    keywords: 'r vector 벡터 index 인덱싱 data.frame recycling seq rep',
    controls: [
      { type: 'select', key: 'op', label: '연산 고르기', options: OPS, value: 'index', dropdown: true },
      { type: 'slider', key: 'n', label: '벡터 길이 n', min: 3, max: 12, step: 1, value: 8 },
      { type: 'slider', key: 'i', label: '위치 i (인덱싱)', min: 1, max: 12, step: 1, value: 3 },
      { type: 'slider', key: 'k', label: '값 k (기준값 · 간격 · 반복 횟수)', min: 1, max: 15, step: 1, value: 10 },
      { type: 'button', key: 'resample', label: '새 값으로 x 만들기', primary: true },
    ],
    concept: `
      <p>R에는 "숫자 하나"라는 자료형이 없습니다. <code>5</code>도 길이 1인 벡터입니다. 그래서 대부분의 연산이 <b>원소별(벡터화)</b>로 한 번에 이루어지고, 반복문 없이 <code>x * 2</code>처럼 씁니다.</p>
      <ul>
        <li><b>인덱스는 1부터</b> 시작합니다(파이썬은 0). <code>x[-2]</code>처럼 음수는 "그 위치를 빼고"라는 뜻입니다.</li>
        <li><b>논리 인덱싱</b> : <code>x &gt; 10</code>은 TRUE/FALSE 벡터를 돌려주고, 이를 <code>x[ ]</code> 안에 넣으면 TRUE인 원소만 뽑힙니다. <code>sum(x &gt; 10)</code>은 TRUE를 1로 세어 개수를 줍니다.</li>
        <li><b>재사용 규칙(recycling)</b> : 길이가 다른 두 벡터를 연산하면 짧은 쪽을 반복해서 길이를 맞춥니다. 길이가 배수가 아니면 경고가 나오지만 계산은 그대로 진행되므로 조용한 실수의 원인이 됩니다.</li>
        <li><b>data.frame</b>은 길이가 같은 벡터들을 열로 묶은 표입니다. <code>df[행, 열]</code>로 고르고, <code>df$열이름</code>으로 한 열(벡터)을 꺼냅니다.</li>
      </ul>`,
    formula: `x[i] &nbsp; x[c(1, 3)] &nbsp; x[-i] &nbsp; x[x &gt; k]<br>seq(from, to, by) &nbsp; seq(2, by = k, length.out = n) &nbsp; 1:n<br>rep(v, times = k) &nbsp; rep(v, each = k)<br>df[df$score &gt; k, ] <span class="c">행 조건, 열은 전부</span>`,
    tasks: [
      "'x[i] 인덱싱'에서 i를 n보다 크게 옮겨 보세요. R은 오류 대신 NA를 돌려줍니다.",
      "'조건 추출'에서 k를 바꾸며 x > k의 TRUE 개수와 sum(x > k)가 같은지 확인하세요.",
      "'재사용 규칙'에서 n을 7(홀수)로 두면 경고 메시지가 나옵니다. n을 8로 바꾸면 사라지나요?",
      "'data.frame'에서 df[df$score > k, ]의 행 이름(왼쪽 숫자)이 1부터 다시 매겨지지 않는 것을 확인하세요.",
    ],
    tools: {
      r: (p, ctx) => (ctx.state.code || '') + '\n\n# 이 코드를 RStudio 콘솔에 붙여 넣어 같은 결과를 확인하세요.',
    },
    init(ctx) {
      ensureStyle();
      ctx.state.vis = ctx.box('rb-vis');
      ctx.state.con = ctx.box(''); ctx.state.con.style.minWidth = '0';
      ctx.state.seed = 9;
    },
    update(ctx, v, changed) {
      if (changed === 'resample') ctx.state.seed++;
      S.seed(ctx.state.seed);
      const all = Array.from({ length: 12 }, () => S.rint(1, 20)), n = v.n, x = all.slice(0, n), i = v.i, k = v.k;
      const xc = `x <- c(${x.join(', ')})`;
      let code = '', out = '', vis = row('x', cells(x)), hits = 0, msg = '';
      const R = (cmd, res) => { code += cmd + '\n'; out += '> ' + cmd + '\n' + (res ? res + '\n' : ''); };
      R(xc, '');
      switch (v.op) {
        case 'c': {
          R('x', rvec(x)); R('length(x)', rvec([n])); R('sum(x)', rvec([S.sum(x)])); R('mean(x)', rvec([+S.mean(x).toFixed(4)])); R('x * 2', rvec(x.map((a) => a * 2)));
          vis += `<div class="rb-arrow">↓ x * 2 (원소마다 한 번에)</div>` + row('x * 2', cells(x.map((a) => a * 2), { on: () => true }));
          hits = n; msg = `c()로 길이 ${n}인 벡터를 만들었습니다. x * 2는 반복문 없이 ${n}개 원소 모두에 적용됩니다(벡터화).`;
          break;
        }
        case 'seq': {
          const y = Array.from({ length: n }, (_, j) => 2 + j * k);
          R(`y <- seq(2, by = ${k}, length.out = ${n})`, ''); R('y', rvec(y)); R(`1:${n}`, rvec(Array.from({ length: n }, (_, j) => j + 1))); R(`seq(0, 1, by = 0.25)`, rvec([0, 0.25, 0.5, 0.75, 1]));
          vis = row('y', cells(y, { on: () => true })) + row(`1:${n}`, cells(Array.from({ length: n }, (_, j) => j + 1)));
          hits = n; msg = `seq(2, by = ${k})는 2에서 시작해 ${k}씩 커지는 수열입니다. 마지막 값은 2 + (${n}−1)×${k} = ${y[n - 1]}입니다.`;
          break;
        }
        case 'rep': {
          const t = Math.min(k, 6), a = Array.from({ length: 2 * t }, (_, j) => (j % 2 ? 'B' : 'A')), b = [1, 2, 3].flatMap((u) => Array(t).fill(u));
          R(`rep(c("A", "B"), times = ${t})`, rvec(a, 'chr')); R(`rep(1:3, each = ${t})`, rvec(b));
          vis = row('times', cells(a, { rec: (j) => j >= 2 })) + row('each', cells(b, { on: (j) => j % t === 0 }));
          hits = a.length; msg = `times = ${t}는 벡터 전체를 ${t}번 이어 붙이고, each = ${t}는 원소 하나하나를 ${t}번씩 반복합니다.${k > 6 ? ' (화면에서는 최대 6회로 줄였습니다.)' : ''}`;
          break;
        }
        case 'index': {
          const at = i <= n ? x[i - 1] : 'NA';
          R(`x[${i}]`, i <= n ? rvec([at]) : '[1] NA');
          { const w = Math.max(String(x[0]).length, String(at).length); R(`x[c(1, ${i})]`, `[1] ${String(x[0]).padStart(w)} ${String(at).padStart(w)}`); }
          const rest = x.filter((_, j) => j !== i - 1); R(`x[-${i}]`, rvec(i <= n ? rest : x));
          vis = row('x', cells(x, { on: (j) => j === i - 1 })) + `<div class="rb-arrow">↓ x[-${i}] : ${i}번째를 뺀 나머지</div>` + row(`x[-${i}]`, cells(i <= n ? rest : x));
          hits = i <= n ? 1 : 0;
          msg = i <= n ? `x[${i}]는 ${i}번째 원소 ${at}입니다. R의 인덱스는 1부터 셉니다.` : `<b>x[${i}]는 NA</b>입니다. 길이 ${n}인 벡터의 ${i}번째 원소는 없지만 R은 오류를 내지 않고 결측값을 돌려줍니다. 조용히 지나가기 쉬운 실수입니다.`;
          break;
        }
        case 'filter': {
          const lg = x.map((a) => a > k), sel = x.filter((a) => a > k);
          R(`x > ${k}`, rvec(lg, 'lgl')); R(`x[x > ${k}]`, rvec(sel)); R(`sum(x > ${k})`, rvec([sel.length])); R(`which(x > ${k})`, rvec(lg.map((b, j) => (b ? j + 1 : 0)).filter(Boolean)));
          vis = row('x', cells(x, { on: (j) => lg[j], off: (j) => !lg[j] })) + row(`x > ${k}`, cells(lg, { on: (j) => lg[j], off: (j) => !lg[j] })) + `<div class="rb-arrow">↓ TRUE 자리만 남김</div>` + row(`x[x>${k}]`, cells(sel, { on: () => true }));
          hits = sel.length; msg = `x > ${k}는 ${n}개의 TRUE/FALSE를 만들고, 그중 TRUE ${sel.length}개 자리의 값만 뽑혔습니다. sum()은 TRUE를 1로 세므로 개수와 같습니다.`;
          break;
        }
        case 'recycle': {
          const add = [0, 100], res = x.map((a, j) => a + add[j % 2]);
          let r = rvec(res); if (n % 2) r += `\nWarning message:\nIn x + c(0, 100) :\n  longer object length is not a multiple of shorter object length`;
          R('x + c(0, 100)', r); R('x + 1', rvec(x.map((a) => a + 1)));
          vis += row('c(0,100)', cells(Array.from({ length: n }, (_, j) => add[j % 2]), { rec: (j) => j >= 2 })) + `<div class="rb-arrow">↓ 짧은 벡터를 반복해 길이를 맞춘 뒤 더함 (점선 = 재사용된 칸)</div>` + row('결과', cells(res, { on: (j) => j % 2 === 1 }));
          hits = n; msg = n % 2 ? `길이 ${n}은 2의 배수가 아니라서 <span class="rb-warn">경고</span>가 나왔지만 계산은 끝까지 진행됐습니다. 마지막 원소에는 0만 더해졌습니다.` : `길이 ${n}이 2의 배수라 c(0, 100)이 ${n / 2}번 반복되어 경고 없이 계산됩니다. x + 1도 같은 원리(길이 1 벡터의 재사용)입니다.`;
          break;
        }
        case 'df': {
          const ids = x.map((_, j) => j + 1), pass = x.map((a) => a > k);
          R(`df <- data.frame(id = 1:${n}, score = x, pass = x > ${k})`, '');
          R('df', rdf([{ name: 'id', vals: ids }, { name: 'score', vals: x }, { name: 'pass', vals: pass, type: 'lgl' }], ids));
          const keep = ids.filter((_, j) => pass[j]);
          R(`df[df$score > ${k}, ]`, keep.length ? rdf([{ name: 'id', vals: keep }, { name: 'score', vals: keep.map((j) => x[j - 1]) }, { name: 'pass', vals: keep.map(() => true), type: 'lgl' }], keep) : '[1] id    score pass \n<0 rows> (or 0-length row.names)');
          R('nrow(df); mean(df$score)', rvec([n]) + '\n' + rvec([+S.mean(x).toFixed(4)]));
          vis = row('df$score', cells(x, { on: (j) => pass[j], off: (j) => !pass[j] })) + row('df$pass', cells(pass, { on: (j) => pass[j], off: (j) => !pass[j] }));
          hits = keep.length; msg = `data.frame은 길이 ${n}인 세 벡터를 열로 묶은 표입니다. df[조건, ]는 조건이 TRUE인 ${keep.length}개 행만 남기며, 행 이름은 원래 번호(${keep.slice(0, 4).join(', ')}${keep.length > 4 ? '…' : ''})를 유지합니다.`;
          break;
        }
      }
      ctx.state.vis.innerHTML = vis;
      ctx.state.con.innerHTML = Lab.console(out.trimEnd());
      ctx.state.code = code.trimEnd();
      ctx.readout([
        { label: 'length(x)', value: n },
        { label: '선택·결과 원소', value: hits, tone: 'accent' },
        { label: 'sum(x)', value: S.sum(x) },
        { label: 'mean(x)', value: S.f(S.mean(x), 2) },
      ]);
      ctx.insight(msg);
    },
  });
})();
