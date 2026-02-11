import React, { useEffect, useMemo, useState } from "react";
import { Api } from "@/lib/api";
import { AppShell } from "@/app/components/AppShell";
import { ChevronRight, ChevronLeft, Check, Loader2, Plus, Trash2, Mail, Users, Zap, Eye, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

type Lead = any;
type Message = any;

type WizardStep = 1 | 2 | 3 | 4;

interface CampaignData {
  id?: string;
  name: string;
  goal: string;
  steps: Array<{
    step_order: number;
    delay_days: number;
    subject_template: string;
    body_template: string;
  }>;
  selectedLeadIds: string[];
}

export function CampaignBuilderWizard({
  campaignId,
  onNav,
  onComplete,
}: {
  campaignId?: string;
  onNav: (key: string) => void;
  onComplete?: (campaignId: string) => void;
}) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Campaign data
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: "",
    goal: "",
    steps: [
      { step_order: 1, delay_days: 0, subject_template: "", body_template: "" },
      { step_order: 2, delay_days: 2, subject_template: "", body_template: "" },
      { step_order: 3, delay_days: 5, subject_template: "", body_template: "" },
    ],
    selectedLeadIds: [],
  });

  // Leads data
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [leadSearchQuery, setLeadSearchQuery] = useState("");

  // Step 4: Enrichment & Message Preview state
  const [enrichmentPhase, setEnrichmentPhase] = useState<'checking' | 'enriching' | 'generating' | 'preview'>('checking');
  const [enrichmentProgress, setEnrichmentProgress] = useState({ total: 0, completed: 0, failed: 0 });
  const [generatedMessages, setGeneratedMessages] = useState<Message[]>([]);

  // Load enriched leads for Step 3
  useEffect(() => {
    if (currentStep === 3) {
      loadAllLeads();
    }
  }, [currentStep]);

  // Step 4: Start enrichment check when entering
  useEffect(() => {
    if (currentStep === 4 && campaignData.id && campaignData.selectedLeadIds.length > 0) {
      startEnrichmentAndGeneration();
    }
  }, [currentStep]);

  const loadAllLeads = async () => {
    setLoading(true);
    try {
      const allLeadsData = await Api.listLeads({});
      setAllLeads(allLeadsData || []);
    } catch (error: any) {
      console.error("Failed to load leads:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtered leads based on search
  const filteredLeads = useMemo(() => {
    const query = leadSearchQuery.trim().toLowerCase();
    if (!query) return allLeads;
    
    return allLeads.filter((lead) => {
      const name = `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.toLowerCase();
      const company = `${lead.company_name ?? ""}`.toLowerCase();
      const title = `${lead.title ?? ""}`.toLowerCase();
      const email = `${lead.enrichment?.email ?? ""}`.toLowerCase();
      return name.includes(query) || company.includes(query) || title.includes(query) || email.includes(query);
    });
  }, [allLeads, leadSearchQuery]);

  // Group messages by lead
  const messagesByLead = useMemo(() => {
    const grouped: Record<string, Message[]> = {};
    generatedMessages.forEach((msg) => {
      const leadId = msg.lead_id;
      if (!grouped[leadId]) grouped[leadId] = [];
      grouped[leadId].push(msg);
    });
    // Sort messages within each lead by step_order
    Object.keys(grouped).forEach(leadId => {
      grouped[leadId].sort((a, b) => (a.step?.stepOrder || 0) - (b.step?.stepOrder || 0));
    });
    return grouped;
  }, [generatedMessages]);

  // Step 4: Enrichment and message generation flow
  const startEnrichmentAndGeneration = async () => {
    setEnrichmentPhase('checking');
    
    try {
      // Get full lead data for selected leads
      const selectedLeads = allLeads.filter(l => campaignData.selectedLeadIds.includes(l.id));
      
      // Check enrichment status
      const unenrichedLeads = selectedLeads.filter(l => l.enrichment_status !== 'complete');
      const enrichedLeads = selectedLeads.filter(l => l.enrichment_status === 'complete');
      
      console.log(`[ENRICHMENT CHECK] Total: ${selectedLeads.length}, Enriched: ${enrichedLeads.length}, Need enrichment: ${unenrichedLeads.length}`);
      
      setEnrichmentProgress({ 
        total: selectedLeads.length, 
        completed: enrichedLeads.length,
        failed: 0 
      });
      
      // If there are unenriched leads, enrich them
      if (unenrichedLeads.length > 0) {
        setEnrichmentPhase('enriching');
        console.log(`[ENRICHMENT] Starting enrichment for ${unenrichedLeads.length} leads`);
        
        // Enrich leads one by one
        let completed = enrichedLeads.length;
        let failed = 0;
        
        for (const lead of unenrichedLeads) {
          try {
            console.log(`[ENRICHMENT] Enriching lead: ${lead.company_name}`);
            await Api.enrichLead(lead.id);
            completed++;
            setEnrichmentProgress({ total: selectedLeads.length, completed, failed });
          } catch (error: any) {
            console.error(`[ENRICHMENT] Failed to enrich lead ${lead.id}:`, error);
            failed++;
            setEnrichmentProgress({ total: selectedLeads.length, completed, failed });
          }
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log(`[ENRICHMENT] Completed. Success: ${completed}, Failed: ${failed}`);
        
        // Reload leads to get updated enrichment data
        await loadAllLeads();
      }
      
      // Generate messages
      setEnrichmentPhase('generating');
      console.log(`[MESSAGE GENERATION] Generating messages for campaign ${campaignData.id}`);
      
      await Api.generateMessages(campaignData.id!);
      
      // Load generated messages
      const messages = await Api.listGeneratedMessages(campaignData.id!);
      setGeneratedMessages(messages || []);
      
      console.log(`[MESSAGE GENERATION] Generated ${messages?.length || 0} messages`);
      
      // Move to preview phase
      setEnrichmentPhase('preview');
      
    } catch (error: any) {
      console.error("[ENRICHMENT/GENERATION] Error:", error);
      alert("Failed to process leads: " + error.message);
    }
  };

  // Step 1: Save basic campaign info
  const saveStep1 = async () => {
    if (!campaignData.name.trim()) {
      alert("Please enter a campaign name");
      return false;
    }

    setSaving(true);
    try {
      if (!campaignData.id) {
        const newCampaign = await Api.createCampaign({
          name: campaignData.name.trim(),
          goal: campaignData.goal.trim() || null,
        });
        setCampaignData({ ...campaignData, id: newCampaign.id });
      } else {
        await Api.updateCampaign(campaignData.id, {
          name: campaignData.name.trim(),
          goal: campaignData.goal.trim() || null,
        });
      }
      return true;
    } catch (error: any) {
      console.error("Failed to save campaign:", error);
      alert("Failed to save campaign: " + error.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Step 2: Save email sequence
  const saveStep2 = async () => {
    if (campaignData.steps.length === 0) {
      alert("Please add at least one email step");
      return false;
    }

    setSaving(true);
    try {
      await Api.setCampaignSteps(campaignData.id!, campaignData.steps);
      return true;
    } catch (error: any) {
      console.error("Failed to save sequence:", error);
      alert("Failed to save sequence: " + error.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Step 3: Save selected leads
  const saveStep3 = async () => {
    if (campaignData.selectedLeadIds.length === 0) {
      alert("Please select at least one lead");
      return false;
    }

    setSaving(true);
    try {
      await Api.addCampaignLeads(campaignData.id!, campaignData.selectedLeadIds);
      return true;
    } catch (error: any) {
      console.error("Failed to add leads:", error);
      alert("Failed to add leads: " + error.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Navigation handlers
  const handleNext = async () => {
    let canProceed = true;

    if (currentStep === 1) {
      canProceed = await saveStep1();
    } else if (currentStep === 2) {
      canProceed = await saveStep2();
    } else if (currentStep === 3) {
      canProceed = await saveStep3();
    }

    if (canProceed) {
      setCurrentStep((currentStep + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
    }
  };

  const handleFinish = async () => {
    if (onComplete && campaignData.id) {
      onComplete(campaignData.id);
    }
  };

  // Step-specific handlers
  const addStep = () => {
    const nextOrder = campaignData.steps.length + 1;
    setCampaignData({
      ...campaignData,
      steps: [
        ...campaignData.steps,
        { step_order: nextOrder, delay_days: 3, subject_template: "", body_template: "" },
      ],
    });
  };

  const removeStep = (index: number) => {
    const newSteps = campaignData.steps
      .filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, step_order: i + 1 }));
    setCampaignData({ ...campaignData, steps: newSteps });
  };

  const updateStep = (index: number, updates: Partial<typeof campaignData.steps[0]>) => {
    const newSteps = [...campaignData.steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setCampaignData({ ...campaignData, steps: newSteps });
  };

  const toggleLead = (leadId: string) => {
    const selected = new Set(campaignData.selectedLeadIds);
    if (selected.has(leadId)) {
      selected.delete(leadId);
    } else {
      selected.add(leadId);
    }
    setCampaignData({ ...campaignData, selectedLeadIds: Array.from(selected) });
  };

  const selectAllLeads = () => {
    setCampaignData({ ...campaignData, selectedLeadIds: filteredLeads.map((l) => l.id) });
  };

  const deselectAllLeads = () => {
    setCampaignData({ ...campaignData, selectedLeadIds: [] });
  };

  const updateMessage = async (messageId: string, updates: any) => {
    try {
      await Api.updateGeneratedMessage(messageId, updates);
      // Update local state
      setGeneratedMessages(prev => 
        prev.map(msg => msg.id === messageId ? { ...msg, ...updates } : msg)
      );
    } catch (error: any) {
      console.error("Failed to update message:", error);
      alert("Failed to update message: " + error.message);
    }
  };

  // Render wizard steps indicator
  const renderStepsIndicator = () => {
    const steps = [
      { number: 1, label: "Details", icon: Mail },
      { number: 2, label: "Sequence", icon: Zap },
      { number: 3, label: "Leads", icon: Users },
      { number: 4, label: "Preview & Launch", icon: Eye },
    ];

    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 32 }}>
        {steps.map((step, index) => {
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          const Icon = step.icon;

          return (
            <div key={step.number} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: isCompleted ? "#10B981" : isActive ? "#E64B8B" : "#E5E7EB",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 18,
                    transition: "all 0.3s",
                  }}
                >
                  {isCompleted ? <Check size={24} /> : <Icon size={24} />}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: isActive ? "#E64B8B" : isCompleted ? "#10B981" : "#9CA3AF",
                  }}
                >
                  {step.label}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  style={{
                    width: 60,
                    height: 2,
                    background: currentStep > step.number ? "#10B981" : "#E5E7EB",
                    marginBottom: 24,
                    transition: "all 0.3s",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render navigation buttons
  const renderNavigationButtons = () => {
    const isLastStep = currentStep === 4 && enrichmentPhase === 'preview';
    const isStep4InProgress = currentStep === 4 && enrichmentPhase !== 'preview';

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingTop: 24,
          borderTop: "1px solid #E5E7EB",
          marginTop: 32,
        }}
      >
        <button
          onClick={handleBack}
          disabled={currentStep === 1 || isStep4InProgress}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 24px",
            borderRadius: 12,
            border: "1px solid #E5E7EB",
            background: "#fff",
            cursor: (currentStep === 1 || isStep4InProgress) ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 14,
            color: (currentStep === 1 || isStep4InProgress) ? "#9CA3AF" : "#374151",
            opacity: (currentStep === 1 || isStep4InProgress) ? 0.5 : 1,
          }}
        >
          <ChevronLeft size={18} />
          Back
        </button>

        {isLastStep ? (
          <button
            onClick={handleFinish}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 32px",
              borderRadius: 12,
              border: "none",
              background: "#10B981",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
            }}
          >
            <Check size={18} />
            Launch Campaign
          </button>
        ) : isStep4InProgress ? (
          <button
            disabled
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 32px",
              borderRadius: 12,
              border: "none",
              background: "#9CA3AF",
              color: "#fff",
              cursor: "not-allowed",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Processing...
          </button>
        ) : currentStep < 4 ? (
          <button
            onClick={handleNext}
            disabled={saving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 32px",
              borderRadius: 12,
              border: "none",
              background: saving ? "#9CA3AF" : "#E64B8B",
              color: "#fff",
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: 14,
              boxShadow: saving ? "none" : "0 2px 8px rgba(230, 75, 139, 0.3)",
            }}
          >
            {saving ? "Saving..." : "Next"}
            <ChevronRight size={18} />
          </button>
        ) : null}
      </div>
    );
  };

  // STEP 1: Campaign Details
  const renderStep1 = () => (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "#111" }}>
        Campaign Details
      </h2>
      <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 32 }}>
        Give your campaign a name and describe its goal
      </p>

      <div style={{ display: "grid", gap: 24 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#374151" }}>
            Campaign Name *
          </label>
          <input
            type="text"
            value={campaignData.name}
            onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
            placeholder="e.g., Q1 SaaS Decision Maker Outreach"
            style={{
              width: "100%",
              padding: "14px 16px",
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              fontSize: 14,
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#E64B8B")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#374151" }}>
            Campaign Goal (Optional)
          </label>
          <textarea
            value={campaignData.goal}
            onChange={(e) => setCampaignData({ ...campaignData, goal: e.target.value })}
            placeholder="e.g., Book 10 discovery calls with VP+ at SaaS companies with 100+ employees"
            rows={4}
            style={{
              width: "100%",
              padding: "14px 16px",
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              fontSize: 14,
              outline: "none",
              resize: "vertical",
              fontFamily: "inherit",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#E64B8B")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
          />
          <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 8 }}>
            This helps the AI generate more relevant personalized messages
          </p>
        </div>
      </div>
    </div>
  );

  // STEP 2: Build Email Sequence
  const renderStep2 = () => (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "#111" }}>
            Build Email Sequence
          </h2>
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            Add email steps and configure timing. AI will personalize each message per lead.
          </p>
        </div>
        <button
          onClick={addStep}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            borderRadius: 12,
            border: "1px solid #E5E7EB",
            background: "#fff",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            color: "#E64B8B",
          }}
        >
          <Plus size={18} />
          Add Step
        </button>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {campaignData.steps.map((step, index) => (
          <div
            key={step.step_order}
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: 16,
              padding: 20,
              background: "#fff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#E64B8B15",
                    color: "#E64B8B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {step.step_order}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>
                  Email Step {step.step_order}
                </h3>
              </div>
              {campaignData.steps.length > 1 && (
                <button
                  onClick={() => removeStep(index)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid #FEE2E2",
                    background: "#FEF2F2",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#EF4444",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              )}
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#374151" }}>
                  Delay (days after previous step)
                </label>
                <input
                  type="number"
                  min="0"
                  value={step.delay_days}
                  onChange={(e) => updateStep(index, { delay_days: Number(e.target.value) })}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #E5E7EB",
                    borderRadius: 10,
                    fontSize: 14,
                    outline: "none",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#E64B8B")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
                />
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6 }}>
                  {step.delay_days === 0
                    ? "Send immediately"
                    : `Send ${step.delay_days} day${step.delay_days !== 1 ? "s" : ""} after ${
                        step.step_order === 1 ? "campaign starts" : `Step ${step.step_order - 1}`
                      }`}
                </p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#374151" }}>
                  Subject Template (Optional)
                </label>
                <input
                  type="text"
                  value={step.subject_template}
                  onChange={(e) => updateStep(index, { subject_template: e.target.value })}
                  placeholder="e.g., Quick question about {{company}}"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #E5E7EB",
                    borderRadius: 10,
                    fontSize: 14,
                    outline: "none",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#E64B8B")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
                />
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6 }}>
                  Leave blank to let AI generate personalized subjects
                </p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#374151" }}>
                  Body Template (Optional)
                </label>
                <textarea
                  value={step.body_template}
                  onChange={(e) => updateStep(index, { body_template: e.target.value })}
                  placeholder="Leave blank—AI will generate personalized messages using enrichment data and property analysis"
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #E5E7EB",
                    borderRadius: 10,
                    fontSize: 14,
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#E64B8B")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
                />
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6 }}>
                  Use {"{{"} variables {"} }"} for personalization: company, first_name, title, etc.
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 24,
          padding: 16,
          background: "#FEF3F8",
          borderRadius: 12,
          border: "1px solid #F8D7E6",
        }}
      >
        <p style={{ fontSize: 13, color: "#E64B8B", lineHeight: 1.6 }}>
          💡 <strong>Pro tip:</strong> Leave templates blank to unlock the full power of AI. The system will
          analyze each lead's enrichment data, property insights, and company analysis to craft highly
          personalized messages that drive responses.
        </p>
      </div>
    </div>
  );

  // STEP 3: Select Leads
  const renderStep3 = () => {
    const selectedCount = campaignData.selectedLeadIds.length;
    const allFilteredSelected = filteredLeads.length > 0 && filteredLeads.every((l) => campaignData.selectedLeadIds.includes(l.id));
    
    // Get enrichment stats for selected leads
    const selectedLeads = allLeads.filter(l => campaignData.selectedLeadIds.includes(l.id));
    const enrichedCount = selectedLeads.filter(l => l.enrichment_status === 'complete').length;
    const needEnrichmentCount = selectedCount - enrichedCount;

    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "#111" }}>
            Select Leads
          </h2>
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            Choose leads for this campaign. We'll auto-enrich any unenriched leads before generating messages.
          </p>
        </div>

        <div style={{ display: "grid", gap: 16, marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input
              type="text"
              value={leadSearchQuery}
              onChange={(e) => setLeadSearchQuery(e.target.value)}
              placeholder="Search by name, company, title, or email..."
              style={{
                flex: 1,
                padding: "12px 16px",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                fontSize: 14,
                outline: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#E64B8B")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
            />
            <button
              onClick={selectAllLeads}
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid #E5E7EB",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                color: "#E64B8B",
              }}
            >
              Select All
            </button>
            <button
              onClick={deselectAllLeads}
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid #E5E7EB",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                color: "#6B7280",
              }}
            >
              Clear All
            </button>
          </div>

          <div
            style={{
              padding: 16,
              background: "#F9FAFB",
              borderRadius: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 14, color: "#374151" }}>
              <strong style={{ color: "#E64B8B", fontSize: 18 }}>{selectedCount}</strong> lead
              {selectedCount !== 1 ? "s" : ""} selected
            </div>
            {selectedCount > 0 && (
              <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
                <div style={{ color: "#10B981", fontWeight: 600 }}>
                  <CheckCircle2 size={16} style={{ display: "inline", marginRight: 4 }} />
                  {enrichedCount} enriched
                </div>
                {needEnrichmentCount > 0 && (
                  <div style={{ color: "#F59E0B", fontWeight: 600 }}>
                    <RefreshCw size={16} style={{ display: "inline", marginRight: 4 }} />
                    {needEnrichmentCount} need enrichment
                  </div>
                )}
              </div>
            )}
          </div>

          {needEnrichmentCount > 0 && (
            <div
              style={{
                padding: 16,
                background: "#FFFBEB",
                borderRadius: 12,
                border: "1px solid #FDE68A",
                display: "flex",
                gap: 12,
                alignItems: "start",
              }}
            >
              <AlertCircle size={20} color="#F59E0B" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#92400E", marginBottom: 4 }}>
                  Enrichment Required
                </div>
                <div style={{ fontSize: 13, color: "#78350F", lineHeight: 1.5 }}>
                  {needEnrichmentCount} lead{needEnrichmentCount !== 1 ? "s" : ""} will be automatically enriched in the next step.
                  This includes Apollo data enrichment and AI property analysis to ensure highly personalized messaging.
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>
            <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ marginTop: 12 }}>Loading leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div
            style={{
              border: "2px dashed #E5E7EB",
              borderRadius: 16,
              padding: 40,
              textAlign: "center",
              background: "#FAFAFA",
            }}
          >
            <Users size={48} color="#9CA3AF" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "#111" }}>
              {leadSearchQuery ? "No leads found" : "No leads yet"}
            </h3>
            <p style={{ fontSize: 14, color: "#6B7280" }}>
              {leadSearchQuery
                ? "Try adjusting your search query"
                : "Import or create some leads first before creating campaigns"}
            </p>
          </div>
        ) : (
          <div
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: 16,
              overflow: "hidden",
              background: "#fff",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                background: "#F9FAFB",
                borderBottom: "1px solid #E5E7EB",
                display: "grid",
                gridTemplateColumns: "40px 1fr 120px",
                gap: 12,
                alignItems: "center",
                fontWeight: 600,
                fontSize: 13,
                color: "#6B7280",
              }}
            >
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={(e) => {
                  if (e.target.checked) {
                    selectAllLeads();
                  } else {
                    deselectAllLeads();
                  }
                }}
                style={{ cursor: "pointer" }}
              />
              <div>Lead Details</div>
              <div style={{ textAlign: "center" }}>Status</div>
            </div>

            <div style={{ maxHeight: 400, overflow: "auto" }}>
              {filteredLeads.map((lead) => {
                const isSelected = campaignData.selectedLeadIds.includes(lead.id);
                const isEnriched = lead.enrichment_status === 'complete';
                const name = `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim() || "—";
                const email = lead.enrichment?.email ?? lead.email ?? "—";
                const company = lead.company_name ?? "—";
                const title = lead.title ?? "—";

                return (
                  <div
                    key={lead.id}
                    onClick={() => toggleLead(lead.id)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "40px 1fr 120px",
                      gap: 12,
                      padding: "16px",
                      borderBottom: "1px solid #F3F4F6",
                      alignItems: "center",
                      cursor: "pointer",
                      background: isSelected ? "#FEF2F7" : "#fff",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "#F9FAFB";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "#fff";
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      style={{ cursor: "pointer" }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: "#111" }}>
                        {name}
                      </div>
                      <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 2 }}>
                        {title} at {company}
                      </div>
                      <div style={{ fontSize: 13, color: "#9CA3AF" }}>{email}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      {isEnriched ? (
                        <div
                          style={{
                            padding: "4px 10px",
                            borderRadius: 20,
                            background: "#D1FAE5",
                            color: "#065F46",
                            fontSize: 12,
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <CheckCircle2 size={14} />
                          Enriched
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: "4px 10px",
                            borderRadius: 20,
                            background: "#FEF3C7",
                            color: "#92400E",
                            fontSize: 12,
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <RefreshCw size={14} />
                          Pending
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // STEP 4: Enrichment, Generation & Preview
  const renderStep4 = () => {
    const totalMessages = campaignData.selectedLeadIds.length * campaignData.steps.length;
    const { total, completed, failed } = enrichmentProgress;
    
    // Checking phase
    if (enrichmentPhase === 'checking') {
      return (
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <Loader2
            size={60}
            color="#E64B8B"
            style={{ animation: "spin 1s linear infinite", margin: "0 auto 24px" }}
          />
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: "#111" }}>
            Checking Lead Enrichment Status
          </h2>
          <p style={{ fontSize: 16, color: "#6B7280" }}>
            Analyzing {campaignData.selectedLeadIds.length} selected leads...
          </p>
        </div>
      );
    }
    
    // Enriching phase
    if (enrichmentPhase === 'enriching') {
      const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return (
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "#E64B8B15",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <RefreshCw size={40} color="#E64B8B" style={{ animation: "spin 2s linear infinite" }} />
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, color: "#111" }}>
            Enriching Leads
          </h2>
          <p style={{ fontSize: 16, color: "#6B7280", marginBottom: 40, lineHeight: 1.6 }}>
            Running Apollo enrichment and AI property analysis for personalized messaging
          </p>

          <div
            style={{
              background: "#F9FAFB",
              border: "1px solid #E5E7EB",
              borderRadius: 16,
              padding: 32,
              marginBottom: 32,
            }}
          >
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                <span style={{ color: "#6B7280" }}>Progress</span>
                <span style={{ color: "#E64B8B" }}>{completed} of {total}</span>
              </div>
              <div style={{ width: "100%", height: 8, background: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: "100%",
                    background: "#E64B8B",
                    transition: "width 0.3s",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>Total</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#111" }}>{total}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>Completed</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#10B981" }}>{completed}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>Failed</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#EF4444" }}>{failed}</div>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: 16,
              background: "#FFFBEB",
              borderRadius: 12,
              border: "1px solid #FDE68A",
              textAlign: "left",
            }}
          >
            <p style={{ fontSize: 13, color: "#92400E", lineHeight: 1.6 }}>
              ⏱️ <strong>Note:</strong> Lead enrichment includes Apollo data lookup, company analysis, and
              AI-powered property insights. This typically takes 10-30 seconds per lead. Please don't close this page.
            </p>
          </div>
        </div>
      );
    }
    
    // Generating phase
    if (enrichmentPhase === 'generating') {
      return (
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "#E64B8B15",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <Zap size={40} color="#E64B8B" />
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, color: "#111" }}>
            Generating Personalized Messages
          </h2>
          <p style={{ fontSize: 16, color: "#6B7280", marginBottom: 40, lineHeight: 1.6 }}>
            AI is analyzing enrichment data and crafting <strong style={{ color: "#E64B8B" }}>{totalMessages} unique messages</strong>
          </p>

          <div
            style={{
              padding: 32,
              background: "#E64B8B15",
              borderRadius: 16,
              marginBottom: 32,
            }}
          >
            <Loader2
              size={48}
              color="#E64B8B"
              style={{ animation: "spin 1s linear infinite", margin: "0 auto 16px" }}
            />
            <div style={{ fontSize: 16, fontWeight: 600, color: "#E64B8B", marginBottom: 8 }}>
              Crafting personalized emails...
            </div>
            <div style={{ fontSize: 14, color: "#6B7280" }}>
              Using company insights, property analysis, and lead data
            </div>
          </div>

          <div
            style={{
              background: "#F9FAFB",
              border: "1px solid #E5E7EB",
              borderRadius: 16,
              padding: 24,
              textAlign: "left",
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: "#111" }}>
              What's happening?
            </h3>
            <ul style={{ fontSize: 14, color: "#6B7280", lineHeight: 2, paddingLeft: 20 }}>
              <li>Analyzing each lead's enrichment data and property insights</li>
              <li>Identifying unique business opportunities and pain points</li>
              <li>Crafting personalized subject lines and email bodies</li>
              <li>Ensuring each message is relevant and compelling</li>
            </ul>
          </div>
        </div>
      );
    }
    
    // Preview phase
    if (enrichmentPhase === 'preview') {
      return (
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "#111" }}>
              Review Personalized Messages
            </h2>
            <p style={{ fontSize: 14, color: "#6B7280" }}>
              Preview and edit AI-generated emails before launching your campaign
            </p>
          </div>

          <div
            style={{
              padding: 20,
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: 16,
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <CheckCircle2 size={32} color="#10B981" />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#065F46", marginBottom: 4 }}>
                {generatedMessages.length} Messages Generated Successfully
              </div>
              <div style={{ fontSize: 14, color: "#047857" }}>
                All leads enriched • Personalized using property analysis and company insights
              </div>
            </div>
          </div>

          {generatedMessages.length === 0 ? (
            <div
              style={{
                border: "2px dashed #E5E7EB",
                borderRadius: 16,
                padding: 40,
                textAlign: "center",
                background: "#FAFAFA",
              }}
            >
              <Mail size={48} color="#9CA3AF" style={{ margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "#111" }}>
                No messages generated
              </h3>
              <p style={{ fontSize: 14, color: "#6B7280" }}>
                Something went wrong during message generation
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 20 }}>
              {Object.entries(messagesByLead).map(([leadId, messages]) => {
                const lead = allLeads.find((l) => l.id === leadId);
                const leadName = lead ? `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim() || "Unknown" : "Unknown";
                const leadCompany = lead?.company_name ?? "—";
                const leadTitle = lead?.title ?? "—";

                return (
                  <div
                    key={leadId}
                    style={{
                      border: "1px solid #E5E7EB",
                      borderRadius: 16,
                      overflow: "hidden",
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        padding: "16px 20px",
                        background: "#F9FAFB",
                        borderBottom: "1px solid #E5E7EB",
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: "#111" }}>
                        {leadName}
                      </div>
                      <div style={{ fontSize: 13, color: "#6B7280" }}>
                        {leadTitle} at {leadCompany}
                      </div>
                    </div>

                    <div style={{ padding: 20, display: "grid", gap: 16 }}>
                      {messages.map((message, idx) => {
                        return (
                          <div
                            key={message.id}
                            style={{
                              border: "1px solid #E5E7EB",
                              borderRadius: 12,
                              padding: 16,
                              background: "#fff",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                              <div
                                style={{
                                  padding: "4px 12px",
                                  borderRadius: 20,
                                  background: "#E64B8B15",
                                  color: "#E64B8B",
                                  fontSize: 13,
                                  fontWeight: 600,
                                }}
                              >
                                Step {idx + 1}
                              </div>
                            </div>

                            <div style={{ marginBottom: 12 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>
                                Subject:
                              </div>
                              <input
                                type="text"
                                value={message.subject || ""}
                                onChange={(e) => updateMessage(message.id, { subject: e.target.value })}
                                style={{
                                  width: "100%",
                                  padding: "10px 12px",
                                  border: "1px solid #E5E7EB",
                                  borderRadius: 8,
                                  fontSize: 14,
                                  fontWeight: 600,
                                  outline: "none",
                                }}
                                onFocus={(e) => (e.currentTarget.style.borderColor = "#E64B8B")}
                                onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
                              />
                            </div>

                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>
                                Body:
                              </div>
                              <textarea
                                value={message.body || ""}
                                onChange={(e) => updateMessage(message.id, { body: e.target.value })}
                                rows={8}
                                style={{
                                  width: "100%",
                                  padding: "10px 12px",
                                  border: "1px solid #E5E7EB",
                                  borderRadius: 8,
                                  fontSize: 14,
                                  outline: "none",
                                  resize: "vertical",
                                  fontFamily: "inherit",
                                  lineHeight: 1.6,
                                }}
                                onFocus={(e) => (e.currentTarget.style.borderColor = "#E64B8B")}
                                onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div
            style={{
              marginTop: 24,
              padding: 16,
              background: "#FEF3F8",
              borderRadius: 12,
              border: "1px solid #F8D7E6",
            }}
          >
            <p style={{ fontSize: 13, color: "#E64B8B", lineHeight: 1.6 }}>
              💡 <strong>Pro tip:</strong> Review the messages to ensure they match your brand voice. Feel free
              to edit any message before launching. The AI has used enrichment data to personalize each email.
            </p>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <AppShell title="Campaign Builder" active="campaigns" onNav={onNav}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px" }}>
        {renderStepsIndicator()}

        <div style={{ minHeight: 500 }}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        {renderNavigationButtons()}
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </AppShell>
  );
}
