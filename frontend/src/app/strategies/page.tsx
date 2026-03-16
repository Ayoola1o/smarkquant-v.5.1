"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import { Plus, Save, Trash2, FileCode, Play, Terminal } from "lucide-react";
import { toast } from "sonner";

interface Strategy {
  name: string;
  code: string;
}

export default function StrategiesPage() {
  const router = useRouter();
  const [strategies, setStrategies] = useState<string[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      const res = await fetch("/api/strategies");
      const data = await res.json();
      setStrategies(data.strategies);
      if (data.strategies.length > 0 && !selectedStrategy) {
        loadStrategy(data.strategies[0]);
      }
    } catch (error) {
      console.error("Failed to fetch strategies:", error);
      toast.error("Failed to load strategies");
    } finally {
      setLoading(false);
    }
  };

  const loadStrategy = async (name: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/strategies/${name}`);
      const data = await res.json();
      setSelectedStrategy(name);
      setCode(data.code);
    } catch (error) {
      toast.error("Failed to load strategy content");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedStrategy) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/strategies/${selectedStrategy}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        toast.success("Strategy saved successfully");
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast.error("Error saving strategy");
    } finally {
      setIsSaving(false);
    }
  };

  const createNewStrategy = async () => {
    const name = prompt("Enter strategy name (CamelCase)");
    if (!name) return;

    try {
      const res = await fetch("/api/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        toast.success("Strategy created");
        fetchStrategies();
        loadStrategy(name);
      } else {
        const data = await res.json();
        toast.error(data.detail || "Failed to create strategy");
      }
    } catch (error) {
      toast.error("Error creating strategy");
    }
  };

  const deleteStrategy = async (name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const res = await fetch(`/api/strategies/${name}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Strategy deleted");
        setSelectedStrategy(null);
        setCode("");
        fetchStrategies();
      }
    } catch (error) {
      toast.error("Error deleting strategy");
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-950 text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2">
            <FileCode size={18} className="text-blue-400" />
            Strategies
          </h2>
          <button 
            onClick={createNewStrategy}
            className="p-1.5 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-white"
            title="New Strategy"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {strategies.map((s) => (
            <div
              key={s}
              onClick={() => loadStrategy(s)}
              className={`group flex items-center justify-between p-2 rounded-md cursor-pointer transition-all ${
                selectedStrategy === s 
                  ? "bg-blue-600/20 text-blue-400 border border-blue-600/30" 
                  : "hover:bg-slate-800 text-slate-400 border border-transparent"
              }`}
            >
              <span className="text-sm font-medium truncate">{s}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteStrategy(s);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col">
        <div className="h-14 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-slate-500">
              strategies / {selectedStrategy} / __init__.py
            </span>
            {loading && <span className="text-xs text-blue-400 animate-pulse">Loading...</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving || !selectedStrategy}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
            >
              <Save size={16} />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button 
              onClick={() => { if (selectedStrategy) router.push(`/backtest?strategy=${encodeURIComponent(selectedStrategy)}`); }}
              disabled={!selectedStrategy}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 text-sm font-medium rounded-md transition-colors"
            >
              <Play size={16} className="text-green-400" />
              Quick Backtest
            </button>
          </div>
        </div>

        <div className="flex-1 relative">
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
              fontLigatures: true,
            }}
          />
        </div>

        {/* Console/Output area placeholder */}
        <div className="h-32 border-t border-slate-800 bg-slate-900/50 p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
            <Terminal size={14} />
            Output Console
          </div>
          <div className="font-mono text-xs text-slate-400">
            {selectedStrategy ? `Ready to edit ${selectedStrategy}...` : "Select a strategy to begin."}
          </div>
        </div>
      </div>
    </div>
  );
}
