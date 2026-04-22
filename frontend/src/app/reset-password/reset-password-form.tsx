"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowLeft, Bot, AlertCircle } from "lucide-react";
import { supabase } from "../../../lib/supabase";

export default function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Check if user has a valid session from the reset link
    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    setError("Invalid or expired reset link. Please request a new password reset.");
                }
            } catch (err) {
                console.error("Error checking session:", err);
            }
        };

        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        const passwordRequirements = [
            newPassword.length >= 8,
            /[A-Z]/.test(newPassword),
            /[a-z]/.test(newPassword),
            /\d/.test(newPassword),
        ];

        if (!passwordRequirements.every(req => req)) {
            setError("Password does not meet requirements");
            return;
        }

        setIsLoading(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) throw updateError;

            setSuccess(true);
            setNewPassword("");
            setConfirmPassword("");

            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset password');
            console.error('Reset password error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const passwordRequirements = [
        { text: "At least 8 characters", met: newPassword.length >= 8 },
        { text: "One uppercase letter", met: /[A-Z]/.test(newPassword) },
        { text: "One lowercase letter", met: /[a-z]/.test(newPassword) },
        { text: "One number", met: /\d/.test(newPassword) },
    ];

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
                    <h1 className="text-3xl font-bold text-white mb-2">Set New Password</h1>
                    <p className="text-gray-400 mb-8">Enter a new password for your account.</p>

                    {success && (
                        <div className="mb-6 p-4 bg-green-900/30 border border-green-600 rounded-lg">
                            <p className="text-green-400 font-medium">Password reset successfully!</p>
                            <p className="text-green-300 text-sm mt-1">Redirecting to login...</p>
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
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    disabled={isLoading || success}
                                    className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading || success}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 disabled:opacity-50"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    id="confirm-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    disabled={isLoading || success}
                                    className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    disabled={isLoading || success}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 disabled:opacity-50"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Password Requirements */}
                        <div className="bg-slate-800 rounded-lg p-4 space-y-2">
                            <p className="text-sm font-medium text-gray-300">Password Requirements:</p>
                            {passwordRequirements.map((req, index) => (
                                <div key={index} className="flex items-center text-sm">
                                    <div className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center ${req.met ? 'bg-green-500' : 'bg-slate-700'}`}>
                                        {req.met && <span className="text-white text-xs">✓</span>}
                                    </div>
                                    <span className={req.met ? 'text-green-400' : 'text-gray-400'}>
                                        {req.text}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || success || !passwordRequirements.every(req => req.met)}
                            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition duration-200 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-400">
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
