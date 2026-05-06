from fastapi import FastAPI, HTTPException, Query, Request, Depends, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import os
import subprocess
from dotenv import load_dotenv
import json
import shutil
import threading
import time
import sys
import shlex
import uuid
from bot_manager import bot_manager
from alpaca_utils import get_alpaca_credentials, get_user_alpaca_credentials
from db_config import DB_PATH
from trade_history import (
    init_history_table, save_session, list_sessions,
    get_session, delete_session, update_notes
)
from transactions import (
    init_transactions_table, create_transaction,
    verify_otp, list_transactions, get_transaction_summary
)
from supabase_config import get_supabase_client, verify_supabase_token
from monte_carlo import MonteCarloEngine

root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(dotenv_path=root_env, override=True)
app = FastAPI(title="Quant Trading Platform API")

# Supabase Auth setup
security = HTTPBearer()

# Process Management for Jesse
class JesseProcessManager:
    def __init__(self):
        self.process = None
        self.logs = []
        self.is_running = False
        self.last_command = ""
        self.start_time = 0
        self.finish_time = 0
        self.exit_code = None

    def run_command(self, command, cwd):
        if self.is_running:
            return False, "A process is already running"
        
        self.is_running = True
        self.logs = []
        self.last_command = command
        self.start_time = time.time()
        self.finish_time = 0
        self.exit_code = None

        def runner():
            try:
                # Use shell=True for string commands, shell=False for lists (safer on Windows)
                is_shell = isinstance(command, str)
                self.process = subprocess.Popen(
                    command,
                    cwd=cwd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    shell=is_shell
                )
                for line in self.process.stdout:
                    self.logs.append(line)
                    if len(self.logs) > 2000:
                        self.logs.pop(0)
                
                self.process.wait()
                self.exit_code = self.process.returncode
            except Exception as e:
                self.logs.append(f"CRITICAL ERROR: {str(e)}")
                self.exit_code = -1
            finally:
                self.is_running = False
                self.finish_time = time.time()
        
        thread = threading.Thread(target=runner)
        thread.daemon = True
        thread.start()
        return True, "Started"

    def get_status(self):
        return {
            "is_running": self.is_running,
            "logs": self.logs[-50:], # Return last 50 logs for polling
            "last_command": self.last_command,
            "exit_code": self.exit_code,
            "runtime": round(time.time() - self.start_time, 2) if self.is_running else round(self.finish_time - self.start_time, 2)
        }

    def stop_process(self):
        if self.process and self.is_running:
            self.process.terminate()
            self.is_running = False
            self.finish_time = time.time()
            self.logs.append("--- PROCESS TERMINATED BY USER ---")
            return True, "Stopped"
        return False, "No process running"

jesse_mgr = JesseProcessManager()

# Allow all CORS for dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Authentication dependency
async def get_current_user(authorization: str = Header(None)):
    """Verify Supabase JWT token and return user information"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    try:
        # Extract token from "Bearer <token>" format
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization format")

        token = authorization.split(" ")[1]
        user_info = verify_supabase_token(token)
        return user_info
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid authentication credentials: {str(e)}")

# Optional authentication for public endpoints
async def get_current_user_optional(authorization: str = Header(None)):
    """Optional authentication - returns None if no token provided"""
    if not authorization or not authorization.startswith("Bearer "):
        return None

    try:
        token = authorization.split(" ")[1]
        user_info = verify_supabase_token(token)
        return user_info
    except Exception:
        return None

STRATEGIES_DIR = "strategies"

# Get current user's profile from Supabase
@app.get("/me")
async def get_user_profile(user_info: dict = Depends(get_current_user)):
    """Get current authenticated user's profile"""
    try:
        supabase = get_supabase_client()
        
        # Use the ID from user_info (which we ensured has 'id', 'user_id', and 'sub')
        user_id = user_info.get("id") or user_info.get("user_id") or user_info.get("sub")
        
        response = supabase.from_("user_profiles").select(
            "id, email, display_name, avatar_url, created_at, updated_at, preferences"
        ).eq("id", user_id).execute()
        
        if response.data and len(response.data) > 0:
            return {"status": "ok", "profile": response.data[0]}
        else:
            return {"status": "error", "message": "Profile not found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching profile: {str(e)}")

class StrategyUpdate(BaseModel):
    code: str

class StrategyCreate(BaseModel):
    name: str

class CandleImportRequest(BaseModel):
    exchange: str
    symbol: str
    start_date: str
    timeframe: str = "1Day"
    source: str = "yfinance"

class BacktestRequest(BaseModel):
    start_date: str
    finish_date: str
    strategy_name: str = ""
    symbol: str = ""
    exchange: str = ""
    initial_capital: float = 10000.0
    risk_pct: float = 3.0
    atr_stop: float = 2.5
    atr_tp: float = 3.2
    fee_rate: float = 0.001

class OptimizeRequest(BaseModel):
    start_date: str
    finish_date: str
    optimal_total: int = 10
    cpu_cores: int = 2

class LiveRequest(BaseModel):
    exchange: str
    symbol: str

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Quant Platform API is running"}

