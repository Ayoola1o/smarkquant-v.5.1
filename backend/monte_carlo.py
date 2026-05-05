import random
import numpy as np
import pandas as pd
from typing import List, Dict, Any

class MonteCarloEngine:
    """
    Monte Carlo Analysis suite for backtest trade results.
    """
    
    @staticmethod
    def shuffle_trades(trades: List[Dict[str, Any]], iterations: int = 100) -> List[Dict[str, Any]]:
        """
        Randomly reorders trades to simulate equity curve variability while maintaining 
        identical total return (assuming no compounding/dynamic sizing).
        """
        results = []
        for i in range(iterations):
            shuffled = list(trades)
            random.shuffle(shuffled)
            equity_curve = MonteCarloEngine._calculate_equity_curve(shuffled)
            results.append({
                "iteration": i,
                "equity_curve": equity_curve,
                "max_drawdown": MonteCarloEngine._calculate_max_drawdown(equity_curve)
            })
        return results

    @staticmethod
    def bootstrap_trades(trades: List[Dict[str, Any]], iterations: int = 1000) -> Dict[str, Any]:
        """
        Resamples trades with replacement to estimate statistical confidence intervals for KPIs.
        """
        pnls = [t.get('pnl', 0) for t in trades]
        if not pnls:
            return {}

        bootstrapped_roi = []
        for _ in range(iterations):
            sample = random.choices(pnls, k=len(pnls))
            bootstrapped_roi.append(sum(sample))

        return {
            "mean_roi": float(np.mean(bootstrapped_roi)),
            "std_roi": float(np.std(bootstrapped_roi)),
            "confidence_interval_95": [
                float(np.percentile(bootstrapped_roi, 2.5)),
                float(np.percentile(bootstrapped_roi, 97.5))
            ],
            "probability_of_loss": float(len([r for r in bootstrapped_roi if r < 0]) / iterations)
        }

    @staticmethod
    def _calculate_equity_curve(trades: List[Dict[str, Any]], initial_capital: float = 10000.0) -> List[float]:
        curve = [initial_capital]
        current = initial_capital
        for t in trades:
            current += t.get('pnl', 0)
            curve.append(current)
        return curve

    @staticmethod
    def _calculate_max_drawdown(equity_curve: List[float]) -> float:
        if not equity_curve:
            return 0.0
        peak = equity_curve[0]
        max_dd = 0.0
        for val in equity_curve:
            if val > peak:
                peak = val
            dd = (peak - val) / peak if peak > 0 else 0.0
            if dd > max_dd:
                max_dd = dd
        return round(max_dd * 100, 2)

    @staticmethod
    def candle_perturbation(candles: List[Dict[str, Any]], noise_factor: float = 0.01) -> List[Dict[str, Any]]:
        """
        Adds random noise to OHLC data to test strategy robustness against price variations.
        """
        perturbed = []
        for c in candles:
            p = dict(c)
            noise = 1 + (random.uniform(-noise_factor, noise_factor))
            p['open'] *= noise
            p['high'] *= noise
            p['low'] *= noise
            p['close'] *= noise
            perturbed.append(p)
        return perturbed
