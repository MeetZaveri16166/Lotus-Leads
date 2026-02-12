import { useState, useEffect } from "react";
import { Building2, Users, UserPlus, Trash2, Copy, Check, Mail, Clock } from "lucide-react";
import { AppShell } from "@/app/components/AppShell";
import { useAuth } from "@/app/context/AuthContext";
import { getSupabaseClient } from "@/utils/supabase/client";

interface Organization {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  subscription_status: string;
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  full_name: string | null;
  email: string | null;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  token: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export function OrganizationPage({ onNav }: { onNav: (key: string, data?: any) => void }) {
  const { user } = useAuth();
  const supabase = getSupabaseClient();

  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "members" | "invites">("details");

  // Create org form
  const [orgName, setOrgName] = useState("");
  const [orgIndustry, setOrgIndustry] = useState("");
  const [creating, setCreating] = useState(false);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "user">("user");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    loadOrganization();
  }, [user]);

  const loadOrganization = async () => {
    if (!user) return;
    setLoading(true);

    // Get user's membership + org
    const { data: membership } = await supabase
      .from("memberships")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (membership) {
      setIsAdmin(membership.role === "admin");

      // Get org details
      const { data: orgData } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", membership.organization_id)
        .single();

      if (orgData) {
        setOrg(orgData);
        await loadMembers(orgData.id);
        await loadInvitations(orgData.id);
      }
    }

    setLoading(false);
  };

  const loadMembers = async (orgId: string) => {
    const { data } = await supabase
      .from("memberships")
      .select("id, user_id, role, status, joined_at")
      .eq("organization_id", orgId)
      .eq("status", "active");

    if (data) {
      // Fetch user profiles for each member
      const membersWithProfiles: Member[] = [];
      for (const m of data) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("full_name")
          .eq("id", m.user_id)
          .single();

        // Get email from auth - use user_id to look up
        const email = m.user_id === user?.id ? user.email : null;

        membersWithProfiles.push({
          ...m,
          full_name: profile?.full_name || null,
          email: email,
        });
      }
      setMembers(membersWithProfiles);
    }
  };

  const loadInvitations = async (orgId: string) => {
    const { data } = await supabase
      .from("invitations")
      .select("*")
      .eq("organization_id", orgId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (data) setInvitations(data);
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !orgName.trim()) return;
    setCreating(true);

    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
    const orgId = crypto.randomUUID();

    const { error: orgError } = await supabase
      .from("organizations")
      .insert({
        id: orgId,
        name: orgName.trim(),
        slug,
        industry: orgIndustry.trim() || null,
        subscription_status: "trial",
      });

    if (orgError) {
      alert("Failed to create organization: " + orgError.message);
      setCreating(false);
      return;
    }

    // Create admin membership
    const { error: memError } = await supabase.from("memberships").insert({
      user_id: user.id,
      organization_id: orgId,
      role: "admin",
      status: "active",
    });

    if (memError) {
      alert("Failed to create membership: " + memError.message);
    }

    setCreating(false);
    await loadOrganization();
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !org || !inviteEmail.trim()) return;
    setInviting(true);
    setInviteError("");

    const token = crypto.randomUUID();

    const { error } = await supabase.from("invitations").insert({
      organization_id: org.id,
      invited_by: user.id,
      email: inviteEmail.trim(),
      role: inviteRole,
      token,
      status: "pending",
    });

    if (error) {
      setInviteError(error.message);
      setInviting(false);
      return;
    }

    setInviteEmail("");
    setInviteRole("user");
    setInviting(false);
    await loadInvitations(org.id);
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRemoveMember = async (membershipId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    await supabase.from("memberships").delete().eq("id", membershipId);
    if (org) await loadMembers(org.id);
  };

  const handleCancelInvite = async (inviteId: string) => {
    await supabase.from("invitations").update({ status: "canceled" }).eq("id", inviteId);
    if (org) await loadInvitations(org.id);
  };

  if (loading) {
    return (
      <AppShell title="Organization" active="organization" onNav={onNav}>
        <div className="flex items-center justify-center py-32">
          <div className="w-12 h-12 border-4 border-[#E64B8B] border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  // No organization yet — show create form
  if (!org) {
    return (
      <AppShell title="Organization" active="organization" onNav={onNav}>
        <div className="max-w-lg mx-auto mt-12">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#E64B8B] to-[#C93B75] px-8 py-6">
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">Create Your Organization</h2>
              </div>
              <p className="text-sm text-pink-100 mt-1">
                Set up your organization to start collaborating with your team
              </p>
            </div>
            <form onSubmit={handleCreateOrg} className="px-8 py-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme Corp"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/30 focus:border-[#E64B8B] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Industry
                </label>
                <input
                  type="text"
                  value={orgIndustry}
                  onChange={(e) => setOrgIndustry(e.target.value)}
                  placeholder="e.g. Technology, Real Estate, Healthcare"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/30 focus:border-[#E64B8B] transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={creating || !orgName.trim()}
                className="w-full py-3 bg-gradient-to-r from-[#E64B8B] to-[#C93B75] text-white font-semibold rounded-lg shadow-lg shadow-pink-500/30 hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {creating ? "Creating..." : "Create Organization"}
              </button>
            </form>
          </div>
        </div>
      </AppShell>
    );
  }

  // Organization exists — show management page
  return (
    <AppShell title="Organization" active="organization" onNav={onNav}>
      <div className="space-y-6">
        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-xl p-1.5 inline-flex gap-1">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "details"
                ? "bg-[#E64B8B] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Details
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "members"
                ? "bg-[#E64B8B] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Users className="w-4 h-4" />
            Members ({members.length})
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab("invites")}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "invites"
                  ? "bg-[#E64B8B] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Invite Members
            </button>
          )}
        </div>

        {/* Details Tab */}
        {activeTab === "details" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-[#E64B8B] to-[#C93B75] rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{org.name}</h2>
                <p className="text-sm text-gray-500">
                  {org.industry || "No industry set"} · Created {new Date(org.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <p className="text-sm font-semibold text-gray-900 capitalize">{org.subscription_status}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Members</p>
                <p className="text-sm font-semibold text-gray-900">{members.length}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Your Role</p>
                <p className="text-sm font-semibold text-gray-900 capitalize">{isAdmin ? "Admin" : "Member"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Team Members
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {members.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No members yet</div>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#E64B8B] to-[#C93B75] rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {(member.full_name || member.email || "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.full_name || "Unknown"}
                          {member.user_id === user?.id && (
                            <span className="ml-2 text-xs text-gray-400">(You)</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">{member.email || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          member.role === "admin"
                            ? "bg-[#E64B8B] text-white"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {member.role}
                      </span>
                      <span className="text-sm text-gray-500">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </span>
                      {isAdmin && member.user_id !== user?.id && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Invites Tab (Admin only) */}
        {activeTab === "invites" && isAdmin && (
          <div className="space-y-6">
            {/* Invite Form */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <UserPlus className="w-5 h-5 text-[#E64B8B]" />
                <h2 className="text-lg font-semibold text-gray-900">Send Invitation</h2>
              </div>

              {inviteError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
                  {inviteError}
                </div>
              )}

              <form onSubmit={handleInvite} className="flex gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/30 focus:border-[#E64B8B] transition-all"
                  />
                </div>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "admin" | "user")}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/30 focus:border-[#E64B8B]"
                >
                  <option value="user">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#E64B8B] to-[#C93B75] text-white rounded-lg font-medium shadow-lg shadow-pink-500/30 hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {inviting ? "Sending..." : "Invite"}
                </button>
              </form>
            </div>

            {/* Pending Invitations */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  Pending Invitations
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {invitations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No pending invitations</div>
                ) : (
                  invitations.map((inv) => (
                    <div key={inv.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Mail className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{inv.email}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            Expires {new Date(inv.expires_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                          {inv.role}
                        </span>
                        <button
                          onClick={() => copyInviteLink(inv.token)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#E64B8B] border border-[#E64B8B] rounded-lg hover:bg-[#E64B8B] hover:text-white transition-all"
                        >
                          {copiedToken === inv.token ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy Link
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleCancelInvite(inv.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