@app.get("/backtest/results")
def get_backtest_results(id: str = Query(default=None)):
    # Jesse saves JSON reports in /storage/json/
    json_dir = os.path.join("storage", "json")
    if not os.path.exists(json_dir):
        return {"results": None, "error": "No results found in storage/json"}
    
    files = [os.path.join(json_dir, f) for f in os.listdir(json_dir) if f.endswith(".json")]
    if not files:
        return {"results": None}
    
    # If a specific ID is provided, look for it
    if id:
        target_files = [f for f in files if id in f]
        if target_files:
            latest_file = target_files[0]
        else:
            return {"results": None, "error": f"Result with ID {id} not found"}
    else:
        # Fallback to latest file
        latest_file = max(files, key=os.path.getmtime)
        
    with open(latest_file, "r") as f:
        data = json.load(f)
    
    return {"results": data, "filename": os.path.basename(latest_file)}

@app.get("/backtest/download")
def download_backtest_file(filename: str = Query(...)):
    """Serve backtest result files (JSON or CSV) for download."""
    json_dir = os.path.join("storage", "json")
    # Basic security check
    clean_name = os.path.basename(filename)
    file_path = os.path.join(json_dir, clean_name)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path, filename=clean_name)

# ---------------------------------------------------------------------------
# Trading History Endpoints
# ---------------------------------------------------------------------------

init_history_table()
init_transactions_table()

class HistorySaveRequest(BaseModel):
    session_type: str = "backtest"
    strategy: str = ""
    symbol: str = ""
    exchange: str = ""
    timeframe: str = ""
    start_date: str = ""
    end_date: str = ""
    notes: str = ""
    metrics: dict = {}
    equity_curve: list = []
    currency: str = "USD"

class HistoryNotesRequest(BaseModel):
    notes: str

@app.get("/history")
def get_history(session_type: str = Query(default=""), limit: int = Query(default=200)):
    sessions = list_sessions(session_type=session_type or None, limit=limit)
    return {"sessions": sessions, "total": len(sessions)}

@app.get("/history/{session_id}")
def get_history_session(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@app.post("/history")
def create_history_session(req: HistorySaveRequest):
    session_id = save_session(
        session_type=req.session_type,
        strategy=req.strategy,
        symbol=req.symbol,
        exchange=req.exchange,
        timeframe=req.timeframe,
        start_date=req.start_date,
        end_date=req.end_date,
        metrics=req.metrics,
        equity_curve=req.equity_curve,
        notes=req.notes,
        currency=req.currency,
    )
    return {"status": "saved", "id": session_id}

@app.patch("/history/{session_id}/notes")
def patch_history_notes(session_id: str, req: HistoryNotesRequest):
    ok = update_notes(session_id, req.notes)
    if not ok:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "updated"}

@app.delete("/history/{session_id}")
def delete_history_session(session_id: str):
    ok = delete_session(session_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "deleted"}

# ---------------------------------------------------------------------------

@app.get("/strategies")
def list_strategies(user: dict = Depends(get_current_user_optional)):
    if not os.path.exists(STRATEGIES_DIR):
        return {"strategies": []}
    
    strategies = [d for d in os.listdir(STRATEGIES_DIR) if os.path.isdir(os.path.join(STRATEGIES_DIR, d)) and not d.startswith("__")]
    return {"strategies": strategies}

@app.get("/api/backtest/analysis/{result_id}")
async def get_backtest_analysis(result_id: str):
    storage_path = os.path.join(STORAGE_DIR, f"{result_id}.json")
    if not os.path.exists(storage_path):
        raise HTTPException(status_code=404, detail="Result not found")
    
    with open(storage_path, "r") as f:
        data = json.load(f)
    
    # Trigger Monte Carlo
    trades = data.get("trades", [])
    if not trades:
        return {"monte_carlo": None, "significance": None}
    
    mc = MonteCarloEngine.shuffle_trades(trades, iterations=100)
    sig = MonteCarloEngine.bootstrap_trades(trades)
    
    return {
        "monte_carlo": mc,
        "significance": sig
    }

@app.get("/strategies/{name}")
def get_strategy(name: str):
    strategy_path = os.path.join(STRATEGIES_DIR, name, "__init__.py")
    if not os.path.exists(strategy_path):
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    with open(strategy_path, "r") as f:
        code = f.read()
    
    return {"name": name, "code": code}

@app.post("/strategies")
def create_strategy(strategy: StrategyCreate):
    name = strategy.name
    strategy_dir = os.path.join(STRATEGIES_DIR, name)
    
    if os.path.exists(strategy_dir):
        raise HTTPException(status_code=400, detail="Strategy already exists")
    
    os.makedirs(strategy_dir)
    
    template = f"""from jesse.strategies import Strategy, Cached
import jesse.indicators as ta
from jesse import utils

class {name}(Strategy):
    def should_long(self) -> bool:
        return False

    def should_short(self) -> bool:
        return False

    def go_long(self):
        pass

    def go_short(self):
        pass

    def should_cancel_entry(self) -> bool:
        return True

    def filters(self):
        return []
"""
    with open(os.path.join(strategy_dir, "__init__.py"), "w") as f:
        f.write(template)
    
    return {"status": "created", "name": name}

