// Inject <script> tags for every js/m/*.js (modules) into index.html and book.html,
// and every js/fig/*.js (3D pop-up figures) into book.html.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const list = (dir) => fs.existsSync(path.join(root, dir)) ? fs.readdirSync(path.join(root, dir)).filter((f) => f.endsWith('.js')).sort() : [];
const mods = list('js/m'), figs = list('js/fig');
const tags = (dir, files) => files.map((f) => `<script src="${dir}/${f}"></script>`).join('\n');
function inject(file, marker, body) {
  const p = path.join(root, file); if (!fs.existsSync(p)) return;
  let html = fs.readFileSync(p, 'utf8');
  const re = new RegExp(`<!-- ${marker}:START -->[\\s\\S]*<!-- ${marker}:END -->`);
  if (!re.test(html)) return;
  html = html.replace(re, `<!-- ${marker}:START -->\n${body}\n<!-- ${marker}:END -->`);
  fs.writeFileSync(p, html);
}
inject('index.html', 'MODULES', tags('js/m', mods));
inject('book.html', 'MODULES', tags('js/m', mods));
inject('book.html', 'FIGS', tags('js/fig', figs));
console.log(`${mods.length} modules, ${figs.length} figures`);
