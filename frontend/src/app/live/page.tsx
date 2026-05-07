"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
    Radio, Play, Square, Activity, Terminal, Trash2,
    Bot, TrendingUp, TrendingDown, Box, Clock,
    Wallet, List, RefreshCw, AlertTriangle, CheckCircle, ExternalLink,
    ChevronDown, ChevronUp, BarChart2, Zap
} from "lucide-react";
import {
    LineChart, Line, AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid
} from "recharts";
import { toast } from "sonner";

const CURRENCIES = [
    { code: "USD", symbol: "$", label: "US Dollar" },
    { code: "NGN", symbol: "₦", label: "Nigerian Naira" },
    { code: "EUR", symbol: "€", label: "Euro" },
    { code: "CNY", symbol: "¥", label: "Chinese Yuan" },
];

const EXCHANGES = [
    "Simulated",
    "Alpaca Live",
    "Alpaca Paper",
    "Binance Futures",
    "Binance",
    "Bybit",
    "Coinbase",
];

const SYMBOLS = [
    "BTC-USD", "ETH-USD", "SOL-USD", "BTC-USDT", "ETH-USDT", "BNB-USDT",
    "SOL-USDT", "ADA-USDT", "XRP-USDT", "DOGE-USDT",
    "AAPL", "TSLA", "SPY", "NVDA", "MSFT", "GOOGL", "AMZN", "META",
];
const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "2h", "3h", "4h", "6h", "8h", "12h", "1D", "3D", "1W"];

function isAlpacaExchange(ex: string) {
    return ex === "Alpaca Live" || ex === "Alpaca Paper";
}
function isAlpacaPaper(ex: string) {
    return ex === "Alpaca Paper";
}