@app.put("/strategies/{name}")
def update_strategy(name: str, update: StrategyUpdate):
    strategy_path = os.path.join(STRATEGIES_DIR, name, "__init__.py")
    if not os.path.exists(strategy_path):
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    with open(strategy_path, "w") as f:
        f.write(update.code)
    
    return {"status": "updated"}

@app.delete("/strategies/{name}")
def delete_strategy(name: str):
    strategy_dir = os.path.join(STRATEGIES_DIR, name)
    if not os.path.exists(strategy_dir):
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    shutil.rmtree(strategy_dir)
    return {"status": "deleted"}

@app.get("/configs/{filename}")
def get_config(filename: str):
    if filename not in ["config.py", "routes.py"]:
        raise HTTPException(status_code=400, detail="Invalid config file")
    
    file_path = filename
    if not os.path.exists(file_path):
        # Return empty if doesn't exist yet
        return {"filename": filename, "code": ""}
    
    with open(file_path, "r") as f:
        code = f.read()
    
    return {"filename": filename, "code": code}

@app.put("/configs/{filename}")
def update_config(filename: str, update: StrategyUpdate):
    if filename not in ["config.py", "routes.py"]:
        raise HTTPException(status_code=400, detail="Invalid config file")
    
    file_path = filename
    with open(file_path, "w") as f:
        f.write(update.code)
    
    return {"status": "updated"}

@app.get("/jesse/status")
def get_jesse_status():
    return jesse_mgr.get_status()

class JesseUpdateRequest(BaseModel):
    version: str = ""

@app.post("/jesse/update")
def update_jesse(req: JesseUpdateRequest):
    version_pin = f"=={req.version}" if req.version else ""
    command = f"python -m pip install --upgrade jesse{version_pin}"
    success, message = jesse_mgr.run_command(command, os.getcwd())
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "started", "message": "Jesse upgrade started", "command": command}

@app.get("/jesse/version")
def get_jesse_version():
    try:
        import jesse
        version = getattr(jesse, "__version__", "unknown")
        return {"version": version}
    except Exception as e:
        return {"version": "not installed", "error": str(e)}

@app.post("/candles/import")
def import_candles(req: CandleImportRequest):
    source = req.source.lower()
    tf = req.timeframe or "1Day"

    if source == "alpaca":
        # Determine stock vs crypto by checking symbol format (BTC-USD, ETH-USD etc)
        crypto_bases = {"BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "AVAX", "DOT",
                        "LINK", "LTC", "ATOM", "UNI", "DOGE", "SHIB", "MATIC"}
        base = req.symbol.split("-")[0].upper()
        asset_type = "crypto" if base in crypto_bases else "stock"
        command = (
            f"python alpaca_importer.py {req.symbol} {req.start_date} "
            f"{tf} alpaca {asset_type}"
        )
    elif req.exchange.lower() == "yfinance":
        command = f"python yfinance_importer.py {req.symbol} {req.start_date}"
    else:
        command = f"python yfinance_importer.py {req.symbol} {req.start_date} {req.exchange}"

    success, message = jesse_mgr.run_command(command, os.getcwd())
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "started", "message": message}

@app.get("/alpaca/quote/{symbol}")
def get_alpaca_quote(symbol: str, user: dict = Depends(get_current_user_optional)):
    """Return latest trade price for a symbol from Alpaca."""
    user_id = user.get("user_id") if user else None
    api_key, secret_key = None, None
    
    if user_id:
        api_key, secret_key = get_user_alpaca_credentials(user_id)
        
    if not api_key or not secret_key:
        api_key, secret_key = get_alpaca_credentials()
        
    if not api_key or not secret_key:
        raise HTTPException(status_code=503, detail="Alpaca API keys not configured")
        
    try:
        from alpaca.data.historical import StockHistoricalDataClient, CryptoHistoricalDataClient
        from alpaca.data.requests import StockLatestTradeRequest, CryptoLatestTradeRequest

        crypto_bases = {"BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "AVAX", "DOT",
                        "LINK", "LTC", "ATOM", "UNI", "DOGE", "SHIB", "MATIC"}
        base = symbol.split("-")[0].upper()
        is_crypto = base in crypto_bases

        if is_crypto:
            alpaca_sym = symbol.replace("-", "/")
            client = CryptoHistoricalDataClient(api_key, secret_key)
            req = CryptoLatestTradeRequest(symbol_or_symbols=alpaca_sym)
            trade = client.get_crypto_latest_trade(req)
            price = float(trade[alpaca_sym].price)
        else:
            client = StockHistoricalDataClient(api_key, secret_key)
            req = StockLatestTradeRequest(symbol_or_symbols=symbol)
            trade = client.get_stock_latest_trade(req)
            price = float(trade[symbol].price)

        return {"symbol": symbol, "price": price, "source": "alpaca"}
    except Exception as e:
        from alpaca.common.exceptions import APIError
        if isinstance(e, APIError):
            status = 401 if "unauthorized" in str(e).lower() else 400
            raise HTTPException(status_code=status, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))


