"""
Strategy Engine — reads Jesse-style strategy files, detects indicators used,
and generates long/short signals using pure numpy/pandas implementations.

Used by both backtest_engine.py and bot_manager.py so that selected strategy
actually drives the signal logic everywhere.
"""

import os
import re
import numpy as np
import pandas as pd

STRATEGIES_DIR = os.path.join(os.path.dirname(__file__), "strategies")


# ---------------------------------------------------------------------------
# Indicator library (pure numpy/pandas)
# ---------------------------------------------------------------------------

def _safe_series(values, index=None):
    s = pd.Series(values, index=index)
    return s.where(np.isfinite(s), np.nan)


def ind_ema(close: pd.Series, period: int) -> pd.Series:
    return close.ewm(span=period, adjust=False).mean()


def ind_sma(close: pd.Series, period: int) -> pd.Series:
    return close.rolling(period).mean()


def ind_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    h, l, c = df["high"], df["low"], df["close"]
    tr = pd.concat([h - l, (h - c.shift(1)).abs(), (l - c.shift(1)).abs()], axis=1).max(axis=1)
    return tr.ewm(span=period, adjust=False).mean()


def ind_adx(df: pd.DataFrame, period: int = 14) -> pd.Series:
    h, l = df["high"], df["low"]
    atr = ind_atr(df, period)
    up = h.diff()
    dn = -l.diff()
    plus_dm = pd.Series(np.where((up > dn) & (up > 0), up, 0.0), index=df.index)
    minus_dm = pd.Series(np.where((dn > up) & (dn > 0), dn, 0.0), index=df.index)
    plus_di = 100 * plus_dm.ewm(span=period, adjust=False).mean() / atr.replace(0, np.nan)
    minus_di = 100 * minus_dm.ewm(span=period, adjust=False).mean() / atr.replace(0, np.nan)
    dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di).replace(0, np.nan)
    return dx.ewm(span=period, adjust=False).mean()


