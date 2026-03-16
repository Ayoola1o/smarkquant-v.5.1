import sys
import json
import os
import uuid
import sqlite3
from datetime import datetime
import pandas as pd
import numpy as np

from db_config import DB_PATH
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "storage", "json")


def load_candles(start_date: str, finish_date: str) -> pd.DataFrame:
    if not os.path.exists(DB_PATH):
        print("[ERROR] Database not found. Please import candles first.")
        return pd.DataFrame()

    conn = sqlite3.connect(DB_PATH)
    start_ts = int(datetime.strptime(start_date, "%Y-%m-%d").timestamp() * 1000)
    finish_ts = int(datetime.strptime(finish_date, "%Y-%m-%d").timestamp() * 1000)

    df = pd.read_sql_query(
        "SELECT * FROM candle WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC",
        conn,
        params=(start_ts, finish_ts),
    )
    conn.close()

    if df.empty:
        print(f"[WARNING] No candles found between {start_date} and {finish_date}. Please import data first.")
        return df

    df["date"] = pd.to_datetime(df["timestamp"], unit="ms")
    df = df.set_index("date")
    print(f"[OK] Loaded {len(df)} candles")
    return df


def score_params(df: pd.DataFrame, fast: int, slow: int, capital: float = 10000.0) -> float:
    df = df.copy()
    df["sma_fast"] = df["close"].rolling(fast).mean()
    df["sma_slow"] = df["close"].rolling(slow).mean()
    df = df.dropna()
    if df.empty or len(df) < slow * 2:
        return -999.0

    pos = 0.0
    cash = capital
    entry = 0.0

    sig = (df["sma_fast"] > df["sma_slow"]).astype(int)
    prev = sig.shift(1).fillna(0).astype(int)
    up = (sig == 1) & (prev == 0)
    down = (sig == 0) & (prev == 1)

    for i, (_, row) in enumerate(df.iterrows()):
        p = row["close"]
        if up.iloc[i] and pos == 0:
            pos = cash / p
            entry = p
            cash = 0.0
        elif down.iloc[i] and pos > 0:
            cash = pos * p
            pos = 0.0

    final = cash + pos * df["close"].iloc[-1]
    return (final - capital) / capital * 100


def run_optimize(start_date: str, finish_date: str, n_trials: int = 10):
    print(f"[INFO] Starting optimization: {start_date} → {finish_date}")
    print(f"[INFO] Trials: {n_trials}")
    print(f"[INFO] Parameter space: fast SMA [5–30], slow SMA [20–100]")

    df = load_candles(start_date, finish_date)
    if df.empty:
        sys.exit(1)

    best_score = -9999.0
    best_params = {}
    results_list = []

    fast_values = np.linspace(5, 30, max(n_trials, 5), dtype=int)
    slow_values = np.linspace(20, 100, max(n_trials, 5), dtype=int)

    trial = 0
    for fast in fast_values:
        for slow in slow_values:
            if fast >= slow:
                continue
            if trial >= n_trials:
                break
            trial += 1
            score = score_params(df, int(fast), int(slow))
            results_list.append({"trial": trial, "fast": int(fast), "slow": int(slow), "score": round(score, 4)})
            print(f"[Trial {trial}/{n_trials}] fast={fast}, slow={slow} → Net P&L: {score:.2f}%")
            if score > best_score:
                best_score = score
                best_params = {"fast": int(fast), "slow": int(slow)}
        if trial >= n_trials:
            break

    print(f"[OK] Best params: fast={best_params.get('fast')}, slow={best_params.get('slow')} → {best_score:.2f}%")

    output = {
        "best_params": best_params,
        "best_score": round(best_score, 4),
        "trials": results_list,
        "strategy": "SMA Crossover Optimization",
    }

    os.makedirs(RESULTS_DIR, exist_ok=True)
    filename = f"optimize_{start_date}_{finish_date}_{uuid.uuid4().hex[:8]}.json"
    with open(os.path.join(RESULTS_DIR, filename), "w") as f:
        json.dump(output, f, indent=2)

    print(f"[OK] Results saved to storage/json/{filename}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python optimize_engine.py <start_date> <finish_date> [n_trials]")
        sys.exit(1)
    n = int(sys.argv[3]) if len(sys.argv) > 3 else 10
    run_optimize(sys.argv[1], sys.argv[2], n)
