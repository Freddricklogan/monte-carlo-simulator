import { describe, expect, it } from 'vitest';
import { simulatePaths, terminalMoments, validatePathParams } from '../src/brownian.js';
import { makeSampler } from '../src/rng.js';

describe('simulatePaths', () => {
  it('validates and shapes the output', () => {
    expect(validatePathParams({ paths: 0, steps: 10, drift: 0, vol: 0.1 })).toContain('paths must be an integer >= 1');
    expect(() => simulatePaths({ paths: 1, steps: 0, drift: 0, vol: 0.1 }, makeSampler())).toThrow(RangeError);
    const r = simulatePaths({ paths: 3, steps: 10, drift: 0.1, vol: 0.2 }, makeSampler({ seed: 2 }));
    expect(r.paths).toHaveLength(3);
    expect(r.paths[0]).toHaveLength(11);
    expect(r.paths[0][0]).toBe(1);
    expect(r.finals[0]).toBe(r.paths[0][10]);
  });
  it('zero volatility is deterministic exponential growth', () => {
    const r = simulatePaths({ paths: 1, steps: 100, drift: 0.1, vol: 0 }, makeSampler());
    expect(r.finals[0]).toBeCloseTo(Math.exp(0.1), 10);
  });
  it('terminal mean and std match the closed form within tolerance', () => {
    const params = { paths: 20000, steps: 50, drift: 0.1, vol: 0.15 };
    const r = simulatePaths(params, makeSampler({ seed: 9 }));
    const m = terminalMoments(params);
    expect(r.stats.mean).toBeCloseTo(m.mean, 1);
    expect(Math.abs(r.stats.mean - m.mean)).toBeLessThan(3 * (m.std / Math.sqrt(params.paths)));
    expect(r.stats.std).toBeCloseTo(m.std, 1);
  });
});

describe('why paths must not use a 1-D Sobol sequence', () => {
  it('feeding successive 1-D Sobol points to the steps collapses the terminal variance', () => {
    const params = { paths: 2000, steps: 50, drift: 0.1, vol: 0.15 };
    const wrong = simulatePaths(params, makeSampler({ method: 'sobol', dim: 1 }));
    const m = terminalMoments(params);
    // The worker guards against this; the test documents the failure it prevents.
    expect(wrong.stats.std).toBeLessThan(m.std / 2);
  });
});