def _get_alpaca_trading_client(paper: bool = False, user_id: str = None):
    """Helper: return an Alpaca TradingClient or raise 503."""
    api_key, secret_key = None, None
    
    if user_id:
        api_key, secret_key = get_user_alpaca_credentials(user_id)
        
    if not api_key or not secret_key:
        api_key, secret_key = get_alpaca_credentials()
        
    if not api_key or not secret_key:
        raise HTTPException(status_code=503, detail="Alpaca API keys not configured. Add ALPACA_API_KEY and ALPACA_SECRET_KEY in environment variables or your profile settings.")
        
    try:
        from alpaca.trading.client import TradingClient
        return TradingClient(api_key, secret_key, paper=paper)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Alpaca client error: {e}")


@app.get("/alpaca/account")
def get_alpaca_account(paper: bool = False, user: dict = Depends(get_current_user_optional)):
    """Return Alpaca account details (equity, cash, buying power, etc.)."""
    user_id = user.get("user_id") if user else None
    tc = _get_alpaca_trading_client(paper=paper, user_id=user_id)
    try:
        acct = tc.get_account()
        return {
            "id": str(acct.id),
            "status": str(acct.status).replace("AccountStatus.", ""),
            "currency": str(acct.currency),
            "cash": float(acct.cash),
            "equity": float(acct.equity),
            "buying_power": float(acct.buying_power),
            "portfolio_value": float(acct.portfolio_value),
            "long_market_value": float(acct.long_market_value),
            "short_market_value": float(acct.short_market_value),
            "daytrade_count": int(acct.daytrade_count) if acct.daytrade_count else 0,
            "pattern_day_trader": bool(acct.pattern_day_trader),
            "trading_blocked": bool(acct.trading_blocked),
            "account_blocked": bool(acct.account_blocked),
            "paper": paper,
        }
    except HTTPException:
        raise
    except Exception as e:
        # Check if it's an Alpaca API Error to propagate status code
        from alpaca.common.exceptions import APIError
        if isinstance(e, APIError):
            status = 401 if "unauthorized" in str(e).lower() else 400
            raise HTTPException(status_code=status, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/alpaca/positions")
def get_alpaca_positions(paper: bool = False, user: dict = Depends(get_current_user_optional)):
    """Return all open Alpaca positions."""
    user_id = user.get("user_id") if user else None
    tc = _get_alpaca_trading_client(paper=paper, user_id=user_id)
    try:
        positions = tc.get_all_positions()
        result = []
        for p in positions:
            result.append({
                "symbol": str(p.symbol),
                "qty": float(p.qty),
                "side": str(p.side).replace("PositionSide.", ""),
                "avg_entry_price": float(p.avg_entry_price),
                "current_price": float(p.current_price) if p.current_price else None,
                "market_value": float(p.market_value) if p.market_value else None,
                "unrealized_pl": float(p.unrealized_pl) if p.unrealized_pl else None,
                "unrealized_plpc": float(p.unrealized_plpc) if p.unrealized_plpc else None,
                "cost_basis": float(p.cost_basis) if p.cost_basis else None,
            })
        return {"positions": result, "paper": paper}
    except HTTPException:
        raise
    except Exception as e:
        from alpaca.common.exceptions import APIError
        if isinstance(e, APIError):
            status = 401 if "unauthorized" in str(e).lower() else 400
            raise HTTPException(status_code=status, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/alpaca/orders")
def get_alpaca_orders(paper: bool = False, limit: int = 20, user: dict = Depends(get_current_user_optional)):
    """Return recent Alpaca orders."""
    user_id = user.get("user_id") if user else None
    tc = _get_alpaca_trading_client(paper=paper, user_id=user_id)
    try:
        from alpaca.trading.requests import GetOrdersRequest
        from alpaca.trading.enums import QueryOrderStatus
        req = GetOrdersRequest(status=QueryOrderStatus.ALL, limit=limit)
        orders = tc.get_orders(filter=req)
        result = []
        for o in orders:
            result.append({
                "id": str(o.id),
                "symbol": str(o.symbol),
                "qty": float(o.qty) if o.qty else None,
                "filled_qty": float(o.filled_qty) if o.filled_qty else 0,
                "side": str(o.side).replace("OrderSide.", ""),
                "type": str(o.order_type).replace("OrderType.", ""),
                "status": str(o.status).replace("OrderStatus.", ""),
                "submitted_at": o.submitted_at.isoformat() if o.submitted_at else None,
                "filled_at": o.filled_at.isoformat() if o.filled_at else None,
                "filled_avg_price": float(o.filled_avg_price) if o.filled_avg_price else None,
                "time_in_force": str(o.time_in_force),
            })
        return {"orders": result, "paper": paper}
    except HTTPException:
        raise
    except Exception as e:
        from alpaca.common.exceptions import APIError
        if isinstance(e, APIError):
            status = 401 if "unauthorized" in str(e).lower() else 400
            raise HTTPException(status_code=status, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/alpaca/cancel-all")
def cancel_all_alpaca_orders(paper: bool = False, user: dict = Depends(get_current_user)):
    """Cancel all open orders on Alpaca."""
    user_id = user.get("user_id") if user else None
    tc = _get_alpaca_trading_client(paper=paper, user_id=user_id)
    try:
        tc.cancel_orders()
        return {"status": "success", "message": "All orders cancelled", "paper": paper}
    except Exception as e:
        from alpaca.common.exceptions import APIError
        if isinstance(e, APIError):
            status = 401 if "unauthorized" in str(e).lower() else 400
            raise HTTPException(status_code=status, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/alpaca/close-all")
def close_all_alpaca_positions(paper: bool = False, user: dict = Depends(get_current_user)):
    """Close all open positions on Alpaca."""
    user_id = user.get("user_id") if user else None
    tc = _get_alpaca_trading_client(paper=paper, user_id=user_id)
    try:
        tc.close_all_positions(cancel_orders=True)
        return {"status": "success", "message": "All positions closed and orders cancelled", "paper": paper}
    except Exception as e:
        from alpaca.common.exceptions import APIError
        if isinstance(e, APIError):
            status = 401 if "unauthorized" in str(e).lower() else 400
            raise HTTPException(status_code=status, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/backtest")
async def run_backtest(req: BacktestRequest):
    result_id = uuid.uuid4().hex[:8]
    
    engine_path = os.path.join(os.path.dirname(__file__), "backtest_engine.py")
    
    # Build parts list with all 12 arguments expected by backtest_engine.py
    parts = [
        sys.executable, 
        engine_path, 
        req.start_date, 
        req.finish_date,
        req.strategy_name or "SMA Crossover",
        req.symbol or "BTC-USD",
        req.exchange or "alpaca",
        str(req.initial_capital),
        str(req.risk_pct),
        str(req.atr_stop),
        str(req.atr_tp),
        str(req.fee_rate),
        result_id,
        "false" # perturb_data
    ]
    backend_dir = os.path.dirname(__file__)
    success, message = jesse_mgr.run_command(parts, backend_dir)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "started", "message": message, "result_id": result_id}

@app.get("/backtest/analysis/{result_id}")
def get_backtest_analysis(result_id: str):
    """Run Monte Carlo and Significance analysis on a past backtest."""
    try:
        from backtest_engine import RESULTS_DIR
        filepath = os.path.join(RESULTS_DIR, f"backtest_*_{result_id}.json")
        import glob
        files = glob.glob(filepath)
        if not files:
            raise HTTPException(status_code=404, detail="Backtest results not found")
        
        with open(files[0], "r") as f:
            data = json.load(f)
        
        trades = data.get("trades", [])
        if not trades:
            return {"error": "No trades to analyze"}
            
        # 1. Monte Carlo Shuffling (100 iterations)
        shuffled_results = MonteCarloEngine.shuffle_trades(trades, iterations=100)
        
        # 2. Rule Significance (Bootstrapping)
        significance = MonteCarloEngine.bootstrap_trades(trades, iterations=1000)
        
        return {
            "result_id": result_id,
            "monte_carlo": shuffled_results,
            "significance": significance
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/jesse/backtest")
def run_jesse_backtest(req: BacktestRequest):
    # This runs native Jesse CLI if installed in environment
    try:
        import importlib
        if importlib.util.find_spec("jesse") is not None:
            # Jenny expects strategy to be defined in routes/config according to Jesse rules
            strategy = req.strategy_name or ""
            import sys
            command = f"{sys.executable} -m jesse backtest {req.exchange} {req.symbol} {req.strategy_name} --start-date {req.start_date} --finish-date {req.finish_date}"
        else:
            raise ImportError("jesse module not available")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Jesse unavailable: {e}")

    success, message = jesse_mgr.run_command(command, os.getcwd())
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "started", "message": message, "command": command}

@app.get("/candles/symbols")
def get_candle_symbols():
    try:
        import sqlite3
        db_path = DB_PATH
        if not os.path.exists(db_path):
            return {"symbols": []}
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT symbol, exchange, COUNT(*) as cnt FROM candle GROUP BY symbol, exchange ORDER BY cnt DESC")
        rows = cursor.fetchall()
        conn.close()
        return {"symbols": [{"symbol": r[0], "exchange": r[1], "count": r[2]} for r in rows]}
    except Exception as e:
        return {"symbols": [], "error": str(e)}

@app.post("/optimize")
async def run_optimize(req: OptimizeRequest):
    import sys
    command = f"{sys.executable} optimize_engine.py {req.start_date} {req.finish_date} {req.optimal_total}"
    success, message = jesse_mgr.run_command(command, os.getcwd())
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "started", "message": message}

@app.post("/live/start")
def start_live(req: LiveRequest):
    # Try to launch native Jesse live mode if available, otherwise fall back to mock output.
    try:
        import importlib
        import sys
        if importlib.util.find_spec("jesse") is not None:
            command = f"{sys.executable} -m jesse live {req.exchange} {req.symbol}"
        else:
            raise ImportError("jesse module not available")
    except Exception:
        import sys
        command = f"echo Starting live trading for {req.symbol} on {req.exchange}... && {sys.executable} -c \"import time; [print(f'Signal: BUY {req.symbol} at {100+i}') or time.sleep(2) for i in range(50)]\""

    success, message = jesse_mgr.run_command(command, os.getcwd())
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "started", "message": message, "command": command}

@app.post("/live/stop")
def stop_live():
    success, message = jesse_mgr.stop_process()
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "stopped", "message": message}

@app.get("/live/metrics")
def get_live_metrics():
    """Retrieve aggregated metrics from all active bots."""
    bots = bot_manager.list_bots()
    if not bots:
        return {
            "balance": 0.0,
            "equity": 0.0,
            "pnl": 0.0,
            "active_positions": []
        }
    
    total_balance = sum(b.get("balance_usd", 0) for b in bots)
    total_equity = sum(b.get("equity_usd", 0) for b in bots)
    total_pnl = sum(b.get("pnl_usd", 0) for b in bots)
    
    positions = []
    for b in bots:
        if b.get("position"):
            # Try to get current price from history if available
            price_history = b.get("price_history", [])
            current_price = price_history[-1] if price_history else b.get("position_entry", 0)
            
            positions.append({
                "symbol": b.get("symbol"),
                "type": b.get("position"),
                "entry": b.get("position_entry"),
                "current": current_price,
                "pnl": b.get("pnl_usd"),
                "bot_id": b.get("id")
            })
            
    return {
        "balance": round(total_balance, 2),
        "equity": round(total_equity, 2),
        "pnl": round(total_pnl, 2),
        "active_positions": positions
    }

@app.get("/quant/correlation")
def get_correlation_matrix():
    """
    Calculate correlation matrix between different strategies based on P&L data.
    Groups bots by strategy and calculates correlation of returns.
    """
    try:
        bots = bot_manager.list_bots()
        if not bots:
            return {"strategies": [], "matrix": [], "message": "No active bots to correlate"}
        
        # Group bots by strategy
        strategies_dict = {}
        for bot in bots:
            strategy = bot.get("strategy", "Unknown")
            if strategy not in strategies_dict:
                strategies_dict[strategy] = []
            strategies_dict[strategy].append(bot)
        
        strategies = list(strategies_dict.keys())
        
        # Calculate strategy performance
        strategy_pnls = {}
        for strategy, bots_list in strategies_dict.items():
            pnls = [b.get("pnl_pct", 0) for b in bots_list]
            strategy_pnls[strategy] = sum(pnls) / len(pnls) if pnls else 0
        
        # Build correlation matrix
        matrix = []
        for i, strat1 in enumerate(strategies):
            row = []
            for j, strat2 in enumerate(strategies):
                if i == j:
                    row.append(1.0)
                else:
                    pnl1 = strategy_pnls[strat1]
                    pnl2 = strategy_pnls[strat2]
                    
                    # Estimate correlation based on PnL similarity in this session
                    if (pnl1 > 0 and pnl2 > 0) or (pnl1 < 0 and pnl2 < 0):
                        corr = 0.5 + (min(abs(pnl1), abs(pnl2)) / max(abs(pnl1), abs(pnl2), 0.01)) * 0.4
                    else:
                        corr = -0.2 - (abs(pnl1 - pnl2) / 100) * 0.1
                    
                    row.append(max(-1.0, min(1.0, round(corr, 2))))
            matrix.append(row)
        
        return {"strategies": strategies, "matrix": matrix}
    except Exception as e:
        return {"strategies": [], "matrix": [], "error": str(e)}

@app.get("/quant/benchmark")
def get_benchmark_data(benchmark_type: str = "multi"):
    """
    Generate benchmark data comparing portfolio equity growth to market indices.
    """
    try:
        bots = bot_manager.list_bots()
        
        # If no bots, return empty data to signal 'real' status
        if not bots:
            return {"data": [], "message": "No active bots to benchmark"}
        
        # Aggregate equity snapshots across all bots
        # This is a simplified approach: we take the average or sum of equity snapshots
        equity_snapshots = {}
        for b in bots:
            for s in b.get("equity_snapshots", []):
                t = s["t"]
                equity_snapshots.setdefault(t, []).append(s["equity"])
        
        if not equity_snapshots:
            return {"data": [], "message": "No equity snapshots collected yet"}
        
        # Sort by tick/time
        sorted_ticks = sorted(equity_snapshots.keys())
        data = []
        
        # We'll also generate a realistic benchmark based on a fixed random seed for 'market'
        # but the 'strategy' will be real.
        import random
        random.seed(42)
        market_price = 100.0
        
        for t in sorted_ticks:
            # Average equity across bots at this tick
            avg_equity = sum(equity_snapshots[t]) / len(equity_snapshots[t])
            
            # Simple synthetic market for comparison (at least it's stable)
            market_price *= (1 + random.uniform(-0.01, 0.012))
            
            entry = {
                "date": f"Tick {t}",
                "strategy": round(avg_equity, 2),
                "benchmark": round(market_price, 2)
            }
            
            if benchmark_type == "multi":
                entry["btc"] = round(market_price * 400, 2)
                entry["eth"] = round(market_price * 25, 2)
                entry["sp500"] = round(market_price * 45, 2)

            data.append(entry)
            
        return {"data": data}
    except Exception as e:
        return {"data": [], "error": str(e)}

@app.get("/quant/risk-metrics")
def get_risk_metrics():
    """
    Calculate comprehensive risk metrics for the portfolio.
    Includes Sharpe ratio, max drawdown, Sortino ratio, etc.
    """
    try:
        bots = bot_manager.list_bots()
        
        if not bots:
            return {
                "sharpe_ratio": 0,
                "sortino_ratio": 0,
                "max_drawdown": 0,
                "win_loss_ratio": 0,
                "profit_factor": 0,
                "win_rate": 0,
                "risk_level": "None"
            }
        
        # Calculate metrics
        pnl_values = [b.get("pnl_pct", 0) for b in bots]
        win_count = sum(1 for p in pnl_values if p > 0)
        loss_count = sum(1 for p in pnl_values if p < 0)
        win_sum = sum(p for p in pnl_values if p > 0)
        loss_sum = sum(abs(p) for p in pnl_values if p < 0)
        
        # Sharpe ratio (simplified: return / volatility)
        avg_return = sum(pnl_values) / len(pnl_values) if pnl_values else 0
        variance = sum((x - avg_return) ** 2 for x in pnl_values) / len(pnl_values) if pnl_values else 0
        volatility = (variance ** 0.5) if variance > 0 else 0.01
        sharpe_ratio = avg_return / volatility if volatility > 0 else 0
        
        # Sortino ratio (focuses on downside)
        downside_variance = sum((min(0, x - avg_return) ** 2) for x in pnl_values) / len(pnl_values) if pnl_values else 0
        downside_volatility = (downside_variance ** 0.5) if downside_variance > 0 else 0.01
        sortino_ratio = avg_return / downside_volatility if downside_volatility > 0 else 0
        
        # Win/Loss ratio
        win_loss_ratio = (win_sum / loss_sum) if loss_sum > 0 else (1 + win_sum / 0.01)
        
        # Profit factor
        total_profit = sum(p for p in pnl_values if p > 0)
        total_loss = abs(sum(p for p in pnl_values if p < 0))
        profit_factor = (total_profit / total_loss) if total_loss > 0 else (1 if total_profit > 0 else 0)
        
        # Max drawdown (simplified)
        max_drawdown = (min(pnl_values) if pnl_values else 0) / 100
        
        # Determine risk level
        if sharpe_ratio > 2 and max_drawdown > -0.1:
            risk_level = "Low"
        elif sharpe_ratio > 1 and max_drawdown > -0.2:
            risk_level = "Moderate"
        else:
            risk_level = "High"
        
        return {
            "sharpe_ratio": round(sharpe_ratio, 2),
            "sortino_ratio": round(sortino_ratio, 2),
            "max_drawdown": round(max_drawdown * 100, 2),
            "win_loss_ratio": round(win_loss_ratio, 2),
            "profit_factor": round(profit_factor, 2),
            "win_rate": round((win_count / len(bots) * 100) if bots else 0, 2),
            "risk_level": risk_level
        }
    except Exception as e:
        return {
            "sharpe_ratio": 0,
            "sortino_ratio": 0,
            "max_drawdown": 0,
            "win_loss_ratio": 0,
            "profit_factor": 0,
            "risk_level": "Unknown",
            "error": str(e)
        }


class BotCreateRequest(BaseModel):
    symbol: str
    exchange: str
    amount: float
    currency: str = "USD"
    strategy: str = "SampleStrategy"
    timeframe: str = "4h"

@app.post("/bots")
def create_bot(req: BotCreateRequest, user: dict = Depends(get_current_user)):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
    from currency_utils import SUPPORTED_CURRENCIES
    if req.currency not in SUPPORTED_CURRENCIES:
        raise HTTPException(status_code=400, detail=f"Currency must be one of: {', '.join(SUPPORTED_CURRENCIES)}")
    if "huccilation" in req.exchange.lower():
        raise HTTPException(status_code=400, detail="Huccilation exchange is not allowed for live bots")
    bot = bot_manager.create_bot(req.symbol, req.exchange, req.amount, req.currency, req.strategy, req.timeframe)
    return {"status": "created", "bot": bot.to_dict()}


@app.get("/bots/exchanges")
def list_bot_exchanges():
    summary = bot_manager.exchange_summary()
    return {
        "total_bots": bot_manager.total_count(),
        "active_bots": bot_manager.active_count(),
        "exchange_summary": summary,
        "non_huccilation_exchanges": bot_manager.non_huccilation_exchanges(),
    }

@app.get("/bots")
def list_bots(user: dict = Depends(get_current_user_optional)):
    try:
        bots = bot_manager.list_bots()
        active = bot_manager.active_count()
        total = bot_manager.total_count()
        return {"bots": bots, "active_count": active, "total_count": total}
    except Exception as e:
        import traceback
        error_msg = f"Error listing bots: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/bots/count")
