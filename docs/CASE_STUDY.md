# Case Study — Monte Carlo Simulation Engine

**Repository:** [monte-carlo-simulator](https://github.com/Freddricklogan/monte-carlo-simulator) · **Live demo:** [freddricklogan.github.io/monte-carlo-simulator](https://freddricklogan.github.io/monte-carlo-simulator/) · **Author:** Freddrick Logan

---

## 1. Who has this problem

Anyone who teaches or reviews simulation-based numbers: the instructor whose students submit a Monte Carlo option price with no idea whether it is right, the treasury or endowment analyst handed a VaR figure from a spreadsheet macro, the model reviewer who asks "against what did you check this?" and gets silence. I teach on the technology side of that room and consult on analytics; people can simulate, and cannot tell a good estimate from a plausible one.

## 2. The problem, as a scenario

A student presents an option pricer: ten thousand paths, a histogram, a call price of $7.87, a "95% confidence interval". Against what benchmark? None — Black–Scholes exists for this contract and was not run. How was the interval computed? From the standard deviation of the stock prices, not the payoffs. What if the correlation is impossible? The Cholesky routine clamps the negative pivot and prints a number anyway. The progress bar advanced at random. The previous version of this tool was that submission; I wrote it, and its audit is in the repository.

## 3. What it costs to leave it alone

A risk figure trusted because it has decimals; a variance-reduction technique never used because nobody could see the gain; a student who carries a wrong confidence-interval habit into a job. I will not attach a figure — the capital behind a VaR number varies by orders of magnitude and this tool prices nothing real. What is certain is that every defect in the audit has a known, cheap test.

## 4. The approach, and the alternative I rejected

I rebuilt the tool around one rule: every estimate is printed beside something it can be checked against. The European option sits beside Black–Scholes with the error in standard-error units; π beside its analytic standard error; the terminal distribution of geometric Brownian paths beside the closed-form mean and standard deviation; Monte Carlo VaR and expected shortfall beside the parametric VaR from the same moments. The random source is chosen per run — seeded pseudo-random or Sobol quasi-random — and antithetic variates can be switched on, so the reader watches the error fall. The simulations run in a module Web Worker under a strict content-security policy, and thirty tests include statistical-tolerance tests that fail if an estimator drifts more than three standard errors from its closed form.

The alternative I rejected was a richer pricer — American options, stochastic volatility, more assets. Each feature would have been another unchecked number. The value, for a student or a reviewer, is in the benchmark column.

## 5. What the code does today

Real: Mulberry32 and Box–Muller; a six-dimension Sobol generator with Joe–Kuo direction numbers; Acklam's inverse normal with a Halley step and Hart's double-precision Φ; exact GBM terminal sampling with antithetic pairing; Black–Scholes with deltas; π estimation; stepped GBM paths with closed-form moments; Cholesky-correlated three-asset VaR with expected shortfall and a parametric benchmark; interpolated percentiles and histograms; a module worker with promise-matched requests; Chart.js pinned with SRI and a vendored fallback; the Executive Shell with KPIs from the last runs.

Simulated: everything — assets, returns and volatilities are inputs, not data, and the page says nothing here is a forecast.

Worth knowing: Sobol is limited to six dimensions and is not used for stepped paths, where a one-dimensional sequence would correlate the steps; the worker forces the pseudo-random source there and a test documents the collapse it prevents. VaR returns are jointly normal by construction, which is why the two VaR figures agree; a fat-tailed model would separate them.

## 6. Evidence

Measured locally with the commands CI runs: 30 tests passing across six files; 99.14% statement and 94.01% branch coverage of the pure modules; ESLint and html-validate clean. Tests pin Sobol to its published first eight points, the inverse normal to tabulated quantiles at 1e-6, Black–Scholes to 8.0214 and 7.9004 with put–call parity to 1e-9, the seeded estimate within three standard errors of the benchmark, antithetic variates reducing spread across twelve seeds, Sobol beating the median pseudo-random error, Cholesky reconstruction to 1e-12 with rejection of a non-positive-definite matrix, and Monte Carlo VaR within 3% of parametric. Headless Chrome on the built page: zero console errors; pseudo-random call $7.87 against $8.02 (1.60 SE), Sobol rerun $8.02 (0.04 SE), antithetic 0.06 SE; π 3.13920 with error 0.00239 against a standard error of 0.01161; GBM terminal standard deviation 0.1665 against 0.1667 closed form; VaR 95% $134,475 against parametric $135,188; five tour steps performing real runs; no horizontal scroll at 1280 or 400 pixels.

## 7. What it would take to run this in production

As a teaching instrument and a review checklist it is production now. As a pricing or risk system it would need market data, a calibrated volatility model, a Brownian-bridge construction for quasi-random paths, more assets with an estimated covariance, and a results log so every figure is reproducible with its inputs. Weeks of work with a model-validation function beside it; the benchmark discipline carries over.

## 8. Limits and next steps

European options only, one-period VaR, jointly normal returns, six Sobol dimensions, no control variates. Next: a control-variate demonstration with the discounted stock as control, a Brownian bridge so Sobol can drive paths, a Student-t option so the two VaR figures diverge on purpose, and pathwise Greeks beside the analytic deltas.

## 9. Who should look at this

**Hiring manager:** evidence that I implement numerical methods from primary sources, test them against closed forms and published values, and audit my own earlier work in writing.
**Consulting client:** a checklist, in running code, for reviewing any simulation-based figure — benchmark, standard error, sampler, reproducibility.
**Engineer:** read `src/rng.js` for the Sobol generator and inverse normal, `tests/options.test.js` for statistical-tolerance testing, and `AUDIT.md` for the eleven findings the rebuild fixed.
