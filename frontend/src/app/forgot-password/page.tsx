"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../../../lib/auth-context";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const { resetPassword } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!email) {
            setError("Please enter your email address");
            return;
        }

        setIsLoading(true);
        try {
            await resetPassword(email);
            setSuccess(true);
            setEmail("");
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send reset email');
            console.error('Reset password error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Background Image Side */}
            <div className="hidden lg:flex lg:w-1/2 relative">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: "url('/background.jpg')",
                        backgroundColor: "#1e293b"
                    }}
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative z-10 flex items-center justify-center w-full p-12">
                    <div className="text-center text-white">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-full">
                                <Bot size={48} className="text-white" />
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold mb-4">SmarkQuant</h1>
                        <p className="text-xl text-gray-200">Intelligent Algorithmic Trading</p>
                    </div>
                </div>
            </div>

            {/* Form Side */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 bg-white dark:bg-slate-950">
                <Link href="/login" className="flex items-center text-blue-600 hover:text-blue-700 mb-8 w-fit">
                    <ArrowLeft size={20} className="mr-2" />
                    <span>Back to Login</span>
                </Link>

                <div className="max-w-md w-full mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-2">Reset Your Password</h1>
                    <p className="text-gray-400 mb-8">Enter your email address and we'll send you a link to reset your password.</p>

                    {success && (
                        <div className="mb-6 p-4 bg-green-900/30 border border-green-600 rounded-lg flex items-start">
                            <CheckCircle size={20} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-green-400 font-medium">Check your email</p>
                                <p className="text-green-300 text-sm mt-1">We've sent a password reset link to {email}</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-red-900/30 border border-red-600 rounded-lg flex items-start">
                            <AlertCircle size={20} className="text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-red-400 font-medium">Error</p>
                                <p className="text-red-300 text-sm mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                disabled={isLoading || success}
                                className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || success}
                            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition duration-200 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-400">
                            Remember your password?{' '}
                            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                                Back to Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
