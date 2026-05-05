"use client";

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, Info } from 'lucide-react';

interface EquityBenchmarkChartProps {
  results: any;
}

export default function EquityBenchmarkChart({ results }: EquityBenchmarkChartProps) {
  if (!results?.charts?.equity) {
    return (
      <div className="bg-[#0b1224] border border-slate-800 rounded-2xl h-[400px] flex flex-col items-center justify-center text-slate-500 gap-3">
        <TrendingUp size={40} className="opacity-20" />
        <p className="font-bold">No Equity Data Available</p>
        <p className="text-[10px] uppercase font-black tracking-widest">Run a backtest to see the equity curve</p>
      </div>
    );
  }

  // Combine strategy and benchmark data for Recharts
  const data = results.charts.equity.map((d: any, i: number) => ({
    time: d.time,
    strategy: d.value,
    benchmark: results.charts.benchmark?.[i]?.value ?? null,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-[#0b1224] border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      {/* Glossy Overlay */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50" />
      
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <TrendingUp size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Cumulative Returns</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {results?.symbol || 'mixed'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 font-bold uppercase tracking-wider">
                Strategy vs Benchmark
              </span>
            </div>
          </div>
        </div>
        
        <div className="hidden md:flex gap-4">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Net Profit</p>
            <p className={`text-sm font-bold ${results.metrics?.net_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {results.metrics?.net_profit?.toFixed(2)}%
            </p>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Drawdown</p>
            <p className="text-sm font-bold text-red-400">
              {results.metrics?.max_drawdown?.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorStrategy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorBenchmark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="time" 
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatDate}
              stroke="#475569"
              fontSize={10}
              tickMargin={10}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              stroke="#475569"
              fontSize={10}
              tickFormatter={formatCurrency}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: '1px solid #1e293b',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#f1f5f9'
              }}
              itemStyle={{ padding: '2px 0' }}
              labelFormatter={(label) => new Date(label * 1000).toLocaleDateString()}
              formatter={(value: number) => [formatCurrency(value), ""]}
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              content={(props) => {
                const { payload } = props;
                return (
                  <div className="flex gap-4 justify-end mb-4">
                    {payload?.map((entry: any, index: number) => (
                      <div key={`item-${index}`} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {entry.value === 'strategy' ? 'SmarkQuant Strategy' : 'Benchmark (Buy & Hold)'}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Area 
              type="monotone" 
              dataKey="benchmark" 
              stroke="#94a3b8" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorBenchmark)" 
              dot={false}
              activeDot={{ r: 4, stroke: '#94a3b8', strokeWidth: 2, fill: '#0f172a' }}
            />
            <Area 
              type="monotone" 
              dataKey="strategy" 
              stroke="#3b82f6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorStrategy)" 
              dot={false}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#0f172a' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex items-center gap-2 text-[10px] text-slate-500 bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
        <Info size={12} className="text-blue-400 shrink-0" />
        <p>
          This chart compares your strategy's cumulative equity against a simple <b>Buy & Hold</b> position in the same asset over the selected period.
        </p>
      </div>
    </div>
  );
}
