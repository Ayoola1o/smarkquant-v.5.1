"use client";

import { useState, useEffect } from "react";
import {
    BarChart2,
    GitMerge,
    TrendingUp,
    TrendingDown,
    Layers,
    Info,
    ArrowUpRight,
    Activity,
    Shield,
    Flame,
    Bot,
    DollarSign,
    Target,
    AlertCircle
} from "lucide-react";

interface StrategyMetric {
    name: string;
    bots: any[];
    botCount: number;
    totalPnL: number;
    avgPnLPerBot: number;
    avgWinRate: number;
    [key: string]: any;
}
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    Legend
} from 'recharts';

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
    strategy: string;
    position: string | null;
}

const BENCHMARK_OPTIONS = [
    { value: "multi", label: "All Benchmarks", color: "Multiple" },
    { value: "btc", label: "Bitcoin (BTC)", color: "#f7931a" },
    { value: "eth", label: "Ethereum (ETH)", color: "#627eea" },
    { value: "sp500", label: "S&P 500 Index", color: "#2e5090" },
    { value: "gold", label: "Gold", color: "#d4af37" },
];

export default function QuantPage() {
    const [correlationData, setCorrelationData] = useState<any>(null);
    const [benchmarkData, setBenchmarkData] = useState<any>(null);
    const [bots, setBots] = useState<BotData[]>([]);
    const [portfolioMetrics, setPortfolioMetrics] = useState<any>(null);
    const [strategyMetrics, setStrategyMetrics] = useState<StrategyMetric[]>([]);
    const [riskMetrics, setRiskMetrics] = useState<any>(null);
    const [benchmarkType, setBenchmarkType] = useState("multi");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllData();
        const interval = setInterval(fetchAllData, 10000); // Refresh every 10 seconds
        return () => clearInterval(interval);
    }, [benchmarkType]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchCorrelation(),
                fetchBenchmark(),
                fetchBots(),
                fetchRiskMetrics()
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCorrelation = async () => {
        try {
            const res = await fetch("/api/quant/correlation");
            const data = await res.json();
            setCorrelationData(data);
        } catch (e) {
            console.error("Failed to load correlation data");
        }
    };

    const fetchBenchmark = async () => {
        try {
            const res = await fetch(`/api/quant/benchmark?benchmark_type=${benchmarkType}`);
            const data = await res.json();
            setBenchmarkData(data);
        } catch (e) {
            console.error("Failed to load benchmark data");
        }
    };

    const fetchBots = async () => {
        try {
            const res = await fetch("/api/bots");
            const data = await res.json();
            const botsList = data.bots || [];
            setBots(botsList);
            calculateMetrics(botsList);
        } catch (e) {
            console.error("Failed to load bots data");
        }
    };

    const fetchRiskMetrics = async () => {
        try {
            const res = await fetch("/api/quant/risk-metrics");
            const data = await res.json();
            setRiskMetrics(data);
        } catch (e) {
            console.error("Failed to load risk metrics");
        }
    };

    const calculateMetrics = (botsList: BotData[]) => {
        if (botsList.length === 0) {
            setPortfolioMetrics(null);
            setStrategyMetrics([]);
            return;
        }

        // Portfolio metrics
        const totalEquity = botsList.reduce((sum, b) => sum + b.equity_usd, 0);
        const totalPnL = botsList.reduce((sum, b) => sum + b.pnl_usd, 0);
        const avgPnLPct = botsList.length > 0 ? botsList.reduce((sum, b) => sum + b.pnl_pct, 0) / botsList.length : 0;
        const totalTrades = botsList.reduce((sum, b) => sum + b.trades_count, 0);
        const avgWinRate = botsList.length > 0 ? botsList.reduce((sum, b) => sum + b.win_rate, 0) / botsList.length : 0;
        const activeBots = botsList.filter(b => b.is_running).length;

        setPortfolioMetrics({
            totalEquity,
            totalPnL,
            avgPnLPct,
            totalTrades,
            avgWinRate,
            activeBots,
            totalBots: botsList.length,
            bestBot: botsList.reduce((best, current) => 
                current.pnl_pct > best.pnl_pct ? current : best
            ),
            worstBot: botsList.reduce((worst, current) => 
                current.pnl_pct < worst.pnl_pct ? current : worst
            ),
        });

        // Strategy metrics
        const strategyMap = new Map<string, any>();
        botsList.forEach(bot => {
            if (!strategyMap.has(bot.strategy)) {
                strategyMap.set(bot.strategy, {
                    name: bot.strategy,
                    bots: [],
                    totalPnL: 0,
                    totalTrades: 0,
                    avgWinRate: 0,
                });
            }
            const strategy = strategyMap.get(bot.strategy);
            strategy.bots.push(bot);
            strategy.totalPnL += bot.pnl_usd;
            strategy.totalTrades += bot.trades_count;
            strategy.avgWinRate += bot.win_rate;
        });

        const metrics: any[] = [];
        strategyMap.forEach((value) => {
            metrics.push({
                ...value,
                botCount: value.bots.length,
                avgWinRate: value.avgWinRate / value.bots.length,
                avgPnLPerBot: value.totalPnL / value.bots.length,
            });
        });

        setStrategyMetrics(metrics.sort((a, b) => b.totalPnL - a.totalPnL));
    };

    const getCorrelationColor = (val: number) => {
        if (val === 1) return "bg-slate-800 text-slate-500 opacity-50";
        if (val > 0.7) return "bg-emerald-500/80 text-white font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]";
        if (val > 0.3) return "bg-emerald-500/40 text-emerald-100 border border-emerald-500/30";
        if (val > 0) return "bg-emerald-500/10 text-emerald-200/50";
        if (val < -0.3) return "bg-rose-500/40 text-rose-100 border border-rose-500/30";
        return "bg-slate-950 border border-slate-800 text-slate-500";
    };

    const getRiskProfile = () => {
        if (!portfolioMetrics) return "Unknown";
        const winRate = portfolioMetrics.avgWinRate;
        const pnlPct = portfolioMetrics.avgPnLPct;
        
        if (winRate > 0.55 && pnlPct > 5) return "Aggressive";
        if (winRate > 0.50 && pnlPct > 0) return "Moderate";
        return "Conservative";
    };

    const getRiskColor = (profile: string) => {
        if (profile === "Aggressive") return { bg: "bg-red-500/10", border: "border-red-500/20", icon: "text-red-400", text: "text-red-100" };
        if (profile === "Moderate") return { bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: "text-yellow-400", text: "text-yellow-100" };
        return { bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: "text-emerald-400", text: "text-emerald-100" };
    };

    const riskProfile = getRiskProfile();
    const riskColor = getRiskColor(riskProfile);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-8 space-y-8 max-w-7xl mx-auto selection:bg-purple-500/30">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800/50">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        <BarChart2 className="text-purple-500" size={36} />
                        Quant Intelligence
                    </h1>
                    <p className="text-slate-400 font-medium">Advanced portfolio metrics, systemic risk analysis, and strategy correlation.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 ${riskColor.bg} border ${riskColor.border} rounded-xl flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.05)]`}>
                        <Shield size={20} className={riskColor.icon} />
                        <div>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Risk Profile</p>
                            <p className={`text-sm font-bold ${riskColor.text}`}>{riskProfile}</p>
                        </div>
                    </div>
                    {portfolioMetrics && (
                        <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3 shadow-[0_0_20px_rgba(59,130,246,0.05)]">
                            <Bot size={20} className="text-blue-400" />
                            <div>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Active Bots</p>
                                <p className="text-sm font-bold text-white">{portfolioMetrics.activeBots}/{portfolioMetrics.totalBots}</p>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                {/* Correlation Matrix */}
                <div className="xl:col-span-5 bg-[#0b1224] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[80px] -mr-16 -mt-16 transition-all group-hover:bg-purple-500/10"></div>
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-black flex items-center gap-3 tracking-tight">
                            <GitMerge className="text-purple-400" />
                            Strategy Correlation
                        </h2>
                        <div className="p-2 py-1 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <Info size={14} className="text-purple-400" />
                        </div>
                    </div>

                    {correlationData ? (
                        <div className="overflow-x-auto custom-scrollbar pb-4">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="p-3"></th>
                                        {correlationData.strategies.map((s: string, i: number) => (
                                            <th key={i} className="p-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] writing-vertical-lr text-center h-28 transform rotate-180 transform-gpu transition-colors hover:text-purple-400">
                                                {s}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {correlationData.matrix.map((row: number[], i: number) => (
                                        <tr key={i} className="group/row">
                                            <td className="p-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] text-right whitespace-nowrap group-hover/row:text-white transition-colors">
                                                {correlationData.strategies[i]}
                                            </td>
                                            {row.map((val, j) => (
                                                <td key={j} className="p-1.5 p-gpu">
                                                    <div
                                                        className={`w-14 h-14 flex flex-col items-center justify-center text-[11px] font-bold rounded-xl transition-all hover:scale-105 active:scale-95 cursor-default border ${getCorrelationColor(val)}`}
                                                        title={`${correlationData.strategies[i]} vs ${correlationData.strategies[j]}: ${val}`}
                                                    >
                                                        {val.toFixed(2)}
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="h-80 flex flex-col items-center justify-center text-slate-600 gap-4 animate-pulse">
                            <Activity size={40} className="text-slate-800" />
                            <p className="text-xs font-black tracking-widest uppercase">Calculating Matrix...</p>
                        </div>
                    )}
                </div>

                {/* Alpha Performance Area Chart */}
                <div className="xl:col-span-7 bg-[#0b1224] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 blur-[80px] -ml-16 -mt-16 transition-all group-hover:bg-blue-500/10"></div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="space-y-1">
                            <h2 className="text-xl font-black flex items-center gap-3 tracking-tight">
                                <Flame className="text-orange-500" />
                                Alpha Generation
                            </h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Cumulative Returns vs Benchmarks</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <select 
                                value={benchmarkType}
                                onChange={(e) => setBenchmarkType(e.target.value)}
                                className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 hover:border-slate-600 focus:border-blue-500 outline-none transition-all"
                            >
                                {BENCHMARK_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="text-[10px] font-black uppercase tracking-widest bg-slate-950 px-4 py-3 rounded-xl border border-slate-800/50 mb-6 overflow-x-auto">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></span>
                                <span className="text-slate-300">Active Strategy</span>
                            </div>
                            {benchmarkType === "multi" ? (
                                <>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: "#f7931a"}}></span>
                                        <span className="text-slate-400">Bitcoin</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: "#627eea"}}></span>
                                        <span className="text-slate-400">Ethereum</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: "#2e5090"}}></span>
                                        <span className="text-slate-400">S&P 500</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: "#d4af37"}}></span>
                                        <span className="text-slate-400">Gold</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-500"></span>
                                    <span className="text-slate-500">{BENCHMARK_OPTIONS.find(o => o.value === benchmarkType)?.label}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="h-[350px] w-full">
                        {benchmarkData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={benchmarkData.data}>
                                    <defs>
                                        <linearGradient id="colorStrategy" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                                    <XAxis dataKey="date" hide />
                                    <YAxis
                                        stroke="#475569"
                                        fontSize={10}
                                        fontWeight="bold"
                                        tickFormatter={(val) => `$${val / 1000}k`}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                                        itemStyle={{ fontWeight: 'bold' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="strategy"
                                        stroke="#3b82f6"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorStrategy)"
                                        animationDuration={2000}
                                    />
                                    {benchmarkType === "multi" ? (
                                        <>
                                            <Line
                                                type="monotone"
                                                dataKey="btc"
                                                stroke="#f7931a"
                                                strokeWidth={2}
                                                dot={false}
                                                opacity={0.7}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="eth"
                                                stroke="#627eea"
                                                strokeWidth={2}
                                                dot={false}
                                                opacity={0.7}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="sp500"
                                                stroke="#2e5090"
                                                strokeWidth={2}
                                                dot={false}
                                                opacity={0.7}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="gold"
                                                stroke="#d4af37"
                                                strokeWidth={2}
                                                dot={false}
                                                opacity={0.7}
                                            />
                                        </>
                                    ) : (
                                        <Line
                                            type="monotone"
                                            dataKey="benchmark"
                                            stroke="#64748b"
                                            strokeWidth={2}
                                            strokeDasharray="8 4"
                                            dot={false}
                                            opacity={0.6}
                                        />
                                    )}
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-800 animate-pulse">
                                <Layers size={48} />
                            </div>
                        )}
                    </div>

                    <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800/50 hover:border-emerald-500/20 transition-all hover:bg-slate-900/50 group/stat">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover/stat:text-emerald-400 transition-colors">Total P&L</p>
                            <div className="flex items-end gap-2">
                                <p className={`text-2xl font-black ${portfolioMetrics?.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {portfolioMetrics?.totalPnL >= 0 ? '+' : ''}{portfolioMetrics?.totalPnL.toFixed(2) ?? 0}
                                </p>
                                {portfolioMetrics?.totalPnL >= 0 ? (
                                    <ArrowUpRight size={18} className="text-emerald-400 mb-1" />
                                ) : (
                                    <TrendingDown size={18} className="text-red-400 mb-1" />
                                )}
                            </div>
                        </div>
                        <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800/50 hover:border-blue-500/20 transition-all hover:bg-slate-900/50 group/stat">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover/stat:text-blue-400 transition-colors">Avg Win Rate</p>
                            <div className="flex items-end gap-2">
                                <p className="text-2xl font-black text-white">{(portfolioMetrics?.avgWinRate * 100).toFixed(1)}%</p>
                                <Activity size={18} className="text-blue-400 mb-1 opacity-50" />
                            </div>
                        </div>
                        <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800/50 hover:border-purple-500/20 transition-all hover:bg-slate-900/50 group/stat">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover/stat:text-purple-400 transition-colors">Total Trades</p>
                            <div className="flex items-end gap-2">
                                <p className="text-2xl font-black text-white">{portfolioMetrics?.totalTrades ?? 0}</p>
                                <Target size={18} className="text-purple-400 mb-1 opacity-50" />
                            </div>
                        </div>
                        <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800/50 hover:border-orange-500/20 transition-all hover:bg-slate-900/50 group/stat">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover/stat:text-orange-400 transition-colors">Portfolio Equity</p>
                            <div className="flex items-end gap-2">
                                <p className="text-2xl font-black text-white">${(portfolioMetrics?.totalEquity / 1000).toFixed(1)}k</p>
                                <DollarSign size={18} className="text-orange-400 mb-1 opacity-50" />
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Risk Metrics Dashboard */}
            {riskMetrics && (
                <div className="bg-[#0b1224] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/5 blur-[80px] -ml-16 -mt-16"></div>
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-black flex items-center gap-3 tracking-tight">
                            <Shield className="text-red-400" />
                            Risk Assessment Metrics
                        </h2>
                        <span className={`px-4 py-2 rounded-lg text-xs font-bold ${
                            riskMetrics.risk_level === 'Low' ? 'bg-emerald-500/20 text-emerald-300' :
                            riskMetrics.risk_level === 'Moderate' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                        }`}>
                            {riskMetrics.risk_level} Risk
                        </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800/50 hover:border-blue-500/20 transition-all hover:bg-slate-900/50">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Sharpe Ratio</p>
                            <p className="text-3xl font-black text-blue-400">{riskMetrics.sharpe_ratio ?? 0}</p>
                            <p className="text-xs text-slate-400 mt-1">Risk-adjusted return</p>
                        </div>
                        <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800/50 hover:border-purple-500/20 transition-all hover:bg-slate-900/50">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Sortino Ratio</p>
                            <p className="text-3xl font-black text-purple-400">{riskMetrics.sortino_ratio ?? 0}</p>
                            <p className="text-xs text-slate-400 mt-1">Downside risk focus</p>
                        </div>
                        <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800/50 hover:border-yellow-500/20 transition-all hover:bg-slate-900/50">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Max Drawdown</p>
                            <p className={`text-3xl font-black ${riskMetrics.max_drawdown > -5 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {riskMetrics.max_drawdown ?? 0}%
                            </p>
                            <p className="text-xs text-slate-400 mt-1">Peak-to-trough decline</p>
                        </div>
                        <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800/50 hover:border-emerald-500/20 transition-all hover:bg-slate-900/50">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Profit Factor</p>
                            <p className="text-3xl font-black text-emerald-400">{riskMetrics.profit_factor ?? 0}</p>
                            <p className="text-xs text-slate-400 mt-1">Gross profit / loss</p>
                        </div>
                    </div>
                </div>
            )}

            
            {strategyMetrics && strategyMetrics.length > 0 && (
                <div className="bg-[#0b1224] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/5 blur-[80px] -ml-16 -mt-16"></div>
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-black flex items-center gap-3 tracking-tight">
                            <Bot className="text-cyan-400" />
                            Strategy Performance Breakdown
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Strategy</th>
                                    <th className="px-4 py-3 text-center text-xs font-black text-slate-400 uppercase tracking-widest">Bots</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Total P&L</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Avg/Bot</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Win Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {strategyMetrics.map((s, idx) => (
                                    <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                                        <td className="px-4 py-3 font-bold text-slate-200">{s.name}</td>
                                        <td className="px-4 py-3 text-center text-slate-300">{s.botCount}</td>
                                        <td className={`px-4 py-3 text-right font-bold ${s.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {s.totalPnL >= 0 ? '+' : ''}{s.totalPnL.toFixed(2)}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-bold ${s.avgPnLPerBot >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {s.avgPnLPerBot >= 0 ? '+' : ''}{s.avgPnLPerBot.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-300">{(s.avgWinRate * 100).toFixed(1)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Bot Performance Table */}
            {bots.length > 0 && (
                <div className="bg-[#0b1224] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 blur-[80px] -mr-16 -mt-16"></div>
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-black flex items-center gap-3 tracking-tight">
                            <Activity className="text-pink-400" />
                            Live Bot Performance
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Symbol</th>
                                    <th className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Strategy</th>
                                    <th className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Equity</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-widest">P&L</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-widest">P&L %</th>
                                    <th className="px-4 py-3 text-center text-xs font-black text-slate-400 uppercase tracking-widest">Trades</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Win Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {bots.map((bot) => (
                                    <tr key={bot.id} className="hover:bg-slate-900/30 transition-colors">
                                        <td className="px-4 py-3 font-bold text-slate-200">{bot.symbol}</td>
                                        <td className="px-4 py-3 text-sm text-slate-300">{bot.strategy}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${bot.is_running ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700/20 text-slate-400'}`}>
                                                {bot.is_running ? 'Running' : 'Stopped'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-300">${bot.equity_usd.toFixed(2)}</td>
                                        <td className={`px-4 py-3 text-right font-bold ${bot.pnl_usd >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {bot.pnl_usd >= 0 ? '+' : ''}{bot.pnl_usd.toFixed(2)}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-bold ${bot.pnl_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {bot.pnl_pct >= 0 ? '+' : ''}{bot.pnl_pct.toFixed(2)}%
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-300">{bot.trades_count}</td>
                                        <td className="px-4 py-3 text-right text-slate-300">{(bot.win_rate * 100).toFixed(1)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {bots.length === 0 && !loading && (
                <div className="bg-[#0b1224] border border-slate-800 rounded-3xl p-12 shadow-2xl text-center">
                    <AlertCircle size={40} className="mx-auto text-slate-600 mb-4" />
                    <p className="text-slate-400 font-medium">No active bots. Launch a bot from the Live Trading page to start seeing analytics.</p>
                </div>
            )}

            <footer className="bg-gradient-to-r from-[#0b1224] via-[#0f172a] to-[#0b1224] border border-slate-800/80 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl border border-blue-500/20 shadow-lg">
                        <TrendingUp size={28} className="text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-black text-white text-xl tracking-tight">System Health Analysis</h3>
                        {portfolioMetrics ? (
                            <p className="text-sm text-slate-400 font-medium">
                                {portfolioMetrics.totalBots > 0 
                                    ? `Portfolio with ${portfolioMetrics.totalBots} bot(s) running. Win rate: ${(portfolioMetrics.avgWinRate * 100).toFixed(1)}%, Total trades: ${portfolioMetrics.totalTrades}.`
                                    : "Launch a bot to start monitoring your portfolio health."
                                }
                            </p>
                        ) : (
                            <p className="text-sm text-slate-400 font-medium">Loading system metrics...</p>
                        )}
                    </div>
                </div>
                <button className="px-8 py-3 bg-[#020617] border border-slate-700 hover:border-blue-500 rounded-xl text-xs font-black text-white uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] active:scale-95 relative z-10">
                    Export Risk Report
                </button>
            </footer>

        </div>
    );
}
