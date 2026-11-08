/* 행동연구방법론 · 신뢰도 vs 타당도 (과녁 비유 + MTMM) */
Lab.add({
  id: 'rm-validity', subject: 'rm', order: 2,
  title: '신뢰도와 타당도', en: 'Reliability vs validity · MTMM',
  summary: '과녁에 화살을 쏘듯 측정을 반복해 보고, 수렴·판별 타당도를 다특성-다방법(MTMM) 상관행렬로 확인합니다.',
  keywords: 'validity reliability 타당도 수렴 판별 mtmm 편향 측정오차',
  controls: [
    { type: 'heading', label: '과녁: 반복 측정' },
    { type: 'slider', key: 'bias', label: '체계적 오차 (편향)', min: 0, max: 1.2, step: 0.05, value: 0.6, hint: '크면 타당도가 낮아집니다' },
    { type: 'slider', key: 'noise', label: '무선 오차 (흩어짐)', min: 0.05, max: 0.8, step: 0.01, value: 0.15, hint: '크면 신뢰도가 낮아집니다' },
    { type: 'slider', key: 'shots', label: '측정 횟수', min: 5, max: 60, step: 1, value: 20 },
    { type: 'button', key: 'resample', label: '다시 측정', primary: true },
    { type: 'heading', label: 'MTMM 상관행렬' },
    { type: 'slider', key: 'conv', label: '같은 특성 · 다른 방법 r', min: 0, max: 0.9, step: 0.05, value: 0.6, hint: '수렴타당도' },
    { type: 'slider', key: 'disc', label: '다른 특성 간 r', min: 0, max: 0.9, step: 0.05, value: 0.2, hint: '판별타당도 (낮을수록 좋음)' },
    { type: 'slider', key: 'meth', label: '공통방법 효과', min: 0, max: 0.4, step: 0.05, value: 0.15, hint: '같은 방법끼리 부풀려지는 상관' },
  ],
  concept: `
    <p><b>신뢰도</b>는 측정이 얼마나 일관된가(무선 오차가 작은가), <b>타당도</b>는 재려던 것을 제대로 재는가(체계적 오차가 없는가)입니다. 과녁에서 화살이 한곳에 몰리면 신뢰도가 높고, 그 위치가 정중앙이면 타당도도 높습니다.</p>
    <p>신뢰도는 타당도의 <em>필요조건이지 충분조건은 아닙니다</em>. 매번 정확히 2kg 더 나오는 체중계는 신뢰도는 완벽하지만 타당하지 않습니다. 반대로 측정이 크게 흩어지면 평균이 중앙에 있어도 개별 측정값을 믿을 수 없습니다.</p>
    <ul>
      <li><b>수렴타당도</b>: 같은 개념을 다른 방법으로 쟀을 때 상관이 높아야 함</li>
      <li><b>판별타당도</b>: 다른 개념끼리는 상관이 낮아야 함</li>
      <li><b>공통방법편의</b>: 같은 설문지로 잰 변수끼리는 개념과 무관하게 상관이 부풀려짐</li>
    </ul>
    <p>Campbell과 Fiske(1959)의 다특성-다방법(MTMM) 행렬은 이 셋을 한 표로 봅니다. 수렴 상관(같은 특성·다른 방법)이 다른 특성 간 상관보다 분명히 커야 구성개념 타당도의 근거가 됩니다.</p>`,
  formula: `관찰점수 X = T + <var>B</var> + <var>E</var> &nbsp;<span class="c">(T 진점수, B 체계적 오차, E 무선 오차)</span><br>신뢰도 ρ<sub>XX′</sub> = σ²<sub>T</sub> / (σ²<sub>T</sub> + σ²<sub>E</sub>)<br>판별 기준(Fornell–Larcker): √AVE &gt; 구성개념 간 r`,
  tasks: [
    '편향을 0, 흩어짐을 0.6으로 두세요. 평균은 중앙에 가깝지만 개별 측정은 믿기 어렵습니다. 어느 사분면에 해당하나요?',
    "편향 1.0, 흩어짐 0.05로 '신뢰도는 높지만 타당하지 않은' 체중계를 만들어 보세요.",
    '다른 특성 간 r을 수렴 r보다 높게 올려 보세요. MTMM 판정이 어떻게 바뀌나요?',
    '공통방법 효과를 0.4로 올리면 같은 방법 칸(이질특성-단일방법)이 수렴 상관을 따라잡는지 확인하세요.',
  ],
  tools: {
    r: (p) => `library(psych)
# 4개 측정: A_설문, B_설문, A_면접, B_면접
round(cor(df[, c("A_svy","B_svy","A_int","B_int")]), 2)

# 수렴/판별 타당도 (CFA 기반)
library(lavaan); library(semTools)
fit <- cfa('A =~ a1 + a2 + a3
            B =~ b1 + b2 + b3', data = df)
AVE(fit)                   # 평균분산추출
htmt('A =~ a1+a2+a3
      B =~ b1+b2+b3', data = df)   # HTMT < .85 권장
# 현재 설정: 수렴 r = ${p.conv}, 특성 간 r = ${p.disc}, 방법효과 = ${p.meth}`,
    spss: (p) => `* 분석 > 상관분석 > 이변량 상관으로 MTMM 행렬을 만듭니다.
CORRELATIONS
  /VARIABLES=A_svy B_svy A_int B_int
  /PRINT=TWOTAIL NOSIG
  /MISSING=PAIRWISE.

* 신뢰도(대각선)는 척도별로 분석 > 척도분석 > 신뢰도 분석.
RELIABILITY /VARIABLES=a1 a2 a3 /MODEL=ALPHA.`,
  },
  init(ctx) {
    const row = ctx.row(), c1 = ctx.box('', row), c2 = ctx.box('', row);
    const p = ctx.plot({ x: [-1.6, 1.6], y: [-1.6, 1.6], height: 320, title: '과녁: 반복 측정한 결과', hideY: true, margin: { l: 10, r: 10, b: 10 } }, c1);
    const ratio = p.iw / p.ih; p.setX([-1.6 * ratio, 1.6 * ratio]);
    p.gridG.selectAll("*").remove(); p.axG.selectAll("*").remove(); // a target needs no axes
    ctx.state.t = p;
    ctx.state.mt = h2(c2);
    ctx.state.seed = 3;
    function h2(parent) { const f = Lab.h('figure', { class: 'plot' }); parent.appendChild(f); return f; }
  },
  update(ctx, v, changed) {
    const st = ctx.state, C = Lab.C;
    if (changed === 'resample') st.seed++;
    S.seed(st.seed);
    const ang = 0.8; // fixed direction of the systematic error
    const shots = Array.from({ length: v.shots }, () => [v.bias * Math.cos(ang) + S.randn(0, v.noise), v.bias * Math.sin(ang) + S.randn(0, v.noise)]);
    const cx = S.mean(shots.map((s) => s[0])), cy = S.mean(shots.map((s) => s[1]));
    const spread = Math.sqrt(S.mean(shots.map((s) => (s[0] - cx) ** 2 + (s[1] - cy) ** 2)));
    const off = Math.hypot(cx, cy);

    const p = st.t; p.clear();
    const R = (r) => p.y(0) - p.y(r);
    const under = p.g('under');
    [1.5, 1.1, 0.7, 0.3].forEach((r, i) => under.append('circle').attr('cx', p.x(0)).attr('cy', p.y(0)).attr('r', R(r))
      .style('fill', i % 2 ? 'var(--paper)' : 'var(--paper-2)').style('stroke', 'var(--line)').style('stroke-width', 1));
    under.append('circle').attr('cx', p.x(0)).attr('cy', p.y(0)).attr('r', 4).style('fill', C.ink);
    p.dots(shots, { color: C.s1, r: 4.5, opacity: 0.75, tip: (d) => `측정 ${d.i + 1}<br>중앙에서 ${S.f(Math.hypot(d.x, d.y), 2)}` });
    p.segment(0, 0, cx, cy, { color: C.marker, width: 2, arrow: off > 0.08 });
    p.dots([[cx, cy]], { color: C.marker, r: 6, tip: () => `<b>측정 평균</b><br>편향 ${S.f(off, 2)}` });
    p.legend([{ label: '개별 측정', color: C.s1, type: 'dot' }, { label: '측정 평균 (화살표 = 편향)', color: C.marker, type: 'dot' }, { label: '진점수 (정중앙)', color: C.ink, type: 'dot' }]);

    const reliable = spread < 0.3, valid = off < 0.25;
    const quad = reliable && valid ? '신뢰도 높음 · 타당도 높음' : reliable ? '신뢰도 높음 · 타당도 낮음' : valid ? '신뢰도 낮음 · 평균은 타당' : '신뢰도 낮음 · 타당도 낮음';

    // MTMM matrix: A_svy, B_svy, A_int, B_int
    const rel = 0.85, labels = ['A·설문', 'B·설문', 'A·면접', 'B·면접'];
    const trait = [0, 1, 0, 1], meth = [0, 0, 1, 1];
    const cell = (i, j) => {
      if (i === j) return { r: rel, kind: 'rel' };
      const sameT = trait[i] === trait[j], sameM = meth[i] === meth[j];
      if (sameT) return { r: v.conv, kind: 'conv' };
      if (sameM) return { r: Math.min(0.95, v.disc + v.meth), kind: 'htmm' };
      return { r: v.disc, kind: 'hthm' };
    };
    const kindName = { rel: '신뢰도', conv: '수렴 (단일특성-다방법)', htmm: '이질특성-단일방법', hthm: '이질특성-이질방법' };
    const kindColor = { rel: 'var(--ink-3)', conv: 'var(--s3)', htmm: 'var(--s2)', hthm: 'var(--s1)' };
    let html = `<figcaption class="plot-title">MTMM 상관행렬 (특성 A = 직무만족, B = 이직의도)</figcaption><div class="tbl-scroll"><table class="data-tbl" style="margin:6px 0 4px;width:100%"><thead><tr><th></th>${labels.map((l) => `<th style="text-align:center">${l}</th>`).join('')}</tr></thead><tbody>`;
    for (let i = 0; i < 4; i++) {
      html += `<tr><th style="text-align:left">${labels[i]}</th>`;
      for (let j = 0; j < 4; j++) {
        if (j > i) { html += '<td></td>'; continue; }
        const c = cell(i, j), pct = Math.round(Math.abs(c.r) * 70 + 8);
        html += `<td title="${kindName[c.kind]}" style="text-align:center;padding:10px 6px;background:color-mix(in srgb, ${kindColor[c.kind]} ${c.kind === 'rel' ? 14 : pct}%, transparent);border:1px solid var(--paper);font-weight:${c.kind === 'conv' ? 700 : 500};color:var(--ink)">${c.kind === 'rel' ? `(${S.apa(c.r, 2)})` : S.apa(c.r, 2)}</td>`;
      }
      html += '</tr>';
    }
    html += `</tbody></table></div><div class="plot-legend" style="padding-top:4px">${['conv', 'htmm', 'hthm', 'rel'].map((k) => `<span class="lg-item"><i class="lg-key lg-box" style="--k:${kindColor[k]}"></i>${kindName[k]}</span>`).join('')}</div>`;
    const htmm = Math.min(0.95, v.disc + v.meth);
    const okConv = v.conv >= 0.5, okDisc = v.conv > htmm && v.conv > v.disc;
    html += `<p style="margin:8px 4px 4px;font-size:13px;color:var(--ink-2)">판정: 수렴타당도 <b style="color:${okConv ? 'var(--good)' : 'var(--bad)'}">${okConv ? '충족' : '미흡'}</b> · 판별타당도 <b style="color:${okDisc ? 'var(--good)' : 'var(--bad)'}">${okDisc ? '충족' : '미흡'}</b></p>`;
    st.mt.innerHTML = html;

    ctx.readout([
      { label: '편향 (중앙과 평균의 거리)', value: S.f(off, 2), tone: valid ? 'good' : 'bad' },
      { label: '흩어짐 (평균 거리)', value: S.f(spread, 2), tone: reliable ? 'good' : 'bad' },
      { label: '과녁 판정', value: quad.replace(' · ', '<br>'), sub: `${v.shots}회 측정` },
      { label: '수렴 r − 이질특성 최대 r', value: S.f(v.conv - Math.max(htmm, v.disc), 2), tone: okDisc ? 'good' : 'bad' },
    ]);
    let msg = `과녁은 <b>${quad}</b> 상태입니다. `;
    if (reliable && !valid) msg += '측정이 한곳에 모여 일관되지만 정중앙에서 벗어나 있습니다. 반복해도 같은 방향으로 틀리는 체계적 오차입니다. ';
    else if (!reliable && valid) msg += '평균은 중앙 근처지만 한 번의 측정값은 크게 흔들립니다. 개인 점수를 해석하기 어렵습니다. ';
    if (!okDisc) msg += htmm >= v.conv ? `MTMM에서 같은 방법으로 잰 다른 특성 간 상관(${S.apa(htmm, 2)})이 수렴 상관(${S.apa(v.conv, 2)}) 이상이라 공통방법편의가 의심됩니다.` : '다른 특성끼리의 상관이 수렴 상관만큼 높아 두 개념이 구별되지 않습니다.';
    else msg += `수렴 상관(${S.apa(v.conv, 2)})이 다른 특성 간 상관보다 커서 판별타당도의 근거가 됩니다.`;
    ctx.insight(msg);
  },
});
