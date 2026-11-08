/* Shared builder for AMOS-style 3D path diagrams (used by rm-mediation, sem-path, sem-cfa).
   Loaded before the other figure files (build.js sorts names; '_' comes first). */
window.Path3D = {
  /* a group whose children are disposed on clear() */
  layer(api) {
    const g = new api.T.Group(); api.root.add(g);
    g.clearAll = () => {
      g.traverse((o) => { if (o === g) return; o.geometry && o.geometry.dispose(); const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach((x) => { x.map && x.map.dispose(); x.dispose(); }); });
      while (g.children.length) g.remove(g.children[0]);
    };
    return g;
  },
  /* observed variable = box, latent = ellipsoid, error = small ring. Returns {obj, pos, r} */
  node(api, parent, { x, z, kind = 'obs', label, color = 'paper', size = 1, sub }) {
    const T = api.T; let m, top;
    if (kind === 'lat') {
      m = new T.Mesh(new T.SphereGeometry(0.06 * size, 22, 14), api.mat(color, { tint: 0.55 }));
      m.scale.set(1.35, 0.8, 1); m.position.set(x, 0.07 * size, z); top = 0.13 * size; api.edges(m, { angle: 60, opacity: 0.35 });
    } else if (kind === 'err') {
      m = new T.Mesh(new T.TorusGeometry(0.022 * size, 0.0045, 8, 24), api.mat(color, { tint: 0.6 }));
      m.rotation.x = Math.PI / 2; m.position.set(x, 0.03, z); top = 0.05;
    } else {
      m = new T.Mesh(new T.BoxGeometry(0.15 * size, 0.07 * size, 0.08 * size), api.mat(color, { tint: 0.35 }));
      m.position.set(x, 0.035 * size + 0.012, z); top = 0.08 * size + 0.012; api.edges(m, { opacity: 0.9 });
    }
    parent.add(m);
    if (label) { const l = api.label(label, { size: 0.042 * Math.min(1, size + 0.2), weight: 700 }); l.position.set(x, top + 0.035, z); parent.add(l); }
    if (sub) { const l = api.label(sub, { size: 0.03, weight: 500, color: 'muted', mono: true }); l.position.set(x, top + 0.075, z); parent.add(l); }
    return { obj: m, x, z, y: m.position.y, r: kind === 'lat' ? 0.08 * size : kind === 'err' ? 0.026 : 0.075 * size };
  },
  /* arrow tube from node a to node b; thickness ~ |value|; sign → color; optional curve height */
  arrow(api, parent, a, b, { value = 0.5, label, dim = false, lift = 0, both = false, color, via } = {}) {
    const T = api.T;
    const A = new T.Vector3(a.x, a.y, a.z), B = new T.Vector3(b.x, b.y, b.z);
    const dir = B.clone().sub(A); const len = dir.length(); dir.normalize();
    const p0 = A.clone().addScaledVector(dir, a.r), p1 = B.clone().addScaledVector(dir, -b.r - 0.02);
    const mid = via ? new T.Vector3(via.x, via.y, via.z) : p0.clone().lerp(p1, 0.5); if (!via) mid.y += lift;
    const curve = new T.QuadraticBezierCurve3(p0, mid, p1);
    const rad = 0.0035 + 0.013 * Math.min(1, Math.abs(value));
    const col = color || (value < 0 ? 'marker' : 'accent');
    const mat = api.mat(col, { tint: 0.9, opacity: dim ? 0.38 : 1 });
    const tube = new T.Mesh(new T.TubeGeometry(curve, lift || via ? 24 : 4, rad, 10, false), mat); parent.add(tube);
    const head = (pt, tg) => { const c = new T.Mesh(new T.ConeGeometry(rad * 2.4 + 0.006, 0.03, 12), mat); c.position.copy(pt).addScaledVector(tg, 0.012); c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), tg); parent.add(c); };
    head(curve.getPoint(1), curve.getTangent(1).normalize());
    if (both) head(curve.getPoint(0), curve.getTangent(0).normalize().negate());
    if (label) { const l = api.label(label, { size: 0.04, weight: 600, mono: true, bg: 'paper', color: dim ? 'muted' : 'ink' }); const q = curve.getPoint(0.5); l.position.set(q.x, q.y + 0.045, q.z); parent.add(l); }
    return tube;
  },
  fmt(v, d = 2) { const s = (Math.round(v * 10 ** d) / 10 ** d).toFixed(d); return s.replace(/^(-?)0\./, '$1.'); },
};
