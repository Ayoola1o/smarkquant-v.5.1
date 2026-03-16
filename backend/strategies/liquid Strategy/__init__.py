from jesse.strategies import Strategy, Cached
import jesse.indicators as ta
from jesse import utils

class liquid Strategy(Strategy):
    def should_long(self) -> bool:
        return False

    def should_short(self) -> bool:
        return False
from jesse.strategies import Strategy
import jesse.indicators as ta
from jesse import utils

class LiquidityTrading(Strategy):
    @property
    def volume_osc(self):
        # Measures volume momentum to identify liquidity spikes
        return ta.vosc(self.candles, short_period=2, long_period=5)

    @property
    def rsi(self):
        return ta.rsi(self.candles, period=14)

    def should_long(self) -> bool:
        # Long when liquidity spikes (vosc > 0) and RSI is gaining strength
        return self.volume_osc > 0 and 50 < self.rsi < 70

    def should_short(self) -> bool:
        # Short when liquidity spikes and RSI is weakening
        return self.volume_osc > 0 and 30 < self.rsi < 50

    def go_long(self):
        qty = utils.risk_to_qty(self.capital, 3, self.price, self.price * 0.95)
        self.buy = qty, self.price

    def go_short(self):
        qty = utils.risk_to_qty(self.capital, 3, self.price, self.price * 1.05)
        self.sell = qty, self.price

    def should_cancel_entry(self) -> bool:
        return True

    def update_position(self):
        # Exit if liquidity dries up (vosc becomes negative)
        if self.volume_osc < 0:
            self.liquidate()
    def go_long(self):
        pass

    def go_short(self):
        pass

    def should_cancel_entry(self) -> bool:
        return True

    def filters(self):
        return []
