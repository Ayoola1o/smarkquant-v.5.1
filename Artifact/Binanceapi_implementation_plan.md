# Goal Description
The objective is to ensure that the entire application (both the backtesting engine and live trading bots) fetches live data consistently from either **Alpaca** or **Binance**. Currently, the app heavily relies on *Alpaca* and *YFinance*, but *Binance* API capabilities are completely disconnected and missing SDKs. This plan outlines adding `ccxt` for standardizing interaction with Binance (both spot and futures) to fulfill this missing feature suite without disrupting Alpaca features. 

## User Review Required
> [!WARNING]
> We will need to define `BINANCE_API_KEY` and `BINANCE_SECRET_KEY` in the `.env` file for Binance account data syncing and live order placement. Until these keys are added, live trading via Binance will fallback or raise errors (we will implement error handling so the bot just sleeps or returns gracefully like the Alpaca logic currently does).
> 
> Also, can you confirm if you prefer mapping generic crypto pairs directly (e.g., `BTC/USDT` for Binance)?

## Proposed Changes

### Requirements & Configuration
- We will add the `ccxt` package. 
- Create a `binance_utils.py` to securely fetch keys from the vault or `.env`.

#### [MODIFY] backend/requirements.txt
Add `ccxt>=4.0.0` at the bottom of the list.

### Historical Importer (Backtest Data)
- The app uses importer scripts. We need an equivalent to [alpaca_importer.py](file:///C:/Users/PC/Desktop/quant/smarkquant-v.5.1/backend/alpaca_importer.py).

#### [NEW] backend/binance_importer.py
We will create a script that uses `ccxt.binance()` to fetch OHLCV data directly and save it to the existing `sqlite3` candle storage used by backtesting logic. 

#### [MODIFY] backend/main.py
In the `/candles/import` route, we will map `req.exchange.lower() == "binance"` and `req.exchange.lower() == "binance futures"` to invoke `python binance_importer.py`.

We will also establish `/binance/quote/{symbol}` and `/binance/account` APIs similar to the Alpaca definitions in [main.py](file:///C:/Users/PC/Desktop/quant/smarkquant-v.5.1/backend/main.py) if the UI fetches these standalone.

### Live Trading Loop (Bot Manager)
- [bot_manager.py](file:///C:/Users/PC/Desktop/quant/smarkquant-v.5.1/backend/bot_manager.py) currently explicitly hardcodes [_is_alpaca](file:///C:/Users/PC/Desktop/quant/smarkquant-v.5.1/backend/bot_manager.py#82-85) logic and simulates data for anything else. We'll introduce `_is_binance` and utilize `ccxt.binance()` for fetching prices, executing trades, and updating sync balances.

#### [MODIFY] backend/bot_manager.py
1. Add `_is_binance` evaluation to detect if exchange string contains "binance".
2. Add `_binance_clients()`, returning a `ccxt.binance()` or `ccxt.binanceusdm()` depending on futures capability.
3. Add `_binance_price()` to retrieve recent ticker information (`fetchTicker`).
4. Update [_run_loop](file:///C:/Users/PC/Desktop/quant/smarkquant-v.5.1/backend/bot_manager.py#221-437) to use `elif self._is_binance:` ensuring that live bots fetch the Binance stream respectively and do not simulate price movements.
5. Add `_binance_place_order()` and `_binance_sync_account()`.

## Verification Plan
### Automated Tests
* N/A - we don't have python test cases.

### Manual Verification
1. Boot up the python backend using `uvicorn main:app --reload`.
2. Request historical Binance data via `/candles/import` via Postman, Python script, or UI interface.
3. Validate that rows appear in [market_data.db](file:///C:/Users/PC/Desktop/quant/smarkquant-v.5.1/backend/market_data.db) for the given imported Binance symbols using DB viewer.
4. Launch a Live Bot against "Binance" via the frontend (or explicit API call `/bot/create`).
5. Confirm via backend logs during the runtime loop that price fetch `[BINANCE]` works accurately and it is not warming up with `[SIMULATED]` price drifting logic.
