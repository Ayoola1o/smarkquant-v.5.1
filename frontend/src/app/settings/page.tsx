"use client";

import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Save, Settings as SettingsIcon, Share2, Shield, Bell, List } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<"routes.py" | "config.py">("routes.py");
    const [code, setCode] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, [activeTab]);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/configs/${activeTab}`);
            const data = await res.json();
            setCode(data.code);
        } catch (error) {
            toast.error(`Failed to load ${activeTab}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/configs/${activeTab}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });
            if (res.ok) {
                toast.success(`${activeTab} saved successfully`);
            } else {
                throw new Error("Failed to save");
            }
        } catch (error) {
            toast.error(`Error saving ${activeTab}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 space-y-6">
            <header>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <SettingsIcon className="text-slate-400" />
                    Settings & Configuration
                </h1>
                <p className="text-slate-400">Manage your trading routes and system parameters</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Navigation Sidebar */}
                <div className="space-y-2">
                    {[
                        { id: "routes.py", label: "Trading Routes", icon: Share2, desc: "Pairs, Timeframes, Strategies" },
                        { id: "config.py", label: "System Config", icon: SettingsIcon, desc: "API Keys, Database, Exchanges" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${activeTab === tab.id
                                    ? "bg-blue-600/10 border-blue-600/50 text-white"
                                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/50"
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-1">
                                <tab.icon size={20} className={activeTab === tab.id ? "text-blue-400" : "text-slate-500"} />
                                <span className="font-bold">{tab.label}</span>
                            </div>
                            <p className="text-xs opacity-60 ml-8">{tab.desc}</p>
                        </button>
                    ))}

                    <div className="pt-4 px-4">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">System Hygiene</div>
                        <div className="space-y-3 opacity-50 pointer-events-none">
                            <div className="flex items-center gap-3 text-sm text-slate-400"><Shield size={16} /> Security</div>
                            <div className="flex items-center gap-3 text-sm text-slate-400"><Bell size={16} /> Notifications</div>
                            <div className="flex items-center gap-3 text-sm text-slate-400"><List size={16} /> Advanced</div>
                        </div>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="lg:col-span-3 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden min-h-[600px]">
                    <div className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6">
                        <div className="flex items-center gap-4">
                            <span className="px-3 py-1 bg-slate-800 rounded text-xs font-mono text-slate-400 border border-slate-700">
                                {activeTab}
                            </span>
                            {loading && <span className="text-xs text-blue-400 animate-pulse">Fetching from server...</span>}
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || loading}
                            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-blue-600/20"
                        >
                            <Save size={18} />
                            {isSaving ? "Saving..." : "Apply Changes"}
                        </button>
                    </div>

                    <div className="flex-1">
                        <Editor
                            height="100%"
                            defaultLanguage="python"
                            theme="vs-dark"
                            value={code}
                            onChange={(value) => setCode(value || "")}
                            options={{
                                fontSize: 14,
                                minimap: { enabled: true },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: { top: 20 },
                                fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                            }}
                        />
                    </div>

                    <div className="p-4 bg-slate-950/50 text-[11px] text-slate-500 font-mono border-t border-slate-800">
             // Note: Changes to routes.py and config.py require an application restart to take full effect in Jesse.
                    </div>
                </div>
            </div>
        </div>
    );
}
