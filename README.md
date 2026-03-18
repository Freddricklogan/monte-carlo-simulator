# Monte Carlo Simulation Engine

A professional, production-quality interactive web application for running advanced Monte Carlo simulations with real-time visualization and statistical analysis.

## Features

### Multiple Simulation Types

- **Financial Options Pricing (Black-Scholes)**
  - Real-time pricing of European call and put options
  - User-configurable stock price, strike price, volatility, risk-free rate, and time to expiry
  - Histogram of final price distribution and convergence plotting
  - Confidence intervals and detailed statistics

- **Pi Estimation**
  - Visual Monte Carlo method for estimating π
  - Animated random point generation in square with inscribed circle
  - Real-time convergence tracking
  - Error calculation and accuracy metrics

- **Brownian Motion / Random Walk**
  - Multiple particle path simulation
  - Configurable drift and volatility parameters
  - Visualization of individual paths and aggregate distribution
  - Statistical analysis of final positions

- **Portfolio Value-at-Risk (VaR)**
  - Multi-asset portfolio risk analysis
  - Customizable correlations between assets
  - VaR at 95% and 99% confidence levels
  - Conditional VaR (Expected Shortfall) calculation
  - Sharpe ratio and portfolio volatility metrics

### Advanced Visualizations

- **Real-time Animated Charts** using Chart.js
  - Histograms of simulation results
  - Convergence plots showing estimate stabilization
  - Multi-path line charts for Brownian motion
  - Distribution and cumulative loss curves

- **Summary Statistics Panel**
  - Mean, standard deviation, min/max values
  - Percentile analysis (5th, 25th, median, 75th, 95th)
  - Confidence intervals for option pricing
  - Risk metrics (VaR, CVaR, Sharpe ratio)

### Professional Design

- **Dark Modern Theme**
  - Deep navy (#0a192f) background with gradient
  - Cyan (#64ffda) and success green accents
  - Responsive CSS Grid layout
  - Smooth animations and transitions
  - System font stack for optimal readability

- **Fully Responsive**
  - Desktop, tablet, and mobile support
  - Adaptive grid layouts
  - Touch-friendly controls

### Technical Excellence

- **Client-Side Only**
  - No backend server required
  - All computations run in the browser
  - Web Worker integration for responsive UI
  - Pure JavaScript implementation

- **Performance Optimized**
  - Web Workers handle heavy computations
  - Inline worker via Blob URL
  - Efficient rendering with Chart.js
  - Progressive result updates

- **Single File Deployment**
  - All code contained in index.html
  - Chart.js loaded from CDN
  - Zero dependencies or build process
  - Deploy anywhere that serves static files

## How to Use

### Quick Start

1. Simply open `index.html` in any modern web browser
2. Select a simulation type from the tabs
3. Adjust parameters as desired
4. Click "Run Simulation" or "Start Simulation"
5. View results in real-time charts and statistics panels

### Financial Options Pricing

1. Set the stock price, strike price, and option parameters
2. Adjust volatility and risk-free rate
3. Specify time to expiry and number of simulations
4. Click "Run Simulation"
5. View the estimated call/put prices with confidence intervals

### Pi Estimation

1. Set the number of random points to generate
2. Choose animation speed (Fast/Normal/Slow)
3. Click "Start Simulation"
4. Watch the algorithm converge to π

### Brownian Motion

1. Configure number of paths and time steps
2. Set drift and volatility parameters
3. Click "Generate Paths"
4. Analyze the distribution of final values

### Portfolio VaR

1. Enter expected returns and volatilities for each asset
2. Specify correlation coefficients
3. Set portfolio size and asset allocations
4. Click "Run VaR Analysis"
5. Review risk metrics and loss distributions

## Technologies Used

- **HTML5** - Semantic markup and canvas for visualizations
- **CSS3** - Modern layout with Grid, Flexbox, and gradients
- **JavaScript** - Core simulation engine and controls
- **Web Workers** - Background computation threads
- **Chart.js** - Real-time data visualization library
- **CDN Delivery** - Chart.js from jsDelivr CDN

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge
- Any modern browser with ES6 and Web Worker support

## Performance

- Options pricing: 10,000 simulations complete in <1 second
- Pi estimation: Animated visualization of millions of points
- Brownian motion: 500 paths with 250+ time steps
- Portfolio VaR: 10,000 correlated asset simulations
- Fully responsive UI during all computations

## License

MIT License - Feel free to use this tool commercially or personally

## Author

Created as a professional portfolio project demonstrating advanced numerical computing, visualization, and modern web development practices.

## Use Cases

- **Financial Education** - Learn Monte Carlo methods and option pricing
- **Risk Analysis** - Evaluate portfolio risk with VaR calculations
- **Statistical Methods** - Understand convergence and probability
- **Decision Support** - Quantify uncertainty in complex scenarios
- **Research & Development** - Foundation for further simulation work

---

For questions, improvements, or contributions, feel free to reach out or open an issue.
