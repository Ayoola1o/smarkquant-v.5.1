# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# This file defines backtest/Jesse routes — one route per symbol/strategy.
# NOTE: This is separate from the Live Dashboard bots (bot_manager.py).
#       Each Live bot you launch runs its own independent strategy.

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #


from jesse.utils import get_hour_candles_count


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# Trading Routes
# Format: (exchange, pair, timeframe, strategy)
# You can have one route per symbol — each uses its own strategy independently.

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

routes = [

    ('Binance Futures', 'BTC-USDT', '4h', 'SampleStrategy'),

    ('Binance Futures', 'ETH-USDT', '4h', 'CloudScappler'),

    ('Binance Futures', 'BNB-USDT', '4h', 'simple-bollinger-bands-strategy'),

    ('Binance Futures', 'LTC-USDT', '15m', 'imt'),

    ('Binance Futures', 'SOL-USDT', '1h', 'liquid Strategy'),

]


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# Extra Candles
# Used to provide extra timeframe data to strategies that need it.

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

extra_candles = [

    ('Binance Futures', 'BTC-USDT', '1h'),

]
