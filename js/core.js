/* core.js — app shell, router, controls, Plot + Diagram helpers.  Global: Lab
   Module contract (see Lab.add):
   {
     id, subject, order, title, en, summary, keywords?,
     controls: [ {type:'slider', key, label, min, max, step, value, fmt?},
                 {type:'select', key, label, options:[[value,label],...], value},
                 {type:'toggle', key, label, value},
                 {type:'button', key, label, primary?},
                 {type:'custom', key, render(el, ctx)} ],
     concept: html, formula?: html, tasks: [html...],
     tools?: { r?: str|fn(p,ctx), spss?: str|fn(p,ctx), amos?: str|fn(p,ctx) },
     init(ctx), update(ctx, p, changed)   // changed = control key | 'init'
   }
*/
(function () {
  const Lab = { modules: [], byId: {}, resources: [] };
  const $ = (sel, root = document) => root.querySelector(sel);
  const h = (tag, attrs = {}, html) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) { if (v === false || v == null) continue; if (k === 'class') el.className = v; else el.setAttribute(k, v === true ? '' : v); }
    if (html != null) el.innerHTML = html; return el;
  };
  Lab.h = h;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  Lab.esc = esc;

  /* Colors as CSS-variable references (use with .style(), never as SVG attributes) */
  Lab.C = { s1: 'var(--s1)', s2: 'var(--s2)', s3: 'var(--s3)', s4: 'var(--s4)', s5: 'var(--s5)', s6: 'var(--s6)', s7: 'var(--s7)', s8: 'var(--s8)',
    ink: 'var(--ink)', ink2: 'var(--ink-2)', muted: 'var(--ink-3)', line: 'var(--line)', paper: 'var(--paper)', accent: 'var(--accent)', marker: 'var(--marker)',
    good: 'var(--good)', bad: 'var(--bad)', warn: 'var(--warn)' };

  Lab.subjects = [
    { id: 'prob', name: '응용확률및통계', short: '확률·통계', en: 'Applied Probability & Statistics', color: 'var(--c-prob)', blurb: '확률분포에서 출발해 추정, 검정, 회귀까지. 추론통계의 뼈대를 손으로 움직여 봅니다.' },
    { id: 'rm', name: '행동연구방법론', short: '연구방법', en: 'Behavioral Research Methods', color: 'var(--c-rm)', blurb: '측정, 표본, 설계. 분석 이전에 데이터의 질을 결정하는 선택들을 실험합니다.' },
    { id: 'sem', name: '구조방정식 (AMOS)', short: '구조방정식', en: 'Structural Equation Modeling', color: 'var(--c-sem)', blurb: '잠재변수, 경로계수, 적합도. AMOS 경로도를 직접 조작하며 모형을 읽는 법을 익힙니다.' },
    { id: 'spss', name: 'SPSS', short: 'SPSS', en: 'IBM SPSS Statistics', color: 'var(--c-spss)', blurb: '메뉴 경로와 출력표. 데이터를 바꾸면 SPSS 출력표가 어떻게 달라지는지 봅니다.' },
    { id: 'r', name: 'R', short: 'R', en: 'R for Data Analysis', color: 'var(--c-r)', blurb: '코드 한 줄과 결과 한 줄. 파라미터를 바꾸면 R 코드와 콘솔 출력이 함께 바뀝니다.' },
    { id: 'mis', name: '경영정보시스템 (MIS)', short: 'MIS', en: 'Management Information Systems', color: 'var(--c-mis)', blurb: '기술수용, 네트워크 효과, 공급망, IT 투자. 정보시스템 이론을 시뮬레이션으로 확인합니다.' },
  ];
  Lab.subjectById = Object.fromEntries(Lab.subjects.map((s) => [s.id, s]));

  Lab.add = (m) => { m.order = m.order ?? 99; Lab.modules.push(m); Lab.byId[m.id] = m; };
  Lab.addResources = (arr) => { Lab.resources.push(...arr); };
  Lab.modsOf = (sid) => Lab.modules.filter((m) => m.subject === sid).sort((a, b) => a.order - b.order);

  /* ---------- per-viewer progress (localStorage, optional) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('statlab.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('statlab.' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
  };
  Lab.store = store;

  /* ---------- tooltip ---------- */
  let tipEl;
  Lab.tip = {
    show(html, ev) { if (!tipEl) { tipEl = h('div', { class: 'tooltip', role: 'tooltip' }); document.body.appendChild(tipEl); }
      tipEl.innerHTML = html; tipEl.hidden = false; Lab.tip.move(ev); },
    move(ev) { if (!tipEl || tipEl.hidden) return; const pad = 14, r = tipEl.getBoundingClientRect();
      let x = ev.clientX + pad, y = ev.clientY + pad; if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - pad; if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - pad;
      tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px'; },
    hide() { if (tipEl) tipEl.hidden = true; },
  };
  function bindTip(sel, fn) {
    if (!fn) return;
    sel.style('cursor', 'default')
      .on('mouseenter', function (ev, d) { Lab.tip.show(fn(d, ev), ev); d3.select(this).classed('hot', true); })
      .on('mousemove', (ev) => Lab.tip.move(ev))
      .on('mouseleave', function () { Lab.tip.hide(); d3.select(this).classed('hot', false); });
  }

  /* =====================================================================
     Plot — a thin d3 wrapper for the lab's charts.
     ===================================================================== */
  class Plot {
    constructor(parent, o = {}) {
      this.o = Object.assign({ x: [0, 1], y: [0, 1], height: 300, xTicks: 6, yTicks: 5, margin: {} }, o);
      this.wrap = h('figure', { class: 'plot' });
      if (o.title) this.wrap.appendChild(h('figcaption', { class: 'plot-title' }, o.title));
      this.legendEl = h('div', { class: 'plot-legend' }); this.legendEl.hidden = true; this.wrap.appendChild(this.legendEl);
      parent.appendChild(this.wrap);
      const W = Math.max(260, this.wrap.clientWidth || parent.clientWidth || 600);
      const narrow = W < 480;
      const H = narrow ? Math.round(Math.min(this.o.height, Math.max(200, W * 0.78))) : this.o.height;
      const m = Object.assign({ t: 14, r: 18, b: o.xLabel ? 44 : 30, l: o.yLabel ? 56 : 44 }, this.o.margin);
      this.W = W; this.H = H; this.m = m; this.iw = W - m.l - m.r; this.ih = H - m.t - m.b;
      this.svg = d3.select(this.wrap).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('width', '100%').attr('class', 'plot-svg').attr('role', 'img');
      if (o.title) this.svg.attr('aria-label', o.title);
      this.root = this.svg.append('g').attr('transform', `translate(${m.l},${m.t})`);
      this.gridG = this.root.append('g').attr('class', 'grid');
      this.axG = this.root.append('g').attr('class', 'axes');
      this.under = this.root.append('g');
      this.data = this.root.append('g').attr('class', 'data');
      this.over = this.root.append('g');
      if (o.xBand) { this.xs = d3.scaleBand().domain(o.xBand).range([0, this.iw]).padding(o.bandPad ?? 0.3); }
      else this.xs = (o.xLog ? d3.scaleLog() : d3.scaleLinear()).domain(this.o.x).range([0, this.iw]);
      this.ys = d3.scaleLinear().domain(this.o.y).range([this.ih, 0]);
      this.drawAxes();
    }
    x(v) { return this.o.xBand ? this.xs(v) + this.xs.bandwidth() / 2 : this.xs(v); }
    y(v) { return this.ys(v); }
    setX(d) { if (this.o.xBand) { this.o.xBand = d; this.xs.domain(d); } else { this.o.x = d; this.xs.domain(d); } this.drawAxes(); return this; }
    setY(d) { this.o.y = d; this.ys.domain(d); this.drawAxes(); return this; }
    drawAxes() {
      const o = this.o; this.gridG.selectAll('*').remove(); this.axG.selectAll('*').remove();
      const yt = this.ys.ticks(o.yTicks);
      this.gridG.selectAll('line').data(yt).join('line').attr('x1', 0).attr('x2', this.iw).attr('y1', (d) => this.ys(d)).attr('y2', (d) => this.ys(d));
      const xa = d3.axisBottom(this.xs).tickSizeOuter(0);
      if (!o.xBand) { xa.ticks(this.W < 480 ? Math.min(o.xTicks, 5) : o.xTicks); if (o.xFmt) xa.tickFormat(o.xFmt); else xa.tickFormat(d3.format('~g')); }
      else if (o.xFmt) xa.tickFormat(o.xFmt);
      const ya = d3.axisLeft(this.ys).ticks(o.yTicks).tickSizeOuter(0).tickFormat(o.yFmt || d3.format('~g'));
      this.axG.append('g').attr('transform', `translate(0,${this.ih})`).call(xa);
      if (!o.hideY) this.axG.append('g').call(ya);
      if (o.xLabel) this.axG.append('text').attr('class', 'ax-label').attr('x', this.iw / 2).attr('y', this.ih + 38).attr('text-anchor', 'middle').text(o.xLabel);
      if (o.yLabel) this.axG.append('text').attr('class', 'ax-label').attr('transform', `translate(${-42},${this.ih / 2}) rotate(-90)`).attr('text-anchor', 'middle').text(o.yLabel);
    }
    clear() { this.data.selectAll('*').remove(); this.under.selectAll('*').remove(); this.over.selectAll('*').remove(); return this; }
    g(layer = 'data') { return this[layer]; }
    _xy(p) { return Array.isArray(p) ? { x: p[0], y: p[1] } : p; }
    line(pts, s = {}) {
      const gen = d3.line().x((d) => this.x(this._xy(d).x)).y((d) => this.y(this._xy(d).y)).defined((d) => isFinite(this._xy(d).y));
      if (s.curve === 'step') gen.curve(d3.curveStepAfter); else if (s.curve === 'smooth') gen.curve(d3.curveMonotoneX);
      const p = this[s.layer || 'data'].append('path').attr('d', gen(pts)).attr('class', 'mk-line ' + (s.cls || ''))
        .style('stroke', s.color || Lab.C.s1).style('stroke-width', s.width ?? 2).style('fill', 'none').style('opacity', s.opacity ?? 1);
      if (s.dash) p.style('stroke-dasharray', s.dash === true ? '5 4' : s.dash);
      return p;
    }
    area(pts, s = {}) {
      const base = s.base ?? 0;
      const gen = d3.area().x((d) => this.x(this._xy(d).x)).y0(this.y(base)).y1((d) => this.y(this._xy(d).y));
      if (s.curve === 'step') gen.curve(d3.curveStepAfter);
      return this[s.layer || 'under'].append('path').attr('d', gen(pts)).attr('class', 'mk-area').style('fill', s.color || Lab.C.s1).style('opacity', s.opacity ?? 0.12).style('stroke', 'none');
    }
    /* shade under a function f between x0 and x1 */
    shade(f, x0, x1, s = {}) {
      const lo = Math.max(x0, this.o.x[0]), hi = Math.min(x1, this.o.x[1]); if (!(hi > lo)) return null;
      const pts = S.linspace(lo, hi, 120).map((x) => [x, f(x)]);
      return this.area(pts, Object.assign({ opacity: 0.35 }, s));
    }
    dots(pts, s = {}) {
      const data = pts.map((p, i) => Object.assign({ i }, this._xy(p)));
      const sel = this[s.layer || 'data'].append('g').attr('class', 'mk-dots').selectAll('circle').data(data).join('circle')
        .attr('cx', (d) => this.x(d.x)).attr('cy', (d) => this.y(d.y)).attr('r', (d) => d.r ?? s.r ?? 4)
        .style('fill', (d) => d.color || s.color || Lab.C.s1).style('opacity', s.opacity ?? 0.85)
        .style('stroke', s.ring === false ? 'none' : 'var(--paper)').style('stroke-width', s.ring === false ? 0 : 1.5);
      bindTip(sel, s.tip);
      return sel;
    }
    hist(bins, s = {}) {
      const key = s.value || 'n', gap = 1;
      const sel = this[s.layer || 'data'].append('g').attr('class', 'mk-hist').selectAll('rect').data(bins).join('rect')
        .attr('x', (d) => this.x(d.x0) + gap / 2).attr('width', (d) => Math.max(0.5, this.x(d.x1) - this.x(d.x0) - gap))
        .attr('y', (d) => this.y(d[key])).attr('height', (d) => Math.max(0, this.y(0) - this.y(d[key])))
        .style('fill', (d) => d.color || s.color || Lab.C.s1).style('opacity', s.opacity ?? 0.75);
      bindTip(sel, s.tip);
      return sel;
    }
    /* bars: [{x, y, color, tip, label}] — band scale uses category x; numeric x uses s.dw data width */
    bars(items, s = {}) {
      const band = !!this.o.xBand, base = s.base ?? 0;
      const bw = band ? Math.min(s.maxW ?? 48, this.xs.bandwidth()) : Math.max(1, Math.abs(this.xs(s.dw ?? 1) - this.xs(0)) - (s.gap ?? 2));
      const g = this[s.layer || 'data'].append('g').attr('class', 'mk-bars');
      const sel = g.selectAll('rect').data(items).join('rect')
        .attr('x', (d) => this.x(d.x) - bw / 2 + (d.off || 0)).attr('width', d => d.w ?? bw)
        .attr('y', (d) => this.y(Math.max(d.y, base))).attr('height', (d) => Math.abs(this.y(base) - this.y(d.y)))
        .attr('rx', bw > 10 ? 3 : 0)
        .style('fill', (d) => d.color || s.color || Lab.C.s1).style('opacity', (d) => d.opacity ?? s.opacity ?? 0.9);
      bindTip(sel, s.tip);
      if (s.labels) g.selectAll('text').data(items).join('text').attr('class', 'mk-label').attr('text-anchor', 'middle')
        .attr('x', (d) => this.x(d.x) + (d.off || 0) + ((d.w ?? bw) - bw) / 2).attr('y', (d) => this.y(Math.max(d.y, base)) - 5).text((d) => d.label ?? s.labels(d));
      return sel;
    }
    rect(x0, x1, y0, y1, s = {}) {
      return this[s.layer || 'under'].append('rect').attr('x', this.x(Math.min(x0, x1))).attr('width', Math.abs(this.x(x1) - this.x(x0)))
        .attr('y', this.y(Math.max(y0, y1))).attr('height', Math.abs(this.y(y0) - this.y(y1))).style('fill', s.color || Lab.C.s1).style('opacity', s.opacity ?? 0.1);
    }
    vline(xv, s = {}) {
      const g = this[s.layer || 'over'].append('g');
      g.append('line').attr('x1', this.x(xv)).attr('x2', this.x(xv)).attr('y1', s.y0 != null ? this.y(s.y0) : 0).attr('y2', s.y1 != null ? this.y(s.y1) : this.ih)
        .style('stroke', s.color || Lab.C.ink2).style('stroke-width', s.width ?? 1.5).style('stroke-dasharray', s.dash ? (s.dash === true ? '4 4' : s.dash) : null);
      if (s.label) g.append('text').attr('class', 'mk-label').attr('x', this.x(xv) + (s.anchor === 'end' ? -5 : 5)).attr('y', s.labelY ?? 12).attr('text-anchor', s.anchor || 'start').text(s.label);
      return g;
    }
    hline(yv, s = {}) {
      const g = this[s.layer || 'over'].append('g');
      g.append('line').attr('x1', 0).attr('x2', this.iw).attr('y1', this.y(yv)).attr('y2', this.y(yv))
        .style('stroke', s.color || Lab.C.ink2).style('stroke-width', s.width ?? 1.5).style('stroke-dasharray', s.dash ? (s.dash === true ? '4 4' : s.dash) : null);
      if (s.label) g.append('text').attr('class', 'mk-label').attr('x', s.anchor === 'start' ? 4 : this.iw - 4).attr('y', this.y(yv) - 6).attr('text-anchor', s.anchor || 'end').text(s.label);
      return g;
    }
    segment(x1, y1, x2, y2, s = {}) {
      const g = this[s.layer || 'over'].append('g');
      const X1 = this.x(x1), Y1 = this.y(y1), X2 = this.x(x2), Y2 = this.y(y2);
      g.append('line').attr('x1', X1).attr('y1', Y1).attr('x2', X2).attr('y2', Y2).style('stroke', s.color || Lab.C.ink2).style('stroke-width', s.width ?? 1.5)
        .style('stroke-dasharray', s.dash ? (s.dash === true ? '4 4' : s.dash) : null).style('opacity', s.opacity ?? 1);
      if (s.arrow) { const a = Math.atan2(Y2 - Y1, X2 - X1), L = 8; g.append('path').attr('d', `M${X2},${Y2} L${X2 - L * Math.cos(a - 0.4)},${Y2 - L * Math.sin(a - 0.4)} L${X2 - L * Math.cos(a + 0.4)},${Y2 - L * Math.sin(a + 0.4)} Z`).style('fill', s.color || Lab.C.ink2); }
      return g;
    }
    text(xv, yv, str, s = {}) {
      const t = this[s.layer || 'over'].append('text').attr('class', 'mk-label ' + (s.cls || '')).attr('x', this.x(xv) + (s.dx || 0)).attr('y', this.y(yv) + (s.dy || 0))
        .attr('text-anchor', s.anchor || 'middle').text(str);
      if (s.color) t.style('fill', s.color); if (s.size) t.style('font-size', s.size + 'px'); if (s.weight) t.style('font-weight', s.weight);
      return t;
    }
    legend(items) {
      this.legendEl.hidden = !items || !items.length;
      this.legendEl.innerHTML = (items || []).map((it) => `<span class="lg-item"><i class="lg-key lg-${it.type || 'box'}" style="--k:${it.color}"></i>${esc(it.label)}</span>`).join('');
      return this;
    }
  }
  Lab.Plot = Plot;

  /* =====================================================================
     Diagram — AMOS-style path diagrams (observed = rect, latent = ellipse, error = small circle)
     Logical coordinate space: width × height (default 640 × 360); scales to container.
     ===================================================================== */
  class Diagram {
    constructor(parent, o = {}) {
      this.o = Object.assign({ width: 640, height: 360 }, o);
      this.wrap = h('figure', { class: 'diagram' }); parent.appendChild(this.wrap);
      if (o.title) this.wrap.appendChild(h('figcaption', { class: 'plot-title' }, o.title));
      const scroller = h('div', { class: 'diagram-scroll' }); this.wrap.appendChild(scroller);
      this.svg = d3.select(scroller).append('svg').attr('viewBox', `0 0 ${this.o.width} ${this.o.height}`).attr('class', 'diagram-svg').attr('role', 'img');
      this.svg.style('min-width', Math.min(this.o.width, 520) + 'px');
      this.eG = this.svg.append('g'); this.nG = this.svg.append('g'); this.lG = this.svg.append('g');
      this.nodes = {};
    }
    clear() { this.eG.selectAll('*').remove(); this.nG.selectAll('*').remove(); this.lG.selectAll('*').remove(); this.nodes = {}; return this; }
    node(id, s) {
      const n = Object.assign({ type: 'obs', w: s.type === 'lat' ? 110 : s.type === 'err' ? 26 : 92, h: s.type === 'lat' ? 54 : s.type === 'err' ? 26 : 40 }, s, { id });
      this.nodes[id] = n; const g = this.nG.append('g').attr('class', 'dg-node dg-' + n.type).attr('transform', `translate(${n.x},${n.y})`);
      const fill = n.fill || (n.type === 'lat' ? 'var(--node-lat)' : n.type === 'err' ? 'var(--paper)' : 'var(--node-obs)');
      if (n.type === 'obs') g.append('rect').attr('x', -n.w / 2).attr('y', -n.h / 2).attr('width', n.w).attr('height', n.h).attr('rx', 3);
      else g.append('ellipse').attr('rx', n.w / 2).attr('ry', n.h / 2);
      g.select('rect,ellipse').style('fill', fill).style('stroke', n.stroke || 'var(--ink)').style('stroke-width', n.type === 'err' ? 1.2 : 1.6);
      g.append('text').attr('text-anchor', 'middle').attr('dy', n.sub ? -2 : 4.5).attr('class', 'dg-label').style('font-size', (n.type === 'err' ? 11 : 13) + 'px').text(n.label ?? id);
      if (n.sub) g.append('text').attr('text-anchor', 'middle').attr('dy', 13).attr('class', 'dg-sub').text(n.sub);
      if (n.tip) bindTip(g.datum(n), () => n.tip);
      return n;
    }
    _edgePoint(n, dx, dy) { // point on node boundary in direction (dx,dy)
      const L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
      if (n.type === 'obs') { const tx = (n.w / 2) / Math.abs(ux || 1e-9), ty = (n.h / 2) / Math.abs(uy || 1e-9), t = Math.min(tx, ty); return [n.x + ux * t, n.y + uy * t]; }
      const a = n.w / 2, b = n.h / 2, t = 1 / Math.sqrt((ux * ux) / (a * a) + (uy * uy) / (b * b)); return [n.x + ux * t, n.y + uy * t];
    }
    _head(x, y, ang, color, size = 9) {
      this.eG.append('path').attr('d', `M${x},${y} L${x - size * Math.cos(ang - 0.38)},${y - size * Math.sin(ang - 0.38)} L${x - size * Math.cos(ang + 0.38)},${y - size * Math.sin(ang + 0.38)} Z`).style('fill', color);
    }
    /* path(from, to, {value, label, kind:'reg'|'cov', bend, color, width, dim, labelPos}) */
    path(from, to, s = {}) {
      const A = this.nodes[from], B = this.nodes[to]; if (!A || !B) return;
      const kind = s.kind || 'reg', v = s.value;
      const color = s.color || (v != null && v < 0 ? 'var(--s8)' : (s.dim ? 'var(--ink-3)' : 'var(--ink)'));
      const width = s.width ?? (v != null && kind === 'reg' ? 1.2 + Math.min(4, Math.abs(v) * 4) : 1.4);
      const bend = s.bend ?? (kind === 'cov' ? 40 : 0);
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
      const cx = mx + (-dy / L) * bend, cy = my + (dx / L) * bend;
      const p1 = this._edgePoint(A, cx - A.x, cy - A.y), p2 = this._edgePoint(B, cx - B.x, cy - B.y);
      const path = this.eG.append('path').attr('d', bend ? `M${p1[0]},${p1[1]} Q${cx},${cy} ${p2[0]},${p2[1]}` : `M${p1[0]},${p1[1]} L${p2[0]},${p2[1]}`)
        .style('fill', 'none').style('stroke', color).style('stroke-width', width).style('stroke-dasharray', s.dim ? '5 4' : null);
      const aEnd = Math.atan2(p2[1] - (bend ? cy : p1[1]), p2[0] - (bend ? cx : p1[0]));
      this._head(p2[0], p2[1], aEnd, color, 7 + width);
      if (kind === 'cov') { const aStart = Math.atan2(p1[1] - cy, p1[0] - cx); this._head(p1[0], p1[1], aStart, color, 7 + width); }
      const label = s.label ?? (v != null ? S.f(v, 2) : null);
      if (label != null) {
        const t = s.labelPos ?? 0.5, lx = bend ? (1 - t) ** 2 * p1[0] + 2 * (1 - t) * t * cx + t * t * p2[0] : p1[0] + (p2[0] - p1[0]) * t,
          ly = bend ? (1 - t) ** 2 * p1[1] + 2 * (1 - t) * t * cy + t * t * p2[1] : p1[1] + (p2[1] - p1[1]) * t;
        const g = this.lG.append('g').attr('transform', `translate(${lx},${ly})`);
        const txt = g.append('text').attr('class', 'dg-coef').attr('text-anchor', 'middle').attr('dy', 4).text(label);
        const bb = txt.node().getBBox ? txt.node().getBBox() : { x: -14, y: -8, width: 28, height: 14 };
        g.insert('rect', 'text').attr('x', bb.x - 3).attr('y', bb.y - 1).attr('width', bb.width + 6).attr('height', bb.height + 2).attr('rx', 3).style('fill', 'var(--paper)').style('stroke', 'var(--line)');
      }
      return path;
    }
    note(x, y, str, s = {}) { return this.lG.append('text').attr('x', x).attr('y', y).attr('class', 'dg-note').attr('text-anchor', s.anchor || 'middle').text(str); }
  }
  Lab.Diagram = Diagram;

  /* ---------- HTML table helpers (SPSS viewer look, R console) ---------- */
  Lab.spssTable = ({ title, head, rows, note, sub }) => {
    const th = head.map((c) => `<th>${c}</th>`).join('');
    const tr = rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${c}</th>` : `<td>${c}</td>`)).join('')}</tr>`).join('');
    return `<div class="spss-out"><div class="spss-title">${title}</div>${sub ? `<div class="spss-sub">${sub}</div>` : ''}<div class="tbl-scroll"><table class="spss-tbl"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>${note ? `<div class="spss-note">${note}</div>` : ''}</div>`;
  };
  Lab.console = (text) => `<pre class="r-console">${esc(text)}</pre>`;
  Lab.dataTable = ({ head, rows, highlight }) => `<div class="tbl-scroll"><table class="data-tbl"><thead><tr>${head.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr${highlight && highlight(i) ? ' class="hl"' : ''}>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

  /* =====================================================================
     Module runtime
     ===================================================================== */
  let current = null; // {mod, ctx}
  function makeCtx(mod, els) {
    const ctx = {
      mod, stage: els.stage, controlsEl: els.controls, state: {}, p: {}, _stops: [],
      plot(o = {}, parent) { return new Plot(parent || ctx.stage, o); },
      diagram(o = {}, parent) { return new Diagram(parent || ctx.stage, o); },
      row(cls = '', cols = 2) { const r = h('div', { class: 'stage-row ' + cls }); r.style.setProperty('--cols', cols); ctx.stage.appendChild(r); return r; },
      box(cls = '', parent) { const d = h('div', { class: cls }); (parent || ctx.stage).appendChild(d); return d; },
      readout(items) {
        els.readout.innerHTML = items.map((it) => `<div class="tile${it.tone ? ' tone-' + it.tone : ''}"><div class="tile-label">${it.label}</div><div class="tile-value">${it.value}</div>${it.sub ? `<div class="tile-sub">${it.sub}</div>` : ''}</div>`).join('');
      },
      insight(html) { els.insight.innerHTML = html ? `<span class="insight-tag">지금 보이는 것</span><p>${html}</p>` : ''; els.insight.hidden = !html; },
      set(key, value, silent) { const c = ctx._ctl[key]; if (c) c.setValue(value); ctx.p[key] = value; if (!silent) run(key); },
      loop(fn) { let id, last = performance.now(), on = true; const tick = (t) => { if (!on) return; const r = fn(Math.min(64, t - last), t); last = t; if (r === false) { on = false; return; } id = requestAnimationFrame(tick); }; id = requestAnimationFrame(tick); const stop = () => { on = false; cancelAnimationFrame(id); }; ctx._stops.push(stop); return stop; },
      every(ms, fn) { const id = setInterval(fn, ms); const stop = () => clearInterval(id); ctx._stops.push(stop); return stop; },
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      _ctl: {},
    };
    function run(changed) {
      try { mod.update && mod.update(ctx, ctx.p, changed); } catch (e) { console.error(mod.id, e); }
      refreshTools();
    }
    ctx._run = run;
    function refreshTools() {
      if (!mod.tools) return;
      for (const [k, v] of Object.entries(mod.tools)) { const pre = els.tools.querySelector(`[data-tool="${k}"] code`); if (pre) pre.textContent = typeof v === 'function' ? v(ctx.p, ctx) : v; }
    }
    ctx._refreshTools = refreshTools;
    return ctx;
  }

  function buildControls(mod, ctx, el, over = {}) {
    el.innerHTML = '';
    (mod.controls || []).forEach((c0, i) => {
      const c = (c0.key in over) ? Object.assign({}, c0, { value: over[c0.key] }) : c0;
      const id = `ctl-${mod.id}-${c.key || i}`;
      if (c.type === 'slider') {
        const fmt = c.fmt || ((v) => (Number.isInteger(c.step) || c.step >= 1 ? String(v) : String(+(+v).toFixed(String(c.step).split('.')[1]?.length || 2))));
        const w = h('div', { class: 'ctl ctl-slider' }, `<div class="ctl-top"><label for="${id}">${c.label}</label><output for="${id}"></output></div><input type="range" id="${id}" min="${c.min}" max="${c.max}" step="${c.step}">${c.hint ? `<div class="ctl-hint">${c.hint}</div>` : ''}`);
        const inp = w.querySelector('input'), out = w.querySelector('output');
        const paint = () => { const p = (inp.value - c.min) / (c.max - c.min) * 100; inp.style.setProperty('--fill', p + '%'); out.textContent = fmt(+inp.value); };
        inp.value = c.value; ctx.p[c.key] = +c.value; paint();
        inp.addEventListener('input', () => { ctx.p[c.key] = +inp.value; paint(); ctx._run(c.key); });
        ctx._ctl[c.key] = { setValue: (v) => { inp.value = v; paint(); } };
        el.appendChild(w);
      } else if (c.type === 'select') {
        const seg = c.options.length <= (c.segMax ?? 4) && !c.dropdown;
        const w = h('div', { class: 'ctl ctl-select' }, `<div class="ctl-top"><label ${seg ? '' : `for="${id}"`} id="${id}-l">${c.label}</label></div>`);
        ctx.p[c.key] = c.value;
        if (seg) {
          const g = h('div', { class: 'seg', role: 'radiogroup', 'aria-labelledby': id + '-l' });
          c.options.forEach(([v, lab]) => { const b = h('button', { type: 'button', role: 'radio', 'aria-checked': String(v === c.value), 'data-v': v }, lab); b.addEventListener('click', () => { g.querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', 'false')); b.setAttribute('aria-checked', 'true'); ctx.p[c.key] = v; ctx._run(c.key); }); g.appendChild(b); });
          w.appendChild(g);
          ctx._ctl[c.key] = { setValue: (v) => g.querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', String(x.dataset.v === String(v)))) };
        } else {
          const s = h('select', { id }); c.options.forEach(([v, lab]) => { const o = h('option', { value: v }, lab); if (v === c.value) o.selected = true; s.appendChild(o); });
          s.addEventListener('change', () => { const opt = c.options.find(([v]) => String(v) === s.value); ctx.p[c.key] = opt ? opt[0] : s.value; ctx._run(c.key); });
          w.appendChild(s); ctx._ctl[c.key] = { setValue: (v) => { s.value = v; } };
        }
        el.appendChild(w);
      } else if (c.type === 'toggle') {
        const w = h('div', { class: 'ctl ctl-toggle' }, `<label class="switch" for="${id}"><input type="checkbox" id="${id}" ${c.value ? 'checked' : ''}><span class="sw"></span><span>${c.label}</span></label>`);
        const inp = w.querySelector('input'); ctx.p[c.key] = !!c.value;
        inp.addEventListener('change', () => { ctx.p[c.key] = inp.checked; ctx._run(c.key); });
        ctx._ctl[c.key] = { setValue: (v) => { inp.checked = !!v; } };
        el.appendChild(w);
      } else if (c.type === 'button') {
        const b = h('button', { type: 'button', id, class: 'btn ' + (c.primary ? 'btn-primary' : 'btn-ghost') }, c.label);
        b.addEventListener('click', () => ctx._run(c.key));
        const last = el.lastElementChild;
        if (last && last.classList.contains('ctl-buttons')) last.appendChild(b); else { const w = h('div', { class: 'ctl ctl-buttons' }); w.appendChild(b); el.appendChild(w); }
      } else if (c.type === 'custom') {
        const w = h('div', { class: 'ctl ctl-custom' }); el.appendChild(w); c.render(w, ctx);
      } else if (c.type === 'heading') {
        el.appendChild(h('div', { class: 'ctl-heading' }, c.label));
      }
    });
  }

  function toolsHtml(mod) {
    if (!mod.tools) return '';
    const names = { r: 'R', spss: 'SPSS', amos: 'AMOS', lavaan: 'lavaan', python: 'Python' };
    const keys = Object.keys(mod.tools);
    return `<section class="card tools" aria-label="툴에서 직접 해보기"><h2 class="sec-h">툴에서 직접 해보기</h2>
      <div class="tabs" role="tablist">${keys.map((k, i) => `<button role="tab" type="button" aria-selected="${i === 0}" data-tab="${k}">${names[k] || k}</button>`).join('')}</div>
      ${keys.map((k, i) => `<div class="tool-pane" data-tool="${k}" ${i ? 'hidden' : ''}><button class="copy" type="button">복사</button><pre class="code"><code></code></pre></div>`).join('')}
      <p class="tools-note">현재 슬라이더 값이 코드에 반영됩니다. 실제 툴에 붙여 넣으면 같은 분석을 재현할 수 있어요.</p></section>`;
  }

  function resourcesFor(filter) { return Lab.resources.filter(filter); }
  function resourceList(items, empty = '') {
    if (!items.length) return empty;
    return `<ul class="res-list">${items.map((r) => `<li class="res"><a href="${esc(r.url)}" target="_blank" rel="noopener"><span class="res-title">${esc(r.title)}</span><span class="res-meta"><b class="pill">${esc(r.type)}</b><span>${esc(r.provider)}</span><span class="lang">${r.lang === 'ko' ? '한국어' : 'English'}</span></span>${r.note ? `<span class="res-note">${esc(r.note)}</span>` : ''}</a></li>`).join('')}</ul>`;
  }

  function unmount() { if (current) { current.ctx._stops.forEach((f) => f()); Lab.tip.hide(); current = null; } }

  function renderModule(mod, over) {
    const sub = Lab.subjectById[mod.subject], list = Lab.modsOf(mod.subject), idx = list.indexOf(mod);
    const prev = list[idx - 1], next = list[idx + 1];
    const main = $('#main');
    const tasksDone = store.get('tasks.' + mod.id, []);
    main.innerHTML = `
      <article class="module" style="--subj:${sub.color}">
        <header class="mod-head">
          <div class="crumbs"><a href="#s-${sub.id}" class="chip"><i></i>${sub.name}</a><span class="mono">${String(idx + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}</span></div>
          <h1>${mod.title}</h1>
          ${mod.en ? `<p class="en">${mod.en}</p>` : ''}
          <p class="summary">${mod.summary || ''}</p>
        </header>
        <section class="lab">
          <div class="bench">
            <div class="stage" id="stage"></div>
            <div class="readout" id="readout"></div>
            <div class="insight" id="insight" hidden></div>
          </div>
          <aside class="panel" aria-label="변수 조절">
            <div class="panel-h"><h2>변수 조절</h2><button class="btn-reset" type="button" id="reset" title="처음 값으로">초기화</button></div>
            <div id="controls" class="controls"></div>
          </aside>
        </section>
        <section class="notes">
          <div class="card concept"><h2 class="sec-h">핵심 개념</h2><div class="prose">${mod.concept || ''}</div>
            ${mod.formula ? `<div class="formula"><div class="formula-h">공식</div>${mod.formula}</div>` : ''}</div>
          <div class="side-notes">
            ${mod.tasks && mod.tasks.length ? `<div class="card tasks"><h2 class="sec-h">실험 과제</h2><ol class="task-list">${mod.tasks.map((t, i) => `<li><label><input type="checkbox" data-i="${i}" ${tasksDone.includes(i) ? 'checked' : ''}><span>${t}</span></label></li>`).join('')}</ol></div>` : ''}
            <div id="tools-slot">${toolsHtml(mod)}</div>
          </div>
        </section>
        <section class="card res-card"><h2 class="sec-h">이 주제를 다루는 공개 강의자료</h2>
          ${resourceList(resourcesFor((r) => (r.modules || []).includes(mod.id)), resourceList(resourcesFor((r) => r.subject === mod.subject).slice(0, 4), '<p class="muted">자료 목록을 불러오는 중입니다.</p>'))}
          <a class="more" href="#s-${sub.id}">${sub.short} 자료 전체 보기 →</a></section>
        <nav class="pager">
          ${prev ? `<a href="#${prev.id}" class="pg prev"><span>이전</span>${prev.title}</a>` : '<span></span>'}
          ${next ? `<a href="#${next.id}" class="pg next"><span>다음</span>${next.title}</a>` : `<a href="#s-${sub.id}" class="pg next"><span>완료</span>${sub.short} 목록으로</a>`}
        </nav>
      </article>`;
    const els = { stage: $('#stage'), readout: $('#readout'), insight: $('#insight'), controls: $('#controls'), tools: $('#tools-slot') };
    const ctx = makeCtx(mod, els);
    current = { mod, ctx };
    buildControls(mod, ctx, els.controls, over || {});
    // tabs + copy
    els.tools.querySelectorAll('[role=tab]').forEach((b) => b.addEventListener('click', () => {
      els.tools.querySelectorAll('[role=tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      els.tools.querySelectorAll('.tool-pane').forEach((p) => { p.hidden = p.dataset.tool !== b.dataset.tab; });
    }));
    els.tools.querySelectorAll('.copy').forEach((b) => b.addEventListener('click', () => {
      const code = b.parentElement.querySelector('code'); const txt = code.textContent;
      const done = () => { b.textContent = '복사됨'; setTimeout(() => (b.textContent = '복사'), 1400); };
      try { navigator.clipboard.writeText(txt).then(done, () => { selectText(code); b.textContent = '선택됨 · Ctrl+C'; }); } catch (e) { selectText(code); }
    }));
    main.querySelectorAll('.task-list input').forEach((cb) => cb.addEventListener('change', () => {
      const done = [...main.querySelectorAll('.task-list input')].filter((x) => x.checked).map((x) => +x.dataset.i); store.set('tasks.' + mod.id, done); paintNav();
    }));
    $('#reset').addEventListener('click', () => { unmount(); renderModule(mod); });
    try { mod.init && mod.init(ctx); } catch (e) { console.error(mod.id, e); els.stage.innerHTML = `<p class="err">이 실험을 불러오지 못했습니다: ${esc(e.message)}</p>`; }
    ctx._run('init');
    const v = store.get('visited', []); if (!v.includes(mod.id)) { v.push(mod.id); store.set('visited', v); }
    document.title = `${mod.title} · 연구통계 실험실`;
  }
  function selectText(el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }

  /* ---------- home / subject / library views ---------- */
  function modCard(m, i) {
    const v = store.get('visited', []).includes(m.id);
    return `<a class="mcard" href="#${m.id}"><span class="mono num">${String(i + 1).padStart(2, '0')}</span><span class="mcard-t">${m.title}${v ? '<i class="seen" title="열어본 실험">✓</i>' : ''}</span><span class="mcard-s">${m.summary || ''}</span></a>`;
  }
  function renderHome() {
    const main = $('#main'); const total = Lab.modules.length;
    main.innerHTML = `
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow mono">${Lab.subjects.length}개 과목 · ${total}개 실험</p>
          <h1>숫자를 움직이면<br>개념이 보입니다</h1>
          <p class="lede">응용확률및통계, 행동연구방법론, 구조방정식(AMOS), SPSS, R, MIS를 한 곳에서. 각 핵심 개념마다 따로 만든 실험대에서 표본크기, 효과크기, 상관, 경로계수를 직접 바꿔 보며 공부하세요.</p>
          <div class="hero-cta"><a class="btn btn-primary" href="#clt">중심극한정리부터 시작</a><a class="btn btn-ghost" href="#lib">공개 강의자료 모음</a></div>
        </div>
        <figure class="galton" aria-label="갈톤 보드: 공이 핀에 부딪혀 좌우로 떨어지며 정규분포 모양을 만듭니다">
          <canvas id="galton" width="420" height="340"></canvas>
          <figcaption class="mono">갈톤 보드 · 좌우 50:50 선택이 쌓이면 이항분포 → 정규분포</figcaption>
        </figure>
      </section>
      ${Lab.subjects.map((s) => { const ms = Lab.modsOf(s.id); return `
      <section class="subj-sec" style="--subj:${s.color}" id="home-${s.id}">
        <header class="subj-h"><a href="#s-${s.id}" class="chip"><i></i>${s.name}</a><span class="mono muted">${s.en} · ${ms.length}개</span></header>
        <p class="subj-blurb">${s.blurb}</p>
        <div class="mgrid">${ms.map(modCard).join('')}</div>
      </section>`; }).join('')}`;
    galton($('#galton'));
    document.title = '연구통계 실험실';
  }
  function renderSubject(sid) {
    const s = Lab.subjectById[sid]; if (!s) return renderHome(); const ms = Lab.modsOf(sid);
    const res = Lab.resources.filter((r) => r.subject === sid);
    $('#main').innerHTML = `
      <section class="subj-page" style="--subj:${s.color}">
        <header class="mod-head"><div class="crumbs"><a href="#home" class="chip"><i></i>전체 과목</a></div><h1>${s.name}</h1><p class="en">${s.en}</p><p class="summary">${s.blurb}</p></header>
        <h2 class="sec-h">목차</h2>
        <div class="mgrid">${ms.map(modCard).join('')}</div>
        <h2 class="sec-h">공개 강의자료 · 교재 · 인터랙티브</h2>
        ${resourceList(res, '<p class="muted">자료 목록을 불러오는 중입니다.</p>')}
      </section>`;
    document.title = `${s.name} · 연구통계 실험실`;
  }
  function renderLibrary() {
    const types = [...new Set(Lab.resources.map((r) => r.type))];
    $('#main').innerHTML = `
      <section class="lib">
        <header class="mod-head"><div class="crumbs"><a href="#home" class="chip"><i></i>전체 과목</a></div><h1>공개 강의자료 모음</h1>
        <p class="summary">무료로 열려 있는 강의, 교재, 튜토리얼, 인터랙티브 시뮬레이션을 과목별로 모았습니다. 각 실험 페이지 아래에도 관련 자료가 연결되어 있어요.</p></header>
        <div class="lib-filters" role="group" aria-label="자료 필터">
          <div class="seg" id="f-lang"><button type="button" aria-pressed="true" data-v="">전체 언어</button><button type="button" aria-pressed="false" data-v="ko">한국어</button><button type="button" aria-pressed="false" data-v="en">English</button></div>
          <div class="seg" id="f-type"><button type="button" aria-pressed="true" data-v="">전체 유형</button>${types.map((t) => `<button type="button" aria-pressed="false" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div>
        </div>
        <div id="lib-body"></div>
      </section>`;
    const st = { lang: '', type: '' };
    const paint = () => {
      $('#lib-body').innerHTML = Lab.subjects.map((s) => { const items = Lab.resources.filter((r) => r.subject === s.id && (!st.lang || r.lang === st.lang) && (!st.type || r.type === st.type));
        return `<section class="subj-sec" style="--subj:${s.color}"><header class="subj-h"><a href="#s-${s.id}" class="chip"><i></i>${s.name}</a><span class="mono muted">${items.length}개</span></header>${resourceList(items, '<p class="muted">조건에 맞는 자료가 없습니다.</p>')}</section>`; }).join('');
    };
    ['lang', 'type'].forEach((k) => $('#f-' + k).addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; st[k] = b.dataset.v; $('#f-' + k).querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); paint(); }));
    paint(); document.title = '공개 강의자료 · 연구통계 실험실';
  }

  /* ---------- Galton board (home hero) ---------- */
  function galton(cv) {
    if (!cv) return; const dpr = devicePixelRatio || 1, W = 420, H = 340; cv.width = W * dpr; cv.height = H * dpr; const g = cv.getContext('2d'); g.scale(dpr, dpr);
    const rows = 12, cols = rows + 1, pegY0 = 34, dy = 15, dx = 26, cx = W / 2, binTop = pegY0 + rows * dy + 14, counts = Array(cols).fill(0); let balls = [];
    const css = getComputedStyle(document.documentElement); const col = (v) => css.getPropertyValue(v).trim() || '#888';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // seed with a binomial-shaped pile so the first frame is complete
    for (let i = 0; i < 220; i++) counts[S.rbinom(rows, 0.5)]++;
    function draw() {
      g.clearRect(0, 0, W, H); const ink = col('--ink-3'), acc = col('--c-prob'), mk = col('--marker');
      g.fillStyle = ink; for (let r = 0; r < rows; r++) for (let k = 0; k <= r; k++) { g.beginPath(); g.arc(cx + (k - r / 2) * dx, pegY0 + r * dy, 2, 0, 7); g.fill(); }
      const maxC = Math.max(...counts, 1), binH = H - binTop - 8;
      for (let k = 0; k < cols; k++) { const x = cx + (k - rows / 2) * dx, hgt = counts[k] / maxC * binH; g.fillStyle = acc; g.globalAlpha = 0.8; g.fillRect(x - dx / 2 + 2, H - 8 - hgt, dx - 4, hgt); g.globalAlpha = 1; }
      // normal curve overlay
      g.strokeStyle = mk; g.lineWidth = 2; g.beginPath(); const tot = S.sum(counts), sd = Math.sqrt(rows / 4);
      for (let i = 0; i <= 120; i++) { const k = -0.5 + (cols) * i / 120, x = cx + (k - rows / 2) * dx, y = H - 8 - (tot * S.dnorm(k, rows / 2, sd)) / maxC * binH; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      g.fillStyle = mk; balls.forEach((b) => { g.beginPath(); g.arc(b.x, b.y, 3.5, 0, 7); g.fill(); });
    }
    draw(); if (reduced) return;
    let spawn = 0;
    const stop = (() => { let on = true, id; const tick = () => { if (!on || !document.body.contains(cv)) return;
      if (++spawn % 7 === 0) balls.push({ r: -1, k: 0, x: cx, y: 10, t: 0 });
      balls.forEach((b) => { b.t += 0.12; if (b.t >= 1) { b.t = 0; b.r++; if (b.r < rows) { if (Math.random() < 0.5) b.k++; } }
        const r = Math.min(b.r, rows - 1), tx = cx + (b.k - Math.max(b.r, 0) / 2) * dx, ty = b.r < 0 ? 10 + 24 * b.t : pegY0 + b.r * dy + dy * b.t - 6; b.x += (tx - b.x) * 0.35; b.y = ty; });
      balls = balls.filter((b) => { if (b.r >= rows) { counts[b.k]++; if (S.sum(counts) > 900) for (let i = 0; i < cols; i++) counts[i] = Math.round(counts[i] * 0.8); return false; } return true; });
      draw(); id = requestAnimationFrame(tick); }; id = requestAnimationFrame(tick); return () => { on = false; cancelAnimationFrame(id); }; })();
  }

  /* ---------- sidebar + router ---------- */
  function paintNav() {
    const visited = store.get('visited', []), q = ($('#search')?.value || '').trim().toLowerCase();
    $('#nav').innerHTML = Lab.subjects.map((s) => {
      const ms = Lab.modsOf(s.id).filter((m) => !q || (m.title + ' ' + (m.en || '') + ' ' + (m.keywords || '') + ' ' + s.name).toLowerCase().includes(q));
      if (q && !ms.length) return '';
      const seen = Lab.modsOf(s.id).filter((m) => visited.includes(m.id)).length;
      return `<details class="nav-grp" style="--subj:${s.color}" ${q || current?.mod.subject === s.id || location.hash === '#s-' + s.id ? 'open' : ''}>
        <summary><i class="dot"></i><span>${s.name}</span><span class="mono cnt">${seen}/${Lab.modsOf(s.id).length}</span></summary>
        <ul>${ms.map((m) => `<li><a href="#${m.id}" class="${current?.mod.id === m.id ? 'on' : ''}" ${current?.mod.id === m.id ? 'aria-current="page"' : ''}>${visited.includes(m.id) ? '<i class="seen" aria-label="열어봄">✓</i>' : '<i class="unseen"></i>'}${m.title}</a></li>`).join('')}</ul></details>`;
    }).join('');
  }
  function route() {
    unmount(); const id = decodeURIComponent(location.hash.slice(1));
    document.body.classList.remove('nav-open');
    if (Lab.byId[id]) renderModule(Lab.byId[id]);
    else if (id.startsWith('s-')) renderSubject(id.slice(2));
    else if (id === 'lib') renderLibrary();
    else renderHome();
    paintNav(); window.scrollTo(0, 0); $('#main').focus({ preventScroll: true });
  }
  Lab.start = () => {
    $('#search').addEventListener('input', paintNav);
    $('#menu-btn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
    $('#scrim').addEventListener('click', () => document.body.classList.remove('nav-open'));
    addEventListener('hashchange', route);
    let rw = innerWidth, rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (Math.abs(innerWidth - rw) > 40 && current) { rw = innerWidth; const m = current.mod; const keepP = Object.assign({}, current.ctx.p); unmount(); renderModule(m, keepP); } }, 250); });
    route();
  };
  Lab.refresh = () => { if (!current) route(); };

  window.Lab = Lab;
})();