def ind_rsi(close: pd.Series, period: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.where(delta > 0, 0.0).ewm(span=period, adjust=False).mean()
    loss = (-delta).where(delta < 0, 0.0).ewm(span=period, adjust=False).mean()
    rs = gain / loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def ind_macd(close: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9):
    ema_fast = ind_ema(close, fast)
    ema_slow = ind_ema(close, slow)
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    hist = macd_line - signal_line
    return macd_line, signal_line, hist


def ind_bbands(close: pd.Series, period: int = 20, std: float = 2.0):
    mid = close.rolling(period).mean()
    s = close.rolling(period).std()
    upper = mid + std * s
    lower = mid - std * s
    return upper, mid, lower


def ind_bbw(close: pd.Series, period: int = 20) -> pd.Series:
    upper, mid, lower = ind_bbands(close, period)
    return ((upper - lower) / mid.replace(0, np.nan)) * 100


def ind_ichimoku(df: pd.DataFrame):
    h, l = df["high"], df["low"]
    conversion = (h.rolling(9).max() + l.rolling(9).min()) / 2
    base = (h.rolling(26).max() + l.rolling(26).min()) / 2
    span_a = (conversion + base) / 2
    span_b = (h.rolling(52).max() + l.rolling(52).min()) / 2
    return conversion, base, span_a, span_b


def ind_stoch(df: pd.DataFrame, k: int = 14, d: int = 3):
    low_k = df["low"].rolling(k).min()
    high_k = df["high"].rolling(k).max()
    k_val = 100 * (df["close"] - low_k) / (high_k - low_k).replace(0, np.nan)
    d_val = k_val.rolling(d).mean()
    return k_val, d_val


# ---------------------------------------------------------------------------
# Strategy file reader & indicator detector
# ---------------------------------------------------------------------------

def read_strategy_code(strategy_name: str) -> str:
    path = os.path.join(STRATEGIES_DIR, strategy_name, "__init__.py")
    if not os.path.exists(path):
        return ""
    with open(path) as f:
        return f.read()


def detect_indicators(code: str) -> dict:
    """
    Parse Jesse strategy code and return a dict of detected indicators.
    Returns: {indicator_name: [params, ...]}
    """
    detected = {}

    patterns = {
        "ichimoku":     r"ta\.ichimoku_cloud",
        "ema":          r"ta\.ema\s*\([^,)]+,\s*period\s*=\s*(\d+)|ta\.ema\s*\([^,)]+,\s*(\d+)",
        "sma":          r"ta\.sma\s*\([^,)]+,\s*period\s*=\s*(\d+)|ta\.sma\s*\([^,)]+,\s*(\d+)",
        "adx":          r"ta\.adx",
        "rsi":          r"ta\.rsi\s*\([^,)]+,\s*period\s*=\s*(\d+)|ta\.rsi\s*\([^,)]+,\s*(\d+)",
        "macd":         r"ta\.macd",
        "bbands":       r"ta\.bollinger_bands(?!_width)",
        "bbw":          r"ta\.bollinger_bands_width",
        "stochastic":   r"ta\.stoch",
        "atr":          r"ta\.atr",
    }

    for name, pat in patterns.items():
        matches = re.findall(pat, code)
        if matches:
            detected[name] = True

    ema_periods = re.findall(r"ta\.ema\s*\([^,]+,\s*(?:period\s*=\s*)?(\d+)", code)
    if ema_periods:
        detected["ema_periods"] = [int(p) for p in ema_periods]

    sma_periods = re.findall(r"ta\.sma\s*\([^,]+,\s*(?:period\s*=\s*)?(\d+)", code)
    if sma_periods:
        detected["sma_periods"] = [int(p) for p in sma_periods]

    rsi_periods = re.findall(r"ta\.rsi\s*\([^,]+,\s*(?:period\s*=\s*)?(\d+)", code)
    if rsi_periods:
        detected["rsi_periods"] = [int(p) for p in rsi_periods]

    has_long = "should_long" in code or "go_long" in code
    has_short = "should_short" in code or "go_short" in code
    detected["allow_short"] = has_short and "return False" not in re.findall(
        r"def should_short.*?(?=def |\Z)", code, re.DOTALL
    )

    return detected


# ---------------------------------------------------------------------------
# Signal generator — builds long/short boolean Series from indicator detections
# ---------------------------------------------------------------------------

def generate_signals(df: pd.DataFrame, detected: dict) -> tuple[pd.Series, pd.Series, pd.Series]:
    """
    Returns (long_signal, short_signal, atr) Series based on detected indicators.
    Signals are boolean Series aligned to df.index.
    """
    n = len(df)
    false_series = pd.Series([False] * n, index=df.index)
    atr = ind_atr(df, 14)

    long_conditions = []
    short_conditions = []

    if detected.get("ichimoku"):
        conv, base, span_a, span_b = ind_ichimoku(df)
        bull = (conv > base) & (span_a > span_b)
        bear = (conv < base) & (span_a < span_b)
        long_conditions.append(bull)
        short_conditions.append(bear)

    if detected.get("ema"):
        periods = detected.get("ema_periods", [200])
        for p in periods[:2]:
            if p <= n:
                ema = ind_ema(df["close"], p)
                long_conditions.append(df["close"] > ema)
                short_conditions.append(df["close"] < ema)

    if detected.get("sma") and not detected.get("ema"):
        periods = detected.get("sma_periods", [50, 200])
        if len(periods) >= 2:
            s_fast = ind_sma(df["close"], periods[0])
            s_slow = ind_sma(df["close"], periods[1])
            long_conditions.append(s_fast > s_slow)
            short_conditions.append(s_fast < s_slow)
        elif len(periods) == 1:
            sma = ind_sma(df["close"], periods[0])
            long_conditions.append(df["close"] > sma)
            short_conditions.append(df["close"] < sma)

    if detected.get("adx"):
        adx = ind_adx(df, 14)
        long_conditions.append(adx > 20)
        short_conditions.append(adx > 20)

    if detected.get("rsi"):
        periods = detected.get("rsi_periods", [14])
        rsi = ind_rsi(df["close"], periods[0])
        long_conditions.append(rsi < 60)
        short_conditions.append(rsi > 40)

    if detected.get("macd"):
        macd_line, signal_line, hist = ind_macd(df["close"])
        long_conditions.append(hist > 0)
        short_conditions.append(hist < 0)

    if detected.get("bbw") or detected.get("bbands"):
        bbw = ind_bbw(df["close"], 20)
        long_conditions.append(bbw < 10)
        short_conditions.append(bbw < 10)

    if detected.get("stochastic"):
        k, d = ind_stoch(df)
        long_conditions.append(k > d)
        short_conditions.append(k < d)

    if not long_conditions:
        fast = min(20, n // 6)
        slow = min(50, n // 3)
        if fast < slow:
            sma_f = ind_sma(df["close"], fast)
            sma_s = ind_sma(df["close"], slow)
            long_conditions.append(sma_f > sma_s)
            short_conditions.append(sma_f < sma_s)

    def combine(conds):
        if not conds:
            return false_series
        result = conds[0]
        for c in conds[1:]:
            result = result & c
        return result.fillna(False)

    raw_long = combine(long_conditions)
    raw_short = combine(short_conditions)

    long_sig = raw_long & (~raw_long.shift(1).fillna(False))
    short_sig = raw_short & (~raw_short.shift(1).fillna(False))

    allow_short = detected.get("allow_short", True)
    if not allow_short:
        short_sig = false_series

    return long_sig, short_sig, atr


# ---------------------------------------------------------------------------
# Named strategy overrides (precise hand-coded logic for known strategies)
# ---------------------------------------------------------------------------

def _cloud_scappler_signals(df: pd.DataFrame):
    conv, base, span_a, span_b = ind_ichimoku(df)
    ema200 = ind_ema(df["close"], 200)
    adx = ind_adx(df, 14)
    bbw = ind_bbw(df["close"], 20)
    atr = ind_atr(df, 14)

    bull = (conv > base) & (span_a > span_b) & (df["close"] > ema200) & (adx > 25) & (bbw < 8)
    bear = (conv < base) & (span_a < span_b) & (df["close"] < ema200) & (adx > 25) & (bbw < 8)

    long_sig = bull & (~bull.shift(1).fillna(False))
    short_sig = bear & (~bear.shift(1).fillna(False))
    return long_sig.fillna(False), short_sig.fillna(False), atr


NAMED_STRATEGIES = {
    "cloudscappler": _cloud_scappler_signals,
    "cloud scappler": _cloud_scappler_signals,
    "cloud scalper": _cloud_scappler_signals,
    "cloudscalper": _cloud_scappler_signals,
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_signals(strategy_name: str, df: pd.DataFrame) -> tuple[pd.Series, pd.Series, pd.Series]:
    """
    Main entry point. Returns (long_signal, short_signal, atr) for a strategy.
    1. Checks named overrides first
    2. Falls back to dynamic indicator detection from the strategy file
    3. Last resort: simple SMA crossover
    """
    key = strategy_name.lower().strip()

    if key in NAMED_STRATEGIES:
        return NAMED_STRATEGIES[key](df)

    code = read_strategy_code(strategy_name)
    if code:
        detected = detect_indicators(code)
        print(f"[INFO] Strategy '{strategy_name}' — detected indicators: {[k for k in detected if detected[k] is True]}")
        return generate_signals(df, detected)

    print(f"[WARNING] Strategy '{strategy_name}' not found. Using SMA crossover fallback.")
    n = len(df)
    fast = min(20, max(3, n // 6))
    slow = min(50, max(6, n // 3))
    atr = ind_atr(df, 14)
    sig = (ind_sma(df["close"], fast) > ind_sma(df["close"], slow)).fillna(False)
    long_sig = sig & (~sig.shift(1).fillna(False))
    short_sig = (~sig) & (sig.shift(1).fillna(False))
    return long_sig, short_sig, atr


def get_signals_streaming(strategy_name: str, price_history: list) -> dict:
    """
    For live bots — compute current bar signal from a rolling price history list.
    Returns {"long": bool, "short": bool, "adx": float, "trend": str}
    """
    if len(price_history) < 60:
        return {"long": False, "short": False, "adx": 0.0, "trend": "neutral"}

    prices = price_history[-300:]
    df = pd.DataFrame({
        "open": prices,
        "high": [p * 1.002 for p in prices],
        "low": [p * 0.998 for p in prices],
        "close": prices,
        "volume": [1000.0] * len(prices),
    })

    try:
        long_sig, short_sig, atr = get_signals(strategy_name, df)
        adx_series = ind_adx(df, 14)
        return {
            "long": bool(long_sig.iloc[-1]),
            "short": bool(short_sig.iloc[-1]),
            "adx": round(float(adx_series.iloc[-1]) if not np.isnan(adx_series.iloc[-1]) else 0.0, 2),
            "trend": "bull" if df["close"].iloc[-1] > ind_ema(df["close"], 50).iloc[-1] else "bear",
            "atr": round(float(atr.iloc[-1]) if not np.isnan(atr.iloc[-1]) else 0.0, 4),
        }
    except Exception as e:
        return {"long": False, "short": False, "adx": 0.0, "trend": "neutral", "error": str(e)}
