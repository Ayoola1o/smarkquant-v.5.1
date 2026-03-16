"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    Play,
    Download,
    Activity,
    BarChart3,
    Terminal,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Clock,
    Tag,
    ChevronDown,
    Info,
    Cpu,
    Database,
    Globe,
    Zap,
    CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "2h", "3h", "4h", "6h", "8h", "12h", "1D", "3D", "1W"];

const CRYPTO_SYMBOLS = [
    "BTC-USD", "ETH-USD", "BNB-USD", "SOL-USD", "XRP-USD",
    "ADA-USD", "AVAX-USD", "DOT-USD", "MATIC-USD", "LINK-USD",
    "LTC-USD", "ATOM-USD", "UNI-USD", "DOGE-USD", "SHIB-USD",
];

const STOCK_SYMBOLS = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA",
    "META", "TSLA", "BRK-B", "JPM", "V",
    "JNJ", "WMT", "PG", "MA", "UNH",
    "HD", "BAC", "XOM", "ABBV", "PFE",
];

function BacktestPageInner() {
    const searchParams = useSearchParams();
    const strategyParam = searchParams.get("strategy") || "";

    const [startDate, setStartDate] = useState("2023-01-01");
    const [finishDate, setFinishDate] = useState("2024-01-01");
    const [timeframe, setTimeframe] = useState("4h");
    const [strategy, setStrategy] = useState(strategyParam);
    const [symbol, setSymbol] = useState("BTC-USD");
    const [exchange, setExchange] = useState("yfinance");
    const [assetTab, setAssetTab] = useState<"imported" | "crypto" | "stocks">("crypto");

    const [strategies, setStrategies] = useState<string[]>([]);
    const [importedSymbols, setImportedSymbols] = useState<{ symbol: string; exchange: string; count: number }[]>([]);

    const [status, setStatus] = useState<any>(null);
    const [results, setResults] = useState<any>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const logEndRef = useRef<HTMLDivElement>(null);
    const wasRunning = useRef(false);

    useEffect(() => {
        if (strategyParam) setStrategy(strategyParam);
    }, [strategyParam]);

    useEffect(() => {
        fetch("/api/strategies").then(r => r.json()).then(d => setStrategies(d.strategies || []));
        fetch("/api/candles/symbols").then(r => r.json()).then(d => {
            setImportedSymbols(d.symbols || []);
            if (d.symbols?.length > 0) setAssetTab("imported");
        });
        fetchResults();
        fetchStatus();
    }, []);

    useEffect(() => {
        let interval: any;
        if (status?.is_running) {
            wasRunning.current = true;
            interval = setInterval(fetchStatus, 2000);
        } else {
            if (wasRunning.current) fetchResults();
            wasRunning.current = false;
        }
        return () => clearInterval(interval);
    }, [status?.is_running]);

    const fetchStatus = async () => {
        try {
            const res = await fetch("/api/jesse/status");
            const data = await res.json();
            setStatus(data);
            if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: "smooth" });
        } catch (e) {}
    };

    const fetchResults = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch("/api/backtest/results");
            const data = await res.json();
            if (data.results) setResults(data.results);
        } catch (e) {
            toast.error("Failed to load backtest results");
        } finally {
            setIsRefreshing(false);
        }
    };

    const runBacktest = async () => {
        try {
            const res = await fetch("/api/backtest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    start_date: startDate,
                    finish_date: finishDate,
                    strategy_name: strategy || undefined,
                    symbol: symbol || undefined,
                    exchange: exchange || undefined,
                }),
            });
            if (res.ok) {
                toast.success(`Backtest started — ${strategy || "SMA Crossover"} on ${symbol}`);
                fetchStatus();
            } else {
                const err = await res.json();
                toast.error(err.detail || "Failed to start backtest");
            }
        } catch (e) {
            toast.error("Connection error");
        }
    };

    const equityData = results?.charts?.equity?.map((val: number, i: number) => ({ name: i, equity: val })) || [];
    const displayStrategy = results?.strategy_name || results?.strategy || strategy || null;
    const displaySymbol = results?.symbol || symbol;

    const currentAssets = assetTab === "imported"
        ? importedSymbols.map(s => s.symbol)
        : assetTab === "crypto" ? CRYPTO_SYMBOLS : STOCK_SYMBOLS;

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black tracking-widest uppercase">
                        <Activity size={12} /> Backtesting Lab
                    </div>
                    <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                        Strategy Validator
                    </h1>
                    <p className="text-slate-400 max-w-xl text-sm">
                        Validate any strategy against any asset using historical data — independent of your live routes configuration.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* ── Config Sidebar ── */}
                    <div className="lg:col-span-4 space-y-5">
                        {/* Routes notice */}
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                            <Info size={16} className="text-amber-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-amber-400 mb-1">Routes vs Backtest</p>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Your <span className="font-mono text-amber-300">routes.py</span> configures <b>live trading</b> only. Backtests here are fully independent — pick any strategy and any asset below.
                                </p>
                            </div>
                        </div>

                        <div className="bg-[#0b1224] border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
                            {/* Strategy */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Cpu size={13} className="text-blue-400" /> Strategy
                                </label>
                                <div className="relative">
                                    <select
                                        value={strategy}
                                        onChange={e => setStrategy(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">SMA Crossover (built-in)</option>
                                        {strategies.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                                </div>
                                {strategy && (
                                    <div className="flex items-center gap-2 text-[10px] text-green-400">
                                        <CheckCircle2 size={11} /> Strategy loaded from your strategies folder
                                    </div>
                                )}
                            </div>

                            {/* Asset */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Zap size={13} className="text-yellow-400" /> Asset
                                    <span className="ml-auto font-mono text-yellow-300 text-xs">{symbol}</span>
                                </label>
                                {/* Tabs */}
                                <div className="flex gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
                                    {(["imported", "crypto", "stocks"] as const).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setAssetTab(tab)}
                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${
                                                assetTab === tab
                                                    ? "bg-slate-800 text-white"
                                                    : "text-slate-600 hover:text-slate-400"
                                            }`}
                                        >
                                            {tab === "imported" ? (
                                                <span className="flex items-center justify-center gap-1">
                                                    <Database size={10} />
                                                    DB {importedSymbols.length > 0 ? `(${importedSymbols.length})` : ""}
                                                </span>
                                            ) : tab === "crypto" ? "Crypto" : "Stocks"}
                                        </button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto pr-1">
                                    {currentAssets.length > 0 ? currentAssets.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setSymbol(s)}
                                            className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all truncate ${
                                                symbol === s
                                                    ? "bg-yellow-500/15 border-yellow-500/50 text-yellow-300"
                                                    : "bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300"
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    )) : (
                                        <div className="col-span-3 text-[10px] text-slate-600 italic py-4 text-center">
                                            No imported data yet — use the Data tab to import candles
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Exchange */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Globe size={13} className="text-purple-400" /> Exchange / Source
                                </label>
                                <div className="relative">
                                    <select
                                        value={exchange}
                                        onChange={e => setExchange(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="alpaca">Alpaca</option>
                                        <option value="yfinance">Yahoo Finance</option>
                                        <option value="Binance Futures">Binance Futures</option>
                                        <option value="Binance">Binance Spot</option>
                                        <option value="Bybit">Bybit</option>
                                        <option value="Coinbase">Coinbase</option>
                                    </select>
                                    <ChevronDown size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Start</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-300"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">End</label>
                                    <input
                                        type="date"
                                        value={finishDate}
                                        onChange={e => setFinishDate(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-300"
                                    />
                                </div>
                            </div>

                            {/* Timeframe */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Clock size={13} className="text-green-400" /> Timeframe
                                    <span className="ml-auto text-green-300 font-mono text-xs">{timeframe}</span>
                                </label>
                                <div className="grid grid-cols-5 gap-1">
                                    {TIMEFRAMES.map(tf => (
                                        <button
                                            key={tf}
                                            onClick={() => setTimeframe(tf)}
                                            className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                                timeframe === tf
                                                    ? "bg-green-600/20 border-green-500/60 text-green-300"
                                                    : "bg-slate-950/50 border-slate-800 text-slate-600 hover:border-slate-600 hover:text-slate-300"
                                            }`}
                                        >
                                            {tf}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={runBacktest}
                                disabled={status?.is_running}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-50 text-white text-sm font-black rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl shadow-blue-950/30"
                            >
                                {status?.is_running ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Running...
                                    </>
                                ) : (
                                    <>
                                        <Play size={18} fill="currentColor" />
                                        Run Backtest
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* ── Results Area ── */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Equity Curve */}
                        <div className="bg-[#0b1224] border border-slate-800 rounded-2xl p-6 h-[360px] flex flex-col shadow-2xl">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-lg font-bold flex items-center gap-2">
                                        <TrendingUp size={18} className="text-blue-400" />
                                        Equity Curve
                                    </h2>
                                    {displayStrategy && (
                                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 font-bold">
                                                {displayStrategy}
                                            </span>
                                            {displaySymbol && displaySymbol !== "mixed" && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 font-bold">
                                                    {displaySymbol}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {results && (
                                    <span className="text-[10px] text-slate-600 font-mono">{results.filename}</span>
                                )}
                            </div>
                            <div className="flex-1 w-full">
                                {results ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={equityData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                            <XAxis dataKey="name" hide />
                                            <YAxis
                                                stroke="#475569"
                                                fontSize={11}
                                                tickFormatter={v => `$${v.toLocaleString()}`}
                                                domain={["auto", "auto"]}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }}
                                                labelStyle={{ display: "none" }}
                                                formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Equity"]}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="equity"
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                                dot={false}
                                                animationDuration={800}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-700 border border-dashed border-slate-800 rounded-xl">
                                        <BarChart3 size={40} className="mb-3 opacity-30" />
                                        <p className="text-sm font-bold">No results yet</p>
                                        <p className="text-xs mt-1 text-slate-700">Configure and run a backtest to see the equity curve.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Primary Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                {
                                    label: "Net Profit",
                                    value: results?.metrics?.net_profit != null ? `${results.metrics.net_profit.toFixed(2)}%` : "--",
                                    sub: results?.metrics?.net_profit_val != null ? `$${results.metrics.net_profit_val.toFixed(2)}` : "",
                                    color: results?.metrics?.net_profit >= 0 ? "text-green-400" : "text-red-400",
                                },
                                {
                                    label: "Win Rate",
                                    value: results?.metrics?.win_rate != null ? `${(results.metrics.win_rate * 100).toFixed(1)}%` : "--",
                                    sub: results?.metrics ? `${results.metrics.winning_trades}W / ${results.metrics.losing_trades}L` : "",
                                    color: "text-blue-400",
                                },
                                {
                                    label: "Max Drawdown",
                                    value: results?.metrics?.max_drawdown != null ? `${results.metrics.max_drawdown.toFixed(2)}%` : "--",
                                    sub: "",
                                    color: "text-red-400",
                                },
                                {
                                    label: "Total Trades",
                                    value: results?.metrics?.total_trades ?? "--",
                                    sub: results?.metrics ? `$${results.metrics.final_equity?.toFixed(2)} final` : "",
                                    color: "text-slate-200",
                                },
                            ].map((m, i) => (
                                <div key={i} className="bg-[#0b1224] border border-slate-800 p-5 rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">{m.label}</p>
                                    <p className={`text-2xl font-black ${results ? m.color : "text-slate-700"}`}>{m.value}</p>
                                    {m.sub && <p className="text-[10px] text-slate-600 mt-1">{m.sub}</p>}
                                </div>
                            ))}
                        </div>

                        {/* Performance + Risk metrics tables */}
                        {results?.metrics && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Performance */}
                                <div className="bg-[#0b1224] border border-slate-800 rounded-xl p-5 space-y-3">
                                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <TrendingUp size={12} /> Performance
                                    </p>
                                    {[
                                        ["PNL", `$${results.metrics.net_profit_val?.toFixed(2) ?? "--"} (${results.metrics.net_profit?.toFixed(2)}%)`],
                                        ["Sharpe Ratio", results.metrics.sharpe_ratio?.toFixed(2) ?? "--"],
                                        ["Sortino Ratio", results.metrics.sortino_ratio?.toFixed(2) ?? "--"],
                                        ["Calmar Ratio", results.metrics.calmar_ratio?.toFixed(2) ?? "--"],
                                        ["Omega Ratio", results.metrics.omega_ratio?.toFixed(2) ?? "--"],
                                        ["Expectancy", `$${results.metrics.expectancy?.toFixed(2)} (${results.metrics.expectancy_pct?.toFixed(2)}%)`],
                                        ["Avg Holding", `${results.metrics.avg_holding_period?.toFixed(0)} bars`],
                                    ].map(([k, v]) => (
                                        <div key={k} className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                                            <span className="text-[11px] text-slate-500">{k}</span>
                                            <span className="text-[11px] font-bold text-slate-200">{v}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Risk */}
                                <div className="bg-[#0b1224] border border-slate-800 rounded-xl p-5 space-y-3">
                                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <TrendingDown size={12} /> Risk Metrics
                                    </p>
                                    {[
                                        ["Max Drawdown", `${results.metrics.max_drawdown?.toFixed(2)}%`],
                                        ["Largest Win", `$${results.metrics.largest_win?.toFixed(2)}`],
                                        ["Largest Loss", `$${results.metrics.largest_loss?.toFixed(2)}`],
                                        ["Win Streak", results.metrics.total_winning_streak],
                                        ["Loss Streak", results.metrics.total_losing_streak],
                                        ["Current Streak", results.metrics.current_streak],
                                        ["Fees Paid", `$${results.metrics.fee?.toFixed(2)}`],
                                    ].map(([k, v]) => (
                                        <div key={k} className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                                            <span className="text-[11px] text-slate-500">{k}</span>
                                            <span className="text-[11px] font-bold text-slate-200">{v}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Trade stats */}
                                <div className="bg-[#0b1224] border border-slate-800 rounded-xl p-5 space-y-3">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <BarChart3 size={12} /> Trade Stats
                                    </p>
                                    {[
                                        ["Total Trades", results.metrics.total_trades],
                                        ["Winning", results.metrics.winning_trades],
                                        ["Losing", results.metrics.losing_trades],
                                        ["Avg Win", `$${results.metrics.avg_win?.toFixed(2)}`],
                                        ["Avg Loss", `$${results.metrics.avg_loss?.toFixed(2)}`],
                                        ["Gross Profit", `$${results.metrics.gross_profit?.toFixed(2)}`],
                                        ["Gross Loss", `$${results.metrics.gross_loss?.toFixed(2)}`],
                                    ].map(([k, v]) => (
                                        <div key={k} className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                                            <span className="text-[11px] text-slate-500">{k}</span>
                                            <span className="text-[11px] font-bold text-slate-200">{v}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Trade list */}
                        {results?.trades?.length > 0 && (
                            <div className="bg-[#0b1224] border border-slate-800 rounded-xl overflow-hidden">
                                <div className="p-4 border-b border-slate-800 flex items-center gap-2">
                                    <BarChart3 size={14} className="text-slate-500" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Trade Log</p>
                                    <span className="ml-auto text-[10px] text-slate-600">{results.trades.length} trades shown</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-[11px]">
                                        <thead>
                                            <tr className="border-b border-slate-800 text-slate-600 uppercase tracking-wider">
                                                <th className="px-4 py-2 text-left">#</th>
                                                <th className="px-4 py-2 text-left">Side</th>
                                                <th className="px-4 py-2 text-right">Entry</th>
                                                <th className="px-4 py-2 text-right">Exit</th>
                                                <th className="px-4 py-2 text-right">P&L</th>
                                                <th className="px-4 py-2 text-right">P&L %</th>
                                                <th className="px-4 py-2 text-right">Exit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.trades.slice(0, 50).map((t: any, i: number) => (
                                                <tr key={i} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                                                    <td className="px-4 py-2 text-slate-600">{i + 1}</td>
                                                    <td className="px-4 py-2">
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${t.side === "long" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                                                            {t.side || "long"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-slate-300">{t.entry?.toLocaleString()}</td>
                                                    <td className="px-4 py-2 text-right text-slate-300">{t.exit?.toLocaleString()}</td>
                                                    <td className={`px-4 py-2 text-right font-bold ${t.win ? "text-green-400" : "text-red-400"}`}>
                                                        {t.pnl != null ? `$${t.pnl.toFixed(2)}` : "--"}
                                                    </td>
                                                    <td className={`px-4 py-2 text-right font-bold ${t.win ? "text-green-400" : "text-red-400"}`}>
                                                        {t.pnl_pct?.toFixed(2)}%
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-slate-600 text-[10px]">{t.exit_reason || "--"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Log + Info row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Log terminal */}
                            <div className="bg-slate-950 border border-slate-800 rounded-2xl flex flex-col overflow-hidden h-[280px]">
                                <div className="p-3 border-b border-slate-800 bg-slate-900/40 flex justify-between items-center">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                        <Terminal size={13} /> Engine Logs
                                    </h3>
                                    {status?.is_running && (
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                                            <span className="text-[9px] text-green-500 font-bold">{status.runtime}s</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1">
                                    {status?.logs?.length > 0 ? (
                                        status.logs.map((log: string, i: number) => (
                                            <div key={i} className={`border-l-2 pl-3 leading-relaxed ${
                                                log.includes("[ERROR]") ? "border-red-500/40 text-red-400" :
                                                log.includes("[OK]") ? "border-green-500/40 text-green-400" :
                                                "border-slate-800 text-slate-500"
                                            }`}>
                                                {log}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-slate-700 italic text-xs">Logs appear here once a backtest starts...</div>
                                    )}
                                    <div ref={logEndRef} />
                                </div>
                                <div className="p-3 border-t border-slate-800 bg-slate-900/30">
                                    <button
                                        onClick={fetchResults}
                                        className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Download size={12} />
                                        {isRefreshing ? "Refreshing..." : "Refresh Results"}
                                    </button>
                                </div>
                            </div>

                            {/* Result summary + info */}
                            <div className="space-y-4">
                                {results && displayStrategy && (
                                    <div className="bg-[#0b1224] border border-slate-800 rounded-xl p-5 flex items-center gap-4">
                                        <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                            <Tag size={20} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Last Result</p>
                                            <p className="text-base font-bold text-white">{displayStrategy}</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                {results.metrics?.net_profit != null
                                                    ? `Net P&L: ${results.metrics.net_profit.toFixed(2)}% · Win Rate: ${(results.metrics.win_rate * 100).toFixed(1)}% · ${results.metrics.total_trades} trades`
                                                    : "No trades found"}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="bg-blue-600/5 border border-blue-600/20 p-5 rounded-xl">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-blue-600/10 rounded-lg">
                                            <AlertCircle size={16} className="text-blue-400" />
                                        </div>
                                        <h4 className="font-bold text-blue-400 text-sm">Data Check</h4>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Make sure you have imported candles for the selected symbol and date range. Use the <b>Data</b> tab to import. Imported symbols appear in the <b>DB</b> tab above.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function BacktestPage() {
    return (
        <Suspense fallback={<div className="p-8 text-slate-400">Loading...</div>}>
            <BacktestPageInner />
        </Suspense>
    );
}
