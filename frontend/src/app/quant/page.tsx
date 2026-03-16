"use client";

import { useState, useEffect } from "react";
import {
    BarChart2,
    GitMerge,
    TrendingUp,
    Layers,
    Info,
    ArrowUpRight,
    Activity,
    Shield,
    Flame
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

export default function QuantPage() {
    const [correlationData, setCorrelationData] = useState<any>(null);
    const [benchmarkData, setBenchmarkData] = useState<any>(null);

    useEffect(() => {
        fetchCorrelation();
        fetchBenchmark();
    }, []);

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
            const res = await fetch("/api/quant/benchmark");
            const data = await res.json();
            setBenchmarkData(data);
        } catch (e) {
            console.error("Failed to load benchmark data");
        }
    };

    const getCorrelationColor = (val: number) => {
        if (val === 1) return "bg-slate-800 text-slate-500 opacity-50";
        if (val > 0.7) return "bg-emerald-500/80 text-white font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]";
        if (val > 0.3) return "bg-emerald-500/40 text-emerald-100 border border-emerald-500/30";
        if (val > 0) return "bg-emerald-500/10 text-emerald-200/50";
        if (val < -0.3) return "bg-rose-500/40 text-rose-100 border border-rose-500/30";
        return "bg-slate-950 border border-slate-800 text-slate-500";
    };

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
                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                        <Shield size={20} className="text-emerald-400" />
                        <div>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Risk Profile</p>
                            <p className="text-sm font-bold text-white">Conservative</p>
                        </div>
                    </div>
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
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Cumulative Returns vs BTC Benchmark</p>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest bg-slate-950 px-4 py-2 rounded-xl border border-slate-800/50">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></span>
                                <span className="text-slate-300">Active Strategy</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-500"></span>
                                <span className="text-slate-500">BTC INDEX</span>
                            </div>
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
                                    <Line
                                        type="monotone"
                                        dataKey="benchmark"
                                        stroke="#64748b"
                                        strokeWidth={2}
                                        strokeDasharray="8 4"
                                        dot={false}
                                        opacity={0.6}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-800 animate-pulse">
                                <Layers size={48} />
                            </div>
                        )}
                    </div>

                    <div className="mt-8 grid grid-cols-3 gap-6">
                        <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800/50 hover:border-emerald-500/20 transition-all hover:bg-slate-900/50 group/stat">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover/stat:text-emerald-400 transition-colors">Alpha (Annual)</p>
                            <div className="flex items-end gap-2">
                                <p className="text-2xl font-black text-white">+12.4%</p>
                                <ArrowUpRight size={18} className="text-emerald-400 mb-1" />
                            </div>
                        </div>
                        <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800/50 hover:border-blue-500/20 transition-all hover:bg-slate-900/50 group/stat">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover/stat:text-blue-400 transition-colors">Beta vs Market</p>
                            <div className="flex items-end gap-2">
                                <p className="text-2xl font-black text-white">0.85</p>
                                <Activity size={18} className="text-blue-400 mb-1 opacity-50" />
                            </div>
                        </div>
                        <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800/50 hover:border-purple-500/20 transition-all hover:bg-slate-900/50 group/stat">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover/stat:text-purple-400 transition-colors">Sharpe Ratio</p>
                            <div className="flex items-end gap-2">
                                <p className="text-2xl font-black text-white">1.92</p>
                                <Layers size={18} className="text-purple-400 mb-1 opacity-50" />
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <footer className="bg-gradient-to-r from-[#0b1224] via-[#0f172a] to-[#0b1224] border border-slate-800/80 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl border border-blue-500/20 shadow-lg">
                        <TrendingUp size={28} className="text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-black text-white text-xl tracking-tight">Systemic Health Analysis</h3>
                        <p className="text-sm text-slate-400 font-medium">Your strategy ecosystem exhibits low cross-correlation, suggesting superior risk diversification.</p>
                    </div>
                </div>
                <button className="px-8 py-3 bg-[#020617] border border-slate-700 hover:border-blue-500 rounded-xl text-xs font-black text-white uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] active:scale-95 relative z-10">
                    Export Risk Report
                </button>
            </footer>

        </div>
    );
}
