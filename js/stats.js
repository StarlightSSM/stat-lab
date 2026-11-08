/* stats.js — shared numeric engine for the lab.  Global: S
   Everything is plain arrays. Seeded RNG so experiments are reproducible. */
(function () {
  const S = {};

  /* ---------- RNG (mulberry32, seedable) ---------- */
  let _s = 20261108 >>> 0;
  S.seed = (n) => { _s = (n >>> 0) || 1; };
  S.rand = () => {
    _s |= 0; _s = (_s + 0x6D2B79F5) | 0;
    let t = Math.imul(_s ^ (_s >>> 15), 1 | _s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let _spare = null;
  S.randn = (mu = 0, sd = 1) => {
    if (_spare !== null) { const z = _spare; _spare = null; return mu + sd * z; }
    let u, v, s;
    do { u = S.rand() * 2 - 1; v = S.rand() * 2 - 1; s = u * u + v * v; } while (s >= 1 || s === 0);
    const m = Math.sqrt(-2 * Math.log(s) / s);
    _spare = v * m; return mu + sd * u * m;
  };
  S.runif = (a = 0, b = 1) => a + (b - a) * S.rand();
  S.rexp = (rate = 1) => -Math.log(1 - S.rand()) / rate;
  S.rbinom = (n, p) => { let k = 0; for (let i = 0; i < n; i++) if (S.rand() < p) k++; return k; };
  S.rpois = (lam) => {
    if (lam > 30) return Math.max(0, Math.round(S.randn(lam, Math.sqrt(lam))));
    const L = Math.exp(-lam); let k = 0, p = 1;
    do { k++; p *= S.rand(); } while (p > L);
    return k - 1;
  };
  S.rbern = (p) => (S.rand() < p ? 1 : 0);
  S.rint = (a, b) => a + Math.floor(S.rand() * (b - a + 1)); // inclusive
  S.shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(S.rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  S.sample = (arr, k, replace = false) => {
    if (replace) return Array.from({ length: k }, () => arr[Math.floor(S.rand() * arr.length)]);
    return S.shuffle(arr).slice(0, k);
  };
  S.rnormVec = (n, mu = 0, sd = 1) => Array.from({ length: n }, () => S.randn(mu, sd));
  /* Skewed / shaped population draws used by CLT-type demos */
  S.rdist = (kind) => {
    switch (kind) {
      case 'uniform': return S.rand();
      case 'exp': return S.rexp(1);
      case 'bimodal': return S.rand() < 0.5 ? S.randn(-2, 0.7) : S.randn(2, 0.7);
      case 'skew': return Math.exp(S.randn(0, 0.6));
      case 'dice': return S.rint(1, 6);
      default: return S.randn();
    }
  };

  /* ---------- descriptives ---------- */
  S.sum = (a) => { let s = 0; for (const v of a) s += v; return s; };
  S.mean = (a) => (a.length ? S.sum(a) / a.length : NaN);
  S.variance = (a) => { const m = S.mean(a); let s = 0; for (const v of a) s += (v - m) ** 2; return s / (a.length - 1); };
  S.sd = (a) => Math.sqrt(S.variance(a));
  S.min = (a) => a.reduce((m, v) => (v < m ? v : m), Infinity);
  S.max = (a) => a.reduce((m, v) => (v > m ? v : m), -Infinity);
  S.quantile = (a, p) => {
    const s = a.slice().sort((x, y) => x - y); const h = (s.length - 1) * p;
    const lo = Math.floor(h), hi = Math.ceil(h); return s[lo] + (h - lo) * (s[hi] - s[lo]);
  };
  S.median = (a) => S.quantile(a, 0.5);
  S.skew = (a) => { const n = a.length, m = S.mean(a), sd = S.sd(a); let s = 0; for (const v of a) s += ((v - m) / sd) ** 3; return (n / ((n - 1) * (n - 2))) * s; };
  S.kurt = (a) => { // SPSS-style excess kurtosis
    const n = a.length, m = S.mean(a), sd = S.sd(a); let s = 0; for (const v of a) s += ((v - m) / sd) ** 4;
    return (n * (n + 1) / ((n - 1) * (n - 2) * (n - 3))) * s - 3 * (n - 1) ** 2 / ((n - 2) * (n - 3));
  };
  S.cov = (x, y) => { const mx = S.mean(x), my = S.mean(y); let s = 0; for (let i = 0; i < x.length; i++) s += (x[i] - mx) * (y[i] - my); return s / (x.length - 1); };
  S.cor = (x, y) => S.cov(x, y) / (S.sd(x) * S.sd(y));
  S.zscores = (a) => { const m = S.mean(a), sd = S.sd(a); return a.map((v) => (v - m) / sd); };
  S.linspace = (a, b, n = 200) => Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1));
  S.seq = (a, b, step = 1) => { const r = []; for (let v = a; v <= b + 1e-9; v += step) r.push(+v.toFixed(10)); return r; };
  S.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  /* histogram bins: returns [{x0,x1,n,density}] */
  S.bin = (a, lo, hi, nb = 30) => {
    const w = (hi - lo) / nb; const bins = Array.from({ length: nb }, (_, i) => ({ x0: lo + i * w, x1: lo + (i + 1) * w, n: 0 }));
    for (const v of a) { const i = Math.floor((v - lo) / w); if (i >= 0 && i < nb) bins[i].n++; else if (v === hi) bins[nb - 1].n++; }
    for (const b of bins) b.density = b.n / (a.length * w || 1);
    return bins;
  };

  /* ---------- special functions ---------- */
  const LG = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  S.lgamma = (z) => {
    if (z < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * z))) - S.lgamma(1 - z);
    z -= 1; let x = 0.99999999999980993; for (let i = 0; i < 8; i++) x += LG[i] / (z + i + 1);
    const t = z + 7.5; return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  };
  S.lchoose = (n, k) => S.lgamma(n + 1) - S.lgamma(k + 1) - S.lgamma(n - k + 1);
  S.choose = (n, k) => Math.round(Math.exp(S.lchoose(n, k)));
  function betacf(a, b, x) {
    const MAXIT = 300, EPS = 3e-14, FPMIN = 1e-300; let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN; d = 1 / d; let h = d;
    for (let m = 1; m <= MAXIT; m++) {
      const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d;
      const del = d * c; h *= del; if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }
  S.ibeta = (x, a, b) => { // regularized incomplete beta I_x(a,b)
    if (x <= 0) return 0; if (x >= 1) return 1;
    const bt = Math.exp(S.lgamma(a + b) - S.lgamma(a) - S.lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  };
  S.igamma = (a, x) => { // regularized lower incomplete gamma P(a,x)
    if (x <= 0) return 0;
    if (x < a + 1) { let sum = 1 / a, del = sum, ap = a; for (let n = 0; n < 500; n++) { ap++; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-15) break; } return sum * Math.exp(-x + a * Math.log(x) - S.lgamma(a)); }
    let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
    for (let i = 1; i < 500; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-15) break; }
    return 1 - Math.exp(-x + a * Math.log(x) - S.lgamma(a)) * h;
  };
  function erfc(x) { // Numerical Recipes erfcc, |err| < 1.2e-7
    const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
    const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? r : 2 - r;
  }
  function bisect(f, target, lo, hi, it = 120) { for (let i = 0; i < it; i++) { const m = (lo + hi) / 2; if (f(m) < target) lo = m; else hi = m; } return (lo + hi) / 2; }

  /* ---------- distributions ---------- */
  S.dnorm = (x, mu = 0, sd = 1) => Math.exp(-0.5 * ((x - mu) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
  S.pnorm = (x, mu = 0, sd = 1) => 0.5 * erfc(-(x - mu) / (sd * Math.SQRT2));
  S.qnorm = (p, mu = 0, sd = 1) => { // Acklam
    if (p <= 0) return -Infinity; if (p >= 1) return Infinity;
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239],
      b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572],
      c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783],
      d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    let q, r, x; const pl = 0.02425;
    if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else if (p <= 1 - pl) { q = p - 0.5; r = q * q; x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
    else { q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    return mu + sd * x;
  };
  S.dt = (t, df) => Math.exp(S.lgamma((df + 1) / 2) - S.lgamma(df / 2) - 0.5 * Math.log(df * Math.PI) - ((df + 1) / 2) * Math.log(1 + t * t / df));
  S.pt = (t, df) => { const x = df / (df + t * t); const tail = 0.5 * S.ibeta(x, df / 2, 0.5); return t > 0 ? 1 - tail : tail; };
  S.qt = (p, df) => bisect((t) => S.pt(t, df), p, -1e3, 1e3);
  S.dchisq = (x, k) => (x <= 0 ? 0 : Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.log(2) - S.lgamma(k / 2)));
  S.pchisq = (x, k) => S.igamma(k / 2, x / 2);
  S.qchisq = (p, k) => bisect((x) => S.pchisq(x, k), p, 0, 1e4);
  S.df = (x, d1, d2) => (x <= 0 ? 0 : Math.exp(0.5 * (d1 * Math.log(d1 * x) + d2 * Math.log(d2) - (d1 + d2) * Math.log(d1 * x + d2)) - Math.log(x) - (S.lgamma(d1 / 2) + S.lgamma(d2 / 2) - S.lgamma((d1 + d2) / 2))));
  S.pf = (x, d1, d2) => (x <= 0 ? 0 : S.ibeta(d1 * x / (d1 * x + d2), d1 / 2, d2 / 2));
  S.qf = (p, d1, d2) => bisect((x) => S.pf(x, d1, d2), p, 0, 1e4);
  S.dbinom = (k, n, p) => (k < 0 || k > n ? 0 : Math.exp(S.lchoose(n, k) + k * Math.log(p || 1e-300) + (n - k) * Math.log((1 - p) || 1e-300)));
  S.pbinom = (k, n, p) => { let s = 0; for (let i = 0; i <= k; i++) s += S.dbinom(i, n, p); return Math.min(1, s); };
  S.dpois = (k, l) => (k < 0 ? 0 : Math.exp(k * Math.log(l) - l - S.lgamma(k + 1)));
  S.ppois = (k, l) => { let s = 0; for (let i = 0; i <= k; i++) s += S.dpois(i, l); return Math.min(1, s); };
  S.dexp = (x, rate = 1) => (x < 0 ? 0 : rate * Math.exp(-rate * x));

  /* ---------- matrices ---------- */
  S.T = (A) => A[0].map((_, j) => A.map((r) => r[j]));
  S.mmul = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
  S.mvec = (A, v) => A.map((r) => r.reduce((s, x, k) => s + x * v[k], 0));
  S.eye = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  S.inv = (A) => {
    const n = A.length, M = A.map((r, i) => [...r, ...S.eye(n)[i]]);
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      [M[c], M[p]] = [M[p], M[c]]; const d = M[c][c]; if (Math.abs(d) < 1e-12) return null;
      for (let j = 0; j < 2 * n; j++) M[c][j] /= d;
      for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c]; for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j]; }
    }
    return M.map((r) => r.slice(n));
  };
  S.det = (A) => { const n = A.length, M = A.map((r) => r.slice()); let d = 1;
    for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      if (Math.abs(M[p][c]) < 1e-15) return 0; if (p !== c) { [M[c], M[p]] = [M[p], M[c]]; d = -d; } d *= M[c][c];
      for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let j = c; j < n; j++) M[r][j] -= f * M[c][j]; } }
    return d; };
  S.chol = (A) => { // lower-triangular L with A = L L'
    const n = A.length, L = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
      let s = A[i][j]; for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      L[i][j] = i === j ? Math.sqrt(Math.max(s, 1e-12)) : s / L[j][j];
    }
    return L;
  };
  /* Jacobi eigen-decomposition of a symmetric matrix → {values (desc), vectors (columns)} */
  S.eigen = (A) => {
    const n = A.length, a = A.map((r) => r.slice()), v = S.eye(n);
    for (let sweep = 0; sweep < 100; sweep++) {
      let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] ** 2;
      if (off < 1e-18) break;
      for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
        if (Math.abs(a[p][q]) < 1e-15) continue;
        const th = (a[q][q] - a[p][p]) / (2 * a[p][q]), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
        const c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (let k = 0; k < n; k++) { const akp = a[k][p], akq = a[k][q]; a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq; }
        for (let k = 0; k < n; k++) { const apk = a[p][k], aqk = a[q][k]; a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk; }
        for (let k = 0; k < n; k++) { const vkp = v[k][p], vkq = v[k][q]; v[k][p] = c * vkp - s * vkq; v[k][q] = s * vkp + c * vkq; }
      }
    }
    const idx = a.map((_, i) => i).sort((i, j) => a[j][j] - a[i][i]);
    return { values: idx.map((i) => a[i][i]), vectors: v.map((r) => idx.map((i) => r[i])) };
  };
  S.corMatrix = (cols) => cols.map((x) => cols.map((y) => (x === y ? 1 : S.cor(x, y))));
  /* multivariate normal draws: R = correlation/covariance matrix; returns n rows */
  S.mvnorm = (n, R, means) => {
    const L = S.chol(R), p = R.length, m = means || Array(p).fill(0);
    return Array.from({ length: n }, () => { const z = Array.from({ length: p }, () => S.randn()); return m.map((mu, i) => mu + L[i].reduce((s, l, k) => s + l * z[k], 0)); });
  };
  /* pair of correlated normals with exact-ish population r */
  S.corrPair = (n, r, mx = 0, sx = 1, my = 0, sy = 1) => {
    const x = [], y = [];
    for (let i = 0; i < n; i++) { const z1 = S.randn(), z2 = S.randn(); x.push(mx + sx * z1); y.push(my + sy * (r * z1 + Math.sqrt(1 - r * r) * z2)); }
    return { x, y };
  };

  /* ---------- tests ---------- */
  S.ttest1 = (a, mu0 = 0) => { const n = a.length, m = S.mean(a), se = S.sd(a) / Math.sqrt(n), t = (m - mu0) / se, df = n - 1;
    return { t, df, p: 2 * (1 - S.pt(Math.abs(t), df)), mean: m, se, ci: [m - S.qt(0.975, df) * se, m + S.qt(0.975, df) * se] }; };
  S.ttest2 = (a, b, equal = true) => {
    const n1 = a.length, n2 = b.length, m1 = S.mean(a), m2 = S.mean(b), v1 = S.variance(a), v2 = S.variance(b);
    let se, df;
    if (equal) { const sp = ((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2); se = Math.sqrt(sp * (1 / n1 + 1 / n2)); df = n1 + n2 - 2; }
    else { se = Math.sqrt(v1 / n1 + v2 / n2); df = (v1 / n1 + v2 / n2) ** 2 / ((v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1)); }
    const t = (m1 - m2) / se, p = 2 * (1 - S.pt(Math.abs(t), df)), q = S.qt(0.975, df);
    const sp = Math.sqrt(((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2));
    return { t, df, p, diff: m1 - m2, se, ci: [m1 - m2 - q * se, m1 - m2 + q * se], d: (m1 - m2) / sp, m1, m2, sd1: Math.sqrt(v1), sd2: Math.sqrt(v2), n1, n2 };
  };
  S.tpaired = (a, b) => S.ttest1(a.map((v, i) => v - b[i]));
  S.levene = (groups) => { // Brown–Forsythe-free classic (mean-centred) Levene as SPSS reports
    const z = groups.map((g) => { const m = S.mean(g); return g.map((v) => Math.abs(v - m)); });
    const r = S.anova1(z); return { F: r.F, df1: r.df1, df2: r.df2, p: r.p };
  };
  S.anova1 = (groups) => {
    const all = groups.flat(), N = all.length, k = groups.length, gm = S.mean(all);
    let ssb = 0, ssw = 0;
    groups.forEach((g) => { const m = S.mean(g); ssb += g.length * (m - gm) ** 2; for (const v of g) ssw += (v - m) ** 2; });
    const df1 = k - 1, df2 = N - k, msb = ssb / df1, msw = ssw / df2, F = msb / msw;
    return { F, df1, df2, p: 1 - S.pf(F, df1, df2), ssb, ssw, sst: ssb + ssw, msb, msw, eta2: ssb / (ssb + ssw), means: groups.map(S.mean), grand: gm };
  };
  S.chisqTest = (tab) => {
    const R = tab.length, C = tab[0].length, rs = tab.map(S.sum), cs = tab[0].map((_, j) => S.sum(tab.map((r) => r[j]))), N = S.sum(rs);
    const E = tab.map((r, i) => r.map((_, j) => rs[i] * cs[j] / N)); let chi2 = 0;
    tab.forEach((r, i) => r.forEach((o, j) => { chi2 += (o - E[i][j]) ** 2 / E[i][j]; }));
    const df = (R - 1) * (C - 1);
    return { chi2, df, p: 1 - S.pchisq(chi2, df), expected: E, rowSums: rs, colSums: cs, N, cramerV: Math.sqrt(chi2 / (N * (Math.min(R, C) - 1))) };
  };
  S.corTest = (x, y) => { const n = x.length, r = S.cor(x, y), t = r * Math.sqrt((n - 2) / (1 - r * r)), z = Math.atanh(r), se = 1 / Math.sqrt(n - 3);
    return { r, t, df: n - 2, p: 2 * (1 - S.pt(Math.abs(t), n - 2)), ci: [Math.tanh(z - 1.96 * se), Math.tanh(z + 1.96 * se)], n }; };
  S.spearman = (x, y) => { const rk = (a) => { const s = a.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]), r = Array(a.length); s.forEach((p, i) => { r[p[1]] = i + 1; }); return r; }; return S.cor(rk(x), rk(y)); };

  /* ---------- regression ---------- */
  /* X: rows of predictor values (no intercept column). Returns coefficient vectors incl. intercept at [0]. */
  S.ols = (X, y, names) => {
    const n = y.length, k = X[0] ? X[0].length : 0, D = X.map((r) => [1, ...r]);
    const Dt = S.T(D), XtX = S.mmul(Dt, D), XtXi = S.inv(XtX);
    if (!XtXi) return null;
    const b = S.mvec(XtXi, S.mvec(Dt, y)), fitted = D.map((r) => r.reduce((s, v, j) => s + v * b[j], 0)), resid = y.map((v, i) => v - fitted[i]);
    const my = S.mean(y), sse = S.sum(resid.map((e) => e * e)), sst = S.sum(y.map((v) => (v - my) ** 2)), ssr = sst - sse;
    const dfe = n - k - 1, mse = sse / dfe, se = XtXi.map((r, i) => Math.sqrt(Math.max(0, r[i] * mse)));
    const t = b.map((v, i) => v / se[i]), p = t.map((v) => 2 * (1 - S.pt(Math.abs(v), dfe)));
    const r2 = ssr / sst, adjR2 = 1 - (1 - r2) * (n - 1) / dfe, F = (ssr / k) / mse;
    const sy = S.sd(y), beta = [null, ...Array.from({ length: k }, (_, j) => b[j + 1] * S.sd(X.map((r) => r[j])) / sy)];
    const q = S.qt(0.975, dfe), ci = b.map((v, i) => [v - q * se[i], v + q * se[i]]);
    return { b, se, t, p, beta, ci, fitted, resid, r2, adjR2, F, pF: 1 - S.pf(F, k, dfe), sse, ssr, sst, mse, sigma: Math.sqrt(mse), df1: k, df2: dfe, n, k, names: names || Array.from({ length: k }, (_, j) => 'X' + (j + 1)) };
  };
  S.vif = (X) => { const k = X[0].length; return Array.from({ length: k }, (_, j) => {
    if (k < 2) return 1; const yj = X.map((r) => r[j]), Xo = X.map((r) => r.filter((_, i) => i !== j)), m = S.ols(Xo, yj); return m ? 1 / (1 - m.r2) : Infinity; }); };
  /* logistic regression via IRLS */
  S.logit = (X, y) => {
    const D = X.map((r) => [1, ...r]), k = D[0].length; let b = Array(k).fill(0), cov = null;
    for (let it = 0; it < 30; it++) {
      const p = D.map((r) => 1 / (1 + Math.exp(-r.reduce((s, v, j) => s + v * b[j], 0))));
      const W = p.map((pi) => Math.max(pi * (1 - pi), 1e-9));
      const H = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => D.reduce((s, r, n) => s + r[i] * r[j] * W[n], 0)));
      const g = Array.from({ length: k }, (_, i) => D.reduce((s, r, n) => s + r[i] * (y[n] - p[n]), 0));
      cov = S.inv(H); if (!cov) break; const step = S.mvec(cov, g); b = b.map((v, i) => v + step[i]);
      if (Math.max(...step.map(Math.abs)) < 1e-8) break;
    }
    const p = D.map((r) => 1 / (1 + Math.exp(-r.reduce((s, v, j) => s + v * b[j], 0))));
    const ll = S.sum(y.map((v, i) => v * Math.log(p[i] + 1e-12) + (1 - v) * Math.log(1 - p[i] + 1e-12)));
    const p0 = S.mean(y), ll0 = S.sum(y.map((v) => v * Math.log(p0) + (1 - v) * Math.log(1 - p0)));
    const se = cov ? cov.map((r, i) => Math.sqrt(Math.abs(r[i]))) : b.map(() => NaN);
    const z = b.map((v, i) => v / se[i]);
    return { b, se, z, p: z.map((v) => 2 * (1 - S.pnorm(Math.abs(v)))), or: b.map(Math.exp), prob: p, ll, ll0, chi2: 2 * (ll - ll0), nagelkerke: (1 - Math.exp(2 * (ll0 - ll) / y.length)) / (1 - Math.exp(2 * ll0 / y.length)) };
  };

  /* ---------- psychometrics ---------- */
  /* items: array of columns (each column = one item's scores) */
  S.cronbach = (items) => { const k = items.length, tot = items[0].map((_, i) => S.sum(items.map((c) => c[i])));
    return (k / (k - 1)) * (1 - S.sum(items.map(S.variance)) / S.variance(tot)); };
  S.alphaFromR = (k, rbar) => (k * rbar) / (1 + (k - 1) * rbar);
  S.compositeReliability = (lambdas) => { const s = S.sum(lambdas) ** 2, e = S.sum(lambdas.map((l) => 1 - l * l)); return s / (s + e); };
  S.ave = (lambdas) => S.mean(lambdas.map((l) => l * l));

  /* ---------- formatting ---------- */
  S.f = (x, d = 2) => (x === null || x === undefined || Number.isNaN(x) ? '—' : (!isFinite(x) ? (x > 0 ? '∞' : '−∞') : Number(x).toFixed(d).replace('-', '−')));
  S.apa = (x, d = 3) => S.f(x, d).replace(/^(−?)0\./, '$1.'); // drop leading zero for bounded stats
  S.fp = (p) => (p < 0.001 ? '< .001' : S.apa(p, 3));
  S.pct = (x, d = 1) => (x * 100).toFixed(d) + '%';
  S.comma = (x, d = 0) => Number(x).toLocaleString('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: d });
  S.stars = (p) => (p < 0.001 ? '***' : p < 0.01 ? '**' : p < 0.05 ? '*' : '');

  window.S = S;
})();
