import sqlite3
import json
import os
import sys
import uuid
from datetime import datetime
import pandas as pd
import numpy as np

from strategy_engine import get_signals, ind_atr

from db_config import DB_PATH
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "storage", "json")


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

def load_candles(start_date: str, finish_date: str, symbol: str = "", exchange: str = "", perturb_data: bool = False) -> pd.DataFrame:
    # 1. Try loading from SQLite first
    df = _query_db(start_date, finish_date, symbol, exchange)
    
    if perturb_data and not df.empty:
        print("[INFO] Applying candle perturbation (Monte Carlo Candle Based)...")
        from monte_carlo import MonteCarloEngine
        # Convert df to records, perturb, and convert back
        records = df.reset_index().to_dict('records')
        perturbed_records = MonteCarloEngine.candle_perturbation(records, noise_factor=0.002) # 0.2% noise
        df = pd.DataFrame(perturbed_records).set_index("date")
    
    # 2. If empty and we have an exchange (not "db" or local), try on-the-fly import
    if df.empty and symbol and exchange and exchange.lower() not in ["db", "local", "sqlite"]:
        print(f"[INFO] Data missing for {symbol} on {exchange}. Attempting on-the-fly import...")
        try:
            if exchange.lower() == "alpaca":
                from alpaca_importer import import_alpaca_stock, import_alpaca_crypto
                # Determine type
                crypto_bases = {"BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "AVAX", "DOT", "LINK", "LTC", "DOGE"}
                base = symbol.split("-")[0].upper()
                if base in crypto_bases:
                    import_alpaca_crypto(symbol, start_date, exchange="alpaca")
                else:
                    import_alpaca_stock(symbol, start_date, exchange="alpaca")
            elif exchange.lower() == "yfinance":
                from yfinance_importer import import_yfinance
                import_yfinance(symbol, start_date, exchange="yfinance")
            
            # Try reloading from DB after import
            df = _query_db(start_date, finish_date, symbol, exchange)
        except Exception as e:
            print(f"[ERROR] On-the-fly import failed: {e}")

    if df.empty:
        # Fallback to local check if source failed
        avail = _list_available_symbols()
        print(f"[WARNING] No candles found for {symbol or 'any symbol'} between {start_date} and {finish_date}.")
        if avail:
            print(f"[INFO] Available symbols in DB: {', '.join(avail)}")
        return df

    df["date"] = pd.to_datetime(df["timestamp"], unit="ms")
    df = df.set_index("date")
    print(f"[OK] Loaded {len(df)} candles for {symbol or 'all'} from {start_date} to {finish_date}")
    return df


def _query_db(start_date: str, finish_date: str, symbol: str = "", exchange: str = "") -> pd.DataFrame:
    if not os.path.exists(DB_PATH):
        return pd.DataFrame()

    conn = sqlite3.connect(DB_PATH)
    start_ts = int(datetime.strptime(start_date, "%Y-%m-%d").timestamp() * 1000)
    finish_ts = int(datetime.strptime(finish_date, "%Y-%m-%d").timestamp() * 1000)

    conditions = ["timestamp >= ?", "timestamp <= ?"]
    params: list = [start_ts, finish_ts]
    if symbol:
        conditions.append("symbol = ?")
        params.append(symbol)
    if exchange and exchange.lower() not in ["db", "local", "any"]:
        conditions.append("exchange = ?")
        params.append(exchange)

    query = f"SELECT * FROM candle WHERE {' AND '.join(conditions)} ORDER BY timestamp ASC"
    df = pd.read_sql_query(query, conn, params=params)
    conn.close()
    
    if not df.empty:
        # Convert timestamp (ms) to datetime index
        df["date"] = pd.to_datetime(df["timestamp"], unit="ms")
        df.set_index("date", inplace=True)
        # Add a helper 'time' column for metrics if needed, or just use 'timestamp'
        df['time'] = df['timestamp'] / 1000.0
        
    return df


def _list_available_symbols() -> list:
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT symbol FROM candle")
        syms = [r[0] for r in cur.fetchall()]
        conn.close()
        return syms
    except Exception:
        return []


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------

def compute_metrics(trades: list, equity_curve: list, initial_capital: float, fee_total: float, start_date: str = "", finish_date: str = "", price_data: pd.DataFrame = None) -> dict:
    eq = np.array(equity_curve, dtype=float)
    final_equity = eq[-1] if len(eq) else initial_capital
    net_profit_val = final_equity - initial_capital
    net_profit_pct = net_profit_val / initial_capital * 100

    wins = [t for t in trades if t["pnl"] > 0]
    losses = [t for t in trades if t["pnl"] <= 0]
    total = len(trades)
    win_rate = len(wins) / total if total else 0.0

    avg_win = np.mean([t["pnl"] for t in wins]) if wins else 0.0
    avg_loss = np.mean([abs(t["pnl"]) for t in losses]) if losses else 0.0
    avg_win_loss = avg_win / avg_loss if avg_loss else 0.0
    gross_profit = sum(t["pnl"] for t in wins)
    gross_loss = sum(t["pnl"] for t in losses)
    profit_factor = gross_profit / abs(gross_loss) if gross_loss != 0 else (gross_profit if gross_profit > 0 else 0)

    expectancy = win_rate * avg_win - (1 - win_rate) * avg_loss if (wins or losses) else 0.0
    expectancy_pct = expectancy / initial_capital * 100

    avg_holding = np.mean([t.get("holding", 0) for t in trades]) if trades else 0.0

    rolling_max = np.maximum.accumulate(eq) if len(eq) else np.array([initial_capital])
    with np.errstate(divide="ignore", invalid="ignore"):
        drawdowns = np.where(rolling_max > 0, (eq - rolling_max) / rolling_max * 100, 0.0)
    max_drawdown = float(abs(drawdowns.min())) if len(drawdowns) else 0.0
    largest_win = max((t["pnl"] for t in wins), default=0.0)
    largest_loss = min((t["pnl"] for t in losses), default=0.0)

    returns = np.diff(eq) / eq[:-1] if len(eq) > 1 else np.array([0.0])
    mean_ret = np.mean(returns)
    std_ret = np.std(returns, ddof=1) if len(returns) > 1 else 1e-9
    sharpe = (mean_ret / std_ret) * np.sqrt(252) if std_ret > 0 else 0.0

    downside = returns[returns < 0]
    downside_std = np.std(downside, ddof=1) if len(downside) > 1 else 1e-9
    sortino = (mean_ret / downside_std) * np.sqrt(252) if downside_std > 0 else 0.0

    calmar = (net_profit_pct / max_drawdown) if max_drawdown > 0 else 0.0

    pos_ret = returns[returns > 0]
    neg_ret = returns[returns <= 0]
    omega = (pos_ret.sum() / abs(neg_ret.sum())) if len(neg_ret) and neg_ret.sum() != 0 else 0.0

    cur_streak = max_win_streak = max_loss_streak = 0
    for t in trades:
        if t["pnl"] > 0:
            cur_streak = cur_streak + 1 if cur_streak > 0 else 1
            max_win_streak = max(max_win_streak, cur_streak)
        else:
            cur_streak = cur_streak - 1 if cur_streak < 0 else -1
            max_loss_streak = max(max_loss_streak, abs(cur_streak))

    # Calculate Annual Statistics
    annual_return = 0.0
    if start_date and finish_date:
        try:
            d1 = datetime.strptime(start_date, "%Y-%m-%d")
            d2 = datetime.strptime(finish_date, "%Y-%m-%d")
            years = (d2 - d1).days / 365.25
            if years > 0:
                annual_return = ((final_equity / initial_capital) ** (1/years) - 1) * 100
        except: pass

    # Calculate Monthly Returns
    monthly_returns = {}
    if trades:
        for t in trades:
            dt = datetime.fromtimestamp(t.get("exit_time", 0))
            key = dt.strftime("%Y-%m")
            monthly_returns[key] = monthly_returns.get(key, 0.0) + t.get("pnl_pct", 0.0)
    
    # Calculate Worst 5 Drawdown Periods
    dd_df = pd.DataFrame({"equity": eq})
    dd_df["peak"] = dd_df["equity"].cummax()
    dd_df["dd"] = (dd_df["equity"] - dd_df["peak"]) / dd_df["peak"]
    
    worst_drawdowns = []
    is_in_dd = False
    dd_start = 0
    for i, row in dd_df.iterrows():
        if row["dd"] < 0:
            if not is_in_dd:
                is_in_dd = True
                dd_start = i
        else:
            if is_in_dd:
                is_in_dd = False
                period_dd = dd_df.iloc[dd_start:i+1]
                max_dd_val = float(abs(period_dd["dd"].min()))
                worst_drawdowns.append({
                    "start": dd_start,
                    "end": i,
                    "start_time": int(price_data['time'].iloc[dd_start]) if price_data is not None and dd_start < len(price_data) else 0,
                    "end_time": int(price_data['time'].iloc[i]) if price_data is not None and i < len(price_data) else 0,
                    "max_dd": round(max_dd_val * 100, 2),
                    "duration": i - dd_start
                })
    
    worst_drawdowns = sorted(worst_drawdowns, key=lambda x: x["max_dd"], reverse=True)[:5]

    # Trade PnL Distribution (Bins)
    pnl_dist = []
    if trades:
        pnls = [t["pnl_pct"] for t in trades]
        hist, bin_edges = np.histogram(pnls, bins=10)
        for i in range(len(hist)):
            pnl_dist.append({
                "bin": f"{bin_edges[i]:.1f}% to {bin_edges[i+1]:.1f}%",
                "count": int(hist[i])
            })

    return {
        "performance": {
            "net_profit": round(net_profit_pct, 4),
            "net_profit_val": round(net_profit_val, 2),
            "annual_return": round(annual_return, 4),
            "sharpe_ratio": round(sharpe, 4),
            "sortino_ratio": round(sortino, 4),
            "calmar_ratio": round(calmar, 4),
            "omega_ratio": round(omega, 4),
            "expectancy": round(expectancy, 2),
            "expectancy_pct": round(expectancy_pct, 4),
            "final_equity": round(final_equity, 2),
        },
        "risk": {
            "max_drawdown": round(max_drawdown, 4),
            "largest_win": round(largest_win, 2),
            "largest_loss": round(largest_loss, 2),
            "total_winning_streak": max_win_streak,
            "total_losing_streak": max_loss_streak,
            "current_streak": cur_streak,
            "fee": round(fee_total, 2),
            "worst_drawdowns": worst_drawdowns,
        },
        "trading_stats": {
            "total_trades": total,
            "win_rate": round(win_rate, 4),
            "winning_trades": len(wins),
            "losing_trades": len(losses),
            "avg_win": round(avg_win, 2),
            "avg_loss": round(avg_loss, 2),
            "avg_win_loss": round(avg_win_loss, 4),
            "gross_profit": round(gross_profit, 2),
            "gross_loss": round(gross_loss, 2),
            "profit_factor": round(profit_factor, 4),
            "avg_holding_period": round(avg_holding, 2),
            "pnl_distribution": pnl_dist,
        },
        "monthly_returns": monthly_returns,
        # Keep legacy flat structure for all components
        "net_profit": round(net_profit_pct, 4),
        "net_profit_val": round(net_profit_val, 2),
        "annual_return": round(annual_return, 4),
        "sharpe_ratio": round(sharpe, 4),
        "sortino_ratio": round(sortino, 4),
        "calmar_ratio": round(calmar, 4),
        "omega_ratio": round(omega, 4),
        "expectancy": round(expectancy, 2),
        "expectancy_pct": round(expectancy_pct, 4),
        "final_equity": round(final_equity, 2),
        "max_drawdown": round(max_drawdown, 4),
        "largest_win": round(largest_win, 2),
        "largest_loss": round(largest_loss, 2),
        "total_winning_streak": max_win_streak,
        "total_losing_streak": max_loss_streak,
        "current_streak": cur_streak,
        "fee": round(fee_total, 2),
        "total_trades": total,
        "win_rate": round(win_rate, 4),
        "winning_trades": len(wins),
        "losing_trades": len(losses),
        "avg_win": round(avg_win, 2),
        "avg_loss": round(avg_loss, 2),
        "avg_win_loss": round(avg_win_loss, 4),
        "gross_profit": round(gross_profit, 2),
        "gross_loss": round(gross_loss, 2),
        "profit_factor": round(profit_factor, 4),
        "avg_holding_period": round(avg_holding, 2),
        "initial_capital": initial_capital,
        "pnl_distribution": pnl_dist
    }


# ---------------------------------------------------------------------------
# Position simulator
# ---------------------------------------------------------------------------

def simulate(df: pd.DataFrame, long_signal: pd.Series, short_signal: pd.Series,
             atr: pd.Series, initial_capital: float = 10_000.0,
             risk_pct: float = 3.0, atr_stop: float = 2.5, atr_tp: float = 3.2,
             fee_rate: float = 0.001, allow_short: bool = True) -> dict:

    capital = float(initial_capital)
    equity_curve = []
    trades = []
    fee_total = 0.0
    position = 0.0
    entry_price = 0.0
    is_long = False
    stop_price = 0.0
    tp_price = 0.0
    entry_idx = 0

    for i in range(len(df)):
        price = float(df["close"].iloc[i])
        cur_atr = float(atr.iloc[i]) if not np.isnan(atr.iloc[i]) else 0.0

        if position != 0:
            hit_stop = (is_long and price <= stop_price) or (not is_long and price >= stop_price)
            hit_tp = (is_long and price >= tp_price) or (not is_long and price <= tp_price)

            if hit_stop or hit_tp:
                exit_price = stop_price if hit_stop else tp_price
                fee = abs(position) * exit_price * fee_rate
                fee_total += fee
                pnl = ((exit_price - entry_price) * position if is_long
                       else (entry_price - exit_price) * abs(position)) - fee
                trades.append({
                    "entry": round(entry_price, 4),
                    "exit": round(exit_price, 4),
                    "pnl": round(pnl, 2),
                    "pnl_pct": round(pnl / max(capital, 1) * 100, 4),
                    "win": pnl > 0,
                    "side": "long" if is_long else "short",
                    "holding": i - entry_idx,
                    "entry_time": int(df.index[entry_idx].timestamp()),
                    "exit_time": int(df.index[i].timestamp()),
                    "exit_reason": "TP" if hit_tp else "SL"
                })
                capital += pnl
                position = 0.0

        if position == 0 and cur_atr > 0 and capital > 0:
            if long_signal.iloc[i]:
                stop = price - atr_stop * cur_atr
                qty = (capital * risk_pct / 100) / abs(price - stop) if abs(price - stop) > 0 else 0
                if qty > 0:
                    fee = qty * price * fee_rate
                    fee_total += fee
                    capital -= fee
                    position = qty
                    entry_price = price
                    is_long = True
                    stop_price = stop
                    tp_price = price + atr_tp * cur_atr
                    entry_idx = i

            elif allow_short and short_signal.iloc[i]:
                stop = price + atr_stop * cur_atr
                qty = (capital * risk_pct / 100) / abs(stop - price) if abs(stop - price) > 0 else 0
                if qty > 0:
                    fee = qty * price * fee_rate
                    fee_total += fee
                    capital -= fee
                    position = -qty
                    entry_price = price
                    is_long = False
                    stop_price = stop
                    tp_price = price - atr_tp * cur_atr
                    entry_idx = i

        if position > 0:
            current_equity = capital + position * price
        elif position < 0:
            current_equity = capital + abs(position) * (entry_price - price)
        else:
            current_equity = capital
        equity_curve.append(round(max(current_equity, 0), 2))

    if position != 0:
        price = float(df["close"].iloc[-1])
        fee = abs(position) * price * fee_rate
        fee_total += fee
        pnl = ((price - entry_price) * position if is_long
               else (entry_price - price) * abs(position)) - fee
        trades.append({
            "entry": round(entry_price, 4),
            "exit": round(price, 4),
            "pnl": round(pnl, 2),
            "pnl_pct": round(pnl / max(capital, 1) * 100, 4),
            "win": pnl > 0,
            "side": "long" if is_long else "short",
            "holding": len(df) - 1 - entry_idx,
            "entry_time": int(df.index[entry_idx].timestamp()),
            "exit_time": int(df.index[-1].timestamp()),
            "exit_reason": "end_of_data",
        })
        capital += pnl

    if not equity_curve:
        equity_curve = [initial_capital]

    return {"trades": trades, "equity_curve": equity_curve, "fee_total": fee_total}


# ---------------------------------------------------------------------------
# Run backtest for any strategy
# ---------------------------------------------------------------------------

def run_strategy_backtest(df: pd.DataFrame, strategy_name: str,
                          initial_capital: float = 10000.0,
                          risk_pct: float = 3.0,
                          atr_stop: float = 2.5,
                          atr_tp: float = 3.2,
                          fee_rate: float = 0.001,
                          start_date: str = "",
                          finish_date: str = "") -> dict | None:
    if len(df) < 30:
        print("[ERROR] Not enough candle data. Need at least 30 candles.")
        return None

    try:
        long_sig, short_sig, atr = get_signals(strategy_name, df)
    except Exception as e:
        print(f"[ERROR] Signal generation failed for '{strategy_name}': {e}")
        return None

    result = simulate(df, long_sig, short_sig, atr,
                      initial_capital=initial_capital,
                      risk_pct=risk_pct, atr_stop=atr_stop, atr_tp=atr_tp,
                      fee_rate=fee_rate, allow_short=True)

    trades = result["trades"]
    equity_curve = result["equity_curve"]
    fee_total = result["fee_total"]

    if not trades:
        print(f"[WARNING] Strategy '{strategy_name}' produced 0 trades on this data. "
              "Try a longer date range or different timeframe.")

    metrics = compute_metrics(trades, equity_curve, initial_capital, fee_total, start_date, finish_date, df)

    print(f"[OK] Backtest complete:")
    print(f"     Trades:       {metrics['total_trades']}")
    print(f"     Net P&L:      {metrics['net_profit']:.2f}%")
    print(f"     Win Rate:     {metrics['win_rate'] * 100:.1f}%")
    print(f"     Sharpe:       {metrics['sharpe_ratio']:.2f}")
    print(f"     Max Drawdown: {metrics['max_drawdown']:.2f}%")
    print(f"     Final Equity: ${metrics['final_equity']:.2f}")

    # Include price and equity data for charting
    price_data = df[['open', 'high', 'low', 'close']].reset_index()
    # Explicitly convert to unix seconds
    price_data['time'] = (price_data['date'].astype('int64') // 10**9).astype(int)
    
    eq_list = []
    benchmark_list = []
    times = price_data['time'].tolist()
    
    if not df.empty:
        first_price = float(df['close'].iloc[0])
        for i in range(min(len(times), len(df))):
            # Strategy Equity
            if i < len(equity_curve):
                eq_list.append({"time": times[i], "value": float(equity_curve[i])})
            
            # Benchmark (Buy & Hold)
            bench_val = initial_capital * (float(df['close'].iloc[i]) / first_price)
            benchmark_list.append({"time": times[i], "value": round(bench_val, 2)})

    chart_candles = price_data[['time', 'open', 'high', 'low', 'close']].to_dict('records')
    
    # Downsample if too many candles (keep chart smooth)
    if len(chart_candles) > 3000:
        step = len(chart_candles) // 2000
        chart_candles = chart_candles[::step]
        eq_list = eq_list[::step]
        benchmark_list = benchmark_list[::step]

    return {
        "metrics": metrics,
        "trades": trades,
        "charts": {
            "equity": eq_list,
            "benchmark": benchmark_list,
            "candles": chart_candles
        },
        "strategy": strategy_name,
    }


def _fmt(t: dict) -> dict:
    return {
        "entry": t.get("entry", 0),
        "exit": t.get("exit", 0),
        "pnl_pct": t.get("pnl_pct", 0),
        "pnl": t.get("pnl", 0),
        "win": t.get("win", False),
        "side": t.get("side", "long"),
        "holding": t.get("holding", 0),
        "exit_reason": t.get("exit_reason", ""),
    }


def save_csv_exports(results: dict, base_path: str):
    """Save trades and equity curve to CSV files for export."""
    try:
        # Trades CSV
        trades = results.get("trades", [])
        if trades:
            trades_df = pd.DataFrame(trades)
            trades_df.to_csv(base_path.replace(".json", "_trades.csv"), index=False)
        
        # Equity CSV
        equity = results.get("charts", {}).get("equity", [])
        if equity:
            equity_df = pd.DataFrame({"tick": range(len(equity)), "equity": equity})
            equity_df.to_csv(base_path.replace(".json", "_equity.csv"), index=False)
            
        print(f"[OK] CSV exports saved alongside {os.path.basename(base_path)}")
    except Exception as e:
        print(f"[WARN] Failed to save CSV exports: {e}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def run_backtest(start_date: str, finish_date: str, strategy_name: str = "",
                 symbol: str = "", exchange: str = "", 
                 initial_capital: float = 10000.0,
                 risk_pct: float = 3.0,
                 atr_stop: float = 2.5,
                 atr_tp: float = 3.2,
                 fee_rate: float = 0.001,
                 result_id: str = "",
                 perturb_data: bool = False):
    label = strategy_name or "SMA Crossover"
    print(f"[INFO] Starting backtest: {start_date} -> {finish_date}")
    if perturb_data:
        print("[INFO] MODE: Candle Based Monte Carlo (Data Perturbation ON)")
    print(f"[INFO] Strategy: {label} | Asset: {symbol or 'all assets'}")
    print(f"[INFO] Params: cap={initial_capital}, risk={risk_pct}%, stop={atr_stop}, tp={atr_tp}, fee={fee_rate}")

    df = load_candles(start_date, finish_date, symbol=symbol, exchange=exchange, perturb_data=perturb_data)
    if df.empty:
        sys.exit(1)

    results = run_strategy_backtest(
        df, label, 
        initial_capital=initial_capital,
        risk_pct=risk_pct,
        atr_stop=atr_stop,
        atr_tp=atr_tp,
        fee_rate=fee_rate,
        start_date=start_date,
        finish_date=finish_date
    )
    if results is None:
        sys.exit(1)

    results["strategy_name"] = label
    results["symbol"] = symbol or "mixed"
    results["exchange"] = exchange or "any"

    os.makedirs(RESULTS_DIR, exist_ok=True)
    rid = result_id or uuid.uuid4().hex[:8]
    filename = f"backtest_{start_date}_{finish_date}_{rid}.json"
    filepath = os.path.join(RESULTS_DIR, filename)
    with open(filepath, "w") as f:
        json.dump(results, f, indent=2)

    save_csv_exports(results, filepath)
    print(f"[OK] Results saved to {filepath}")

    try:
        from trade_history import save_session
        metrics = results.get("metrics", {})
        equity_curve = results.get("charts", {}).get("equity", [])
        trades_list = results.get("trades", [])
        longs = sum(1 for t in trades_list if t.get("side") == "long")
        shorts = sum(1 for t in trades_list if t.get("side") == "short")
        metrics["longs_count"] = longs
        metrics["shorts_count"] = shorts
        session_id = save_session(
            session_type="backtest",
            strategy=label,
            symbol=symbol or "mixed",
            exchange=exchange or "any",
            timeframe="",
            start_date=start_date,
            end_date=finish_date,
            metrics=metrics,
            equity_curve=equity_curve,
        )
        print(f"[OK] Session saved to trading history: {session_id}")
    except Exception as e:
        print(f"[WARN] Could not save to trading history: {e}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python backtest_engine.py <start_date> <finish_date> [strategy_name] [symbol] [exchange]")
        sys.exit(1)
    run_backtest(
        sys.argv[1],
        sys.argv[2],
        sys.argv[3] if len(sys.argv) > 3 else "",
        sys.argv[4] if len(sys.argv) > 4 else "",
        sys.argv[5] if len(sys.argv) > 5 else "",
        float(sys.argv[6]) if len(sys.argv) > 6 else 10000.0,
        float(sys.argv[7]) if len(sys.argv) > 7 else 3.0,
        float(sys.argv[8]) if len(sys.argv) > 8 else 2.5,
        float(sys.argv[9]) if len(sys.argv) > 9 else 3.2,
        float(sys.argv[10]) if len(sys.argv) > 10 else 0.001,
        sys.argv[11] if len(sys.argv) > 11 else "",
        sys.argv[12].lower() == 'true' if len(sys.argv) > 12 else False
    )
