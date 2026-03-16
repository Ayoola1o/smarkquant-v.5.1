"use client";

import { useState, useEffect, useRef } from "react";
import {
    Zap,
    Play,
    Terminal,
    Activity,
    Target,
    Sliders,
    Cpu,
    TrendingUp,
    History,
    AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "2h", "3h", "4h", "6h", "8h", "12h", "1D", "3D", "1W"];

export default function OptimizePage() {
    const [startDate, setStartDate] = useState("2023-01-01");
    const [finishDate, setFinishDate] = useState("2024-01-01");
    const [timeframe, setTimeframe] = useState("4h");
    const [trials, setTrials] = useState(10);
    const [cores, setCores] = useState(2);
    const [status, setStatus] = useState<any>(null);
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let interval: any;
        if (status?.is_running) {
            interval = setInterval(fetchStatus, 2000);
        } else {
            fetchStatus();
        }
        return () => clearInterval(interval);
    }, [status?.is_running]);

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

    const startOptimization = async () => {
        try {
            const res = await fetch("/api/optimize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    start_date: startDate,
                    finish_date: finishDate,
                    optimal_total: trials,
                    cpu_cores: cores
                }),
            });
            if (res.ok) {
                toast.success(`Optimization started — Timeframe: ${timeframe}`);
                fetchStatus();
            } else {
                const err = await res.json();
                toast.error(err.detail || "Failed to start optimization");
            }
        } catch (e) {
            toast.error("Connection error");
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <header>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Zap className="text-yellow-400" />
                            Optimization Engine
                        </h1>
                        <p className="text-slate-400">Discover optimal hyperparameters using Optuna</p>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 rounded-lg text-sm">
                        <Sliders size={16} />
                        <span className="font-bold">Optuna Integration Active</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Configuration Sidebar */}
                <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5 shadow-xl">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">Study Parameters</h2>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date Range</label>
                            <div className="grid grid-cols-1 gap-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-blue-500 transition-colors"
                                />
                                <input
                                    type="date"
                                    value={finishDate}
                                    onChange={(e) => setFinishDate(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Timeframe Selector */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                <Zap size={11} className="text-purple-400" /> Timeframe
                                <span className="ml-auto text-purple-300 font-mono">{timeframe}</span>
                            </label>
                            <div className="grid grid-cols-4 gap-1">
                                {TIMEFRAMES.map(tf => (
                                    <button
                                        key={tf}
                                        onClick={() => setTimeframe(tf)}
                                        className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                            timeframe === tf
                                                ? "bg-purple-600/20 border-purple-500/60 text-purple-300"
                                                : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300"
                                        }`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Target size={14} /> Total Trials
                            </label>
                            <input
                                type="number"
                                value={trials}
                                onChange={(e) => setTrials(parseInt(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-blue-500 transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Cpu size={14} /> CPU Cores
                            </label>
                            <input
                                type="number"
                                value={cores}
                                min={1}
                                max={16}
                                onChange={(e) => setCores(parseInt(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-blue-500 transition-colors"
                            />
                        </div>

                        <button
                            onClick={startOptimization}
                            disabled={status?.is_running}
                            className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-slate-950 font-black rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-yellow-500/10 mt-4 uppercase text-xs tracking-tighter"
                        >
                            <Play size={16} fill="currentColor" />
                            {status?.is_running ? "In Progress..." : "Start Study"}
                        </button>
                    </div>

                    <div className="bg-blue-600/10 border border-blue-600/20 p-5 rounded-2xl">
                        <div className="flex items-center gap-3 mb-3">
                            <AlertTriangle size={20} className="text-blue-400" />
                            <h4 className="font-bold text-blue-400 text-sm">Setup Required</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            Ensure your strategy has a <b>hyperparameters()</b> method defined to expose the search space to Optuna.
                        </p>
                    </div>
                </div>

                {/* Live Monitoring Area */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl flex flex-col h-[600px] overflow-hidden">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <div className="flex items-center gap-2">
                                <Terminal size={16} className="text-slate-500" />
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Optimization Console</h3>
                            </div>
                            {status?.is_running && (
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-slate-500 font-mono">Running for {status.runtime}s</span>
                                    <div className="flex items-center gap-2 px-2 py-1 bg-yellow-500/10 rounded border border-yellow-500/20">
                                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                                        <span className="text-[9px] text-yellow-500 font-black">SOLVING</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] space-y-1 bg-black/20">
                            {status?.logs?.length > 0 ? (
                                status.logs.map((log: string, i: number) => (
                                    <div key={i} className="text-slate-300 leading-relaxed opacity-90 border-l border-slate-800 pl-4">
                                        {log}
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-4">
                                    <History size={48} className="opacity-10" />
                                    <p className="text-sm font-medium">Ready to start optimization study.</p>
                                    <p className="text-xs text-slate-600">Selected timeframe: <span className="text-purple-400 font-mono">{timeframe}</span></p>
                                </div>
                            )}
                            <div ref={logEndRef} />
                        </div>
                        <div className="p-4 bg-slate-900/40 border-t border-slate-800 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active Search</span>
                                    <span className="text-xs text-slate-300">Genetic + Tree-structured Parzen Estimator</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Activity size={14} className="text-green-500" />
                                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wide">Engine: Jesse 0.44.0+</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Best Trial So Far</p>
                                <p className="text-2xl font-black text-white">#0</p>
                            </div>
                            <div className="p-3 bg-yellow-500/10 rounded-xl">
                                <TrendingUp size={24} className="text-yellow-500" />
                            </div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Objective Value</p>
                                <p className="text-2xl font-black text-white">0.00</p>
                            </div>
                            <div className="p-3 bg-blue-600/10 rounded-xl">
                                <Target size={24} className="text-blue-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
