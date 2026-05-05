"use client";

import { BarChart3 } from "lucide-react";

interface TradeLogProps {
    results: any;
}

export default function TradeLog({ results }: TradeLogProps) {
    if (!results?.trades?.length) return null;

    return (
        <div className="bg-[#0b1224] border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center gap-2">
                <BarChart3 size={14} className="text-slate-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Trade Log</p>
                <span className="ml-auto text-[10px] text-slate-600">{results.trades.length} trades shown</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                    <thead>
                        <tr className="border-b border-slate-800 text-slate-600 uppercase tracking-wider">
                            <th className="px-4 py-2 text-left">#</th>
                            <th className="px-4 py-2 text-left">Side</th>
                            <th className="px-4 py-2 text-right">Entry</th>
                            <th className="px-4 py-2 text-right">Exit</th>
                            <th className="px-4 py-2 text-right">P&L</th>
                            <th className="px-4 py-2 text-right">P&L %</th>
                            <th className="px-4 py-2 text-right">Exit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.trades.slice(0, 50).map((t: any, i: number) => (
                            <tr key={i} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                                <td className="px-4 py-2 text-slate-600">{i + 1}</td>
                                <td className="px-4 py-2">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${t.side === "long" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                                        {t.side || "long"}
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-right text-slate-300">{t.entry?.toLocaleString()}</td>
                                <td className="px-4 py-2 text-right text-slate-300">{t.exit?.toLocaleString()}</td>
                                <td className={`px-4 py-2 text-right font-bold ${t.win ? "text-green-400" : "text-red-400"}`}>
                                    {t.pnl != null ? `$${t.pnl.toFixed(2)}` : "--"}
                                </td>
                                <td className={`px-4 py-2 text-right font-bold ${t.win ? "text-green-400" : "text-red-400"}`}>
                                    {t.pnl_pct?.toFixed(2)}%
                                </td>
                                <td className="px-4 py-2 text-right text-slate-600 text-[10px]">{t.exit_reason || "--"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
