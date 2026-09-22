/** Wires the four simulations to the page, the worker and the Executive Shell. */
import { terminalMoments } from './brownian.js';
import { loadChartLib, makeCharts } from './charts.js';
import { mountExecShell } from './exec-shell.js';
import { blackScholes } from './options.js';
import { piStandardError } from './pi.js';
import { histogram, sorted, summary } from './stats.js';
import { $, fixed, initTabs, int, money, num, pct, samplerSpec, setAll, setBusy, setProgress, setText } from './ui.js';
import { parametricVar, portfolioMoments } from './var.js';

const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
const pending = new Map();
let nextId = 1;
worker.onmessage = (e) => {
  const { id, result, error } = e.data;
  const p = pending.get(id);
  pending.delete(id);
  if (!p) return;
  if (error) p.reject(new Error(error));
  else p.resolve(result);
};
function run(type, params, options = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker.postMessage({ id, type, params, sampler: samplerSpec(), options });
  });
}

const state = { options: null, pi: null, brownian: null, var: null, tab: 'options' };
let charts = makeCharts(null);
let shell;

// --- Options -----------------------------------------------------------------
function optionParams() {
  return { S: num('stockPrice'), K: num('strikePrice'), sigma: num('volatility'), r: num('riskFreeRate'), T: num('timeToExpiry'), n: int('numSimulations') };
}
async function runOptions() {
  const btn = $('runOptionsBtn');
  const params = optionParams();
  setBusy(btn, true, 'Run simulation');
  setProgress('optionsProgress', 0.1);
  try {
    const mc = await run('options', params, { antithetic: $('antithetic').checked });
    const bs = blackScholes(params);
    state.options = { mc, bs, params };
    charts.histogram($('optionsHistogram'), histogram(Array.from(mc.prices), 40), 'Terminal price');
    charts.line($('optionsConvergence'), mc.trace.map((t) => t.n), mc.trace.map((t) => t.call), 'Paths', 'Call estimate', charts.colours.ACCENT, bs.call);
    const s = summary(mc.prices);
    setText('callPrice', money(mc.call));
    setText('putPrice', money(mc.put));
    setText('bsCall', money(bs.call));
    setText('bsPut', money(bs.put));
    setText('callCI', `${money(mc.call - 1.96 * mc.callSe)} – ${money(mc.call + 1.96 * mc.callSe)}`);
    setText('callErr', `${money(Math.abs(mc.call - bs.call))} (${(Math.abs(mc.call - bs.call) / mc.callSe).toFixed(2)} SE)`);
    setText('meanPrice', money(s.mean));
    setText('stdDev', money(s.std));
    setText('minPrice', money(s.min));
    setText('maxPrice', money(s.max));
    setText('medianPrice', money(s.median));
    setText('p95', money(s.p95));
    setText('p5', money(s.p5));
    setText('optionsProgressText', `${mc.method}${mc.antithetic ? ' + antithetic' : ''} · ${params.n.toLocaleString()} paths`);
    setProgress('optionsProgress', 1);
  } catch (err) {
    setText('optionsProgressText', err.message);
    setProgress('optionsProgress', 0);
  }
  setBusy(btn, false, 'Run simulation');
  shell?.refreshKpis();
}
function resetOptions() {
  for (const [id, v] of Object.entries({ stockPrice: 100, strikePrice: 105, volatility: 0.2, riskFreeRate: 0.05, timeToExpiry: 1, numSimulations: 20000 })) $(id).value = v;
  setAll(['callPrice', 'putPrice', 'bsCall', 'bsPut', 'callCI', 'callErr', 'meanPrice', 'stdDev', 'minPrice', 'maxPrice', 'medianPrice', 'p95', 'p5'], '—');
  setProgress('optionsProgress', 0);
  setText('optionsProgressText', 'Ready');
  state.options = null;
  shell?.refreshKpis();
}

