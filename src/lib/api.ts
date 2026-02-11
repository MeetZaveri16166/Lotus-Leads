import { projectId, publicAnonKey } from '/utils/supabase/info';
import { getSupabaseClient } from '@/utils/supabase/client';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-2f1627d1`;

// Helper to get the current auth token from Supabase session
async function getAuthToken(): Promise<string | null> {
  const supabase = getSupabaseClient();
  
  // Get current session - Supabase handles token refresh automatically
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session?.access_token) {
    console.log('[API] No valid session found');
    return null;
  }
  
  return session.access_token;
}

// Helper to handle 401 errors and sign out if needed
async function apiCall<T>(path: string, opts?: RequestInit, retryCount = 0, silent = false): Promise<T> {
  const token = await getAuthToken();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts?.headers || {}),
  };
  
  // Use user token if available, otherwise use public anon key
  headers["Authorization"] = `Bearer ${token || publicAnonKey}`;
  
  if (!silent) {
    console.log(`[API] 🔄 Calling ${path}...`);
    console.log(`[API] 🔑 Using token:`, token ? `${token.substring(0, 20)}...` : 'ANON_KEY');
    console.log(`[API] 🌐 Full URL: ${API_BASE}${path}`);
  }
  
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
  });
  
  if (!silent) {
    console.log(`[API] 📡 Response status: ${res.status} ${res.statusText}`);
  }
  
  // Handle 401 errors - session expired or invalid
  if (res.status === 401) {
    if (!silent) {
      console.error(`[API] Got 401 on ${path} - Check backend logs`);
      console.error(`[API] Token: ${token ? 'Present' : 'Missing'}`);
    }
    
    // DON'T auto-logout - let the app handle it
    throw new Error('Unauthorized - check if you have access to this resource');
  }
  
  if (!res.ok) {
    const errorText = await res.text();
    if (!silent) {
      console.error(`[API] Error response from ${path}:`, res.status, errorText);
    }
    throw new Error(errorText || `Request failed with status ${res.status}`);
  }
  
  return res.json();
}

async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  try {
    return await apiCall<T>(path, opts, 0, false);
  } catch (error: any) {
    console.error(`[API] Error calling ${path}:`, error.message);
    throw error;
  }
}

// Silent version for non-critical calls (like health checks)
async function apiSilent<T>(path: string, opts?: RequestInit): Promise<T> {
  try {
    return await apiCall<T>(path, opts, 0, true);
  } catch (error: any) {
    // Silent - just throw without logging
    throw error;
  }
}

export const Api = {
  // API Settings
  getSettings: () => api("/api/settings"),
  updateSettings: (payload: any) =>
    api("/api/settings", { method: "POST", body: JSON.stringify(payload) }),

  // Business Profile
  getBusinessProfile: () => api("/api/business-profile"),
  upsertBusinessProfile: (payload: any) =>
    api("/api/business-profile", { method: "POST", body: JSON.stringify(payload) }),

  // ICP
  createIcpRun: (payload: any) => api("/api/icp-runs", { method: "POST", body: JSON.stringify(payload) }),
  discoverIcpRun: (id: string, payload: any) =>
    api(`/api/icp-runs/${id}/discover`, { method: "POST", body: JSON.stringify(payload) }),

  // Leads
  getLeads: (orgId: string) => api(`/api/organizations/${orgId}/leads`),
  listLeads: (filters?: { status?: string; enrichment_status?: string; icpRunId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.enrichment_status) params.append("enrichment_status", filters.enrichment_status);
    if (filters?.icpRunId) params.append("icpRunId", filters.icpRunId);
    const query = params.toString();
    return api<any[]>(`/api/leads${query ? `?${query}` : ""}`);
  },
  getLead: (leadId: string) => api(`/api/leads/${leadId}`),
  createLead: (orgId: string, leadData: any) =>
    api(`/api/organizations/${orgId}/leads`, { method: "POST", body: JSON.stringify(leadData) }),
  deleteLead: (leadId: string) => api(`/api/leads/${leadId}`, { method: "DELETE" }),
  bulkDeleteLeads: (leadIds: string[]) =>
    api(`/api/leads/bulk-delete`, { method: "POST", body: JSON.stringify({ leadIds }) }),
  updateLeadStatus: (leadId: string, payload: { status?: string; qualification_level?: string }) =>
    api(`/api/leads/${leadId}/status`, { method: "PATCH", body: JSON.stringify(payload) }),
  
  // Lead Search (Apollo API)
  searchLeads: (payload: {
    titles?: string[];
    seniorities?: string[];
    industries?: string[];
    company_size?: string[];
    country?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    page?: number;
  }) =>
    api<{ leads: any[]; page: number; has_more: boolean }>(`/api/leads/search`, { 
      method: "POST", 
      body: JSON.stringify(payload) 
    }),

  // Save search results as leads
  saveSearchResultsAsLeads: (leads: any[]) =>
    api(`/api/leads/save-from-search`, { 
      method: "POST", 
      body: JSON.stringify({ leads }) 
    }),

  // Lead Activities
  getLeadActivities: (leadId: string) =>
    api(`/api/leads/${leadId}/activities`),
  createLeadActivity: (leadId: string, payload: { 
    activity_type: string; 
    content: string; 
    created_by: string;
    follow_up_date?: string;
    follow_up_action?: string;
    follow_up_completed?: boolean;
  }) =>
    api(`/api/leads/${leadId}/activities`, { method: "POST", body: JSON.stringify(payload) }),
  updateLeadActivity: (leadId: string, activityId: string, payload: { 
    content?: string; 
    activity_type?: string;
    follow_up_date?: string;
    follow_up_action?: string;
    follow_up_completed?: boolean;
  }) =>
    api(`/api/leads/${leadId}/activities/${activityId}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteLeadActivity: (leadId: string, activityId: string) =>
    api(`/api/leads/${leadId}/activities/${activityId}`, { method: "DELETE" }),

  // ========================================
  // ICP SAVED SEARCHES
  // ========================================
  
  saveIcpSearch: (data: {
    name: string;
    description?: string;
    job_titles: string[];
    seniorities: string[];
    industries: string[];
    company_sizes: string[];
    country?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  }): Promise<any> => {
    return api("/api/icp-searches", { method: "POST", body: JSON.stringify(data) });
  },
  
  listIcpSearches: (): Promise<any[]> => {
    return api("/api/icp-searches");
  },

  getIcpSearch: (id: string): Promise<any> => {
    return api(`/api/icp-searches/${id}`);
  },
  
  recordSearchRun: (id: string, resultCount: number): Promise<any> => {
    return api(`/api/icp-searches/${id}/record-run`, { method: "POST", body: JSON.stringify({ result_count: resultCount }) });
  },
  
  deleteIcpSearch: (id: string): Promise<void> => {
    return api(`/api/icp-searches/${id}`, { method: "DELETE" });
  },

  // ========================================
  // LEAD ENRICHMENT
  // ========================================
  
  // Enrich a lead with Apollo (2-part flow: person reveal + org enrich + AI)
  enrichLead: (leadId: string) =>
    api(`/api/leads/${leadId}/enrich`, { method: 'POST' }),

  // Bulk enrich multiple leads at once
  enrichLeads: (leadIds: string[]) =>
    api(`/api/leads/enrich`, { method: 'POST', body: JSON.stringify({ leadIds }) }),

  getLeadById: (leadId: string): Promise<any> => {
    return api(`/api/leads/${leadId}`);
  },

  // ========================================
  // BUSINESS OPPORTUNITY INSIGHT
  // ========================================
  
  // Stage 1: Geo Enrichment - Get satellite imagery and location data
  getGeoEnrichment: (leadId: string) =>
    api(`/api/leads/${leadId}/geo-enrichment`),

  // Stage 2: Property Analysis - AI vision + Google Places detection
  getPropertyAnalysis: (leadId: string) =>
    api(`/api/leads/${leadId}/property-analysis`, { method: "POST" }),

  // Stage 3: Service Mapping - Map property features to sellable services
  getServiceMapping: (leadId: string) =>
    api(`/api/leads/${leadId}/service-mapping`, { method: "POST" }),

  // ========================================
  // CAMPAIGNS
  // ========================================
  
  listCampaigns: () => api<any[]>("/api/campaigns"),
  getCampaign: (campaignId: string) => api(`/api/campaigns/${campaignId}`),
  createCampaign: (payload: any) =>
    api("/api/campaigns", { method: "POST", body: JSON.stringify(payload) }),
  updateCampaign: (campaignId: string, payload: any) =>
    api(`/api/campaigns/${campaignId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteCampaign: (campaignId: string) =>
    api(`/api/campaigns/${campaignId}`, { method: "DELETE" }),
  setCampaignSteps: (campaignId: string, steps: any[]) =>
    api(`/api/campaigns/${campaignId}/steps`, { method: "POST", body: JSON.stringify({ steps }) }),
  addCampaignLeads: (campaignId: string, leadIds: string[]) =>
    api(`/api/campaigns/${campaignId}/leads`, { method: "POST", body: JSON.stringify({ leadIds }) }),

  // Messages + Launch
  generateMessages: (campaignId: string) =>
    api(`/api/campaigns/${campaignId}/generate-messages`, { method: "POST" }),
  listGeneratedMessages: (campaignId: string) =>
    api<any[]>(`/api/campaigns/${campaignId}/messages`),
  updateGeneratedMessage: (id: string, patch: any) =>
    api(`/api/messages/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  launchCampaign: (campaignId: string) =>
    api(`/api/campaigns/${campaignId}/launch`, { method: "POST" }),
  getCampaignDashboard: (campaignId: string) =>
    api<any>(`/api/campaigns/${campaignId}/dashboard`),
  
  // ========================================
  // CREDITS & USAGE
  // ========================================
  
  getCreditBalance: () => apiSilent<{ balance: number }>("/api/credits/balance"),
  getCreditTransactions: () => api<any[]>("/api/credits/transactions"),
  
  // ========================================
  // DEBUG
  // ========================================
  
  debugAuth: () => api<any>("/debug/auth"),
  
  // ========================================
  // WORKSPACE INITIALIZATION
  // ========================================
  
  initWorkspace: () => api<{ success: boolean; message: string; workspace?: any }>("/api/init-workspace"),
  
  // ========================================
  // ADMIN / TEAM MANAGEMENT
  // ========================================
  
  getTeamMembers: () => api<{ members: any[] }>("/admin/team-members"),
  inviteTeamMember: (email: string, role: "admin" | "member") =>
    api("/admin/invite-user", { method: "POST", body: JSON.stringify({ email, role }) }),
  removeTeamMember: (membershipId: string) =>
    api(`/admin/remove-member/${membershipId}`, { method: "DELETE" }),
};