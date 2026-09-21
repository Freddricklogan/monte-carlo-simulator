import { describe, expect, it } from 'vitest';
import { erfc, inverseNormal, makeSampler, mulberry32, normalCdf, normalSource, sobol, SOBOL_MAX_DIM } from '../src/rng.js';
import { mean, std } from '../src/stats.js';

describe('mulberry32', () => {
  it('is deterministic per seed and uniform in [0, 1)', () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    const xs = Array.from({ length: 20000 }, () => a());
    expect(xs.slice(0, 5)).toEqual(Array.from({ length: 5 }, () => b()));
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThan(1);
    expect(mean(xs)).toBeCloseTo(0.5, 2);
    expect(mulberry32(8)()).not.toBe(mulberry32(7)());
  });
});

describe('inverseNormal / normalCdf', () => {
  it('matches tabulated quantiles to 1e-6 and round-trips through the CDF', () => {
    expect(inverseNormal(0.5)).toBeCloseTo(0, 9);
    expect(inverseNormal(0.975)).toBeCloseTo(1.959964, 6);
    expect(inverseNormal(0.95)).toBeCloseTo(1.644854, 6);
    expect(inverseNormal(0.01)).toBeCloseTo(-2.326348, 6);
    expect(inverseNormal(1e-6)).toBeCloseTo(-4.753424, 5);
    for (const p of [0.001, 0.1, 0.3, 0.7, 0.9, 0.999]) expect(normalCdf(inverseNormal(p))).toBeCloseTo(p, 6);
    expect(() => inverseNormal(0)).toThrow(RangeError);
    expect(() => inverseNormal(1)).toThrow(RangeError);
  });
  it('erfc is symmetric about 0 and correct at 1', () => {
    expect(erfc(0)).toBeCloseTo(1, 6);
    expect(erfc(1)).toBeCloseTo(0.157299, 6);
    expect(erfc(-1)).toBeCloseTo(2 - 0.157299, 6);
  });
});

describe('normalSource (Box–Muller)', () => {
  it('produces N(0,1) draws within statistical tolerance', () => {
    const normal = normalSource(mulberry32(1));
    const xs = Array.from({ length: 50000 }, () => normal());
    expect(Math.abs(mean(xs))).toBeLessThan(0.02); // 4.5 SE
    expect(std(xs)).toBeCloseTo(1, 1);
    const tail = xs.filter((x) => x > 1.959964).length / xs.length;
    expect(tail).toBeCloseTo(0.025, 2);
  });
});

describe('sobol', () => {
  it('reproduces the first points of the standard sequence', () => {
    const s = sobol(2, { skip: 0 });
    expect(s.next()).toEqual([0, 0]);
    expect(s.next()).toEqual([0.5, 0.5]);
    expect(s.next()).toEqual([0.75, 0.25]);
    expect(s.next()).toEqual([0.25, 0.75]);
    expect(s.next()).toEqual([0.375, 0.375]);
    expect(s.next()).toEqual([0.875, 0.875]);
    expect(s.next()).toEqual([0.625, 0.125]);
    expect(s.next()).toEqual([0.125, 0.625]);
  });
  it('skips the origin by default and stays in (0, 1) in six dimensions', () => {
    const s = sobol(SOBOL_MAX_DIM);
    for (let i = 0; i < 4096; i += 1) {
      const p = s.next();
      expect(p).toHaveLength(SOBOL_MAX_DIM);
      for (const x of p) {
        expect(x).toBeGreaterThan(0);
        expect(x).toBeLessThan(1);
      }
    }
  });
  it('is far more evenly spread than pseudo-random points (2-D discrepancy proxy)', () => {
    // Count points in a 16×16 grid; Sobol's per-cell counts are nearly equal, pseudo-random ones are not.
    const spread = (uniforms) => {
      const cells = new Array(256).fill(0);
      for (let i = 0; i < 4096; i += 1) {
        const [u, v] = uniforms();
        cells[Math.floor(u * 16) * 16 + Math.floor(v * 16)] += 1;
      }
      return std(cells);
    };
    const q = sobol(2);
    const rng = mulberry32(3);
    expect(spread(() => q.next())).toBeLessThan(spread(() => [rng(), rng()]) / 3);
  });
  it('rejects unsupported dimensions', () => {
    expect(() => sobol(0)).toThrow(RangeError);
    expect(() => sobol(SOBOL_MAX_DIM + 1)).toThrow(RangeError);
  });
});

describe('makeSampler', () => {
  it('wraps both sources behind one interface', () => {
    const p = makeSampler({ method: 'pseudo', seed: 5 });
    expect(p.normals(3)).toHaveLength(3);
    expect(p.uniforms(2).every((u) => u >= 0 && u < 1)).toBe(true);
    const q = makeSampler({ method: 'sobol', dim: 2 });
    expect(q.uniforms()).toEqual([0.5, 0.5]);
    expect(q.normals()).toHaveLength(2);
    expect(q.method).toBe('sobol');
  });
});