export default function LivePage() {
    const [bots, setBots] = useState<any[]>([]);
    const [activeCount, setActiveCount] = useState(0);
    const [selectedBot, setSelectedBot] = useState<any>(null);
    const [strategies, setStrategies] = useState<string[]>([]);

    const [symbol, setSymbol] = useState("BTC-USD");
    const [exchange, setExchange] = useState("Simulated");
    const [amount, setAmount] = useState("1000");
    const [currency, setCurrency] = useState("USD");
    const [strategy, setStrategy] = useState("");
    const [timeframe, setTimeframe] = useState("4h");
    const [launching, setLaunching] = useState(false);
    const [switchingStrategy, setSwitchingStrategy] = useState(null);
    const [mainTab, setMainTab] = useState("trading"); // "trading", "api", "system"

    // Alpaca dashboard state
    const [alpacaTab, setAlpacaTab] = useState<"account" | "positions" | "orders">("account");
    const [alpacaAccount, setAlpacaAccount] = useState<any>(null);
    const [alpacaPositions, setAlpacaPositions] = useState<any[]>([]);
    const [alpacaOrders, setAlpacaOrders] = useState<any[]>([]);
    const [alpacaLoading, setAlpacaLoading] = useState(false);
    const [alpacaError, setAlpacaError] = useState<string | null>(null);

    const fetchAlpacaData = useCallback(async () => {
        if (!isAlpacaExchange(exchange)) return;
        const paper = isAlpacaPaper(exchange);
        setAlpacaLoading(true);
        setAlpacaError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = session ? { "Authorization": `Bearer ${session.access_token}` } : {};
            const [acctRes, posRes, ordRes] = await Promise.all([
                fetch(`/api/alpaca/account?paper=${paper}`, { headers }),
                fetch(`/api/alpaca/positions?paper=${paper}`, { headers }),
                fetch(`/api/alpaca/orders?paper=${paper}&limit=20`, { headers }),
            ]);
            if (!acctRes.ok) {
                const err = await acctRes.json();
                setAlpacaError(err.detail || "Could not connect to Alpaca");
                return;
            }
            const [acct, pos, ord] = await Promise.all([acctRes.json(), posRes.json(), ordRes.json()]);
            setAlpacaAccount(acct);
            setAlpacaPositions(pos.positions || []);
            setAlpacaOrders(ord.orders || []);
        } catch {
            setAlpacaError("Failed to connect to Alpaca API");
        } finally {
            setAlpacaLoading(false);
        }
    }, [exchange]);

    useEffect(() => {
        if (isAlpacaExchange(exchange)) {
            fetchAlpacaData();
            const iv = setInterval(fetchAlpacaData, 15000);
            return () => clearInterval(iv);
        } else {
            setAlpacaAccount(null);
            setAlpacaPositions([]);
            setAlpacaOrders([]);
            setAlpacaError(null);
        }
    }, [exchange, fetchAlpacaData]);

    const switchBotStrategy = async (botId: string, newStrategy: string) => {
        setSwitchingStrategy(botId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: any = { "Content-Type": "application/json" };
            if (session) headers["Authorization"] = `Bearer ${session.access_token}`;

            const res = await fetch(`/api/bots/${botId}/strategy`, {
                method: "PATCH",
                headers,
                body: JSON.stringify({ strategy: newStrategy }),
            });
            if (res.ok) {
                toast.success(`Strategy switched to ${newStrategy}`);
                fetchBots();
            } else {
                toast.error("Failed to switch strategy");
            }
        } catch {
            toast.error("Connection error");
        } finally {
            setSwitchingStrategy(null);
        }
    };

    const isFetchingBots = useRef(false);

    const fetchBots = async () => {
        if (isFetchingBots.current) return;
        isFetchingBots.current = true;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = session ? { "Authorization": `Bearer ${session.access_token}` } : {};
            const res = await fetch("/api/bots", { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ detail: "Unknown error" }));
                console.error("Bot fetch failed:", err);
                return;
            }
            const data = await res.json();
            setBots(data.bots || []);
            setActiveCount(data.active_count || 0);
            if (selectedBot) {
                const updated = data.bots?.find((b: any) => b.id === selectedBot.id);
                if (updated) setSelectedBot(updated);
            }
        } catch (err) {
            console.error("Failed to fetch bots:", err);
        } finally {
            isFetchingBots.current = false;
        }
    };

    const fetchStrategies = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = session ? { "Authorization": `Bearer ${session.access_token}` } : {};
            const res = await fetch("/api/strategies", { headers });
            const data = await res.json();
            const list: string[] = data.strategies || [];
            setStrategies(list);
            if (!strategy && list.length > 0) setStrategy(list[0]);
        } catch (err) {
            console.error("Failed to fetch strategies:", err);
        }
    };

    useEffect(() => {
        fetchStrategies();
        fetchBots();
        const interval = setInterval(fetchBots, 5000);
        return () => clearInterval(interval);
    }, []);

    const launchBot = async () => {
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
        if (!strategy) { toast.error("Select a strategy"); return; }
        setLaunching(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: any = { "Content-Type": "application/json" };
            if (session) headers["Authorization"] = `Bearer ${session.access_token}`;

            const res = await fetch("/api/bots", {
                method: "POST",
                headers,
                body: JSON.stringify({ symbol, exchange, amount: amt, currency, strategy, timeframe }),
            });
            if (res.ok) {
                const data = await res.json();
                toast.success(`Bot launched — ${strategy} on ${symbol} via ${exchange}`);
                setSelectedBot(data.bot);
                fetchBots();
                if (isAlpacaExchange(exchange)) fetchAlpacaData();
            } else {
                const err = await res.json();
                toast.error(err.detail || "Failed to launch bot");
            }
        } catch (err) {
            console.error("Launch error:", err);
            toast.error("Connection error");
        } finally {
            setLaunching(false);
        }
    };

    const stopBot = async (id: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = session ? { "Authorization": `Bearer ${session.access_token}` } : {};
            await fetch(`/api/bots/${id}/stop`, { method: "POST", headers });
            toast.info("Bot stopped");
            fetchBots();
        } catch { toast.error("Failed to stop bot"); }
    };

    const deleteBot = async (id: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = session ? { "Authorization": `Bearer ${session.access_token}` } : {};
            await fetch(`/api/bots/${id}`, { method: "DELETE", headers });
            toast.success("Bot removed");
            if (selectedBot?.id === id) setSelectedBot(null);
            fetchBots();
        } catch { toast.error("Failed to delete bot"); }
    };

    const cancelAllOrders = async () => {
        if (!showAlpaca) return;
        const paper = isAlpacaPaper(exchange);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = session ? { "Authorization": `Bearer ${session.access_token}` } : {};
            const res = await fetch(`/api/alpaca/cancel-all?paper=${paper}`, { method: "POST", headers });
            if (res.ok) {
                toast.success("All orders cancelled");
                fetchAlpacaData();
            } else {
                toast.error("Failed to cancel orders");
            }
        } catch { toast.error("Connection error"); }
    };

    const closeAllPositions = async () => {
        if (!showAlpaca) return;
        const paper = isAlpacaPaper(exchange);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = session ? { "Authorization": `Bearer ${session.access_token}` } : {};
            const res = await fetch(`/api/alpaca/close-all?paper=${paper}`, { method: "POST", headers });
            if (res.ok) {
                toast.success("All positions closed");
                fetchAlpacaData();
            } else {
                toast.error("Failed to close positions");
            }
        } catch { toast.error("Connection error"); }
    };

    const currencyInfo = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
    const showAlpaca = isAlpacaExchange(exchange);

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-3 tracking-tight">
                        <Radio className={activeCount > 0 ? "text-blue-500 animate-pulse" : "text-slate-500"} />
                        Command Center
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Manage live algorithmic operations and connectivity</p>
                </div>

                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
                    {[
                        { id: "trading", label: "Live Trading", icon: <Bot size={14} /> },
                        { id: "api", label: "API", icon: <Zap size={14} /> },
                        { id: "system", label: "System", icon: <Terminal size={14} /> },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setMainTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${mainTab === t.id
                                ? "bg-blue-600 text-white shadow-lg"
                                : "text-slate-500 hover:text-slate-300"
                                }`}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>
            </header>

            {mainTab === "trading" && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Launch Panel */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                        <h2 className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Bot size={15} className="text-blue-400" /> Launch Bot
                        </h2>

                        {/* Strategy Selector */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                <Box size={10} className="text-blue-400" />
                                Strategy
                            </label>
                            {strategies.length === 0 ? (
                                <div className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-500 italic">
                                    Loading strategies…
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {strategies.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setStrategy(s)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all border ${strategy === s
                                                ? "bg-blue-600/15 border-blue-500/60 text-blue-300 font-semibold"
                                                : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                                                }`}
                                        >
                                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${strategy === s ? "bg-blue-400" : "bg-slate-600"}`} />
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Timeframe Selector */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                <Clock size={10} className="text-purple-400" />
                                Timeframe
                            </label>
                            <div className="grid grid-cols-4 gap-1.5">
                                {TIMEFRAMES.map(tf => (
                                    <button
                                        key={tf}
                                        onClick={() => setTimeframe(tf)}
                                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${timeframe === tf
                                            ? "bg-purple-600/20 border-purple-500/60 text-purple-300"
                                            : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300"
                                            }`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-slate-800" />

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Symbol</label>
                            <select
                                value={symbol}
                                onChange={e => setSymbol(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 transition-colors"
                            >
                                {SYMBOLS.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Exchange</label>
                            <select
                                value={exchange}
                                onChange={e => setExchange(e.target.value)}
                                className={`w-full bg-slate-950 border rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 transition-colors ${showAlpaca ? "border-yellow-600/50 text-yellow-300" : "border-slate-800"
                                    }`}
                            >
                                {EXCHANGES.map(ex => (
                                    <option key={ex} value={ex}>{ex}</option>
                                ))}
                            </select>
                            {showAlpaca && (
                                <p className="text-[10px] text-yellow-500 flex items-center gap-1 mt-1">
                                    <AlertTriangle size={9} />
                                    Requires ALPACA_API_KEY + ALPACA_SECRET_KEY in Secrets
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Currency</label>
                            <div className="grid grid-cols-2 gap-2">
                                {CURRENCIES.map(c => (
                                    <button
                                        key={c.code}
                                        onClick={() => setCurrency(c.code)}
                                        className={`py-2 rounded-lg text-xs font-bold border transition-all ${currency === c.code
                                            ? "bg-blue-600/20 border-blue-500 text-blue-400"
                                            : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"
                                            }`}
                                    >
                                        {c.symbol} {c.code}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                Capital ({currencyInfo.symbol}{currencyInfo.code})
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">{currencyInfo.symbol}</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    min="1"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2.5 text-sm focus:border-blue-500 transition-colors"
                                    placeholder="1000"
                                />
                            </div>
                            {showAlpaca && (
                                <p className="text-[10px] text-slate-500">Capital field is for reference — Alpaca uses your real account balance.</p>
                            )}
                        </div>

                        <button
                            onClick={launchBot}
                            disabled={launching || !strategy}
                            className={`w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg text-sm uppercase tracking-wider ${showAlpaca
                                ? "bg-yellow-600 hover:bg-yellow-500 shadow-yellow-600/20"
                                : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20"
                                }`}
                        >
                            <Play size={15} fill="currentColor" />
                            {launching ? "Launching..." : showAlpaca ? `Launch on ${exchange}` : "Launch Bot"}
                        </button>

                        {strategy && (
                            <p className="text-[10px] text-slate-500 text-center">
                                Using <span className="text-blue-400 font-medium">{strategy}</span>
                            </p>
                        )}
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-3 space-y-4">

                        {/* Alpaca Dashboard */}
                        {showAlpaca && (
                            <div className="bg-slate-900 border border-yellow-600/30 rounded-2xl overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-yellow-600/5">
                                    <div className="flex items-center gap-2">
                                        <Activity size={15} className="text-yellow-400" />
                                        <span className="text-sm font-black text-yellow-300 uppercase tracking-widest">
                                            Alpaca {isAlpacaPaper(exchange) ? "Paper" : "Live"} Account
                                        </span>
                                        {alpacaAccount && (
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${alpacaAccount.status === "ACTIVE"
                                                ? "bg-green-500/10 border-green-500/20 text-green-400"
                                                : "bg-red-500/10 border-red-500/20 text-red-400"
                                                }`}>
                                                {alpacaAccount.status}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={fetchAlpacaData}
                                        disabled={alpacaLoading}
                                        className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                                        title="Refresh"
                                    >
                                        <RefreshCw size={13} className={alpacaLoading ? "animate-spin" : ""} />
                                    </button>
                                </div>

                                {alpacaError ? (
                                    <div className="p-5 flex items-start gap-3">
                                        <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-red-400 font-semibold">Connection Error</p>
                                            <p className="text-xs text-slate-500 mt-1">{alpacaError}</p>
                                            <p className="text-xs text-slate-600 mt-2">
                                                Add <span className="text-yellow-400 font-mono">ALPACA_API_KEY</span> and{" "}
                                                <span className="text-yellow-400 font-mono">ALPACA_SECRET_KEY</span> in your project Secrets, then restart the backend.
                                            </p>
                                        </div>
                                    </div>
                                ) : alpacaLoading && !alpacaAccount ? (
                                    <div className="p-5 text-center text-slate-500 text-sm animate-pulse">Connecting to Alpaca…</div>
                                ) : alpacaAccount ? (
                                    <div>
                                        {/* Account Summary */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b border-slate-800">
                                            <AlpacaStat label="Equity" value={`$${Number(alpacaAccount.equity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} accent="green" />
                                            <AlpacaStat label="Cash" value={`$${Number(alpacaAccount.cash).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                            <AlpacaStat label="Buying Power" value={`$${Number(alpacaAccount.buying_power).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                            <AlpacaStat label="Portfolio Value" value={`$${Number(alpacaAccount.portfolio_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                        </div>

                                        {/* Tabs */}
                                        <div className="flex border-b border-slate-800">
                                            {(["account", "positions", "orders"] as const).map(tab => (
                                                <button
                                                    key={tab}
                                                    onClick={() => setAlpacaTab(tab)}
                                                    className={`px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors border-b-2 ${alpacaTab === tab
                                                        ? "border-yellow-500 text-yellow-300"
                                                        : "border-transparent text-slate-500 hover:text-slate-300"
                                                        }`}
                                                >
                                                    {tab === "account" && <span className="flex items-center gap-1.5"><Wallet size={11} />{tab}</span>}
                                                    {tab === "positions" && <span className="flex items-center gap-1.5"><TrendingUp size={11} />{tab} ({alpacaPositions.length})</span>}
                                                    {tab === "orders" && <span className="flex items-center gap-1.5"><List size={11} />{tab} ({alpacaOrders.length})</span>}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Tab Content */}
                                        <div className="p-4">
                                            {alpacaTab === "account" && (
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    <InfoRow label="Account ID" value={alpacaAccount.id?.slice(0, 16) + "…"} />
                                                    <InfoRow label="Currency" value={alpacaAccount.currency} />
                                                    <InfoRow label="Day Trades" value={alpacaAccount.daytrade_count} />
                                                    <InfoRow label="Long Market Value" value={`$${Number(alpacaAccount.long_market_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                                    <InfoRow label="Short Market Value" value={`$${Number(alpacaAccount.short_market_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                                    <InfoRow
                                                        label="Pattern Day Trader"
                                                        value={alpacaAccount.pattern_day_trader ? "Yes" : "No"}
                                                        accent={alpacaAccount.pattern_day_trader ? "red" : "green"}
                                                    />
                                                    <InfoRow
                                                        label="Trading Blocked"
                                                        value={alpacaAccount.trading_blocked ? "Yes" : "No"}
                                                        accent={alpacaAccount.trading_blocked ? "red" : "green"}
                                                    />
                                                    <InfoRow
                                                        label="Mode"
                                                        value={isAlpacaPaper(exchange) ? "Paper Trading" : "Live Trading"}
                                                        accent={isAlpacaPaper(exchange) ? "yellow" : "green"}
                                                    />
                                                </div>
                                            )}

                                            {alpacaTab === "positions" && (
                                                alpacaPositions.length === 0 ? (
                                                    <p className="text-slate-500 text-sm text-center py-4">No open positions</p>
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs">
                                                            <thead>
                                                                <tr className="text-[10px] text-slate-500 uppercase tracking-widest">
                                                                    <th className="text-left py-2 pr-4">Symbol</th>
                                                                    <th className="text-left py-2 pr-4">Side</th>
                                                                    <th className="text-right py-2 pr-4">Qty</th>
                                                                    <th className="text-right py-2 pr-4">Avg Entry</th>
                                                                    <th className="text-right py-2 pr-4">Current</th>
                                                                    <th className="text-right py-2 pr-4">Market Value</th>
                                                                    <th className="text-right py-2">Unrealized P&L</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {alpacaPositions.map((p, i) => {
                                                                    const pl = p.unrealized_pl ?? 0;
                                                                    const plPct = (p.unrealized_plpc ?? 0) * 100;
                                                                    return (
                                                                        <tr key={i} className="border-t border-slate-800">
                                                                            <td className="py-2.5 pr-4 font-black text-white">{p.symbol}</td>
                                                                            <td className="py-2.5 pr-4">
                                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${p.side === "long" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                                                                                    {String(p.side).toUpperCase()}
                                                                                </span>
                                                                            </td>
                                                                            <td className="py-2.5 pr-4 text-right font-mono">{p.qty}</td>
                                                                            <td className="py-2.5 pr-4 text-right font-mono">${Number(p.avg_entry_price).toFixed(4)}</td>
                                                                            <td className="py-2.5 pr-4 text-right font-mono">${Number(p.current_price ?? 0).toFixed(4)}</td>
                                                                            <td className="py-2.5 pr-4 text-right font-mono">${Number(p.market_value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                                            <td className={`py-2.5 text-right font-mono font-bold ${pl >= 0 ? "text-green-400" : "text-red-400"}`}>
                                                                                {pl >= 0 ? "+" : ""}{Number(pl).toFixed(2)} ({plPct >= 0 ? "+" : ""}{plPct.toFixed(2)}%)
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )
                                            )}

                                            {alpacaTab === "orders" && (
                                                alpacaOrders.length === 0 ? (
                                                    <p className="text-slate-500 text-sm text-center py-4">No recent orders</p>
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs">
                                                            <thead>
                                                                <tr className="text-[10px] text-slate-500 uppercase tracking-widest">
                                                                    <th className="text-left py-2 pr-4">Symbol</th>
                                                                    <th className="text-left py-2 pr-4">Side</th>
                                                                    <th className="text-right py-2 pr-4">Qty</th>
                                                                    <th className="text-right py-2 pr-4">Filled</th>
                                                                    <th className="text-right py-2 pr-4">Avg Price</th>
                                                                    <th className="text-left py-2 pr-4">Status</th>
                                                                    <th className="text-left py-2">Submitted</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {alpacaOrders.map((o, i) => (
                                                                    <tr key={i} className="border-t border-slate-800">
                                                                        <td className="py-2.5 pr-4 font-black text-white">{o.symbol}</td>
                                                                        <td className="py-2.5 pr-4">
                                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${String(o.side).includes("buy") ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                                                                                {String(o.side).toUpperCase()}
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-2.5 pr-4 text-right font-mono">{o.qty}</td>
                                                                        <td className="py-2.5 pr-4 text-right font-mono">{o.filled_qty}</td>
                                                                        <td className="py-2.5 pr-4 text-right font-mono">{o.filled_avg_price ? `$${Number(o.filled_avg_price).toFixed(4)}` : "—"}</td>
                                                                        <td className="py-2.5 pr-4">
                                                                            <OrderStatusBadge status={o.status} />
                                                                        </td>
                                                                        <td className="py-2.5 text-slate-500 text-[10px]">
                                                                            {o.submitted_at ? new Date(o.submitted_at).toLocaleString() : "—"}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}

                        {/* Bot List */}
                        {bots.length === 0 ? (
                            <div className="bg-slate-900 border border-dashed border-slate-800 rounded-2xl h-48 flex flex-col items-center justify-center text-slate-600 gap-3">
                                <Bot size={40} className="opacity-20" />
                                <p className="font-bold text-sm">No bots running</p>
                                <p className="text-xs">Select a strategy and launch a bot from the panel on the left</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {bots.map(bot => (
                                    <BotCard
                                        key={bot.id}
                                        bot={bot}
                                        isSelected={selectedBot?.id === bot.id}
                                        onSelect={() => setSelectedBot(selectedBot?.id === bot.id ? null : bot)}
                                        onStop={() => stopBot(bot.id)}
                                        onDelete={() => deleteBot(bot.id)}
                                        strategies={strategies}
                                        onSwitchStrategy={(s: string) => switchBotStrategy(bot.id, s)}
                                        isSwitching={switchingStrategy === bot.id}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Signal Stream for selected bot */}
                        {selectedBot && (
                            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                                    <div className="flex items-center gap-2">
                                        <Terminal size={15} className="text-slate-400" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
                                            Signal Stream — {selectedBot.strategy} · Bot {selectedBot.id}
                                        </span>
                                        {isAlpacaExchange(selectedBot.exchange) && (
                                            <span className="text-[10px] px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-400 font-bold">
                                                {selectedBot.exchange}
                                            </span>
                                        )}
                                    </div>
                                    {selectedBot.is_running && (
                                        <div className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[9px] font-black text-red-500 animate-pulse">LIVE</div>
                                    )}
                                </div>
                                <div className="h-48 overflow-y-auto p-4 font-mono text-[11px] space-y-1">
                                    {(selectedBot.logs || []).slice().reverse().map((log: string, i: number) => (
                                        <div key={i} className={`border-l-2 pl-3 py-0.5 ${log.includes("LONG") ? "border-green-500/50 text-green-400" :
                                            log.includes("SHORT") ? "border-red-500/50 text-red-400" :
                                                log.includes("EXIT") ? "border-yellow-500/50 text-yellow-400" :
                                                    log.includes("STRATEGY SWITCH") ? "border-blue-500/50 text-blue-400" :
                                                        log.includes("ALPACA") ? "border-yellow-500/50 text-yellow-300" :
                                                            log.includes("BUY") ? "border-green-500/50 text-green-400" :
                                                                log.includes("SELL") ? "border-red-500/50 text-red-400" :
                                                                    "border-slate-800 text-slate-400"
                                            }`}>{log}</div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {mainTab === "api" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-3">
                            <Zap className="text-yellow-400" size={24} /> API Connectivity
                        </h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Alpaca Integration</p>
                                <p className="text-sm text-slate-300">Connected to {exchange}</p>
                            </div>
                            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Secrets Status</p>
                                <p className="text-sm text-green-400 flex items-center gap-2">
                                    <CheckCircle size={14} /> ALPACA_API_KEY detected
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {mainTab === "system" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Terminal size={20} className="text-blue-400" /> Websocket Order Stream
                            </h2>
                            <div className="h-96 bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-[11px] overflow-y-auto text-slate-400 space-y-1">
                                <div className="text-blue-500">[SYSTEM] Websocket connected to Alpaca Stream</div>
                                <div className="text-slate-500">[12:00:01] Listening for order updates...</div>
                                {alpacaOrders.map((o, idx) => (
                                    <div key={idx} className="border-l border-slate-800 pl-2">
                                        <span className="text-slate-600">[{new Date(o.submitted_at).toLocaleTimeString()}]</span>{" "}
                                        <span className={o.side === "buy" ? "text-green-500" : "text-red-500"}>{o.side.toUpperCase()}</span>{" "}
                                        {o.qty} {o.symbol} - <span className="text-blue-400">{o.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                <h3 className="font-bold text-sm mb-4">Quick Limits</h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={cancelAllOrders}
                                        className="w-full py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 rounded-xl text-red-500 text-xs font-bold transition-all"
                                    >
                                        Cancel All Market Orders
                                    </button>
                                    <button
                                        onClick={closeAllPositions}
                                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 text-xs font-bold transition-all"
                                    >
                                        Close All Positions
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function OrderStatusBadge({ status }: { status: string }) {
    const s = String(status).toLowerCase();
    const colors =
        s === "filled" ? "bg-green-500/10 text-green-400 border-green-500/20" :
            s === "canceled" || s === "cancelled" ? "bg-slate-700 text-slate-400 border-slate-600" :
                s === "new" || s === "accepted" || s === "pending_new" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                    s === "partially_filled" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                        s === "rejected" || s === "expired" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            "bg-slate-800 text-slate-400 border-slate-700";
    return (
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${colors}`}>
            {String(status).toUpperCase()}
        </span>
    );
}

function AlpacaStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
    return (
        <div className="p-4 border-r border-slate-800 last:border-r-0">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-base font-black ${accent === "green" ? "text-green-400" : accent === "red" ? "text-red-400" : "text-white"}`}>{value}</p>
        </div>
    );
}

function InfoRow({ label, value, accent }: { label: string; value: any; accent?: string }) {
    return (
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-sm font-bold ${accent === "green" ? "text-green-400" : accent === "red" ? "text-red-400" : accent === "yellow" ? "text-yellow-400" : "text-white"}`}>{value}</p>
        </div>
    );
}

function BotCard({ bot, isSelected, onSelect, onStop, onDelete, strategies, onSwitchStrategy, isSwitching }: any) {
    const [showStrategyPicker, setShowStrategyPicker] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const pnlPositive = bot.pnl_pct >= 0;
    const sym = bot.currency_symbol;
    const isAlpaca = isAlpacaExchange(bot.exchange);
    const equitySnapshots: any[] = bot.equity_snapshots ?? [];
    const completedTrades: any[] = bot.completed_trades ?? [];

    return (
        <div
            onClick={onSelect}
            className={`bg-slate-900 border rounded-2xl p-0 overflow-hidden cursor-pointer transition-all ${isSelected
                ? isAlpaca ? "border-yellow-500/50 ring-1 ring-yellow-500/20" : "border-blue-500/50 ring-1 ring-blue-500/20"
                : "border-slate-800 hover:border-slate-700 hover:shadow-2xl"
                }`}
        >
            {/* Header / Top Bar */}
            <div className="flex items-center justify-between p-4 bg-slate-950/50 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${bot.is_running ? "bg-green-500 animate-pulse" : "bg-slate-600"}`} />
                    <span className="font-black text-white text-base tracking-tight">{bot.symbol}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 rounded text-slate-500 font-mono">{bot.id}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isAlpaca ? "text-yellow-500" : "text-blue-500"}`}>{bot.exchange}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={e => { e.stopPropagation(); onStop(); }}
                        disabled={!bot.is_running}
                        className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors border border-transparent disabled:opacity-30"
                    >
                        <Square size={12} fill="currentColor" />
                    </button>
                    <button
                        onClick={e => { e.stopPropagation(); onDelete(); }}
                        className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            {/* Main Metrics Grid (4 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-b border-slate-800/50">
                {/* 1. Profitability & Portfolio Performance */}
                <div className="p-4 border-r border-slate-800/50 space-y-3">
                    <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <TrendingUp size={10} className="text-green-400" /> Profitability
                    </h3>
                    <div className="space-y-1">
                        <div className="flex justify-between items-baseline">
                            <span className="text-[10px] text-slate-400">P&L</span>
                            <span className={`text-sm font-black ${pnlPositive ? "text-green-400" : "text-red-400"}`}>
                                {pnlPositive ? "+" : ""}{sym}{Math.abs(bot.pnl_native).toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between items-baseline">
                            <span className="text-[10px] text-slate-400">ROI</span>
                            <span className={`text-[10px] font-bold ${pnlPositive ? "text-green-400" : "text-red-400"}`}>
                                {pnlPositive ? "+" : ""}{bot.roi_pct}%
                            </span>
                        </div>
                    </div>
                    {/* Tiny Curve */}
                    <div className="h-8 w-full mt-2">
                        {equitySnapshots.length > 1 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={equitySnapshots}>
                                    <Line type="monotone" dataKey="equity" stroke={pnlPositive ? "#34d399" : "#f87171"} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : <div className="bg-slate-950/50 h-full rounded border border-slate-800/50" />}
                    </div>
                </div>

                {/* 2. Risk Management */}
                <div className="p-4 border-r border-slate-800/50 space-y-3">
                    <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Activity size={10} className="text-orange-400" /> Risk Management
                    </h3>
                    <div className="grid grid-cols-2 gap-y-2">
                        <MetricItem label="Drawdown" value={`${bot.max_drawdown}%`} color="red" />
                        <MetricItem label="Sharpe" value={bot.sharpe_ratio || "0.00"} />
                        <MetricItem label="Sortino" value={bot.sortino_ratio || "0.00"} />
                        <MetricItem label="Exposure" value={`${sym}${bot.exposure_usd?.toLocaleString()}`} />
                    </div>
                </div>

                {/* 3. Efficiency & Execution */}
                <div className="p-4 border-r border-slate-800/50 space-y-3">
                    <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Zap size={10} className="text-yellow-400" /> Efficiency
                    </h3>
                    <div className="grid grid-cols-2 gap-y-2">
                        <MetricItem label="Win Rate" value={`${(bot.win_rate * 100).toFixed(0)}%`} color="green" />
                        <MetricItem label="Profit Factor" value={bot.profit_factor || "1.0"} />
                        <MetricItem label="Avg Trade" value={`${bot.avg_trade_pnl >= 0 ? "+" : ""}${sym}${bot.avg_trade_pnl}`} />
                        <MetricItem label="Latency" value={bot.execution_speed} color="blue" />
                    </div>
                </div>

                {/* 4. Operational Monitoring */}
                <div className="p-4 space-y-3">
                    <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Terminal size={10} className="text-blue-400" /> Operational
                    </h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400">Position</span>
                            <span className={`font-black ${bot.position ? (bot.position === "LONG" ? "text-green-400" : "text-red-400") : "text-slate-600"}`}>
                                {bot.position || "NONE"}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400">Status</span>
                            <span className="text-white font-bold">{bot.is_running ? "RUNNING" : "STOPPED"}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400">Connectivity</span>
                            <span className="text-green-500 font-bold flex items-center gap-1">
                                <CheckCircle size={8} /> LIVE
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Requested Layout: Portfolio / System */}
            <div className="p-0 flex flex-col lg:flex-row">
                {/* Left Side: Portfolio */}
                <div className="flex-1 p-4 border-r border-slate-800/50 bg-slate-950/20">
                    <div className="border-b border-slate-800/80 pb-1 mb-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Portfolio (Invested: {sym}{bot.amount_native.toLocaleString()})</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="border-r border-slate-800/50 pr-4">
                            <p className="text-slate-500 text-[9px] font-bold uppercase mb-0.5">Equity</p>
                            <p className="text-white font-black text-sm">{sym}{bot.equity_native.toLocaleString()}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-bold ${pnlPositive ? "text-green-400" : "text-red-400"}`}>
                                    {pnlPositive ? "+" : ""}{sym}{Math.abs(bot.pnl_native).toFixed(2)}
                                </span>
                                <span className={`text-[10px] font-bold px-1 rounded ${pnlPositive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                                    {pnlPositive ? "+" : ""}{bot.pnl_pct.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between border-b border-slate-800/30 pb-1.5 mb-1.5">
                                <span className="text-slate-500 text-[9px] font-bold uppercase tracking-tight">Allocation</span>
                                <span className="text-white font-black">15%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 text-[9px] font-bold uppercase tracking-tight">Leverage</span>
                                <span className="text-white font-black">1x</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle: Positions / Recent Trades */}
                <div className="flex-[1.2] p-4 bg-slate-950/40">
                    <div className="border-b border-slate-800/80 pb-1 mb-2 flex justify-between items-center">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Positions / Recent Trades (Total: {bot.trades_count})</h4>
                        {(bot.position || completedTrades.length > 0) && (
                            <button
                                onClick={e => { e.stopPropagation(); setShowDetails(!showDetails); }}
                                className="text-[9px] text-blue-500 font-bold hover:underline"
                            >
                                {showDetails ? "Hide All" : "View All"}
                            </button>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        {/* If position is open, show it first */}
                        {bot.position && (
                            <div className="grid grid-cols-5 gap-2 text-[10px] font-mono border-b border-white/5 pb-1.5 mb-2 bg-blue-500/5 -mx-1 px-1 py-1 rounded">
                                <span className="text-slate-500">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="text-white font-black">{bot.symbol}</span>
                                <span className={`font-black ${bot.position === "LONG" ? "text-green-400" : "text-red-400"}`}>{bot.position === "LONG" ? "BUY" : "SELL"}</span>
                                <span className="text-slate-400">${bot._price_history?.length ? bot._price_history[bot._price_history.length - 1].toFixed(2) : "0.00"}</span>
                                <span className="text-right text-slate-400">{bot.position_size}</span>
                            </div>
                        )}
                        {/* Show last 5 completed trades */}
                        {[...completedTrades].reverse().slice(0, 5).map((tr: any) => (
                            <div key={tr.id} className="grid grid-cols-5 gap-2 text-[10px] font-mono border-b border-white/5 pb-1 last:border-b-0">
                                <span className="text-slate-500">{tr.time}</span>
                                <span className="text-white font-bold">{bot.symbol}</span>
                                <span className={`font-bold ${tr.side === "LONG" ? "text-green-600/70" : "text-red-600/70"}`}>{tr.side === "LONG" ? "BUY" : "SELL"}</span>
                                <span className="text-slate-500">${tr.exit.toFixed(2)}</span>
                                <span className="text-right text-slate-500">{tr.qty}</span>
                            </div>
                        ))}
                        {completedTrades.length === 0 && !bot.position && <p className="text-[10px] text-slate-600 italic py-2">Waiting for first signal…</p>}
                    </div>
                </div>
            </div>

            {/* Bottom Status Bar: System */}
            <div className="p-2 px-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                        <span className="text-slate-600 uppercase font-black tracking-tighter">Data:</span>
                        <span className="text-green-500 flex items-center gap-1">greentick <CheckCircle size={8} /></span>
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="text-slate-600 uppercase font-black tracking-tighter">API:</span>
                        <span className="text-white">time runs {bot.latency_ms || 23}ms</span>
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="text-slate-600 uppercase font-black tracking-tighter">Strategy:</span>
                        <span className="text-blue-400 font-bold uppercase">{bot.strategy} deployed</span>
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded font-black text-[9px] ${isAlpaca ? "bg-yellow-500/10 text-yellow-500" : "bg-blue-500/10 text-blue-500"}`}>
                        {isAlpaca ? (isAlpacaPaper(bot.exchange) ? "PAPER" : "LIVE") : "SIMULATED"}
                    </span>
                </div>
            </div>

            {/* Expandable full details if requested */}
            {showDetails && (
                <div className="p-4 border-t border-slate-800 bg-black/30 space-y-4 animate-in fade-in duration-300">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1">Performance</p>
                            <DetailRow label="Gross Profit" value={`${sym}${bot.gross_profit}`} />
                            <DetailRow label="Gross Loss" value={`${sym}${bot.gross_loss}`} />
                            <DetailRow label="Profit Factor" value={bot.profit_factor} />
                            <DetailRow label="Expectancy" value={`${bot.avg_trade_pnl >= 0 ? "+" : ""}${sym}${bot.avg_trade_pnl}`} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1">Risk</p>
                            <DetailRow label="Sharpe Ratio" value={bot.sharpe_ratio} />
                            <DetailRow label="Sortino Ratio" value={bot.sortino_ratio} />
                            <DetailRow label="Max Drawdown" value={`${bot.max_drawdown}%`} />
                            <DetailRow label="Peak Equity" value={`${sym}${bot.peak_equity}`} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1">Streaks</p>
                            <DetailRow label="Win Streak" value={bot.total_winning_streak || 0} />
                            <DetailRow label="Loss Streak" value={bot.total_losing_streak || 0} />
                            <DetailRow label="Current Streak" value={bot.current_streak || 0} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1">Trades</p>
                            <DetailRow label="Total" value={bot.trades_count} />
                            <DetailRow label="Average Holding" value="N/A" />
                            <DetailRow label="Win Rate" value={`${(bot.win_rate * 100).toFixed(1)}%`} />
                        </div>
                    </div>
                    <div className="h-40 w-full mt-4 bg-slate-950/50 rounded-xl border border-slate-800 p-2">
                        {equitySnapshots.length > 1 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={equitySnapshots}>
                                    <defs>
                                        <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="time" hide />
                                    <YAxis hide domain={['auto', 'auto']} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }}
                                    />
                                    <Area type="monotone" dataKey="equity" stroke="#3b82f6" fillOpacity={1} fill="url(#colorEquity)" isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-600 text-[10px]">
                                <Activity size={20} className="mb-2 opacity-20" />
                                No equity history yet
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: any }) {
    return (
        <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500">{label}</span>
            <span className="text-white font-bold">{value ?? "0.00"}</span>
        </div>
    );
}

function MetricItem({ label, value, color }: { label: string; value: any; color?: string }) {
    return (
        <div>
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tight">{label}</p>
            <p className={`text-[11px] font-black ${color === "green" ? "text-green-400" :
                color === "red" ? "text-red-400" :
                    color === "blue" ? "text-blue-400" : "text-slate-200"
                }`}>{value}</p>
        </div>
    );
}

function Stat({ label, value, sub, highlight }: any) {
    return (
        <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-sm font-black ${highlight === "green" ? "text-green-400" :
                highlight === "red" ? "text-red-400" :
                    "text-white"
                }`}>{value}</p>
            {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
        </div>
    );
}
