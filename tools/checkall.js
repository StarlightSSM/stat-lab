// Builds .preview/full.html: the real site + a script that visits every module hash and logs errors per module.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/src="js\//g, 'src="../js/');
const theme = process.argv[2] || 'light';
const trap = function () {
  document.documentElement.dataset.theme = '__THEME__';
  const errs = []; let cur = 'boot';
  const ce = console.error; console.error = function () { errs.push(cur + ': ' + [...arguments].map((a) => (a && a.message) || String(a)).join(' ')); ce.apply(console, arguments); };
  addEventListener('error', (e) => errs.push(cur + ': ' + e.message + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  addEventListener('load', () => {
    const ids = Lab.modules.map((m) => m.id); let i = 0; const report = [];
    const step = () => {
      if (i > 0) { const st = document.getElementById('stage'); const w = document.documentElement.scrollWidth; report.push(ids[i - 1] + (st && st.children.length ? '' : ' [EMPTY STAGE]') + (w > innerWidth + 2 ? ' [HSCROLL ' + w + ']' : '')); }
      if (i >= ids.length) { const p = document.createElement('pre'); p.id = 'errbox'; p.textContent = 'MODULES ' + ids.length + ' || ' + report.filter((r) => r.includes('[')).join(' || ') + ' || ERRORS ' + errs.length + ' || ' + errs.join(' || ').replace(/</g, '('); document.body.appendChild(p); return; }
      cur = ids[i]; location.hash = ids[i]; i++; setTimeout(step, 700);
    };
    setTimeout(step, 300);
  });
}.toString().replace('__THEME__', theme);
fs.mkdirSync(path.join(root, '.preview'), { recursive: true });
fs.writeFileSync(path.join(root, '.preview', 'full.html'), `<script>(${trap})();</script>` + html);
