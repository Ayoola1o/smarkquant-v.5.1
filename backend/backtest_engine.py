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

def load_candles(start_date: str, finish_date: str, symbol: str = "", exchange: str = "") -> pd.DataFrame:
    if not os.path.exists(DB_PATH):
        print(f"[ERROR] Database not found at {DB_PATH}. Please import candles first.")
        return pd.DataFrame()

    conn = sqlite3.connect(DB_PATH)
    start_ts = int(datetime.strptime(start_date, "%Y-%m-%d").timestamp() * 1000)
    finish_ts = int(datetime.strptime(finish_date, "%Y-%m-%d").timestamp() * 1000)

    conditions = ["timestamp >= ?", "timestamp <= ?"]
    params: list = [start_ts, finish_ts]
    if symbol:
        conditions.append("symbol = ?")
        params.append(symbol)
    if exchange:
        conditions.append("exchange = ?")
        params.append(exchange)

    query = f"SELECT * FROM candle WHERE {' AND '.join(conditions)} ORDER BY timestamp ASC"
    df = pd.read_sql_query(query, conn, params=params)
    conn.close()

    if df.empty and symbol:
        conn = sqlite3.connect(DB_PATH)
        fallback = "SELECT * FROM candle WHERE timestamp >= ? AND timestamp <= ? AND symbol = ? ORDER BY timestamp ASC"
        df = pd.read_sql_query(fallback, conn, params=[start_ts, finish_ts, symbol])
        conn.close()
        if not df.empty:
            print(f"[INFO] Found {len(df)} candles for {symbol} (any exchange)")

    if df.empty:
        avail = _list_available_symbols()
        print(f"[WARNING] No candles found for {symbol or 'any symbol'} between {start_date} and {finish_date}.")
        if avail:
            print(f"[INFO] Available symbols in DB: {', '.join(avail)}")
        else:
            print("[INFO] Database is empty. Please import candle data first using the Data tab.")
        return df

    df["date"] = pd.to_datetime(df["timestamp"], unit="ms")
    df = df.set_index("date")
    print(f"[OK] Loaded {len(df)} candles for {symbol or 'all'} from {start_date} to {finish_date}")
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

def compute_metrics(trades: list, equity_curve: list, initial_capital: float, fee_total: float) -> dict:
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

    return {
        "net_profit": round(net_profit_pct, 4),
        "net_profit_val": round(net_profit_val, 2),
        "win_rate": round(win_rate, 4),
        "max_drawdown": round(max_drawdown, 4),
        "total_trades": total,
        "initial_capital": initial_capital,
        "final_equity": round(final_equity, 2),
        "sharpe_ratio": round(sharpe, 4),
        "sortino_ratio": round(sortino, 4),
        "calmar_ratio": round(calmar, 4),
        "omega_ratio": round(omega, 4),
        "smart_sharpe": 0.0,
        "smart_sortino": 0.0,
        "serenity_index": 0.0,
        "avg_win": round(avg_win, 2),
        "avg_loss": round(avg_loss, 2),
        "avg_win_loss": round(avg_win_loss, 4),
        "gross_profit": round(gross_profit, 2),
        "gross_loss": round(gross_loss, 2),
        "expectancy": round(expectancy, 2),
        "expectancy_pct": round(expectancy_pct, 4),
        "avg_holding_period": round(avg_holding, 2),
        "largest_win": round(largest_win, 2),
        "largest_loss": round(largest_loss, 2),
        "total_winning_streak": max_win_streak,
        "total_losing_streak": max_loss_streak,
        "current_streak": cur_streak,
        "winning_trades": len(wins),
        "losing_trades": len(losses),
        "fee": round(fee_total, 2),
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
                    "exit_reason": "stop" if hit_stop else "tp",
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
            current_equity = capital + abs(position) * (2 * entry_price - price)
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
                          initial_capital: float = 10_000.0) -> dict | None:
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
                      risk_pct=3.0, atr_stop=2.5, atr_tp=3.2,
                      fee_rate=0.001, allow_short=True)

    trades = result["trades"]
    equity_curve = result["equity_curve"]
    fee_total = result["fee_total"]

    if not trades:
        print(f"[WARNING] Strategy '{strategy_name}' produced 0 trades on this data. "
              "Try a longer date range or different timeframe.")

    metrics = compute_metrics(trades, equity_curve, initial_capital, fee_total)

    print(f"[OK] Backtest complete:")
    print(f"     Trades:       {metrics['total_trades']}")
    print(f"     Net P&L:      {metrics['net_profit']:.2f}%")
    print(f"     Win Rate:     {metrics['win_rate'] * 100:.1f}%")
    print(f"     Sharpe:       {metrics['sharpe_ratio']:.2f}")
    print(f"     Max Drawdown: {metrics['max_drawdown']:.2f}%")
    print(f"     Final Equity: ${metrics['final_equity']:.2f}")

    return {
        "metrics": metrics,
        "charts": {"equity": equity_curve},
        "trades": [_fmt(t) for t in trades[:200]],
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


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def run_backtest(start_date: str, finish_date: str, strategy_name: str = "",
                 symbol: str = "", exchange: str = ""):
    label = strategy_name or "SMA Crossover"
    print(f"[INFO] Starting backtest: {start_date} → {finish_date}")
    print(f"[INFO] Strategy: {label} | Asset: {symbol or 'all assets'}")

    df = load_candles(start_date, finish_date, symbol=symbol, exchange=exchange)
    if df.empty:
        sys.exit(1)

    results = run_strategy_backtest(df, label)
    if results is None:
        sys.exit(1)

    results["strategy_name"] = label
    results["symbol"] = symbol or "mixed"
    results["exchange"] = exchange or "any"

    os.makedirs(RESULTS_DIR, exist_ok=True)
    filename = f"backtest_{start_date}_{finish_date}_{uuid.uuid4().hex[:8]}.json"
    filepath = os.path.join(RESULTS_DIR, filename)
    with open(filepath, "w") as f:
        json.dump(results, f, indent=2)

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
    )
