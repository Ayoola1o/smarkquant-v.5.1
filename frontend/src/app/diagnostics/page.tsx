"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, AlertTriangle, Loader } from "lucide-react";

export default function DiagnosticsPage() {
  const [supabaseUrl, setSupabaseUrl] = useState<string>("");
  const [supabaseKeyPrefix, setSupabaseKeyPrefix] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "success" | "error" | "idle">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [testResults, setTestResults] = useState<any>(null);
  
  // NEW: State for client-only information
  const [userAgent, setUserAgent] = useState<string>("");

  useEffect(() => {
    // Get configured values
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    
    setSupabaseUrl(url);
    setSupabaseKeyPrefix(key ? `${key.substring(0, 20)}...` : "Not configured");

    // SAFE: Move navigator access inside useEffect
    if (typeof window !== "undefined") {
      setUserAgent(navigator.userAgent);
    }
  }, []);

  const testConnection = async () => {
    setConnectionStatus("checking");
    setErrorMessage("");
    setTestResults(null);

    try {
      const response = await fetch("/api/health/supabase", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      const data = await response.json();
      setTestResults(data);

      if (response.ok) {
        setConnectionStatus("success");
      } else {
        setConnectionStatus("error");
        setErrorMessage(data.message || "Connection failed");
      }
    } catch (error) {
      setConnectionStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Supabase Diagnostics</h1>

        {/* Configuration Status */}
        <div className="bg-slate-900 rounded-lg p-6 mb-6 border border-slate-800">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <AlertTriangle size={24} className="mr-2 text-yellow-500" />
            Configuration Status
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-800 rounded">
              <span>Supabase URL:</span>
              <span className="font-mono text-sm text-green-400">{supabaseUrl || "Not configured"}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800 rounded">
              <span>Supabase Key:</span>
              <span className="font-mono text-sm text-green-400">{supabaseKeyPrefix}</span>
            </div>
          </div>
        </div>

        {/* Connection Test */}
        <div className="bg-slate-900 rounded-lg p-6 mb-6 border border-slate-800">
          <h2 className="text-xl font-semibold mb-4">Connection Test</h2>
          <button
            onClick={testConnection}
            disabled={connectionStatus === "checking"}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
          >
            {connectionStatus === "checking" ? <><Loader size={20} className="animate-spin" /> Testing...</> : "Test Supabase Connection"}
          </button>

          {connectionStatus === "success" && (
            <div className="mt-4 p-4 bg-green-900/30 border border-green-600 rounded-lg flex items-start">
              <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-green-400 font-medium">Connection Successful!</p>
            </div>
          )}

          {connectionStatus === "error" && (
            <div className="mt-4 p-4 bg-red-900/30 border border-red-600 rounded-lg">
              <p className="text-red-400 font-medium">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* System Information */}
        <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
          <h2 className="text-xl font-semibold mb-4">System Information</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-2 bg-slate-800 rounded">
              <span>User Agent:</span>
              {/* DISPLAY THE STATE INSTEAD OF DIRECT NAVIGATOR ACCESS */}
              <span className="font-mono text-xs text-gray-400 text-right">
                {userAgent ? `${userAgent.substring(0, 50)}...` : "Loading..."}
              </span>
            </div>
            <div className="flex justify-between p-2 bg-slate-800 rounded">
              <span>Environment:</span>
              <span className="font-mono text-gray-400">{process.env.NODE_ENV}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}