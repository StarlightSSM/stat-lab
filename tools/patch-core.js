const fs=require("fs");let s=fs.readFileSync("js/core.js","utf8");
const R=[
["function buildControls(mod, ctx, el) {\n    el.innerHTML = '';\n    (mod.controls || []).forEach((c, i) => {", "function buildControls(mod, ctx, el, over = {}) {\n    el.innerHTML = '';\n    (mod.controls || []).forEach((c0, i) => {\n      const c = (c0.key in over) ? Object.assign({}, c0, { value: over[c0.key] }) : c0;"],
["function renderModule(mod) {", "function renderModule(mod, over) {"],
["buildControls(mod, ctx, els.controls);", "buildControls(mod, ctx, els.controls, over || {});"],
["const keepP = Object.assign({}, current.ctx.p); unmount(); renderModule(m); }", "const keepP = Object.assign({}, current.ctx.p); unmount(); renderModule(m, keepP); }"],
["$('#reset').addEventListener('click', () => { const keep = location.hash; unmount(); renderModule(mod); });", "$('#reset').addEventListener('click', () => { unmount(); renderModule(mod); });"],
];
for(const [a,b] of R){ if(!s.includes(a)) console.log("MISSING:",a.slice(0,50)); s=s.replace(a,b);} fs.writeFileSync("js/core.js",s); console.log("ok");
