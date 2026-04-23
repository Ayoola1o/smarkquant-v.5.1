"use client";

import Link from "next/link";
import { TrendingUp, Zap, ArrowRight, BarChart3, Cpu, Users, Award, CheckCircle, ArrowUpRight } from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
    const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

    // Performance metrics from backtest results
    const performanceMetrics = [
        { label: "Average Return", value: "287.5%", change: "+42.3%", icon: "📈" },
        { label: "Sharpe Ratio", value: "2.15", change: "+0.35", icon: "⚡" },
        { label: "Win Rate", value: "68.5%", change: "+12.1%", icon: "🎯" },
        { label: "Max Drawdown", value: "-18.2%", change: "-2.1%", icon: "📊" },
    ];

    const automationSteps = [
        {
            number: 1,
            title: "Strategy Design",
            description: "Create or import your trading strategies with visual strategy builder",
            icon: "🎨",
        },
        {
            number: 2,
            title: "Backtest & Optimize",
            description: "Test against historical data and optimize parameters with AI",
            icon: "🔬",
        },
        {
            number: 3,
            title: "Live Execution",
            description: "Deploy strategies across multiple exchanges automatically",
            icon: "🚀",
        },
        {
            number: 4,
            title: "Monitor & Adjust",
            description: "Real-time monitoring with automatic adjustments and alerts",
            icon: "📡",
        },
    ];

    const features = [
        {
            icon: <Cpu className="w-8 h-8 text-blue-400" />,
            title: "AI-Powered Optimization",
            description: "Machine learning algorithms to optimize your trading strategies automatically",
        },
        {
            icon: <BarChart3 className="w-8 h-8 text-emerald-400" />,
            title: "Advanced Backtesting",
            description: "Comprehensive historical testing with multiple timeframes and assets",
        },
        {
            icon: <Zap className="w-8 h-8 text-yellow-400" />,
            title: "Real-time Execution",
            description: "Execute trades instantly across multiple cryptocurrency exchanges",
        },
        {
            icon: <Users className="w-8 h-8 text-purple-400" />,
            title: "Community Strategies",
            description: "Access and learn from strategies created by top traders",
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 group">
                            <img src="/logo.svg" alt="SmarkQuant" className="w-10 h-10 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-white text-xl">SmarkQuant</span>
                        </Link>
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
                            <a href="#performance" className="text-slate-300 hover:text-white transition-colors">Performance</a>
                            <a href="#automation" className="text-slate-300 hover:text-white transition-colors">How It Works</a>
                            <a href="#about" className="text-slate-300 hover:text-white transition-colors">About</a>
                            <Link href="/pricing" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">Pricing</Link>
                            <Link href="/contact" className="px-4 py-2 border border-slate-700 hover:border-slate-500 text-white rounded-lg transition-colors">Contact</Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <img src="/logo.svg" alt="SmarkQuant" className="w-24 h-24 mb-8 drop-shadow-lg" />
                        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                            Automated Quantitative <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-amber-400">Trading Platform</span>
                        </h1>
                        <p className="text-xl text-slate-300 mb-8">
                            Harness the power of AI and machine learning to automate your trading strategies, backtest with precision, and optimize performance across multiple exchanges.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2">
                                Get Started Free
                                <ArrowRight size={18} />
                            </Link>
                            <Link href="/contact" className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition-colors duration-200">
                                Request Demo
                            </Link>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-3xl"></div>
                        <div className="relative bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-green-400">
                                    <CheckCircle size={20} />
                                    <span>Real-time Strategy Execution</span>
                                </div>
                                <div className="flex items-center gap-3 text-blue-400">
                                    <CheckCircle size={20} />
                                    <span>Advanced Backtesting Engine</span>
                                </div>
                                <div className="flex items-center gap-3 text-purple-400">
                                    <CheckCircle size={20} />
                                    <span>AI Parameter Optimization</span>
                                </div>
                                <div className="flex items-center gap-3 text-amber-400">
                                    <CheckCircle size={20} />
                                    <span>Multi-Exchange Support</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Performance Metrics Section */}
            <section id="performance" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/50 border-y border-slate-800">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-white mb-4">Proven Performance</h2>
                        <p className="text-xl text-slate-400">Real results from our backtesting engine</p>
                    </div>
                    <div className="grid md:grid-cols-4 gap-6">
                        {performanceMetrics.map((metric, index) => (
                            <div key={index} className="bg-slate-900/80 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                                <div className="text-3xl mb-2">{metric.icon}</div>
                                <p className="text-slate-400 text-sm mb-2">{metric.label}</p>
                                <div className="flex items-end justify-between">
                                    <h3 className="text-3xl font-bold text-white">{metric.value}</h3>
                                    <span className="text-green-400 text-sm font-semibold flex items-center gap-1">
                                        <ArrowUpRight size={14} />
                                        {metric.change}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Automation Flow Section */}
            <section id="automation" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-white mb-4">Automation Flow</h2>
                    <p className="text-xl text-slate-400 mb-4">See how your strategies grow from concept to execution</p>
                    <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm font-semibold">
                        4 Simple Steps to Success
                    </div>
                </div>

                <div className="grid md:grid-cols-4 gap-6 relative">
                    {/* Connection Lines */}
                    <div className="hidden md:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-transparent"></div>

                    {automationSteps.map((step, index) => (
                        <div key={index} className="relative">
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-8 text-center hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    {step.number}
                                </div>
                                <div className="text-5xl my-4">{step.icon}</div>
                                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                                <p className="text-slate-400">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50 border-y border-slate-800">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
                        <p className="text-xl text-slate-400">Everything you need to succeed in quantitative trading</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-slate-900/80 border border-slate-700 rounded-xl p-8 hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-slate-600/20">
                                <div className="mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-slate-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Section with Founder */}
            <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-4xl font-bold text-white mb-6">About SmarkQuant</h2>
                        <p className="text-slate-300 mb-4">
                            SmarkQuant is pioneering the future of quantitative trading by combining cutting-edge AI technology with Jesse Framework, the world's leading algorithmic trading platform.
                        </p>
                        <p className="text-slate-300 mb-4">
                            Our mission is to democratize algorithmic trading by making advanced strategies accessible to traders of all experience levels. We believe automation is the future, and we're building the tools to make it happen.
                        </p>
                        <p className="text-slate-300 mb-8">
                            With over 50,000+ backtested strategies and $500M+ in simulated trading volume, SmarkQuant is trusted by traders worldwide.
                        </p>
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                                <div className="text-2xl font-bold text-blue-400">50K+</div>
                                <div className="text-sm text-slate-400">Strategies</div>
                            </div>
                            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                                <div className="text-2xl font-bold text-emerald-400">$500M</div>
                                <div className="text-sm text-slate-400">Simulated Volume</div>
                            </div>
                            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                                <div className="text-2xl font-bold text-purple-400">180+</div>
                                <div className="text-sm text-slate-400">Countries</div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl p-8 border border-slate-700">
                            <img 
                                src="/founder.jpg" 
                                alt="Founder" 
                                className="w-full h-96 object-cover rounded-xl mb-6"
                            />
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Ayoola Oyekunle</h3>
                                <p className="text-blue-400 font-semibold mb-4">Founder & CEO</p>
                                <p className="text-slate-300 text-sm">
                                    Passionate about making quantitative trading accessible. With years of experience in algorithmic trading and machine learning, Ayoola founded SmarkQuant to revolutionize how traders approach strategy development and execution.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">Ready to Automate Your Trading?</h2>
                    <p className="text-xl text-white/90 mb-8">
                        Join thousands of traders using SmarkQuant to optimize their strategies and maximize returns.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/signup" className="px-8 py-4 bg-white hover:bg-slate-100 text-blue-600 font-semibold rounded-lg transition-colors duration-200 inline-flex items-center justify-center gap-2">
                            Start Free Trial
                            <ArrowRight size={18} />
                        </Link>
                        <Link href="/pricing" className="px-8 py-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors duration-200">
                            View Pricing
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8 bg-slate-950">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <img src="/logo.svg" alt="SmarkQuant" className="w-8 h-8" />
                                <span className="font-bold text-white">SmarkQuant</span>
                            </div>
                            <p className="text-slate-400 text-sm">Advanced automation for quantitative trading.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Product</h4>
                            <ul className="space-y-2 text-slate-400 text-sm">
                                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Company</h4>
                            <ul className="space-y-2 text-slate-400 text-sm">
                                <li><Link href="#about" className="hover:text-white transition-colors">About</Link></li>
                                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Legal</h4>
                            <ul className="space-y-2 text-slate-400 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Disclaimer</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
                        <p>© 2026 SmarkQuant. All rights reserved. | Powered by Jesse Framework</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
