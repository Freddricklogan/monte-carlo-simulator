# AUDIT — Monte Carlo Simulation Engine (pre-refactor)

Audit of the previous single-file `index.html` (1,494 lines: CSS, markup and
~615 lines of inline JavaScript beginning at line 879). The engine was real
— four simulations, a Web Worker, Chart.js — and its arithmetic was mostly
right. The findings are about **what the numbers could not claim**, code a
strict policy could never run, and two statistical mistakes.

---

## A. Correctness and statistics

### A1 — No benchmark, so no way to know the estimate was right
The options tab printed a Monte Carlo call and put and nothing to compare
them with (lines 1153–1154). Black–Scholes is closed-form for the same
inputs. **Fix:** `blackScholes()` in `src/options.js` (Hart's Φ, tested to
1e-6 against tabulated quantiles) is printed beside every estimate with the
absolute error in standard-error units; the convergence chart draws the
benchmark as a dashed line.

### A2 — The "95% CI" was the CI of the terminal price, applied to the option
Line 1150: `ci95 = 1.96 * std / sqrt(n)` used the standard deviation of the
*stock prices*, then line 1155 added it to the *call price*. Those are
different random variables with different variances. **Fix:**
`simulateEuropean()` returns `callSe` and `putSe` from the discounted
payoffs themselves.

### A3 — 252 daily steps for a European payoff
Lines 908–913 stepped every path through 252 daily increments. A European
option depends only on S_T, which GBM gives exactly in one draw; the loop
cost 252× the work for no accuracy. **Fix:** `terminalPrice()` samples S_T
directly. (Paths are still stepped in the Brownian tab, where the path is
the point.)

### A4 — Percentiles by truncation, not interpolation
Line 1160 and its neighbours took `sorted[floor(n·0.95)]`, a biased
estimator that ignores position within the sample. **Fix:** R type-7
interpolation in `percentileSorted()`, tested against hand values.

### A5 — Cholesky silently "fixed" non-positive-definite correlations
Line 1003: `Math.sqrt(Math.max(0, …))` clamped a negative pivot to zero, so
an impossible correlation triple (e.g. 0.9, 0.9, −0.9) produced a quiet,
wrong answer. **Fix:** `cholesky()` throws `RangeError('matrix is not
positive definite')` and the page shows the message.

### A6 — VaR reported as a signed return, tail averaged with the wrong count
Line 1419 reported `var95` as the negative P&L quantile (a negative number
labelled "Value at Risk"); the expected shortfall averaged
`slice(0, floor(n·0.05))`, which is empty when n < 20. **Fix:** VaR and
expected shortfall are positive losses; the tail slice is at least one
element; a parametric VaR from the same moments is printed beside them and
a test requires the two to agree within 3%.

### A7 — The progress bar was fiction
Lines 1177–1181 advanced the bar by `Math.random() * 20` every 100 ms and
capped it at 90% until the worker replied. It measured nothing. **Fix:**
removed; the bar reflects start and completion only, and the text names the
sampler and path count that actually ran.

### A8 — Dead controls
`piSpeed` (line 591) and `actualPi` (line 623) had no handlers or purpose.
**Fix:** removed.

## B. Security and policy

### B1 — Worker built from a Blob URL
Lines 879–1015 assembled the worker source as a template string and loaded
it from `URL.createObjectURL(blob)`. Any `script-src 'self'` policy blocks
blob: workers. **Fix:** `src/worker.js` is a real module worker loaded with
`new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })`;
the page ships `default-src 'none'; script-src 'self' https://cdn.jsdelivr.net; worker-src 'self'`.

### B2 — CDN script with no version and no integrity
Line 7 loaded `chart.js` at whatever version jsDelivr served, with no SRI.
**Fix:** pinned to 3.9.1 with an `integrity` hash computed against the
artifact; a vendored copy is the fallback and the page degrades to numbers
if both fail.

### B3 — No Content-Security-Policy, inline script and seven inline styles
No `<meta http-equiv="Content-Security-Policy">`; all logic inline; `style=`
on line 637 and six others. **Fix:** strict CSP, all code in ES modules,
html-validate's `no-inline-style` in CI.

## C. Structure and accessibility

### C1 — Logic fused to the DOM
Every simulation read its inputs with `document.getElementById` inside the
handler (e.g. lines 1120–1126) and the statistics were computed in the
message callback. Nothing could be tested. **Fix:** `src/{rng,stats,options,pi,brownian,var}.js`
are pure and covered by 30 tests including statistical-tolerance tests;
`src/main.js` only reads forms and writes results.

### C2 — Labels not associated with inputs
Line 480 and every other control used `<label>` with no `for`. **Fix:** every
input has a labelled `for`/`id` pair; tabs carry `role="tab"` and
`aria-selected`; result cells are `aria-live="polite"`.

### C3 — No quasi-random option
Not a defect, a gap the blueprint asked to close: `sobol()` implements the
first six Sobol dimensions with Joe–Kuo direction numbers and Gray-code
generation, tested against the published first points, and is selectable on
every tab except paths (see the note on why in the page and in
`tests/brownian.test.js`).
