import { describe, expect, it } from 'vitest';
import { estimatePi, piStandardError } from '../src/pi.js';
import { makeSampler } from '../src/rng.js';

describe('estimatePi', () => {
  it('validates n and keeps only the requested points', () => {
    expect(() => estimatePi(0, makeSampler())).toThrow(RangeError);
    const r = estimatePi(100, makeSampler({ dim: 2 }), { keepPoints: 10 });
    expect(r.points).toHaveLength(10);
    expect(r.inside).toBeLessThanOrEqual(100);
    expect(r.estimate).toBe((4 * r.inside) / 100);
  });
  it('pseudo-random estimate is within 3 standard errors of π', () => {
    const n = 100000;
    const r = estimatePi(n, makeSampler({ seed: 21, dim: 2 }));
    expect(r.error).toBeLessThan(3 * piStandardError(n));
  });
  it('Sobol points estimate π with smaller error than the pseudo-random standard error', () => {
    const n = 16384;
    const q = estimatePi(n, makeSampler({ method: 'sobol', dim: 2 }));
    expect(q.error).toBeLessThan(piStandardError(n));
  });
});
