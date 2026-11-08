// snap.js — rasterize a live page (DOM) into a canvas through an SVG <foreignObject>.
// Used for the textures on a turning sheet. Same-origin CSS is inlined; web fonts fall back to system fonts
// (the sheet cross-fades into the live DOM when it lands, so small font differences are hidden).
let CSS = null;
function cssText() {
  if (CSS != null) return CSS;
  let t = '';
  for (const ss of document.styleSheets) {
    let rules; try { rules = ss.cssRules; } catch (e) { continue; }
    if (!rules) continue;
    for (const r of rules) t += r.cssText + '\n';
  }
  CSS = t.replace(/\]\]>/g, '');
  return CSS;
}

const SCROLLERS = '.bk-scroll, .code, .tbl-scroll, .r-console, .diagram-scroll';

export async function snapshot(el, { w, h, scale = 2 }) {
  const clone = el.cloneNode(true);
  // canvas pixels → <img>
  const sc = el.querySelectorAll('canvas'), dc = clone.querySelectorAll('canvas');
  sc.forEach((c, i) => {
    const img = document.createElement('img');
    try { img.src = c.toDataURL(); } catch (e) { /* tainted canvas: leave blank */ }
    img.className = c.className; img.setAttribute('style', (c.getAttribute('style') || '') + `;width:${c.clientWidth}px;height:${c.clientHeight}px;display:block`);
    dc[i].replaceWith(img);
  });
  // form state → attributes
  const si = el.querySelectorAll('input, select, textarea'), di = clone.querySelectorAll('input, select, textarea');
  si.forEach((s, i) => {
    const d = di[i]; if (!d) return;
    if (s.type === 'checkbox' || s.type === 'radio') { if (s.checked) d.setAttribute('checked', ''); else d.removeAttribute('checked'); }
    else if (s.tagName === 'SELECT') [...d.options].forEach((o, k) => { if (k === s.selectedIndex) o.setAttribute('selected', ''); else o.removeAttribute('selected'); });
    else d.setAttribute('value', s.value);
  });
  // scroll offsets
  const ss = el.querySelectorAll(SCROLLERS), ds = clone.querySelectorAll(SCROLLERS);
  ss.forEach((s, i) => {
    if (!s.scrollTop && !s.scrollLeft) return;
    const d = ds[i]; const inner = document.createElement('div');
    inner.setAttribute('style', `transform:translate(${-s.scrollLeft}px,${-s.scrollTop}px)`);
    while (d.firstChild) inner.appendChild(d.firstChild);
    d.appendChild(inner); d.style.overflow = 'hidden';
  });
  clone.querySelectorAll('.bk-corner').forEach((n) => n.remove());
  const xml = new XMLSerializer().serializeToString(clone);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject x="0" y="0" width="${w}" height="${h}"><div xmlns="http://www.w3.org/1999/xhtml" style="position:relative;width:${w}px;height:${h}px;overflow:hidden"><style><![CDATA[${cssText()}]]></style>${xml}</div></foreignObject></svg>`;
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  try { await img.decode(); } catch (e) { await new Promise((r) => { img.onload = r; img.onerror = r; }); }
  const cv = document.createElement('canvas'); cv.width = Math.round(w * scale); cv.height = Math.round(h * scale);
  const g = cv.getContext('2d');
  g.fillStyle = '#faf6ee'; g.fillRect(0, 0, cv.width, cv.height);
  try { g.drawImage(img, 0, 0, cv.width, cv.height); } catch (e) { /* ignore */ }
  return cv;
}
