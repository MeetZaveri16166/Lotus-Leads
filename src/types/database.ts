export type BusinessProfile = {
  id: string;
  workspace_id: string;
  company_name: string;
  industry?: string | null;
  services: string[];
  pain_points: string[];
  ideal_customer?: string | null;
  outreach_tone: "professional" | "consultative" | "friendly" | string;
  extra_context: Record<string, any>;
};

export type IcpRun = {
  id: string;
  name?: string | null;
  filters: Record<string, any>;
  status: "draft" | "running" | "complete" | "failed" | string;
  discovered_count: number;
  created_at: string;
};

export type Lead = {
  id: string;
  status: "discovered" | "enriched" | "suppressed" | "archived" | string;
  first_name?: string | null;
  last_name?: string | null;
  title?: string | null;
  linkedin_url?: string | null;
  company_name?: string | null;
  company_domain?: string | null;
  company_size?: string | null;
  industry?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  created_at: string;
  enrichment?: LeadEnrichment | null; // include on API response
};

export type LeadEnrichment = {
  lead_id: string;
  status: "pending" | "complete" | "failed" | string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  provider?: string | null;
  enriched_at?: string | null;
};

export type Campaign = {
  id: string;
  name: string;
  status: "draft" | "ready" | "running" | "paused" | "completed" | string;
  sending_rules: Record<string, any>;
  start_at?: string | null;
  created_at: string;
};

export type SequenceStep = {
  id: string;
  campaign_id: string;
  step_order: number;
  delay_days: number;
  subject_template?: string | null;
  body_template?: string | null;
};

export type GeneratedMessage = {
  id: string;
  campaign_id: string;
  lead_id: string;
  step_id: string;
  subject?: string | null;
  body?: string | null;
  status: "generated" | "approved" | "rejected" | "edited" | string;
};
