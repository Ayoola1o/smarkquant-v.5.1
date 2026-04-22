"use client";

import { useState } from "react";
import { useAuth } from "../../../lib/auth-context";
import { supabase } from "../../../lib/supabase";
import { useProtectedRoute } from "../../../lib/use-protected-route";
import { Eye, EyeOff, Save, Lock, User, Key, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function SettingsPage() {
  useProtectedRoute();

  const { user, userProfile, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "api-keys" | "config">("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    display_name: userProfile?.display_name || "",
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    new_password: "",
    confirm_password: "",
  });

  // API Keys form state
  const [apiKeys, setApiKeys] = useState({
    alpaca_api_key: userProfile?.alpaca_api_key || "",
    alpaca_secret_key: userProfile?.alpaca_secret_key || "",
  });

  const [revealed, setRevealed] = useState({
    alpaca_api_key: false,
    alpaca_secret_key: false,
  });

  // Config editor state
  const [configTab, setConfigTab] = useState<"routes.py" | "config.py">("routes.py");
  const [configCode, setConfigCode] = useState<string>("");
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [showConfigEditor, setShowConfigEditor] = useState(false);

  // Handle config tab change
  const handleConfigTabChange = (tab: "routes.py" | "config.py") => {
    setConfigTab(tab);
    setConfigLoading(true);
    fetch(`/api/configs/${tab}`)
      .then(res => res.json())
      .then(data => setConfigCode(data.code))
      .catch(e => toast.error(`Failed to load ${tab}`))
      .finally(() => setConfigLoading(false));
  };

  // Save config
  const handleConfigSave = async () => {
    setConfigSaving(true);
    try {
      const res = await fetch(`/api/configs/${configTab}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: configCode }),
      });
      if (res.ok) {
        toast.success(`${configTab} saved successfully`);
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast.error(`Error saving ${configTab}`);
    } finally {
      setConfigSaving(false);
    }
  };

  // Profile update handler
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateUserProfile({
        display_name: profileData.display_name,
      });
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Password change handler
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Passwords don't match");
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password,
      });

      if (error) throw error;

      toast.success("Password changed successfully");
      setPasswordData({
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  // API Keys update handler
  const handleApiKeysUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKeys.alpaca_api_key || !apiKeys.alpaca_secret_key) {
      toast.error("Both API key and Secret key are required");
      return;
    }

    setIsLoading(true);

    try {
      await updateUserProfile({
        alpaca_api_key: apiKeys.alpaca_api_key,
        alpaca_secret_key: apiKeys.alpaca_secret_key,
      });
      toast.success("API keys updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update API keys");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Manage your profile, security, API keys, and system configuration</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "profile"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <User size={20} />
            Profile
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "security"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Lock size={20} />
            Security
          </button>
          <button
            onClick={() => setActiveTab("api-keys")}
            className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "api-keys"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Key size={20} />
            API Keys
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "config"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText size={20} />
            Config
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-slate-900 rounded-lg p-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Profile Information</h2>

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-400 focus:outline-none"
                />
                <p className="text-xs text-slate-500 mt-2">Email cannot be changed</p>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profileData.display_name}
                  onChange={(e) =>
                    setProfileData({ ...profileData, display_name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Your display name"
                />
              </div>

              {/* Account Created */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Account Created
                </label>
                <input
                  type="text"
                  value={
                    userProfile?.created_at
                      ? new Date(userProfile.created_at).toLocaleDateString()
                      : "N/A"
                  }
                  disabled
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Save size={20} />
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="bg-slate-900 rounded-lg p-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Change Password</h2>

            <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.new_password}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, new_password: e.target.value })
                    }
                    className="w-full px-4 py-3 pr-12 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Must be at least 8 characters long
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirm_password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirm_password: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 pr-12 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Lock size={20} />
                {isLoading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === "api-keys" && (
          <div className="bg-slate-900 rounded-lg p-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-2">Alpaca API Keys</h2>
            <p className="text-slate-400 mb-6">
              Manage your Alpaca API credentials for trading operations
            </p>

            <form onSubmit={handleApiKeysUpdate} className="space-y-6 max-w-2xl">
              {/* Alpaca API Key */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Alpaca API Key
                </label>
                <div className="relative">
                  <input
                    type={revealed.alpaca_api_key ? "text" : "password"}
                    value={apiKeys.alpaca_api_key}
                    onChange={(e) =>
                      setApiKeys({ ...apiKeys, alpaca_api_key: e.target.value })
                    }
                    className="w-full px-4 py-3 pr-12 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter your Alpaca API key"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setRevealed({
                        ...revealed,
                        alpaca_api_key: !revealed.alpaca_api_key,
                      })
                    }
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {revealed.alpaca_api_key ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Your public API key from Alpaca
                </p>
              </div>

              {/* Alpaca Secret Key */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Alpaca Secret Key
                </label>
                <div className="relative">
                  <input
                    type={revealed.alpaca_secret_key ? "text" : "password"}
                    value={apiKeys.alpaca_secret_key}
                    onChange={(e) =>
                      setApiKeys({ ...apiKeys, alpaca_secret_key: e.target.value })
                    }
                    className="w-full px-4 py-3 pr-12 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter your Alpaca Secret key"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setRevealed({
                        ...revealed,
                        alpaca_secret_key: !revealed.alpaca_secret_key,
                      })
                    }
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {revealed.alpaca_secret_key ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Keep this secret - never share it publicly
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-300">
                      <strong>Get your API keys:</strong>
                    </p>
                    <ol className="text-sm text-blue-300/80 mt-2 list-decimal list-inside space-y-1">
                      <li>Go to app.alpaca.markets</li>
                      <li>Navigate to Settings → API Keys</li>
                      <li>Copy your API Key and Secret Key</li>
                      <li>Paste them below</li>
                    </ol>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Save size={20} />
                {isLoading ? "Saving..." : "Save API Keys"}
              </button>
            </form>
          </div>
        )}

        {/* Config Tab */}
        {activeTab === "config" && (
          <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
            <div className="flex flex-col h-[700px]">
              {/* Tab selector */}
              <div className="bg-slate-900/50 border-b border-slate-700 flex gap-4 p-4">
                <button
                  onClick={() => {
                    handleConfigTabChange("routes.py");
                    setShowConfigEditor(true);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    configTab === "routes.py"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  routes.py
                </button>
                <button
                  onClick={() => {
                    handleConfigTabChange("config.py");
                    setShowConfigEditor(true);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    configTab === "config.py"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  config.py
                </button>
              </div>

              {/* Editor */}
              <div className="flex-1 overflow-hidden">
                {configLoading ? (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <span>Loading {configTab}...</span>
                  </div>
                ) : showConfigEditor ? (
                  <Editor
                    height="100%"
                    defaultLanguage="python"
                    language="python"
                    theme="vs-dark"
                    value={configCode}
                    onChange={(value) => setConfigCode(value || "")}
                    options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      padding: { top: 20 },
                      fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <span>Click a config file above to open the editor</span>
                  </div>
                )}
              </div>

              {/* Save button */}
              <div className="bg-slate-900/50 border-t border-slate-700 p-4 flex justify-end gap-3">
                <button
                  onClick={handleConfigSave}
                  disabled={configSaving || configLoading || !showConfigEditor}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  <Save size={18} />
                  {configSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

            <div className="px-4 py-3 bg-slate-950/50 text-xs text-slate-500 border-t border-slate-700">
              Note: Changes to routes.py and config.py require an application restart to take full effect in Jesse.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
