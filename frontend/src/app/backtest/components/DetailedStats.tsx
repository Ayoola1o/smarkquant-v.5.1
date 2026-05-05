"use client";

import {
    TrendingUp,
    TrendingDown,
    BarChart3
} from "lucide-react";

interface DetailedStatsProps {
    results: any;
}

export default function DetailedStats({ results }: DetailedStatsProps) {
    if (!results?.metrics) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Performance */}
            <div className="bg-[#0b1224] border border-slate-800 rounded-xl p-5 space-y-3">
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <TrendingUp size={12} /> Performance
                </p>
                {[
                    ["PNL", `$${results.metrics.net_profit_val?.toFixed(2) ?? "--"} (${results.metrics.net_profit?.toFixed(2)}%)`],
                    ["Sharpe Ratio", results.metrics.sharpe_ratio?.toFixed(2) ?? "--"],
                    ["Sortino Ratio", results.metrics.sortino_ratio?.toFixed(2) ?? "--"],
                    ["Calmar Ratio", results.metrics.calmar_ratio?.toFixed(2) ?? "--"],
                    ["Omega Ratio", results.metrics.omega_ratio?.toFixed(2) ?? "--"],
                    ["Expectancy", `$${results.metrics.expectancy?.toFixed(2)} (${results.metrics.expectancy_pct?.toFixed(2)}%)`],
                    ["Avg Holding", `${results.metrics.avg_holding_period?.toFixed(0)} bars`],
                ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                        <span className="text-[11px] text-slate-500">{k}</span>
                        <span className="text-[11px] font-bold text-slate-200">{v}</span>
                    </div>
                ))}
            </div>

            {/* Risk */}
            <div className="bg-[#0b1224] border border-slate-800 rounded-xl p-5 space-y-3">
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <TrendingDown size={12} /> Risk Metrics
                </p>
                {[
                    ["Max Drawdown", `${results.metrics.max_drawdown?.toFixed(2)}%`],
                    ["Largest Win", `$${results.metrics.largest_win?.toFixed(2)}`],
                    ["Largest Loss", `$${results.metrics.largest_loss?.toFixed(2)}`],
                    ["Win Streak", results.metrics.total_winning_streak],
                    ["Loss Streak", results.metrics.total_losing_streak],
                    ["Current Streak", results.metrics.current_streak],
                    ["Fees Paid", `$${results.metrics.fee?.toFixed(2)}`],
                ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                        <span className="text-[11px] text-slate-500">{k}</span>
                        <span className="text-[11px] font-bold text-slate-200">{v}</span>
                    </div>
                ))}
            </div>

            {/* Trade stats */}
            <div className="bg-[#0b1224] border border-slate-800 rounded-xl p-5 space-y-3">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <BarChart3 size={12} /> Trade Stats
                </p>
                {[
                    ["Total Trades", results.metrics.total_trades],
                    ["Winning", results.metrics.winning_trades],
                    ["Losing", results.metrics.losing_trades],
                    ["Avg Win", `$${results.metrics.avg_win?.toFixed(2)}`],
                    ["Avg Loss", `$${results.metrics.avg_loss?.toFixed(2)}`],
                    ["Gross Profit", `$${results.metrics.gross_profit?.toFixed(2)}`],
                    ["Gross Loss", `$${results.metrics.gross_loss?.toFixed(2)}`],
                ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                        <span className="text-[11px] text-slate-500">{k}</span>
                        <span className="text-[11px] font-bold text-slate-200">{v}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
