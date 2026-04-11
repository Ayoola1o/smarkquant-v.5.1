"use client";

import { useEffect, useState, useRef } from "react";
import { TrendingUp, TrendingDown, Activity, Box, Database, Bot, Zap, CheckCircle, Clock } from "lucide-react";

interface Route {
    exchange: string;
    pair: string;
    timeframe: string;
    strategy: string;
}

interface BotData {
    id: string;
    symbol: string;
    exchange: string;
    currency: string;
    currency_symbol: string;
    amount_native: number;
    equity_usd: number;
    pnl_usd: number;
    pnl_pct: number;
    is_running: boolean;
    trades_count: number;
    win_rate: number;
    position: string | null;
}

interface LogEntry {
    text: string;
    level: "INFO" | "DEBUG" | "WARN" | "ERROR" | "SYSTEM";
    time: string;
}

function parseLogLevel(line: string): LogEntry {
    const timeMatch = line.match(/\[(\d{2}:\d{2}:\d{2})\]/);
    const time = timeMatch ? timeMatch[1] : new Date().toLocaleTimeString("en-GB", { hour12: false });
    let level: LogEntry["level"] = "INFO";
    if (line.includes("ERROR") || line.includes("CRITICAL")) level = "ERROR";
    else if (line.includes("WARN")) level = "WARN";
    else if (line.includes("DEBUG")) level = "DEBUG";
    else if (line.includes("SYSTEM") || line.includes("---")) level = "SYSTEM";
    return { text: line, level, time };
}

function formatCount(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(0) + "k";
    return String(n);
}

const LEVEL_COLOR: Record<LogEntry["level"], string> = {
    INFO: "text-green-400",
    DEBUG: "text-blue-400",
    WARN: "text-yellow-400",
    ERROR: "text-red-400",
    SYSTEM: "text-slate-500",
};

