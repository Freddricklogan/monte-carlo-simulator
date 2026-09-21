/** Portfolio Value-at-Risk for three correlated assets: Monte Carlo and the parametric benchmark. */
import { inverseNormal } from './rng.js';
import { mean, percentileSorted, sorted } from './stats.js';

export function corrMatrix([r12, r13, r23]) {
  return [
    [1, r12, r13],
    [r12, 1, r23],
    [r13, r23, 1]
  ];
}

/** Cholesky factor L with A = L·Lᵀ; throws if A is not positive definite. */
export function cholesky(A) {
  const n = A.length;
  const L = A.map(() => new Array(n).fill(0));
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j <= i; j += 1) {
      let s = 0;
      for (let k = 0; k < j; k += 1) s += L[i][k] * L[j][k];
      if (i === j) {
        const d = A[i][i] - s;
        if (d <= 0) throw new RangeError('matrix is not positive definite');
        L[i][j] = Math.sqrt(d);
      } else {
        L[i][j] = (A[i][j] - s) / L[j][j];
      }
    }
  }
  return L;
}

export function validateVarParams(p) {
  const problems = [];
  for (const k of ['returns', 'vols', 'weights']) if (!Array.isArray(p[k]) || p[k].length !== 3) problems.push(`${k} needs 3 entries`);
  if (problems.length) return problems;
  if (p.vols.some((v) => !(v >= 0))) problems.push('vols must be >= 0');
  if (Math.abs(p.weights.reduce((a, b) => a + b, 0) - 1) > 1e-9) problems.push('weights must sum to 1');
  if (p.weights.some((w) => w < 0)) problems.push('weights must be >= 0');
  if (!(p.value > 0)) problems.push('value must be positive');
  if (!(Number.isInteger(p.n) && p.n >= 100)) problems.push('n must be an integer >= 100');
  return problems;
}

/** Portfolio expected return and volatility from the weights, vols and correlation matrix (all as fractions). */
export function portfolioMoments({ returns, vols, weights, correlations }) {
  const C = corrMatrix(correlations);
  const expected = weights.reduce((s, w, i) => s + w * returns[i], 0);
  let v = 0;
  for (let i = 0; i < 3; i += 1) for (let j = 0; j < 3; j += 1) v += weights[i] * weights[j] * vols[i] * vols[j] * C[i][j];
  return { expected, vol: Math.sqrt(v) };
}

/** Parametric (normal) VaR at confidence `c` as a positive loss on `value`. */
export function parametricVar({ expected, vol }, value, c = 0.95) {
  return -(expected + vol * inverseNormal(1 - c)) * value;
}

/**
 * Monte Carlo one-period P&L: returns are jointly normal with the given
 * correlation. Reports VaR and expected shortfall as positive losses.
 */
export function simulatePortfolio(params, sampler) {
  const problems = validateVarParams(params);
  if (problems.length) throw new RangeError(problems.join('; '));
  const { returns, vols, weights, correlations, value, n } = params;
  const L = cholesky(corrMatrix(correlations));
  const pnl = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const z = sampler.normals(3);
    let port = 0;
    for (let j = 0; j < 3; j += 1) {
      let cz = 0;
      for (let k = 0; k <= j; k += 1) cz += L[j][k] * z[k];
      port += weights[j] * (returns[j] + vols[j] * cz);
    }
    pnl[i] = port * value;
  }
  const s = sorted(pnl);
  const cut95 = Math.floor(n * 0.05);
  const es95 = -mean(Array.from(s.subarray(0, Math.max(1, cut95))));
  return {
    pnl,
    var95: -percentileSorted(s, 0.05),
    var99: -percentileSorted(s, 0.01),
    es95,
    meanPnl: mean(s),
    best: s[n - 1],
    worst: s[0],
    method: sampler.method
  };
}
