"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, AlertTriangle, Loader } from "lucide-react";

export default function DiagnosticsPage() {
  const [supabaseUrl, setSupabaseUrl] = useState<string>("");
  const [supabaseKeyPrefix, setSupabaseKeyPrefix] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "success" | "error" | "idle">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    // Get configured values
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    
    setSupabaseUrl(url);
    setSupabaseKeyPrefix(key ? `${key.substring(0, 20)}...` : "Not configured");
  }, []);

  const testConnection = async () => {
    setConnectionStatus("checking");
    setErrorMessage("");
    setTestResults(null);

    try {
      const response = await fetch("/api/health/supabase", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
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
      console.error("Diagnostic test error:", error);
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
              <span className="font-mono text-sm">
                {supabaseUrl ? (
                  <span className="text-green-400">{supabaseUrl}</span>
                ) : (
                  <span className="text-red-400">Not configured</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-800 rounded">
              <span>Supabase Key (hidden):</span>
              <span className="font-mono text-sm">
                {supabaseKeyPrefix !== "Not configured" ? (
                  <span className="text-green-400">{supabaseKeyPrefix}</span>
                ) : (
                  <span className="text-red-400">Not configured</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Connection Test */}
        <div className="bg-slate-900 rounded-lg p-6 mb-6 border border-slate-800">
          <h2 className="text-xl font-semibold mb-4">Connection Test</h2>

          <button
            onClick={testConnection}
            disabled={connectionStatus === "checking"}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition duration-200 flex items-center justify-center gap-2"
          >
            {connectionStatus === "checking" ? (
              <>
                <Loader size={20} className="animate-spin" />
                Testing...
              </>
            ) : (
              "Test Supabase Connection"
            )}
          </button>

          {connectionStatus === "success" && (
            <div className="mt-4 p-4 bg-green-900/30 border border-green-600 rounded-lg flex items-start">
              <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-green-400 font-medium">Connection Successful!</p>
                <p className="text-green-300 text-sm mt-1">Supabase is configured correctly and responding.</p>
              </div>
            </div>
          )}

          {connectionStatus === "error" && (
            <div className="mt-4 p-4 bg-red-900/30 border border-red-600 rounded-lg">
              <div className="flex items-start mb-3">
                <AlertCircle size={24} className="text-red-500 mr-3 mt-0 flex-shrink-0" />
                <div>
                  <p className="text-red-400 font-medium">Connection Failed</p>
                  <p className="text-red-300 text-sm mt-1">{errorMessage}</p>
                </div>
              </div>
              
              <div className="bg-slate-800 p-3 rounded text-sm mt-3">
                <p className="font-mono text-red-200">{JSON.stringify(testResults, null, 2)}</p>
              </div>

              <div className="mt-4 p-3 bg-blue-900/30 border border-blue-600 rounded text-sm">
                <p className="text-blue-300 font-medium mb-2">Troubleshooting Steps:</p>
                <ul className="text-blue-200 space-y-1 list-disc list-inside">
                  <li>Check your internet connection</li>
                  <li>Verify Supabase URL is correct</li>
                  <li>Check if Supabase project is active</li>
                  <li>Verify your API key is not expired</li>
                  <li>Check browser console for CORS errors</li>
                  <li>Try clearing browser cache and reloading</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* System Information */}
        <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
          <h2 className="text-xl font-semibold mb-4">System Information</h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-2 bg-slate-800 rounded">
              <span>User Agent:</span>
              <span className="font-mono text-xs text-gray-400 text-right">{navigator.userAgent.substring(0, 50)}...</span>
            </div>

            <div className="flex justify-between p-2 bg-slate-800 rounded">
              <span>Timezone:</span>
              <span className="font-mono text-gray-400">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
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
