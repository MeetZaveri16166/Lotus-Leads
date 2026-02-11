import React, { useEffect, useState } from "react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";

export function BackendStatus() {
  const [status, setStatus] = useState<"checking" | "ok" | "error">("checking");
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const checkBackend = async () => {
    setStatus("checking");
    setError("");
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2f1627d1/health`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setDetails(data);
        setStatus("ok");
      } else {
        setError(`HTTP ${response.status}: ${response.statusText}`);
        setStatus("error");
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError("Request timeout - backend not responding");
      } else {
        setError(err.message || "Failed to connect");
      }
      setStatus("error");
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`
        rounded-lg shadow-lg border-2 p-4 backdrop-blur-sm
        ${status === "ok" ? "bg-green-50/95 border-green-500" : ""}
        ${status === "error" ? "bg-red-50/95 border-red-500" : ""}
        ${status === "checking" ? "bg-blue-50/95 border-blue-500" : ""}
      `}>
        <div className="flex items-center gap-3">
          {status === "checking" && (
            <>
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <div className="font-semibold text-blue-900">Checking Backend...</div>
                <div className="text-xs text-blue-700">Connecting to Supabase Edge Function</div>
              </div>
            </>
          )}
          
          {status === "ok" && (
            <>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-semibold text-green-900">Backend Online ✓</div>
                {details && (
                  <div className="text-xs text-green-700 space-y-0.5">
                    <div>Version: {details.version || "unknown"}</div>
                    {details.fixed && <div className="font-medium">Fixed: {details.fixed}</div>}
                  </div>
                )}
              </div>
            </>
          )}
          
          {status === "error" && (
            <>
              <XCircle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <div className="font-semibold text-red-900">Backend Error</div>
                <div className="text-xs text-red-700 max-w-xs break-words">{error}</div>
                <button
                  onClick={checkBackend}
                  className="mt-2 flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-900"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry Connection
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
