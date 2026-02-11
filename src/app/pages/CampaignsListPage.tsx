import React, { useEffect, useState } from "react";
import { Api } from "@/lib/api";
import { AppShell } from "@/app/components/AppShell";
import { Plus, Edit2, Trash2, Play, Pause, MoreVertical } from "lucide-react";

type Campaign = {
  id: string;
  name: string;
  goal?: string;
  status: string;
  stepsCount: number;
  leadsCount: number;
  createdAt: string;
};

export function CampaignsListPage({ 
  onNav, 
  onCreateNew,
  onSelectCampaign 
}: { 
  onNav: (key: string) => void;
  onCreateNew: () => void;
  onSelectCampaign: (campaignId: string) => void;
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await Api.listCampaigns();
      setCampaigns(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDeleteCampaign = async (campaignId: string, campaignName: string) => {
    if (!confirm(`Are you sure you want to delete "${campaignName}"? This cannot be undone.`)) {
      return;
    }
    
    try {
      await Api.deleteCampaign(campaignId);
      load(); // Reload campaigns
    } catch (error: any) {
      console.error("Failed to delete campaign:", error);
      alert("Failed to delete campaign: " + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "#10B981";
      case "paused": return "#F59E0B";
      case "completed": return "#6B7280";
      case "ready": return "#3B82F6";
      default: return "#9CA3AF";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft": return "Draft";
      case "ready": return "Ready";
      case "running": return "Running";
      case "paused": return "Paused";
      case "completed": return "Completed";
      default: return status;
    }
  };

  if (loading) {
    return (
      <AppShell title="Campaigns" active="campaigns" onNav={onNav}>
        <div style={{ padding: 40, textAlign: "center", color: "#999" }}>
          Loading campaigns...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Campaigns" active="campaigns" onNav={onNav}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
        {/* Header */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: 24
        }}>
          <div>
            <h1 style={{ 
              fontSize: 28, 
              fontWeight: 900, 
              marginBottom: 8,
              color: "#111"
            }}>
              Campaigns
            </h1>
            <p style={{ fontSize: 14, color: "#6B7280" }}>
              Create and manage AI-powered email outreach campaigns
            </p>
          </div>
          <button
            onClick={onCreateNew}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 20px",
              borderRadius: 12,
              border: "none",
              background: "#E64B8B",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              boxShadow: "0 2px 8px rgba(230, 75, 139, 0.3)",
            }}
          >
            <Plus size={18} />
            Create Campaign
          </button>
        </div>

        {/* Empty State */}
        {campaigns.length === 0 ? (
          <div
            style={{
              border: "2px dashed #E5E7EB",
              borderRadius: 16,
              padding: 60,
              textAlign: "center",
              background: "#FAFAFA",
            }}
          >
            <div style={{ 
              width: 64, 
              height: 64, 
              background: "#F3F4F6",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px"
            }}>
              <Plus size={32} color="#9CA3AF" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#111" }}>
              No campaigns yet
            </h3>
            <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>
              Create your first AI-powered campaign to start sending personalized outreach at scale
            </p>
            <button
              onClick={onCreateNew}
              style={{
                padding: "12px 24px",
                borderRadius: 12,
                border: "2px solid #E64B8B",
                background: "#fff",
                color: "#E64B8B",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Create Your First Campaign
            </button>
          </div>
        ) : (
          /* Campaigns List */
          <div style={{ display: "grid", gap: 12 }}>
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: 16,
                  padding: 20,
                  background: "#fff",
                  transition: "all 0.2s",
                  cursor: "pointer",
                }}
                onClick={() => onSelectCampaign(campaign.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#E64B8B";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(230, 75, 139, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E5E7EB";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>
                        {campaign.name}
                      </h3>
                      <span style={{
                        padding: "4px 10px",
                        borderRadius: 20,
                        background: getStatusColor(campaign.status) + "15",
                        color: getStatusColor(campaign.status),
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        {getStatusLabel(campaign.status)}
                      </span>
                    </div>
                    
                    {campaign.goal && (
                      <p style={{ 
                        fontSize: 13, 
                        color: "#6B7280", 
                        marginBottom: 12,
                        lineHeight: 1.5 
                      }}>
                        {campaign.goal}
                      </p>
                    )}
                    
                    <div style={{ 
                      display: "flex", 
                      gap: 20,
                      fontSize: 13,
                      color: "#6B7280"
                    }}>
                      <span>
                        <strong style={{ color: "#111", fontWeight: 600 }}>
                          {campaign.stepsCount}
                        </strong> step{campaign.stepsCount !== 1 ? "s" : ""}
                      </span>
                      <span>
                        <strong style={{ color: "#111", fontWeight: 600 }}>
                          {campaign.leadsCount}
                        </strong> lead{campaign.leadsCount !== 1 ? "s" : ""}
                      </span>
                      <span>
                        Created {new Date(campaign.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCampaign(campaign.id);
                      }}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 10,
                        border: "1px solid #E5E7EB",
                        background: "#fff",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#E64B8B",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#FEF2F7";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fff";
                      }}
                    >
                      View Details →
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCampaign(campaign.id, campaign.name);
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "1px solid #E5E7EB",
                        background: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#FEF2F2";
                        e.currentTarget.style.borderColor = "#EF4444";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.borderColor = "#E5E7EB";
                      }}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}