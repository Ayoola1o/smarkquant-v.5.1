"use client";

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from 'recharts';
import { Calendar, TrendingDown, BarChart3, PieChart as PieIcon } from 'lucide-react';

interface JesseAdvancedChartsProps {
    results: any;
}

export default function JesseAdvancedCharts({ results }: JesseAdvancedChartsProps) {
    if (!results || !results.metrics) return null;

    const monthly_returns = results.metrics?.monthly_returns || results.monthly_returns || {};
    const worst_drawdowns = results.metrics?.worst_drawdowns || results.metrics?.risk?.worst_drawdowns || [];
    const pnl_distribution = results.metrics?.pnl_distribution || results.metrics?.trading_stats?.pnl_distribution || [];

    // Prepare Monthly Heatmap Data
    const years = Array.from(new Set(Object.keys(monthly_returns || {}).map(k => k.split('-')[0]))).sort();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return (
        <div className="space-y-8">
            {/* Monthly Returns Heatmap */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/10 rounded-xl">
                        <Calendar size={20} className="text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Monthly Returns Heatmap</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr>
                                <th className="p-2 text-left text-slate-500 font-bold uppercase tracking-wider">Year</th>
                                {months.map(m => <th key={m} className="p-2 text-center text-slate-500 font-bold uppercase tracking-wider">{m}</th>)}
                                <th className="p-2 text-center text-slate-400 font-black uppercase tracking-wider bg-slate-800/30">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {years.map(year => {
                                let yearTotal = 0;
                                return (
                                    <tr key={year} className="border-t border-slate-800/50">
                                        <td className="p-2 font-black text-slate-300">{year}</td>
                                        {months.map((m, i) => {
                                            const key = `${year}-${String(i + 1).padStart(2, '0')}`;
                                            const val = monthly_returns[key] || 0;
                                            yearTotal += val;
                                            return (
                                                <td key={m} className="p-1">
                                                    <div
                                                        className={`h-10 flex items-center justify-center rounded-lg font-bold transition-all hover:scale-105 ${val > 0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : val < 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800/20 text-slate-600 border border-slate-800/50'}`}
                                                        style={{ opacity: Math.min(1, Math.abs(val) / 5 + 0.3) }}
                                                        title={`${m} ${year}: ${val.toFixed(2)}%`}
                                                    >
                                                        {val !== 0 ? `${val.toFixed(1)}%` : '-'}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className="p-1">
                                            <div className={`h-10 flex items-center justify-center rounded-lg font-black bg-slate-800/50 ${yearTotal > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {yearTotal.toFixed(1)}%
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* PnL Distribution */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-500/10 rounded-xl">
                            <BarChart3 size={20} className="text-purple-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Trade PnL Distribution</h3>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pnl_distribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="bin" stroke="#64748b" fontSize={10} hide />
                                <YAxis stroke="#64748b" fontSize={10} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff', fontSize: '10px' }}
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {pnl_distribution?.map((entry: any, index: number) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={parseFloat(entry.bin) >= 0 ? '#10b981' : '#ef4444'}
                                            fillOpacity={0.6}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Worst Drawdown Periods */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 text-xs">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-orange-500/10 rounded-xl">
                            <TrendingDown size={20} className="text-orange-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Worst 5 Drawdown Periods</h3>
                    </div>
                    <div className="space-y-3">
                        {worst_drawdowns?.map((dd: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-2xl border border-slate-800 transition-all hover:bg-slate-800/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-500 font-black">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-bold">Tick {dd.start} <span className="opacity-30">→</span> Tick {dd.end}</p>
                                        <p className="text-[10px] text-slate-500">Duration: {dd.duration} candles</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-red-400 font-black text-sm">-{dd.max_dd}%</p>
                                    <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest">Severity</p>
                                </div>
                            </div>
                        ))}
                        {(!worst_drawdowns || worst_drawdowns.length === 0) && (
                            <div className="flex flex-col items-center justify-center h-48 opacity-20">
                                <Shield className="mb-2" size={32} />
                                <p>No significant drawdowns</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Shield({ className, size }: { className?: string, size?: number }) {
    return <TrendingDown size={size || 24} className={className} />;
}
