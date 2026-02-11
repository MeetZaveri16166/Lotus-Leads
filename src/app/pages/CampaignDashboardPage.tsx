import React, { useEffect, useState } from "react";
import { Api } from "@/lib/api";
import { AppShell } from "@/app/components/AppShell";

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>{value}</div>
    </div>
  );
}

export function CampaignDashboardPage({ campaignId, onNav }: { campaignId: string; onNav: (key: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const d = await Api.getCampaignDashboard(campaignId);
      setData(d);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const launch = async () => {
    setLaunching(true);
    try {
      await Api.launchCampaign(campaignId);
      await load();
      alert("Campaign launched. Scheduling in progress.");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLaunching(false);
    }
  };

  if (loading) return <AppShell title="Campaign Dashboard" active="dashboard" onNav={onNav}>Loading...</AppShell>;
  if (!data) return <AppShell title="Campaign Dashboard" active="dashboard" onNav={onNav}>No data.</AppShell>;

  const c = data.campaign;
  const stats = data.stats || {};
  const steps = data.steps || [];

  return (
    <AppShell title="Campaign Dashboard" active="dashboard" onNav={onNav}>
      <div style={{ maxWidth: 1200, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{c?.name ?? "Campaign"}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Status: {c?.status ?? "—"}</div>
          </div>

          <button
            onClick={launch}
            disabled={launching || c?.status === "running"}
            style={{ padding: "10px 12px", borderRadius: 12, border: "none", background: "#111", color: "#fff", cursor: "pointer", opacity: (launching || c?.status === "running") ? 0.7 : 1 }}
          >
            {launching ? "Launching..." : c?.status === "running" ? "Running" : "Launch Campaign"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <Stat label="Total Leads" value={stats.totalLeads ?? 0} />
          <Stat label="Messages Generated" value={stats.totalMessages ?? 0} />
          <Stat label="Approved Messages" value={stats.approvedMessages ?? 0} />
          <Stat label="Sent" value={stats.totalSent ?? 0} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <Stat label="Opens" value={`${stats.totalOpens ?? 0} (${stats.openRate ?? "0.0"}%)`} />
          <Stat label="Clicks" value={`${stats.totalClicks ?? 0} (${stats.clickRate ?? "0.0"}%)`} />
          <Stat label="Replies" value={`${stats.totalReplies ?? 0} (${stats.replyRate ?? "0.0"}%)`} />
        </div>

        <div style={{ border: "1px solid #eee", borderRadius: 14, padding: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Sequence Steps</div>
          {steps.length === 0 ? (
            <div style={{ opacity: 0.7, fontSize: 12 }}>No steps configured.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {steps.map((step: any, idx: number) => (
                <div key={idx} style={{ display: "flex", gap: 10, fontSize: 13, padding: "8px 0", borderBottom: idx < steps.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <div style={{ fontWeight: 900, minWidth: 60 }}>Step {step.stepOrder + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{step.subject || "No subject"}</div>
                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                      {step.delayDays === 0 ? "Send immediately" : `Send after ${step.delayDays} day(s)`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ fontSize: 12, opacity: 0.7, padding: "8px 12px", background: "#f9fafb", borderRadius: 8 }}>
          💡 Campaign automatically stops sending to leads who reply, bounce, or unsubscribe.
        </div>
      </div>
    </AppShell>
  );
}