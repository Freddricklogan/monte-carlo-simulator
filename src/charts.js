/** Chart.js wiring. Every function here touches the DOM; none of them compute. */
const GRID = 'rgba(34,48,77,.6)';
const TICK = '#8b98b0';
const ACCENT = '#58A6FF';
const OK = '#3fb950';
const WARN = '#d29922';
const DANGER = '#f85149';

/** Chart.js arrives from a CDN under SRI; if blocked, fall back to the vendored copy; else degrade to numbers only. */
export async function loadChartLib() {
  if (globalThis.Chart) return globalThis.Chart;
  try {
    await import('../vendor/chart.min.js');
  } catch {
    return null;
  }
  return globalThis.Chart ?? null;
}

const base = (xTitle, yTitle) => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: TICK, maxTicksLimit: 8 }, grid: { color: GRID }, title: { display: true, text: xTitle, color: TICK } },
    y: { ticks: { color: TICK }, grid: { color: GRID }, title: { display: true, text: yTitle, color: TICK } }
  }
});

export function makeCharts(Chart) {
  const live = new Map();
  const mount = (canvas, config) => {
    if (!Chart || !canvas) return;
    live.get(canvas)?.destroy();
    live.set(canvas, new Chart(canvas.getContext('2d'), config));
  };
  return {
    histogram(canvas, { edges, counts }, xTitle, colour = ACCENT) {
      mount(canvas, {
        type: 'bar',
        data: { labels: edges.slice(0, -1).map((e) => e.toFixed(2)), datasets: [{ data: counts, backgroundColor: `${colour}99`, borderColor: colour, borderWidth: 1 }] },
        options: base(xTitle, 'Count')
      });
    },
    line(canvas, xs, ys, xTitle, yTitle, colour = ACCENT, reference = null) {
      const datasets = [{ data: ys, borderColor: colour, backgroundColor: `${colour}22`, borderWidth: 2, pointRadius: 0, fill: true }];
      if (reference !== null) datasets.push({ data: xs.map(() => reference), borderColor: OK, borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0 });
      mount(canvas, { type: 'line', data: { labels: xs, datasets }, options: base(xTitle, yTitle) });
    },
    paths(canvas, paths, steps) {
      const labels = Array.from({ length: steps + 1 }, (_, i) => i);
      const shown = paths.slice(0, 60);
      mount(canvas, {
        type: 'line',
        data: { labels, datasets: shown.map((p, i) => ({ data: Array.from(p), borderColor: `hsla(${(i * 360) / shown.length}, 80%, 65%, .55)`, borderWidth: 1, pointRadius: 0 })) },
        options: base('Step', 'Value (S₀ = 1)')
      });
    },
    lossCurve(canvas, sortedPnl) {
      const n = sortedPnl.length;
      const stride = Math.max(1, Math.floor(n / 400));
      const xs = [];
      const ys = [];
      for (let i = 0; i < n; i += stride) {
        xs.push(((i / n) * 100).toFixed(1));
        ys.push(sortedPnl[i]);
      }
      mount(canvas, {
        type: 'line',
        data: { labels: xs, datasets: [{ data: ys, borderColor: DANGER, backgroundColor: `${DANGER}22`, borderWidth: 2, pointRadius: 0, fill: true }] },
        options: base('Percentile of outcomes (%)', 'P&L')
      });
    },
    colours: { ACCENT, OK, WARN, DANGER }
  };
}
