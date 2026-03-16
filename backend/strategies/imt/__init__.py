from jesse.strategies import Strategy
import jesse.indicators as ta
from jesse import utils

class RS EMA(Strategy):
    @property
    def rsi(self):
        # Calculate RSI with a default period of 14
        return ta.rsi(self.candles, period=14)

    @property
    def ema_200(self):
        # Calculate 200-period Exponential Moving Average
        return ta.ema(self.candles, period=200)

    def should_long(self) -> bool:
        # Long condition: RSI < 30 AND Price > 200 EMA
        return self.rsi < 30 and self.price > self.ema_200

    def should_short(self) -> bool:
        return False

    def should_cancel_entry(self) -> bool:
        return True

    def go_long(self):
        # Open a long position using 10% of available capital as an example
        qty = utils.size_to_qty(self.balance * 0.1, self.price, fee_rate=self.fee_rate)
        self.buy = qty, self.price

    def go_short(self):
        pass

    def update_position(self):
        # Example exit: Close position if RSI goes above 70
        if self.rsi > 70:
            self.liquidate()