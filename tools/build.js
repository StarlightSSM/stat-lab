// Inject <script> tags for every js/m/*.js into index.html (sorted by subject order then filename)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const files = fs.readdirSync(path.join(root, 'js/m')).filter(f => f.endsWith('.js')).sort();
const tags = files.map(f => `<script src="js/m/${f}"></script>`).join('\n');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<!-- MODULES:START -->[\s\S]*<!-- MODULES:END -->/, `<!-- MODULES:START -->\n${tags}\n<!-- MODULES:END -->`);
fs.writeFileSync(path.join(root, 'index.html'), html);
console.log(files.length + ' modules');
