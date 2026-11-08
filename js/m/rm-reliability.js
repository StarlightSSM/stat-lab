/* 행동연구방법론 · 신뢰도: Cronbach's alpha */
Lab.add({
  id: 'rm-reliability', subject: 'rm', order: 1,
  title: "신뢰도: Cronbach's α", en: "Internal consistency · Cronbach's alpha",
  summary: '문항 수와 문항 간 평균 상관이 α를 어떻게 결정하는지, 불량 문항 하나가 척도를 얼마나 망가뜨리는지 실험합니다.',
  keywords: 'reliability cronbach alpha 내적일관성 spearman-brown 역문항',
  controls: [
    { type: 'slider', key: 'k', label: '문항 수 k', min: 2, max: 20, step: 1, value: 6 },
    { type: 'slider', key: 'r', label: '문항 간 평균 상관 r̄', min: 0.05, max: 0.8, step: 0.01, value: 0.3 },
    { type: 'slider', key: 'n', label: '응답자 수 n', min: 30, max: 500, step: 10, value: 150 },
    { type: 'select', key: 'bad', label: '마지막 문항 상태', options: [['none', '정상'], ['noise', '무관한 문항'], ['reverse', '역문항 미변환']], value: 'none' },
    { type: 'button', key: 'resample', label: '새 응답자 뽑기', primary: true },
  ],
  concept: `
    <p>신뢰도는 같은 것을 반복해서 재면 같은 값이 나오는 정도입니다. 설문 척도에서는 여러 문항이 하나의 구성개념을 <b>일관되게</b> 재는지를 <em>내적일관성</em>으로 보고, 그 대표 지표가 Cronbach의 α입니다.</p>
    <p>α는 두 가지로 커집니다. 문항끼리 상관이 높을수록, 그리고 <b>문항 수가 많을수록</b> 커집니다. 그래서 상관이 낮은 문항이라도 20개쯤 모으면 α가 .80을 넘을 수 있습니다. α가 높다고 해서 척도가 한 가지 개념만 잰다는 뜻(단일차원성)은 아닙니다.</p>
    <ul>
      <li>관례적 기준: .70 이상이면 수용, .80 이상이면 양호, 탐색 연구는 .60도 허용</li>
      <li>.95 이상이면 문항이 서로 거의 같은 말을 반복하는지 의심해 봅니다</li>
      <li><b>문항 삭제 시 α</b>가 전체 α보다 크게 높아지는 문항은 척도와 따로 노는 문항입니다</li>
    </ul>
    <p>가장 흔한 실수는 역문항(예: "나는 내 일이 지루하다")을 역코딩하지 않고 합산하는 것입니다. 그 문항은 다른 문항과 음의 상관을 가져 α를 크게 떨어뜨립니다.</p>`,
  formula: `α = <var>k</var>/(<var>k</var>−1) · (1 − Σσ²<sub>i</sub> / σ²<sub>total</sub>)<br>표준화 α (Spearman–Brown) = <var>k</var>·r̄ / (1 + (<var>k</var>−1)·r̄)`,
  tasks: [
    'r̄ = 0.15로 낮춘 뒤 문항 수 k를 2에서 20까지 늘려 보세요. α가 .70을 넘는 문항 수는 몇 개인가요?',
    "마지막 문항을 '역문항 미변환'으로 바꾸고 오른쪽 그래프에서 그 문항을 삭제했을 때의 α를 확인하세요.",
    'n = 30과 n = 500에서 새 응답자를 여러 번 뽑아 보세요. 표본 α가 이론값 주위에서 흔들리는 폭을 비교하세요.',
    "k = 6, r̄ = 0.8일 때 α는 얼마인가요? 이 값이 '좋은 척도'의 증거인지 생각해 보세요.",
  ],
  tools: {
    r: (p) => `library(psych)
# q1 ~ q${p.k}: 같은 구성개념을 재는 문항
items <- df[, paste0("q", 1:${p.k})]
${p.bad === 'reverse' ? `# 역문항은 먼저 역코딩 (5점 척도라면 6 - x)
items$q${p.k} <- 6 - items$q${p.k}
` : ''}alpha(items)          # raw_alpha, std.alpha, 'Reliability if an item is dropped'
# 이론값: Spearman-Brown
k <- ${p.k}; r <- ${p.r}
k * r / (1 + (k - 1) * r)`,
    spss: (p) => `* 분석 > 척도분석 > 신뢰도 분석, 통계량에서 '항목 제거시 척도' 체크.
${p.bad === 'reverse' ? `* 역문항은 먼저 변환 > 같은 변수로 코딩변경.
RECODE q${p.k} (1=5) (2=4) (3=3) (4=2) (5=1).
EXECUTE.
` : ''}RELIABILITY
  /VARIABLES=q1 TO q${p.k}
  /SCALE('ALL VARIABLES') ALL
  /MODEL=ALPHA
  /STATISTICS=DESCRIPTIVE CORR
  /SUMMARY=TOTAL.`,
  },
  init(ctx) {
    const row = ctx.row(), c1 = ctx.box("", row), c2 = ctx.box("", row); // placeholders first so each plot measures half width
    ctx.state.sb = ctx.plot({ x: [1, 30], y: [0, 1], height: 290, xLabel: '문항 수 k', yLabel: "Cronbach's α", title: '문항 수에 따른 α (Spearman–Brown)' }, c1);
    ctx.state.del = ctx.plot({ xBand: ['Q1'], y: [0, 1], height: 290, xLabel: '삭제한 문항', yLabel: '삭제 시 α', title: '문항 삭제 시 α' }, c2);
    ctx.state.seed = 11;
  },
  update(ctx, v, changed) {
    const st = ctx.state, C = Lab.C;
    if (changed === 'resample') st.seed++;
    S.seed(st.seed);
    const k = v.k, lam = Math.sqrt(v.r);
    const loads = Array.from({ length: k }, (_, j) => (j === k - 1 && v.bad === 'noise' ? 0 : j === k - 1 && v.bad === 'reverse' ? -lam : lam));
    const items = loads.map(() => []);
    for (let i = 0; i < v.n; i++) {
      const f = S.randn();
      loads.forEach((l, j) => items[j].push(l * f + Math.sqrt(1 - l * l) * S.randn()));
    }
    const alpha = S.cronbach(items);
    let rs = 0, cnt = 0;
    for (let a = 0; a < k; a++) for (let b = a + 1; b < k; b++) { rs += S.cor(items[a], items[b]); cnt++; }
    const rbarS = rs / cnt;
    const theo = S.alphaFromR(k, v.r);
    const dels = k > 2 ? items.map((_, j) => S.cronbach(items.filter((__, i) => i !== j))) : items.map(() => NaN);

    // Spearman-Brown curve
    const sb = st.sb; sb.clear();
    const ks = S.seq(1, 30, 1);
    sb.hline(0.7, { color: C.muted, dash: true, label: '.70 기준' });
    sb.line(ks.map((kk) => [kk, S.alphaFromR(kk, v.r)]), { color: C.s1 });
    sb.vline(k, { color: C.line, width: 1 });
    sb.dots([[k, theo]], { color: C.s1, r: 5, tip: () => `<b>이론 α</b> (k=${k}, r̄=${v.r})<br>${S.f(theo, 3)}` });
    sb.dots([[k, S.clamp(alpha, 0, 1)]], { color: C.marker, r: 5, tip: () => `<b>표본 α</b> (n=${v.n})<br>${S.f(alpha, 3)}` });
    sb.legend([{ label: `이론 α (r̄ = ${v.r})`, color: C.s1, type: 'line' }, { label: '현재 표본 α', color: C.marker, type: 'dot' }]);

    // alpha-if-deleted bars
    const labels = items.map((_, j) => 'Q' + (j + 1));
    const lo = Math.min(0, ...dels.filter(isFinite), alpha) - 0.05;
    const dp = st.del; dp.setX(labels).setY([Math.max(-1, lo), 1]); dp.clear();
    if (k > 2) {
      dp.bars(dels.map((d, j) => ({ x: labels[j], y: d, color: j === k - 1 && v.bad !== 'none' ? C.s8 : C.s1,
        tip: () => `<b>${labels[j]} 삭제</b><br>α = ${S.f(d, 3)} (${d > alpha ? '+' : ''}${S.f(d - alpha, 3)})` })), { maxW: 22 });
      dp.hline(alpha, { color: C.marker, dash: true, label: `전체 α ${S.apa(alpha, 2)}` });
      if (lo < 0) dp.hline(0, { color: C.ink2, width: 1 });
    } else dp.text(labels[0], 0.5, '문항이 2개면 삭제 시 α를 계산할 수 없어요', { anchor: 'start', dx: -20 });
    dp.legend(v.bad !== 'none' ? [{ label: '정상 문항', color: C.s1 }, { label: '문제 문항', color: C.s8 }] : []);

    const last = dels[k - 1];
    ctx.readout([
      { label: '표본 α', value: S.apa(alpha, 3), tone: alpha >= 0.7 ? 'good' : alpha >= 0.6 ? 'warn' : 'bad', sub: alpha >= 0.8 ? '양호' : alpha >= 0.7 ? '수용' : '미흡' },
      { label: '이론 α (표준화)', value: S.apa(theo, 3), sub: 'Spearman–Brown' },
      { label: '표본 평균 문항간 r', value: S.apa(rbarS, 3) },
      { label: `Q${k} 삭제 시 α`, value: k > 2 ? S.apa(last, 3) : '—', tone: k > 2 && last > alpha + 0.02 ? 'accent' : null },
    ]);
    let msg;
    if (v.bad !== 'none' && k > 2 && last > alpha) msg = `Q${k}${v.bad === 'reverse' ? '이 다른 문항과 반대 방향으로 응답되어' : '이 다른 문항과 상관이 없어'} 척도를 끌어내리고 있습니다. 이 문항을 ${v.bad === 'reverse' ? '역코딩하면' : '빼면'} α가 ${S.apa(alpha, 2)}에서 ${S.apa(last, 2)} 이상으로 오릅니다.`;
    else if (theo >= 0.95) msg = `α가 ${S.apa(theo, 2)}로 매우 높습니다. 문항들이 거의 같은 내용을 반복하고 있을 수 있으니 문항을 줄여도 됩니다.`;
    else if (v.r < 0.2 && theo >= 0.7) msg = `문항 간 상관은 ${v.r}로 약하지만 문항이 ${k}개라서 α가 ${S.apa(theo, 2)}까지 올라갔습니다. α는 문항 수에 민감합니다.`;
    else if (theo < 0.7) msg = `이 설정에서 α는 ${S.apa(theo, 2)}로 기준(.70)에 못 미칩니다. 문항을 ${Math.max(k + 1, Math.ceil(0.7 * (1 - v.r) / (v.r * 0.3)))}개 안팎으로 늘리거나 문항 간 상관을 높여야 합니다.`;
    else msg = `문항 ${k}개, 평균 상관 ${v.r}에서 α는 약 ${S.apa(theo, 2)}입니다. 표본(n=${v.n})에서는 ${S.apa(alpha, 2)}로 추정되었습니다.`;
    ctx.insight(msg);
  },
});
