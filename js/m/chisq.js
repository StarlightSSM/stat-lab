/* 카이제곱 독립성 검정: generate a contingency table from effect size w, or type counts directly. */
(function () {
  const COLS = { '2x2': ['구매', '비구매'], '2x3': ['구매', '장바구니만', '이탈'] };
  const ROWS = ['광고 본 집단', '광고 안 본 집단'];
  const PAT = { '2x2': { c: [0.4, 0.6], s: [1, -0.4 / 0.6] }, '2x3': { c: [0.3, 0.3, 0.4], s: [1, 0, -0.75] } };

  function popProbs(layout, w) {
    const { c, s } = PAT[layout], e = w / Math.sqrt(S.sum(c.map((cj, j) => cj * s[j] * s[j])));
    return [0, 1].map((i) => c.map((cj, j) => 0.5 * cj * (1 + (i === 0 ? 1 : -1) * e * s[j])));
  }
  function sampleTable(layout, w, N) {
    const P = popProbs(layout, w), flat = P.flat(), cum = []; let acc = 0; flat.forEach((p) => { acc += p; cum.push(acc); });
    const counts = flat.map(() => 0);
    for (let i = 0; i < N; i++) { const u = S.rand() * acc; let k = 0; while (k < cum.length - 1 && u > cum[k]) k++; counts[k]++; }
    const C = COLS[layout].length; return [counts.slice(0, C), counts.slice(C)];
  }
  function paintInputs(ctx) {
    const el = ctx.state.tblEl; if (!el) return;
    const obs = ctx.state.obs, cols = COLS[ctx.p.layout];
    el.innerHTML = `<div class="ctl-top"><label>관측빈도 직접 입력</label></div>
      <div class="tbl-scroll"><table class="data-tbl chisq-in"><thead><tr><th></th>${cols.map((c) => `<th>${c}</th>`).join('')}</tr></thead>
      <tbody>${obs.map((r, i) => `<tr><th style="text-align:left">${i === 0 ? '광고 O' : '광고 X'}</th>${r.map((v, j) => `<td><input type="number" min="0" step="1" value="${v}" data-i="${i}" data-j="${j}" aria-label="${ROWS[i]} ${cols[j]} 빈도" style="width:62px"></td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <div class="ctl-hint">칸을 고치면 바로 다시 검정합니다. 위 슬라이더를 움직이면 새 표본으로 바뀝니다.</div>`;
    el.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', () => {
      const v = Math.max(0, Math.round(+inp.value || 0)); ctx.state.obs[+inp.dataset.i][+inp.dataset.j] = v; ctx.state.manual = true; ctx._run('cell');
    }));
  }

  Lab.add({
    id: 'chisq', subject: 'prob', order: 12,
    title: '카이제곱 독립성 검정', en: 'Chi-square test of independence',
    summary: '두 범주형 변수가 서로 관련이 있는지, 관측빈도와 "관련이 없다면 기대되는 빈도"의 차이로 판단합니다. 표의 숫자를 직접 고쳐 볼 수도 있습니다.',
    keywords: 'chi-square 교차분석 crosstab 독립성 cramer 기대빈도',
    controls: [
      { type: 'select', key: 'layout', label: '교차표 형태', options: [['2x2', '2 × 2'], ['2x3', '2 × 3']], value: '2x2' },
      { type: 'slider', key: 'N', label: '전체 표본크기 N', min: 40, max: 1000, step: 10, value: 200 },
      { type: 'slider', key: 'w', label: '모집단 연관 강도 (Cohen의 w)', min: 0, max: 0.6, step: 0.02, value: 0.2, hint: '0 = 완전히 독립, .1 작음, .3 중간, .5 큼' },
      { type: 'button', key: 'gen', label: '새 표본 뽑기', primary: true },
      { type: 'custom', key: 'tbl', render: (el, ctx) => { ctx.state.tblEl = el; } },
    ],
    concept: `
      <p>"광고를 봤는지"와 "구매했는지"처럼 두 변수가 모두 범주형이면 평균을 낼 수 없으므로 <b>빈도</b>를 비교합니다. 귀무가설은 "두 변수는 독립이다", 즉 광고를 봤든 안 봤든 구매 비율이 같다는 것입니다.</p>
      <ul>
        <li><b>기대빈도</b> E = (행 합계 × 열 합계) / N. 두 변수가 독립일 때 각 칸에 들어갈 것으로 예상되는 빈도입니다.</li>
        <li>각 칸의 (O − E)² / E를 모두 더한 값이 χ²입니다. 관측이 기대에서 멀수록 커집니다.</li>
        <li><em>표준화 잔차</em> (O − E)/√E가 ±1.96을 넘는 칸이 "어디서 차이가 나는지"를 알려 줍니다.</li>
      </ul>
      <p>χ²는 N에 비례해서 커지므로 큰 표본에서는 사소한 연관도 유의해집니다. 그래서 효과크기 <b>Cramér's V</b>(2×2에서는 φ와 같음)를 함께 보고합니다.</p>
      <p>기대빈도가 5 미만인 칸이 전체의 20%를 넘으면 χ² 근사가 부정확합니다. 이때 2×2 표는 <b>Fisher의 정확검정</b>을 씁니다.</p>`,
    formula: `<var>E<sub>ij</sub></var> = (<var>R<sub>i</sub></var> × <var>C<sub>j</sub></var>) / <var>N</var><br>
      χ² = Σ (<var>O<sub>ij</sub></var> − <var>E<sub>ij</sub></var>)² / <var>E<sub>ij</sub></var>, &nbsp; <span class="c">df = (r − 1)(c − 1)</span><br>
      Cramér's <var>V</var> = √( χ² / (<var>N</var> · (min(r, c) − 1)) )`,
    tasks: [
      'w = 0으로 두고 "새 표본 뽑기"를 여러 번 눌러 보세요. χ²가 대략 자유도(2×2면 1) 근처에서 오르내리는지 확인하세요.',
      'w = 0.1, N = 200일 때와 N = 1000일 때를 비교하세요. V는 비슷한데 p값은 어떻게 달라지나요?',
      '표에 직접 [10, 30] / [30, 10]을 입력해 보세요. 표준화 잔차가 가장 큰 칸은 어디인가요?',
      'N = 40, 2×3 표에서 기대빈도 경고가 뜨는지 확인하고, 그럴 때 어떤 대안을 써야 하는지 정리하세요.',
    ],
    tools: {
      r: (p, ctx) => {
        const o = ctx.state.obs || [[0]], cols = COLS[p.layout];
        return `tab <- matrix(c(${o.flat().join(', ')}), nrow = 2, byrow = TRUE,
              dimnames = list(광고 = c("본 집단", "안 본 집단"),
                              행동 = c(${cols.map((c) => `"${c}"`).join(', ')})))
res <- chisq.test(tab, correct = FALSE)
res              # X-squared, df, p-value
res$expected     # 기대빈도
res$stdres       # 표준화(조정) 잔차
effectsize::cramers_v(tab)
${p.layout === '2x2' ? 'fisher.test(tab)  # 기대빈도가 작을 때' : ''}`;
      },
      spss: (p, ctx) => {
        const o = ctx.state.obs || [[0]], cols = COLS[p.layout];
        const lines = []; o.forEach((r, i) => r.forEach((v, j) => lines.push(`${i + 1} ${j + 1} ${v}`)));
        return `* 집계된 빈도를 입력하고 가중치를 줍니다.
DATA LIST FREE / ad behavior count.
BEGIN DATA
${lines.join('\n')}
END DATA.
VALUE LABELS ad 1 '광고 본 집단' 2 '광고 안 본 집단'
  /behavior ${cols.map((c, j) => `${j + 1} '${c}'`).join(' ')}.
WEIGHT BY count.

* 메뉴: 분석 > 기술통계량 > 교차분석
*   [통계량] 카이제곱, 파이 및 Cramer의 V / [셀] 기대빈도, 수정된 표준화 잔차
CROSSTABS /TABLES=ad BY behavior
  /STATISTICS=CHISQ PHI
  /CELLS=COUNT EXPECTED ROW ASRESID.`;
      },
    },
    init(ctx) {
      const row = ctx.row(), a = ctx.box('', row), b = ctx.box('', row);
      ctx.state.bp = ctx.plot({ xBand: ['a'], y: [0, 100], height: 300, yLabel: '빈도', bandPad: 0.25, title: '관측빈도 vs 기대빈도' }, a);
      ctx.state.cp = ctx.plot({ x: [0, 12], y: [0, 0.5], height: 300, xLabel: 'χ²', yLabel: '밀도', title: 'H₀가 참일 때의 χ² 분포' }, b);
      ctx.state.res = ctx.box('');
      ctx.state.seed = 31;
    },
    update(ctx, v, changed) {
      const st = ctx.state, C = Lab.C, cols = COLS[v.layout];
      if (changed !== 'cell') {
        if (changed === 'gen') st.seed++;
        S.seed(st.seed + (v.layout === '2x3' ? 1000 : 0));
        st.obs = sampleTable(v.layout, v.w, v.N); st.manual = false;
        paintInputs(ctx);
      }
      const obs = st.obs, N = S.sum(obs.flat());
      if (N < 2 || obs.some((r) => S.sum(r) === 0) || cols.some((_, j) => obs[0][j] + obs[1][j] === 0)) {
        ctx.readout([{ label: '검정 불가', value: '—', sub: '행·열 합계가 0인 칸이 있습니다' }]); ctx.insight('모든 행과 열에 적어도 하나의 관측이 있어야 기대빈도를 계산할 수 있습니다.'); return;
      }
      const r = S.chisqTest(obs), E = r.expected, crit = S.qchisq(0.95, r.df);
      const sres = obs.map((row, i) => row.map((o, j) => (o - E[i][j]) / Math.sqrt(E[i][j])));

      // grouped bars: per column category, 2 rows × (obs, exp)
      const bp = st.bp; bp.setX(cols); bp.setY([0, Math.max(...obs.flat(), ...E.flat()) * 1.18]); bp.clear();
      const bw = Math.min(22, bp.xs.bandwidth() / 4 - 2), rowCol = [C.s1, C.s2], items = [];
      cols.forEach((c, j) => [0, 1].forEach((i) => {
        const base = (i * 2 - 2) * (bw + 2) + 1;
        items.push({ x: c, y: obs[i][j], color: rowCol[i], off: base + bw / 2, w: bw, label: String(obs[i][j]), tip: () => `<b>${ROWS[i]} · ${c}</b><br>관측 ${obs[i][j]} · 기대 ${S.f(E[i][j], 1)}<br>표준화 잔차 ${S.f(sres[i][j], 2)}` });
        items.push({ x: c, y: E[i][j], color: rowCol[i], opacity: 0.28, off: base + bw * 1.5 + 2, w: bw, label: S.f(E[i][j], 0), tip: () => `<b>${ROWS[i]} · ${c}</b><br>기대빈도 ${S.f(E[i][j], 2)}` });
      }));
      bp.bars(items, { maxW: bw, labels: (d) => d.label });
      bp.legend([{ label: ROWS[0], color: rowCol[0] }, { label: ROWS[1], color: rowCol[1] }, { label: '옅은 막대 = 기대빈도 (독립일 때)', color: C.muted }]);

      // chi-square distribution
      const cp = st.cp, xmax = Math.max(8, Math.min(60, Math.max(crit * 2, r.chi2 * 1.15)));
      const f = (x) => S.dchisq(x, r.df), xs = S.linspace(0.05, xmax, 240), ymax = Math.min(1, Math.max(...xs.map(f)) * 1.15);
      cp.setX([0, xmax]); cp.setY([0, ymax]); cp.clear();
      cp.shade(f, crit, xmax, { color: C.s8, opacity: 0.18 });
      if (r.chi2 < xmax) cp.shade(f, r.chi2, xmax, { color: C.s7, opacity: 0.45 });
      cp.line(xs.map((x) => [x, Math.min(f(x), ymax)]), { color: C.ink2 });
      cp.vline(crit, { color: C.s8, dash: true, width: 1, label: `임계값 ${S.f(crit, 2)}`, labelY: 28 });
      const cx = Math.min(r.chi2, xmax * 0.985);
      cp.vline(cx, { color: C.marker, width: 2.5, label: `χ² = ${S.f(r.chi2, 2)}`, anchor: cx > xmax * 0.6 ? 'end' : 'start' });
      cp.legend([{ label: `χ²(df = ${r.df})`, color: C.ink2, type: 'line' }, { label: '기각역 α = .05', color: C.s8 }, { label: 'p값 영역', color: C.s7 }]);

      // residual table
      st.res.innerHTML = `<div class="spss-out"><div class="spss-title">교차표 · 관측(기대) · 표준화 잔차</div>` +
        Lab.dataTable({ head: ['', ...cols, '행 합계'], rows: [0, 1].map((i) => [ROWS[i], ...cols.map((_, j) => `${obs[i][j]} (${S.f(E[i][j], 1)}) <b style="color:${Math.abs(sres[i][j]) > 1.96 ? 'var(--marker)' : 'var(--ink-3)'}">${sres[i][j] > 0 ? '+' : ''}${S.f(sres[i][j], 2)}</b>`), r.rowSums[i]]).concat([['열 합계', ...r.colSums, N]]) }) +
        `<div class="spss-note">굵은 숫자 = 표준화 잔차 (O − E)/√E. ±1.96을 넘으면 주황색으로 표시합니다.</div></div>`;

      const small = E.flat().filter((e) => e < 5).length, smallPct = small / E.flat().length, sig = r.p < 0.05;
      const vWord = r.cramerV < 0.1 ? '거의 없음' : r.cramerV < 0.3 ? '약함' : r.cramerV < 0.5 ? '중간' : '강함';
      ctx.readout([
        { label: `χ² (df = ${r.df})`, value: S.f(r.chi2, 2) },
        { label: 'p', value: S.fp(r.p), sub: sig ? '독립 가설 기각' : '독립 가설 유지', tone: sig ? 'accent' : null },
        { label: v.layout === '2x2' ? "Cramér's V (= φ)" : "Cramér's V", value: S.apa(r.cramerV, 3), sub: '연관 ' + vWord },
        { label: '최소 기대빈도', value: S.f(S.min(E.flat()), 1), sub: small ? `5 미만 ${small}칸 (${S.pct(smallPct, 0)})` : '모두 5 이상', tone: smallPct > 0.2 ? 'warn' : null },
      ]);
      const rate = [0, 1].map((i) => obs[i][0] / r.rowSums[i]);
      let msg = `${ROWS[0]}의 구매율은 <b>${S.pct(rate[0])}</b>, ${ROWS[1]}은 <b>${S.pct(rate[1])}</b>입니다. `;
      msg += sig ? `이 차이는 독립이라면 ${S.fp(r.p).replace('< ', '')}${r.p < 0.001 ? ' 미만' : ''}의 확률로만 나오므로 두 변수는 관련이 있다고 봅니다.` : '두 변수가 독립이어도 이 정도 차이는 흔히 나옵니다.';
      msg += ` 연관의 강도는 V = ${S.apa(r.cramerV, 2)}로 ${vWord} 수준입니다.`;
      if (sig && r.cramerV < 0.1) msg += ' N이 커서 약한 연관도 유의하게 나왔습니다.';
      if (smallPct > 0.2) msg += ' 기대빈도 5 미만 칸이 20%를 넘어 χ² 근사를 믿기 어렵습니다' + (v.layout === '2x2' ? ' (Fisher 정확검정 권장).' : ' (범주 합치기 고려).');
      if (st.manual) msg += ' (직접 입력한 표)';
      ctx.insight(msg);
    },
  });
})();
