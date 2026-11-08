// pages.js — the book's page list (spreads) and the DOM for each page.
// A module occupies two spreads: A (실험: controls + live figures) and B (해설: concept, formula, tasks, code, sources).
const Lab = window.Lab;
const esc = Lab.esc;
const pad = (n) => String(n).padStart(2, '0');

export function createPages({ stash, hooks }) {
  const subjects = Lab.subjects;
  const spreads = [];
  spreads.push({ key: 'title', kind: 'title', label: '표제지' });
  spreads.push({ key: 'contents', kind: 'front', label: '차례' });
  subjects.forEach((s, ci) => {
    spreads.push({ key: 's-' + s.id, kind: 'chapter', s, ci, label: `제${ci + 1}장 ${s.name}` });
    Lab.modsOf(s.id).forEach((m, mi) => {
      spreads.push({ key: m.id, kind: 'modA', m, s, mi, label: `${m.title} · 실험` });
      spreads.push({ key: m.id + '/notes', kind: 'modB', m, s, mi, label: `${m.title} · 해설` });
    });
  });
  const PER = 6, libPages = [];
  subjects.forEach((s) => { const items = Lab.resources.filter((r) => r.subject === s.id); const parts = Math.ceil(items.length / PER); for (let i = 0; i < parts; i++) libPages.push({ s, items: items.slice(i * PER, i * PER + PER), part: i + 1, parts }); });
  if (libPages.length % 2) libPages.push(null);
  for (let i = 0; i < libPages.length; i += 2) spreads.push({ key: i ? `lib/${i / 2 + 1}` : 'lib', kind: 'lib', pages: [libPages[i], libPages[i + 1]], first: i === 0, label: '공개 강의자료' });
  spreads.push({ key: 'index', kind: 'index', label: '찾아보기' });
  spreads.push({ key: 'colophon', kind: 'end', label: '맺음말' });

  const byKey = Object.fromEntries(spreads.map((s, i) => [s.key, i]));
  const pageNo = (i, side) => 2 * i + (side === 'R' ? 1 : 0);
  const spreadOfMod = (id) => byKey[id];

  let PX = 640, PH = 883; // page size in CSS px (set by setSize)
  const statics = new Map(); // spread index -> {L, R}
  const insts = new Map();   // module id -> instance
  const memo = {};           // module id -> last params (survives eviction / resize)

  function pageEl(side, i, { head = '', subj, cls = '', folio = true } = {}) {
    const el = document.createElement('div');
    el.className = `bk-page is-${side} ${cls}`;
    if (subj) el.style.setProperty('--subj', subj.color);
    el.innerHTML = `<div class="bk-scroll"></div><div class="bk-gutter" aria-hidden="true"></div>${head ? `<div class="bk-head">${head}</div>` : ''}${folio ? `<div class="bk-folio">${pageNo(i, side)}</div>` : ''}<button type="button" class="bk-corner" data-dir="${side === 'R' ? 'next' : 'prev'}" aria-label="${side === 'R' ? '다음 장으로 넘기기' : '이전 장으로 넘기기'}"></button>`;
    el._ver = 0;
    const bump = () => { el._ver++; };
    el.addEventListener('input', bump, true); el.addEventListener('change', bump, true); el.addEventListener('click', bump, true);
    el.querySelector('.bk-scroll').addEventListener('scroll', () => { bump(); hooks.onScroll && hooks.onScroll(el); }, { passive: true });
    stash.appendChild(el);
    return el;
  }
  const body = (el) => el.querySelector('.bk-scroll');
  const figBox = (id, def) => def ? `<figure class="fig3d" data-fig="${id}" style="height:${Math.round((def.height || 0.6) * (PX - 92))}px"><figcaption>${def.caption || '입체 그림'}<span>끌어서 돌려 보기</span></figcaption></figure>` : '';
  const figDef = (id) => (window.BookFig && window.BookFig.get(id)) || null;

  /* ---------- static spreads ---------- */
  function buildStatic(i) {
    const sp = spreads[i];
    if (sp.kind === 'title') {
      const R = pageEl('R', i, { folio: false, cls: 'pg-titlepage' });
      body(R).innerHTML = `<div class="tp">
        <p class="tp-kicker">놀이터처럼 실험하며 읽는 통계 교과서</p>
        <h1 class="tp-title">연구통계<br>실험실</h1>
        <p class="tp-sub">응용확률및통계 · 행동연구방법론 · 구조방정식(AMOS) · SPSS · R · MIS</p>
        ${figBox('title', figDef('title'))}
        <p class="tp-foot">${subjects.length}개 과목 · ${Lab.modules.length}개 실험 · 공개 강의자료 ${Lab.resources.length}건</p></div>`;
      return { L: null, R };
    }
    if (sp.kind === 'front') {
      const L = pageEl('L', i, { head: '차례' }), R = pageEl('R', i, { head: '이 책을 읽는 법' });
      const chRows = subjects.map((s, ci) => `<li style="--subj:${s.color}"><a href="#s-${s.id}"><span class="toc-n">${ci + 1}</span><span class="toc-t">${s.name}<small>${s.en}</small></span><span class="toc-dots"></span><span class="toc-p">${pageNo(byKey['s-' + s.id], 'L')}</span></a></li>`).join('');
      body(L).innerHTML = `<h2 class="pg-h">차례</h2>
        <ol class="toc">${chRows}</ol>
        <ol class="toc toc-back">
          <li><a href="#lib"><span class="toc-n">·</span><span class="toc-t">공개 강의자료 <small>${Lab.resources.length}건 · 무료 강의, 교재, 튜토리얼</small></span><span class="toc-dots"></span><span class="toc-p">${pageNo(byKey.lib, 'L')}</span></a></li>
          <li><a href="#index"><span class="toc-n">·</span><span class="toc-t">찾아보기 <small>실험 ${Lab.modules.length}개 가나다순</small></span><span class="toc-dots"></span><span class="toc-p">${pageNo(byKey.index, 'L')}</span></a></li>
        </ol>`;
      body(R).innerHTML = `<h2 class="pg-h">이 책을 읽는 법</h2>
        <ol class="tp-how">
          <li><b>슬라이더를 움직여 보세요.</b> 각 실험의 왼쪽 쪽에 있는 변수를 바꾸면 오른쪽 쪽의 그래프와 숫자가 바로 바뀝니다.</li>
          <li><b>입체 그림은 돌려 볼 수 있습니다.</b> 종이 위로 솟아오른 그림을 마우스로 끌면 회전하고, 두 번 누르면 처음 각도로 돌아갑니다.</li>
          <li><b>책장 넘기기.</b> 쪽 바깥 아래 모서리를 누르거나, 키보드 ← → 키, 아래 막대의 화살표를 쓰세요.</li>
          <li><b>실험 다음 장은 해설입니다.</b> 핵심 개념, 공식, 실험 과제, 지금 값이 반영된 R·SPSS·AMOS 코드, 관련 공개 강의자료가 있습니다.</li>
          <li><b>화면이 좁으면</b> 한 쪽씩 크게 보여 줍니다. 아래 막대에서 펼침면·한 쪽·둘러보기를 바꿀 수 있습니다.</li>
        </ol>
        <h3 class="pg-h3">과목별 색</h3>
        <div class="legend">${subjects.map((s) => `<span style="--subj:${s.color}"><i></i>${s.name} <b>${Lab.modsOf(s.id).length}</b></span>`).join('')}</div>`;
      return { L, R };
    }
    if (sp.kind === 'chapter') {
      const s = sp.s, ms = Lab.modsOf(s.id), nres = Lab.resources.filter((r) => r.subject === s.id).length;
      const L = pageEl('L', i, { subj: s, cls: 'pg-chapter', head: '차례' }), R = pageEl('R', i, { subj: s, head: s.name });
      body(L).innerHTML = `<div class="ch-open"><p class="ch-no">제 ${sp.ci + 1} 장</p><h1 class="ch-title">${s.name}</h1><p class="en">${s.en}</p><p class="ch-blurb">${s.blurb}</p>
        ${figBox('ch-' + s.id, figDef('ch-' + s.id))}
        <p class="ch-meta"><b>${ms.length}</b>개 실험 · 공개 자료 <b>${nres}</b>건</p></div>`;
      body(R).innerHTML = `<h2 class="pg-h">이 장의 실험</h2><ol class="ch-list">${ms.map((m, k) => `<li><a href="#${m.id}"><span class="mono">${pad(k + 1)}</span><span><b>${m.title}</b><small>${m.summary || ''}</small></span><span class="toc-p">${pageNo(byKey[m.id], 'L')}</span></a></li>`).join('')}</ol>`;
      return { L, R };
    }
    if (sp.kind === 'lib') {
      const mk = (pg, side) => {
        const el = pageEl(side, i, { subj: pg && pg.s, head: '공개 강의자료' });
        if (!pg) { body(el).innerHTML = `<div class="pg-blank"><p>메모</p></div>`; return el; }
        body(el).innerHTML = `${sp.first && side === 'L' ? `<h2 class="pg-h">공개 강의자료</h2><p class="pg-lede">무료로 열려 있는 강의, 교재, 튜토리얼, 인터랙티브 시뮬레이션입니다. 2026-11-08에 모두 접속을 확인했습니다. 제목을 누르면 새 탭에서 열립니다.</p>` : ''}
          <h3 class="lib-h"><span class="chip"><i></i>${pg.s.name}</span><span class="mono">${pg.part} / ${pg.parts}</span></h3>${Lab._resourceList(pg.items)}`;
        return el;
      };
      return { L: mk(sp.pages[0], 'L'), R: mk(sp.pages[1], 'R') };
    }
    if (sp.kind === 'index') {
      const items = Lab.modules.map((m) => ({ t: m.title, en: m.en || '', id: m.id, s: Lab.subjectById[m.subject] })).sort((a, b) => a.t.localeCompare(b.t, 'ko'));
      const half = Math.ceil(items.length / 2);
      const list = (arr) => `<ul class="idx">${arr.map((x) => `<li style="--subj:${x.s.color}"><a href="#${x.id}"><i></i><span>${x.t}</span><span class="toc-dots"></span><span class="toc-p">${pageNo(byKey[x.id], 'L')}</span></a></li>`).join('')}</ul>`;
      const L = pageEl('L', i, { head: '찾아보기' }), R = pageEl('R', i, { head: '찾아보기' });
      body(L).innerHTML = `<h2 class="pg-h">찾아보기</h2>${list(items.slice(0, half))}`;
      body(R).innerHTML = `<div class="pg-h-spacer"></div>${list(items.slice(half))}`;
      return { L, R };
    }
    // end
    const L = pageEl('L', i, { head: '맺음말' }), R = pageEl('R', i, { folio: false, cls: 'pg-endpaper' });
    body(L).innerHTML = `<h2 class="pg-h">맺음말</h2><div class="prose">
      <p>이 책의 실험은 모두 브라우저 안에서 계산됩니다. 분포 함수, 검정, 회귀, 요인분석, 구조방정식 적합은 직접 구현한 통계 엔진이 처리하며, 주요 값은 R의 결과와 대조해 확인했습니다.</p>
      <p>난수는 이 책 고유의 생성기를 쓰기 때문에, 같은 seed를 넣어도 R에서 나오는 숫자와 똑같지는 않습니다. 같은 seed를 넣으면 이 책 안에서는 항상 같은 결과가 나옵니다.</p>
      <p>평면 화면이 편하다면 아래 막대의 <b>평면 보기</b>로 같은 내용을 일반 웹페이지 형태로 볼 수 있습니다.</p></div>
      <p class="pg-lede">${subjects.length}개 과목 · ${Lab.modules.length}개 실험 · 공개 강의자료 ${Lab.resources.length}건</p>`;
    body(R).innerHTML = `<div class="pg-fin">끝</div>`;
    return { L, R };
  }

  /* ---------- module instances (live) ---------- */
  function ensureInst(m) {
    let inst = insts.get(m.id); if (inst) return inst;
    const i = byKey[m.id], s = Lab.subjectById[m.subject];
    inst = { m, s, alive: true,
      A: { L: pageEl('L', i, { subj: s, head: s.name }), R: pageEl('R', i, { subj: s, head: m.title }) },
      B: { L: pageEl('L', i + 1, { subj: s, head: s.name }), R: pageEl('R', i + 1, { subj: s, head: m.title + ' · 해설' }) } };
    insts.set(m.id, inst);
    fill(inst, memo[m.id] || {});
    return inst;
  }

  function fill(inst, over) {
    const { m, s } = inst; const list = Lab.modsOf(s.id), idx = list.indexOf(m);
    const fd = figDef(m.id);
    body(inst.A.L).innerHTML = `<header class="pg-head"><div class="crumbs"><a href="#s-${s.id}" class="chip"><i></i>${s.name}</a><span class="mono">${pad(idx + 1)} / ${pad(list.length)}</span></div>
        <h1 class="pg-title">${m.title}</h1>${m.en ? `<p class="en">${m.en}</p>` : ''}<p class="summary">${m.summary || ''}</p></header>
      ${figBox(m.id, fd)}
      <section class="pg-panel" aria-label="변수 조절"><div class="panel-h"><h2>변수 조절</h2><button class="btn-reset" type="button" title="처음 값으로">초기화</button></div><div class="controls"></div></section>
      <p class="pg-turn">공식 · 해설 · 실험 과제 · 코드는 다음 장에 →</p>`;
    body(inst.A.R).innerHTML = `<div class="pg-bench"><div class="stage"></div><div class="readout"></div><div class="insight" hidden></div></div>`;
    body(inst.B.L).innerHTML = `<h2 class="sec-h">핵심 개념</h2><div class="prose">${m.concept || ''}</div>${m.formula ? `<div class="formula"><div class="formula-h">공식</div>${m.formula}</div>` : ''}`;
    const done = Lab.store.get('tasks.' + m.id, []);
    const res = Lab.resources.filter((r) => (r.modules || []).includes(m.id));
    body(inst.B.R).innerHTML = `${m.tasks && m.tasks.length ? `<section class="tasks"><h2 class="sec-h">실험 과제</h2><ol class="task-list">${m.tasks.map((t, k) => `<li><label><input type="checkbox" data-i="${k}" ${done.includes(k) ? 'checked' : ''}><span>${t}</span></label></li>`).join('')}</ol></section>` : ''}
      <div class="tools-slot">${Lab._toolsHtml(m)}</div>
      <section class="pg-res"><h2 class="sec-h">이 주제를 다루는 공개 강의자료</h2>${Lab._resourceList(res.length ? res : Lab.resources.filter((r) => r.subject === m.subject).slice(0, 3))}</section>`;
    const q = (el, sel) => el.querySelector(sel);
    const els = { stage: q(inst.A.R, '.stage'), readout: q(inst.A.R, '.readout'), insight: q(inst.A.R, '.insight'), controls: q(inst.A.L, '.controls'), tools: q(inst.B.R, '.tools-slot') };
    const ctx = Lab._makeCtx(m, els);
    inst.ctx = ctx;
    Lab._buildControls(m, ctx, els.controls, over);
    const tools = els.tools;
    tools.querySelectorAll('[role=tab]').forEach((b) => b.addEventListener('click', () => {
      tools.querySelectorAll('[role=tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      tools.querySelectorAll('.tool-pane').forEach((p) => { p.hidden = p.dataset.tool !== b.dataset.tab; });
    }));
    tools.querySelectorAll('.copy').forEach((b) => b.addEventListener('click', () => {
      const txt = b.parentElement.querySelector('code').textContent;
      const ok = () => { b.textContent = '복사됨'; setTimeout(() => (b.textContent = '복사'), 1400); };
      try { navigator.clipboard.writeText(txt).then(ok, () => { b.textContent = '복사 실패'; }); } catch (e) { b.textContent = '복사 실패'; }
    }));
    inst.B.R.querySelectorAll('.task-list input').forEach((cb) => cb.addEventListener('change', () => {
      Lab.store.set('tasks.' + m.id, [...inst.B.R.querySelectorAll('.task-list input')].filter((x) => x.checked).map((x) => +x.dataset.i));
    }));
    q(inst.A.L, '.btn-reset').addEventListener('click', () => { stopCtx(inst); delete memo[m.id]; fill(inst, {}); });
    try { m.init && m.init(ctx); } catch (e) { console.error(m.id, e); els.stage.innerHTML = `<p class="err">이 실험을 불러오지 못했습니다: ${esc(e.message)}</p>`; }
    ctx._run('init');
    [inst.A.L, inst.A.R, inst.B.L, inst.B.R].forEach((el) => el._ver++);
    hooks.onFill && hooks.onFill(inst);
  }
  function stopCtx(inst) { if (inst.ctx) { memo[inst.m.id] = Object.assign({}, inst.ctx.p); inst.ctx._stops.forEach((f) => f()); inst.ctx._stops.length = 0; } hooks.onStop && hooks.onStop(inst); }
  function destroy(inst) { stopCtx(inst); inst.alive = false; [inst.A.L, inst.A.R, inst.B.L, inst.B.R].forEach((el) => el.remove()); insts.delete(inst.m.id); }

  function get(i) {
    const sp = spreads[i];
    if (sp.kind === 'modA' || sp.kind === 'modB') { const inst = ensureInst(sp.m); return sp.kind === 'modA' ? inst.A : inst.B; }
    if (!statics.has(i)) statics.set(i, buildStatic(i));
    return statics.get(i);
  }
  /* keep live module instances only near the reader */
  function keep(indices) {
    const want = new Set(indices.filter((i) => i >= 0 && i < spreads.length).map((i) => spreads[i]).filter((sp) => sp.m).map((sp) => sp.m.id));
    for (const inst of [...insts.values()]) if (!want.has(inst.m.id)) destroy(inst);
  }
  function animated(el) {
    for (const inst of insts.values()) if ((el === inst.A.L || el === inst.A.R) && inst.ctx && inst.ctx._stops.length) return true;
    return false;
  }
  function instFor(i) { const sp = spreads[i]; return sp && sp.m ? insts.get(sp.m.id) : null; }
  function setSize(px, ph) {
    PX = px; PH = ph;
    for (const inst of [...insts.values()]) destroy(inst);
    for (const v of statics.values()) { v.L.remove(); v.R.remove(); }
    statics.clear();
  }
  return { spreads, byKey, pageNo, spreadOfMod, get, keep, setSize, animated, instFor, get size() { return [PX, PH]; } };
}
