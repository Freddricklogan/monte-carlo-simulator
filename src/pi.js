/** Estimating π from the fraction of uniform points that fall inside the unit circle inscribed in [−1, 1]². */

/**
 * Draws `n` points from `sampler.uniforms(2)`, mapped to [−1, 1]², and returns
 * the estimate, its absolute error, and (optionally) the points for drawing.
 */
export function estimatePi(n, sampler, { keepPoints = 0 } = {}) {
  if (!(Number.isInteger(n) && n > 0)) throw new RangeError('n must be a positive integer');
  let inside = 0;
  const points = [];
  for (let i = 0; i < n; i += 1) {
    const [u, v] = sampler.uniforms(2);
    const x = u * 2 - 1;
    const y = v * 2 - 1;
    const inCircle = x * x + y * y <= 1;
    if (inCircle) inside += 1;
    if (i < keepPoints) points.push({ x, y, inCircle });
  }
  const estimate = (4 * inside) / n;
  return { n, inside, estimate, error: Math.abs(estimate - Math.PI), points };
}

/** Standard error of the pseudo-random estimator: 4·sqrt(p(1−p)/n) with p = π/4. */
export function piStandardError(n) {
  const p = Math.PI / 4;
  return 4 * Math.sqrt((p * (1 - p)) / n);
}
