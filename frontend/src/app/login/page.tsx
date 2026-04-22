"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react";
import { useAuth } from "../../../lib/auth-context";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await login(email, password);
            // Small delay to ensure auth state is updated
            setTimeout(() => {
                router.push('/dashboard');
            }, 500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
            console.error('Login error:', err);
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
                        backgroundColor: "#1e293b" // Fallback color
                    }}
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative z-10 flex items-center justify-center w-full p-12">
                    <div className="text-center text-white">
                        <div className="flex justify-center mb-6">
                            <img 
                                src="/logo.svg" 
                                alt="SmarkQuant Logo"
                                className="w-20 h-20 drop-shadow-lg"
                            />
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Welcome Back</h2>
                        <p className="text-lg text-white/80">
                            Access your trading dashboard and manage your automated strategies
                        </p>
                    </div>
                </div>
            </div>

            {/* Login Form Side */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-950">
                <div className="w-full max-w-md space-y-8">
                    {/* Header */}
                    <div className="text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-8"
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            Back to Home
                        </Link>
                        <h1 className="text-3xl font-bold text-white mb-2">Sign In</h1>
                        <p className="text-slate-400">Enter your credentials to access your account</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="flex items-center p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <AlertCircle size={20} className="text-red-500 mr-3" />
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Enter your email"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 pr-12 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 bg-slate-900 border border-slate-700 rounded text-blue-600 focus:ring-blue-500 focus:ring-2"
                                />
                                <span className="ml-2 text-sm text-slate-400">Remember me</span>
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    {/* Sign Up Link */}
                    <div className="text-center">
                        <p className="text-slate-400">
                            Don&apos;t have an account?{" "}
                            <Link
                                href="/signup"
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}