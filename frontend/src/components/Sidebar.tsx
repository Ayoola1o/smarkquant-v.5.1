import Link from 'next/link';
import { LayoutDashboard, Beaker, Zap, Database, Settings, History, Radio, PieChart, BookOpen, Briefcase, LogOut } from 'lucide-react';

const Sidebar = () => {
    return (
        <div className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 p-4 border-r border-slate-800">
            <div className="text-2xl font-bold mb-8 px-2 flex items-center gap-2">
                <Zap className="text-yellow-400" />
                <span>SmarkQuant</span>
            </div>
            <nav className="space-y-2">
                <Link href="/dashboard" className="flex items-center gap-3 p-2 rounded hover:bg-slate-800 transition-colors">
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </Link>
                <Link href="/strategies" className="flex items-center gap-3 p-2 rounded hover:bg-slate-800 transition-colors">
                    <Beaker size={20} />
                    <span>Strategies</span>
                </Link>
                <Link href="/backtest" className="flex items-center gap-3 p-2 rounded hover:bg-slate-800 transition-colors">
                    <History size={20} />
                    <span>Backtest</span>
                </Link>
                <Link href="/optimize" className="flex items-center gap-3 p-2 rounded hover:bg-slate-800 transition-colors">
                    <Zap size={20} className="text-yellow-400" />
                    <span>Optimize</span>
                </Link>
                <Link href="/live" className="flex items-center gap-3 p-2 rounded hover:bg-slate-800 transition-colors text-red-400">
                    <Radio size={20} />
                    <span>Live</span>
                </Link>
                <Link href="/history" className="flex items-center gap-3 p-2 rounded hover:bg-slate-800 transition-colors text-emerald-400">
                    <BookOpen size={20} />
                    <span>Trade History</span>
                </Link>
                <Link href="/portfolio" className="flex items-center gap-3 p-2 rounded hover:bg-slate-800 transition-colors text-amber-400">
                    <Briefcase size={20} />
                    <span>Hedge Fund</span>
                </Link>
                <Link href="/quant" className="flex items-center gap-3 p-2 rounded hover:bg-slate-800 transition-colors text-purple-400">
                    <PieChart size={20} />
                    <span>Quant</span>
                </Link>
                <Link href="/import" className="flex items-center gap-3 p-2 rounded hover:bg-slate-800 transition-colors">
                    <Database size={20} />
                    <span>Data</span>
                </Link>
                <Link href="/settings" className="flex items-center gap-3 p-2 rounded hover:bg-slate-800 transition-colors">
                    <Settings size={20} />
                    <span>Settings</span>
                </Link>
            </nav>
            <div className="absolute bottom-4 left-4 right-4">
                <button
                    onClick={() => window.location.href = '/'}
                    className="w-full flex items-center gap-3 p-2 rounded hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
