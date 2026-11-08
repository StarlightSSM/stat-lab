/* sem-cfa — standardized loadings → CR, AVE, Fornell–Larcker, HTMT (population values) */
(function () {
  function loadings(avg, m, weak) {
    // first m-1 items spread around avg; last item of factor 1 may be the "weak" item
    const spread = m === 4 ? [0.05, 0, -0.05] : [0.04, -0.04];
    const base = spread.map((d) => S.clamp(avg + d, 0.1, 0.97));
    return weak == null ? [...base, S.clamp(avg - 0.02, 0.1, 0.97)] : [...base, weak];
  }
  function htmt(l1, l2, phi) {
    const within = (l) => { const r = []; for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) r.push(l[i] * l[j]); return S.mean(r); };
    const between = S.mean(l1.flatMap((a) => l2.map((b) => a * b * phi)));
    return Math.abs(between) / Math.sqrt(within(l1) * within(l2));
  }
  function alphaStd(l) { const k = l.length, r = []; for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) r.push(l[i] * l[j]); return S.alphaFromR(k, S.mean(r)); }

  Lab.add({
    id: 'sem-cfa', subject: 'sem', order: 3,
    title: '확인적 요인분석: CR·AVE·판별타당도', en: 'Confirmatory factor analysis · CR, AVE, Fornell–Larcker, HTMT',
    summary: '표준화 요인적재량과 요인 간 상관을 조절하며 개념신뢰도(CR), 평균분산추출(AVE), 판별타당도 기준이 언제 통과되고 언제 깨지는지 봅니다.',
    keywords: 'cfa 확인적 요인분석 cr ave htmt fornell larcker 집중타당도 판별타당도',
    controls: [
      { type: 'slider', key: 'l1', label: 'F1 평균 적재량 λ', min: 0.3, max: 0.95, step: 0.01, value: 0.78 },
      { type: 'slider', key: 'weak', label: 'F1 마지막 문항 적재량', min: 0.2, max: 0.95, step: 0.01, value: 0.55, hint: '문제 문항 하나가 신뢰도에 주는 영향' },
      { type: 'slider', key: 'l2', label: 'F2 평균 적재량 λ', min: 0.3, max: 0.95, step: 0.01, value: 0.72 },
      { type: 'slider', key: 'phi', label: '요인 간 상관 φ', min: 0, max: 0.98, step: 0.01, value: 0.45 },
      { type: 'select', key: 'm', label: '요인당 문항 수', options: [[3, '3문항'], [4, '4문항']], value: 4 },
    ],
    concept: `
      <p>CFA는 연구자가 미리 정한 요인 구조(어떤 문항이 어떤 요인을 측정하는지)가 자료와 맞는지 확인합니다. 표준화 적재량 λ는 문항과 요인의 상관이고, <b>λ²</b>는 문항 분산 중 요인이 설명하는 비율입니다.</p>
      <ul>
        <li><b>집중타당도</b>: 같은 요인의 문항들이 한 개념으로 모이는가. 기준은 λ ≥ .50(가능하면 .70), <b>CR ≥ .70</b>, <b>AVE ≥ .50</b>.</li>
        <li><b>판별타당도</b>: 서로 다른 요인이 구별되는가. Fornell–Larcker 기준은 <b>√AVE &gt; |φ|</b>, 즉 각 요인이 자기 문항과 공유하는 분산(AVE)이 다른 요인과 공유하는 분산(φ²)보다 커야 한다는 뜻입니다.</li>
        <li><b>HTMT</b>: 요인 간 문항 상관의 평균을 요인 내 문항 상관의 평균으로 나눈 값입니다. .85(관대하게 .90) 미만이면 판별타당도가 있다고 봅니다.</li>
      </ul>
      <p>이 실험의 값은 표본 추정치가 아니라 정해진 적재량에서 계산한 <em>모집단 값</em>입니다. 실제 자료에서는 여기에 표집오차가 더해집니다. HTMT는 모형이 함축하는 문항 상관(λᵢλⱼ, λᵢλⱼφ)으로 계산했습니다.</p>`,
    formula: `CR = (Σλ)² / [(Σλ)² + Σ(1 − λ²)]<br>AVE = Σλ² / <var>k</var><br>Fornell–Larcker: √AVE<sub>1</sub>, √AVE<sub>2</sub> &gt; |φ|<br>HTMT = r̄<sub>between</sub> / √(r̄<sub>within,1</sub> · r̄<sub>within,2</sub>)`,
    tasks: [
      'F1 마지막 문항을 0.30으로 낮춰 보세요. CR은 아직 .70을 넘는데 AVE는 .50 아래로 떨어지는 구간이 있나요?',
      'φ를 0.85 이상으로 올려 Fornell–Larcker 기준과 HTMT 기준이 깨지는 지점을 각각 찾으세요. 어느 쪽이 먼저 깨지나요?',
      '문항 수를 3개와 4개로 바꿔 보세요. 같은 평균 적재량에서 CR과 AVE 중 문항 수에 민감한 것은 무엇인가요?',
      '모든 적재량을 0.9 근처로 올리면 φ = 0.85에서도 √AVE가 φ보다 클 수 있습니다. 측정 품질과 판별타당도의 관계를 설명해 보세요.',
    ],
    tools: {
      amos: (p) => `[AMOS Graphics]
1. 잠재변수 F1, F2 에 각각 지표 ${p.m}개를 그립니다.
2. F1 ↔ F2 양방향 화살표 (공분산)
3. Analysis Properties > Output > Standardized estimates 체크
4. Calculate Estimates → Standardized Regression Weights 표에서 λ 확인
5. CR, AVE는 AMOS가 직접 주지 않으므로 λ로 계산합니다.
   (Gaskin의 Master Validity Tool 플러그인을 쓰면 CR·AVE·MSV·HTMT 자동 계산)

현재 값: F1 λ ≈ ${p.l1}, 약한 문항 ${p.weak}, F2 λ ≈ ${p.l2}, φ = ${p.phi}`,
      lavaan: (p) => {
        const a = Array.from({ length: p.m }, (_, i) => 'x' + (i + 1)).join(' + '), b = Array.from({ length: p.m }, (_, i) => 'y' + (i + 1)).join(' + ');
        return `library(lavaan); library(semTools)
model <- '
  F1 =~ ${a}
  F2 =~ ${b}
'
fit <- cfa(model, data = df, std.lv = TRUE)
summary(fit, standardized = TRUE, fit.measures = TRUE)

compRelSEM(fit)          # CR (개념신뢰도)
AVE(fit)                 # 평균분산추출
htmt(model, data = df)   # HTMT
lavInspect(fit, "cor.lv")  # 요인 간 상관 φ`;
      },
    },
    init(ctx) {
      ctx.state.dg = ctx.diagram({ width: 640, height: 320 });
      const row = ctx.row(), b1 = ctx.box('', row), b2 = ctx.box('', row);
      ctx.state.bar = ctx.plot({ xBand: ['AVE (F1)', 'AVE (F2)', 'φ² 공유분산'], y: [0, 1], height: 230, yLabel: '분산 비율' }, b1);
      ctx.state.cr = ctx.plot({ xBand: ['CR (F1)', 'CR (F2)', 'HTMT'], y: [0, 1.2], height: 230, yLabel: '값' }, b2);
    },
    update(ctx, v) {
      const m = +v.m, C = Lab.C;
      const L1 = loadings(v.l1, m, v.weak), L2 = loadings(v.l2, m, null);
      const cr1 = S.compositeReliability(L1), cr2 = S.compositeReliability(L2);
      const ave1 = S.ave(L1), ave2 = S.ave(L2), phi = v.phi, h = htmt(L1, L2, phi);
      const fl = Math.sqrt(ave1) > phi && Math.sqrt(ave2) > phi;

      const dg = ctx.state.dg.clear();
      const gap = 640 / (2 * m + 1);
      const xs = Array.from({ length: 2 * m }, (_, i) => gap * (i + 1) + (i >= m ? gap * 0.4 : -gap * 0.4) * 0.5);
      dg.node('F1', { x: S.mean(xs.slice(0, m)), y: 62, type: 'lat', label: 'F1', sub: `AVE ${S.apa(ave1, 2)}` });
      dg.node('F2', { x: S.mean(xs.slice(m)), y: 62, type: 'lat', label: 'F2', sub: `AVE ${S.apa(ave2, 2)}` });
      const all = [...L1, ...L2];
      all.forEach((l, i) => {
        const nm = i < m ? 'x' + (i + 1) : 'y' + (i - m + 1);
        dg.node(nm, { x: xs[i], y: 200, label: nm, w: Math.min(70, gap - 10), h: 34 });
        dg.node('e' + i, { x: xs[i], y: 285, type: 'err', label: 'e' + (i + 1) });
        dg.path(i < m ? 'F1' : 'F2', nm, { value: l, label: S.apa(l, 2), dim: l < 0.5, labelPos: 0.6 });
        dg.path('e' + i, nm, { label: S.apa(1 - l * l, 2), width: 1.1, labelPos: 0.4 });
      });
      dg.path('F1', 'F2', { kind: 'cov', bend: -30, label: 'φ = ' + S.apa(phi, 2), color: fl ? 'var(--ink)' : 'var(--s8)', width: 1.6 });
      dg.note(320, 315, '표준화 계수 · 오차 위 숫자 = 1 − λ² (설명되지 않은 분산) · 점선 = λ < .50');

      const bp = ctx.state.bar.clear();
      bp.hline(0.5, { color: C.ink2, dash: true });
      bp.legend([{ label: 'AVE 기준 .50', color: C.ink2, type: 'dash' }]);
      bp.bars([
        { x: 'AVE (F1)', y: ave1, color: C.s1, tip: () => `AVE(F1) = ${S.f(ave1, 3)}<br>√AVE = ${S.f(Math.sqrt(ave1), 3)}` },
        { x: 'AVE (F2)', y: ave2, color: C.s3, tip: () => `AVE(F2) = ${S.f(ave2, 3)}<br>√AVE = ${S.f(Math.sqrt(ave2), 3)}` },
        { x: 'φ² 공유분산', y: phi * phi, color: fl ? C.muted : C.s8, tip: () => `φ² = ${S.f(phi * phi, 3)}<br>AVE 두 값보다 작아야 판별타당도 통과` },
      ], { labels: (d) => S.apa(d.y, 2) });
      const cp = ctx.state.cr.clear();
      cp.hline(0.7, { color: C.ink2, dash: true });
      cp.hline(0.85, { color: C.s8, dash: true });
      cp.legend([{ label: 'CR 기준 .70', color: C.ink2, type: 'dash' }, { label: 'HTMT 기준 .85', color: C.s8, type: 'dash' }]);
      cp.bars([
        { x: 'CR (F1)', y: cr1, color: C.s1, tip: () => `CR(F1) = ${S.f(cr1, 3)}<br>표준화 α = ${S.f(alphaStd(L1), 3)}` },
        { x: 'CR (F2)', y: cr2, color: C.s3, tip: () => `CR(F2) = ${S.f(cr2, 3)}<br>표준화 α = ${S.f(alphaStd(L2), 3)}` },
        { x: 'HTMT', y: h, color: h < 0.85 ? C.muted : C.s8, tip: () => `HTMT = ${S.f(h, 3)}` },
      ], { labels: (d) => S.apa(d.y, 2) });

      const ok = (x, c) => (x >= c ? 'good' : 'bad');
      ctx.readout([
        { label: 'CR (F1 / F2)', value: `${S.apa(cr1, 2)} / ${S.apa(cr2, 2)}`, sub: '기준 ≥ .70', tone: cr1 >= 0.7 && cr2 >= 0.7 ? 'good' : 'bad' },
        { label: 'AVE (F1 / F2)', value: `${S.apa(ave1, 2)} / ${S.apa(ave2, 2)}`, sub: '기준 ≥ .50', tone: ave1 >= 0.5 && ave2 >= 0.5 ? 'good' : 'bad' },
        { label: 'Fornell–Larcker', value: `${S.apa(Math.min(Math.sqrt(ave1), Math.sqrt(ave2)), 2)} vs ${S.apa(phi, 2)}`, sub: 'AVE 제곱근(작은 쪽) vs φ', tone: fl ? 'good' : 'bad' },
        { label: 'HTMT', value: S.apa(h, 2), sub: '기준 < .85', tone: h < 0.85 ? 'good' : h < 0.9 ? 'warn' : 'bad' },
      ]);
      const issues = [];
      if (v.weak < 0.5) issues.push(`F1 마지막 문항(λ = ${S.apa(v.weak, 2)})은 분산의 ${S.pct(v.weak * v.weak, 0)}만 요인으로 설명됩니다. 삭제 후보입니다`);
      if (ave1 < 0.5 && cr1 >= 0.7) issues.push('F1은 CR은 통과하지만 AVE가 .50 미만입니다. CR이 문항 수에 기대어 높게 나오는 전형적인 경우입니다');
      if (!fl) issues.push(`φ = ${S.apa(phi, 2)}가 AVE의 제곱근보다 커서 두 요인이 사실상 같은 개념을 재고 있을 가능성이 있습니다`);
      else if (h >= 0.85) issues.push(`Fornell–Larcker는 통과하지만 HTMT(${S.apa(h, 2)})는 .85를 넘습니다. HTMT가 더 엄격한 기준입니다`);
      ctx.insight(issues.length ? issues.join('. ') + '.' : `두 요인 모두 CR ≥ .70, AVE ≥ .50으로 집중타당도를 갖추었고, AVE의 제곱근이 φ보다 커서 판별타당도도 확보되었습니다.`);
    },
  });
})();
