/* 베이즈 정리: 진단검사의 양성 예측도 (자연빈도 1000명 아이콘 배열) */
(function () {
  const pctFmt = (v) => { const m = +(v / 10 ** Math.floor(Math.log10(v))).toFixed(5); return [1, 5].includes(m) ? +(v * 100).toPrecision(3) + '%' : ''; };
  const ppvOf = (prev, se, sp) => (se * prev) / (se * prev + (1 - sp) * (1 - prev));
  const npvOf = (prev, se, sp) => (sp * (1 - prev)) / (sp * (1 - prev) + (1 - se) * prev);
  function counts(v) {
    const sick = 1000 * v.prev, TP = Math.round(sick * v.sens), FN = Math.round(sick) - TP, FP = Math.round((1000 - Math.round(sick)) * (1 - v.spec));
    return { TP, FN, FP, TN: 1000 - TP - FN - FP };
  }
  Lab.add({
    id: 'prob-bayes', subject: 'prob', order: 2,
    title: '베이즈 정리: 진단검사', en: "Bayes' theorem · base rates",
    summary: '유병률, 민감도, 특이도를 바꾸며 "검사 양성이면 실제로 병이 있을 확률"이 왜 생각보다 낮은지 1,000명 그림으로 확인합니다.',
    keywords: 'bayes 조건부확률 기저율 민감도 특이도 PPV 사전확률 사후확률',
    controls: [
      { type: 'slider', key: 'prev', label: '유병률 (사전확률)', min: 0.001, max: 0.5, step: 0.001, value: 0.01, fmt: (v) => S.pct(v, 1) },
      { type: 'slider', key: 'sens', label: '민감도 P(양성|질병)', min: 0.5, max: 0.999, step: 0.001, value: 0.9, fmt: (v) => S.pct(v, 1) },
      { type: 'slider', key: 'spec', label: '특이도 P(음성|건강)', min: 0.5, max: 0.999, step: 0.001, value: 0.95, fmt: (v) => S.pct(v, 1) },
      { type: 'toggle', key: 'second', label: '두 번째 독립 검사도 양성', value: false },
    ],
    concept: `
      <p>베이즈 정리는 새 증거를 보고 믿음을 갱신하는 규칙입니다. 검사 전 질병 확률(<b>사전확률</b> = 유병률)에 검사 결과의 증거력을 곱해 <b>사후확률</b>을 얻습니다.</p>
      <ul>
        <li><b>민감도</b>: 환자를 양성으로 잡아낼 확률. <b>특이도</b>: 건강한 사람을 음성으로 판정할 확률.</li>
        <li><b>양성 예측도(PPV)</b>: 양성 판정을 받은 사람 중 실제 환자의 비율. 우리가 정말 궁금한 값입니다.</li>
      </ul>
      <p>민감도 90%, 특이도 95%인 좋은 검사라도 유병률이 1%라면 양성자 중 실제 환자는 약 15%에 불과합니다. 건강한 990명의 5%(약 50명)가 거짓양성으로 나오는데, 진짜 환자는 9명뿐이기 때문입니다. 이처럼 사전확률을 무시하는 판단 오류를 <em>기저율 무시(base-rate neglect)</em>라고 합니다.</p>
      <p>확률 대신 "1,000명 중 몇 명"이라는 <b>자연빈도</b>로 생각하면 이 계산이 훨씬 쉬워집니다. 두 번째 검사를 하면 첫 검사의 사후확률이 새로운 사전확률이 되어 다시 갱신됩니다.</p>`,
    formula: `P(D|+) = P(+|D)·P(D) / [P(+|D)·P(D) + P(+|D<sup>c</sup>)·P(D<sup>c</sup>)]<br>PPV = 민감도·유병률 / [민감도·유병률 + (1−특이도)(1−유병률)]<br><span class="c">사후 오즈 = 사전 오즈 × 우도비(LR+ = 민감도 / (1−특이도))</span>`,
    tasks: [
      '기본값(유병률 1%, 민감도 90%, 특이도 95%)에서 양성 판정자 중 실제 환자가 몇 명인지 그림에서 세어 보세요.',
      '민감도를 99.9%로 올렸을 때와 특이도를 99.9%로 올렸을 때, 어느 쪽이 PPV를 더 많이 올리나요?',
      '유병률을 20%로 올려 보세요. 같은 검사인데 PPV가 어떻게 달라지나요? (선별검사 vs 증상 있는 환자 검사)',
      '"두 번째 검사도 양성"을 켜고, 사후확률이 몇 %까지 올라가는지 확인하세요.',
    ],
    tools: {
      r: (p) => {
        const c = counts(p);
        return `prev <- ${p.prev}; sens <- ${p.sens}; spec <- ${p.spec}
ppv <- sens * prev / (sens * prev + (1 - spec) * (1 - prev))
npv <- spec * (1 - prev) / (spec * (1 - prev) + (1 - sens) * prev)
c(PPV = ppv, NPV = npv)

# 두 번째 검사: 사후확률을 새 사전확률로
ppv2 <- sens * ppv / (sens * ppv + (1 - spec) * (1 - ppv))

# 1000명 자연빈도 표
tab <- matrix(c(${c.TP}, ${c.FP}, ${c.FN}, ${c.TN}), nrow = 2,
              dimnames = list(검사 = c("양성", "음성"), 실제 = c("질병", "건강")))
prop.table(tab, 1)   # 행 비율: 양성 행의 '질병' 열 = PPV`;
      },
      spss: (p) => {
        const c = counts(p);
        return `* 1000명 자연빈도 표를 가중치로 입력.
DATA LIST FREE / disease test count.
BEGIN DATA
1 1 ${c.TP}
1 0 ${c.FN}
0 1 ${c.FP}
0 0 ${c.TN}
END DATA.
VALUE LABELS disease 1 '질병' 0 '건강' / test 1 '양성' 0 '음성'.
WEIGHT BY count.
* 행 백분율에서 '양성' 행의 '질병' 비율이 PPV.
CROSSTABS /TABLES = test BY disease /CELLS = COUNT ROW COLUMN.`;
      },
    },
    init(ctx) {
      const row = ctx.row();
      const fig = Lab.h('figure', { class: 'plot' }); row.appendChild(fig);
      fig.appendChild(Lab.h('figcaption', { class: 'plot-title' }, '1,000명을 검사하면'));
      ctx.state.legend = Lab.h('div', { class: 'plot-legend' }); fig.appendChild(ctx.state.legend);
      const cols = 40, rows = 25, cell = 14;
      ctx.state.svg = d3.select(fig).append('svg').attr('viewBox', `0 0 ${cols * cell} ${rows * cell}`).attr('width', '100%').attr('class', 'plot-svg').attr('role', 'img').attr('aria-label', '1000명 아이콘 배열');
      ctx.state.cells = ctx.state.svg.selectAll('rect').data(d3.range(1000)).join('rect')
        .attr('x', (i) => (i % cols) * cell + 1.5).attr('y', (i) => Math.floor(i / cols) * cell + 1.5).attr('width', cell - 3).attr('height', cell - 3).attr('rx', 2);
      ctx.state.curve = ctx.plot({ x: [0.001, 0.5], xLog: true, xFmt: pctFmt, y: [0, 1], yFmt: (v) => Math.round(v * 100) + '%', height: 300, xLabel: '유병률 (로그 눈금)', yLabel: '예측도', title: '유병률에 따른 예측도' }, row);
    },
    update(ctx, v) {
      const C = Lab.C, c = counts(v);
      const cat = (i) => (i < c.TP ? 'TP' : i < c.TP + c.FN ? 'FN' : i < c.TP + c.FN + c.FP ? 'FP' : 'TN');
      const col = { TP: C.s1, FN: C.s7, FP: C.s2, TN: C.line };
      const lab = { TP: '참양성: 환자 & 양성', FN: '거짓음성: 환자 & 음성', FP: '거짓양성: 건강 & 양성', TN: '참음성: 건강 & 음성' };
      ctx.state.cells.style('fill', (i) => col[cat(i)]).style('opacity', (i) => (cat(i) === 'TN' ? 0.7 : 0.95));
      ctx.state.cells.on('mouseenter', (ev, i) => Lab.tip.show(`<b>${lab[cat(i)]}</b><br>${c[cat(i)]}명`, ev)).on('mousemove', (ev) => Lab.tip.move(ev)).on('mouseleave', () => Lab.tip.hide());
      ctx.state.legend.innerHTML = ['TP', 'FN', 'FP', 'TN'].map((k) => `<span class="lg-item"><i class="lg-key lg-box" style="--k:${col[k]}"></i>${lab[k]} <b>${c[k]}</b></span>`).join('');

      const ppv = ppvOf(v.prev, v.sens, v.spec), npv = npvOf(v.prev, v.sens, v.spec), ppv2 = ppvOf(ppv, v.sens, v.spec);
      const p = ctx.state.curve; p.clear();
      const xs = S.linspace(Math.log(0.001), Math.log(0.5), 160).map(Math.exp);
      p.line(xs.map((x) => [x, ppvOf(x, v.sens, v.spec)]), { color: C.s1 });
      p.line(xs.map((x) => [x, npvOf(x, v.sens, v.spec)]), { color: C.s3 });
      if (v.second) p.line(xs.map((x) => [x, ppvOf(ppvOf(x, v.sens, v.spec), v.sens, v.spec)]), { color: C.s1, dash: true });
      p.vline(v.prev, { color: C.ink2, dash: true, label: `유병률 ${S.pct(v.prev, 1)}`, anchor: v.prev > 0.1 ? 'end' : 'start', labelY: p.ih - 8 });
      p.dots([[v.prev, ppv]], { color: C.s1, r: 5, tip: () => `<b>PPV ${S.pct(ppv)}</b><br>양성이면 실제 환자일 확률` });
      p.dots([[v.prev, npv]], { color: C.s3, r: 5, tip: () => `<b>NPV ${S.pct(npv, 2)}</b><br>음성이면 실제 건강할 확률` });
      if (v.second) p.dots([[v.prev, ppv2]], { color: C.s1, r: 5, tip: () => `<b>2회 양성 후 ${S.pct(ppv2)}</b>` });
      p.legend([{ label: '양성 예측도 PPV', color: C.s1, type: 'line' }, { label: '음성 예측도 NPV', color: C.s3, type: 'line' }, ...(v.second ? [{ label: '두 번 양성 후 PPV', color: C.s1, type: 'dash' }] : [])]);

      const pos = c.TP + c.FP, lr = v.sens / (1 - v.spec);
      ctx.readout([
        { label: '양성 판정자 (1,000명 중)', value: pos + '명', sub: `진짜 환자 ${c.TP}명` },
        { label: '양성 예측도 PPV', value: S.pct(ppv), tone: ppv < 0.5 ? 'warn' : 'good' },
        { label: '음성 예측도 NPV', value: S.pct(npv, 2) },
        v.second ? { label: '두 번 양성 후', value: S.pct(ppv2), tone: 'accent' } : { label: '양성 우도비 LR+', value: S.f(lr, 1), sub: '민감도 / (1−특이도)' },
      ]);
      let msg = `양성 판정 ${pos}명 중 진짜 환자는 <b>${c.TP}명</b>, 거짓양성은 <b>${c.FP}명</b>입니다. 그래서 양성이 나와도 실제 환자일 확률은 <b>${S.pct(ppv)}</b>입니다.`;
      if (c.FP > c.TP) msg += ' 건강한 사람이 압도적으로 많아서, 작은 거짓양성률도 큰 인원이 됩니다.';
      if (v.second) msg += ` 독립적인 두 번째 검사까지 양성이면 사전확률 ${S.pct(ppv)}가 사후확률 <b>${S.pct(ppv2)}</b>로 갱신됩니다.`;
      ctx.insight(msg);
    },
  });
})();
