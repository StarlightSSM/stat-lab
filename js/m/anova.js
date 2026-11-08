/* 일원분산분석: between vs within variability, F distribution, SS decomposition, Bonferroni post-hoc. */
Lab.add({
  id: 'anova', subject: 'prob', order: 11,
  title: '일원분산분석 (ANOVA)', en: 'One-way analysis of variance',
  summary: '세 개 이상 집단의 평균을 한 번에 비교합니다. 집단 간 차이와 집단 내 흩어짐의 비율인 F가 어떻게 만들어지는지 눈으로 확인합니다.',
  keywords: 'anova f검정 분산분석 사후검정 tukey bonferroni eta',
  controls: [
    { type: 'select', key: 'k', label: '집단 수', options: [[3, '3개 집단'], [4, '4개 집단']], value: 3 },
    { type: 'slider', key: 'm1', label: '집단 A 평균', min: 40, max: 70, step: 0.5, value: 50 },
    { type: 'slider', key: 'm2', label: '집단 B 평균', min: 40, max: 70, step: 0.5, value: 54 },
    { type: 'slider', key: 'm3', label: '집단 C 평균', min: 40, max: 70, step: 0.5, value: 58 },
    { type: 'slider', key: 'm4', label: '집단 D 평균 (4집단일 때)', min: 40, max: 70, step: 0.5, value: 52 },
    { type: 'slider', key: 'sd', label: '집단 내 표준편차 σ', min: 2, max: 20, step: 0.5, value: 8 },
    { type: 'slider', key: 'n', label: '집단당 표본크기 n', min: 5, max: 100, step: 1, value: 20 },
    { type: 'button', key: 'resample', label: '새 표본 뽑기', primary: true },
  ],
  concept: `
    <p>t-검정을 여러 번 반복하면 1종 오류가 쌓입니다(세 집단이면 비교 3번, α가 약 .14로 커짐). 분산분석은 "모든 집단의 모평균이 같다"는 H₀ 하나를 <b>F 검정 한 번</b>으로 검정합니다.</p>
    <ul>
      <li><b>집단 간 변동(SSB)</b>: 각 집단 평균이 전체 평균에서 얼마나 떨어져 있는가. 그림의 주황 세로선입니다.</li>
      <li><b>집단 내 변동(SSW)</b>: 같은 집단 안에서 관측값이 자기 집단 평균 주위로 얼마나 흩어지는가. 오차라고 봅니다.</li>
      <li>각각을 자유도로 나눈 평균제곱(MS)의 비율이 <em>F = MSB / MSW</em>입니다. H₀가 참이면 F는 1 근처에 머뭅니다.</li>
    </ul>
    <p><b>η²(에타제곱)</b> = SSB / SST는 전체 변동 중 집단 차이로 설명되는 비율로, 효과크기로 보고합니다(.01 작음, .06 중간, .14 큼).</p>
    <p>F가 유의하다는 것은 "적어도 한 쌍은 다르다"는 뜻일 뿐입니다. 어느 쌍이 다른지는 <b>사후검정</b>(Tukey HSD, Bonferroni, Scheffé 등)으로 확인합니다. 전제는 정규성, 등분산성, 관측의 독립성입니다.</p>`,
  formula: `SST = SSB + SSW<br>
    SSB = Σ <var>n<sub>j</sub></var>(<var>x̄<sub>j</sub></var> − <var>x̄</var>)² &nbsp; <span class="c">df₁ = k − 1</span><br>
    SSW = Σ Σ (<var>x<sub>ij</sub></var> − <var>x̄<sub>j</sub></var>)² &nbsp; <span class="c">df₂ = N − k</span><br>
    <var>F</var> = (SSB/df₁) / (SSW/df₂), &nbsp; η² = SSB / SST`,
  tasks: [
    '세 평균을 모두 55로 맞추고 "새 표본 뽑기"를 여러 번 눌러 보세요. F가 대체로 1 근처에 머무는 이유는 무엇인가요?',
    '평균은 50 / 54 / 58 그대로 두고 σ를 4와 16으로 바꿔 보세요. 집단 간 거리는 같은데 F와 η²가 어떻게 달라지나요?',
    '평균을 50 / 50 / 60으로 두면 사후검정 표에서 어떤 쌍만 유의하게 나오나요?',
    '4집단으로 바꾸고 D를 A와 같게 맞춰 보세요. 집단이 하나 늘었을 때 df₁과 임계 F값은 어떻게 변하나요?',
  ],
  tools: {
    r: (p) => {
      const ms = [p.m1, p.m2, p.m3, p.m4].slice(0, p.k), L = 'ABCD'.slice(0, p.k).split('');
      return `set.seed(1)
means <- c(${ms.join(', ')})
df <- data.frame(
  group = factor(rep(c(${L.map((l) => `"${l}"`).join(', ')}), each = ${p.n})),
  score = rnorm(${p.k * p.n}, mean = rep(means, each = ${p.n}), sd = ${p.sd})
)

fit <- aov(score ~ group, data = df)
summary(fit)                       # F, p
effectsize::eta_squared(fit)       # η²
car::leveneTest(score ~ group, df) # 등분산
TukeyHSD(fit)                      # 사후검정
pairwise.t.test(df$score, df$group, p.adjust.method = "bonferroni")`;
    },
    spss: (p) => `* 메뉴: 분석 > 평균 비교 > 일원배치 분산분석
*   종속변수 = score, 요인 = group (1~${p.k})
*   [사후분석] Tukey, Bonferroni 체크 / [옵션] 기술통계, 분산 동질성 검정 체크
ONEWAY score BY group
  /ES=OVERALL
  /STATISTICS DESCRIPTIVES HOMOGENEITY WELCH
  /MISSING ANALYSIS
  /CRITERIA=CILEVEL(0.95)
  /POSTHOC=TUKEY BONFERRONI ALPHA(0.05).`,
  },
  init(ctx) {
    const row = ctx.row(), a = ctx.box('', row), b = ctx.box('', row);
    ctx.state.strip = ctx.plot({ x: [0.4, 3.6], y: [20, 90], height: 320, xTicks: 4, yLabel: '점수', title: '집단별 관측값 · 집단 평균 · 전체 평균' }, a);
    ctx.state.fp = ctx.plot({ x: [0, 10], y: [0, 1], height: 320, xLabel: 'F', yLabel: '밀도', title: 'H₀가 참일 때의 F분포' }, b);
    ctx.state.ss = ctx.plot({ x: [0, 1], y: [0, 1], height: 96, xTicks: 5, yTicks: 0, xFmt: d3.format('.0%'), hideY: true, margin: { l: 14, r: 18, b: 26, t: 6 }, title: '전체 변동(SST)의 분해' });
    ctx.state.post = ctx.box('posthoc');
    ctx.state.seed = 21;
    ctx.state.gen = () => { S.seed(ctx.state.seed); ctx.state.z = [0, 1, 2, 3].map(() => S.rnormVec(100)); ctx.state.j = [0, 1, 2, 3].map(() => Array.from({ length: 100 }, () => S.runif(-1, 1))); };
    ctx.state.gen();
  },
  update(ctx, v, changed) {
    const st = ctx.state, C = Lab.C, k = +v.k, L = ['A', 'B', 'C', 'D'], cols = [C.s1, C.s2, C.s3, C.s4];
    if (changed === 'resample') { st.seed++; st.gen(); }
    const mus = [v.m1, v.m2, v.m3, v.m4].slice(0, k);
    const groups = mus.map((m, g) => st.z[g].slice(0, v.n).map((z) => m + v.sd * z));
    const r = S.anova1(groups), fc = S.qf(0.95, r.df1, r.df2);

    // strip
    const sp = st.strip, all = groups.flat();
    sp.setX([0.4, k + 0.6]); sp.o.xFmt = (d) => (Number.isInteger(d) && d >= 1 && d <= k ? `${L[d - 1]} (x̄ ${S.f(r.means[d - 1], 1)})` : '');
    sp.setY([Math.floor(Math.min(S.min(all), 30) / 10) * 10, Math.ceil(Math.max(S.max(all), 80) / 10) * 10]);
    sp.clear();
    const rad = Math.max(2, Math.min(4, 40 / Math.sqrt(v.n)));
    sp.hline(r.grand, { color: C.ink2, dash: true, width: 1.2 });
    groups.forEach((g, gi) => {
      const x = gi + 1, m = r.means[gi];
      sp.dots(g.map((y, i) => [x - 0.08 + st.j[gi][i] * 0.2, y]), { color: cols[gi], r: rad, opacity: 0.5, ring: false, tip: (d) => `집단 ${L[gi]} · ${S.f(d.y, 1)}` });
      sp.segment(x + 0.22, r.grand, x + 0.22, m, { color: C.marker, width: 3 });
      sp.segment(x - 0.32, m, x + 0.3, m, { color: C.ink, width: 2.5 });
    });
    sp.legend([{ label: '집단 평균', color: C.ink, type: 'line' }, { label: `전체 평균 ${S.f(r.grand, 1)}`, color: C.ink2, type: 'dash' }, { label: '집단 평균 − 전체 평균 (집단 간 편차)', color: C.marker, type: 'line' }]);

    // F distribution
    const fp = st.fp, xmax = Math.max(6, Math.min(30, Math.max(fc * 2.2, r.F * 1.15)));
    const f = (x) => S.df(x, r.df1, r.df2), xs = S.linspace(0.01, xmax, 240);
    const ymax = Math.min(1.2, Math.max(...xs.map(f)) * 1.15);
    fp.setX([0, xmax]); fp.setY([0, ymax]); fp.clear();
    fp.shade(f, fc, xmax, { color: C.s8, opacity: 0.18 });
    if (r.F < xmax) fp.shade(f, r.F, xmax, { color: C.s7, opacity: 0.45 });
    fp.line(xs.map((x) => [x, Math.min(f(x), ymax * 1.5)]), { color: C.ink2 });
    fp.vline(fc, { color: C.s8, dash: true, width: 1, label: `임계 F ${S.f(fc, 2)}`, labelY: 28 });
    const fx = Math.min(r.F, xmax * 0.985);
    fp.vline(fx, { color: C.marker, width: 2.5, label: `F = ${S.f(r.F, 2)}`, anchor: fx > xmax * 0.6 ? 'end' : 'start' });
    fp.legend([{ label: `F(${r.df1}, ${r.df2}) 분포`, color: C.ink2, type: 'line' }, { label: '기각역 α = .05', color: C.s8, type: 'box' }, { label: 'p값 영역', color: C.s7, type: 'box' }]);

    // SS bar
    const ss = st.ss, fb = r.ssb / r.sst; ss.clear();
    ss.rect(0, fb, 0.12, 0.88, { color: C.marker, opacity: 0.85, layer: 'data' });
    ss.rect(fb, 1, 0.12, 0.88, { color: C.s1, opacity: 0.3, layer: 'data' });
    if (fb > 0.16) ss.text(fb / 2, 0.5, `SSB ${S.pct(fb, 0)}`, { dy: 4 });
    ss.text(fb + (1 - fb) / 2, 0.5, `SSW (오차) ${S.pct(1 - fb, 0)}`, { dy: 4 });

    // post-hoc (Bonferroni with pooled MSW)
    const pairs = [], m = k * (k - 1) / 2;
    for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
      const diff = r.means[i] - r.means[j], se = Math.sqrt(r.msw * 2 / v.n), t = diff / se, praw = 2 * (1 - S.pt(Math.abs(t), r.df2));
      pairs.push({ lab: `${L[i]} − ${L[j]}`, diff, se, p: Math.min(1, praw * m) });
    }
    st.post.innerHTML = `<div class="spss-out"><div class="spss-title">사후검정 · 다중비교 (Bonferroni)</div><div class="spss-sub">종속변수: score · 오차 MS = ${S.f(r.msw, 2)}</div>` +
      Lab.dataTable({ head: ['비교', '평균 차', '표준오차', '보정 p', ''], rows: pairs.map((q) => [q.lab, S.f(q.diff, 2), S.f(q.se, 2), S.fp(q.p), q.p < 0.05 ? '유의 *' : '']), highlight: (i) => pairs[i].p < 0.05 }) + '</div>';

    const sig = r.p < 0.05, sigPairs = pairs.filter((q) => q.p < 0.05).map((q) => q.lab);
    ctx.readout([
      { label: `F(${r.df1}, ${r.df2})`, value: S.f(r.F, 2) },
      { label: 'p', value: S.fp(r.p), sub: sig ? 'H₀ 기각' : 'H₀ 유지', tone: sig ? 'accent' : null },
      { label: 'η² (효과크기)', value: S.apa(r.eta2, 3), sub: r.eta2 < 0.01 ? '매우 작음' : r.eta2 < 0.06 ? '작음' : r.eta2 < 0.14 ? '중간' : '큼' },
      { label: 'MS 집단 간', value: S.f(r.msb, 1), sub: `SSB ${S.f(r.ssb, 0)} / ${r.df1}` },
      { label: 'MS 집단 내', value: S.f(r.msw, 1), sub: `SSW ${S.f(r.ssw, 0)} / ${r.df2}` },
    ]);
    let msg = `집단 평균들 사이의 흩어짐(MSB ${S.f(r.msb, 1)})이 집단 안의 흩어짐(MSW ${S.f(r.msw, 1)})의 <b>${S.f(r.F, 2)}배</b>입니다. `;
    msg += sig ? `F가 임계값 ${S.f(fc, 2)}를 넘어 "모든 평균이 같다"는 가설을 기각합니다. 사후검정에서 유의한 쌍은 <b>${sigPairs.length ? sigPairs.join(', ') : '없음'}</b>입니다.` + (sigPairs.length ? '' : ' 전체 F는 유의해도 개별 쌍 비교는 보정 때문에 더 보수적입니다.')
      : `F가 임계값 ${S.f(fc, 2)}보다 작아 평균 차이를 우연으로 설명할 수 있습니다. 이때는 사후검정을 해석하지 않습니다.`;
    msg += ` 전체 변동의 ${S.pct(r.eta2, 1)}가 집단 차이로 설명됩니다.`;
    ctx.insight(msg);
  },
});
