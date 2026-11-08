/* 상관분석: Pearson vs Spearman, outlier sensitivity, shared variance (r²) as overlapping circles. */
(function () {
  // distance between two unit circles whose lens overlap equals fraction f of one circle's area
  function overlapDist(f) {
    if (f <= 0) return 2.05; if (f >= 1) return 0;
    const area = (d) => (2 * Math.acos(d / 2) - (d / 2) * Math.sqrt(4 - d * d)) / Math.PI;
    let lo = 0, hi = 2; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (area(m) > f) lo = m; else hi = m; } return (lo + hi) / 2;
  }

  Lab.add({
    id: 'corr', subject: 'prob', order: 13,
    title: '상관분석', en: 'Correlation · Pearson & Spearman',
    summary: '모집단 상관 ρ와 표본크기를 바꾸며 표본 r이 얼마나 흔들리는지, 이상치 하나가 피어슨 r을 얼마나 바꾸는지 실험합니다.',
    keywords: 'correlation pearson spearman 상관계수 이상치 결정계수 fisher',
    controls: [
      { type: 'slider', key: 'rho', label: '모집단 상관 ρ', min: -0.95, max: 0.95, step: 0.05, value: 0.5 },
      { type: 'slider', key: 'n', label: '표본크기 n', min: 10, max: 500, step: 5, value: 50 },
      { type: 'select', key: 'method', label: '상관계수', options: [['pearson', '피어슨 r'], ['spearman', '스피어만 ρₛ']], value: 'pearson' },
      { type: 'toggle', key: 'outlier', label: '이상치 1개 추가', value: false },
      { type: 'toggle', key: 'fit', label: '회귀선 표시', value: true },
      { type: 'button', key: 'resample', label: '새 표본 뽑기', primary: true },
    ],
    concept: `
      <p>피어슨 상관계수 r은 두 연속변수가 <b>직선적으로</b> 함께 움직이는 정도를 −1부터 +1 사이로 나타냅니다. 부호는 방향, 절댓값은 강도입니다. 단위와 무관하므로 키(cm)와 몸무게(kg)처럼 척도가 다른 변수도 비교할 수 있습니다.</p>
      <ul>
        <li><b>r²(결정계수)</b>는 한 변수의 분산 중 다른 변수와 공유하는 비율입니다. r = .5이면 공유분산은 25%뿐입니다. 오른쪽 두 원이 겹친 넓이가 r²입니다.</li>
        <li>r은 평균과 표준편차로 계산하므로 <em>이상치</em>에 민감합니다. 점 하나가 r의 부호까지 바꿀 수 있습니다.</li>
        <li><b>스피어만 ρₛ</b>는 값을 순위로 바꾼 뒤 피어슨 r을 구한 것입니다. 이상치와 단조(곡선형) 관계에 강하고, 서열척도에도 쓸 수 있습니다.</li>
      </ul>
      <p>r의 표본분포는 비대칭이라 신뢰구간은 <b>Fisher z 변환</b> z = atanh(r)으로 구한 뒤 되돌립니다. 그리고 상관은 인과가 아닙니다. 제3변수, 역인과, 범위 제한이 r을 만들거나 숨길 수 있습니다.</p>`,
    formula: `<var>r</var> = Σ(<var>x</var>−<var>x̄</var>)(<var>y</var>−<var>ȳ</var>) / √[Σ(<var>x</var>−<var>x̄</var>)² Σ(<var>y</var>−<var>ȳ</var>)²]<br>
      <var>t</var> = <var>r</var>√(<var>n</var>−2) / √(1−<var>r</var>²), &nbsp; <span class="c">df = n − 2</span><br>
      95% CI: tanh( atanh(<var>r</var>) ± 1.96 / √(<var>n</var>−3) )`,
    tasks: [
      'ρ = 0.3, n = 20으로 두고 "새 표본 뽑기"를 10번 눌러 r의 최솟값과 최댓값을 적어 보세요. n = 300이면 범위가 얼마나 좁아지나요?',
      'ρ = 0.5, n = 30에서 이상치를 켜 보세요. 피어슨 r은 얼마나 바뀌고, 스피어만으로 바꾸면 어떤가요?',
      'ρ = 0.3일 때 공유분산(r²)은 몇 %인가요? "상관이 .3이면 30%를 설명한다"는 말이 왜 틀렸는지 원 그림으로 설명해 보세요.',
      'ρ = 0, n = 500으로 두고 신뢰구간이 0을 포함하는지 확인하세요. ρ = 0.1, n = 500이면 어떻게 되나요?',
    ],
    tools: {
      r: (p) => `set.seed(1)
library(MASS)
xy <- mvrnorm(${p.n}, mu = c(0, 0), Sigma = matrix(c(1, ${p.rho}, ${p.rho}, 1), 2))
x <- xy[, 1]; y <- xy[, 2]
${p.outlier ? 'x <- c(x, 3.5); y <- c(y, ' + (p.rho >= 0 ? '-3.5' : '3.5') + ')   # 이상치 1개\n' : ''}
cor.test(x, y, method = "${p.method}")   # r, t, p, 95% CI
cor(x, y)^2                               # 공유분산 r²
plot(x, y); abline(lm(y ~ x), col = "red")`,
      spss: (p) => `* 메뉴: 분석 > 상관분석 > 이변량 상관
*   변수: x, y / 상관계수: ${p.method === 'pearson' ? 'Pearson' : 'Spearman'} 체크 / 유의성 검정: 양측
${p.method === 'pearson' ? `CORRELATIONS
  /VARIABLES=x y
  /PRINT=TWOTAIL NOSIG
  /STATISTICS DESCRIPTIVES
  /MISSING=PAIRWISE.` : `NONPAR CORR
  /VARIABLES=x y
  /PRINT=SPEARMAN TWOTAIL NOSIG
  /MISSING=PAIRWISE.`}

* 산점도: 그래프 > 레거시 대화상자 > 산점도/점도표 > 단순 산점도
GRAPH /SCATTERPLOT(BIVAR)=x WITH y.`,
    },
    init(ctx) {
      const row = ctx.row(), a = ctx.box('', row), b = ctx.box('', row);
      ctx.state.sp = ctx.plot({ x: [-4, 4], y: [-4, 4], height: 340, xLabel: 'X (표준화)', yLabel: 'Y (표준화)', title: '산점도' }, a);
      const fig = Lab.h('figure', { class: 'plot' }); b.appendChild(fig);
      fig.appendChild(Lab.h('figcaption', { class: 'plot-title' }, '공유분산 r² (겹친 넓이)'));
      ctx.state.venn = d3.select(fig).append('svg').attr('viewBox', '0 0 320 240').attr('width', '100%').attr('class', 'plot-svg').attr('role', 'img').attr('aria-label', '두 원의 겹친 넓이로 표현한 공유분산');
      ctx.state.seed = 41;
      ctx.state.gen = () => { S.seed(ctx.state.seed); ctx.state.z1 = S.rnormVec(500); ctx.state.z2 = S.rnormVec(500); };
      ctx.state.gen();
    },
    update(ctx, v, changed) {
      const st = ctx.state, C = Lab.C;
      if (changed === 'resample') { st.seed++; st.gen(); }
      const x = st.z1.slice(0, v.n), y = st.z2.slice(0, v.n).map((z, i) => v.rho * x[i] + Math.sqrt(1 - v.rho * v.rho) * z);
      const X = x.slice(), Y = y.slice();
      if (v.outlier) { X.push(3.5); Y.push(v.rho >= 0 ? -3.5 : 3.5); }
      const n = X.length, pear = S.corTest(X, Y), rs = S.spearman(X, Y), pearClean = S.cor(x, y);
      let r, ci, p;
      if (v.method === 'pearson') { r = pear.r; ci = pear.ci; p = pear.p; }
      else { r = rs; const t = rs * Math.sqrt((n - 2) / (1 - rs * rs)); p = 2 * (1 - S.pt(Math.abs(t), n - 2)); const z = Math.atanh(rs), se = Math.sqrt(1.06 / (n - 3)); ci = [Math.tanh(z - 1.96 * se), Math.tanh(z + 1.96 * se)]; }

      const sp = st.sp; sp.clear();
      sp.hline(0, { color: C.line, width: 1, layer: 'under' }); sp.vline(0, { color: C.line, width: 1, layer: 'under' });
      const rad = Math.max(2.5, Math.min(4.5, 50 / Math.sqrt(v.n)));
      sp.dots(x.map((xi, i) => [S.clamp(xi, -3.95, 3.95), S.clamp(y[i], -3.95, 3.95)]), { color: C.s1, r: rad, opacity: 0.6, tip: (d) => `(${S.f(x[d.i], 2)}, ${S.f(y[d.i], 2)})` });
      if (v.fit) {
        const m = S.ols(X.map((a) => [a]), Y); sp.line([[-4, m.b[0] - 4 * m.b[1]], [4, m.b[0] + 4 * m.b[1]]], { color: C.s1, width: 2 });
        if (v.outlier) { const m0 = S.ols(x.map((a) => [a]), y); sp.line([[-4, m0.b[0] - 4 * m0.b[1]], [4, m0.b[0] + 4 * m0.b[1]]], { color: C.muted, width: 1.5, dash: true }); }
      }
      if (v.outlier) {
        sp.dots([[3.5, v.rho >= 0 ? -3.5 : 3.5]], { color: C.marker, r: 7, opacity: 1, tip: () => '<b>이상치</b> (3.5, ' + (v.rho >= 0 ? '−3.5' : '3.5') + ')' });
        sp.text(3.3, v.rho >= 0 ? -3.5 : 3.5, '이상치', { anchor: 'end', dy: 4, dx: -6 });
      }
      sp.legend([{ label: `관측값 (n = ${v.n})`, color: C.s1, type: 'dot' }, ...(v.outlier ? [{ label: '이상치', color: C.marker, type: 'dot' }] : []), ...(v.fit ? [{ label: '회귀선', color: C.s1, type: 'line' }] : []), ...(v.fit && v.outlier ? [{ label: '이상치 제외 회귀선', color: C.muted, type: 'dash' }] : [])]);

      // venn: two unit circles, overlap fraction r²
      const svg = st.venn; svg.selectAll('*').remove();
      const r2 = r * r, d = overlapDist(r2), R = 72, cx = 160, cy = 112, off = (d * R) / 2;
      svg.append('circle').attr('cx', cx - off).attr('cy', cy).attr('r', R).style('fill', C.s1).style('opacity', 0.28).style('stroke', C.s1).style('stroke-width', 2);
      svg.append('circle').attr('cx', cx + off).attr('cy', cy).attr('r', R).style('fill', C.s2).style('opacity', 0.28).style('stroke', C.s2).style('stroke-width', 2);
      svg.append('text').attr('class', 'mk-label').attr('x', cx - off - R * 0.55).attr('y', cy + 4).attr('text-anchor', 'middle').text('X');
      svg.append('text').attr('class', 'mk-label').attr('x', cx + off + R * 0.55).attr('y', cy + 4).attr('text-anchor', 'middle').text('Y');
      if (r2 > 0.02) svg.append('text').attr('class', 'mk-label').attr('x', cx).attr('y', cy + 4).attr('text-anchor', 'middle').style('font-weight', 600).text(S.pct(r2, 0));
      svg.append('text').attr('class', 'mk-label').attr('x', cx).attr('y', 222).attr('text-anchor', 'middle').text(`r = ${S.f(r, 2)} → r² = ${S.f(r2, 3)}`);

      const sig = p < 0.05, lab = v.method === 'pearson' ? '피어슨 r' : '스피어만 ρₛ';
      ctx.readout([
        { label: lab, value: S.f(r, 3), sub: `모집단 ρ = ${S.f(v.rho, 2)}`, tone: 'accent' },
        { label: '95% 신뢰구간', value: `[${S.f(ci[0], 2)}, ${S.f(ci[1], 2)}]`, sub: 'Fisher z 변환' },
        { label: 'p (양측)', value: S.fp(p), sub: sig ? 'H₀: ρ = 0 기각' : 'H₀ 유지' },
        { label: '공유분산 r²', value: S.pct(r2, 1) },
        { label: '피어슨 vs 스피어만', value: `${S.f(pear.r, 2)} / ${S.f(rs, 2)}`, sub: 'r / ρₛ' },
      ]);
      let msg = `표본 ${lab}는 <b>${S.f(r, 2)}</b>로 모집단 값 ${S.f(v.rho, 2)}에서 ${S.f(Math.abs(r - v.rho), 2)}만큼 벗어났습니다. 95% 신뢰구간 폭은 ${S.f(ci[1] - ci[0], 2)}${v.n < 40 ? '로 넓어서 표본이 작으면 r을 믿기 어렵습니다.' : '입니다.'}`;
      if (v.outlier) msg += ` 이상치 한 점이 피어슨 r을 <b>${S.f(pearClean, 2)} → ${S.f(pear.r, 2)}</b>로 바꿨고, 스피어만은 ${S.f(rs, 2)}로 ${Math.abs(rs - pearClean) < Math.abs(pear.r - pearClean) ? '덜 흔들립니다' : '비슷하게 영향받습니다'}.`;
      else msg += ` 두 변수가 공유하는 분산은 ${S.pct(r2, 0)}입니다.`;
      ctx.insight(msg);
    },
  });
})();
