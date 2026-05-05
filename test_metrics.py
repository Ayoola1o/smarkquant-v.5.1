
import sys
import os
import time

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.bot_manager import TradingBot

def test_bot_metrics():
    print("Testing TradingBot metrics...")
    bot = TradingBot(
        bot_id="test-bot",
        symbol="BTC-USD",
        exchange="Simulated",
        amount=1000,
        currency="USD",
        strategy="MovingAverage",
        timeframe="1h"
    )
    
    # Simulate a price increase
    bot._price_history.append(60000)
    bot._price_history.append(61000)
    bot.equity_usd = 1010
    bot.pnl_usd = 10
    
    # Trigger tick logic
    bot._run_loop() # This will call _alpaca_sync_account or sim logic
    
    data = bot.to_dict()
    
    print(f"ROI: {data.get('roi_pct')}%")
    print(f"MDD: {data.get('max_drawdown')}%")
    print(f"Profit Factor: {data.get('profit_factor')}")
    print(f"Sharpe: {data.get('sharpe_ratio')}")
    print(f"API Status: {data.get('api_status')}")
    
    # Check if all new keys are present
    required_keys = ["roi_pct", "max_drawdown", "profit_factor", "sharpe_ratio", "sortino_ratio", "exposure_usd", "avg_trade_pnl"]
    for key in required_keys:
        if key in data:
            print(f"✓ Found {key}: {data[key]}")
        else:
            print(f"✗ Missing {key}")

if __name__ == "__main__":
    test_bot_metrics()
