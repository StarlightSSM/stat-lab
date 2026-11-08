// node tools/preview.js <module-id[,id2]> [light|dark]  -> writes .preview/<id>-<theme>.html
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), id = process.argv[2], theme = process.argv[3] || 'light';
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ids = id.split(',');
html = html.replace(/<!-- MODULES:START -->[\s\S]*<!-- MODULES:END -->/, ids.map(i => `<script src="js/m/${i}.js"></script>`).join('\n'));
html = html.replace(/src="js\//g, 'src="../js/');
const trapJs = function () {
  document.documentElement.dataset.theme = '__THEME__';
  window.__errs = [];
  const ce = console.error;
  console.error = function () { window.__errs.push([...arguments].map((a) => (a && a.stack) || String(a)).join(' ')); ce.apply(console, arguments); };
  addEventListener('error', (e) => window.__errs.push(e.message + ' @' + e.filename + ':' + e.lineno));
  setTimeout(() => {
    const p = document.createElement('pre'); p.id = 'errbox';
    p.textContent = window.__errs.length ? window.__errs.map((x) => 'JSERROR ' + x.replace(/</g, '(')).join(' || ') : 'NO_JS_ERRORS';
    document.body.appendChild(p);
  }, 2500);
}.toString().replace('__THEME__', theme);
html = `<script>(${trapJs})();</script>` + html;
fs.mkdirSync(path.join(root, '.preview'), { recursive: true });
const out = path.join(root, '.preview', `${ids[0]}-${theme}.html`);
fs.writeFileSync(out, html); console.log(out);
