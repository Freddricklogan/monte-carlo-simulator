import { describe, expect, it } from 'vitest';
import { blackScholes, simulateEuropean, terminalPrice, validateOptionParams } from '../src/options.js';
import { makeSampler } from '../src/rng.js';
import { std } from '../src/stats.js';

const P = { S: 100, K: 105, sigma: 0.2, r: 0.05, T: 1, n: 40000 };

describe('blackScholes', () => {
  it('matches the textbook value for the default parameters', () => {
    const bs = blackScholes(P);
    expect(bs.call).toBeCloseTo(8.0214, 3);
    expect(bs.put).toBeCloseTo(7.9004, 3);
    // Put–call parity: C − P = S − K·e^{−rT}
    expect(bs.call - bs.put).toBeCloseTo(P.S - P.K * Math.exp(-P.r * P.T), 9);
    expect(bs.deltaCall - bs.deltaPut).toBeCloseTo(1, 12);
  });
});

describe('simulateEuropean', () => {
  it('validates parameters', () => {
    expect(validateOptionParams({ ...P, sigma: 0 })).toContain('sigma must be positive');
    expect(validateOptionParams({ ...P, n: 1 })).toContain('n must be an integer >= 2');
    expect(() => simulateEuropean({ ...P, K: -1 }, makeSampler())).toThrow(RangeError);
  });
  it('terminal price is exact GBM at T', () => {
    expect(terminalPrice({ S: 100, sigma: 0.2, r: 0.05, T: 1 }, 0)).toBeCloseTo(100 * Math.exp(0.03), 12);
  });
  it('pseudo-random estimate lands within 3 standard errors of Black–Scholes', () => {
    const bs = blackScholes(P);
    const mc = simulateEuropean(P, makeSampler({ seed: 11 }));
    expect(Math.abs(mc.call - bs.call)).toBeLessThan(3 * mc.callSe);
    expect(Math.abs(mc.put - bs.put)).toBeLessThan(3 * mc.putSe);
    expect(mc.prices).toHaveLength(P.n);
    expect(mc.trace[mc.trace.length - 1].n).toBe(P.n);
    expect(mc.trace[mc.trace.length - 1].call).toBeCloseTo(mc.call, 9);
  });
  it('antithetic variates reduce the estimator variance for the same n', () => {
    const errs = (opts) => {
      const runs = [];
      for (let seed = 1; seed <= 12; seed += 1) runs.push(simulateEuropean({ ...P, n: 4000 }, makeSampler({ seed }), opts).call);
      return std(runs);
    };
    expect(errs({ antithetic: true })).toBeLessThan(errs({ antithetic: false }));
  });
  it('Sobol draws converge closer than pseudo-random for the same n', () => {
    const bs = blackScholes(P).call;
    const q = simulateEuropean({ ...P, n: 8192 }, makeSampler({ method: 'sobol', dim: 1 })).call;
    const pseudoErr = [1, 2, 3, 4, 5].map((seed) => Math.abs(simulateEuropean({ ...P, n: 8192 }, makeSampler({ seed })).call - bs));
    const medianPseudo = pseudoErr.sort((a, b) => a - b)[2];
    expect(Math.abs(q - bs)).toBeLessThan(medianPseudo);
  });
});