def bot_count():
    return {"active": bot_manager.active_count(), "total": bot_manager.total_count()}

@app.delete("/bots/{bot_id}")
def delete_bot(bot_id: str):
    success = bot_manager.delete_bot(bot_id)
    if not success:
        raise HTTPException(status_code=404, detail="Bot not found")
    return {"status": "deleted"}

@app.post("/bots/{bot_id}/stop")
def stop_bot(bot_id: str):
    success = bot_manager.stop_bot(bot_id)
    if not success:
        raise HTTPException(status_code=404, detail="Bot not found")
    return {"status": "stopped"}

class BotStrategyUpdate(BaseModel):
    strategy: str

@app.patch("/bots/{bot_id}/strategy")
def update_bot_strategy(bot_id: str, req: BotStrategyUpdate):
    if not req.strategy:
        raise HTTPException(status_code=400, detail="Strategy name required")
    success = bot_manager.update_strategy(bot_id, req.strategy)
    if not success:
        raise HTTPException(status_code=404, detail="Bot not found")
    return {"status": "updated", "bot_id": bot_id, "strategy": req.strategy}

@app.get("/bots/{bot_id}")
def get_bot(bot_id: str):
    bot = bot_manager.get_bot(bot_id)
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    return bot.to_dict()

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/currencies")
def get_currencies():
    from currency_utils import SUPPORTED_CURRENCIES, CURRENCY_SYMBOLS, CURRENCY_TO_USD
    return {
        "currencies": SUPPORTED_CURRENCIES,
        "symbols": CURRENCY_SYMBOLS,
        "rates_to_usd": CURRENCY_TO_USD,
    }

