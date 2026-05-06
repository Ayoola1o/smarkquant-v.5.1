"use client";

import React, { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickData, LineData, CandlestickSeries, LineSeries } from "lightweight-charts";
import { TrendingUp, Maximize2 } from "lucide-react";

interface ProfessionalChartProps {
    results: any;
}

export default function ProfessionalChart({ results }: ProfessionalChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);

    useEffect(() => {
        if (!chartContainerRef.current || !results || !results.charts) return;

        try {
            const chart = createChart(chartContainerRef.current, {
                layout: {
                    background: { type: ColorType.Solid, color: "#0b1224" },
                    textColor: "#94a3b8",
                },
                grid: {
                    vertLines: { color: "#1e293b" },
                    horzLines: { color: "#1e293b" },
                },
                width: chartContainerRef.current.clientWidth,
                height: 400,
                timeScale: {
                    borderColor: "#1e293b",
                    timeVisible: true,
                    secondsVisible: false,
                },
                leftPriceScale: {
                    visible: true,
                },
                localization: {
                    priceFormatter: (price: number) => price.toFixed(2),
                },
            });

            chartRef.current = chart;

            const candlestickSeries = chart.addSeries(CandlestickSeries, {
                upColor: "#22c55e",
                downColor: "#ef4444",
                borderVisible: false,
                wickUpColor: "#22c55e",
                wickDownColor: "#ef4444",
            });

            const equitySeries = chart.addSeries(LineSeries, {
                color: "#3b82f6",
                lineWidth: 2,
                priceScaleId: "left",
            });

            chart.priceScale("left").applyOptions({
                borderColor: "#1e293b",
                visible: true,
                autoScale: true,
            });

            // Clean and validate data before setting
            const processData = (data: any[]) => {
                if (!Array.isArray(data)) return [];
                
                const uniqueTimes = new Set();
                return data
                    .filter(d => d && typeof d === 'object' && d.time !== undefined && d.time !== null)
                    .sort((a, b) => {
                        const tA = typeof a.time === 'string' ? new Date(a.time).getTime() : a.time;
                        const tB = typeof b.time === 'string' ? new Date(b.time).getTime() : b.time;
                        return tA - tB;
                    })
                    .filter(d => {
                        if (uniqueTimes.has(d.time)) return false;
                        uniqueTimes.add(d.time);
                        return true;
                    });
            };

            const candles = processData(results.charts.candles || []);
            const equity = processData(results.charts.equity || []);

            if (candles.length > 0) candlestickSeries.setData(candles as CandlestickData[]);
            if (equity.length > 0) equitySeries.setData(equity as LineData[]);

            // Add trade markers
            if (results.trades && results.trades.length > 0) {
                const markers = results.trades.map((t: any) => ({
                    time: t.entry_time,
                    position: t.side === "long" ? "belowBar" : "aboveBar",
                    color: t.pnl > 0 ? "#22c55e" : "#ef4444",
                    shape: t.side === "long" ? "arrowUp" : "arrowDown",
                    text: `${t.side.toUpperCase()}`,
                }));
                candlestickSeries.setMarkers(markers);
            }

            chart.timeScale().fitContent();

            const handleResize = () => {
                if (chartContainerRef.current) {
                    chart.applyOptions({ width: chartContainerRef.current.clientWidth });
                }
            };

            window.addEventListener("resize", handleResize);

            return () => {
                window.removeEventListener("resize", handleResize);
                chart.remove();
            };
        } catch (error) {
            console.error("Chart initialization failed:", error);
            return () => {};
        }
    }, [results]);

    return (
        <div className="bg-[#0b1224] border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <TrendingUp size={20} className="text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">Interactive Lab Analytics</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                                {results?.symbol || 'mixed'}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 font-bold">
                                {results?.strategy || 'No Strategy'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => chartRef.current?.timeScale().fitContent()}
                        className="p-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
                        title="Fit Content"
                    >
                        <Maximize2 size={16} className="text-slate-400" />
                    </button>
                </div>
            </div>

            <div ref={chartContainerRef} className="w-full relative min-h-[400px]" />

            <div className="mt-4 flex gap-6 text-[11px] text-slate-500 border-t border-slate-800/50 pt-4">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-blue-500"></span>
                    <span>Equity Curve (Left Axis)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 border border-[#22c55e] bg-[#22c55e]/30"></span>
                    <span>Price Candles (Right Axis)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[#22c55e]">▲</span>
                    <span>Trade Entry Points</span>
                </div>
            </div>
        </div>
    );
}
