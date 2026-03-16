import yfinance as yf
import pandas as pd
import sqlite3
from datetime import datetime
import os
import sys
import uuid

def import_yfinance(symbol, start_date, exchange="yfinance"):
    from db_config import DB_PATH as db_path
    
    # Connect to SQLite DB
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        print("[OK] Database connection established")
    except Exception as e:
        print(f"DATABASE CONNECTION ERROR: {str(e)}")
        return

    print(f"Fetching {symbol} from yfinance since {start_date}...")
    
    # Calculate if start_date is older than 730 days
    try:
        start_dt = datetime.strptime(start_date, '%Y-%m-%d')
        days_diff = (datetime.now() - start_dt).days
        # yfinance 1h interval is limited to 730 days.
        # We'll use 1d if the range is greater than 720 days (with a small buffer).
        interval = "1h" if days_diff <= 720 else "1d"
        if interval == "1d":
            print(f"[INFO] Start date {start_date} is > 720 days ago. Using '1d' interval instead of '1h'.")
        else:
            print(f"[INFO] Using '1h' interval.")
    except Exception as e:
        print(f"[ERROR] Date parsing error: {str(e)}. Defaulting to '1d' interval.")
        interval = "1d"

    # Try to download data
    try:
        data = yf.download(symbol, start=start_date, interval=interval, progress=False)
        print(f"[OK] Downloaded {len(data)} candles from yfinance (interval: {interval})")
    except Exception as e:
        print(f"YFINANCE DOWNLOAD ERROR: {str(e)}")
        conn.close()
        return
    
    if data.empty:
        print("[WARNING] No data found for the given symbol and date range.")
        conn.close()
        return

    # Flatten columns if they are MultiIndex (newer yfinance versions)
    if isinstance(data.columns, pd.MultiIndex):
        data.columns = data.columns.get_level_values(0)

    # Ensure table exists (simplified schema for SQLite)
    try:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS candle (
                id TEXT PRIMARY KEY,
                symbol TEXT NOT NULL,
                exchange TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                open REAL NOT NULL,
                high REAL NOT NULL,
                low REAL NOT NULL,
                close REAL NOT NULL,
                volume REAL NOT NULL
            )
        """)
        
        cur.execute("CREATE INDEX IF NOT EXISTS idx_candle_symbol_exchange_timestamp ON candle (symbol, exchange, timestamp)")
        
        print("[OK] Database table verified")
        
        # Insert candles one by one with conflict handling
        inserted_count = 0
        for index, row in data.iterrows():
            # Timestamp in milliseconds
            timestamp = int(index.timestamp() * 1000)
            candle_id = str(uuid.uuid4())
            
            try:
                cur.execute("""
                    INSERT OR IGNORE INTO candle (id, symbol, exchange, timestamp, open, high, low, close, volume)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    candle_id,
                    symbol,
                    exchange,
                    timestamp,
                    float(row['Open']),
                    float(row['High']),
                    float(row['Low']),
                    float(row['Close']),
                    float(row['Volume'])
                ))
                inserted_count += 1
            except Exception as e:
                print(f"[WARNING] Skipped one candle: {str(e)}")
                continue

        conn.commit()
        print(f"[OK] Successfully imported {inserted_count} candles for {symbol}")
        print(f"[OK] Data saved to {db_path}")
    except Exception as e:
        print(f"DATABASE INSERT ERROR: {str(e)}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python yfinance_importer.py <symbol> <start_date>")
    else:
        # If exchange is passed as 4th arg, use it
        exchange = sys.argv[3] if len(sys.argv) > 3 else "yfinance"
        import_yfinance(sys.argv[1], sys.argv[2], exchange)
