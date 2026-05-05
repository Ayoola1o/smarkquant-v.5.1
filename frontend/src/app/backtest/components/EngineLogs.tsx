"use client";

import { Terminal, Download } from "lucide-react";

interface EngineLogsProps {
    status: any;
    isRefreshing: boolean;
    fetchResults: () => void;
    logEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function EngineLogs({ status, isRefreshing, fetchResults, logEndRef }: EngineLogsProps) {
    return (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl flex flex-col overflow-hidden h-[280px]">
            <div className="p-3 border-b border-slate-800 bg-slate-900/40 flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                    <Terminal size={13} /> Engine Logs
                </h3>
                {status?.is_running && (
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                        <span className="text-[9px] text-green-500 font-bold">{status.runtime}s</span>
                    </div>
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1">
                {status?.logs?.length > 0 ? (
                    status.logs.map((log: string, i: number) => (
                        <div key={i} className={`border-l-2 pl-3 leading-relaxed ${log.includes("[ERROR]") ? "border-red-500/40 text-red-400" :
                                log.includes("[OK]") ? "border-green-500/40 text-green-400" :
                                    "border-slate-800 text-slate-500"
                            }`}>
                            {log}
                        </div>
                    ))
                ) : (
                    <div className="text-slate-700 italic text-xs">Logs appear here once a backtest starts...</div>
                )}
                <div ref={logEndRef} />
            </div>
            <div className="p-3 border-t border-slate-800 bg-slate-900/30">
                <button
                    onClick={fetchResults}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 transition-colors"
                >
                    <Download size={12} />
                    {isRefreshing ? "Refreshing..." : "Refresh Results"}
                </button>
            </div>
        </div>
    );
}
