import os
import sys
from dotenv import load_dotenv

# Load env variables
root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(dotenv_path=root_env, override=False)

from alpaca_utils import get_alpaca_credentials
from bot_manager import TradingBot

def test_order():
    api_key, secret_key = get_alpaca_credentials()
    if not api_key or not secret_key:
        print("Missing Alpaca credentials")
        return

    from alpaca.trading.client import TradingClient
    from alpaca.data.historical import CryptoHistoricalDataClient
    from alpaca.data.requests import CryptoLatestBarRequest

    tc = TradingClient(api_key, secret_key, paper=True)
    cc = CryptoHistoricalDataClient(api_key, secret_key)
    
    # We want a $10 order. Let's find BTC/USD price
    try:
        bars = cc.get_crypto_latest_bar(CryptoLatestBarRequest(symbol_or_symbols=["BTC/USD"]))
        bar = bars.get("BTC/USD")
        price = float(bar.close) if bar else 65000.0
    except Exception as e:
        print(f"Failed to fetch price, using default. Error: {e}")
        price = 65000.0
    
    # Calculate qty for exactly $11 to be safe above the $10 minimum
    qty = 11.0 / price
    
    bot = TradingBot(bot_id="test", symbol="BTC-USD", exchange="alpaca paper", amount=100.0, currency="USD")
    
    print(f"Testing place order for BTC-USD at price {price}, qty {qty:.6f} (Notional ~${qty * price:.2f})")
    
    # This should succeed and not throw get_order error
    order = bot._alpaca_place_order(tc, "BUY", qty, price)
    if order:
        print(f"Order successful: {order.id}, Status: {getattr(order, 'status', 'N/A')}")
    else:
        print("Order failed or was refused.")
        
    print("\nLogs:")
    for log in bot.logs:
        print(log)

if __name__ == "__main__":
    test_order()
