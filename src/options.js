/** European option pricing: Black–Scholes benchmark and Monte Carlo under the risk-neutral measure. */
import { normalCdf } from './rng.js';
import { mean, standardError } from './stats.js';

export function blackScholes({ S, K, sigma, r, T }) {
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  const disc = Math.exp(-r * T);
  return {
    call: S * normalCdf(d1) - K * disc * normalCdf(d2),
    put: K * disc * normalCdf(-d2) - S * normalCdf(-d1),
    deltaCall: normalCdf(d1),
    deltaPut: normalCdf(d1) - 1
  };
}

/** Terminal price under geometric Brownian motion, sampled exactly (no time-stepping needed for a European payoff). */
export function terminalPrice({ S, sigma, r, T }, z) {
  return S * Math.exp((r - 0.5 * sigma * sigma) * T + sigma * Math.sqrt(T) * z);
}

export function validateOptionParams(p) {
  const problems = [];
  if (!(p.S > 0)) problems.push('S must be positive');
  if (!(p.K > 0)) problems.push('K must be positive');
  if (!(p.sigma > 0)) problems.push('sigma must be positive');
  if (!(p.T > 0)) problems.push('T must be positive');
  if (!Number.isFinite(p.r)) problems.push('r must be a number');
  if (!(Number.isInteger(p.n) && p.n >= 2)) problems.push('n must be an integer >= 2');
  return problems;
}

/**
 * Monte Carlo price of a European call and put.
 * `sampler.normals(1)` supplies the draws; `antithetic` pairs each z with −z
 * (a variance-reduction technique that costs nothing under GBM).
 * Returns discounted estimates, standard errors and a convergence trace.
 */
export function simulateEuropean(params, sampler, { antithetic = false, tracePoints = 50 } = {}) {
  const problems = validateOptionParams(params);
  if (problems.length) throw new RangeError(problems.join('; '));
  const { K, r, T, n } = params;
  const disc = Math.exp(-r * T);
  const callPayoffs = new Float64Array(n);
  const putPayoffs = new Float64Array(n);
  const prices = new Float64Array(n);
  const trace = [];
  const every = Math.max(1, Math.floor(n / tracePoints));
  let callSum = 0;
  const draws = antithetic ? Math.ceil(n / 2) : n;
  let i = 0;
  for (let d = 0; d < draws && i < n; d += 1) {
    const [z] = sampler.normals(1);
    const zs = antithetic ? [z, -z] : [z];
    for (const zz of zs) {
      if (i >= n) break;
      const st = terminalPrice(params, zz);
      prices[i] = st;
      callPayoffs[i] = Math.max(st - K, 0) * disc;
      putPayoffs[i] = Math.max(K - st, 0) * disc;
      callSum += callPayoffs[i];
      i += 1;
      if (i % every === 0 || i === n) trace.push({ n: i, call: callSum / i });
    }
  }
  return {
    call: mean(callPayoffs),
    put: mean(putPayoffs),
    callSe: standardError(callPayoffs),
    putSe: standardError(putPayoffs),
    prices,
    trace,
    antithetic,
    method: sampler.method
  };
}
