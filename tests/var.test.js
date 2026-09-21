import { describe, expect, it } from 'vitest';
import { makeSampler } from '../src/rng.js';
import { cholesky, corrMatrix, parametricVar, portfolioMoments, simulatePortfolio, validateVarParams } from '../src/var.js';

const P = { returns: [0.08, 0.1, 0.12], vols: [0.15, 0.2, 0.25], weights: [0.4, 0.35, 0.25], correlations: [0.3, 0.2, 0.4], value: 1000000, n: 20000 };

describe('cholesky', () => {
  it('reconstructs the matrix and rejects non-positive-definite input', () => {
    const A = corrMatrix([0.3, 0.2, 0.4]);
    const L = cholesky(A);
    for (let i = 0; i < 3; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        let s = 0;
        for (let k = 0; k < 3; k += 1) s += L[i][k] * L[j][k];
        expect(s).toBeCloseTo(A[i][j], 12);
      }
    }
    expect(L[0][1]).toBe(0);
    expect(() => cholesky(corrMatrix([0.9, 0.9, -0.9]))).toThrow(RangeError);
  });
});

describe('portfolioMoments and parametricVar', () => {
  it('matches hand arithmetic', () => {
    const m = portfolioMoments({ returns: [0.1, 0.1, 0.1], vols: [0.2, 0.2, 0.2], weights: [1, 0, 0], correlations: [0, 0, 0] });
    expect(m).toEqual({ expected: 0.1, vol: 0.2 });
    // 95% parametric VaR = −(μ − 1.645σ)·V
    expect(parametricVar(m, 100)).toBeCloseTo(-(0.1 - 1.644854 * 0.2) * 100, 4);
  });
});

describe('simulatePortfolio', () => {
  it('validates weights and sizes', () => {
    expect(validateVarParams({ ...P, weights: [0.5, 0.5, 0.5] })).toContain('weights must sum to 1');
    expect(validateVarParams({ ...P, n: 10 })).toContain('n must be an integer >= 100');
    expect(validateVarParams({ ...P, returns: [1] })[0]).toMatch(/returns needs 3/);
    expect(() => simulatePortfolio({ ...P, value: 0 }, makeSampler({ dim: 3 }))).toThrow(RangeError);
  });
  it('Monte Carlo VaR agrees with the parametric VaR within 3% for jointly normal returns', () => {
    const r = simulatePortfolio(P, makeSampler({ seed: 4, dim: 3 }));
    const m = portfolioMoments(P);
    const pv = parametricVar(m, P.value);
    expect(Math.abs(r.var95 - pv) / pv).toBeLessThan(0.03);
    expect(r.es95).toBeGreaterThan(r.var95);
    expect(r.var99).toBeGreaterThan(r.var95);
    expect(r.worst).toBeLessThanOrEqual(-r.var99);
    expect(r.best).toBeGreaterThan(0);
    expect(r.meanPnl / P.value).toBeCloseTo(m.expected, 1);
  });
});
