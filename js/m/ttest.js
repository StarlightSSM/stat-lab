/* t-검정 (독립표본): two groups → t, df, p, d. Noise vectors are fixed per seed so sliders move the same sample smoothly. */
Lab.add({
  id: 'ttest', subject: 'prob', order: 10,
  title: 't-검정 (독립표본)', en: 'Independent-samples t-test',
  summary: '두 집단의 평균 차이가 우연으로 설명될 수 있는지, 평균 차·표준편차·표본크기를 바꾸며 t값과 p값이 어떻게 움직이는지 봅니다.',
  keywords: 't-test 독립표본 welch levene cohen d 평균비교',
  controls: [
    { type: 'slider', key: 'm1', label: '집단 A 평균', min: 40, max: 70, step: 0.5, value: 50 },
    { type: 'slider', key: 'm2', label: '집단 B 평균', min: 40, max: 70, step: 0.5, value: 55 },
    { type: 'slider', key: 'sd1', label: 'A 표준편차', min: 2, max: 20, step: 0.5, value: 10 },
    { type: 'slider', key: 'sd2', label: 'B 표준편차', min: 2, max: 20, step: 0.5, value: 10 },
    { type: 'slider', key: 'n1', label: 'A 표본크기 n₁', min: 5, max: 200, step: 1, value: 30 },
    { type: 'slider', key: 'n2', label: 'B 표본크기 n₂', min: 5, max: 200, step: 1, value: 30 },
    { type: 'toggle', key: 'welch', label: 'Welch 검정 (등분산 가정 안 함)', value: false },
    { type: 'button', key: 'resample', label: '새 표본 뽑기', primary: true },
  ],
  concept: `
    <p>독립표본 t-검정은 서로 다른 두 집단(예: 실험집단과 통제집단)의 모평균이 같다는 귀무가설 H₀: μ₁ = μ₂를 검정합니다. 핵심은 <b>신호 대 잡음의 비율</b>입니다. 분자는 표본 평균의 차이(신호), 분모는 그 차이가 우연히 얼마나 흔들릴 수 있는지를 나타내는 표준오차(잡음)입니다.</p>
    <ul>
      <li>평균 차이가 클수록, 표준편차가 작을수록, 표본이 클수록 |t|가 커지고 p값은 작아집니다.</li>
      <li>p값은 "H₀가 참일 때 지금만큼 또는 그보다 극단적인 t가 나올 확률"입니다. 효과의 크기를 말해 주지는 않습니다.</li>
      <li>효과의 크기는 <em>Cohen's d</em>로 따로 보고합니다. 대략 0.2 작음, 0.5 중간, 0.8 큼입니다.</li>
    </ul>
    <p>등분산 가정이 의심되면(Levene 검정 p &lt; .05) 분산을 따로 추정하는 <b>Welch 검정</b>을 씁니다. 자유도가 소수점으로 줄어드는 것이 특징입니다. 두 집단의 n이 다르고 분산도 다를 때 차이가 커집니다.</p>`,
  formula: `<var>t</var> = (<var>x̄</var>₁ − <var>x̄</var>₂) / SE<br>
    SE<span class="c">(등분산)</span> = <var>s<sub>p</sub></var>·√(1/<var>n</var>₁ + 1/<var>n</var>₂), &nbsp; <var>s<sub>p</sub></var>² = [(<var>n</var>₁−1)<var>s</var>₁² + (<var>n</var>₂−1)<var>s</var>₂²] / (<var>n</var>₁+<var>n</var>₂−2)<br>
    SE<span class="c">(Welch)</span> = √(<var>s</var>₁²/<var>n</var>₁ + <var>s</var>₂²/<var>n</var>₂)<br>
    <var>d</var> = (<var>x̄</var>₁ − <var>x̄</var>₂) / <var>s<sub>p</sub></var>`,
  tasks: [
    '평균 50 vs 55, SD 10, n = 30으로 두고 p값을 확인하세요. n₁, n₂를 100으로 올리면 같은 평균 차이인데도 결론이 어떻게 바뀌나요?',
    'n을 200으로 키우고 B 평균을 51로 줄여 보세요. p &lt; .05인데 Cohen\'s d는 얼마인가요? "유의하다"와 "중요하다"의 차이를 설명해 보세요.',
    'A의 SD를 4, n₁을 150, B의 SD를 18, n₂를 15로 맞추고 Welch를 켰다 껐다 해 보세요. 자유도와 p값이 얼마나 달라지나요?',
    '두 평균을 같게(55 vs 55) 두고 "새 표본 뽑기"를 20번 눌러 보세요. p &lt; .05가 몇 번 나오나요? 1종 오류율 α와 연결해 보세요.',
  ],
  tools: {
    r: (p) => `set.seed(1)
A <- rnorm(${p.n1}, mean = ${p.m1}, sd = ${p.sd1})
B <- rnorm(${p.n2}, mean = ${p.m2}, sd = ${p.sd2})
df <- data.frame(score = c(A, B),
                 group = factor(rep(c("A", "B"), c(${p.n1}, ${p.n2}))))

# 등분산 검정 (Levene)
car::leveneTest(score ~ group, data = df, center = mean)

# 독립표본 t-검정 (var.equal = FALSE 이면 Welch)
t.test(score ~ group, data = df, var.equal = ${p.welch ? 'FALSE' : 'TRUE'})

# 효과크기
effectsize::cohens_d(score ~ group, data = df)`,
    spss: (p) => `* 메뉴: 분석 > 평균 비교 > 독립표본 T 검정
*   검정변수 = score, 집단변수 = group (집단 정의: 1, 2).
T-TEST GROUPS=group(1 2)
  /MISSING=ANALYSIS
  /VARIABLES=score
  /ES DISPLAY(TRUE)
  /CRITERIA=CI(.95).

* 출력의 'Levene의 등분산 검정' p ${p.welch ? '< .05 → "등분산을 가정하지 않음"(Welch) 행' : '≥ .05 → "등분산을 가정함" 행'}을 읽습니다.`,
  },
  init(ctx) {
    const row = ctx.row(), b1 = ctx.box("", row), b2 = ctx.box("", row);
    ctx.state.strip = ctx.plot({ x: [0.4, 2.6], y: [0, 100], height: 320, xTicks: 2, xFmt: (d) => (d === 1 ? '집단 A' : d === 2 ? '집단 B' : ''), yLabel: '점수', title: '두 집단의 관측값과 평균(±95% CI)' }, b1);
    ctx.state.tp = ctx.plot({ x: [-6, 6], y: [0, 0.45], height: 320, xLabel: 't', yLabel: '밀도', title: 'H₀가 참일 때의 t분포' }, b2);
    ctx.state.seed = 11;
    ctx.state.gen = () => {
      S.seed(ctx.state.seed);
      ctx.state.zA = S.rnormVec(200); ctx.state.zB = S.rnormVec(200);
      ctx.state.jA = Array.from({ length: 200 }, () => S.runif(-1, 1)); ctx.state.jB = Array.from({ length: 200 }, () => S.runif(-1, 1));
    };
    ctx.state.gen();
  },
  update(ctx, v, changed) {
    const st = ctx.state, C = Lab.C;
    if (changed === 'resample') { st.seed++; st.gen(); }
    const A = st.zA.slice(0, v.n1).map((z) => v.m1 + v.sd1 * z);
    const B = st.zB.slice(0, v.n2).map((z) => v.m2 + v.sd2 * z);
    const r = S.ttest2(A, B, !v.welch), lev = S.levene([A, B]);
    const tc = S.qt(0.975, r.df);

    // strip plot
    const sp = st.strip, all = A.concat(B), lo = Math.min(S.min(all), v.m1 - 2.5 * v.sd1, v.m2 - 2.5 * v.sd2), hi = Math.max(S.max(all), v.m1 + 2.5 * v.sd1, v.m2 + 2.5 * v.sd2);
    sp.setY([Math.floor(lo / 5) * 5, Math.ceil(hi / 5) * 5]); sp.clear();
    const rad = Math.max(2, Math.min(4, 60 / Math.sqrt(Math.max(v.n1, v.n2))));
    sp.dots(A.map((y, i) => [1 + st.jA[i] * 0.22, y]), { color: C.s1, r: rad, opacity: 0.55, ring: false, tip: (d) => `집단 A · ${S.f(d.y, 1)}` });
    sp.dots(B.map((y, i) => [2 + st.jB[i] * 0.22, y]), { color: C.s2, r: rad, opacity: 0.55, ring: false, tip: (d) => `집단 B · ${S.f(d.y, 1)}` });
    [[1, r.m1, r.sd1, v.n1], [2, r.m2, r.sd2, v.n2]].forEach(([x, m, s, n]) => {
      const half = S.qt(0.975, n - 1) * s / Math.sqrt(n);
      sp.segment(x + 0.33, m - half, x + 0.33, m + half, { color: C.ink, width: 2 });
      sp.segment(x + 0.29, m - half, x + 0.37, m - half, { color: C.ink, width: 2 });
      sp.segment(x + 0.29, m + half, x + 0.37, m + half, { color: C.ink, width: 2 });
      sp.segment(x - 0.3, m, x + 0.37, m, { color: C.ink, width: 2.5 });
      sp.text(x + 0.4, m, S.f(m, 1), { anchor: 'start', dy: 4 });
    });
    sp.legend([{ label: `A (n=${v.n1})`, color: C.s1, type: 'dot' }, { label: `B (n=${v.n2})`, color: C.s2, type: 'dot' }, { label: '평균 · 95% CI', color: C.ink, type: 'line' }]);

    // t distribution
    const tp = st.tp, f = (x) => S.dt(x, r.df), xs = S.linspace(-6, 6, 240), at = Math.abs(r.t);
    tp.clear();
    tp.shade(f, -6, -tc, { color: C.s8, opacity: 0.18 }); tp.shade(f, tc, 6, { color: C.s8, opacity: 0.18 });
    if (at < 6) { tp.shade(f, -6, -at, { color: C.s7, opacity: 0.45 }); tp.shade(f, at, 6, { color: C.s7, opacity: 0.45 }); }
    tp.line(xs.map((x) => [x, f(x)]), { color: C.ink2 });
    tp.vline(-tc, { color: C.s8, dash: true, width: 1 }); tp.vline(tc, { color: C.s8, dash: true, width: 1, label: `±${S.f(tc, 2)}`, labelY: 26 });
    const tx = S.clamp(r.t, -5.9, 5.9);
    tp.vline(tx, { color: C.marker, width: 2.5, label: `t = ${S.f(r.t, 2)}${Math.abs(r.t) > 5.9 ? ' →' : ''}`, anchor: tx > 0 ? 'end' : 'start' });
    tp.legend([{ label: '기각역 (α = .05, 양측)', color: C.s8, type: 'box' }, { label: `p값 영역`, color: C.s7, type: 'box' }]);

    const sig = r.p < 0.05, ad = Math.abs(r.d);
    const dWord = ad < 0.2 ? '아주 작은' : ad < 0.5 ? '작은' : ad < 0.8 ? '중간 크기의' : '큰';
    ctx.readout([
      { label: '평균 차 (A − B)', value: S.f(r.diff, 2), sub: `95% CI [${S.f(r.ci[0], 1)}, ${S.f(r.ci[1], 1)}]` },
      { label: `t (df = ${v.welch ? S.f(r.df, 1) : r.df})`, value: S.f(r.t, 3) },
      { label: 'p (양측)', value: S.fp(r.p), sub: sig ? 'H₀ 기각' : 'H₀ 유지', tone: sig ? 'accent' : null },
      { label: "Cohen's d", value: S.f(r.d, 2), sub: dWord + ' 효과' },
      { label: 'Levene 검정 p', value: S.fp(lev.p), sub: lev.p < 0.05 ? '등분산 위배 → Welch' : '등분산 가정 OK', tone: lev.p < 0.05 ? 'warn' : null },
    ]);
    let msg = `평균 차 ${S.f(r.diff, 2)}는 표준오차 ${S.f(r.se, 2)}의 <b>${S.f(at, 2)}배</b>입니다. 두 모평균이 같다면 이 정도 차이가 우연히 나올 확률은 <b>${S.fp(r.p).replace('< ', '')}</b>${r.p < 0.001 ? ' 미만' : ''}이므로 ` +
      (sig ? '유의수준 .05에서 귀무가설을 기각합니다.' : '귀무가설을 기각할 근거가 부족합니다.') + ` 효과크기는 d = ${S.f(r.d, 2)}로 ${dWord} 편입니다.`;
    if (sig && ad < 0.2) msg += ' 표본이 커서 아주 작은 차이도 유의하게 나왔습니다.';
    if (!sig && ad >= 0.5) msg += ' 효과는 작지 않은데 표본이 작아 검정력이 부족합니다.';
    if (lev.p < 0.05 && !v.welch) msg += ' Levene 검정이 유의하므로 Welch 검정을 켜는 것이 맞습니다.';
    ctx.insight(msg);
  },
});
