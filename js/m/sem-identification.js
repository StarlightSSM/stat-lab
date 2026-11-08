/* sem-identification — counting moments vs free parameters (t-rule) with a live CFA diagram */
Lab.add({
  id: 'sem-identification', subject: 'sem', order: 1,
  title: '모형 식별과 자유도', en: 'Model identification · degrees of freedom (t-rule)',
  summary: '요인 수, 지표 수, 척도 설정, 오차공분산을 바꾸며 "알고 있는 정보"와 "추정할 모수"를 세어 과소·정확·과대식별을 판정합니다.',
  keywords: 'identification df 자유도 식별 t-rule 척도 marker',
  controls: [
    { type: 'slider', key: 'k', label: '잠재요인 수', min: 1, max: 3, step: 1, value: 1 },
    { type: 'slider', key: 'm', label: '요인당 지표 수', min: 2, max: 5, step: 1, value: 3 },
    { type: 'select', key: 'scale', label: '잠재변수 척도 설정', options: [['marker', '첫 적재량 = 1'], ['var', '요인분산 = 1'], ['none', '설정 안 함']], value: 'marker' },
    { type: 'toggle', key: 'corr', label: '요인 간 공분산 추정 (요인 2개 이상)', value: true },
    { type: 'slider', key: 'ce', label: '오차공분산 개수', min: 0, max: 4, step: 1, value: 0, hint: '이웃한 지표의 오차끼리 상관을 허용합니다' },
    { type: 'toggle', key: 'cross', label: '교차적재 1개 추가 (요인 2개 이상)', value: false },
  ],
  concept: `
    <p>구조방정식은 원자료가 아니라 관측변수들의 <b>분산·공분산 행렬</b>을 재현하도록 모수를 추정합니다. 그래서 "알고 있는 정보"는 관측변수 p개로 만들 수 있는 고유한 분산·공분산의 수, 즉 <code>p(p+1)/2</code>개입니다.</p>
    <p>추정할 자유모수(적재량, 요인분산, 요인공분산, 오차분산, 오차공분산 등)를 t개라 하면 <b>자유도 df = p(p+1)/2 − t</b>입니다.</p>
    <ul>
      <li><b>df &lt; 0 과소식별</b>: 방정식보다 미지수가 많아 해가 하나로 정해지지 않습니다. AMOS는 "unidentified" 경고를 냅니다.</li>
      <li><b>df = 0 정확식별</b>: 해는 유일하지만 자료를 완벽히 재현하므로 적합도를 검정할 수 없습니다. 요인 1개·지표 3개 모형이 대표적입니다.</li>
      <li><b>df &gt; 0 과대식별</b>: 남는 정보로 모형이 자료에 맞는지 χ² 검정을 할 수 있습니다.</li>
    </ul>
    <p>df ≥ 0은 <em>필요조건</em>일 뿐 충분조건이 아닙니다. 잠재변수는 단위가 없으므로 첫 적재량을 1로 고정하거나 요인분산을 1로 고정해 <b>척도를 반드시 정해야</b> 합니다. 척도를 정하지 않으면 df가 양수여도 식별되지 않습니다. 요인당 지표 2개인 모형은 요인 간 상관이 0이 아니어야만 경험적으로 식별됩니다.</p>`,
  formula: `알려진 정보 = <var>p</var>(<var>p</var>+1) / 2 &nbsp;<span class="c">(p = 관측변수 수)</span><br>
    <var>t</var> = 적재량 + 요인분산 + 요인공분산 + 오차분산 + 오차공분산 + 교차적재<br>
    <var>df</var> = <var>p</var>(<var>p</var>+1)/2 − <var>t</var>`,
  tasks: [
    '요인 1개, 지표 2개로 두면 df가 얼마인가요? 지표를 3개로 늘리면 정확식별(df = 0)이 되는지 확인하세요.',
    '척도 설정을 "설정 안 함"으로 바꿔 보세요. 모수가 요인 수만큼 늘어나는 이유를 설명해 보세요.',
    '요인 1개·지표 4개(df = 2)에서 오차공분산을 2개, 3개로 늘려 정확식별·과소식별로 바뀌는 지점을 찾으세요.',
    '요인 3개·지표 3개에서 요인 간 공분산을 끄면 df가 3만큼 커집니다. 이것이 어떤 제약을 거는 것인지 생각해 보세요.',
  ],
  tools: {
    amos: (p) => {
      const k = p.k, m = p.m;
      return `[AMOS Graphics]
1. "Draw a latent variable or add an indicator" 도구로
   요인 ${k}개 × 지표 ${m}개를 그립니다 (오차항 자동 생성).
2. 척도: ${p.scale === 'marker' ? '각 요인의 첫 경로에 Regression weight = 1 (자동 설정)' : p.scale === 'var' ? '첫 경로의 1을 지우고 요인을 더블클릭 → Variance = 1' : '첫 경로의 1을 지움 → 식별 불가 경고 확인'}
3. ${k > 1 ? (p.corr ? '요인끼리 양방향 화살표(공분산) 연결' : '요인 간 공분산 화살표 없음 (= 0으로 고정)') : '요인 1개'}
4. ${p.ce ? `오차항 사이 양방향 화살표 ${p.ce}개` : '오차공분산 없음'}
5. View > Text Output > Notes for Model 에서
   "Number of distinct sample moments" 와
   "Number of distinct parameters to be estimated",
   "Degrees of freedom" 을 확인합니다.`;
    },
    lavaan: (p) => _semIdLavaan(p),
  },
  init(ctx) {
    ctx.state.dg = ctx.diagram({ width: 640, height: 330 });
    ctx.state.tbl = ctx.box(''); ctx.state.tbl.style.minWidth = '0';
  },
  update(ctx, v) {
    const k = v.k, m = v.m, p = k * m;
    const corr = k > 1 && v.corr, cross = k > 1 && v.cross;
    const maxCe = Math.max(0, p - 1);
    const ce = Math.min(v.ce, maxCe);
    const moments = p * (p + 1) / 2;
    const nLoad = p - (v.scale === 'marker' ? k : 0);
    const nFvar = v.scale === 'var' ? 0 : k;
    const nFcov = corr ? k * (k - 1) / 2 : 0;
    const nErr = p, nCross = cross ? 1 : 0;
    const t = nLoad + nFvar + nFcov + nErr + ce + nCross;
    const df = moments - t;
    const noScale = v.scale === 'none';
    let status, tone;
    if (noScale) { status = '식별 불가 (척도 미설정)'; tone = 'bad'; }
    else if (df < 0) { status = '과소식별'; tone = 'bad'; }
    else if (df === 0) { status = '정확식별'; tone = 'warn'; }
    else { status = '과대식별'; tone = 'good'; }
    const twoIndicatorRisk = !noScale && df >= 0 && m === 2 && (k === 1 || !corr);

    // ---- diagram ----
    const dg = ctx.state.dg.clear();
    const W = 640, gap = W / (p + 1), w = Math.min(84, gap - 8);
    const xs = Array.from({ length: p }, (_, i) => gap * (i + 1));
    const names = Array.from({ length: p }, (_, i) => 'x' + (i + 1));
    const fx = Array.from({ length: k }, (_, f) => S.mean(xs.slice(f * m, f * m + m)));
    for (let f = 0; f < k; f++) dg.node('F' + f, { x: fx[f], y: 62, type: 'lat', label: 'F' + (f + 1), w: Math.min(110, m * gap - 12), sub: v.scale === 'var' ? '분산 = 1' : null });
    names.forEach((nm, i) => {
      dg.node(nm, { x: xs[i], y: 190, label: nm, w, h: 36 });
      dg.node('e' + i, { x: xs[i], y: 282, type: 'err', label: 'e' + (i + 1) });
    });
    names.forEach((nm, i) => {
      const f = Math.floor(i / m), first = i % m === 0;
      dg.path('F' + f, nm, { label: v.scale === 'marker' && first ? '1' : null, width: 1.5, labelPos: 0.55 });
      dg.path('e' + i, nm, { label: '1', width: 1.1, labelPos: 0.45 });
    });
    if (corr) for (let a = 0; a < k; a++) for (let b = a + 1; b < k; b++) dg.path('F' + a, 'F' + b, { kind: 'cov', bend: -(28 + 18 * (b - a)), width: 1.4 });
    if (cross) dg.path('F0', names[m], { color: 'var(--marker)', width: 1.8 });
    for (let j = 0; j < ce; j++) dg.path('e' + j, 'e' + (j + 1), { kind: 'cov', bend: 22, color: 'var(--marker)', width: 1.3 });
    dg.note(320, 322, `관측변수 ${p}개 · 알려진 정보 ${moments} − 자유모수 ${t} = df ${df}${noScale ? ' (그러나 척도 미설정)' : ''}`);

    // ---- parameter ledger ----
    const rows = [
      ['요인적재량 λ', nLoad, v.scale === 'marker' ? `${p}개 중 ${k}개를 1로 고정` : `${p}개 모두 추정`],
      ['요인분산 φ', nFvar, v.scale === 'var' ? '1로 고정' : '추정'],
      ['요인 간 공분산', nFcov, k > 1 ? (corr ? `${k}C2 = ${nFcov}` : '0으로 고정') : '요인 1개'],
      ['오차분산 θ', nErr, '지표마다 1개'],
      ['오차공분산', ce, ce ? '주황 곡선' : '없음'],
      ['교차적재', nCross, cross ? 'F1 → ' + names[m] : '없음'],
      ['<b>자유모수 합계 t</b>', `<b>${t}</b>`, ''],
      ['알려진 정보 p(p+1)/2', moments, `${p}×${p + 1}/2`],
      ['<b>자유도 df</b>', `<b class="${df < 0 ? '' : 'hi'}">${df}</b>`, status],
    ];
    ctx.state.tbl.innerHTML = Lab.spssTable({ title: 'Computation of degrees of freedom', sub: '모수 장부 (AMOS Notes for Model과 같은 계산)', head: ['구분', '개수', '설명'], rows });

    ctx.readout([
      { label: '관측변수 p', value: p },
      { label: '알려진 정보', value: moments, sub: 'p(p+1)/2' },
      { label: '자유모수 t', value: t },
      { label: '자유도 df', value: df, sub: status, tone },
    ]);
    let msg;
    if (noScale) msg = `df는 ${df}이지만 잠재변수의 척도를 정하지 않아 적재량과 요인분산을 함께 키우거나 줄여도 같은 공분산이 나옵니다. 해가 무수히 많으므로 식별되지 않습니다.`;
    else if (df < 0) msg = `추정할 모수(${t}개)가 알려진 정보(${moments}개)보다 ${-df}개 많습니다. 지표를 늘리거나 오차공분산·교차적재 같은 모수를 줄여야 합니다.`;
    else if (df === 0) msg = `정보와 모수가 ${t}개로 같습니다. 해는 유일하지만 모형이 자료를 완벽히 재현하므로 χ² = 0, 적합도 검정이 불가능합니다.`;
    else msg = `남는 정보가 ${df}개 있어 모형이 자료와 맞는지 χ²(${df}) 검정을 할 수 있습니다.` + (twoIndicatorRisk ? ' 다만 요인당 지표가 2개라서 요인 간 상관이 없으면 실제로는 추정이 불안정합니다(경험적 과소식별).' : '');
    if (v.ce > maxCe) msg += ` (오차공분산은 최대 ${maxCe}개까지만 그렸습니다.)`;
    ctx.insight(msg);
  },
});

