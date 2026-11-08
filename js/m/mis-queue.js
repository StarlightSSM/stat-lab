/* MIS · 대기행렬 M/M/c — Erlang C theory + Gillespie event simulation revealed as an animation. */
Lab.add({
  id: 'mis-queue', subject: 'mis', order: 5,
  title: '대기행렬 M/M/1: 서버 용량 계획', en: 'Queueing theory · M/M/1 and M/M/c (Erlang C)',
  summary: '요청 도착률과 처리율, 서버 수를 바꾸며 이용률이 100%에 가까워질 때 대기시간이 왜 폭발하는지 직접 확인합니다.',
  keywords: 'queue 대기행렬 MM1 erlang 서버 용량 little 이용률 헬프데스크',
  controls: [
    { type: 'slider', key: 'lam', label: '도착률 λ (요청/분)', min: 1, max: 60, step: 1, value: 16 },
    { type: 'slider', key: 'mu', label: '서버 1대 처리율 μ (요청/분)', min: 2, max: 30, step: 1, value: 20 },
    { type: 'slider', key: 'c', label: '서버 수 c', min: 1, max: 6, step: 1, value: 1 },
    { type: 'slider', key: 'speed', label: '애니메이션 속도', min: 1, max: 20, step: 1, value: 6, fmt: (v) => v + '×' },
    { type: 'button', key: 'resample', label: '시뮬레이션 다시 실행', primary: true },
  ],
  concept: `
    <p>웹 서버, 콜센터, 헬프데스크, 데이터베이스 커넥션 풀은 모두 <b>대기행렬</b>입니다. Kendall 표기법 M/M/c는 도착 간격이 지수분포(포아송 도착), 처리시간이 지수분포, 서버가 c대라는 뜻입니다.</p>
    <ul>
      <li><b>이용률</b> ρ = λ / (cμ) : 서버가 바쁜 시간의 비율. ρ ≥ 1이면 대기열이 끝없이 길어집니다.</li>
      <li>M/M/1의 평균 대기열 길이 Lq = ρ² / (1−ρ). ρ가 0.5 → 0.9 → 0.99로 가면 Lq는 0.5 → 8.1 → 98로 비선형적으로 커집니다.</li>
      <li><b>Little의 법칙</b> L = λW : 시스템 안의 평균 인원은 도착률과 평균 체류시간의 곱입니다. 분포 가정 없이 성립합니다.</li>
    </ul>
    <p>서버가 여러 대이면 Erlang C 공식으로 "도착했을 때 기다려야 할 확률"을 구합니다. 같은 총 용량이라도 큐 하나를 여러 서버가 나눠 처리하는 편이 서버마다 큐를 따로 두는 것보다 대기가 짧습니다(풀링 효과).</p>
    <p>용량 계획의 교훈은 이렇습니다. 평균 이용률이 80~90%를 넘으면 작은 수요 증가에도 응답시간이 급격히 나빠지므로, IT 시스템은 일부러 여유 용량을 남겨 둡니다.</p>`,
  formula: `ρ = λ / (<var>c</var>μ), &nbsp; <var>a</var> = λ/μ<br>Erlang C: <var>P</var>(대기) = [<var>a</var><sup>c</sup>/<var>c</var>! · 1/(1−ρ)] / [Σ<sub>k=0..c−1</sub> <var>a</var><sup>k</sup>/<var>k</var>! + <var>a</var><sup>c</sup>/<var>c</var>! · 1/(1−ρ)]<br><var>L<sub>q</sub></var> = <var>P</var>(대기) · ρ/(1−ρ), &nbsp; <var>W<sub>q</sub></var> = <var>L<sub>q</sub></var>/λ, &nbsp; <var>W</var> = <var>W<sub>q</sub></var> + 1/μ<br>M/M/1: <var>L<sub>q</sub></var> = ρ²/(1−ρ)`,
  tasks: [
    'c = 1, μ = 20에서 λ를 10 → 16 → 19로 올려 보세요. 이용률은 50% → 95%로 두 배도 안 되는데 대기시간은 몇 배가 되나요?',
    'λ = 36, μ = 20일 때 서버가 몇 대 있어야 평균 대기시간이 6초(0.1분) 이하가 되나요?',
    'λ를 μ보다 크게(ρ > 1) 만들고 시뮬레이션을 보세요. 대기열이 어떻게 변하나요?',
    '시뮬레이션의 평균 시스템 인원이 이론값 L과 비슷한지, Little의 법칙 L = λW로 확인해 보세요.',
  ],
  tools: {
    r: (p) => `# M/M/c 이론값 (Erlang C)
lambda <- ${p.lam}; mu <- ${p.mu}; c <- ${p.c}
a <- lambda / mu; rho <- a / c
erlangC <- function(a, c) {
  top <- a^c / factorial(c) / (1 - a / c)
  top / (sum(a^(0:(c - 1)) / factorial(0:(c - 1))) + top)
}
Pw <- erlangC(a, c)
Lq <- Pw * rho / (1 - rho); Wq <- Lq / lambda
c(rho = rho, P_wait = Pw, Lq = Lq, Wq_min = Wq, W_min = Wq + 1 / mu)

# 시뮬레이션: install.packages("simmer")
library(simmer)
env <- simmer() |>
  add_resource("server", c) |>
  add_generator("req", trajectory() |> seize("server") |>
                  timeout(function() rexp(1, mu)) |> release("server"),
                function() rexp(1, lambda))
run(env, until = 480)
mean(get_mon_arrivals(env)$end_time - get_mon_arrivals(env)$start_time)`,
  },
  erlang(lam, mu, c) {
    const a = lam / mu, rho = a / c;
    if (rho >= 1) return { rho, Pw: 1, Lq: Infinity, Wq: Infinity, W: Infinity, L: Infinity };
    let sum = 0, term = 1; for (let k = 0; k < c; k++) { if (k > 0) term *= a / k; sum += term; }
    const top = term * (a / c) / (1 - rho); // a^c / c! / (1-rho)  (term = a^(c-1)/(c-1)!)
    const Pw = top / (sum + top), Lq = Pw * rho / (1 - rho), Wq = Lq / lam;
    return { rho, Pw, Lq, Wq, W: Wq + 1 / mu, L: Lq + a };
  },
  init(ctx) {
    const row = ctx.row(), c1 = ctx.box('', row), c2 = ctx.box('', row);
    ctx.state.curve = ctx.plot({ x: [0, 1], y: [0, 5], height: 270, xLabel: '이용률 ρ = λ / cμ', yLabel: '평균 대기시간 Wq (분)', title: '이용률과 대기시간', xFmt: d3.format('.0%') }, c1);
    ctx.state.desk = ctx.plot({ x: [0, 12], y: [0, 4], height: 270, hideY: true, title: '지금 창구 상황', xTicks: 0, margin: { l: 12, b: 20 } }, c2);
    ctx.state.desk.axG.selectAll('*').remove(); ctx.state.desk.gridG.selectAll('*').remove();
    ctx.state.sim = ctx.plot({ x: [0, 60], y: [0, 10], height: 230, xLabel: '시간 (분)', yLabel: '시스템 내 요청 수', title: '이벤트 시뮬레이션: 시스템 안의 요청 수' });
    ctx.state.seed = 5;
  },
  update(ctx, v, changed) {
    const C = Lab.C, mod = Lab.byId['mis-queue'];
    if (changed === 'resample') ctx.state.seed++;
    const th = mod.erlang(v.lam, v.mu, v.c), cap = v.c * v.mu;

    // theory curve over utilisation
    const cv = ctx.state.curve, rs = S.linspace(0.02, 0.985, 120);
    const pts = rs.map((r) => [r, mod.erlang(r * cap, v.mu, v.c).Wq]);
    const yTop = Math.max(0.5, Math.min(isFinite(th.Wq) ? th.Wq * 2.2 : 5, pts.find((d) => d[0] > 0.95)[1] * 1.05));
    cv.setY([0, yTop]); cv.clear();
    cv.rect(0.8, 1, 0, yTop, { color: C.s8, opacity: 0.07 });
    cv.text(0.9, yTop * 0.93, '위험 구간', { size: 10.5 });
    cv.line(pts.filter(([r, w]) => w <= yTop * 1.02), { color: C.s1 });
    if (th.rho < 0.985) cv.dots([[th.rho, Math.min(th.Wq, yTop)]], { color: C.marker, r: 6, opacity: 1, tip: () => `ρ = ${S.pct(th.rho, 1)}<br>Wq = ${S.f(th.Wq * 60, 1)}초` });
    else cv.text(0.96, yTop * 0.6, 'ρ ≥ 1: 무한대', { anchor: 'end', color: C.bad });

    // event simulation (Gillespie), horizon 60 min
    S.seed(ctx.state.seed);
    const H = 60, path = [[0, 0]]; let t = 0, n = 0, area = 0, areaQ = 0, served = 0;
    while (t < H && path.length < 6000) {
      const rate = v.lam + Math.min(n, v.c) * v.mu, dt = S.rexp(rate);
      const tn = Math.min(H, t + dt); area += n * (tn - t); areaQ += Math.max(0, n - v.c) * (tn - t); t = tn; if (t >= H) break;
      if (S.rand() < v.lam / rate) n++; else { n--; served++; }
      path.push([t, n]);
    }
    path.push([H, n]);
    const Lsim = area / H, Lqsim = areaQ / H, Wsim = Lsim / v.lam;
    ctx.state.path = path; ctx.state.simStats = { Lsim, Lqsim, Wsim };

    const sim = ctx.state.sim, ymax = Math.max(6, Math.max(...path.map((p) => p[1])) * 1.1);
    sim.setY([0, ymax]);
    const draw = (upTo) => {
      sim.clear();
      if (isFinite(th.L) && th.L < ymax) sim.hline(th.L, { color: C.marker, dash: true, label: `이론 L = ${S.f(th.L, 2)}` });
      sim.hline(v.c, { color: C.muted, width: 1, label: `서버 ${v.c}대`, anchor: 'start' });
      const vis = []; for (const p of path) { if (p[0] > upTo) break; vis.push(p); }
      const last = vis.length ? vis[vis.length - 1][1] : 0; vis.push([upTo, last]);
      sim.area(vis, { color: C.s1, opacity: 0.15, curve: 'step' });
      sim.line(vis, { color: C.s1, width: 1.6, curve: 'step' });
      drawDesk(last, upTo);
    };
    const desk = ctx.state.desk;
    const drawDesk = (nNow, tNow) => {
      desk.clear();
      const busy = Math.min(nNow, v.c), q = Math.max(0, nNow - v.c), sh = 3.6 / Math.max(v.c, 3);
      for (let i = 0; i < v.c; i++) {
        const y0 = 3.8 - (i + 1) * sh;
        desk.rect(9.0, 11.8, y0 + sh * 0.15, y0 + sh * 0.85, { color: i < busy ? C.s3 : C.line, opacity: i < busy ? 0.85 : 0.6, layer: 'data' });
        desk.text(10.4, y0 + sh / 2, i < busy ? '처리 중' : '대기', { dy: 4, size: 10.5 });
      }
      const shown = Math.min(q, 32), dots = [];
      for (let i = 0; i < shown; i++) dots.push({ x: 8.5 - (i % 8) * 1.05, y: 2 + (Math.floor(i / 8) - 1.5) * 0.7 });
      desk.dots(dots, { color: C.s2, r: 7, opacity: 0.9 });
      desk.text(4.6, 3.75, q > 32 ? `대기열 ${q}명 (32명만 표시)` : `대기열 ${q}명`, { size: 12, weight: 600 });
      desk.text(4.6, 0.25, `t = ${S.f(tNow, 1)}분`, { size: 11 });
    };
    if (ctx.state.stop) ctx.state.stop();
    if (ctx.reducedMotion || changed === 'init') draw(H);
    else {
      let clock = 0;
      ctx.state.stop = ctx.loop((dt) => { clock = Math.min(H, clock + dt / 1000 * v.speed * 0.5); draw(clock); return clock < H; });
    }

    const tone = th.rho >= 1 ? 'bad' : th.rho > 0.85 ? 'warn' : 'good';
    ctx.readout([
      { label: '이용률 ρ', value: S.pct(th.rho, 0), tone, sub: `처리용량 ${cap}건/분` },
      { label: '평균 대기시간 Wq', value: isFinite(th.Wq) ? (th.Wq * 60 < 120 ? S.f(th.Wq * 60, 1) + '초' : S.f(th.Wq, 1) + '분') : '∞', sub: `시뮬레이션 W ≈ ${S.f(Wsim * 60, 0)}초 (체류)` },
      { label: '대기할 확률', value: S.pct(Math.min(1, th.Pw), 0), sub: 'Erlang C' },
      { label: '평균 대기열 Lq', value: isFinite(th.Lq) ? S.f(th.Lq, 2) : '∞', sub: `시뮬레이션 ${S.f(Lqsim, 2)}` },
    ]);
    let msg;
    if (th.rho >= 1) msg = `들어오는 요청(${v.lam}건/분)이 처리 용량(${cap}건/분)보다 많습니다. 대기열은 균형 없이 계속 길어지므로 서버를 ${Math.ceil(v.lam / v.mu + 0.01)}대 이상으로 늘려야 합니다.`;
    else if (th.rho > 0.85) msg = `이용률 ${S.pct(th.rho, 0)}는 곡선이 가파르게 솟는 구간입니다. 도착률이 조금만 늘어도 대기시간이 급증합니다. 여유 용량을 확보하세요.`;
    else if (th.rho < 0.4) msg = `이용률이 ${S.pct(th.rho, 0)}로 서버가 대부분 놀고 있습니다. 대기는 거의 없지만 용량이 과잉일 수 있습니다.`;
    else msg = `이용률 ${S.pct(th.rho, 0)}에서 도착한 요청의 ${S.pct(th.Pw, 0)}가 기다리며, 평균 대기시간은 ${S.f(th.Wq * 60, 1)}초입니다.`;
    ctx.insight(msg);
  },
});
