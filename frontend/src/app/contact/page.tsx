"use client";

import Link from "next/link";
import { Mail, MapPin, Phone, Send, Linkedin, Twitter } from "lucide-react";
import { useState } from "react";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
        setTimeout(() => setSubmitted(false), 3000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-20">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
                        Get in <span className="text-blue-400">Touch</span>
                    </h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                        Have questions about SmarkQuant? We'd love to hear from you. Our team is ready to help you revolutionize your trading strategy.
                    </p>
                </div>

                {/* Story Section */}
                <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-slate-700 rounded-2xl p-12 mb-16 backdrop-blur-sm">
                    <h2 className="text-3xl font-bold text-white mb-6">Our Journey</h2>
                    <p className="text-slate-300 leading-relaxed mb-4">
                        SmarkQuant was born from a simple idea: What if traders could harness the power of automation and artificial intelligence to make smarter, faster trading decisions? Our founders struggled with traditional trading platforms that lacked the sophistication needed for serious quantitative traders.
                    </p>
                    <p className="text-slate-300 leading-relaxed mb-4">
                        In 2022, they decided to build SmarkQuant - a platform that combines the robust Jesse Framework with cutting-edge AI optimization. Today, we serve hundreds of traders worldwide who use our platform to backtest strategies, optimize parameters, and execute live trades with confidence.
                    </p>
                    <p className="text-slate-300 leading-relaxed">
                        Our mission is simple: democratize quantitative trading by providing professional-grade tools at accessible prices. Whether you're a seasoned quant trader or just starting your automation journey, SmarkQuant is designed to help you succeed.
                    </p>
                </div>

                {/* Main Content */}
                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                            <div className="flex items-start gap-4">
                                <Mail className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Email</h3>
                                    <p className="text-slate-400">support@smarkquant.com</p>
                                    <p className="text-slate-500 text-sm">Response in 24 hours</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                            <div className="flex items-start gap-4">
                                <MapPin className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Office</h3>
                                    <p className="text-slate-400">San Francisco, CA</p>
                                    <p className="text-slate-500 text-sm">Tech Hub, USA</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                            <div className="flex items-start gap-4">
                                <Phone className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Phone</h3>
                                    <p className="text-slate-400">+1 (555) 123-4567</p>
                                    <p className="text-slate-500 text-sm">Mon-Fri: 9AM - 6PM PST</p>
                                </div>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                            <h3 className="text-lg font-semibold text-white mb-4">Follow Us</h3>
                            <div className="flex gap-3">
                                <a href="#" className="p-3 bg-slate-800 hover:bg-blue-600 rounded-lg transition-colors">
                                    <Linkedin className="w-5 h-5 text-white" />
                                </a>
                                <a href="#" className="p-3 bg-slate-800 hover:bg-blue-600 rounded-lg transition-colors">
                                    <Twitter className="w-5 h-5 text-white" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="md:col-span-2">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 backdrop-blur-sm">
                            <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>
                            
                            {submitted && (
                                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                    <p className="text-green-400">✓ Thank you! We'll get back to you soon.</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Your name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="your@email.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="How can we help?"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Message</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows={6}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Tell us more..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <Send size={18} />
                                    Send Message
                                </button>
                            </form>

                            <p className="text-slate-400 text-sm mt-6">
                                We respect your privacy. Your information will only be used to respond to your inquiry.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-12 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Trading?</h2>
                    <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
                        Explore our pricing plans and start building your quantitative trading strategies today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/pricing"
                            className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                        >
                            View Pricing
                        </Link>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition-colors"
                        >
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
