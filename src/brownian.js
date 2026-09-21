/** Geometric Brownian motion paths and their terminal statistics. */
import { summary } from './stats.js';

export function validatePathParams(p) {
  const problems = [];
  if (!(Number.isInteger(p.paths) && p.paths >= 1)) problems.push('paths must be an integer >= 1');
  if (!(Number.isInteger(p.steps) && p.steps >= 1)) problems.push('steps must be an integer >= 1');
  if (!Number.isFinite(p.drift)) problems.push('drift must be a number');
  if (!(p.vol >= 0)) problems.push('vol must be >= 0');
  return problems;
}

/** Simulates `paths` GBM paths over one unit of time with `steps` increments, starting at 1. */
export function simulatePaths({ paths, steps, drift, vol }, sampler) {
  const problems = validatePathParams({ paths, steps, drift, vol });
  if (problems.length) throw new RangeError(problems.join('; '));
  const dt = 1 / steps;
  const a = (drift - 0.5 * vol * vol) * dt;
  const b = vol * Math.sqrt(dt);
  const out = [];
  const finals = new Float64Array(paths);
  for (let p = 0; p < paths; p += 1) {
    const path = new Float64Array(steps + 1);
    path[0] = 1;
    for (let t = 1; t <= steps; t += 1) {
      const [z] = sampler.normals(1);
      path[t] = path[t - 1] * Math.exp(a + b * z);
    }
    out.push(path);
    finals[p] = path[steps];
  }
  return { paths: out, finals, stats: summary(finals) };
}

/** Closed-form moments of the terminal value S₁ under GBM from S₀ = 1. */
export function terminalMoments({ drift, vol }) {
  const meanValue = Math.exp(drift);
  const varianceValue = Math.exp(2 * drift) * (Math.exp(vol * vol) - 1);
  return { mean: meanValue, std: Math.sqrt(varianceValue) };
}
