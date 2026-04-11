"use client";

import { useState, useEffect, useCallback, useId } from "react";
import {
    BookOpen, Trash2, ChevronDown, ChevronUp, TrendingUp, TrendingDown,
    RefreshCw, Filter, BarChart2, Shield, Activity, Target, Pencil, Check, X
} from "lucide-react";
import { toast } from "sonner";

type Session = {
    id: string;
    session_type: string;
    strategy: string;
    symbol: string;
    exchange: string;
    timeframe: string;
    start_date: string;
    end_date: string;
    created_at: string;
    notes: string;
    pnl_value: number;
    pnl_pct: number;
    win_rate: number;
    sharpe_ratio: number;
    smart_sharpe: number;
    sortino_ratio: number;
    smart_sortino: number;
    calmar_ratio: number;
    omega_ratio: number;
    serenity_index: number;
    avg_win_loss: number;
    avg_win: number;
    avg_loss: number;
    total_losing_streak: number;
    largest_losing_trade: number;
    largest_winning_trade: number;
    total_winning_streak: number;
    current_streak: number;
    expectancy: number;
    expectancy_pct: number;
    expected_net_profit: number;
    avg_holding_period: number;
    gross_profit: number;
    gross_loss: number;
    max_drawdown: number;
    total_trades: number;
    total_winning_trades: number;
    total_losing_trades: number;
    starting_balance: number;
    finishing_balance: number;
    longs_count: number;
    longs_percentage: number;
    shorts_percentage: number;
    shorts_count: number;
    fee: number;
    total_open_trades: number;
    open_pl: number;
    equity_curve?: number[];
};

