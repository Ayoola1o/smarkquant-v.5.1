# Walkthrough - Professional Backtest & Live Trading 플랫폼

I have concluded the professional-grade upgrade to the backtest engine and live trading dashboard, transforming the platform into a Jesse-style quantitative analysis hub.

## 1. Professional Backtest Engine

The backtest suite has been completely overhauled to provide institution-grade metrics and visualizations.

### Institutional Metrics Calculation
- **Grouped Categories**: Results are now categorized into **Performance**, **Risk Management**, and **Trading Statistics**.
- **Advanced KPIs**: Implemented CAGR, Sharpe Ratio, Sortino Ratio, Calmar Ratio, and Max Drawdown tracking.
- **Equity History**: Precise cumulative equity tracking with per-trade P&L impact.

### Interactive Charting
- **Lightweight Charts**: Integrated TradingView-style interactive charting for backtest results.
- **Dual-Axis Visualization**: Plots Price vs. Equity curve simultaneously.
- **Trade Annotation**: Automatic markers for entries (Arrows) and exits (Circles) directly on the chart.

### Automated CSV Export
- **Results Persistence**: Every backtest now automatically generates a timestamped `_trades.csv` and `_equity.csv`.
- **Downloadable Reports**: Users can download these files directly from the UI for further analysis in Excel or Python.

## 2. Live Trading Dashboard Refactor

The live trading experience has been streamlined and professionalized with a new tabbed navigation system.

### 3-Tab Operational Logic
- **Trading Tab**: High-impact view of active bots, portfolio health, and recent execution signals.
- **API Tab**: Real-time connectivity status for Alpaca and other integrations, showing secret detection and feed status.
- **System Tab**: Low-level operational monitoring, featuring a live **Websocket Order Stream** and rapid risk controls.

### Rapid Risk Controls
- **Cancel All Orders**: Instantly flushes the Alpaca order book to stop new entries.
- **Close All Positions**: Emergency "Kill Switch" to flatten all active exposure and cancel associated orders.

## 4. Advanced Risk Analysis (Monte Carlo)

To ensure strategy robustness, I implemented a dedicated Analysis suite inspired by institutional standards.

### Monte Carlo Trade Shuffling
- **Variance Testing**: Randomly reorders trade sequences to visualize a "fan" of potential equity outcomes.
- **Drawdown Stress-Testing**: Identifies worst-case drawdown scenarios that might occur due to bad luck in trade sequencing.

### Statistical Rule Significance
- **Bootstrapping**: Performs 1,000 bootstrap iterations to calculate the probability of loss and 95% confidence intervals for ROI.
- **Robustness Score**: Quantifies the strategy's likelihood of remaining profitable in varying market conditions.

### Candle-Based Perturbation
- **Data Stress-Test**: Allows running backtests with injected price noise (0.2% OHLC variance) to verify strategy sensitivity to small price fluctuations.

> [!TIP]
> Use the **Analysis** tab in the Backtest Lab to access these professional risk metrics after any backtest run.
