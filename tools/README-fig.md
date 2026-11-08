# 3D pop-up figures (js/fig/*.js)

BookFig.add('<module-id>', { height, caption, yaw, pitch, build(api) { ...; return { update(p, changed, ctx), tick(dt) } } })

- height: placeholder height as a fraction of the page content width (0.55–0.75).
- Local units: placeholder width = 1 → x ∈ [-0.5, 0.5], z ∈ [-api.d/2, api.d/2], y up from the paper. Keep y ≤ ~0.45.
- api.mat(color, {tint, hatch, opacity}) hatched illustration material (colors: prob rm sem spss r mis accent marker good bad warn ink paper muted s1..s8 or '#hex').
- api.ink({color, opacity}) line material · api.line(pts) · api.setLine(line, pts) · api.edges(mesh) · api.label(text, {size}) (billboard) · api.base() paper plinth.
- api.rng(seed) / api.randn(r): private RNG — never call S.rand() (it would disturb the module's seeded sequence).
- update(p, changed): called on init and every control change (changed = control key, 'init'). tick(dt) → return true while animating.
- InstancedMesh works with api.mat (instanceColor multiplies the base color — use color '#ffffff' when coloring per instance).
- After adding a file: node tools/build.js. Test: timeout 200 bash tools/probe.sh "?open&test" "5000|B.go(B.pages.byKey['<id>'])" 11000 .preview/x.png
