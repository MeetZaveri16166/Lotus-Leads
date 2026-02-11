import React, { useEffect, useState, useMemo } from "react";
import { Api } from "@/lib/api";
import { AppShell } from "@/app/components/AppShell";
import { AIOpportunityScore } from "@/app/components/AIOpportunityScore";
import { SmartActionQueue } from "@/app/components/SmartActionQueue";
import { PredictiveRevenueForecast } from "@/app/components/PredictiveRevenueForecast";
import { PatternIntelligence } from "@/app/components/PatternIntelligence";
import { EngagementMomentumTracker } from "@/app/components/EngagementMomentumTracker";
import { 
  TrendingUp, 
  DollarSign, 
  AlertCircle, 
  Target,
  Eye,
  Clock,
  Users,
  MapPin,
  Building2,
  BarChart3,
  Brain,
  Zap
} from "lucide-react";

type Lead = any;
type ActivityLog = any;

export function DashboardPage({ onNav }: { onNav: (key: string, data?: any) => void }) {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "ai-intelligence" | "analytics">("overview");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      // Load ALL enriched leads regardless of their pipeline status
      const enrichedLeads = await Api.listLeads({ enrichment_status: "complete" });
      setLeads(enrichedLeads || []);

      const allActivities: ActivityLog[] = [];
      for (const lead of enrichedLeads || []) {
        try {
          const leadActivities = await Api.getActivities(lead.id);
          allActivities.push(...leadActivities);
        } catch (e) {
          // Skip if activities fail
        }
      }
      setActivities(allActivities);
    } catch (e: any) {
      console.error('[DASHBOARD] Error loading data:', e);
    } finally {
      setLoading(false);
    }
  }

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    
    let pipelineValue = 0;
    
    leads.forEach(lead => {
      if (lead.company_revenue && typeof lead.company_revenue === 'string') {
        const revenueStr = lead.company_revenue.replace(/[$,]/g, '');
        const match = revenueStr.match(/(\d+(?:\.\d+)?)(M|K|B)?/i);
        if (match) {
          let value = parseFloat(match[1]);
          const unit = match[2]?.toUpperCase();
          if (unit === 'M') value *= 1000000;
          else if (unit === 'K') value *= 1000;
          else if (unit === 'B') value *= 1000000000;
          pipelineValue += value * 0.01;
        }
      } else {
        if (lead.qualification_level === 'hot') pipelineValue += 50000;
        else if (lead.qualification_level === 'warm') pipelineValue += 30000;
        else pipelineValue += 10000;
      }
    });

    // Overdue follow-ups
    const now = new Date();
    const overdueFollowups = activities.filter(a => {
      if (!a.follow_up_date || a.follow_up_completed) return false;
      return new Date(a.follow_up_date) < now;
    }).length;

    // Win rate
    const wonLeads = leads.filter(l => l.status === 'won').length;
    const closedLeads = leads.filter(l => l.status === 'won' || l.status === 'lost').length;
    const winRate = closedLeads > 0 ? (wonLeads / closedLeads) * 100 : 0;

    return {
      totalLeads,
      pipelineValue: Math.round(pipelineValue),
      overdueFollowups,
      winRate: Math.round(winRate)
    };
  }, [leads, activities]);

  // Pipeline funnel
  const pipelineFunnel = useMemo(() => {
    const stages = ['new', 'contacted', 'qualified', 'proposal', 'won'];
    const totalLeads = leads.length || 1;
    
    const data = stages.map((stage) => {
      const count = leads.filter(l => l.status === stage).length;
      const percentOfTotal = Math.round((count / totalLeads) * 100);
      
      return {
        stage: stage.charAt(0).toUpperCase() + stage.slice(1),
        count,
        percentOfTotal
      };
    });

    return data;
  }, [leads]);

  // Urgent actions
  const urgentActions = useMemo(() => {
    const now = new Date();
    const actions: Array<{ type: string; lead: Lead; message: string; priority: 'critical' | 'high' }> = [];

    // Overdue follow-ups
    activities.forEach(activity => {
      if (activity.follow_up_date && !activity.follow_up_completed) {
        const followUpDate = new Date(activity.follow_up_date);
        if (followUpDate < now) {
          const lead = leads.find(l => l.id === activity.lead_id);
          if (lead) {
            const daysOverdue = Math.floor((now.getTime() - followUpDate.getTime()) / (1000 * 60 * 60 * 24));
            actions.push({
              type: 'overdue-followup',
              lead,
              message: `Overdue follow-up (${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} late)`,
              priority: 'critical'
            });
          }
        }
      }
    });

    // Hot leads without recent activity
    leads.forEach(lead => {
      if (lead.qualification_level === 'hot' && lead.status !== 'won' && lead.status !== 'lost') {
        const leadActivities = activities.filter(a => a.lead_id === lead.id);
        if (leadActivities.length === 0) {
          actions.push({
            type: 'hot-no-activity',
            lead,
            message: 'Hot lead with no activities yet',
            priority: 'critical'
          });
        } else {
          const lastActivity = leadActivities.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          const daysSince = (now.getTime() - new Date(lastActivity.created_at).getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysSince > 7) {
            actions.push({
              type: 'hot-stagnant',
              lead,
              message: `Hot lead - no activity for ${Math.round(daysSince)} days`,
              priority: 'high'
            });
          }
        }
      }
    });

    // New leads uncontacted
    leads.forEach(lead => {
      if (lead.status === 'new') {
        const hasContact = activities.some(a => 
          a.lead_id === lead.id && (a.activity_type === 'call' || a.activity_type === 'email')
        );
        if (!hasContact) {
          actions.push({
            type: 'new-uncontacted',
            lead,
            message: 'New lead - needs initial contact',
            priority: 'high'
          });
        }
      }
    });

    // Sort by priority
    return actions.sort((a, b) => {
      if (a.priority === 'critical' && b.priority === 'high') return -1;
      if (a.priority === 'high' && b.priority === 'critical') return 1;
      return 0;
    }).slice(0, 6);
  }, [leads, activities]);

  // Recent leads
  const recentLeads = useMemo(() => {
    return [...leads]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }, [leads]);

  // Analytics data
  const analyticsData = useMemo(() => {
    // Top regions
    const regionCounts: Record<string, number> = {};
    leads.forEach(lead => {
      if (lead.location) {
        regionCounts[lead.location] = (regionCounts[lead.location] || 0) + 1;
      }
    });
    const topRegions = Object.entries(regionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([region, count]) => ({ region, count }));

    // Top industries
    const industryCounts: Record<string, number> = {};
    leads.forEach(lead => {
      if (lead.company_industry) {
        industryCounts[lead.company_industry] = (industryCounts[lead.company_industry] || 0) + 1;
      }
    });
    const topIndustries = Object.entries(industryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([industry, count]) => ({ industry, count }));

    return { topRegions, topIndustries };
  }, [leads]);

  if (loading) {
    return (
      <AppShell title="Dashboard" active="dashboard" onNav={onNav}>
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#E64B8B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">Loading dashboard...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Dashboard" active="dashboard" onNav={onNav}>
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="bg-white border border-gray-200 rounded-xl p-1.5 inline-flex gap-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "overview"
                ? "bg-[#E64B8B] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("ai-intelligence")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "ai-intelligence"
                ? "bg-[#E64B8B] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Brain className="w-4 h-4" />
            AI Intelligence
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "analytics"
                ? "bg-[#E64B8B] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Analytics
          </button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Hero Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Leads */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center">
                    <Users className="w-6 h-6 text-[#E64B8B]" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Total Leads</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.totalLeads}</p>
              </div>

              {/* Pipeline Value */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-[#E64B8B]" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Pipeline Value</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${Math.round(metrics.pipelineValue / 1000)}K
                </p>
              </div>

              {/* Overdue Follow-ups */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center">
                    <AlertCircle className={`w-6 h-6 ${metrics.overdueFollowups > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Overdue Follow-ups</p>
                <p className={`text-3xl font-bold ${metrics.overdueFollowups > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {metrics.overdueFollowups}
                </p>
              </div>

              {/* Win Rate */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center">
                    <Target className="w-6 h-6 text-[#E64B8B]" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Win Rate</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.winRate}%</p>
              </div>
            </div>

            {/* Urgent Actions Panel */}
            {urgentActions.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Urgent Actions Required
                  </h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {urgentActions.map((action, index) => {
                    const name = `${action.lead.first_name || ''} ${action.lead.last_name || ''}`.trim() || 'Unknown';
                    const company = action.lead.company_name || 'Unknown Company';

                    return (
                      <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {action.priority === 'critical' && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded uppercase">
                                  Critical
                                </span>
                              )}
                              {action.priority === 'high' && (
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded uppercase">
                                  High
                                </span>
                              )}
                              <p className="font-semibold text-gray-900">{name}</p>
                              <span className="text-gray-400">•</span>
                              <p className="text-sm text-gray-600">{company}</p>
                            </div>
                            <p className="text-sm text-gray-700">{action.message}</p>
                          </div>
                          <button
                            onClick={() => onNav("lead-detail", { leadId: action.lead.id, fromTab: "enriched" })}
                            className="ml-4 px-4 py-2 text-sm font-medium text-[#E64B8B] hover:bg-[#E64B8B] hover:text-white border border-[#E64B8B] rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            View Lead
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pipeline Funnel */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-6">
                Pipeline Funnel
              </h2>
              <div className="space-y-4">
                {pipelineFunnel.map((stage) => {
                  // Calculate width based on total leads to prevent overflow
                  const totalLeads = leads.length || 1;
                  const width = Math.min((stage.count / totalLeads) * 100, 100); // Cap at 100%
                  
                  return (
                    <div key={stage.stage}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-gray-900 w-24">{stage.stage}</p>
                          <p className="text-sm text-gray-600">{stage.count} leads</p>
                        </div>
                        {stage.percentOfTotal > 0 && (
                          <p className="text-sm font-medium text-gray-500">
                            {stage.percentOfTotal}% of total
                          </p>
                        )}
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-[#E64B8B] h-3 rounded-full transition-all"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Enriched Leads */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                      Recent Enriched Leads
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Showing {recentLeads.length} most recent enriched leads
                    </p>
                  </div>
                  <button
                    onClick={() => onNav("leads", { tab: "enriched" })}
                    className="text-sm font-medium text-[#E64B8B] hover:text-[#d43d7a] transition-colors"
                  >
                    View All →
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lead</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Qualification</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentLeads.map((lead) => {
                      const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown';
                      const company = lead.company_name || 'Unknown Company';

                      return (
                        <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{company}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded capitalize ${
                              lead.status === 'won' ? 'bg-green-100 text-green-700' :
                              lead.status === 'lost' ? 'bg-gray-100 text-gray-700' :
                              lead.status === 'proposal' ? 'bg-[#E64B8B]/10 text-[#E64B8B]' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded capitalize ${
                              lead.qualification_level === 'hot' ? 'bg-red-100 text-red-700' :
                              lead.qualification_level === 'warm' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {lead.qualification_level || 'None'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => onNav("lead-detail", { leadId: lead.id, fromTab: "enriched" })}
                              className="text-sm font-medium text-[#E64B8B] hover:text-[#d43d7a] transition-colors"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* AI INTELLIGENCE TAB */}
        {activeTab === "ai-intelligence" && (
          <div className="space-y-6">
            <AIOpportunityScore
              leads={leads}
              activities={activities}
              onNavigateToLead={(leadId) => onNav("lead-detail", { leadId, fromTab: "enriched" })}
            />

            <SmartActionQueue
              leads={leads}
              activities={activities}
              onNavigateToLead={(leadId) => onNav("lead-detail", { leadId, fromTab: "enriched" })}
              onAddActivity={(leadId, type) => {
                console.log(`[DASHBOARD] Quick action: Add ${type} for lead ${leadId}`);
                onNav("lead-detail", { leadId, fromTab: "enriched" });
              }}
              onScheduleFollowUp={(leadId, days) => {
                console.log(`[DASHBOARD] Quick action: Schedule follow-up in ${days} days for lead ${leadId}`);
                onNav("lead-detail", { leadId, fromTab: "enriched" });
              }}
            />

            <PredictiveRevenueForecast
              leads={leads}
              activities={activities}
              onNavigateToLead={(leadId) => onNav("lead-detail", { leadId, fromTab: "enriched" })}
            />

            <PatternIntelligence
              leads={leads}
              activities={activities}
              onNavigateToLead={(leadId) => onNav("lead-detail", { leadId, fromTab: "enriched" })}
            />

            <EngagementMomentumTracker
              leads={leads}
              activities={activities}
              onNavigateToLead={(leadId) => onNav("lead-detail", { leadId, fromTab: "enriched" })}
            />
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Regions */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#E64B8B]" />
                  </div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Top Regions
                  </h2>
                </div>
                {analyticsData.topRegions.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">No location data available</p>
                ) : (
                  <div className="space-y-4">
                    {analyticsData.topRegions.map((item, index) => {
                      const maxCount = analyticsData.topRegions[0]?.count || 1;
                      const percentage = (item.count / maxCount) * 100;
                      
                      return (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-900">{item.region}</p>
                            <p className="text-sm text-gray-600">{item.count} leads</p>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-[#E64B8B] h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Top Industries */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[#E64B8B]" />
                  </div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Top Industries
                  </h2>
                </div>
                {analyticsData.topIndustries.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">No industry data available</p>
                ) : (
                  <div className="space-y-4">
                    {analyticsData.topIndustries.map((item, index) => {
                      const maxCount = analyticsData.topIndustries[0]?.count || 1;
                      const percentage = (item.count / maxCount) * 100;
                      
                      return (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-900">{item.industry}</p>
                            <p className="text-sm text-gray-600">{item.count} leads</p>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-[#E64B8B] h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* High-Value Prospects */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-[#E64B8B]" />
                  </div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    High-Value Prospects
                  </h2>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lead</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Industry</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leads
                      .filter(l => l.status !== 'won' && l.status !== 'lost')
                      .sort((a, b) => {
                        // Simple high-value sort: Hot > Warm > Cold, then by employee count
                        const qualOrder = { hot: 3, warm: 2, cold: 1 };
                        const aQual = qualOrder[a.qualification_level as keyof typeof qualOrder] || 0;
                        const bQual = qualOrder[b.qualification_level as keyof typeof qualOrder] || 0;
                        
                        if (aQual !== bQual) return bQual - aQual;
                        return (b.employee_count || 0) - (a.employee_count || 0);
                      })
                      .slice(0, 10)
                      .map((lead, index) => {
                        const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown';
                        const company = lead.company_name || 'Unknown Company';

                        return (
                          <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                index === 0 ? 'bg-[#E64B8B] text-white' :
                                index === 1 ? 'bg-gray-200 text-gray-700' :
                                index === 2 ? 'bg-gray-100 text-gray-600' :
                                'bg-gray-50 text-gray-500'
                              }`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{name}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{company}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{lead.company_industry || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{lead.company_revenue || 'N/A'}</td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => onNav("lead-detail", { leadId: lead.id, fromTab: "enriched" })}
                                className="text-sm font-medium text-[#E64B8B] hover:text-[#d43d7a] transition-colors"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}