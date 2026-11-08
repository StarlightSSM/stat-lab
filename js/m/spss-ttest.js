/* SPSS · 독립표본 t검정 출력 읽기 */
Lab.add({
  id: 'spss-ttest', subject: 'spss', order: 2,
  title: '독립표본 t검정 출력 읽기', en: 'Independent-samples t test · Levene, Welch',
  summary: '두 집단의 분산 비율을 바꾸며 Levene 검정 결과에 따라 SPSS 표의 윗줄과 아랫줄 중 어느 쪽을 읽어야 하는지 익힙니다.',
  keywords: 'independent t test levene welch 등분산 독립표본',
  controls: [
    { type: 'slider', key: 'd', label: '평균 차이 (Cohen d)', min: 0, max: 1.5, step: 0.05, value: 0.5 },
    { type: 'slider', key: 'vr', label: '분산 비율 (B 분산 ÷ A 분산)', min: 1, max: 6, step: 0.25, value: 1, fmt: (v) => v.toFixed(2) + '배' },
    { type: 'slider', key: 'n1', label: 'A 집단 n', min: 10, max: 200, step: 5, value: 40 },
    { type: 'slider', key: 'n2', label: 'B 집단 n', min: 10, max: 200, step: 5, value: 40 },
    { type: 'button', key: 'resample', label: '새 표본 뽑기', primary: true },
  ],
  concept: `
    <p><b>분석 &gt; 평균 비교 &gt; 독립표본 T 검정</b>에서 검정변수(점수)와 집단변수(집단, [집단 정의]에 1·2 입력)를 넣으면 표가 두 개 나옵니다. <b>집단통계량</b>은 집단별 N, 평균, 표준편차를, <b>독립표본 검정</b>은 검정 결과를 보여줍니다.</p>
    <p>독립표본 검정 표는 두 줄입니다. 어느 줄을 읽을지는 맨 앞의 <em>Levene의 등분산 검정</em>이 정합니다.</p>
    <ul>
      <li>Levene 유의확률 &gt; .05 → 두 집단 분산이 같다고 봐도 됨 → <b>윗줄 "등분산을 가정함"</b> (Student t, 자유도 = n₁+n₂−2)</li>
      <li>Levene 유의확률 ≤ .05 → 분산이 다름 → <b>아랫줄 "등분산을 가정하지 않음"</b> (Welch t, 자유도가 소수점으로 줄어듦)</li>
    </ul>
    <p>Levene 검정의 유의확률은 분산에 대한 것이고, 평균 차이의 결론은 그 다음 칸의 <b>유의확률(양측)</b>에서 읽습니다. 두 숫자를 혼동하는 실수가 가장 흔합니다. 표본크기가 서로 다르고 분산도 다를 때 두 줄의 결과가 크게 달라지므로, 최근에는 처음부터 Welch 검정을 쓰자는 권고도 많습니다(Delacre, Lakens &amp; Leys, 2017).</p>`,
  formula: `Student: <var>t</var> = (x̄₁ − x̄₂) / √(<var>s<sub>p</sub></var>²(1/<var>n</var>₁ + 1/<var>n</var>₂)), &nbsp; <var>df</var> = <var>n</var>₁+<var>n</var>₂−2<br>Welch: <var>t</var> = (x̄₁ − x̄₂) / √(<var>s</var>₁²/<var>n</var>₁ + <var>s</var>₂²/<var>n</var>₂)<br><var>df</var> = (<var>s</var>₁²/<var>n</var>₁ + <var>s</var>₂²/<var>n</var>₂)² / [ (<var>s</var>₁²/<var>n</var>₁)²/(<var>n</var>₁−1) + (<var>s</var>₂²/<var>n</var>₂)²/(<var>n</var>₂−1) ]`,
  tasks: [
    '분산 비율을 1에서 4로 올리세요. Levene 유의확률이 .05 아래로 떨어지면 노란 칸이 아랫줄로 옮겨 갑니다.',
    'A n = 20, B n = 120, 분산 비율 4로 맞추세요. 윗줄과 아랫줄의 유의확률이 얼마나 다른가요? 작은 집단의 분산이 클 때 Student t가 왜 위험한지 생각해 보세요.',
    '분산 비율 1, 두 n을 같게 두면 두 줄의 t값이 거의 같습니다. 자유도는 어떻게 다른가요?',
    '평균 차이 0으로 두고 새 표본을 여러 번 뽑아 보세요. 유의확률(양측)이 .05보다 작게 나오는 경우가 가끔 있습니다. 이것이 1종 오류입니다.',
  ],
  tools: {
    spss: (p) => `* 메뉴: 분석 > 평균 비교 > 독립표본 T 검정
*   검정 변수: score / 집단 변수: group(1 2)
T-TEST GROUPS=group(1 2)
  /MISSING=ANALYSIS
  /VARIABLES=score
  /ES DISPLAY(TRUE)
  /CRITERIA=CI(.95).
* A n=${p.n1}, B n=${p.n2}, 분산 비율 ${p.vr}`,
    r: (p) => `library(car)
leveneTest(score ~ group, data = df, center = mean)   # SPSS와 같은 평균 기준

t.test(score ~ group, data = df, var.equal = TRUE)    # 윗줄: 등분산 가정
t.test(score ~ group, data = df)                      # 아랫줄: Welch (R 기본값)
# A n=${p.n1}, B n=${p.n2}`,
  },
  init(ctx) {
    ctx.state.p = ctx.plot({ x: [0, 100], y: [0, 1], height: 260, xLabel: '점수', yLabel: '빈도', title: '두 집단의 점수 분포' });
    ctx.state.tbl = ctx.box('stage');
    ctx.state.seed = 11;
  },
  update(ctx, v, changed) {
    if (changed === 'resample') ctx.state.seed++;
    S.seed(ctx.state.seed);
    const sdA = 8, sdB = 8 * Math.sqrt(v.vr), muA = 60, muB = 60 + v.d * Math.sqrt((sdA * sdA + sdB * sdB) / 2);
    const A = S.rnormVec(v.n1, muA, sdA), B = S.rnormVec(v.n2, muB, sdB);
    const lev = S.levene([A, B]), st = S.ttest2(A, B, true), we = S.ttest2(A, B, false);
    const useWelch = lev.p <= 0.05, C = Lab.C;
    const hi = (s, on = true) => (on ? `<span class="hi">${s}</span>` : s);
    const all = A.concat(B), lo = Math.floor(Math.min(...all) / 5) * 5 - 5, up = Math.ceil(Math.max(...all) / 5) * 5 + 5;
    const p = ctx.state.p; p.setX([lo, up]);
    const nb = Math.max(12, Math.round((up - lo) / 3)), bA = S.bin(A, lo, up, nb), bB = S.bin(B, lo, up, nb);
    p.setY([0, Math.max(...bA.map((b) => b.n), ...bB.map((b) => b.n)) * 1.2 + 1]);
    p.clear();
    p.hist(bA, { color: C.s1, opacity: 0.55, tip: (b) => `A 집단 ${S.f(b.x0, 0)}–${S.f(b.x1, 0)}: ${b.n}명` });
    p.hist(bB, { color: C.s2, opacity: 0.55, tip: (b) => `B 집단 ${S.f(b.x0, 0)}–${S.f(b.x1, 0)}: ${b.n}명` });
    p.vline(st.m1, { color: C.s1, label: `A 평균 ${S.f(st.m1, 1)}`, anchor: 'end' });
    p.vline(st.m2, { color: C.s2, label: `B 평균 ${S.f(st.m2, 1)}`, labelY: 26 });
    p.legend([{ label: `A 집단 (SD ${S.f(st.sd1, 1)})`, color: C.s1 }, { label: `B 집단 (SD ${S.f(st.sd2, 1)})`, color: C.s2 }]);

    const g1 = Lab.spssTable({
      title: '집단통계량',
      head: ['점수 · 집단', 'N', '평균', '표준편차', '표준오차 평균'],
      rows: [['A', st.n1, S.f(st.m1, 2), S.f(st.sd1, 3), S.f(st.sd1 / Math.sqrt(st.n1), 3)], ['B', st.n2, S.f(st.m2, 2), S.f(st.sd2, 3), S.f(st.sd2 / Math.sqrt(st.n2), 3)]],
    });
    const row = (r, label, isRead, withLev) => [label,
      withLev ? hi(S.f(lev.F, 3)) : '', withLev ? hi(S.fp(lev.p).replace(' ', '')) : '',
      hi(S.f(r.t, 3), isRead), hi(Number.isInteger(r.df) ? r.df : S.f(r.df, 3), isRead), hi(S.fp(r.p).replace(' ', ''), isRead),
      S.f(r.diff, 3), S.f(r.se, 3), S.f(r.ci[0], 3), S.f(r.ci[1], 3)];
    const g2 = Lab.spssTable({
      title: '독립표본 검정',
      head: ['점수', 'Levene<br>F', 'Levene<br>유의확률', 't', '자유도', '유의확률<br>(양측)', '평균차이', '차이의<br>표준오차', '95% CI<br>하한', '95% CI<br>상한'],
      rows: [row(st, '등분산을 가정함', !useWelch, true), row(we, '등분산을 가정하지 않음', useWelch, false)],
      note: `① Levene 유의확률 ${S.fp(lev.p)} ${useWelch ? '≤' : '>'} .05 → ② <b>${useWelch ? '아랫줄(등분산을 가정하지 않음)' : '윗줄(등분산을 가정함)'}</b>을 읽습니다 → ③ t(${Number.isInteger((useWelch ? we : st).df) ? (useWelch ? we : st).df : S.f((useWelch ? we : st).df, 2)}) = ${S.f((useWelch ? we : st).t, 2)}, p ${(useWelch ? we : st).p < 0.001 ? '< .001' : '= ' + S.apa((useWelch ? we : st).p)}`,
    });
    ctx.state.tbl.innerHTML = g1 + g2;

    const r = useWelch ? we : st, sig = r.p < 0.05, gap = Math.abs(st.p - we.p);
    ctx.readout([
      { label: 'Levene 유의확률', value: S.fp(lev.p), tone: useWelch ? 'warn' : 'good', sub: useWelch ? '분산이 다름' : '등분산 가정 OK' },
      { label: '읽을 줄', value: useWelch ? '아랫줄' : '윗줄', sub: useWelch ? 'Welch t' : 'Student t', tone: 'accent' },
      { label: '평균 차이 유의확률', value: S.fp(r.p), tone: sig ? 'good' : null, sub: sig ? 'p < .05 → 차이 있음' : '차이 없음' },
      { label: '두 줄 p값 차이', value: S.f(gap, 3), tone: gap > 0.02 ? 'warn' : null },
      { label: "Cohen's d", value: S.f(Math.abs(st.d), 2) },
    ]);
    let msg = `Levene 검정이 ${useWelch ? '유의해서(분산이 다름) 아랫줄' : '유의하지 않아 윗줄'}을 읽습니다. 평균 차이는 ${sig ? '<b>유의합니다</b>' : '유의하지 않습니다'} (p ${r.p < 0.001 ? '< .001' : '= ' + S.apa(r.p)}).`;
    if (gap > 0.02) msg += ` 두 줄의 유의확률이 ${S.f(st.p, 3)} 대 ${S.f(we.p, 3)}로 꽤 다릅니다. ${v.n1 !== v.n2 ? '표본크기와 분산이 함께 다를 때 생기는 현상입니다.' : ''}`;
    else if (v.vr > 2 && !useWelch) msg += ' 분산 비율이 크지만 표본이 작아 Levene 검정이 차이를 잡아내지 못했습니다. 검정력이 낮은 사전검정에 의존하는 위험이 여기 있습니다.';
    ctx.insight(msg);
  },
});
