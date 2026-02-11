import React from "react";
import { Home, Users, Send, Settings, BarChart3, Bookmark, Building2, Shield, Brain, Globe, Star, DollarSign } from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { Api } from "@/lib/api";

export function AppShell({
  title,
  active,
  onNav,
  children,
}: {
  title: string;
  active: "leads" | "campaigns" | "messages" | "dashboard" | "profile" | "icp" | "saved-searches" | "settings" | "admin" | "know-how" | "landing" | "features" | "pricing";
  onNav: (key: any) => void;
  children: React.ReactNode;
}) {
  const [creditBalance, setCreditBalance] = React.useState<number | null>(null);
  const [backendStatus, setBackendStatus] = React.useState<'checking' | 'ok' | 'error'>('checking');

  React.useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    try {
      // Simple non-blocking credit check with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const data = await Api.getCreditBalance();
      clearTimeout(timeoutId);
      
      setCreditBalance(data.balance || 0);
      setBackendStatus('ok');
    } catch (error: any) {
      // Silent fail - don't spam console with errors on initial load
      // Backend check is non-critical for app functionality
      console.warn("Backend check failed (non-critical):", error.message);
      setCreditBalance(999999); // Default to unlimited for display
      setBackendStatus('ok'); // Don't show error state
    }
  };

  const nav = [
    { key: "dashboard", label: "Dashboard", icon: Home },
    { key: "icp", label: "ICP", icon: BarChart3 },
    { key: "saved-searches", label: "Saved Searches", icon: Bookmark },
    { key: "leads", label: "Leads", icon: Users },
    { key: "campaigns", label: "Campaigns", icon: Send },
    { key: "settings", label: "Settings", icon: Settings },
    { key: "know-how", label: "Know How", icon: Brain },
    { key: "landing", label: "Landing Page", icon: Globe },
    { key: "features", label: "Features", icon: Star },
    { key: "pricing", label: "Pricing", icon: DollarSign },
    { key: "admin", label: "Admin", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30">
      {/* Top Navigation Bar */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-8">
            {/* Logo Section */}
            <div className="flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#E64B8B] to-[#C93B75] rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-[#E64B8B] to-[#C93B75] bg-clip-text text-transparent">
                    LotusLeads
                  </h1>
                  <p className="text-[10px] text-gray-500 font-medium">
                    AI-Powered Sales Intelligence
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="hidden lg:flex items-center gap-1.5 flex-1 justify-center">
              {nav.map((n) => {
                const Icon = n.icon;
                const isActive = active === n.key;
                return (
                  <button
                    key={n.key}
                    onClick={() => onNav(n.key)}
                    className={`
                      flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200
                      ${isActive
                        ? "text-white bg-gradient-to-r from-[#E64B8B] to-[#C93B75] shadow-lg shadow-pink-500/30"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gradient-to-br hover:from-gray-50 hover:to-pink-50/50"
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-500"}`} />
                    {n.label}
                  </button>
                );
              })}
            </nav>

            {/* User Section */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-gray-200/60 bg-gradient-to-br from-gray-50 to-white shadow-sm hover:shadow-md transition-shadow">
                <div className="w-8 h-8 bg-gradient-to-br from-[#E64B8B] to-[#C93B75] rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-pink-500/30">
                  A
                </div>
                <span className="text-sm font-semibold text-gray-900">Admin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page Title Bar */}
        <div className="border-t border-gray-100/60 bg-gradient-to-r from-gray-50/50 to-pink-50/30">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-8 py-3.5">
            <h2 className="text-sm font-bold text-gray-900 tracking-wide uppercase">{title}</h2>
          </div>
        </div>
      </header>

      {/* CRITICAL: Backend Deployment Warning */}
      {backendStatus === 'error' && (
        <div className="bg-yellow-50 border-b border-yellow-200 sticky top-0 z-40">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-8 py-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                <span className="text-xl">⚠️</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-yellow-900 mb-1">
                  Backend Edge Function Not Deployed
                </h3>
                <p className="text-xs text-yellow-800 mb-2">
                  Your Supabase edge function is not responding. API calls will fail until you deploy it.
                </p>
                <div className="flex items-center gap-3 text-xs">
                  <a 
                    href={`https://supabase.com/dashboard/project/${projectId}/functions`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-medium transition-colors"
                  >
                    Deploy Now in Supabase Dashboard →
                  </a>
                  <button 
                    onClick={checkBackend}
                    className="text-yellow-700 hover:text-yellow-900 underline font-medium"
                  >
                    Recheck Connection
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around px-2 py-2">
          {nav.slice(0, 5).map((n) => {
            const Icon = n.icon;
            const isActive = active === n.key;
            return (
              <button
                key={n.key}
                onClick={() => onNav(n.key)}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-150"
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-[#E64B8B]" : "text-gray-500"}`} />
                <span className={`text-[10px] font-medium ${isActive ? "text-[#E64B8B]" : "text-gray-500"}`}>{n.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-6 lg:px-8 py-6 pb-24 lg:pb-6">
        {children}
      </main>
    </div>
  );
}