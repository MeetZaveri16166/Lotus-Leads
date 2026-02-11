import React, { useState, useEffect } from "react";
import { Users, Building2, Settings, CreditCard, Mail, Trash2, UserPlus } from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { BusinessProfileContent } from "@/app/components/admin/BusinessProfileContent";
import { SettingsContent } from "@/app/components/admin/SettingsContent";
import { Api } from "@/lib/api";

interface AdminPageProps {
  onNav: (key: string) => void;
}

type AdminTab = "team" | "profile" | "settings" | "credits";

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  joinedAt: string;
}

interface CreditTransaction {
  id: string;
  description: string;
  amount: number;
  timestamp: string;
  type: "credit" | "debit";
}

export default function AdminPage({ onNav }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("team");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [isInviting, setIsInviting] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "team") {
        await loadTeamMembers();
      } else if (activeTab === "credits") {
        await loadCreditData();
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      // Use the API helper instead of direct fetch
      const data = await Api.getTeamMembers();
      setTeamMembers(data.members || []);
    } catch (error) {
      console.error("Error loading team members:", error);
    }
  };

  const loadCreditData = async () => {
    try {
      // Use the new API methods
      const [balanceData, transactionsData] = await Promise.all([
        Api.getCreditBalance(),
        Api.getCreditTransactions(),
      ]);

      setCreditBalance(balanceData.balance || 0);
      setTransactions(transactionsData.map((t: any) => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        timestamp: t.created_at,
        type: t.type,
      })) || []);
    } catch (error: any) {
      console.error("Error loading credit data:", error);
      
      // If we get a session error, show a helpful message
      if (error.message?.includes('Session') || error.message?.includes('expired')) {
        console.log('[ADMIN PAGE] Session error detected - user needs to re-authenticate');
      }
      
      // Don't throw - just show zeros/empty
      setCreditBalance(0);
      setTransactions([]);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      await Api.inviteTeamMember(inviteEmail, inviteRole);
      setInviteEmail("");
      setInviteRole("member");
      await loadTeamMembers();
      alert("Invitation sent successfully!");
    } catch (error: any) {
      console.error("Error inviting user:", error);
      alert(`Failed to send invitation: ${error.message || "Unknown error"}`);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;

    try {
      await Api.removeTeamMember(memberId);
      await loadTeamMembers();
      alert("Team member removed successfully");
    } catch (error: any) {
      console.error("Error removing member:", error);
      alert(`Failed to remove member: ${error.message || "Unknown error"}`);
    }
  };

  const tabs = [
    { id: "team" as AdminTab, label: "Team Management", icon: Users },
    { id: "profile" as AdminTab, label: "Business Profile", icon: Building2 },
    { id: "settings" as AdminTab, label: "Settings", icon: Settings },
    { id: "credits" as AdminTab, label: "Credits & Usage", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#E64B8B] to-[#d43d7a] rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Admin</h1>
                <p className="text-sm text-gray-600">Manage your organization</p>
              </div>
            </div>
            <button
              onClick={() => onNav("leads")}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium"
            >
              ← Back to App
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-[#E64B8B] text-[#E64B8B]"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "team" && (
          <div className="space-y-6">
            {/* Invite User Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <UserPlus className="w-5 h-5 text-[#E64B8B]" />
                <h2 className="text-lg font-semibold text-gray-900">Invite Team Member</h2>
              </div>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E64B8B] focus:border-transparent"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E64B8B] focus:border-transparent"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={handleInviteUser}
                  disabled={isInviting || !inviteEmail.trim()}
                  className="px-6 py-2 bg-[#E64B8B] text-white rounded-lg font-medium hover:bg-[#d43d7a] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isInviting ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </div>

            {/* Team Members List */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {isLoading ? (
                  <div className="p-8 text-center text-gray-500">Loading team members...</div>
                ) : teamMembers.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No team members yet</div>
                ) : (
                  teamMembers.map((member) => (
                    <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#E64B8B] to-[#d43d7a] rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-600">{member.email}</div>
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
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </span>
                        {member.role !== "admin" && (
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
          </div>
        )}

        {activeTab === "profile" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <BusinessProfileContent />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SettingsContent />
          </div>
        )}

        {activeTab === "credits" && (
          <div className="space-y-6">
            {/* Credit Balance Card */}
            <div className="bg-gradient-to-br from-[#E64B8B] to-[#d43d7a] rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">Credit Allocation</p>
                  <h2 className="text-4xl font-bold">
                    {creditBalance.toLocaleString()}
                  </h2>
                  <p className="text-xs opacity-75 mt-2">
                    Credits track API consumption across your integrations
                  </p>
                </div>
                <CreditCard className="w-12 h-12 opacity-80" />
              </div>
            </div>

            {/* Usage Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-1">Apollo API Calls</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
                <p className="text-xs text-gray-500 mt-1">Lead discovery & enrichment</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-1">Perplexity API Calls</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
                <p className="text-xs text-gray-500 mt-1">Research & insights</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-1">Google Maps API</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
                <p className="text-xs text-gray-500 mt-1">Geospatial analysis</p>
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Consumption History</h2>
                  <p className="text-sm text-gray-500">Using your integrated API keys</p>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {isLoading ? (
                  <div className="p-8 text-center text-gray-500">Loading consumption history...</div>
                ) : transactions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p className="font-medium">No API usage yet</p>
                    <p className="text-sm mt-1">Credits will be deducted as you use your integrated APIs</p>
                  </div>
                ) : (
                  transactions.map((transaction) => (
                    <div key={transaction.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{transaction.description}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(transaction.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div
                          className={`font-semibold ${
                            transaction.type === "credit" ? "text-green-600" : "text-gray-900"
                          }`}
                        >
                          {transaction.type === "credit" ? "+" : "-"}
                          {transaction.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Credit Costs Reference */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">Credit Costs per API Call</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-800">Apollo Lead Discovery:</span>
                  <span className="font-medium text-blue-900">10 credits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">Apollo Enrichment:</span>
                  <span className="font-medium text-blue-900">5 credits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">Perplexity Research:</span>
                  <span className="font-medium text-blue-900">15 credits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">Google Maps Geocoding:</span>
                  <span className="font-medium text-blue-900">3 credits</span>
                </div>
              </div>
              <p className="text-xs text-blue-700 mt-3 italic">
                * Credits are deducted from your allocation as you consume your integrated APIs
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}