import { useState, useEffect } from "react";
import { Api } from "@/lib/api";
import { ArrowLeft, Sparkles, Mail, Phone, Linkedin, Globe, MapPin, Building2, User, Briefcase, Target, Sprout, Wrench, ExternalLink, Maximize2, X, RefreshCw, TrendingUp, DollarSign, Clock, Users, Shield, Lightbulb, AlertCircle, CheckCircle, Calendar, Zap, FileText } from "lucide-react";
import { AppShell } from "@/app/components/AppShell";
import { OpportunityStageNavigator } from "@/app/components/OpportunityStageNavigator";
import { ActivityLog } from "@/app/components/ActivityLog";

interface Lead {
  id: string;
  // Person data
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  title?: string;
  // Company data
  company_name?: string;
  company_website?: string;
  company_domain?: string;
  company_phone?: string;
  company_description?: string;
  company_street?: string;
  company_city?: string;
  company_state?: string;
  company_postal_code?: string;
  company_country?: string;
  // Location
  city?: string;
  state?: string;
  country?: string;
  // IDs
  apollo_id?: string;
  organization_id?: string;
  // Enrichment
  enrichment_status?: string;
  enriched_at?: string;
  created_at?: string;
  // OpenAI Data
  company_description?: string;
  company_address?: string;
  geo_enrichment?: any;
  property_analysis?: any;
  service_mapping?: any;
  // Status & Qualification
  status?: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
  qualification_level?: "cold" | "warm" | "hot";
  status_updated_at?: string;
  status_updated_by?: string;
}

