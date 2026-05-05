"use client";

import {
    TrendingUp,
    BarChart3
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

interface EquityChartProps {
    results: any;
    equityData: any[];
    displayStrategy: string | null;
    displaySymbol: string;
}

export default function EquityChart({ results, equityData, displayStrategy, displaySymbol }: EquityChartProps) {
    return (
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
    );
}
