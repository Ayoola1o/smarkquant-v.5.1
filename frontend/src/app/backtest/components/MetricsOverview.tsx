"use client";

interface MetricsOverviewProps {
    results: any;
}

export default function MetricsOverview({ results }: MetricsOverviewProps) {
    const metrics = [
        {
            label: "Net Profit",
            value: (results?.metrics?.performance?.net_profit ?? results?.metrics?.net_profit) != null
                ? `${(results?.metrics?.performance?.net_profit ?? results?.metrics?.net_profit).toFixed(2)}%` : "--",
            sub: (results?.metrics?.performance?.net_profit_val ?? results?.metrics?.net_profit_val) != null
                ? `$${(results?.metrics?.performance?.net_profit_val ?? results?.metrics?.net_profit_val).toLocaleString()}` : "",
            color: (results?.metrics?.performance?.net_profit ?? results?.metrics?.net_profit) >= 0 ? "text-green-400" : "text-red-400",
        },
        {
            label: "Win Rate",
            value: (results?.metrics?.trading_stats?.win_rate ?? results?.metrics?.win_rate) != null
                ? `${((results?.metrics?.trading_stats?.win_rate ?? results?.metrics?.win_rate) * 100).toFixed(1)}%` : "--",
            sub: results?.metrics?.trading_stats
                ? `${results.metrics.trading_stats.winning_trades}W / ${results.metrics.trading_stats.losing_trades}L`
                : (results?.metrics ? `${results.metrics.winning_trades}W / ${results.metrics.losing_trades}L` : ""),
            color: "text-blue-400",
        },
        {
            label: "Max Drawdown",
            value: (results?.metrics?.risk?.max_drawdown ?? results?.metrics?.max_drawdown) != null
                ? `${(results?.metrics?.risk?.max_drawdown ?? results?.metrics?.max_drawdown).toFixed(2)}%` : "--",
            sub: results?.metrics?.performance?.annual_return != null ? `${results.metrics.performance.annual_return.toFixed(2)}% Annual` : "",
            color: "text-red-400",
        },
        {
            label: "Profit Factor",
            value: results?.metrics?.trading_stats?.profit_factor?.toFixed(2) ?? results?.metrics?.profit_factor?.toFixed(2) ?? "--",
            sub: results?.metrics?.performance?.sharpe_ratio != null ? `Sharpe: ${results.metrics.performance.sharpe_ratio.toFixed(2)}` : "",
            color: "text-purple-400",
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((m, i) => (
                <div key={i} className="bg-[#0b1224] border border-slate-800 p-5 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">{m.label}</p>
                    <p className={`text-2xl font-black ${results ? m.color : "text-slate-700"}`}>{m.value}</p>
                    {m.sub && <p className="text-[10px] text-slate-600 mt-1">{m.sub}</p>}
                </div>
            ))}
        </div>
    );
}
