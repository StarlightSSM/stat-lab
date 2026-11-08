/* SPSS · 기술통계와 분포 모양 */
Lab.add({
  id: 'spss-descriptives', subject: 'spss', order: 1,
  title: '기술통계와 분포 모양', en: 'Descriptives · skewness, kurtosis, outliers',
  summary: '왜도·첨도·이상치를 직접 만들어 넣고 SPSS 기술통계량 표와 히스토그램, 상자도표가 어떻게 바뀌는지 봅니다.',
  keywords: 'descriptives 왜도 첨도 skewness kurtosis 이상치 boxplot 정규성',
  controls: [
    { type: 'slider', key: 'n', label: '표본크기 N', min: 30, max: 500, step: 10, value: 150 },
    { type: 'slider', key: 'skew', label: '비대칭 (왼쪽 ← → 오른쪽 꼬리)', min: -1, max: 1, step: 0.05, value: 0 },
    { type: 'slider', key: 'tail', label: '꼬리 두께 (극단값 비율)', min: 0, max: 0.3, step: 0.01, value: 0, fmt: (v) => S.pct(v, 0) },
    { type: 'slider', key: 'out', label: '입력 실수 이상치 개수', min: 0, max: 6, step: 1, value: 0, hint: '평균 + 4.5 SD 근처에 값을 끼워 넣습니다 (예: 75를 750으로 잘못 입력).' },
    { type: 'button', key: 'resample', label: '새 표본 뽑기', primary: true },
  ],
  concept: `
    <p><b>분석 &gt; 기술통계량 &gt; 기술통계</b>에서 [옵션]을 열고 왜도·첨도를 체크하면 아래와 같은 <em>기술통계량</em> 표가 나옵니다. 평균과 표준편차만 보지 말고 분포의 <b>모양</b>을 함께 확인해야 t검정·회귀 같은 모수 통계를 써도 되는지 판단할 수 있습니다.</p>
    <ul>
      <li><b>왜도(skewness)</b> : 0이면 대칭. 양수면 오른쪽 꼬리가 길고(소득, 반응시간), 음수면 왼쪽 꼬리가 깁니다(쉬운 시험 점수).</li>
      <li><b>첨도(kurtosis)</b> : SPSS는 정규분포를 0으로 맞춘 <i>초과첨도</i>를 보고합니다. 양수면 꼬리가 두껍고 극단값이 많습니다.</li>
      <li><b>표준오차</b> : 왜도÷표준오차가 ±1.96(엄격하게는 ±3.29)을 넘으면 "유의하게 비정규"라고 봅니다. 다만 N이 크면 아주 작은 비대칭도 유의해지므로, 실무에서는 <b>|왜도| &lt; 2, |첨도| &lt; 7</b> (Curran, West &amp; Finch, 1996) 같은 크기 기준을 함께 씁니다.</li>
    </ul>
    <p>상자도표에서 상자는 Q1~Q3(사분위범위, IQR), 가운데 선은 중앙값입니다. SPSS는 상자에서 1.5×IQR 넘게 떨어진 값을 ○(이상값), 3×IQR 넘게 떨어진 값을 *(극단값)로 표시합니다. 이상치 하나가 평균과 표준편차, 첨도를 얼마나 크게 흔드는지 슬라이더로 확인해 보세요.</p>`,
  formula: `왜도 = <var>n</var> / ((<var>n</var>−1)(<var>n</var>−2)) · Σ((<var>x</var>−x̄)/<var>s</var>)³<br>SE<sub>왜도</sub> = √( 6<var>n</var>(<var>n</var>−1) / ((<var>n</var>−2)(<var>n</var>+1)(<var>n</var>+3)) )<br>SE<sub>첨도</sub> = 2·SE<sub>왜도</sub> · √( (<var>n</var>²−1) / ((<var>n</var>−3)(<var>n</var>+5)) )`,
  tasks: [
    '비대칭을 0.8로 올려 보세요. 평균과 중앙값 중 어느 쪽이 꼬리 방향으로 더 끌려가나요?',
    '이상치를 1개만 넣고 첨도가 얼마나 변하는지 보세요. 표준편차는요?',
    'N을 500으로 두고 비대칭을 0.2로 맞추세요. 왜도÷SE가 1.96을 넘어도 |왜도| < 2 기준으로는 정상 범위입니다. 두 기준의 차이를 설명해 보세요.',
    '꼬리 두께를 20%로 올리면 왜도는 거의 그대로인데 첨도만 커집니다. 상자도표에 무엇이 생기나요?',
  ],
  tools: {
    spss: (p) => `* 메뉴: 분석 > 기술통계량 > 기술통계 > [옵션]에서 왜도, 첨도 체크
DESCRIPTIVES VARIABLES=score
  /STATISTICS=MEAN STDDEV MIN MAX SKEWNESS KURTOSIS.

* 상자도표와 정규성 검정: 분석 > 기술통계량 > 데이터 탐색 > [도표]
EXAMINE VARIABLES=score
  /PLOT BOXPLOT HISTOGRAM NPPLOT
  /STATISTICS DESCRIPTIVES.
* N = ${p.n}, 이상치 ${p.out}개를 넣은 상태`,
    r: (p) => `library(psych)
describe(df$score)        # skew, kurtosis(초과첨도), se 포함

# SPSS와 같은 공식(type = 2)
library(e1071)
skewness(df$score, type = 2)
kurtosis(df$score, type = 2)

boxplot(df$score, horizontal = TRUE)
hist(df$score, breaks = 25)   # N = ${p.n}`,
  },
  init(ctx) {
    const row = ctx.row();
    const left = ctx.box("", row), right = ctx.box("stage", row);
    ctx.state.hist = ctx.plot({ x: [0, 140], y: [0, 10], height: 260, xLabel: "점수", yLabel: "빈도", title: "히스토그램 + 정규곡선" }, left);
    ctx.state.box = ctx.plot({ x: [0, 140], y: [0, 1], height: 120, hideY: true, yTicks: 0, title: "상자도표 (○ 이상값, * 극단값)", margin: { l: 20 } }, right);
    ctx.state.q = ctx.box("", right);
    ctx.state.tbl = ctx.box("");
    ctx.state.seed = 1;
  },
  update(ctx, v, changed) {
    if (changed === 'resample') ctx.state.seed++;
    S.seed(ctx.state.seed);
    const s = 0.7 * v.skew, n = v.n;
    let x = [];
    for (let i = 0; i < n; i++) {
      let z = S.randn();
      if (S.rand() < v.tail) z *= 3;
      const t = Math.abs(s) < 1e-6 ? z : (Math.exp(s * z) - 1) / s;
      x.push(70 + 10 * t);
    }
    // standardise core to mean 70, sd 10 so sliders only change shape
    const m0 = S.mean(x), s0 = S.sd(x); x = x.map((u) => 70 + 10 * (u - m0) / s0);
    for (let k = 0; k < v.out; k++) x[k] = 70 + 10 * (4.5 + 0.4 * k);
    const N = x.length, mean = S.mean(x), sd = S.sd(x), mn = S.min(x), mx = S.max(x), med = S.median(x);
    const sk = S.skew(x), ku = S.kurt(x);
    const seS = Math.sqrt(6 * N * (N - 1) / ((N - 2) * (N + 1) * (N + 3))), seK = 2 * seS * Math.sqrt((N * N - 1) / ((N - 3) * (N + 5)));
    const C = Lab.C, hi = (s) => `<span class="hi">${s}</span>`;

    // histogram
    const lo = Math.min(20, Math.floor(mn / 5) * 5 - 5), up = Math.max(130, Math.ceil(mx / 5) * 5 + 5);
    const bins = S.bin(x, lo, up, Math.round((up - lo) / 4));
    const hp = ctx.state.hist; hp.setX([lo, up]);
    const ymax = Math.max(...bins.map((b) => b.n)); hp.setY([0, Math.max(5, ymax * 1.15)]);
    hp.clear();
    hp.hist(bins, { color: C.s4, tip: (b) => `${S.f(b.x0, 0)}–${S.f(b.x1, 0)}점<br><b>${b.n}명</b>` });
    const w = bins[0].x1 - bins[0].x0;
    hp.line(S.linspace(lo, up, 200).map((u) => [u, N * w * S.dnorm(u, mean, sd)]), { color: C.ink2, width: 1.5 });
    hp.vline(mean, { color: C.s1, label: '평균', anchor: mean > med ? 'start' : 'end' });
    hp.vline(med, { color: C.marker, dash: true, label: '중앙값', anchor: mean > med ? 'end' : 'start', labelY: 26 });
    hp.legend([{ label: '빈도', color: C.s4 }, { label: '같은 평균·SD의 정규곡선', color: C.ink2, type: 'line' }, { label: '평균', color: C.s1, type: 'line' }, { label: '중앙값', color: C.marker, type: 'dash' }]);

    // boxplot
    const q1 = S.quantile(x, 0.25), q3 = S.quantile(x, 0.75), iqr = q3 - q1;
    const inF = x.filter((u) => u >= q1 - 1.5 * iqr && u <= q3 + 1.5 * iqr), wl = S.min(inF), wh = S.max(inF);
    const bp = ctx.state.box; bp.setX([lo, up]); bp.clear();
    bp.rect(q1, q3, 0.25, 0.75, { color: C.s4, opacity: 0.35, layer: 'data' });
    [[q1, q1], [q3, q3]].forEach(([a]) => bp.segment(a, 0.25, a, 0.75, { color: C.ink, width: 1.2 }));
    bp.segment(q1, 0.75, q3, 0.75, { color: C.ink, width: 1.2 }); bp.segment(q1, 0.25, q3, 0.25, { color: C.ink, width: 1.2 });
    bp.segment(med, 0.25, med, 0.75, { color: C.marker, width: 2.5 });
    bp.segment(wl, 0.5, q1, 0.5, { color: C.ink2 }); bp.segment(q3, 0.5, wh, 0.5, { color: C.ink2 });
    bp.segment(wl, 0.38, wl, 0.62, { color: C.ink2 }); bp.segment(wh, 0.38, wh, 0.62, { color: C.ink2 });
    const outs = x.filter((u) => u < q1 - 1.5 * iqr || u > q3 + 1.5 * iqr);
    const ext = outs.filter((u) => u < q1 - 3 * iqr || u > q3 + 3 * iqr);
    outs.filter((u) => !ext.includes(u)).forEach((u) => bp.text(u, 0.5, '○', { dy: 4, size: 12, color: C.ink }));
    ext.forEach((u) => bp.text(u, 0.5, '*', { dy: 8, size: 18, color: C.bad }));
    bp.dots([...outs.map((u) => [u, 0.5])], { r: 7, opacity: 0, ring: false, tip: (d) => `${S.f(d.x, 1)}점 · ${ext.includes(d.x) ? '극단값 (3×IQR 밖)' : '이상값 (1.5×IQR 밖)'}` });

    // SPSS table
    ctx.state.tbl.innerHTML = Lab.spssTable({
      title: '기술통계량',
      head: ['', 'N', '최소값', '최대값', '평균', '표준편차', '왜도<br>통계량', '왜도<br>표준오차', '첨도<br>통계량', '첨도<br>표준오차'],
      rows: [
        ['점수', N, S.f(mn, 2), S.f(mx, 2), hi(S.f(mean, 2)), hi(S.f(sd, 3)), hi(S.f(sk, 3)), S.f(seS, 3), hi(S.f(ku, 3)), S.f(seK, 3)],
        ['유효 N(목록별)', N, '', '', '', '', '', '', '', ''],
      ],
      note: `읽는 법: 왜도 ${S.f(sk, 2)} ÷ 표준오차 ${S.f(seS, 3)} = <b>${S.f(sk / seS, 2)}</b>, 첨도 ${S.f(ku, 2)} ÷ ${S.f(seK, 3)} = <b>${S.f(ku / seK, 2)}</b>. |값| &gt; 1.96이면 5% 수준에서 정규분포와 다르다고 봅니다.`,
    });
    ctx.state.q.innerHTML = Lab.spssTable({ title: '사분위수 (데이터 탐색)', head: ['', 'Q1 (25%)', '중앙값', 'Q3 (75%)', 'IQR'], rows: [['점수', S.f(q1, 2), S.f(med, 2), S.f(q3, 2), S.f(iqr, 2)]] });

    const okS = Math.abs(sk) < 2, okK = Math.abs(ku) < 7;
    ctx.readout([
      { label: '평균 − 중앙값', value: S.f(mean - med, 2), sub: mean > med ? '평균이 오른쪽으로 끌림' : mean < med ? '평균이 왼쪽으로 끌림' : '같음' },
      { label: '왜도 / SE', value: S.f(sk / seS, 2), tone: Math.abs(sk / seS) > 1.96 ? 'warn' : null, sub: '|z| > 1.96 → 유의' },
      { label: '|왜도| < 2 ?', value: okS ? '충족' : '위반', tone: okS ? 'good' : 'bad' },
      { label: '|첨도| < 7 ?', value: okK ? '충족' : '위반', tone: okK ? 'good' : 'bad' },
      { label: '상자도표 이상치', value: `${outs.length}개`, sub: `극단값 ${ext.length}개` },
    ]);
    let msg;
    if (v.out > 0) msg = `입력 실수 ${v.out}개가 들어가자 표준편차가 ${S.f(sd, 2)}로, 첨도가 ${S.f(ku, 2)}로 바뀌었습니다. 분석 전에 상자도표의 ${ext.length ? '*' : '○'} 표시부터 확인해 원자료를 고치는 것이 먼저입니다.`;
    else if (Math.abs(sk) > 0.5) msg = `왜도 ${S.f(sk, 2)}: ${sk > 0 ? '오른쪽' : '왼쪽'} 꼬리가 길어 평균(${S.f(mean, 1)})이 중앙값(${S.f(med, 1)})보다 ${sk > 0 ? '크게' : '작게'} 나옵니다. ${okS ? '크기 기준(|왜도|<2)으로는 아직 모수 통계를 쓸 수 있는 범위입니다.' : '크기 기준도 넘었으니 로그 변환이나 비모수 검정을 고려하세요.'}`;
    else if (ku > 1) msg = `분포는 대칭에 가깝지만 첨도가 ${S.f(ku, 2)}로 꼬리가 두껍습니다. 극단값이 정규분포보다 자주 나온다는 뜻입니다.`;
    else msg = `왜도 ${S.f(sk, 2)}, 첨도 ${S.f(ku, 2)}로 정규분포에 가까운 모양입니다. 평균과 중앙값도 거의 같습니다.`;
    ctx.insight(msg);
  },
});
