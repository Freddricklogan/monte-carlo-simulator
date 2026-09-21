import { describe, expect, it } from 'vitest';
import { histogram, mean, percentileSorted, sorted, standardError, std, summary, variance } from '../src/stats.js';

describe('moments', () => {
  it('computes mean, sample variance, std and standard error by hand', () => {
    const xs = [2, 4, 4, 4, 5, 5, 7, 9];
    expect(mean(xs)).toBe(5);
    expect(variance(xs)).toBeCloseTo(32 / 7, 12);
    expect(std(xs)).toBeCloseTo(Math.sqrt(32 / 7), 12);
    expect(standardError(xs)).toBeCloseTo(Math.sqrt(32 / 7) / Math.sqrt(8), 12);
    expect(mean([])).toBeNaN();
    expect(variance([1])).toBeNaN();
  });
});

describe('percentileSorted', () => {
  it('interpolates like R type 7 and clamps the ends', () => {
    const s = sorted([10, 20, 30, 40]);
    expect(percentileSorted(s, 0.5)).toBe(25);
    expect(percentileSorted(s, 0.25)).toBe(17.5);
    expect(percentileSorted(s, 0)).toBe(10);
    expect(percentileSorted(s, 1)).toBe(40);
    expect(percentileSorted(sorted([]), 0.5)).toBeNaN();
  });
});

describe('summary and histogram', () => {
  it('summarises a known set', () => {
    const s = summary([1, 2, 3, 4, 5]);
    expect(s).toMatchObject({ n: 5, mean: 3, min: 1, max: 5, median: 3, p25: 2, p75: 4 });
    expect(s.std).toBeCloseTo(Math.sqrt(2.5), 12);
  });
  it('bins into equal widths with the max in the last bin', () => {
    const h = histogram([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5);
    expect(h.counts).toEqual([2, 2, 2, 2, 3]);
    expect(h.edges[0]).toBe(0);
    expect(h.edges[5]).toBe(10);
    expect(histogram([], 5)).toEqual({ edges: [], counts: [] });
    expect(histogram([3, 3, 3], 5)).toEqual({ edges: [3, 3], counts: [3] });
  });
});
