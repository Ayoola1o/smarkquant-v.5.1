"use client";

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea
} from 'recharts';
import { ShieldAlert, Calendar, Clock, ArrowDownCircle } from 'lucide-react';

interface DrawdownAnalysisProps {
  results: any;
}

export default function DrawdownAnalysis({ results }: DrawdownAnalysisProps) {
  if (!results?.charts?.equity || !results?.metrics?.worst_drawdowns) {
    return null;
  }

  // Calculate Drawdown for each point
  let peak = -Infinity;
  const drawdownData = results.charts.equity.map((d: any) => {
    if (d.value > peak) peak = d.value;
    const drawdown = peak > 0 ? ((peak - d.value) / peak) * 100 : 0;
    return {
      time: d.time,
      drawdown: -drawdown, // Negative for charting
      value: d.value
    };
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString(undefined, {
      month: 'short',
      year: '2-digit',
    });
  };

  const worstPeriods = results.metrics.worst_drawdowns;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Drawdown Chart */}
      <div className="lg:col-span-2 bg-[#0b1224] border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
            <ArrowDownCircle size={18} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Drawdown Profile</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-0.5">Underwater Analysis</p>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={drawdownData}>
              <defs>
                <linearGradient id="colorDd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
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
                tickFormatter={(val) => `${val}%`}
                axisLine={false}
                tickLine={false}
                domain={['auto', 0]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
                labelFormatter={(label) => new Date(label * 1000).toLocaleDateString()}
                formatter={(value: number) => [`${Math.abs(value).toFixed(2)}%`, "Drawdown"]}
              />
              
              {/* Highlight worst periods */}
              {worstPeriods.map((p: any, i: number) => (
                <ReferenceArea 
                  key={i}
                  x1={p.start_time} 
                  x2={p.end_time} 
                  fill="#ef4444" 
                  fillOpacity={0.05} 
                  strokeOpacity={0.3}
                />
              ))}

              <Area 
                type="monotone" 
                dataKey="drawdown" 
                stroke="#ef4444" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorDd)" 
                dot={false}
                activeDot={{ r: 4, stroke: '#ef4444', strokeWidth: 2, fill: '#0f172a' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Worst Periods Table */}
      <div className="bg-[#0b1224] border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex items-center gap-2">
          <ShieldAlert size={16} className="text-red-400" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Worst 5 Drawdowns</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {worstPeriods.map((p: any, i: number) => (
            <div key={i} className="p-4 border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors group">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-800 w-5 h-5 flex items-center justify-center rounded">
                    {i + 1}
                  </span>
                  <span className="text-xs font-bold text-red-400">-{p.max_dd.toFixed(2)}%</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                  <Clock size={10} />
                  {p.duration} bars
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-[10px]">
                <div className="flex items-center gap-1 text-slate-400">
                  <Calendar size={10} className="text-slate-600" />
                  {new Date(p.start_time * 1000).toLocaleDateString()}
                </div>
                <span className="text-slate-700">→</span>
                <div className="flex items-center gap-1 text-slate-400">
                  {new Date(p.end_time * 1000).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-red-500/5 mt-auto">
          <p className="text-[9px] text-red-400/60 leading-relaxed italic">
            * Highlighted regions on the chart indicate these maximum drawdown windows.
          </p>
        </div>
      </div>
    </div>
  );
}
