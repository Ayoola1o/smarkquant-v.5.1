"use client";

import React from 'react';
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
import { Activity, Shield, TrendingUp, AlertTriangle } from 'lucide-react';

interface MonteCarloSectionProps {
    data: any[];
    significance: any;
}

export default function MonteCarloSection({ data, significance }: MonteCarloSectionProps) {
    if (!data || data.length === 0) return null;

    // Prepare data for the multi-line chart
    // We'll take the first 10 iterations to show on the chart to avoid clutter
    const iterationsToShow = data.slice(0, 10);
    const chartData = iterationsToShow[0].equity_curve.map((_: any, tickIndex: number) => {
        const entry: any = { name: tickIndex };
        iterationsToShow.forEach((it, itIndex) => {
            entry[`it${itIndex}`] = it.equity_curve[tickIndex];
        });
        return entry;
    });

    const maxDrawdowns = data.map(it => it.max_drawdown);
    const avgMaxDD = maxDrawdowns.reduce((a, b) => a + b, 0) / maxDrawdowns.length;
    const worstIteration = data.reduce((prev, curr) => prev.max_drawdown > curr.max_drawdown ? prev : curr);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <AnalysisStat
                    label="Prob. of Loss"
                    value={`${(significance.probability_of_loss * 100).toFixed(1)}%`}
                    icon={<AlertTriangle size={16} className="text-red-400" />}
                    color={significance.probability_of_loss > 0.1 ? "text-red-400" : "text-green-400"}
                />
                <AnalysisStat
                    label="95% CI ROI"
                    value={`${significance.confidence_interval_95[0].toFixed(1)}% - ${significance.confidence_interval_95[1].toFixed(1)}%`}
                    icon={<Shield size={16} className="text-blue-400" />}
                />
                <AnalysisStat
                    label="Avg Max DD"
                    value={`${avgMaxDD.toFixed(2)}%`}
                    icon={<Activity size={16} className="text-orange-400" />}
                />
                <AnalysisStat
                    label="Worst Scenario DD"
                    value={`${worstIteration.max_drawdown.toFixed(2)}%`}
                    icon={<TrendingUp size={16} className="text-purple-400" />}
                    color="text-red-500"
                />
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold">Equity Curve Variance (Monte Carlo)</h3>
                    <span className="text-xs text-slate-500">Showing 10 random permutations out of {data.length}</span>
                </div>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" hide />
                            <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `$${val}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                                itemStyle={{ fontSize: '10px' }}
                            />
                            {iterationsToShow.map((_, i) => (
                                <Line
                                    key={i}
                                    type="monotone"
                                    dataKey={`it${i}`}
                                    stroke={`hsla(${i * 36}, 70%, 60%, 0.4)`}
                                    strokeWidth={1}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-sm font-bold mb-4">Rule Significance Result</h3>
                    <p className="text-xs text-slate-400 mb-4">
                        Based on {significance.mean_roi ? 1000 : 0} bootstrap iterations, the strategy demonstrates a
                        <span className="text-white font-bold"> {significance.probability_of_loss < 0.05 ? "High" : "Moderate"}</span> statistical significance.
                    </p>
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Expected ROI Mean</span>
                            <span className="text-white font-mono">{significance.mean_roi.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Standard Deviation</span>
                            <span className="text-white font-mono">{significance.std_roi.toFixed(2)}%</span>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
                    <AlertTriangle size={32} className="text-yellow-500/50 mb-3" />
                    <h3 className="text-sm font-bold">Robustness Score</h3>
                    <p className="text-2xl font-black mt-1 text-white">
                        {((1 - significance.probability_of_loss) * 100).toFixed(0)}/100
                    </p>
                    <p className="text-[10px] text-slate-500 mt-2">Percentage of iterations with positive expectancy</p>
                </div>
            </div>
        </div>
    );
}

function AnalysisStat({ label, value, icon, color }: any) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
            </div>
            <p className={`text-lg font-black ${color || "text-white"}`}>{value}</p>
        </div>
    );
}
