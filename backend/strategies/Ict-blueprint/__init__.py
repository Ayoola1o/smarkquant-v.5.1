from jesse.strategies import Strategy
import jesse.indicators as ta
from jesse import utils

class ICTSimpleBlueprint(Strategy):
    @property
    def htf_candles(self):
        # High Timeframe (Daily) for Bias and POIs
        return self.get_candles('Binance', self.symbol, '1D')

    def should_long(self) -> bool:
        # 1. Identify HTF Trend (Higher Highs/Lows)
        # 2. Check if price is in 'Discount' (< 50% of HTF range) [00:16:54]
        # 3. Check if price is within a Daily Order Block [00:12:51]
        # 4. Look for LTF (Current TF) Market Structure Break (Breaker) [00:31:53]
        
        # Simplified logic for this example:
        is_in_discount = self.price < (self.htf_candles[-1][3] + self.htf_candles[-30][4]) / 2
        is_bullish_break = self.price > ta.highest(self.candles, 10)[-2]
        
        return is_in_discount and is_bullish_break

    def should_short(self) -> bool:
        is_in_premium = self.price > (self.htf_candles[-1][3] + self.htf_candles[-30][4]) / 2
        is_bearish_break = self.price < ta.lowest(self.candles, 10)[-2]
        
        return is_in_premium and is_bearish_break

    def go_long(self):
        # Entry at the breaker/market structure shift [00:32:22]
        qty = utils.risk_to_qty(self.balance, 1, self.price, self.stop_loss)
        self.buy = qty, self.price

    def go_short(self):
        qty = utils.risk_to_qty(self.balance, 1, self.price, self.stop_loss)
        self.sell = qty, self.price

    @property
    def stop_loss(self) -> float:
        # Stop loss placed below the swing low (the 'sweep' low) [00:33:09]
        if self.is_long:
            return ta.lowest(self.candles, 20)[-1]
        return ta.highest(self.candles, 20)[-1]

    @property
    def take_profit(self) -> float:
        # Target the 'External Range Liquidity' (HTF High/Low) [00:24:46]
        # Minimum 2:1 Risk-Reward ratio as recommended [00:35:30]
        return self.price + (self.price - self.stop_loss) * 2