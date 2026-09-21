/** Module Web Worker: runs any simulation off the main thread. Loaded as a real file so a strict CSP (script-src 'self') allows it. */
import { simulatePaths } from './brownian.js';
import { simulateEuropean } from './options.js';
import { estimatePi } from './pi.js';
import { makeSampler } from './rng.js';
import { simulatePortfolio } from './var.js';

const DIM = { options: 1, pi: 2, brownian: 1, var: 3 };

self.onmessage = (event) => {
  const { id, type, params, sampler: samplerSpec, options } = event.data;
  try {
    // A path of `steps` increments is a `steps`-dimensional integral; feeding it a 1-D Sobol
    // sequence would correlate successive steps and collapse the variance. Paths always use
    // the seeded pseudo-random source (a Brownian-bridge QMC construction is out of scope).
    const spec = type === 'brownian' ? { ...samplerSpec, method: 'pseudo' } : samplerSpec;
    const sampler = makeSampler({ ...spec, dim: DIM[type] });
    let result;
    if (type === 'options') result = simulateEuropean(params, sampler, options);
    else if (type === 'pi') result = estimatePi(params.n, sampler, options);
    else if (type === 'brownian') result = simulatePaths(params, sampler);
    else if (type === 'var') result = simulatePortfolio(params, sampler);
    else throw new Error(`unknown simulation ${type}`);
    self.postMessage({ id, type, result });
  } catch (error) {
    self.postMessage({ id, type, error: error.message });
  }
};
