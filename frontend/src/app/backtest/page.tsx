"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    Activity,
    Tag,
    AlertCircle,
    Download,
    FileText,
    TrendingUp
} from "lucide-react";
import { toast } from "sonner";

// Components
import ConfigSidebar from "./components/ConfigSidebar";
import EquityBenchmarkChart from "./components/EquityBenchmarkChart";
import ProfessionalChart from "./components/ProfessionalChart"; // Keeping but will disable if needed
import MetricsOverview from "./components/MetricsOverview";
import DetailedStats from "./components/DetailedStats";
import DrawdownAnalysis from "./components/DrawdownAnalysis";
import TradeLog from "./components/TradeLog";
import EngineLogs from "./components/EngineLogs";
import MonteCarloSection from "@/components/backtest/analysis/MonteCarloSection";
import JesseAdvancedCharts from "./components/JesseAdvancedCharts";
import OptimizationSection from "./components/OptimizationSection";

function BacktestPageInner() {
    const searchParams = useSearchParams();
    const strategyParam = searchParams.get("strategy") || "";

    const [startDate, setStartDate] = useState("2023-01-01");
    const [finishDate, setFinishDate] = useState("2024-01-01");
    const [timeframe, setTimeframe] = useState("4h");
    const [strategy, setStrategy] = useState(strategyParam);
    const [symbol, setSymbol] = useState("BTC-USD");
    const [exchange, setExchange] = useState("yfinance");
    const [assetTab, setAssetTab] = useState<"imported" | "crypto" | "stocks" | "forex" | "commodities" | "indices">("crypto");
    const [mainTab, setMainTab] = useState<"visuals" | "stats" | "analysis" | "optimization" | "logs">("visuals");

    const [strategies, setStrategies] = useState<string[]>([]);
    const [importedSymbols, setImportedSymbols] = useState<{ symbol: string; exchange: string; count: number }[]>([]);

    const [status, setStatus] = useState<any>(null);
    const [results, setResults] = useState<any>(null);
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [lastResultId, setLastResultId] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const logEndRef = useRef<HTMLDivElement>(null);
    const wasRunning = useRef(false);

    useEffect(() => {
        if (strategyParam) setStrategy(strategyParam);
    }, [strategyParam]);

    useEffect(() => {
        fetch("/api/strategies").then(r => r.json()).then(d => setStrategies(d.strategies || []));
        fetch("/api/candles/symbols").then(r => r.json()).then(d => {
            setImportedSymbols(d.symbols || []);
            if (d.symbols?.length > 0) setAssetTab("imported");
        });
        fetchResults();
        fetchStatus();
    }, []);

    useEffect(() => {
        let interval: any;
        if (status?.is_running) {
            wasRunning.current = true;
            interval = setInterval(fetchStatus, 2000);
        } else {
            if (wasRunning.current) {
                if (status?.exit_code !== 0 && status?.exit_code !== null) {
                    toast.error(`Backtest failed (Code ${status.exit_code}). Check logs.`);
                    setMainTab("logs");
                } else {
                    // When finishing successfully, fetch specifically the result from the run that just ended
                    fetchResults(lastResultId || undefined);
                    toast.success("Backtest completed successfully");
                }
            }
            wasRunning.current = false;
        }
        return () => clearInterval(interval);
    }, [status?.is_running, lastResultId]);

    const fetchStatus = async () => {
        try {
            const res = await fetch("/api/jesse/status");
            const data = await res.json();
            setStatus(data);
            if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: "smooth" });
        } catch (e) { }
    };

    const fetchResults = async (id?: string) => {
        setIsRefreshing(true);
        console.log(`[Backtest] Fetching results... ID: ${id || 'latest'}`);
        try {
            const url = id ? `/api/backtest/results?id=${id}` : "/api/backtest/results";
            const res = await fetch(url);
            const data = await res.json();
            console.log("[Backtest] Results received:", data);
            
            if (data.results) {
                setResults(data.results);
                // Trigger auto-analysis if we have results and a result_id
                const resultId = id || data.results.result_id;
                if (resultId) {
                    console.log(`[Backtest] Triggering auto-analysis for: ${resultId}`);
                    fetchAnalysis(resultId);
                }
            } else {
                console.warn("[Backtest] No results found in response");
                if (id) toast.error(`Result ${id} not found`);
            }
        } catch (e) {
            console.error("[Backtest] Failed to load results:", e);
            toast.error("Failed to load backtest results");
        } finally {
            setIsRefreshing(false);
        }
    };

    const fetchAnalysis = async (id: string) => {
        setIsAnalyzing(true);
        console.log(`[Backtest] Fetching analysis for ID: ${id}`);
        try {
            const res = await fetch(`/api/backtest/analysis/${id}`);
            const data = await res.json();
            console.log("[Backtest] Analysis received:", data);
            if (data.monte_carlo) {
                setAnalysisData(data);
            }
        } catch (e) {
            console.error("[Backtest] Analysis error:", e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const runBacktest = async () => {
        setAnalysisData(null); // Clear old analysis
        try {
            const res = await fetch("/api/backtest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    start_date: startDate,
                    finish_date: finishDate,
                    strategy_name: strategy || undefined,
                    symbol: symbol || undefined,
                    exchange: exchange || undefined,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.result_id) setLastResultId(data.result_id);
                toast.success(`Backtest started — ${strategy || "SMA Crossover"} on ${symbol}`);
                fetchStatus();
            } else {
                const err = await res.json();
                toast.error(err.detail || "Failed to start backtest");
            }
        } catch (e) {
            toast.error("Connection error");
        }
    };

    const displayStrategy = results?.strategy_name || results?.strategy || strategy || null;
    const displaySymbol = results?.symbol || symbol;

    const downloadFile = (suffix: string) => {
        if (!results?.filename) return;
        const base = results.filename.replace(".json", "");
        const name = suffix === "json" ? results.filename : `${base}_${suffix}.csv`;
        window.open(`http://localhost:8000/backtest/download?filename=${name}`, "_blank");
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black tracking-widest uppercase">
                        <Activity size={12} /> Backtesting Lab
                    </div>
                    <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                        Strategy Validator
                    </h1>
                    <p className="text-slate-400 max-w-xl text-sm">
                        Validate any strategy against any asset using historical data — independent of your live routes configuration.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <ConfigSidebar
                        startDate={startDate} setStartDate={setStartDate}
                        finishDate={finishDate} setFinishDate={setFinishDate}
                        timeframe={timeframe} setTimeframe={setTimeframe}
                        strategy={strategy} setStrategy={setStrategy}
                        symbol={symbol} setSymbol={setSymbol}
                        exchange={exchange} setExchange={setExchange}
                        assetTab={assetTab} setAssetTab={setAssetTab}
                        strategies={strategies}
                        importedSymbols={importedSymbols}
                        runBacktest={runBacktest}
                        isRunning={status?.is_running}
                    />

                    <div className="lg:col-span-8 space-y-6">
                        {/* Tabs Navigation */}
                        <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-2xl border border-slate-800 w-fit">
                            <button
                                onClick={() => setMainTab("visuals")}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mainTab === "visuals" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-300"}`}
                            >
                                Interactive Chart
                            </button>
                            <button
                                onClick={() => setMainTab("stats")}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mainTab === "stats" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-300"}`}
                            >
                                Full Metrics
                            </button>
                            <button
                                onClick={() => setMainTab("analysis")}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mainTab === "analysis" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-300"}`}
                            >
                                Risk Analysis
                            </button>
                            <button
                                onClick={() => setMainTab("optimization")}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mainTab === "optimization" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-300"}`}
                            >
                                Optimization
                            </button>
                            <button
                                onClick={() => setMainTab("logs")}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mainTab === "logs" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-300"}`}
                            >
                                Logs
                            </button>
                        </div>

                        {mainTab === "visuals" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <EquityBenchmarkChart results={results} />
                                {/* <ProfessionalChart results={results} /> */}
                                {results && (
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={() => downloadFile("trades")}
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-[11px] font-bold text-slate-300 transition-all"
                                        >
                                            <Download size={14} /> Export Trades (CSV)
                                        </button>
                                        <button
                                            onClick={() => downloadFile("equity")}
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-[11px] font-bold text-slate-300 transition-all"
                                        >
                                            <FileText size={14} /> Export Equity Curve (CSV)
                                        </button>
                                        <button
                                            onClick={() => downloadFile("json")}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl border border-blue-500/30 text-[11px] font-bold text-blue-400 transition-all"
                                        >
                                            <Activity size={14} /> Download JSON Report
                                        </button>
                                    </div>
                                )}
                                <MetricsOverview results={results} />
                                <TradeLog results={results} />
                            </div>
                        )}

                        {mainTab === "stats" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <DetailedStats results={results} />
                                <DrawdownAnalysis results={results} />
                                <JesseAdvancedCharts results={results} />
                                <TradeLog results={results} />
                            </div>
                        )}

                        {mainTab === "analysis" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {isAnalyzing ? (
                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl h-96 flex flex-col items-center justify-center gap-4 text-slate-400">
                                        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                        <p className="font-bold">Running Monte Carlo Simulations...</p>
                                        <p className="text-xs text-slate-500">Calculating 100 random permutations & 1000 bootstrap iterations</p>
                                    </div>
                                ) : analysisData ? (
                                    <MonteCarloSection data={analysisData.monte_carlo} significance={analysisData.significance} />
                                ) : (
                                    <div className="bg-slate-900 border border-dashed border-slate-800 rounded-2xl h-96 flex flex-col items-center justify-center gap-3 text-slate-500">
                                        <TrendingUp size={40} className="opacity-20" />
                                        <p className="font-bold">No Analysis Data Available</p>
                                        <p className="text-xs">Run a backtest to generate Monte Carlo and significance reports</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {mainTab === "optimization" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <OptimizationSection startDate={startDate} finishDate={finishDate} />
                            </div>
                        )}

                        {mainTab === "logs" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <EngineLogs
                                    status={status}
                                    isRefreshing={isRefreshing}
                                    fetchResults={fetchResults}
                                    logEndRef={logEndRef}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <EngineLogs
                                status={status}
                                isRefreshing={isRefreshing}
                                fetchResults={fetchResults}
                                logEndRef={logEndRef}
                            />

                            <div className="space-y-4">
                                {results && displayStrategy && (
                                    <div className="bg-[#0b1224] border border-slate-800 rounded-xl p-5 flex items-center gap-4">
                                        <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                            <Tag size={20} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Last Result</p>
                                            <p className="text-base font-bold text-white">{displayStrategy}</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                {results.metrics?.net_profit != null
                                                    ? `Net P&L: ${results.metrics.net_profit.toFixed(2)}% · Win Rate: ${(results.metrics.win_rate * 100).toFixed(1)}% · ${results.metrics.total_trades} trades`
                                                    : "No trades found"}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="bg-blue-600/5 border border-blue-600/20 p-5 rounded-xl">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-blue-600/10 rounded-lg">
                                            <AlertCircle size={16} className="text-blue-400" />
                                        </div>
                                        <h4 className="font-bold text-blue-400 text-sm">Data Check</h4>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Make sure you have imported candles for the selected symbol and date range. Use the <b>Data</b> tab to import. Imported symbols appear in the <b>DB</b> tab above.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function BacktestPage() {
    return (
        <Suspense fallback={<div className="p-8 text-slate-400">Loading...</div>}>
            <BacktestPageInner />
        </Suspense>
    );
}
