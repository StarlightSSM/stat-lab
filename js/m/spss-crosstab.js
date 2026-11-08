/* SPSS · 교차분석 (카이제곱 독립성 검정) */
(function () {
  function fisher2x2(t) { // two-sided & one-sided exact p for [[a,b],[c,d]]
    const [[a, b], [c, d]] = t, r1 = a + b, c1 = a + c, N = a + b + c + d, lo = Math.max(0, c1 - (N - r1)), hi = Math.min(r1, c1);
    const pr = (x) => Math.exp(S.lchoose(r1, x) + S.lchoose(N - r1, c1 - x) - S.lchoose(N, c1));
    const p0 = pr(a); let two = 0, left = 0, right = 0;
    for (let x = lo; x <= hi; x++) { const q = pr(x); if (q <= p0 * (1 + 1e-7)) two += q; if (x <= a) left += q; if (x >= a) right += q; }
    return { two: Math.min(1, two), one: Math.min(1, left, right) };
  }
  Lab.add({
    id: 'spss-crosstab', subject: 'spss', order: 5,
    title: '교차분석', en: 'Crosstabs · chi-square test of independence',
    summary: '성별과 선택 사이의 연관 강도와 표본크기를 바꾸며 교차표의 기대빈도, 수정된 잔차, 카이제곱 검정표를 읽어 봅니다.',
    keywords: 'crosstab 교차분석 카이제곱 chi-square 기대빈도 잔차 fisher cramer',
    controls: [
      { type: 'select', key: 'shape', label: '표 크기', options: [['2x2', '2 × 2 (구매 여부)'], ['2x3', '2 × 3 (선호 채널)']], value: '2x2' },
      { type: 'slider', key: 'eff', label: '연관 강도 (집단 간 비율 차이)', min: 0, max: 0.4, step: 0.02, value: 0.16, fmt: (v) => S.pct(v, 0) + 'p' },
      { type: 'slider', key: 'n', label: '표본크기 N', min: 16, max: 600, step: 4, value: 120 },
      { type: 'toggle', key: 'exp', label: '기대빈도 표시', value: true },
      { type: 'toggle', key: 'rowp', label: '행 % 표시', value: true },
      { type: 'toggle', key: 'res', label: '수정된 잔차 표시', value: true },
      { type: 'button', key: 'resample', label: '새 표본 뽑기', primary: true },
    ],
    concept: `
      <p><b>분석 &gt; 기술통계량 &gt; 교차분석</b>에서 행(성별)과 열(선택)을 넣고 [통계량]에서 카이제곱을, [셀]에서 기대빈도·행 백분율·수정된 표준화 잔차를 체크합니다. 두 범주형 변수가 서로 독립인지 검정합니다.</p>
      <ul>
        <li><b>기대빈도</b> : 두 변수가 완전히 독립이라면 각 칸에 나왔을 빈도(행합 × 열합 ÷ N)입니다. 카이제곱은 관측빈도와 기대빈도의 차이를 모은 값입니다.</li>
        <li><b>행 %</b> : 집단(행)마다 선택 비율을 비교합니다. 해석은 거의 항상 이 비율로 합니다. "남자는 38%, 여자는 22%가 구매".</li>
        <li><b>수정된 잔차</b> : 어느 칸이 차이를 만들었는지 알려 줍니다. |값| &gt; 1.96이면 그 칸이 독립일 때 기대보다 유의하게 많거나 적습니다.</li>
      </ul>
      <p>카이제곱 검정은 <em>기대빈도 5 미만인 셀이 20%를 넘으면</em> 근사가 부정확해집니다. SPSS는 이를 표 아래 각주 a로 알려 주며, 2×2 표라면 이때 <b>Fisher의 정확검정</b> 유의확률을 대신 보고합니다. 연관의 크기는 Cramer의 V(φ)로 함께 보고하세요(.1 작음, .3 중간, .5 큼).</p>`,
    formula: `<var>E<sub>ij</sub></var> = (행합<sub><var>i</var></sub> × 열합<sub><var>j</var></sub>) / <var>N</var><br>χ² = Σ (<var>O<sub>ij</sub></var> − <var>E<sub>ij</sub></var>)² / <var>E<sub>ij</sub></var>, &nbsp; <var>df</var> = (<var>r</var>−1)(<var>c</var>−1)<br>수정된 잔차 = (<var>O</var> − <var>E</var>) / √(<var>E</var>(1 − 행합/<var>N</var>)(1 − 열합/<var>N</var>))<br>Cramer's V = √(χ² / (<var>N</var>·(min(<var>r</var>,<var>c</var>)−1)))`,
    tasks: [
      'N을 24로 줄여 보세요. 각주 a의 "5보다 작은 기대빈도" 셀 비율이 20%를 넘으면 Pearson 대신 Fisher 정확검정의 유의확률을 읽습니다.',
      '연관 강도 0.10에서 N을 40과 600으로 바꿔 보세요. Cramer V는 비슷한데 유의확률은 크게 다릅니다. 효과크기를 함께 보고하는 이유입니다.',
      '2×3 표에서 수정된 잔차가 ±1.96을 넘는 칸을 찾아 "어느 채널에서 성별 차이가 났는지" 한 문장으로 써 보세요.',
      '2×2 표에서 연속성 수정 값이 Pearson 카이제곱보다 항상 작은지 확인해 보세요.',
    ],
    tools: {
      spss: (p) => `* 메뉴: 분석 > 기술통계량 > 교차분석
*   [통계량] 카이제곱, 파이 및 Cramer의 V / [셀] 관측빈도, 기대빈도, 행, 수정된 표준화
CROSSTABS
  /TABLES=gender BY ${p.shape === '2x2' ? 'purchase' : 'channel'}
  /FORMAT=AVALUE TABLES
  /STATISTICS=CHISQ PHI
  /CELLS=COUNT EXPECTED ROW ASRESID
  /COUNT ROUND CELL.
* N = ${p.n}`,
      r: (p) => `tab <- table(df$gender, df$${p.shape === '2x2' ? 'purchase' : 'channel'})
res <- chisq.test(tab, correct = ${p.shape === '2x2' ? 'TRUE   # 2x2는 기본이 연속성 수정' : 'FALSE'})
res
res$expected      # 기대빈도
res$stdres        # 수정된 잔차 (SPSS의 수정된 표준화 잔차)
prop.table(tab, 1)   # 행 %
${p.shape === '2x2' ? 'fisher.test(tab)\n' : ''}library(rcompanion); cramerV(tab)`,
    },
    init(ctx) {
      ctx.state.p = ctx.plot({ xBand: ['구매', '비구매'], y: [0, 100], height: 230, yLabel: '행 %', title: '성별에 따른 선택 비율 (행 %)', bandPad: 0.25 });
      ctx.state.tbl = ctx.box('stage');
      ctx.state.seed = 10;
    },
    update(ctx, v, changed) {
      if (changed === 'resample') ctx.state.seed++;
      S.seed(ctx.state.seed);
      const two = v.shape === '2x2', cats = two ? ['구매', '비구매'] : ['모바일', '웹', '매장'], rows = ['남자', '여자'], e = v.eff;
      const probs = two ? [[0.4 + e / 2, 0.6 - e / 2], [0.4 - e / 2, 0.6 + e / 2]] : [[0.4 + e / 2, 0.35 - e / 4, 0.25 - e / 4], [0.4 - e / 2, 0.35 + e / 4, 0.25 + e / 4]];
      const T = rows.map(() => cats.map(() => 0));
      for (let i = 0; i < v.n; i++) { const r = S.rand() < 0.5 ? 0 : 1; let u = S.rand(), c = 0; while (c < cats.length - 1 && u > probs[r][c]) { u -= probs[r][c]; c++; } T[r][c]++; }
      if (T.some((r) => S.sum(r) === 0) || T[0].some((_, j) => T[0][j] + T[1][j] === 0)) { T[0][0]++; T[1][T[1].length - 1]++; }
      const ch = S.chisqTest(T), E = ch.expected, N = ch.N, rs = ch.rowSums, cs = ch.colSums;
      const adj = T.map((r, i) => r.map((o, j) => (o - E[i][j]) / Math.sqrt(E[i][j] * (1 - rs[i] / N) * (1 - cs[j] / N))));
      const small = E.flat().filter((x) => x < 5).length, cells = E.flat().length, minE = Math.min(...E.flat());
      let G = 0; T.forEach((r, i) => r.forEach((o, j) => { if (o > 0) G += 2 * o * Math.log(o / E[i][j]); }));
      // linear-by-linear: (N-1) r^2 using integer scores
      const xs = [], ys = []; T.forEach((r, i) => r.forEach((o, j) => { for (let k = 0; k < o; k++) { xs.push(i + 1); ys.push(j + 1); } }));
      const rr = S.cor(xs, ys), lbl = (N - 1) * rr * rr;
      const C = Lab.C, hi = (s) => `<span class="hi">${s}</span>`, sig = (q) => S.fp(q).replace(' ', '');

      const body = [];
      rows.forEach((rn, i) => {
        body.push([`${rn} · 빈도`, ...T[i].map(String), String(rs[i])]);
        if (v.exp) body.push([`${rn} · 기대빈도`, ...E[i].map((x) => (x < 5 ? `<span class="hi" style="color:var(--bad)">${S.f(x, 1)}</span>` : S.f(x, 1))), S.f(rs[i], 1)]);
        if (v.rowp) body.push([`${rn} · ${'행'} %`, ...T[i].map((o) => hi(S.f(o / rs[i] * 100, 1) + '%')), '100.0%']);
        if (v.res) body.push([`${rn} · 수정된 잔차`, ...adj[i].map((z) => (Math.abs(z) > 1.96 ? hi(S.f(z, 1)) : S.f(z, 1))), '']);
      });
      body.push(['전체 · 빈도', ...cs.map(String), String(N)]);
      const t1 = Lab.spssTable({ title: `성별 * ${two ? '구매 여부' : '선호 채널'} 교차표`, head: ['', ...cats, '전체'], rows: body, note: '노란 칸: 해석할 값 · 빨간 기대빈도: 5 미만 · 수정된 잔차 |값| > 1.96이면 그 칸의 차이가 유의' });
      const cr = [['Pearson 카이제곱', hi(S.f(ch.chi2, 3) + '<sup>a</sup>'), ch.df, hi(sig(ch.p)), '', '']];
      let fx = null;
      if (two) {
        let yates = 0; T.forEach((r, i) => r.forEach((o, j) => { yates += Math.max(0, Math.abs(o - E[i][j]) - 0.5) ** 2 / E[i][j]; }));
        fx = fisher2x2(T);
        cr.push(['연속성 수정<sup>b</sup>', S.f(yates, 3), 1, sig(1 - S.pchisq(yates, 1)), '', '']);
        cr.push(['우도비', S.f(G, 3), ch.df, sig(1 - S.pchisq(G, ch.df)), '', '']);
        cr.push(['Fisher의 정확검정', '', '', '', small / cells > 0.2 ? hi(sig(fx.two)) : sig(fx.two), sig(fx.one)]);
      } else cr.push(['우도비', S.f(G, 3), ch.df, sig(1 - S.pchisq(G, ch.df)), '', '']);
      cr.push(['선형 대 선형결합', S.f(lbl, 3), 1, sig(1 - S.pchisq(lbl, 1)), '', '']);
      cr.push(['유효 케이스 수', N, '', '', '', '']);
      const foot = `a. ${small} 셀 (${S.f(small / cells * 100, 1)}%)은(는) 5보다 작은 기대 빈도를 가지는 셀입니다. 최소 기대빈도는 ${S.f(minE, 2)}입니다.${two ? '<br>b. 2x2 표에 대해서만 계산됨' : ''}`;
      const t2 = Lab.spssTable({ title: '카이제곱 검정', head: ['', '값', '자유도', '점근 유의확률<br>(양측검정)', '정확한 유의확률<br>(양측검정)', '정확한 유의확률<br>(단측검정)'], rows: cr,
        note: small / cells > 0.2 ? `<span style="color:var(--bad);font-weight:600">${foot}</span>` : foot });
      const t3 = Lab.spssTable({ title: '대칭적 측도', head: ['', '', '값', '근사 유의확률'], rows: [['명목척도 대 명목척도', '파이', S.apa(two ? (T[0][0] * T[1][1] - T[0][1] * T[1][0]) / Math.sqrt(rs[0] * rs[1] * cs[0] * cs[1]) : Math.sqrt(ch.chi2 / N)), sig(ch.p)], ['', 'Cramer의 V', hi(S.apa(ch.cramerV)), sig(ch.p)]] });
      ctx.state.tbl.innerHTML = t1 + t2 + t3;

      // grouped bar of row %
      const p = ctx.state.p; p.setX(cats); p.clear();
      const bw = p.xs.bandwidth(), w = Math.min(28, bw / 2 - 2), colr = [C.s1, C.s2], items = [];
      cats.forEach((c, j) => rows.forEach((rn, i) => items.push({ x: c, y: T[i][j] / rs[i] * 100, color: colr[i], w, off: i === 0 ? bw / 2 - w - 1 : bw / 2 + 1, rn, o: T[i][j], z: adj[i][j] })));
      p.bars(items, { maxW: 9999, labels: (d) => S.f(d.y, 0) + '%', tip: (d) => `<b>${d.rn} · ${d.x}</b><br>${d.o}명 (${S.f(d.y, 1)}%)<br>수정된 잔차 ${S.f(d.z, 2)}` });
      p.legend(rows.map((r, i) => ({ label: r, color: colr[i] })));

      const useF = two && small / cells > 0.2, pUse = useF ? fx.two : ch.p;
      ctx.readout([
        { label: 'Pearson χ²', value: S.f(ch.chi2, 2), sub: `df = ${ch.df}` },
        { label: useF ? 'Fisher 정확검정 p' : '유의확률', value: S.fp(pUse), tone: pUse < 0.05 ? 'good' : null },
        { label: "Cramer's V", value: S.apa(ch.cramerV), sub: ch.cramerV < 0.1 ? '거의 없음' : ch.cramerV < 0.3 ? '작음' : ch.cramerV < 0.5 ? '중간' : '큼' },
        { label: '기대빈도 < 5 셀', value: `${small} / ${cells}`, tone: small / cells > 0.2 ? 'bad' : 'good', sub: `최소 ${S.f(minE, 1)}` },
      ]);
      const bigCell = []; adj.forEach((r, i) => r.forEach((z, j) => { if (z > 1.96) bigCell.push(`${rows[i]}-${cats[j]}`); }));
      let msg;
      if (useF) msg = `기대빈도 5 미만 셀이 ${S.f(small / cells * 100, 0)}%라 카이제곱 근사를 믿기 어렵습니다. Fisher 정확검정의 양측 유의확률 ${S.fp(fx.two)}을 보고하세요.`;
      else if (pUse < 0.05) msg = `성별과 ${two ? '구매 여부' : '선호 채널'}는 독립이 아닙니다 (χ²(${ch.df}) = ${S.f(ch.chi2, 2)}, p ${ch.p < 0.001 ? '< .001' : '= ' + S.apa(ch.p)}, V = ${S.apa(ch.cramerV)}). ${bigCell.length ? `기대보다 유의하게 많은 칸: <b>${bigCell.join(', ')}</b>.` : ''}`;
      else msg = `관측빈도가 기대빈도와 크게 다르지 않아 독립이라는 귀무가설을 기각하지 못합니다 (p = ${S.apa(ch.p)}).${v.eff > 0.1 ? ' 실제 연관이 있어도 N이 작으면 검정력이 부족합니다.' : ''}`;
      ctx.insight(msg);
    },
  });
})();
