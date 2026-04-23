"use client";

import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function PricingPage() {
    const plans = [
        {
            name: "Basic Plan",
            price: "$29",
            period: "/month",
            description: "Perfect for traders just starting with automated trading",
            features: [
                "Up to 3 trading strategies",
                "Backtesting on 1-year historical data",
                "Basic performance metrics",
                "Live trading on 1 exchange",
                "Email support",
                "Data import from Yahoo Finance",
                "Community access",
                "Monthly strategy optimization"
            ],
            cta: "Get Started",
            highlighted: false
        },
        {
            name: "Pro Plan",
            price: "$99",
            period: "/month",
            description: "For serious quantitative traders scaling their operations",
            features: [
                "Unlimited trading strategies",
                "Backtesting on 5-year historical data",
                "Advanced performance analytics",
                "Live trading on 5 exchanges",
                "Priority email & chat support",
                "Data import from multiple sources",
                "Advanced optimization engine",
                "Weekly AI-powered insights",
                "Custom strategy templates",
                "Portfolio hedging tools",
                "Real-time monitoring dashboard",
                "API access"
            ],
            cta: "Start Pro Trial",
            highlighted: true
        },
        {
            name: "Premium Plan",
            price: "$299",
            period: "/month",
            description: "Complete solution for professional trading firms",
            features: [
                "Unlimited strategies & exchanges",
                "Backtesting on 10-year+ historical data",
                "Enterprise-grade analytics",
                "Algorithmic optimization",
                "24/7 dedicated support",
                "Custom data integration",
                "White-label platform option",
                "Machine learning model training",
                "High-frequency trading tools",
                "Multi-portfolio management",
                "Advanced risk management",
                "Custom strategic consulting"
            ],
            cta: "Contact Sales",
            highlighted: false
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-20">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
                        Simple, Transparent <span className="text-blue-400">Pricing</span>
                    </h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                        Choose the perfect plan for your trading needs. All plans include our core features to get you started with automated trading.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`rounded-2xl transition-all duration-300 ${
                                plan.highlighted
                                    ? "bg-gradient-to-br from-blue-600/30 to-purple-600/30 border-2 border-blue-500 shadow-2xl shadow-blue-500/20 scale-105"
                                    : "bg-slate-900/50 border border-slate-800 hover:border-slate-700"
                            } backdrop-blur-sm p-8`}
                        >
                            {plan.highlighted && (
                                <div className="mb-4 inline-block px-4 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
                                    <span className="text-blue-300 text-sm font-semibold">Most Popular</span>
                                </div>
                            )}

                            <h2 className="text-2xl font-bold text-white mb-2">{plan.name}</h2>
                            <p className="text-slate-400 text-sm mb-6">{plan.description}</p>

                            <div className="mb-8">
                                <span className="text-5xl font-bold text-white">{plan.price}</span>
                                <span className="text-slate-400 ml-2">{plan.period}</span>
                            </div>

                            <button
                                className={`w-full py-3 rounded-lg font-semibold mb-8 transition-colors flex items-center justify-center gap-2 ${
                                    plan.highlighted
                                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                                        : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                                }`}
                            >
                                {plan.cta}
                                <ArrowRight size={18} />
                            </button>

                            <div className="space-y-4">
                                {plan.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                        <span className="text-slate-300 text-sm">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Comparison Table */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm mb-16">
                    <div className="p-8">
                        <h2 className="text-3xl font-bold text-white mb-8">Detailed Comparison</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-700">
                                        <th className="text-left py-4 px-4 text-slate-300 font-semibold">Feature</th>
                                        <th className="text-center py-4 px-4 text-slate-300 font-semibold">Basic</th>
                                        <th className="text-center py-4 px-4 text-slate-300 font-semibold">Pro</th>
                                        <th className="text-center py-4 px-4 text-slate-300 font-semibold">Premium</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-700/50">
                                        <td className="py-4 px-4 text-slate-400">Strategies</td>
                                        <td className="text-center py-4 px-4 text-white">3</td>
                                        <td className="text-center py-4 px-4 text-white">Unlimited</td>
                                        <td className="text-center py-4 px-4 text-white">Unlimited</td>
                                    </tr>
                                    <tr className="border-b border-slate-700/50">
                                        <td className="py-4 px-4 text-slate-400">Exchanges</td>
                                        <td className="text-center py-4 px-4 text-white">1</td>
                                        <td className="text-center py-4 px-4 text-white">5</td>
                                        <td className="text-center py-4 px-4 text-white">Unlimited</td>
                                    </tr>
                                    <tr className="border-b border-slate-700/50">
                                        <td className="py-4 px-4 text-slate-400">Backtest History</td>
                                        <td className="text-center py-4 px-4 text-white">1 yr</td>
                                        <td className="text-center py-4 px-4 text-white">5 yrs</td>
                                        <td className="text-center py-4 px-4 text-white">10+ yrs</td>
                                    </tr>
                                    <tr className="border-b border-slate-700/50">
                                        <td className="py-4 px-4 text-slate-400">Support</td>
                                        <td className="text-center py-4 px-4 text-white">Email</td>
                                        <td className="text-center py-4 px-4 text-white">Priority</td>
                                        <td className="text-center py-4 px-4 text-white">24/7 Dedicated</td>
                                    </tr>
                                    <tr className="border-b border-slate-700/50">
                                        <td className="py-4 px-4 text-slate-400">AI Optimization</td>
                                        <td className="text-center py-4 px-4"><span className="text-green-400">✓</span></td>
                                        <td className="text-center py-4 px-4"><span className="text-green-400">✓ Advanced</span></td>
                                        <td className="text-center py-4 px-4"><span className="text-green-400">✓ ML Models</span></td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 px-4 text-slate-400">API Access</td>
                                        <td className="text-center py-4 px-4"><span className="text-red-400">✗</span></td>
                                        <td className="text-center py-4 px-4"><span className="text-green-400">✓</span></td>
                                        <td className="text-center py-4 px-4"><span className="text-green-400">✓</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm mb-16">
                    <h2 className="text-3xl font-bold text-white mb-8">Frequently Asked Questions</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3">Can I change plans anytime?</h3>
                            <p className="text-slate-400">Yes! You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3">Is there a free trial?</h3>
                            <p className="text-slate-400">Yes, we offer a 14-day free trial for all new users. No credit card required to get started.</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3">What payment methods do you accept?</h3>
                            <p className="text-slate-400">We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual plans.</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3">Do you offer annual discounts?</h3>
                            <p className="text-slate-400">Yes! Save up to 20% when you choose annual billing. Contact our sales team for custom enterprise pricing.</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3">Is technical support included?</h3>
                            <p className="text-slate-400">Yes, all plans include support. Basic plans get email support, Pro plans get priority support, and Premium gets 24/7 dedicated support.</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3">Can I export my data?</h3>
                            <p className="text-slate-400">Yes, you always own your data. Export strategies, backtest results, and trading history anytime as CSV or JSON.</p>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-12 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Start Trading Smarter Today</h2>
                    <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
                        Join hundreds of traders who are already using SmarkQuant to automate their strategies and improve their results.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/signup"
                            className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors gap-2"
                        >
                            Start Free Trial
                            <ArrowRight size={18} />
                        </Link>
                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition-colors"
                        >
                            Talk to Sales
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
