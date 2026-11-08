/* 행동연구방법론 · 심슨의 역설 */
Lab.add({
  id: 'rm-simpson', subject: 'rm', order: 8,
  title: '심슨의 역설', en: "Simpson's paradox · pooled vs within-group",
  summary: '집단마다 보면 음의 관계인데 모두 합치면 양의 관계가 되는 현상을, 집단 내 기울기와 집단 간 차이를 따로 조절하며 만들어 봅니다.',
  keywords: "simpson 심슨 역설 생태학적 오류 집단 층화 고정효과 다층 aggregation",
  controls: [
    { type: 'slider', key: 'w', label: '집단 내 기울기', min: -1.5, max: 1.5, step: 0.05, value: -0.6, hint: '같은 반 안에서 공부시간 1시간당 점수 변화' },
    { type: 'slider', key: 'gap', label: '집단 간 차이', min: 0, max: 4, step: 0.1, value: 2.2, hint: '반이 바뀔 때 평균 공부시간·점수가 함께 오르는 정도' },
    { type: 'slider', key: 'g', label: '집단 수', min: 2, max: 5, step: 1, value: 4 },
    { type: 'slider', key: 'n', label: '집단당 인원', min: 10, max: 80, step: 5, value: 40 },
    { type: 'toggle', key: 'color', label: '집단별 색 구분', value: true },
    { type: 'toggle', key: 'lines', label: '집단별 회귀선', value: true },
    { type: 'button', key: 'resample', label: '새 표본 뽑기', primary: true },
  ],
  concept: `
    <p>심슨의 역설은 전체 자료에서 본 관계와 하위 집단에서 본 관계의 <b>방향이 뒤집히는</b> 현상입니다. 각 반 안에서는 공부시간이 많은 학생이 점수가 낮은데(예: 어려움을 겪는 학생이 오래 공부), 상위 반일수록 공부시간과 점수가 모두 높으면 합친 자료에서는 양의 상관이 나타납니다.</p>
    <p>두 기울기는 서로 다른 질문에 답합니다.</p>
    <ul>
      <li><b>전체(합동) 기울기</b>: 집단 간 차이와 집단 내 차이가 섞인 값</li>
      <li><b>집단 내 기울기</b>: 집단을 통제했을 때(고정효과, 층화 분석) 개인 수준의 관계</li>
    </ul>
    <p>어느 쪽이 "맞는지"는 통계가 아니라 인과 구조가 정합니다. 집단이 처치와 결과 모두에 영향을 주는 교란변수라면 집단을 통제해야 합니다. 집단 수준 자료로 개인 수준 결론을 내리는 것은 <em>생태학적 오류</em>입니다. 유명한 사례로 1973년 UC 버클리 대학원 입학 자료가 있습니다. 전체로는 여성 합격률이 낮았지만, 학과별로 나누면 그 차이가 사라지거나 반대가 되었습니다.</p>`,
  formula: `점수<sub>ij</sub> = α<sub>j</sub> + β<sub>within</sub>·시간<sub>ij</sub> + ε<sub>ij</sub> &nbsp;<span class="c">(j = 집단)</span><br>합동 회귀: 점수 = α + β<sub>pooled</sub>·시간 + ε<br>β<sub>pooled</sub>는 β<sub>within</sub>과 집단 간 기울기 β<sub>between</sub>의 가중 혼합`,
  tasks: [
    '집단 간 차이를 0으로 내리면 합동 기울기와 집단 내 기울기가 같아지는지 확인하세요.',
    '집단 내 기울기 −0.6에서 집단 간 차이를 천천히 올려, 합동 기울기의 부호가 바뀌는 지점을 찾으세요.',
    '색 구분과 집단별 회귀선을 끄고 보세요. 집단 정보를 모르는 연구자는 어떤 결론을 내릴까요?',
    '집단 내 기울기를 양수로 바꾸면 역설이 사라집니다. 역설이 생기려면 무엇과 무엇의 부호가 달라야 하나요?',
  ],
  tools: {
    r: (p) => `# 합동 회귀 vs 집단 통제 회귀
coef(lm(score ~ hours, data = df))              # 전체 기울기
coef(lm(score ~ hours + factor(class), data = df))  # 집단 고정효과 = 집단 내 기울기

# 집단별 기울기
library(dplyr)
df %>% group_by(class) %>% summarise(slope = coef(lm(score ~ hours))[2])

# 다층모형: 집단 평균 중심화로 within/between 분리
library(lme4)
df <- df %>% group_by(class) %>% mutate(h_mean = mean(hours), h_within = hours - h_mean)
lmer(score ~ h_within + h_mean + (1 | class), data = df)
# 현재 설정: 집단 내 기울기 = ${p.w}, 집단 간 차이 = ${p.gap}, 집단 수 = ${p.g}`,
    spss: () => `* 전체 회귀
REGRESSION /DEPENDENT score /METHOD=ENTER hours.

* 집단별 회귀: 데이터 > 파일 분할 (집단별 출력)
SORT CASES BY class.
SPLIT FILE SEPARATE BY class.
REGRESSION /DEPENDENT score /METHOD=ENTER hours.
SPLIT FILE OFF.

* 집단을 통제한 회귀 (일반선형모형 > 일변량)
UNIANOVA score BY class WITH hours /PRINT=PARAMETER /DESIGN=class hours.`,
  },
  init(ctx) {
    ctx.state.p = ctx.plot({ x: [0, 10], y: [0, 10], height: 340, xLabel: '공부시간 (주당, 시간)', yLabel: '시험 점수 (표준화 척도)' });
    ctx.state.seed = 12;
  },
  update(ctx, v, changed) {
    const st = ctx.state, C = Lab.C;
    if (changed === 'resample') st.seed++;
    S.seed(st.seed);
    const cols = [C.s1, C.s2, C.s3, C.s7, C.s5];
    const G = v.g, data = [];
    for (let j = 0; j < G; j++) {
      const cx = 2 + j * v.gap * 0.9, cy = 2 + j * v.gap * 1.1;
      for (let i = 0; i < v.n; i++) { const x = cx + S.randn(0, 0.9); data.push({ x, y: cy + v.w * (x - cx) + S.randn(0, 0.55), g: j }); }
    }
    const xs = data.map((d) => d.x), ys = data.map((d) => d.y);
    const pooled = S.ols(xs.map((x) => [x]), ys);
    const fe = S.ols(data.map((d) => [d.x, ...Array.from({ length: G - 1 }, (_, k) => (d.g === k + 1 ? 1 : 0))]), ys);
    const groupFits = Array.from({ length: G }, (_, j) => { const dd = data.filter((d) => d.g === j); return { j, m: S.ols(dd.map((d) => [d.x]), dd.map((d) => d.y)), x0: S.min(dd.map((d) => d.x)), x1: S.max(dd.map((d) => d.x)) }; });
    const xlo = Math.floor(S.min(xs)) - 0.5, xhi = Math.ceil(S.max(xs)) + 0.5, ylo = Math.floor(S.min(ys)) - 0.5, yhi = Math.ceil(S.max(ys)) + 0.5;
    const p = st.p; p.setX([xlo, xhi]).setY([ylo, yhi]); p.clear();
    const show = data.filter((_, i) => i % Math.ceil(data.length / 380) === 0);
    p.dots(show.map((d) => ({ x: d.x, y: d.y, color: v.color ? cols[d.g] : C.muted })), { r: 3.4, opacity: 0.6, ring: false, tip: (d) => `시간 ${S.f(d.x, 1)} · 점수 ${S.f(d.y, 1)}` });
    if (v.lines) groupFits.forEach(({ j, m, x0, x1 }) => p.line([[x0, m.b[0] + m.b[1] * x0], [x1, m.b[0] + m.b[1] * x1]], { color: v.color ? cols[j] : C.ink2, width: 2.5 }));
    p.line([[xlo, pooled.b[0] + pooled.b[1] * xlo], [xhi, pooled.b[0] + pooled.b[1] * xhi]], { color: C.ink, width: 2.5, dash: '7 5' });
    const lg = [{ label: `전체 합동 회귀 (기울기 ${S.f(pooled.b[1], 2)})`, color: C.ink, type: 'dash' }];
    if (v.color) groupFits.forEach(({ j }) => lg.push({ label: `${j + 1}반`, color: cols[j], type: v.lines ? 'line' : 'dot' }));
    p.legend(lg);

    const within = fe.b[1], reversed = Math.sign(within) !== Math.sign(pooled.b[1]) && Math.abs(within) > 0.05 && Math.abs(pooled.b[1]) > 0.05;
    const rPooled = S.cor(xs, ys);
    ctx.readout([
      { label: '전체 합동 기울기', value: S.f(pooled.b[1], 3), sub: `r = ${S.apa(rPooled, 2)}`, tone: reversed ? 'bad' : null },
      { label: '집단 내 기울기 (고정효과)', value: S.f(within, 3), sub: `설정값 ${v.w}`, tone: 'accent' },
      { label: '집단별 기울기 범위', value: `${S.f(Math.min(...groupFits.map((g) => g.m.b[1])), 2)} ~ ${S.f(Math.max(...groupFits.map((g) => g.m.b[1])), 2)}` },
      { label: '역설 발생', value: reversed ? '예, 방향 반전' : '아니요', tone: reversed ? 'bad' : 'good' },
    ]);
    let msg;
    if (reversed) msg = `각 반 안에서는 공부시간이 1시간 늘 때 점수가 <b>${S.f(within, 2)}</b> 변하지만, 반을 무시하고 합치면 기울기가 <b>${S.f(pooled.b[1], 2)}</b>로 방향이 뒤집힙니다. 상위 반일수록 공부시간과 점수가 모두 높기 때문입니다.`;
    else if (v.gap < 0.3) msg = `집단 간 차이가 거의 없어 합동 기울기(${S.f(pooled.b[1], 2)})와 집단 내 기울기(${S.f(within, 2)})가 비슷합니다. 집단이 교란변수 역할을 하지 않습니다.`;
    else if (Math.sign(within) === Math.sign(pooled.b[1])) msg = `집단 간 차이와 집단 내 관계의 방향이 같아 역설은 없지만, 합동 기울기(${S.f(pooled.b[1], 2)})가 집단 내 기울기(${S.f(within, 2)})보다 ${Math.abs(pooled.b[1]) > Math.abs(within) ? '부풀려져' : '줄어들어'} 있습니다.`;
    else msg = `합동 기울기가 0 근처(${S.f(pooled.b[1], 2)})입니다. 집단 간 양의 관계와 집단 내 음의 관계가 거의 상쇄되었습니다.`;
    ctx.insight(msg);
  },
});
