const fs=require("fs");let s=fs.readFileSync("index.html","utf8");
const R=[
[".side-notes { display: grid; gap: 18px; min-width: 0; }", ".side-notes { display: grid; gap: 18px; min-width: 0; }\n.side-notes > * { min-width: 0; }"],
[".sec-h { font-size: 12px; font-family: var(--f-mono); font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); margin-bottom: 10px; }", ".sec-h { font-size: 13px; font-weight: 700; letter-spacing: .02em; color: var(--ink-2); margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }\n.sec-h::before { content: \"\"; width: 6px; height: 6px; border-radius: 1px; background: var(--subj, var(--accent)); }"],
[".panel-h h2 { font-size: 12px; font-family: var(--f-mono); font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); }", ".panel-h h2 { font-size: 13px; font-weight: 700; color: var(--ink-2); }"],
[".ctl-heading { font-family: var(--f-mono); font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3);", ".ctl-heading { font-size: 12px; font-weight: 600; color: var(--ink-3);"],
[".insight-tag { font-family: var(--f-mono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--marker); white-space: nowrap; font-weight: 600; }", ".insight-tag { font-size: 12px; color: var(--marker); white-space: nowrap; font-weight: 700; }"],
[".formula-h { font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); margin-bottom: 2px; }", ".formula-h { font-family: var(--f-sans); font-size: 12px; font-weight: 600; color: var(--ink-3); margin-bottom: 2px; }"],
];
for(const [a,b] of R){ if(!s.includes(a)) console.log("MISSING:",a.slice(0,40)); s=s.replace(a,b);} fs.writeFileSync("index.html",s); console.log("ok");