export default function LeadDetailPage({
  onNav,
  leadId,
}: {
  onNav: (key: string, data?: any) => void;
  leadId: string;
}) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "opportunity" | "activity">("details");
  const [geoEnrichment, setGeoEnrichment] = useState<any>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [googleMapsKey, setGoogleMapsKey] = useState<string>("");
  const [propertyAnalysis, setPropertyAnalysis] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [serviceMapping, setServiceMapping] = useState<any>(null);
  const [serviceMappingLoading, setServiceMappingLoading] = useState(false);

  useEffect(() => {
    loadLead();
    loadGoogleMapsKey();
  }, [leadId]);

  const loadGoogleMapsKey = async () => {
    try {
      const settings = await Api.getSettings();
      if (settings.google_maps_api_key) {
        setGoogleMapsKey(settings.google_maps_api_key);
      }
    } catch (e) {
      console.error("[GOOGLE MAPS] Failed to load API key:", e);
    }
  };

  const loadLead = async () => {
    setLoading(true);
    try {
      const data = await Api.getLeadById(leadId);
      setLead(data);
      
      // Load geo enrichment if it exists
      if (data.geo_enrichment) {
        setGeoEnrichment(data.geo_enrichment);
      }
      
      // Load property analysis if it exists
      if (data.property_analysis) {
        setPropertyAnalysis(data.property_analysis);
      }
      
      // Load service mapping if it exists
      if (data.service_mapping) {
        setServiceMapping(data.service_mapping);
      }
      
      console.log("[LEAD DETAIL] Loaded:", data);
      console.log("[LEAD DETAIL] Company Description:", data.company_description);
      console.log("[LEAD DETAIL] Company Address:", data.company_address);
      console.log("[LEAD DETAIL] Company Website:", data.company_website);
    } catch (e: any) {
      console.error("[LEAD DETAIL] Error loading:", e);
      alert(`Failed to load lead: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGeoEnrichment = async () => {
    setGeoLoading(true);
    try {
      const data = await Api.getGeoEnrichment(leadId);
      setGeoEnrichment(data);
      console.log("[GEO ENRICHMENT] Success:", data);
      alert("✓ Geo enrichment complete!");
    } catch (e: any) {
      console.error("[GEO ENRICHMENT] Error:", e);
      alert(`Failed to enrich: ${e.message}`);
    } finally {
      setGeoLoading(false);
    }
  };

  const handlePropertyAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      const data = await Api.getPropertyAnalysis(leadId);
      setPropertyAnalysis(data);
      console.log("[PROPERTY ANALYSIS] Success:", data);
      alert("✓ Property analysis complete!");
    } catch (e: any) {
      console.error("[PROPERTY ANALYSIS] Error:", e);
      alert(`Failed to analyze: ${e.message}`);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleServiceMapping = async () => {
    setServiceMappingLoading(true);
    try {
      const data = await Api.getServiceMapping(leadId);
      setServiceMapping(data);
      console.log("[SERVICE MAPPING] Success:", data);
      alert("✓ Service mapping complete!");
    } catch (e: any) {
      console.error("[SERVICE MAPPING] Error:", e);
      alert(`Failed to generate service mapping: ${e.message}`);
    } finally {
      setServiceMappingLoading(false);
    }
  };

  const handleFullAnalysis = async () => {
    try {
      // Run all 3 stages sequentially
      console.log("[FULL ANALYSIS] Starting all 3 stages...");
      
      // Stage 1: Geo Enrichment
      setGeoLoading(true);
      const geoData = await Api.getGeoEnrichment(leadId);
      setGeoEnrichment(geoData);
      console.log("[FULL ANALYSIS] Stage 1 complete");
      setGeoLoading(false);
      
      // Stage 2: Property Analysis
      setAnalysisLoading(true);
      const propertyData = await Api.getPropertyAnalysis(leadId);
      setPropertyAnalysis(propertyData);
      console.log("[FULL ANALYSIS] Stage 2 complete");
      setAnalysisLoading(false);
      
      // Stage 3: Service Mapping
      setServiceMappingLoading(true);
      const serviceData = await Api.getServiceMapping(leadId);
      setServiceMapping(serviceData);
      console.log("[FULL ANALYSIS] Stage 3 complete");
      setServiceMappingLoading(false);
      
      alert("✅ Full analysis complete! All 3 stages finished successfully.");
    } catch (e: any) {
      console.error("[FULL ANALYSIS] Error:", e);
      alert(`Full analysis failed: ${e.message}`);
      // Reset loading states
      setGeoLoading(false);
      setAnalysisLoading(false);
      setServiceMappingLoading(false);
    }
  };

  const handleEnrich = async () => {
    if (!lead?.apollo_id) {
      alert("This lead doesn't have an Apollo ID and cannot be enriched.");
      return;
    }

    setEnriching(true);
    try {
      const enrichedData = await Api.enrichLead(leadId);
      setLead(enrichedData);
      alert("Lead has been enriched successfully!");
    } catch (e: any) {
      console.error("[LEAD DETAIL] Enrichment error:", e);
      alert(`Enrichment failed: ${e.message}`);
    } finally {
      setEnriching(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    console.log(`[STATUS CHANGE] ========================================`);
    console.log(`[STATUS CHANGE] Lead ID: ${leadId}`);
    console.log(`[STATUS CHANGE] Current status: "${lead?.status}"`);
    console.log(`[STATUS CHANGE] New status: "${newStatus}"`);
    console.log(`[STATUS CHANGE] Calling API...`);
    
    try {
      const updated = await Api.updateLeadStatus(leadId, { status: newStatus as any });
      console.log(`[STATUS CHANGE] ✅ API response received:`, updated);
      console.log(`[STATUS CHANGE] Updated status in response: "${updated.status}"`);
      
      setLead(updated);
      console.log(`[STATUS CHANGE] ✅ State updated with new lead data`);
      console.log(`[STATUS CHANGE] ========================================`);
    } catch (e: any) {
      console.error(`[STATUS CHANGE] ❌ Error:`, e);
      console.error(`[STATUS CHANGE] ========================================`);
      alert(`Failed to update status: ${e.message}`);
    }
  };

  const handleQualificationChange = async (newLevel: string) => {
    console.log(`[QUALIFICATION CHANGE] ========================================`);
    console.log(`[QUALIFICATION CHANGE] Lead ID: ${leadId}`);
    console.log(`[QUALIFICATION CHANGE] Current qualification: "${lead?.qualification_level}"`);
    console.log(`[QUALIFICATION CHANGE] New qualification: "${newLevel}"`);
    console.log(`[QUALIFICATION CHANGE] Calling API...`);
    
    try {
      const updated = await Api.updateLeadStatus(leadId, { qualification_level: newLevel as any });
      console.log(`[QUALIFICATION CHANGE] ✅ API response received:`, updated);
      console.log(`[QUALIFICATION CHANGE] Updated qualification in response: "${updated.qualification_level}"`);
      
      setLead(updated);
      console.log(`[QUALIFICATION CHANGE] ✅ State updated with new lead data`);
      console.log(`[QUALIFICATION CHANGE] ========================================`);
    } catch (e: any) {
      console.error(`[QUALIFICATION CHANGE] ❌ Error:`, e);
      console.error(`[QUALIFICATION CHANGE] ========================================`);
      alert(`Failed to update qualification: ${e.message}`);
    }
  };

  const statusConfig = {
    new: { label: "New", color: "bg-gray-100 text-gray-700 border-gray-200" },
    contacted: { label: "Contacted", color: "bg-blue-100 text-blue-700 border-blue-200" },
    qualified: { label: "Qualified", color: "bg-green-100 text-green-700 border-green-200" },
    proposal: { label: "Proposal Sent", color: "bg-purple-100 text-purple-700 border-purple-200" },
    won: { label: "Won", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    lost: { label: "Lost", color: "bg-red-100 text-red-700 border-red-200" },
  };

  const qualificationConfig = {
    cold: { label: "Cold", color: "bg-blue-100 text-blue-700 border-blue-200", icon: "🔵" },
    warm: { label: "Warm", color: "bg-orange-100 text-orange-700 border-orange-200", icon: "🟡" },
    hot: { label: "Hot", color: "bg-red-100 text-red-700 border-red-200", icon: "🔴" },
  };

  // Ensure we always use valid status/qualification values
  const validStatuses = Object.keys(statusConfig) as Array<keyof typeof statusConfig>;
  const validQualifications = Object.keys(qualificationConfig) as Array<keyof typeof qualificationConfig>;
  
  const currentStatus = validStatuses.includes(lead?.status as any) ? (lead.status as keyof typeof statusConfig) : "new";
  const currentQualification = validQualifications.includes(lead?.qualification_level as any) ? (lead.qualification_level as keyof typeof qualificationConfig) : "cold";

  if (loading) {
    return (
      <AppShell title="Lead Details" active="leads" onNav={onNav}>
        <div className="max-w-5xl mx-auto p-6">
          <p className="text-gray-500">Loading lead details...</p>
        </div>
      </AppShell>
    );
  }

  if (!lead) {
    return (
      <AppShell title="Lead Details" active="leads" onNav={onNav}>
        <div className="max-w-5xl mx-auto p-6">
          <p className="text-red-600">Lead not found.</p>
          <button
            onClick={() => onNav("leads")}
            className="mt-4 text-[#E64B8B] hover:underline"
          >
            ← Back to Leads
          </button>
        </div>
      </AppShell>
    );
  }

  const fullName = lead.full_name || `${lead.first_name || ""} ${lead.last_name || ""}`.trim() || "Unknown Lead";
  const isEnriched = lead.enrichment_status === "complete";
  const hasApolloId = !!lead.apollo_id;

  return (
    <AppShell title="Lead Details" active="leads" onNav={onNav}>
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Back Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNav("leads")}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Leads
          </button>

          {hasApolloId && !isEnriched && (
            <button
              onClick={handleEnrich}
              disabled={enriching}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${enriching
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#E64B8B] to-[#d43d7a] text-white hover:shadow-lg hover:scale-105 active:scale-95"
                }
              `}
            >
              <Sparkles className="w-4 h-4" />
              {enriching ? "Enriching..." : "Enrich Lead"}
            </button>
          )}
        </div>

        {/* Lead Header Card - Redesigned */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Main Info Section with Gradient */}
          <div className="bg-gradient-to-br from-gray-50 to-white p-4 md:p-6">
            <div className="flex flex-col gap-4">
              {/* Left: Name, Title, Badges */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">{fullName}</h1>
                <p className="text-sm md:text-base text-gray-600 mb-3">{lead.title || "No title"}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {isEnriched && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-md border border-green-200">
                      <Sparkles className="w-3 h-3" />
                      Enriched
                    </span>
                  )}
                  {hasApolloId && (
                    <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md border border-gray-200">
                      APOLLO
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Status & Qualification - Stack on Mobile */}
              <div className="grid grid-cols-2 gap-3">
                {/* Status Dropdown */}
                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Status
                  </label>
                  <select
                    value={currentStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className={`w-full px-2.5 py-2 text-xs md:text-sm font-semibold rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/20 focus:border-[#E64B8B] ${statusConfig[currentStatus].color}`}
                  >
                    {Object.entries(statusConfig).map(([value, config]) => (
                      <option key={value} value={value}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Qualification Dropdown */}
                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Qualification
                  </label>
                  <select
                    value={currentQualification}
                    onChange={(e) => handleQualificationChange(e.target.value)}
                    className={`w-full px-2.5 py-2 text-xs md:text-sm font-semibold rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/20 focus:border-[#E64B8B] ${qualificationConfig[currentQualification].color}`}
                  >
                    {Object.entries(qualificationConfig).map(([value, config]) => (
                      <option key={value} value={value}>
                        {config.icon} {config.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section - Inside the card with border-top */}
          <div className="border-t border-gray-200 bg-white px-4 md:px-6 py-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab("details")}
                className={`
                  px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all whitespace-nowrap
                  ${activeTab === "details"
                    ? "bg-[#E64B8B] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
              >
                Lead Details
              </button>
              <button
                onClick={() => setActiveTab("opportunity")}
                className={`
                  px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all whitespace-nowrap
                  ${activeTab === "opportunity"
                    ? "bg-[#E64B8B] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
              >
                Business Insight
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`
                  px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all whitespace-nowrap
                  ${activeTab === "activity"
                    ? "bg-[#E64B8B] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
              >
                Activity Log
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "details" && (
        <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Person Section */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <User className="w-5 h-5 text-[#E64B8B]" />
              <h2 className="text-lg font-semibold text-gray-900">Person Information</h2>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Full Name
              </label>
              <p className="text-gray-900 font-medium">{fullName}</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Email
              </label>
              {lead.email ? (
                <a
                  href={`mailto:${lead.email}`}
                  className="inline-flex items-center gap-2 text-[#E64B8B] hover:text-[#d43d7a] transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {lead.email}
                </a>
              ) : (
                <p className="text-gray-400 text-sm">Not available</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Phone
              </label>
              {lead.phone ? (
                <a
                  href={`tel:${lead.phone}`}
                  className="inline-flex items-center gap-2 text-[#E64B8B] hover:text-[#d43d7a] transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {lead.phone}
                </a>
              ) : (
                <p className="text-gray-400 text-sm">Not available</p>
              )}
            </div>

            {/* LinkedIn */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                LinkedIn
              </label>
              {lead.linkedin_url ? (
                <a
                  href={lead.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#E64B8B] hover:text-[#d43d7a] transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                  View Profile
                </a>
              ) : (
                <p className="text-gray-400 text-sm">Not available</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Job Title
              </label>
              <p className="text-gray-900">{lead.title || "—"}</p>
            </div>

            {/* Person Location */}
            {(lead.city || lead.state || lead.country) && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Person Location
                </label>
                <div className="flex items-start gap-2 text-gray-900">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                  <span>
                    {[lead.city, lead.state, lead.country].filter(Boolean).join(", ")}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Company Section */}
          <div className="bg-gradient-to-br from-blue-50/30 to-white rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-blue-100">
              <Building2 className="w-5 h-5 text-[#E64B8B]" />
              <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Company Name
              </label>
              <p className="text-gray-900 font-medium">{lead.company_name || "—"}</p>
            </div>

            {/* Website */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Website
              </label>
              {lead.company_website || lead.company_domain ? (
                <a
                  href={
                    lead.company_website || 
                    (lead.company_domain?.startsWith("http") 
                      ? lead.company_domain 
                      : `https://${lead.company_domain}`)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#E64B8B] hover:text-[#d43d7a] transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  {lead.company_website || lead.company_domain}
                </a>
              ) : (
                <p className="text-gray-400 text-sm">Not available</p>
              )}
            </div>

            {/* Company Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Company Phone
              </label>
              {lead.company_phone ? (
                <a
                  href={`tel:${lead.company_phone}`}
                  className="inline-flex items-center gap-2 text-[#E64B8B] hover:text-[#d43d7a] transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {lead.company_phone}
                </a>
              ) : (
                <p className="text-gray-400 text-sm">Not available</p>
              )}
            </div>

            {/* Company Description (from OpenAI) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Description
              </label>
              {lead.company_description ? (
                <p className="text-gray-700 leading-relaxed">{lead.company_description}</p>
              ) : (
                <p className="text-gray-400 text-sm">Not available</p>
              )}
            </div>

            {/* Company Address - combined view */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Full Address
              </label>
              {(lead.company_street || lead.company_city || lead.company_state || lead.company_postal_code || lead.company_country) ? (
                <div className="flex items-start gap-2 text-gray-900">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div className="text-gray-700">
                    {lead.company_street && <div>{lead.company_street}</div>}
                    <div>
                      {[lead.company_city, lead.company_state, lead.company_postal_code]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                    {lead.company_country && <div>{lead.company_country}</div>}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Not available</p>
              )}
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-gradient-to-br from-purple-50/20 to-gray-50 rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Technical Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {lead.apollo_id && (
              <div>
                <span className="text-gray-500 font-medium">Apollo Person ID:</span>
                <p className="text-gray-900 font-mono text-xs mt-1 break-all">{lead.apollo_id}</p>
              </div>
            )}
            {lead.organization_id && (
              <div>
                <span className="text-gray-500 font-medium">Apollo Org ID:</span>
                <p className="text-gray-900 font-mono text-xs mt-1 break-all">{lead.organization_id}</p>
              </div>
            )}
            {!lead.organization_id && (
              <div>
                <span className="text-gray-500 font-medium">Apollo Org ID:</span>
                <p className="text-red-600 text-xs mt-1">⚠️ Missing - enrichment may fail</p>
              </div>
            )}
            {lead.enriched_at && (
              <div>
                <span className="text-gray-500 font-medium">Enriched At:</span>
                <p className="text-gray-900 text-xs mt-1">
                  {new Date(lead.enriched_at).toLocaleString()}
                </p>
              </div>
            )}
            {lead.created_at && (
              <div>
                <span className="text-gray-500 font-medium">Added At:</span>
                <p className="text-gray-900 text-xs mt-1">
                  {new Date(lead.created_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
        </div>
        )}

        {/* Business Opportunity Insight Tab */}
        {activeTab === "opportunity" && (
          <OpportunityStageNavigator
            lead={lead}
            geoEnrichment={geoEnrichment}
            geoLoading={geoLoading}
            onRunGeoEnrichment={handleGeoEnrichment}
            googleMapsKey={googleMapsKey}
            propertyAnalysis={propertyAnalysis}
            analysisLoading={analysisLoading}
            onRunPropertyAnalysis={handlePropertyAnalysis}
            serviceMapping={serviceMapping}
            serviceMappingLoading={serviceMappingLoading}
            onRunServiceMapping={handleServiceMapping}
            onRunFullAnalysis={handleFullAnalysis}
          />
        )}

        {/* Activity Log Tab */}
        {activeTab === "activity" && (
          <ActivityLog leadId={leadId} lead={lead} />
        )}
      </div>
    </AppShell>
  );
}