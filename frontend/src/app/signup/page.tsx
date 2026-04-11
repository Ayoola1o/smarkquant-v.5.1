"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft, Bot, Check, AlertCircle } from "lucide-react";
import { useAuth } from "../../../lib/auth-context";

export default function SignupPage() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        agreeToTerms: false
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { signup } = useAuth();
    const router = useRouter();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords don't match");
            return;
        }
        if (!formData.agreeToTerms) {
            setError("Please agree to the terms and conditions");
            return;
        }

        const passwordRequirements = [
            formData.password.length >= 8,
            /[A-Z]/.test(formData.password),
            /[a-z]/.test(formData.password),
            /\d/.test(formData.password),
        ];

        if (!passwordRequirements.every(req => req)) {
            setError("Password does not meet requirements");
            return;
        }

        setIsLoading(true);
        try {
            const displayName = `${formData.firstName} ${formData.lastName}`.trim();
            await signup(formData.email, formData.password, displayName);
            // After signup, redirect to login page so user can sign in
            // (Supabase requires email confirmation before full auth)
            setTimeout(() => {
                router.push('/login');
            }, 500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Signup failed');
            console.error('Signup error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const passwordRequirements = [
        { text: "At least 8 characters", met: formData.password.length >= 8 },
        { text: "One uppercase letter", met: /[A-Z]/.test(formData.password) },
        { text: "One lowercase letter", met: /[a-z]/.test(formData.password) },
        { text: "One number", met: /\d/.test(formData.password) },
    ];

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
                            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-full">
                                <Bot size={48} className="text-white" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Join SmarkQuant</h2>
                        <p className="text-lg text-white/80">
                            Start your journey in automated quantitative trading
                        </p>
                    </div>
                </div>
            </div>

            {/* Signup Form Side */}
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
                        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                        <p className="text-slate-400">Join thousands of traders using automated strategies</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="flex items-center p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <AlertCircle size={20} className="text-red-500 mr-3" />
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-slate-300 mb-2">
                                    First Name
                                </label>
                                <input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder="John"
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-slate-300 mb-2">
                                    Last Name
                                </label>
                                <input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="john@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 pr-12 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder="Create a strong password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {formData.password && (
                                <div className="mt-2 space-y-1">
                                    {passwordRequirements.map((req, index) => (
                                        <div key={index} className="flex items-center text-xs">
                                            <Check size={12} className={`mr-2 ${req.met ? "text-green-400" : "text-slate-600"}`} />
                                            <span className={req.met ? "text-green-400" : "text-slate-500"}>
                                                {req.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 pr-12 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder="Confirm your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <input
                                id="agreeToTerms"
                                name="agreeToTerms"
                                type="checkbox"
                                checked={formData.agreeToTerms}
                                onChange={handleInputChange}
                                className="mt-1 w-4 h-4 bg-slate-900 border border-slate-700 rounded text-blue-600 focus:ring-blue-500 focus:ring-2"
                            />
                            <label htmlFor="agreeToTerms" className="ml-3 text-sm text-slate-400">
                                I agree to the{" "}
                                <Link href="/terms" className="text-blue-400 hover:text-blue-300">
                                    Terms of Service
                                </Link>{" "}
                                and{" "}
                                <Link href="/privacy" className="text-blue-400 hover:text-blue-300">
                                    Privacy Policy
                                </Link>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    {/* Sign In Link */}
                    <div className="text-center">
                        <p className="text-slate-400">
                            Already have an account?{" "}
                            <Link
                                href="/login"
                                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}