// --- Pi ----------------------------------------------------------------------
function drawPi(points) {
  const canvas = $('piCanvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const r = w / 2 - 8;
  ctx.clearRect(0, 0, w, w);
  ctx.strokeStyle = 'rgba(139,152,176,.6)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(w / 2 - r, w / 2 - r, 2 * r, 2 * r);
  ctx.beginPath();
  ctx.arc(w / 2, w / 2, r, 0, 2 * Math.PI);
  ctx.stroke();
  for (const p of points) {
    ctx.fillStyle = p.inCircle ? 'rgba(88,166,255,.85)' : 'rgba(248,81,73,.7)';
    ctx.fillRect(w / 2 + p.x * r - 1, w / 2 + p.y * r - 1, 2, 2);
  }
}
async function runPi() {
  const btn = $('runPiBtn');
  const n = int('piPoints');
  setBusy(btn, true, 'Estimate π');
  try {
    const r = await run('pi', { n }, { keepPoints: Math.min(n, 20000) });
    state.pi = r;
    drawPi(r.points);
    setText('estimatedPi', r.estimate.toFixed(5));
    setText('piError', r.error.toFixed(5));
    setText('piSe', piStandardError(n).toFixed(5));
    setText('pointsInCircle', r.inside.toLocaleString());
    setText('pointsInSquare', r.n.toLocaleString());
    setText('piProgressText', `${samplerSpec().method} · ${n.toLocaleString()} points`);
    setProgress('piProgress', 1);
  } catch (err) {
    setText('piProgressText', err.message);
  }
  setBusy(btn, false, 'Estimate π');
  shell?.refreshKpis();
}
function resetPi() {
  $('piPoints').value = 20000;
  drawPi([]);
  setAll(['estimatedPi', 'piError', 'piSe', 'pointsInCircle', 'pointsInSquare'], '—');
  setProgress('piProgress', 0);
  setText('piProgressText', 'Ready');
  state.pi = null;
  shell?.refreshKpis();
}

// --- Brownian ------------------------------------------------------------------
function pathParams() {
  return { paths: int('numPaths'), steps: int('timeSteps'), drift: num('drift'), vol: num('brownVolatility') };
}
async function runBrownian() {
  const btn = $('runBrownianBtn');
  const params = pathParams();
  setBusy(btn, true, 'Generate paths');
  try {
    const r = await run('brownian', params);
    state.brownian = { r, params };
    charts.paths($('brownianChart'), r.paths, params.steps);
    charts.histogram($('brownianDistribution'), histogram(Array.from(r.finals), 40), 'Terminal value', charts.colours.OK);
    const m = terminalMoments(params);
    const s = r.stats;
    setText('brownMean', `${fixed(s.mean)} (closed form ${fixed(m.mean)})`);
    setText('brownStd', `${fixed(s.std)} (closed form ${fixed(m.std)})`);
    setText('brownMin', fixed(s.min));
    setText('brownMax', fixed(s.max));
    setText('brownP5', fixed(s.p5));
    setText('brownP25', fixed(s.p25));
    setText('brownMedian', fixed(s.median));
    setText('brownP75', fixed(s.p75));
    setText('brownP95', fixed(s.p95));
    setText('brownianProgressText', `pseudo (seeded) · ${params.paths} paths × ${params.steps} steps`);
    setProgress('brownianProgress', 1);
  } catch (err) {
    setText('brownianProgressText', err.message);
  }
  setBusy(btn, false, 'Generate paths');
  shell?.refreshKpis();
}
function resetBrownian() {
  for (const [id, v] of Object.entries({ numPaths: 200, timeSteps: 250, drift: 0.1, brownVolatility: 0.15 })) $(id).value = v;
  setAll(['brownMean', 'brownStd', 'brownMin', 'brownMax', 'brownP5', 'brownP25', 'brownMedian', 'brownP75', 'brownP95'], '—');
  setProgress('brownianProgress', 0);
  setText('brownianProgressText', 'Ready');
  state.brownian = null;
  shell?.refreshKpis();
}

// --- VaR -----------------------------------------------------------------------
function varParams() {
  const w1 = num('alloc1') / 100;
  const w2 = num('alloc2') / 100;
  return {
    returns: [num('asset1Return'), num('asset2Return'), num('asset3Return')].map((x) => x / 100),
    vols: [num('asset1Vol'), num('asset2Vol'), num('asset3Vol')].map((x) => x / 100),
    correlations: [num('corr12'), num('corr13'), num('corr23')],
    weights: [w1, w2, Math.round((1 - w1 - w2) * 1e9) / 1e9],
    value: num('portfolioSize'),
    n: int('varSims')
  };
}
async function runVar() {
  const btn = $('runVaRBtn');
  const params = varParams();
  setBusy(btn, true, 'Run VaR analysis');
  setText('alloc3', `${Math.round(params.weights[2] * 100)}%`);
  try {
    const r = await run('var', params);
    const m = portfolioMoments(params);
    const pv95 = parametricVar(m, params.value, 0.95);
    state.var = { r, m, pv95, params };
    charts.histogram($('lossDistribution'), histogram(Array.from(r.pnl), 40), 'One-period P&L', charts.colours.DANGER);
    charts.lossCurve($('cumulativeLoss'), sorted(r.pnl));
    setText('var95', money(r.var95, 0));
    setText('var99', money(r.var99, 0));
    setText('cvar95', money(r.es95, 0));
    setText('paramVar95', money(pv95, 0));
    setText('expectedReturn', pct(m.expected));
    setText('portfolioVol', pct(m.vol));
    setText('sharpeRatio', fixed(m.expected / m.vol, 2));
    setText('meanReturn', money(r.meanPnl, 0));
    setText('bestCase', money(r.best, 0));
    setText('worstCase', money(r.worst, 0));
    setText('varProgressText', `${r.method} · ${params.n.toLocaleString()} scenarios`);
    setProgress('varProgress', 1);
  } catch (err) {
    setText('varProgressText', err.message);
    setProgress('varProgress', 0);
  }
  setBusy(btn, false, 'Run VaR analysis');
  shell?.refreshKpis();
}
function resetVar() {
  for (const [id, v] of Object.entries({ asset1Return: 8, asset1Vol: 15, asset2Return: 10, asset2Vol: 20, asset3Return: 12, asset3Vol: 25, corr12: 0.3, corr13: 0.2, corr23: 0.4, portfolioSize: 1000000, alloc1: 40, alloc2: 35, varSims: 20000 })) $(id).value = v;
  setText('alloc3', '25%');
  setAll(['var95', 'var99', 'cvar95', 'paramVar95', 'expectedReturn', 'portfolioVol', 'sharpeRatio', 'meanReturn', 'bestCase', 'worstCase'], '—');
  setProgress('varProgress', 0);
  setText('varProgressText', 'Ready');
  state.var = null;
  shell?.refreshKpis();
}

// --- Boot ---------------------------------------------------------------------
async function boot() {
  const Chart = await loadChartLib();
  charts = makeCharts(Chart);
  if (!Chart) $('chart-notice').hidden = false;
  const selectTab = initTabs((name) => {
    state.tab = name;
  });
  $('runOptionsBtn').addEventListener('click', runOptions);
  $('resetOptionsBtn').addEventListener('click', resetOptions);
  $('runPiBtn').addEventListener('click', runPi);
  $('resetPiBtn').addEventListener('click', resetPi);
  $('runBrownianBtn').addEventListener('click', runBrownian);
  $('resetBrownianBtn').addEventListener('click', resetBrownian);
  $('runVaRBtn').addEventListener('click', runVar);
  $('resetVaRBtn').addEventListener('click', resetVar);
  for (const id of ['alloc1', 'alloc2']) $(id).addEventListener('input', () => setText('alloc3', `${Math.round(100 - num('alloc1') - num('alloc2'))}%`));
  drawPi([]);

  shell = mountExecShell({
  theme: 'signal',
    title: 'Monte Carlo Simulation Engine',
    tagline: 'Four classic stochastic problems — option pricing, π, Brownian paths, portfolio VaR — with a seeded pseudo-random or Sobol quasi-random source, antithetic variance reduction, and the closed-form benchmark beside every estimate.',
    repo: 'https://github.com/Freddricklogan/monte-carlo-simulator',
    pagesUrl: 'https://freddricklogan.github.io/monte-carlo-simulator/',
    badges: [{ label: 'Web Worker', tone: 'accent' }, { label: 'Sobol QMC', dot: true }, { label: 'Benchmarked', dot: true }],
    kpis: [
      { label: 'Call vs Black–Scholes', compute: () => (state.options ? `${money(state.options.mc.call)} / ${money(state.options.bs.call)}` : '—'), tone: 'accent' },
      { label: 'Call error (SE units)', compute: () => (state.options ? (Math.abs(state.options.mc.call - state.options.bs.call) / state.options.mc.callSe).toFixed(2) : '—'), tone: 'ok' },
      { label: 'π estimate', compute: () => (state.pi ? state.pi.estimate.toFixed(4) : '—') },
      { label: 'VaR 95% (MC / parametric)', compute: () => (state.var ? `${money(state.var.r.var95, 0)} / ${money(state.var.pv95, 0)}` : '—'), tone: 'danger' },
      { label: 'Sampler', compute: () => `${samplerSpec().method}${$('antithetic').checked ? ' + antithetic' : ''}`, tone: 'muted' }
    ],
    tour: [
      { selector: '#options', title: 'Price an option against the benchmark', body: 'Twenty thousand terminal prices under geometric Brownian motion; the call and put estimates sit beside Black–Scholes with the error in standard-error units.', action: async () => { selectTab('options'); await runOptions(); } },
      { selector: '#sampler-row', title: 'Switch to Sobol and rerun', body: 'A quasi-random Sobol sequence fills the space evenly instead of randomly. Same paths, smaller error — watch the SE-units figure fall.', action: async () => { $('sampler').value = 'sobol'; await runOptions(); } },
      { selector: '#pi', title: 'Estimate π', body: 'Points in the square, points in the circle. The standard error shown is the pseudo-random one; Sobol beats it.', action: async () => { selectTab('pi'); await runPi(); } },
      { selector: '#brownian', title: 'Generate paths', body: 'Two hundred GBM paths and the terminal distribution, with the closed-form mean and standard deviation printed beside the simulated ones.', action: async () => { selectTab('brownian'); await runBrownian(); } },
      { selector: '#var', title: 'Portfolio VaR two ways', body: 'Correlated returns through a Cholesky factor; Monte Carlo VaR and expected shortfall beside the parametric normal VaR.', action: async () => { selectTab('var'); await runVar(); } }
    ]
  });
  shell.refreshKpis();
}

boot();
