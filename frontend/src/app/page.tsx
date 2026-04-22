"use client";

import Link from "next/link";
import { TrendingUp, Zap, ArrowRight } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
            <div className="max-w-4xl mx-auto text-center">
                {/* Hero Section */}
                <div className="mb-12">
                    <div className="flex justify-center mb-6">
                        <img 
                            src="/logo.svg" 
                            alt="SmarkQuant Logo"
                            className="w-24 h-24 drop-shadow-lg"
                        />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
                        Smark<span className="text-blue-400">Quant</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-300 mb-2">
                        Advanced Quant Trading Platform
                    </p>
                    <p className="text-slate-400 text-lg mb-8">
                        Powered by Jesse Framework & AI Research Extension
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                        <div className="p-3 bg-green-500/10 rounded-lg w-fit mx-auto mb-4">
                            <TrendingUp size={24} className="text-green-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Live Trading</h3>
                        <p className="text-slate-400 text-sm">
                            Execute automated strategies across multiple exchanges with real-time monitoring
                        </p>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                        <div className="p-3 bg-blue-500/10 rounded-lg w-fit mx-auto mb-4">
                            <Zap size={24} className="text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Backtesting</h3>
                        <p className="text-slate-400 text-sm">
                            Test strategies against historical data with detailed performance analytics
                        </p>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                        <div className="p-3 bg-purple-500/10 rounded-lg w-fit mx-auto mb-4">
                            <Zap size={24} className="text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">AI Optimization</h3>
                        <p className="text-slate-400 text-sm">
                            Use AI to optimize parameters and generate new trading strategies
                        </p>
                    </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 gap-2"
                    >
                        Get Started
                        <ArrowRight size={18} />
                    </Link>
                    <Link
                        href="/signup"
                        className="inline-flex items-center justify-center px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition-colors duration-200"
                    >
                        Create Account
                    </Link>
                </div>

                {/* Footer */}
                <div className="mt-16 text-slate-500 text-sm">
                    <p>© 2024 SmarkQuant. Professional trading platform for quantitative strategies.</p>
                </div>
            </div>
        </div>
    );
}
