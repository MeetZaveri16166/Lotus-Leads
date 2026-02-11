import React, { useEffect, useMemo, useState } from "react";
import { Api } from "@/lib/api";
import { AppShell } from "@/app/components/AppShell";

export function MessageReviewPage({
  campaignId,
  onGoDashboard,
  onNav,
}: {
  campaignId: string;
  onGoDashboard: () => void;
  onNav: (key: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [active, setActive] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await Api.listGeneratedMessages(campaignId);
      setMessages(rows || []);
      setActive(rows?.[0] ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const grouped = useMemo(() => {
    // group by lead for navigation list
    const map = new Map<string, any>();
    for (const m of messages) {
      const leadId = m.lead_id;
      if (!map.has(leadId)) map.set(leadId, { lead: m.lead, items: [] as any[] });
      map.get(leadId).items.push(m);
    }
    for (const v of map.values()) v.items.sort((a: any, b: any) => (a.step_order ?? 0) - (b.step_order ?? 0));
    return Array.from(map.values());
  }, [messages]);

  const generate = async () => {
    setGenerating(true);
    try {
      await Api.generateMessages(campaignId);
      await load();
      alert("Messages generated.");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const save = async (patch: any) => {
    if (!active) return;
    const updated = { ...active, ...patch };
    setActive(updated);
    setMessages((prev) => prev.map((m) => (m.id === active.id ? updated : m)));
    await Api.updateGeneratedMessage(active.id, patch);
  };

  const approvedCount = messages.filter((m) => m.status === "approved" || m.status === "edited").length;

  return (
    <AppShell title="Message Review" active="messages" onNav={onNav}>
      <div style={{ maxWidth: 1200, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontWeight: 900 }}>Campaign Messages</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Approve or edit what matters. LotusLeads handles follow-up scheduling automatically once launched.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ fontSize: 12, background: "#f3f4f6", padding: "6px 10px", borderRadius: 999 }}>
              Approved: {approvedCount} / {messages.length}
            </div>

            <button
              onClick={generate}
              disabled={generating}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #eee",
                background: "#fafafa",
                cursor: "pointer",
              }}
            >
              {generating ? "Generating..." : "Generate Messages"}
            </button>

            <button
              onClick={onGoDashboard}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "none",
                background: "#111",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Go to Dashboard →
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 12, alignItems: "start" }}>
          <div style={{ border: "1px solid #eee", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: 12, background: "#fafafa", fontSize: 12, fontWeight: 800 }}>
              Leads ({grouped.length})
            </div>
            <div style={{ maxHeight: 540, overflow: "auto" }}>
              {loading ? (
                <div style={{ padding: 12 }}>Loading...</div>
              ) : grouped.length === 0 ? (
                <div style={{ padding: 12, opacity: 0.7 }}>No messages generated yet.</div>
              ) : (
                grouped.map((g: any) => {
                  const leadName = `${g.lead?.first_name ?? ""} ${g.lead?.last_name ?? ""}`.trim() || "—";
                  const company = g.lead?.company_name ?? "—";
                  const complete = g.items.every((x: any) => x.status === "approved" || x.status === "edited");

                  return (
                    <div key={g.items[0].lead_id} style={{ padding: 12, borderTop: "1px solid #f0f0f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div>
                          <div style={{ fontWeight: 900 }}>{leadName}</div>
                          <div style={{ fontSize: 12, opacity: 0.7 }}>{company}</div>
                        </div>
                        <div style={{ fontSize: 12, padding: "4px 10px", borderRadius: 999, background: complete ? "#dcfce7" : "#f3f4f6" }}>
                          {complete ? "Ready" : "Review"}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                        {g.items.map((m: any) => (
                          <button
                            key={m.id}
                            onClick={() => setActive(m)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 999,
                              border: "1px solid #eee",
                              background: active?.id === m.id ? "#111" : "#fafafa",
                              color: active?.id === m.id ? "#fff" : "#111",
                              cursor: "pointer",
                              fontSize: 12,
                            }}
                          >
                            Step {m.step_order ?? "?"}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ border: "1px solid #eee", borderRadius: 14, padding: 14 }}>
            {!active ? (
              <div style={{ opacity: 0.7 }}>Select a message to review.</div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 900 }}>
                    Step {active.step_order ?? "?"} • {active.lead?.company_name ?? "—"}
                  </div>
                  <div style={{ fontSize: 12, background: "#f3f4f6", padding: "6px 10px", borderRadius: 999 }}>
                    {active.status}
                  </div>
                </div>

                <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Subject</div>
                <input
                  value={active.subject ?? ""}
                  onChange={(e) => setActive({ ...active, subject: e.target.value })}
                  onBlur={() => save({ subject: active.subject, status: active.status === "approved" ? "edited" : active.status })}
                  style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #e5e7eb" }}
                />

                <div style={{ fontSize: 12, fontWeight: 800, marginTop: 10, marginBottom: 6 }}>Body</div>
                <textarea
                  value={active.body ?? ""}
                  onChange={(e) => setActive({ ...active, body: e.target.value })}
                  onBlur={() => save({ body: active.body, status: active.status === "approved" ? "edited" : active.status })}
                  style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #e5e7eb", minHeight: 260 }}
                />

                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button
                    onClick={() => save({ status: "approved" })}
                    style={{ padding: "10px 12px", borderRadius: 12, border: "none", background: "#111", color: "#fff", cursor: "pointer" }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => save({ status: "edited" })}
                    style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #eee", background: "#fafafa", cursor: "pointer" }}
                  >
                    Mark Edited
                  </button>
                </div>

                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 10 }}>
                  Tip: You can approve quickly, then only edit the first message for high-value prospects.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}