const TYPE_COLORS: Record<string, string> = {
    backtest: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    live: "bg-red-500/10 text-red-400 border-red-500/20",
    paper: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

export default function HistoryPage() {
    const gradientId = useId();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"" | "backtest" | "live" | "paper">("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingNotes, setEditingNotes] = useState<string | null>(null);
    const [notesValue, setNotesValue] = useState("");

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const url = filter ? `/api/history?session_type=${filter}` : `/api/history`;
            const res = await fetch(url);
            const data = await res.json();
            setSessions(data.sessions || []);
        } catch {
            toast.error("Failed to load trading history");
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    const deleteSession = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await fetch(`/api/history/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Session deleted");
                setSessions(prev => prev.filter(s => s.id !== id));
                if (expandedId === id) setExpandedId(null);
            } else {
                toast.error("Failed to delete session");
            }
        } catch {
            toast.error("Connection error");
        } finally {
            setDeletingId(null);
        }
    };

    const saveNotes = async (id: string) => {
        try {
            const res = await fetch(`/api/history/${id}/notes`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes: notesValue }),
            });
            if (res.ok) {
                toast.success("Notes saved");
                setSessions(prev => prev.map(s => s.id === id ? { ...s, notes: notesValue } : s));
                setEditingNotes(null);
            }
        } catch {
            toast.error("Failed to save notes");
        }
    };

    const pnlUp = (s: Session) => s.pnl_value >= 0;

    const counts = {
        all: sessions.length,
        backtest: sessions.filter(s => s.session_type === "backtest").length,
        live: sessions.filter(s => s.session_type === "live").length,
        paper: sessions.filter(s => s.session_type === "paper").length,
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <BookOpen className="text-emerald-400" />
                        Trade History
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Every backtest, live, and paper session — automatically recorded
                    </p>
                </div>
                <button
                    onClick={fetchHistory}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                    title="Refresh"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
            </header>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
                {(["", "backtest", "live", "paper"] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                            filter === t
                                ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-300"
                                : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300"
                        }`}
                    >
                        {t === "" ? `All (${counts.all})` : `${t} (${counts[t]})`}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center text-slate-500 py-20 animate-pulse">Loading history…</div>
            ) : sessions.length === 0 ? (
                <div className="bg-slate-900 border border-dashed border-slate-800 rounded-2xl py-20 flex flex-col items-center gap-3 text-slate-600">
                    <BookOpen size={48} className="opacity-20" />
                    <p className="font-bold">No sessions recorded yet</p>
                    <p className="text-sm text-slate-700">Run a backtest or stop a live bot to auto-save a session here</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sessions.map(s => {
                        const expanded = expandedId === s.id;
                        return (
                            <div
                                key={s.id}
                                className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all ${
                                    expanded ? "border-emerald-500/30" : "border-slate-800 hover:border-slate-700"
                                }`}
                            >
                                {/* Row header */}
                                <div
                                    className="p-5 cursor-pointer flex items-center justify-between gap-4"
                                    onClick={() => setExpandedId(expanded ? null : s.id)}
                                >
                                    <div className="flex items-center gap-3 flex-wrap min-w-0">
                                        {/* Type badge */}
                                        <span className={`text-[10px] px-2 py-0.5 rounded border font-black uppercase ${TYPE_COLORS[s.session_type] || TYPE_COLORS.backtest}`}>
                                            {s.session_type}
                                        </span>
                                        <span className="font-black text-white truncate">{s.strategy || "—"}</span>
                                        <span className="text-slate-500 text-xs">{s.symbol}</span>
                                        {s.exchange && <span className="text-slate-600 text-xs">{s.exchange}</span>}
                                        {s.timeframe && (
                                            <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-purple-400 font-mono font-bold">
                                                {s.timeframe}
                                            </span>
                                        )}
                                        <span className="text-slate-600 text-[10px] font-mono">
                                            {s.start_date} → {s.end_date || "—"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-6 flex-shrink-0">
                                        {/* Quick stats */}
                                        <div className="hidden md:flex items-center gap-6 text-right">
                                            <div>
                                                <p className="text-[9px] text-slate-500 uppercase font-black">P&L</p>
                                                <p className={`text-sm font-black ${pnlUp(s) ? "text-green-400" : "text-red-400"}`}>
                                                    {pnlUp(s) ? "+" : ""}{s.pnl_value?.toFixed(2)} ({pnlUp(s) ? "+" : ""}{(s.pnl_pct ?? 0).toFixed(2)}%)
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-slate-500 uppercase font-black">Win Rate</p>
                                                <p className="text-sm font-black text-white">{((s.win_rate ?? 0) * 100).toFixed(2)}%</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-slate-500 uppercase font-black">Trades</p>
                                                <p className="text-sm font-black text-white">{s.total_trades}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-slate-500 uppercase font-black">Sharpe</p>
                                                <p className="text-sm font-black text-white">{(s.sharpe_ratio ?? 0).toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-slate-500 uppercase font-black">Max DD</p>
                                                <p className="text-sm font-black text-red-400">-{(s.max_drawdown ?? 0).toFixed(2)}%</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={e => { e.stopPropagation(); deleteSession(s.id); }}
                                                disabled={deletingId === s.id}
                                                className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                            {expanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Detail */}
                                {expanded && (
                                    <div className="border-t border-slate-800 bg-slate-950/50">

                                        {/* Section: Performance Metrics */}
                                        <SectionHeader icon={<BarChart2 size={13} />} label="Performance Metrics" />
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-px bg-slate-800">
                                            <MetricCell label="PNL" value={`${pnlUp(s) ? "+" : ""}$${s.pnl_value?.toFixed(2)}`} sub={`${pnlUp(s) ? "+" : ""}${(s.pnl_pct ?? 0).toFixed(2)}%`} accent={pnlUp(s) ? "green" : "red"} />
                                            <MetricCell label="Win Rate" value={`${((s.win_rate ?? 0) * 100).toFixed(2)}%`} />
                                            <MetricCell label="Sharpe Ratio" value={(s.sharpe_ratio ?? 0).toFixed(2)} />
                                            <MetricCell label="Smart Sharpe" value={(s.smart_sharpe ?? 0).toFixed(2)} />
                                            <MetricCell label="Sortino Ratio" value={(s.sortino_ratio ?? 0).toFixed(2)} />
                                            <MetricCell label="Smart Sortino" value={(s.smart_sortino ?? 0).toFixed(2)} />
                                            <MetricCell label="Calmar Ratio" value={(s.calmar_ratio ?? 0).toFixed(2)} />
                                            <MetricCell label="Omega Ratio" value={(s.omega_ratio ?? 0).toFixed(2)} />
                                            <MetricCell label="Serenity Index" value={(s.serenity_index ?? 0).toFixed(2)} />
                                            <MetricCell label="Avg Win/Loss" value={(s.avg_win_loss ?? 0).toFixed(2)} />
                                            <MetricCell label="Average Win" value={`$${(s.avg_win ?? 0).toFixed(2)}`} accent="green" />
                                            <MetricCell label="Average Loss" value={`$${(s.avg_loss ?? 0).toFixed(2)}`} accent="red" />
                                        </div>

                                        {/* Section: Risk Metrics */}
                                        <SectionHeader icon={<Shield size={13} />} label="Risk Metrics" />
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-px bg-slate-800">
                                            <MetricCell label="Total Losing Streak" value={s.total_losing_streak ?? 0} />
                                            <MetricCell label="Largest Losing Trade" value={`$${(s.largest_losing_trade ?? 0).toFixed(2)}`} accent="red" />
                                            <MetricCell label="Largest Winning Trade" value={`$${(s.largest_winning_trade ?? 0).toFixed(2)}`} accent="green" />
                                            <MetricCell label="Total Winning Streak" value={s.total_winning_streak ?? 0} />
                                            <MetricCell label="Current Streak" value={s.current_streak ?? 0} accent={(s.current_streak ?? 0) >= 0 ? "green" : "red"} />
                                            <MetricCell label="Expectancy" value={`$${(s.expectancy ?? 0).toFixed(2)}`} sub={`${(s.expectancy_pct ?? 0).toFixed(2)}%`} />
                                            <MetricCell label="Expected Net Profit" value={`$${(s.expected_net_profit ?? 0).toFixed(2)}`} />
                                            <MetricCell label="Avg Holding Period" value={(s.avg_holding_period ?? 0).toFixed(2)} sub="bars" />
                                            <MetricCell label="Gross Profit" value={`$${(s.gross_profit ?? 0).toFixed(2)}`} accent="green" />
                                            <MetricCell label="Gross Loss" value={`$${(s.gross_loss ?? 0).toFixed(2)}`} accent="red" />
                                            <MetricCell label="Max Drawdown" value={`-${(s.max_drawdown ?? 0).toFixed(2)}%`} accent="red" />
                                        </div>

                                        {/* Section: Trade Metrics */}
                                        <SectionHeader icon={<Target size={13} />} label="Trade Metrics" />
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-px bg-slate-800">
                                            <MetricCell label="Total Trades" value={s.total_trades ?? 0} />
                                            <MetricCell label="Total Winning" value={s.total_winning_trades ?? 0} accent="green" />
                                            <MetricCell label="Total Losing" value={s.total_losing_trades ?? 0} accent="red" />
                                            <MetricCell label="Starting Balance" value={`$${(s.starting_balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                            <MetricCell label="Finishing Balance" value={`$${(s.finishing_balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} accent={s.finishing_balance >= s.starting_balance ? "green" : "red"} />
                                            <MetricCell label="Longs Count" value={s.longs_count ?? 0} />
                                            <MetricCell label="Longs %" value={`${(s.longs_percentage ?? 0).toFixed(2)}%`} />
                                            <MetricCell label="Shorts %" value={`${(s.shorts_percentage ?? 0).toFixed(2)}%`} />
                                            <MetricCell label="Shorts Count" value={s.shorts_count ?? 0} />
                                            <MetricCell label="Fee" value={`$${(s.fee ?? 0).toFixed(2)}`} accent="red" />
                                            <MetricCell label="Total Open Trades" value={s.total_open_trades ?? 0} />
                                            <MetricCell label="Open P&L" value={`$${(s.open_pl ?? 0).toFixed(2)}`} />
                                        </div>

                                        {/* Equity Curve (if available) */}
                                        {s.equity_curve && s.equity_curve.length > 1 && (
                                            <>
                                                <SectionHeader icon={<Activity size={13} />} label="Equity Curve" />
                                                <div className="p-4">
                                                    <MiniEquityCurve data={s.equity_curve} />
                                                </div>
                                            </>
                                        )}

                                        {/* Notes */}
                                        <div className="p-4 border-t border-slate-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notes</p>
                                                {editingNotes !== s.id ? (
                                                    <button
                                                        onClick={() => { setEditingNotes(s.id); setNotesValue(s.notes || ""); }}
                                                        className="text-slate-600 hover:text-slate-400 transition-colors"
                                                    >
                                                        <Pencil size={11} />
                                                    </button>
                                                ) : (
                                                    <div className="flex gap-1">
                                                        <button onClick={() => saveNotes(s.id)} className="text-green-400 hover:text-green-300"><Check size={12} /></button>
                                                        <button onClick={() => setEditingNotes(null)} className="text-slate-500 hover:text-slate-300"><X size={12} /></button>
                                                    </div>
                                                )}
                                            </div>
                                            {editingNotes === s.id ? (
                                                <textarea
                                                    value={notesValue}
                                                    onChange={e => setNotesValue(e.target.value)}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-emerald-500 transition-colors resize-none"
                                                    rows={3}
                                                    placeholder="Add notes about this session…"
                                                />
                                            ) : (
                                                <p className="text-xs text-slate-500 italic">
                                                    {s.notes || "No notes — click the pencil to add some"}
                                                </p>
                                            )}
                                        </div>

                                        {/* Metadata footer */}
                                        <div className="px-4 py-3 bg-slate-900/30 border-t border-slate-800 flex items-center gap-6 text-[10px] text-slate-600 font-mono flex-wrap">
                                            <span>ID: {s.id}</span>
                                            <span>Saved: {new Date(s.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/80 border-t border-slate-800">
            <span className="text-emerald-400">{icon}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        </div>
    );
}

function MetricCell({ label, value, sub, accent }: { label: string; value: any; sub?: string; accent?: string }) {
    const color = accent === "green" ? "text-green-400" : accent === "red" ? "text-red-400" : "text-white";
    return (
        <div className="bg-slate-950 p-3">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-tight">{label}</p>
            <p className={`text-sm font-black ${color}`}>{value}</p>
            {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
        </div>
    );
}

function MiniEquityCurve({ data }: { data: number[] }) {
    const w = 800, h = 80;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * h;
        return `${x},${y}`;
    }).join(" ");
    const start = data[0];
    const end = data[data.length - 1];
    const positive = end >= start;
    const color = positive ? "#4ade80" : "#f87171";
    const gradientId = `fill-${gradientId}`;
    return (
        <div className="w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 80 }}>
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon
                    points={`0,${h} ${pts} ${w},${h}`}
                    fill={`url(#${gradientId})`}
                />
                <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
            </svg>
        </div>
    );
}
