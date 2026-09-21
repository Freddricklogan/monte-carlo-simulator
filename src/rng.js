/**
 * Random and quasi-random sources. Everything here is pure and seedable so a
 * simulation can be reproduced and tested to a statistical tolerance.
 */

/** Mulberry32: a small, fast 32-bit PRNG with a full 2^32 period. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Acklam's rational approximation of the inverse normal CDF, refined by one
 * Newton step (Halley) using erfc; relative error below 1e-9 across (0, 1).
 */
export function inverseNormal(p) {
  if (!(p > 0 && p < 1)) throw new RangeError('p must be in (0, 1)');
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pLow = 0.02425;
  let x;
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= 1 - pLow) {
    const q = p - 0.5;
    const r = q * q;
    x = ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  // One Halley refinement step.
  const e = normalCdf(x) - p;
  const u = e * Math.sqrt(2 * Math.PI) * Math.exp((x * x) / 2);
  return x - u / (1 + (x * u) / 2);
}

/**
 * Standard normal CDF by Hart's algorithm as given in West (2005), "Better
 * approximations to cumulative normal functions": double-precision accurate
 * (absolute error ~1e-14) over the whole real line.
 */
export function normalCdf(x) {
  const z = Math.abs(x);
  let c;
  if (z > 37) {
    c = 0;
  } else {
    const e = Math.exp((-z * z) / 2);
    if (z < 7.07106781186547) {
      let n = 0.0352624965998911 * z + 0.700383064443688;
      n = n * z + 6.37396220353165;
      n = n * z + 33.912866078383;
      n = n * z + 112.079291497871;
      n = n * z + 221.213596169931;
      n = n * z + 220.206867912376;
      let d = 0.0883883476483184 * z + 1.75566716318264;
      d = d * z + 16.064177579207;
      d = d * z + 86.7807322029461;
      d = d * z + 296.564248779674;
      d = d * z + 637.333633378831;
      d = d * z + 793.826512519948;
      d = d * z + 440.413735824752;
      c = (e * n) / d;
    } else {
      const b = z + 0.65;
      c = e / (z + 1 / (z + 2 / (z + 3 / (z + 4 / b)))) / 2.506628274631;
    }
  }
  return x > 0 ? 1 - c : c;
}

/** Complementary error function, derived from the normal CDF: erfc(x) = 2·Φ(−x·√2). */
export function erfc(x) {
  return 2 * normalCdf(-x * Math.SQRT2);
}

/**
 * Box–Muller transform on a uniform source: returns a function producing
 * independent standard normals (the second value is cached).
 */
export function normalSource(uniform) {
  let spare = null;
  return function normal() {
    if (spare !== null) {
      const s = spare;
      spare = null;
      return s;
    }
    let u = 0;
    let v = 0;
    while (u === 0) u = uniform();
    while (v === 0) v = uniform();
    const r = Math.sqrt(-2 * Math.log(u));
    const theta = 2 * Math.PI * v;
    spare = r * Math.sin(theta);
    return r * Math.cos(theta);
  };
}

// Joe–Kuo direction numbers (new-joe-kuo-6.21201) for the first six Sobol dimensions.
// Dimension 1 is the van der Corput sequence in base 2.
const JOE_KUO = [
  null,
  { s: 1, a: 0, m: [1] },
  { s: 2, a: 1, m: [1, 3] },
  { s: 3, a: 1, m: [1, 3, 1] },
  { s: 3, a: 2, m: [1, 1, 1] },
  { s: 4, a: 1, m: [1, 1, 3, 3] }
];
export const SOBOL_MAX_DIM = JOE_KUO.length;
const BITS = 30;

/**
 * Sobol quasi-random sequence in `dim` dimensions (1..6), Gray-code
 * construction after Antonov–Saleev. `next()` returns the next point as an
 * array of uniforms in (0, 1). The first point (all zeros) is skipped by
 * default because it maps to −∞ under the inverse normal.
 */
export function sobol(dim, { skip = 1 } = {}) {
  if (!Number.isInteger(dim) || dim < 1 || dim > SOBOL_MAX_DIM) throw new RangeError(`dim must be 1..${SOBOL_MAX_DIM}`);
  const V = [];
  for (let j = 0; j < dim; j += 1) {
    const v = new Array(BITS + 1).fill(0);
    if (j === 0) {
      for (let i = 1; i <= BITS; i += 1) v[i] = 1 << (BITS - i);
    } else {
      const { s, a, m } = JOE_KUO[j];
      for (let i = 1; i <= s; i += 1) v[i] = m[i - 1] << (BITS - i);
      for (let i = s + 1; i <= BITS; i += 1) {
        v[i] = v[i - s] ^ (v[i - s] >> s);
        for (let k = 1; k <= s - 1; k += 1) v[i] ^= ((a >> (s - 1 - k)) & 1) * v[i - k];
      }
    }
    V.push(v);
  }
  const x = new Array(dim).fill(0);
  let n = 0;
  const scale = 1 / 2 ** BITS;
  const step = () => {
    // Index of the lowest zero bit of n, 1-based.
    let c = 1;
    let value = n;
    while (value & 1) {
      value >>= 1;
      c += 1;
    }
    for (let j = 0; j < dim; j += 1) x[j] ^= V[j][c];
    n += 1;
  };
  for (let i = 0; i < skip; i += 1) step();
  return {
    next() {
      const out = x.map((xi) => xi * scale);
      step();
      return out;
    }
  };
}

/** A sampler exposes `normals(k)` (k independent N(0,1)) and `uniforms(k)`; it wraps either source. */
export function makeSampler({ method = 'pseudo', dim = 1, seed = 42 } = {}) {
  if (method === 'sobol') {
    const seq = sobol(dim);
    return {
      method,
      uniforms: () => seq.next(),
      normals: () => seq.next().map(inverseNormal)
    };
  }
  const uniform = mulberry32(seed);
  const normal = normalSource(uniform);
  return {
    method: 'pseudo',
    uniforms: (k = dim) => Array.from({ length: k }, () => uniform()),
    normals: (k = dim) => Array.from({ length: k }, () => normal())
  };
}
