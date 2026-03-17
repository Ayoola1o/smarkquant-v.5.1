from jesse.strategies import Strategy
import jesse.indicators as ta
from jesse import utils

class JadeCapSFP(Strategy):
    @property
    def htf_candles(self):
        # Higher Timeframe: 1H for SFP identification [00:04:17]
        return self.get_candles(self.exchange, self.symbol, '1H')

    def should_long(self) -> bool:
        # 1. Check Time: Strategy focuses on the New York Equity Open window [00:01:17]
        if not (14 <= self.time.hour <= 18): # Example for EST morning
            return False

        # 2. HTF SFP Confirmation: Price swept a 1H low but closed above it [00:02:41]
        htf_low = ta.lowest(self.htf_candles, 24)[-2] # Prior 24 hours swing low
        is_sfp = self.htf_candles[-1][4] < htf_low and self.htf_candles[-1][3] > htf_low
        
        # 3. LTF Entry: 5m Fair Value Gap (FVG) [00:05:28]
        # FVG: Candle 1 High < Candle 3 Low (for bullish)
        fvg_exists = self.candles[-3][3] < self.candles[-1][4]
        
        return is_sfp and fvg_exists

    def should_short(self) -> bool:
        if not (14 <= self.time.hour <= 18):
            return False

        htf_high = ta.highest(self.htf_candles, 24)[-2]
        is_sfp = self.htf_candles[-1][3] > htf_high and self.htf_candles[-1][4] < htf_high
        fvg_exists = self.candles[-3][4] > self.candles[-1][3]
        
        return is_sfp and fvg_exists

    def go_long(self):
        # Stop loss below Candle 2 of the FVG [00:05:48]
        sl = self.candles[-2][4]
        qty = utils.risk_to_qty(self.balance, 1, self.price, sl, fee_rate=self.fee_rate)
        self.buy = qty, self.price

    def go_short(self):
        sl = self.candles[-2][3]
        qty = utils.risk_to_qty(self.balance, 1, self.price, sl, fee_rate=self.fee_rate)
        self.sell = qty, self.price

    @property
    def take_profit(self) -> float:
        # Aim for a minimum 2:1 Risk-Reward Ratio [00:05:52]
        risk = abs(self.price - self.stop_loss)
        return self.price + (risk * 2) if self.is_long else self.price - (risk * 2)