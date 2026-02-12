import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "@/app/context/AuthContext";
import { getSupabaseClient } from "@/utils/supabase/client";
import { Mail, Lock, User, Eye, EyeOff, Building2 } from "lucide-react";

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("token");

  const [mode, setMode] = useState<"signin" | "signup">(inviteToken ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuth();

  // Invite info
  const [inviteOrgName, setInviteOrgName] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken);

  // Load invite details if token present
  useEffect(() => {
    if (inviteToken) {
      loadInviteDetails();
    }
  }, [inviteToken]);

  const loadInviteDetails = async () => {
    setInviteLoading(true);
    const supabase = getSupabaseClient();

    const { data: invitation } = await supabase
      .from("invitations")
      .select("email, organization_id, status")
      .eq("token", inviteToken!)
      .eq("status", "pending")
      .single();

    if (invitation) {
      setEmail(invitation.email);
      // Get org name
      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", invitation.organization_id)
        .single();
      if (org) setInviteOrgName(org.name);
    } else {
      setError("This invitation is invalid or has expired.");
    }
    setInviteLoading(false);
  };

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user && !inviteToken) {
      navigate("/app/", { replace: true });
    }
  }, [user, loading, navigate, inviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result =
      mode === "signin"
        ? await signIn(email, password)
        : await signUp(email, password, fullName, inviteToken || undefined);

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else {
      navigate("/app/");
    }
  };

  if (loading || inviteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-pink-50/30">
        <div className="w-10 h-10 border-4 border-[#E64B8B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-pink-50/30 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-[#E64B8B] to-[#C93B75] rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#E64B8B] to-[#C93B75] bg-clip-text text-transparent">
              LotusLeads
            </h1>
          </div>
          <p className="text-sm text-gray-500">AI-Powered Sales Intelligence</p>
        </div>

        {/* Invite Banner */}
        {inviteOrgName && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-900">
                You've been invited to join <span className="text-[#E64B8B]">{inviteOrgName}</span>
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                Create an account to accept the invitation
              </p>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#E64B8B] to-[#C93B75] px-8 py-6">
            <h2 className="text-xl font-bold text-white">
              {mode === "signin" ? "Welcome back" : inviteToken ? "Join your team" : "Create your account"}
            </h2>
            <p className="text-sm text-pink-100 mt-1">
              {mode === "signin"
                ? "Sign in to continue to your dashboard"
                : inviteToken
                  ? "Sign up to join the organization"
                  : "Get started with AI-powered prospecting"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/30 focus:border-[#E64B8B] transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  readOnly={!!inviteToken}
                  className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/30 focus:border-[#E64B8B] transition-all ${inviteToken ? "bg-gray-50 text-gray-600" : ""}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/30 focus:border-[#E64B8B] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-[#E64B8B] to-[#C93B75] text-white font-semibold rounded-lg shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {mode === "signin" ? "Signing in..." : "Creating account..."}
                </>
              ) : mode === "signin" ? (
                "Sign In"
              ) : inviteToken ? (
                "Sign Up & Join Team"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Toggle */}
          {!inviteToken && (
            <div className="px-8 pb-6 text-center text-sm text-gray-600">
              {mode === "signin" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => { setMode("signup"); setError(""); }}
                    className="text-[#E64B8B] font-semibold hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => { setMode("signin"); setError(""); }}
                    className="text-[#E64B8B] font-semibold hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