export default function Home() {
    const [strategies, setStrategies] = useState<string[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [candleCount, setCandleCount] = useState<number | null>(null);
    const [bots, setBots] = useState<BotData[]>([]);
    const [activeBots, setActiveBots] = useState<number>(0);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [jesseRunning, setJesseRunning] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [stratRes, routeRes, candleRes, botRes, statusRes] = await Promise.all([
                    fetch("/api/strategies"),
                    fetch("/api/routes"),
                    fetch("/api/candles/stats"),
                    fetch("/api/bots"),
                    fetch("/api/jesse/status"),
                ]);

                if (stratRes.ok) {
                    const d = await stratRes.json();
                    setStrategies(d.strategies || []);
                }
                if (routeRes.ok) {
                    const d = await routeRes.json();
                    setRoutes(d.routes || []);
                }
                if (candleRes.ok) {
                    const d = await candleRes.json();
                    setCandleCount(d.count ?? null);
                }
                if (botRes.ok) {
                    const d = await botRes.json();
                    setBots(d.bots || []);
                    setActiveBots(d.active_count ?? 0);
                }
                if (statusRes.ok) {
                    const d = await statusRes.json();
                    setJesseRunning(d.is_running ?? false);
                    if (d.logs && d.logs.length > 0) {
                        const parsed = (d.logs as string[]).map(parseLogLevel);
                        setLogs(prev => {
                            const combined = [...prev];
                            for (const entry of parsed) {
                                if (!combined.some(e => e.text === entry.text)) {
                                    combined.push(entry);
                                }
                            }
                            return combined.slice(-80);
                        });
                    }
                }
            } catch (_) {}
        };

        fetchAll();
        const interval = setInterval(fetchAll, 3000);
        return () => clearInterval(interval);
    }, []);

    const totalRoutes = routes.length;
    const displayCandles = candleCount !== null ? formatCount(candleCount) : "—";
    const activeStrategiesUsed = routes.length > 0
        ? [...new Set(routes.map(r => r.strategy))]
        : strategies.slice(0, 1);

    return (
        <div className="p-6 space-y-6 min-h-screen">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-slate-400 text-sm mt-1">Real-time trading lab overview</p>
                </div>
                <div className="flex items-center gap-3">
                    {jesseRunning && (
                        <span className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                            Jesse Running
                        </span>
                    )}
                    <span className="px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs flex items-center gap-1.5">
                        <Activity size={13} />
                        System Online
                    </span>
                </div>
            </header>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                        <Box className="text-blue-400" size={20} />
                        <span className="text-xs text-slate-600 font-mono">FR-01</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-1">Active Strategies</p>
                    <p className="text-2xl font-bold text-green-400">
                        {activeStrategiesUsed.length || "—"}
                        {strategies.length > activeStrategiesUsed.length && (
                            <span className="text-base text-slate-500 font-normal ml-1">/ {strategies.length}</span>
                        )}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 truncate">
                        {activeStrategiesUsed.length > 0
                            ? activeStrategiesUsed.slice(0, 2).join(", ") + (activeStrategiesUsed.length > 2 ? ` +${activeStrategiesUsed.length - 2}` : "")
                            : "None in routes"}
                    </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                        <TrendingUp className="text-purple-400" size={20} />
                        <span className="text-xs text-slate-600 font-mono">FR-02</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-1">Routes Configured</p>
                    <p className="text-2xl font-bold text-white">{totalRoutes || "—"}</p>
                    <p className="text-xs text-slate-500 mt-1">
                        {totalRoutes > 0 ? `Across ${[...new Set(routes.map(r => r.exchange))].length} exchange(s)` : "No routes set"}
                    </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                        <Database className="text-orange-400" size={20} />
                        <span className="text-xs text-slate-600 font-mono">FR-03</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-1">Candles Cached</p>
                    <p className="text-2xl font-bold text-white">{displayCandles}</p>
                    <p className="text-xs text-slate-500 mt-1">
                        {candleCount === 0 ? "No data imported" : candleCount !== null ? "In local database" : "Fetching…"}
                    </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                        <Bot className={activeBots > 0 ? "text-green-400" : "text-slate-500"} size={20} />
                        <span className="text-xs text-slate-600 font-mono">FR-04</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-1">Bot Status</p>
                    <p className={`text-2xl font-bold flex items-center gap-2 ${activeBots > 0 ? "text-green-400" : "text-white"}`}>
                        {activeBots > 0 ? `${activeBots} Active` : "Idle"}
                        {activeBots > 0 && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{bots.length} bot(s) total</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Active Strategy List */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold flex items-center gap-2">
                                <Box size={16} className="text-blue-400" />
                                Active Strategies
                            </h2>
                            <span className="text-xs text-slate-500">{strategies.length} loaded</span>
                        </div>
                        {strategies.length === 0 ? (
                            <p className="text-slate-500 text-sm py-4 text-center">No strategies found</p>
                        ) : (
                            <div className="space-y-2">
                                {strategies.map((s, i) => {
                                    const isUsed = routes.some(r => r.strategy === s);
                                    const stratRoutes = routes.filter(r => r.strategy === s);
                                    return (
                                        <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
                                            <div className="flex items-center gap-3">
                                                {isUsed
                                                    ? <CheckCircle size={15} className="text-green-400 flex-shrink-0" />
                                                    : <Clock size={15} className="text-slate-500 flex-shrink-0" />
                                                }
                                                <div>
                                                    <p className="text-sm font-medium text-white">{s}</p>
                                                    {stratRoutes.length > 0 && (
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {stratRoutes.map(r => `${r.pair} ${r.timeframe}`).join(" · ")}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isUsed ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-slate-700 text-slate-400"}`}>
                                                {isUsed ? "In Use" : "Idle"}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Active Routes */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold flex items-center gap-2">
                                <Zap size={16} className="text-purple-400" />
                                Active Routes
                            </h2>
                            <span className="flex items-center gap-1.5 text-xs text-green-400">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                Live
                            </span>
                        </div>
                        {routes.length === 0 ? (
                            <p className="text-slate-500 text-sm py-4 text-center">No routes configured</p>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="text-xs text-slate-500 border-b border-slate-800">
                                    <tr>
                                        <th className="pb-2 font-medium">Exchange</th>
                                        <th className="pb-2 font-medium">Pair</th>
                                        <th className="pb-2 font-medium">Timeframe</th>
                                        <th className="pb-2 font-medium">Strategy</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {routes.map((r, i) => (
                                        <tr key={i} className="border-b border-slate-800/40 last:border-0">
                                            <td className="py-3 text-sm text-slate-300 font-medium">{r.exchange}</td>
                                            <td className="py-3 text-sm text-white font-mono">{r.pair}</td>
                                            <td className="py-3">
                                                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded text-xs font-mono">{r.timeframe}</span>
                                            </td>
                                            <td className="py-3 text-sm text-blue-300">{r.strategy}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Investment / Profit Preview */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold flex items-center gap-2">
                                <TrendingUp size={16} className="text-green-400" />
                                Live Investment Preview
                            </h2>
                            <span className="flex items-center gap-1.5 text-xs text-green-400">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                Updating
                            </span>
                        </div>
                        {bots.length === 0 ? (
                            <div className="py-6 text-center">
                                <p className="text-slate-500 text-sm">No active bots running</p>
                                <p className="text-slate-600 text-xs mt-1">Go to the Live page to start a trading bot</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {bots.map((bot) => {
                                    const isProfit = bot.pnl_usd >= 0;
                                    return (
                                        <div key={bot.id} className={`p-4 rounded-xl border ${isProfit ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{bot.symbol}</p>
                                                    <p className="text-xs text-slate-400">{bot.exchange}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    {bot.is_running && <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />}
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${bot.position === "LONG" ? "bg-green-500/20 text-green-400" : bot.position ? "bg-red-500/20 text-red-400" : "bg-slate-700 text-slate-400"}`}>
                                                        {bot.position ?? "No Position"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <p className="text-slate-500">Investment</p>
                                                    <p className="text-white font-medium">{bot.currency_symbol}{bot.amount_native.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500">Equity</p>
                                                    <p className="text-white font-medium">${bot.equity_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500">P&L</p>
                                                    <p className={`font-semibold ${isProfit ? "text-green-400" : "text-red-400"}`}>
                                                        {isProfit ? "+" : ""}{bot.pnl_usd.toFixed(2)} USD
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500">Return</p>
                                                    <p className={`font-semibold flex items-center gap-1 ${isProfit ? "text-green-400" : "text-red-400"}`}>
                                                        {isProfit ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                                        {isProfit ? "+" : ""}{bot.pnl_pct.toFixed(2)}%
                                                    </p>
                                                </div>
                                            </div>
                                            {bot.trades_count > 0 && (
                                                <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-between text-xs text-slate-500">
                                                    <span>{bot.trades_count} trades</span>
                                                    <span>Win rate: {(bot.win_rate * 100).toFixed(0)}%</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Live Logs */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-base font-semibold flex items-center gap-2">
                                <Activity size={16} className="text-slate-400" />
                                Recent Logs
                            </h2>
                            <span className="flex items-center gap-1.5 text-xs text-orange-400">
                                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
                                Live
                            </span>
                        </div>
                        <div className="h-80 overflow-y-auto space-y-1 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            {logs.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                                    <Activity size={20} />
                                    <p>Waiting for logs…</p>
                                    <p className="text-xs">Run a backtest or import to see output here</p>
                                </div>
                            ) : (
                                logs.map((log, i) => (
                                    <div key={i} className="flex gap-2 leading-relaxed py-0.5">
                                        <span className="text-slate-600 flex-shrink-0">[{log.time}]</span>
                                        <span className={`${LEVEL_COLOR[log.level]} flex-shrink-0`}>{log.level}:</span>
                                        <span className="text-slate-400 break-all">{log.text.replace(/^\[\d{2}:\d{2}:\d{2}\]\s*/, "").replace(/^(INFO|DEBUG|WARN|ERROR|SYSTEM):\s*/, "")}</span>
                                    </div>
                                ))
                            )}
                            <div ref={logsEndRef} />
                        </div>
                    </div>

                    {/* JesseGPT Copilot */}
                    <div className="bg-gradient-to-br from-indigo-600/80 to-purple-700/80 border border-indigo-500/30 rounded-xl p-5 text-white">
                        <h3 className="text-sm font-bold mb-1 flex items-center gap-2">
                            <Zap size={14} />
                            JesseGPT Copilot
                        </h3>
                        <p className="text-xs text-white/70 mb-4">AI-powered strategy writing and DNA string generation.</p>
                        <button className="w-full py-2 bg-white/15 hover:bg-white/25 border border-white/20 rounded-lg text-xs font-medium transition-colors">
                            Open Chat
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}