function _semIdLavaan(p) {
  const k = p.k, m = p.m, lines = [];
  for (let f = 0; f < k; f++) {
    const items = Array.from({ length: m }, (_, i) => 'x' + (f * m + i + 1));
    lines.push(`  F${f + 1} =~ ${p.scale === 'marker' ? '' : 'NA*'}${items.join(' + ')}`);
  }
  if (k > 1 && p.cross) lines[0] += ` + x${m + 1}`;
  if (p.scale === 'var') for (let f = 0; f < k; f++) lines.push(`  F${f + 1} ~~ 1*F${f + 1}`);
  if (k > 1 && !p.corr) for (let a = 0; a < k; a++) for (let b = a + 1; b < k; b++) lines.push(`  F${a + 1} ~~ 0*F${b + 1}`);
  for (let j = 0; j < Math.min(p.ce, k * m - 1); j++) lines.push(`  x${j + 1} ~~ x${j + 2}`);
  return `library(lavaan)
model <- '
${lines.join('\n')}
'
fit <- cfa(model, data = df${p.scale === 'var' ? ', std.lv = TRUE' : ''})
fitMeasures(fit, c("npar", "df"))   # 자유모수, 자유도
lavInspect(fit, "free")              # 어떤 모수가 자유인지 확인`;
}
