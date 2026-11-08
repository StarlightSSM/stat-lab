/* 포아송 분포: 단위시간당 도착 수, 이항분포의 극한 */
(function () {
  const HOURS = 10, SIM = 300;
  Lab.add({
    id: 'dist-poisson', subject: 'prob', order: 4,
    title: '포아송 분포', en: 'Poisson distribution',
    summary: '평균 도착률 λ로 무작위 도착을 만들어 시간당 건수의 분포를 보고, n이 클 때 이항분포가 포아송으로 수렴하는 모습을 비교합니다.',
    keywords: 'poisson 도착 사건 수 희귀사건 lambda 대기행렬',
    controls: [
      { type: 'slider', key: 'lam', label: '평균 발생률 λ (시간당)', min: 0.5, max: 20, step: 0.5, value: 4 },
      { type: 'toggle', key: 'cmp', label: '이항분포 B(n, λ/n)와 비교', value: true },
      { type: 'slider', key: 'n', label: '이항분포의 시행 수 n', min: 5, max: 200, step: 1, value: 10 },
      { type: 'button', key: 'resample', label: '새 도착 기록 만들기', primary: true },
    ],
    concept: `
      <p>일정한 시간이나 공간 안에서 어떤 사건이 <b>서로 독립적으로, 일정한 평균 비율 λ로</b> 일어날 때 사건 수 X는 포아송 분포를 따릅니다. 콜센터 시간당 전화 수, 웹서버 초당 요청 수, 하루 교통사고 건수가 대표적입니다.</p>
      <ul>
        <li>평균과 분산이 모두 λ입니다. 실제 데이터에서 분산이 평균보다 훨씬 크면 <em>과대산포(overdispersion)</em>로, 음이항 모형을 고려합니다.</li>
        <li>사건 사이의 간격은 평균 1/λ인 <b>지수분포</b>를 따릅니다. 위 타임라인의 점 간격이 그것입니다.</li>
      </ul>
      <p>포아송 분포는 이항분포에서 시행 수 n은 크고 성공확률 p는 작으며 np = λ로 고정된 극한입니다. 1시간을 n개의 짧은 구간으로 쪼개 각 구간에 사건이 날 확률을 λ/n이라 두면, n → ∞일 때 B(n, λ/n) → Poisson(λ)가 됩니다. MIS의 대기행렬(M/M/1) 모형도 이 가정에서 출발합니다.</p>`,
    formula: `P(X = <var>k</var>) = e<sup>−λ</sup> λ<sup><var>k</var></sup> / <var>k</var>! &nbsp;&nbsp; (<var>k</var> = 0, 1, 2, …)<br>E[X] = Var(X) = λ<br>B(<var>n</var>, λ/<var>n</var>) → Poisson(λ) &nbsp;(<var>n</var> → ∞)`,
    tasks: [
      'λ = 4일 때 한 시간에 사건이 한 번도 없을 확률 e^(−4)는 얼마인가요? 타임라인에서 빈 줄이 있는지 찾아보세요.',
      '이항 비교를 켜고 n = 5에서 200까지 올리며 두 분포의 최대 차이가 어떻게 줄어드는지 보세요.',
      'λ를 15 이상으로 올리면 분포 모양이 어떤 분포를 닮아 가나요?',
      '모의 기록 300시간의 평균과 분산이 둘 다 λ 근처인지 확인하세요.',
    ],
    tools: {
      r: (v) => `lambda <- ${v.lam}
dpois(0:10, lambda)            # P(X = k)
ppois(${Math.round(v.lam)}, lambda)               # P(X <= ${Math.round(v.lam)})
1 - ppois(${Math.round(v.lam * 1.5)}, lambda)     # P(X > ${Math.round(v.lam * 1.5)})

# 300시간 모의실험: 평균 ≈ 분산 ≈ λ
set.seed(1)
x <- rpois(${SIM}, lambda)
c(mean = mean(x), var = var(x))

# 이항분포 극한 비교
k <- 0:${Math.ceil(v.lam * 3)}
cbind(poisson = dpois(k, lambda), binom = dbinom(k, ${v.n}, lambda / ${v.n}))

# 도착 간격은 지수분포
gaps <- rexp(100, rate = lambda)`,
      spss: (v) => `* 확률 계산 (변환 > 변수 계산).
COMPUTE p_k   = PDF.POISSON(k, ${v.lam}).
COMPUTE cum_k = CDF.POISSON(k, ${v.lam}).
EXECUTE.

* 모의 데이터 ${SIM}개 생성.
SET SEED = 1.
INPUT PROGRAM.
LOOP #i = 1 TO ${SIM}.
  COMPUTE x = RV.POISSON(${v.lam}).
  END CASE.
END LOOP.
END FILE.
END INPUT PROGRAM.
DESCRIPTIVES x /STATISTICS = MEAN VARIANCE.`,
    },
    init(ctx) {
      ctx.state.tl = ctx.plot({ x: [0, 60], y: [HOURS + 0.5, 0.5], yTicks: HOURS, height: 250, xLabel: '분 (한 시간 안의 도착 시각)', yLabel: '시간대', title: `도착 기록 (${HOURS}시간)`, margin: { r: 40 } });
      ctx.state.pm = ctx.plot({ x: [-0.5, 12.5], y: [0, 0.25], height: 300, xLabel: '시간당 사건 수 k', yLabel: '확률', title: '시간당 사건 수의 분포' });
      ctx.state.seed = 11;
    },
    update(ctx, v, changed) {
      const C = Lab.C, st = ctx.state, lam = v.lam;
      if (changed === 'resample') st.seed++;
      S.seed(st.seed);
      // arrival timeline: exponential gaps
      const rows = d3.range(1, HOURS + 1).map((h) => { const t = []; let s = S.rexp(lam); while (s < 1) { t.push(s); s += S.rexp(lam); } return { h, t }; });
      const sim = Array.from({ length: SIM }, () => S.rpois(lam));
      const tl = st.tl; tl.clear();
      rows.forEach((r) => {
        tl.segment(0, r.h, 60, r.h, { color: C.line, width: 1, layer: 'under' });
        tl.text(60, r.h, `${r.t.length}건`, { anchor: 'start', dx: 6, dy: 4 });
      });
      const dots = rows.flatMap((r) => r.t.map((t) => ({ x: t * 60, y: r.h })));
      tl.dots(dots, { color: C.s1, r: 3.5, tip: (d) => `${Math.floor(d.y)}번째 시간 · ${S.f(d.x, 1)}분` });

      const kmax = Math.ceil(lam + 4 * Math.sqrt(lam) + 3);
      const ks = d3.range(kmax + 1), pois = ks.map((k) => S.dpois(k, lam));
      const pb = Math.min(1, lam / v.n), bino = ks.map((k) => (k <= v.n ? S.dbinom(k, v.n, pb) : 0));
      const obs = ks.map((k) => sim.filter((x) => x === k).length / SIM);
      const pm = st.pm; pm.setX([-0.5, kmax + 0.5]); pm.setY([0, Math.max(...pois, ...(v.cmp ? bino : []), ...obs) * 1.15]); pm.clear();
      pm.bars(ks.map((k) => ({ x: k, y: pois[k], tip: () => `<b>k = ${k}</b><br>포아송 ${S.f(pois[k], 4)}<br>모의 ${S.f(obs[k], 3)}${v.cmp ? `<br>이항 ${S.f(bino[k], 4)}` : ''}` })), { dw: 1, color: C.s1, opacity: 0.55, tip: (d) => d.tip() });
      pm.dots(ks.map((k) => [k, obs[k]]), { color: C.s3, r: 4, tip: (d) => `모의 ${SIM}시간 중 ${d.x}건인 비율 ${S.f(d.y, 3)}` });
      if (v.cmp) { pm.line(ks.map((k) => [k, bino[k]]), { color: C.s2, width: 2 }); pm.dots(ks.map((k) => [k, bino[k]]), { color: C.s2, r: 3 }); }
      pm.legend([{ label: `Poisson(λ=${lam})`, color: C.s1, type: 'box' }, { label: `모의 ${SIM}시간 상대도수`, color: C.s3, type: 'dot' }, ...(v.cmp ? [{ label: `B(${v.n}, ${S.f(pb, 3)})`, color: C.s2, type: 'line' }] : [])]);

      const maxDiff = Math.max(...ks.map((k) => Math.abs(pois[k] - bino[k])));
      const m = S.mean(sim), vv = S.variance(sim);
      ctx.readout([
        { label: 'P(X = 0) = e^(−λ)', value: S.f(Math.exp(-lam), 4) },
        { label: '모의 평균 · 분산', value: `${S.f(m, 2)} · ${S.f(vv, 2)}`, sub: `이론값 둘 다 ${lam}` },
        { label: '분산/평균 (산포비)', value: S.f(vv / m, 2), tone: Math.abs(vv / m - 1) < 0.2 ? 'good' : 'warn' },
        { label: '포아송–이항 최대 차이', value: v.cmp ? S.f(maxDiff, 4) : '—', sub: v.cmp ? `n = ${v.n}, p = ${S.f(pb, 3)}` : '비교 꺼짐' },
      ]);
      const empty = rows.filter((r) => !r.t.length).length;
      let msg = `${HOURS}시간 동안 시간당 도착 수가 ${S.min(rows.map((r) => r.t.length))}–${S.max(rows.map((r) => r.t.length))}건으로 달라졌습니다. 평균 비율이 일정해도 무작위 도착은 이렇게 뭉치고 비는 구간이 생깁니다.`;
      if (empty) msg += ` 사건이 0건인 시간이 ${empty}번 있었습니다(이론 확률 ${S.pct(Math.exp(-lam))}).`;
      if (v.cmp) msg += v.n >= 50 ? ` n = ${v.n}이면 B(n, λ/n)이 포아송과 거의 겹칩니다(최대 차이 ${S.f(maxDiff, 3)}).` : ` n = ${v.n}은 아직 작아서 이항분포가 포아송보다 덜 퍼져 있습니다(최대 차이 ${S.f(maxDiff, 3)}).`;
      ctx.insight(msg);
    },
  });
})();
