<h1 align="center">Monte Carlo Simulation Engine</h1>

<p align="center">
  <em>An interactive, browser-based quant lab — price options, estimate risk, and watch stochastic processes unfold in real time.</em>
</p>

<p align="center">
  <a href="https://freddricklogan.github.io/monte-carlo-simulator/"><img src="https://img.shields.io/badge/Live_Demo-Open_App-6c5ce7?style=for-the-badge&logo=github" alt="Live Demo"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/JavaScript-Vanilla_ES6-f7df1e?logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Charts-Chart.js-ff6384?logo=chartdotjs&logoColor=white" alt="Chart.js">
  <img src="https://img.shields.io/badge/Compute-Web_Workers-00b894" alt="Web Workers">
  <img src="https://img.shields.io/badge/License-MIT-lightgrey" alt="License">
</p>

---

## Overview

**Monte Carlo Simulation Engine** brings four classic stochastic-simulation problems into a single
interactive tool that runs entirely in the browser. Monte Carlo methods use repeated random
sampling to approximate quantities that are hard — or impossible — to solve in closed form, and this
app makes that intuition tangible: adjust the parameters, run tens of thousands of trials, and watch
the estimates converge in real time.

Heavy simulation runs are offloaded to **Web Workers** so the interface stays responsive even under
large trial counts, and results are visualized live with Chart.js.

> **▶ [Launch the live demo](https://freddricklogan.github.io/monte-carlo-simulator/)**

---

## What it simulates

| Module | What it does | Method |
|:--|:--|:--|
| **Options Pricing** | Prices European call/put options via simulated price paths and compares against the analytical benchmark | Geometric Brownian Motion + risk-neutral valuation |
| **Portfolio VaR** | Estimates Value at Risk and expected shortfall from a distribution of simulated returns | Monte Carlo return sampling |
| **Brownian Motion** | Animates random-walk price paths to build intuition for diffusion processes | Wiener process |
| **π Estimation** | Approximates π by sampling points in a unit square and measuring the fraction inside the circle | Geometric probability |

---

## Why this project

| Skill demonstrated | Where it shows up |
|:--|:--|
| **Quantitative / financial modeling** | Black–Scholes benchmark, risk-neutral option pricing, Value at Risk |
| **Numerical methods** | Monte Carlo estimation, convergence behavior, variance as a function of trial count |
| **Performance engineering** | Web Workers keep heavy simulation off the main thread for a responsive UI |
| **Data visualization** | Live-updating Chart.js plots of paths, distributions, and convergence |
| **Zero-dependency delivery** | Runs as a static page — no backend, no build step |

---

## Tech stack

- **Language:** Vanilla JavaScript (ES6+)
- **Compute:** Web Workers for non-blocking simulation
- **Charting:** Chart.js
- **Runtime:** 100% client-side — no backend, no install

---

## Run locally

```bash
git clone https://github.com/Freddricklogan/monte-carlo-simulator.git
cd monte-carlo-simulator

# open directly, or serve it (recommended so Web Workers load correctly)
python3 -m http.server 8000
# then visit http://localhost:8000
```

> Tip: serving over `http://` rather than opening the file directly ensures the Web Workers load
> without browser security restrictions.

---

## Author

**Freddrick Logan** — Educational Technologist & Technology Leader
[GitHub](https://github.com/Freddricklogan) · [LinkedIn](https://www.linkedin.com/in/freddricklogan/)

## License

Released under the [MIT License](LICENSE).
