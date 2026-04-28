"use client";

import Link from 'next/link';
import { LayoutDashboard, Beaker, Zap, Database, Settings, History, Radio, PieChart, BookOpen, Briefcase, LogOut, Menu, X } from 'lucide-react';
import { useSidebar } from '@/lib/sidebar-context';
import { useEffect, useState } from 'react';

const Sidebar = () => {
    const { isOpen, toggleSidebar } = useSidebar();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const navItems = [
        { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/strategies", icon: Beaker, label: "Strategies" },
        { href: "/backtest", icon: History, label: "Backtest" },
        { href: "/optimize", icon: Zap, label: "Optimize", color: "text-yellow-400" },
        { href: "/live", icon: Radio, label: "Live", color: "text-red-400" },
        { href: "/history", icon: BookOpen, label: "Trade History", color: "text-emerald-400" },
        { href: "/portfolio", icon: Briefcase, label: "Hedge Fund", color: "text-amber-400" },
        { href: "/quant", icon: PieChart, label: "Quant", color: "text-purple-400" },
        { href: "/import", icon: Database, label: "Data" },
        { href: "/settings", icon: Settings, label: "Settings" },
    ];

    return (
        <>
            {/* Mobile Hamburger Button */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={toggleSidebar}
                    className="p-2 bg-slate-900 text-white rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Overlay */}
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-screen bg-slate-900 text-white border-r border-slate-800 p-4 transition-all duration-300 z-40 ${isOpen ? "w-64 translate-x-0" : "-translate-x-full md:translate-x-0 md:w-20"
                    }`}
            >
                <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'} mb-8 ${isOpen ? 'px-2' : ''}`}>
                    {isOpen && (
                        <Link href="/dashboard" className="text-2xl font-bold flex items-center gap-2 hover:opacity-80 transition-opacity overflow-hidden">
                            <img src="/favicon.svg" alt="SmarkQuant" className="w-10 h-10 flex-shrink-0" />
                            <span className="truncate">SmarkQuant</span>
                        </Link>
                    )}
                    <button onClick={toggleSidebar} className="hidden md:flex items-center justify-center p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors">
                        <Menu size={24} />
                    </button>
                </div>

                <nav className="space-y-2 pb-20 overflow-y-auto max-h-[calc(100vh-120px)] overflow-x-hidden">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 p-2 rounded hover:bg-slate-800 transition-colors ${item.color || ""} ${!isOpen ? 'justify-center' : ''}`}
                            onClick={() => isMobile && toggleSidebar()}
                            title={!isOpen ? item.label : undefined}
                        >
                            <item.icon size={20} className="flex-shrink-0" />
                            <span className={`whitespace-nowrap transition-all duration-300 ${!isOpen ? "hidden" : "block"}`}>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="absolute bottom-4 left-4 right-4">
                    <button
                        onClick={() => window.location.href = '/'}
                        className={`w-full flex items-center gap-3 p-2 rounded hover:bg-slate-800 transition-colors text-slate-400 hover:text-white ${!isOpen ? 'justify-center' : ''}`}
                        title={!isOpen ? "Logout" : undefined}
                    >
                        <LogOut size={20} className="flex-shrink-0" />
                        <span className={`${!isOpen ? 'hidden' : 'block'}`}>Logout</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
