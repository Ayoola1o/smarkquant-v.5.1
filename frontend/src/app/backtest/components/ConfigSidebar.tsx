"use client";

import {
    Play,
    Cpu,
    Database,
    Globe,
    Zap,
    CheckCircle2,
    ChevronDown,
    Clock,
    Info
} from "lucide-react";
import {
    TIMEFRAMES,
    CRYPTO_SYMBOLS,
    STOCK_SYMBOLS,
    FOREX_SYMBOLS,
    COMMODITY_SYMBOLS,
    INDEX_SYMBOLS
} from "./constants";

interface ConfigSidebarProps {
    startDate: string;
    setStartDate: (v: string) => void;
    finishDate: string;
    setFinishDate: (v: string) => void;
    timeframe: string;
    setTimeframe: (v: string) => void;
    strategy: string;
    setStrategy: (v: string) => void;
    symbol: string;
    setSymbol: (v: string) => void;
    exchange: string;
    setExchange: (v: string) => void;
    assetTab: "imported" | "crypto" | "stocks" | "forex" | "commodities" | "indices";
    setAssetTab: (v: "imported" | "crypto" | "stocks" | "forex" | "commodities" | "indices") => void;
    strategies: string[];
    importedSymbols: { symbol: string; exchange: string; count: number }[];
    runBacktest: () => void;
    isRunning: boolean;
}

export default function ConfigSidebar({
    startDate, setStartDate,
    finishDate, setFinishDate,
    timeframe, setTimeframe,
    strategy, setStrategy,
    symbol, setSymbol,
    exchange, setExchange,
    assetTab, setAssetTab,
    strategies,
    importedSymbols,
    runBacktest,
    isRunning
}: ConfigSidebarProps) {
    const currentAssets = Array.from(new Set(
        assetTab === "imported"
            ? importedSymbols.map(s => s.symbol)
            : assetTab === "crypto" ? CRYPTO_SYMBOLS
                : assetTab === "stocks" ? STOCK_SYMBOLS
                    : assetTab === "forex" ? FOREX_SYMBOLS
                        : assetTab === "commodities" ? COMMODITY_SYMBOLS
                            : INDEX_SYMBOLS
    ));

    return (
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
                    <div className="flex flex-wrap gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
                        {(["imported", "crypto", "stocks", "forex", "commodities", "indices"] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setAssetTab(tab);
                                    if (tab === "imported") setExchange("db");
                                    else if (tab === "crypto" || tab === "stocks") setExchange("alpaca");
                                    else setExchange("yfinance");
                                }}
                                className={`px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all ${assetTab === tab
                                    ? "bg-slate-800 text-white"
                                    : "text-slate-600 hover:text-slate-400"
                                    }`}
                            >
                                {tab === "imported" ? (
                                    <span className="flex items-center justify-center gap-1">
                                        <Database size={10} />
                                        DB
                                    </span>
                                ) : tab}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto pr-1">
                        {currentAssets.length > 0 ? currentAssets.map(s => (
                            <button
                                key={s}
                                onClick={() => setSymbol(s)}
                                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all truncate ${symbol === s
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
                                className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${timeframe === tf
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
                    disabled={isRunning}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-50 text-white text-sm font-black rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl shadow-blue-950/30"
                >
                    {isRunning ? (
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
    );
}