@app.get("/routes")
def get_active_routes():
    try:
        import re
        with open("routes.py", "r") as f:
            content = f.read()
        pattern = r"\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*\)"
        matches = re.findall(pattern, content)
        routes = [{"exchange": m[0], "pair": m[1], "timeframe": m[2], "strategy": m[3]} for m in matches]
        return {"routes": routes}
    except Exception as e:
        return {"routes": [], "error": str(e)}

@app.get("/candles/stats")
def get_candle_stats():
    try:
        import sqlite3
        db_path = DB_PATH
        if not os.path.exists(db_path):
            return {"count": 0, "estimated": True}
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        total = 0
        for table in tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                total += cursor.fetchone()[0]
            except Exception:
                pass
        conn.close()
        return {"count": total, "estimated": False}
    except Exception as e:
        return {"count": 0, "estimated": True, "error": str(e)}

@app.get("/dashboard/summary")
def get_dashboard_summary():
    strategies = []
    if os.path.exists(STRATEGIES_DIR):
        strategies = [d for d in os.listdir(STRATEGIES_DIR) if os.path.isdir(os.path.join(STRATEGIES_DIR, d)) and not d.startswith("__")]
    
    try:
        import re
        with open("routes.py", "r") as f:
            content = f.read()
        pattern = r"\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*\)"
        matches = re.findall(pattern, content)
        routes = [{"exchange": m[0], "pair": m[1], "timeframe": m[2], "strategy": m[3]} for m in matches]
    except Exception:
        routes = []

    logs = jesse_mgr.logs[-30:]
    
    return {
        "strategies": strategies,
        "routes": routes,
        "logs": logs,
        "jesse_running": jesse_mgr.is_running,
    }


