"use client";

import React, { useState } from 'react';
import { Play, Activity, BarChart2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface OptimizationSectionProps {
    startDate: string;
    finishDate: string;
}

export default function OptimizationSection({ startDate, finishDate }: OptimizationSectionProps) {
    const [nTrials, setNTrials] = useState(10);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizeResults, setOptimizeResults] = useState<any>(null);

    const runOptimization = async () => {
        setIsOptimizing(true);
        setOptimizeResults(null);
        try {
            const res = await fetch("/api/optimize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    start_date: startDate,
                    finish_date: finishDate,
                    n_trials: nTrials
                })
            });
            if (res.ok) {
                toast.success("Optimization started in the background");
                // In a real app we'd poll or use websockets.
                // For this demo, we'll wait a few seconds and try to fetch results.
                setTimeout(fetchOptimizationResults, 5000);
            } else {
                const err = await res.json();
                toast.error(err.detail || "Failed to start optimization");
            }
        } catch (e) {
            toast.error("Connection error");
        } finally {
            // We don't set isOptimizing to false here because it's running in background
        }
    };

    const fetchOptimizationResults = async () => {
        try {
            // This is a simplified fetch - normally we'd have a specific list endpoint
            const res = await fetch("/api/backtest/results");
            const data = await res.json();
            // Look for the latest optimization file
            // Since we don't have a specific endpoint for optimize results yet, 
            // we'll simulate picking the best one if the backend saved it.
            // Placeholder:
            setIsOptimizing(false);
        } catch (e) { }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                <div className="max-w-2xl">
                    <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-3">
                        <Activity className="text-blue-500" /> Parameter Optimizer
                    </h2>
                    <p className="text-slate-400 text-sm mb-6">
                        Find the most profitable parameters for your strategy using grid search.
                        Testing across <span className="text-blue-400 font-bold">Fast SMA [5-30]</span> and <span className="text-purple-400 font-bold">Slow SMA [20-100]</span>.
                    </p>

                    <div className="flex flex-wrap gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Number of Trials</label>
                            <input
                                type="number"
                                value={nTrials}
                                onChange={e => setNTrials(parseInt(e.target.value))}
                                className="w-32 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 transition-all"
                            />
                        </div>
                        <button
                            onClick={runOptimization}
                            disabled={isOptimizing}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                        >
                            {isOptimizing ? <Clock className="animate-spin" size={18} /> : <Play size={18} />}
                            {isOptimizing ? "Optimizing..." : "Start Parameter Sweep"}
                        </button>
                    </div>
                </div>
            </div>

            {isOptimizing && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 flex items-center gap-4 animate-pulse">
                    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <div>
                        <p className="text-blue-400 font-bold">Running Trials...</p>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">Check backend logs for progress</p>
                    </div>
                </div>
            )}

            {!isOptimizing && !optimizeResults && (
                <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl h-64 flex flex-col items-center justify-center text-slate-600 gap-3">
                    <BarChart2 size={40} className="opacity-20" />
                    <p className="font-bold text-sm">No optimization results yet</p>
                    <p className="text-[10px] uppercase font-black tracking-widest">Adjust trials and click start</p>
                </div>
            )}
        </div>
    );
}
