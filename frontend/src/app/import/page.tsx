"use client";

import { useState, useEffect, useRef } from "react";
import {
    Database,
    Download,
    Terminal,
    Globe,
    TrendingUp,
    Search,
    CheckCircle2,
    Clock,
    Zap,
    ChevronDown,
    Activity,
    Cpu,
    Filter
} from "lucide-react";
import { toast } from "sonner";
import { TOP_SYMBOLS } from "@/lib/symbols";

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "2h", "3h", "4h", "6h", "8h", "12h", "1D", "3D", "1W"];

export default function ImportPage() {
    const [source, setSource] = useState("alpaca");
    const [exchange, setExchange] = useState("alpaca");

    const handleExchangeChange = (val: string) => {
        setExchange(val);
        setSource(val === "alpaca" ? "alpaca" : "yfinance");
    };
    const [symbol, setSymbol] = useState("BTC-USD");
    const [startDate, setStartDate] = useState("2023-01-01");
    const [timeframe, setTimeframe] = useState("1D");
    const [status, setStatus] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSymbolListOpen, setIsSymbolListOpen] = useState(false);
    const logEndRef = useRef<HTMLDivElement>(null);

    const filteredSymbols = TOP_SYMBOLS.filter(s =>
        s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 10);

    const fetchStatus = async () => {
        try {
            const res = await fetch("/api/jesse/status");
            const data = await res.json();
            setStatus(data);
            if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: "smooth" });
        } catch (e) {
            console.error("Status fetch failed");
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    useEffect(() => {
        let interval: any;
        if (status?.is_running) {
            interval = setInterval(fetchStatus, 2000);
        }
        return () => clearInterval(interval);
    }, [status?.is_running]);

    const startImport = async () => {
        try {
            const res = await fetch("/api/candles/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ exchange, symbol, start_date: startDate, timeframe, source }),
            });
            if (res.ok) {
                toast.success(`Import started — ${symbol} ${timeframe} from ${startDate}`);
                fetchStatus();
            } else {
                const err = await res.json();
                toast.error(err.detail || "Failed to start import");
            }
        } catch (e) {
            toast.error("Endpoint unreachable");
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-8 selection:bg-purple-500/30">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black tracking-widest uppercase">
                            <Activity size={12} /> Live Data Sync
                        </div>
                        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                            Market Data Engine
                        </h1>
                        <p className="text-slate-400 max-w-xl">
                            High-fidelity historical data ingestion for quantitative strategy validation and backtesting.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center gap-3">
                            <Cpu size={20} className="text-purple-400" />
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">System Load</p>
                                <p className="text-sm font-bold text-white">Optimal</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-start">
                    {/* Control Panel */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-purple-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                            <div className="relative bg-[#0b1224] border border-slate-800 p-6 rounded-2xl space-y-6 shadow-2xl">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Globe size={14} className="text-blue-500" /> Source Exchange
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={exchange}
                                            onChange={(e) => handleExchangeChange(e.target.value)}
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="alpaca">Alpaca (Stocks &amp; Crypto)</option>
                                            <option value="yfinance">Yahoo Finance (Stocks/Crypto/Comm)</option>
                                            <option value="Binance Futures">Binance Futures</option>
                                            <option value="Binance">Binance Spot</option>
                                            <option value="Bybit">Bybit</option>
                                            <option value="Coinbase">Coinbase</option>
                                        </select>
                                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-2 relative">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Zap size={14} className="text-yellow-500" /> Asset Ticker
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={isSymbolListOpen ? searchQuery : symbol}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setIsSymbolListOpen(true);
                                            }}
                                            onFocus={() => setIsSymbolListOpen(true)}
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-700"
                                            placeholder="Search AAPL, BTC-USD..."
                                        />
                                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />

                                        {isSymbolListOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0b1224] border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                                <div className="max-h-64 overflow-y-auto">
                                                    {filteredSymbols.length > 0 ? (
                                                        filteredSymbols.map((s, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => {
                                                                    setSymbol(s.symbol);
                                                                    setSearchQuery("");
                                                                    setIsSymbolListOpen(false);
                                                                }}
                                                                className="w-full px-4 py-3 text-left hover:bg-slate-800/50 border-b border-slate-800/50 flex justify-between items-center transition-colors group"
                                                            >
                                                                <div>
                                                                    <p className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">{s.symbol}</p>
                                                                    <p className="text-[10px] text-slate-500">{s.name}</p>
                                                                </div>
                                                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">{s.type}</span>
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="p-4 text-center text-xs text-slate-600 italic">No assets found</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {isSymbolListOpen && <div className="fixed inset-0 z-40" onClick={() => setIsSymbolListOpen(false)} />}
                                </div>

                                {/* Timeframe Selector */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Clock size={14} className="text-purple-400" /> Candle Timeframe
                                        <span className="ml-auto text-purple-300 font-mono text-xs">{timeframe}</span>
                                    </label>
                                    <div className="grid grid-cols-4 gap-1">
                                        {TIMEFRAMES.map(tf => (
                                            <button
                                                key={tf}
                                                onClick={() => setTimeframe(tf)}
                                                className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                                    timeframe === tf
                                                        ? "bg-purple-600/20 border-purple-500/60 text-purple-300"
                                                        : "bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300"
                                                }`}
                                            >
                                                {tf}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Clock size={14} className="text-green-500" /> Start Horizon
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-300"
                                    />
                                </div>

                                <button
                                    onClick={startImport}
                                    disabled={status?.is_running}
                                    className="group relative w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-50 text-white text-sm font-black rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl shadow-orange-950/20 overflow-hidden"
                                >
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20" />
                                    {status?.is_running ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Processing Pipeline...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Download size={20} className="group-hover:-translate-y-1 transition-transform" />
                                            <span>Initialize Ingestion</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl flex items-start gap-4 backdrop-blur-sm">
                            <div className="p-2.5 bg-blue-500/10 rounded-xl">
                                <TrendingUp size={22} className="text-blue-500" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-slate-300 mb-1 uppercase tracking-wider">Engine Protocol</h4>
                                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                    Our distributed ingestion engine standardizes RAW market feeds into institutional-grade OHLCV candles, indexed for sub-millisecond strategy execution.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Console & Insights */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-slate-950 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl h-[650px]">
                            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/40 backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                                    </div>
                                    <div className="h-4 w-[1px] bg-slate-800 mx-2" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 flex items-center gap-2">
                                        <Terminal size={14} /> Ingestion Log
                                    </h3>
                                </div>
                                {status?.is_running && (
                                    <div className="flex items-center gap-2.5 px-3 py-1 bg-green-500/10 rounded-lg border border-green-500/20">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        <span className="text-[9px] text-green-500 font-black tracking-widest">LIVE STREAM</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 font-mono text-[12px] space-y-2.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                                {status?.logs?.length > 0 ? (
                                    status.logs.map((log: string, i: number) => (
                                        <div key={i} className="group flex gap-5 border-l-2 border-transparent hover:border-purple-500/30 pl-2 transition-colors">
                                            <span className="text-slate-800 select-none min-w-[24px] text-right font-bold group-hover:text-slate-700">{i + 1}</span>
                                            <span className="flex-1 whitespace-pre-wrap text-slate-400 group-hover:text-slate-200 transition-colors leading-relaxed">
                                                {log.includes("ERROR") ? <span className="text-red-400 font-bold">{log}</span> :
                                                    log.includes("Successfully") ? <span className="text-green-400 font-bold">{log}</span> : log}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-800 opacity-30 select-none">
                                        <Database size={64} className="mb-6 stroke-[1px]" />
                                        <p className="text-sm font-black tracking-widest uppercase">IDLE ENGINE</p>
                                        <p className="text-[10px] mt-2">Ready for ingestion parameters...</p>
                                    </div>
                                )}
                                <div ref={logEndRef} />
                            </div>

                            <div className="p-4 bg-slate-900/60 border-t border-white/5 text-[9px] font-bold text-slate-600 flex justify-between items-center backdrop-blur-lg">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-2 uppercase tracking-wide">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                                        CMD: {status?.last_command || "WAITING"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 uppercase tracking-wide">
                                    <span className="flex items-center gap-2 text-green-500/80">
                                        <CheckCircle2 size={12} />
                                        PostgreSQL Connected
                                    </span>
                                    <span className="flex items-center gap-2 text-blue-500/80">
                                        <Filter size={12} />
                                        Validation Layer Active
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