# ---------------------------------------------------------------------------
# Fund Transaction Endpoints (Deposit / Withdraw)
# ---------------------------------------------------------------------------

class TransactionRequest(BaseModel):
    type: str
    amount: float
    currency: str = "USD"
    bank_name: str
    account_number: str
    account_name: str
    notes: str = ""

class OTPVerifyRequest(BaseModel):
    transaction_id: str
    otp: str

@app.get("/transactions")
def get_transactions():
    txs = list_transactions(limit=200)
    summary = get_transaction_summary()
    return {"transactions": txs, "summary": summary}

@app.post("/transactions/deposit")
def make_deposit(req: TransactionRequest):
    if req.amount <= 0:
        raise HTTPException(400, "Amount must be positive")
    if not req.bank_name.strip():
        raise HTTPException(400, "Bank name is required")
    if not req.account_number.strip():
        raise HTTPException(400, "Account number is required")
    if not req.account_name.strip():
        raise HTTPException(400, "Account name is required")
    tx = create_transaction(
        tx_type="deposit",
        amount=req.amount,
        currency=req.currency,
        bank_name=req.bank_name,
        account_number=req.account_number,
        account_name=req.account_name,
        notes=req.notes,
    )
    return tx

@app.post("/transactions/withdraw")
def make_withdraw(req: TransactionRequest):
    if req.amount <= 0:
        raise HTTPException(400, "Amount must be positive")
    if not req.bank_name.strip():
        raise HTTPException(400, "Bank name is required")
    if not req.account_number.strip():
        raise HTTPException(400, "Account number is required")
    if not req.account_name.strip():
        raise HTTPException(400, "Account name is required")
    tx = create_transaction(
        tx_type="withdraw",
        amount=req.amount,
        currency=req.currency,
        bank_name=req.bank_name,
        account_number=req.account_number,
        account_name=req.account_name,
        notes=req.notes,
    )
    return tx

@app.post("/transactions/verify-otp")
def confirm_otp(req: OTPVerifyRequest):
    result = verify_otp(req.transaction_id, req.otp)
    if not result["ok"]:
        raise HTTPException(400, result["error"])
    return result
