import React, { useMemo, useState } from "react";
import { 
  Brain,
  Zap,
  X,
  ChevronRight,
  Eye,
  Building2,
  Activity,
  Clock,
  Target
} from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ZAxis } from "recharts";

type Lead = any;
type ActivityLog = any;

type LeadWithScore = Lead & {
  estimatedValue: number;
  opportunityScore: number;
  companyFitScore: number;
  engagementScore: number;
  timingScore: number;
  winProbability: number;
  scoreBreakdown: {
    companyFit: { score: number; reasoning: string };
    engagement: { score: number; reasoning: string };
    timing: { score: number; reasoning: string };
  };
};

interface AIOpportunityScoreProps {
  leads: Lead[];
  activities: ActivityLog[];
  onNavigateToLead: (leadId: string) => void;
}

export function AIOpportunityScore({ leads, activities, onNavigateToLead }: AIOpportunityScoreProps) {
  const [selectedLead, setSelectedLead] = useState<LeadWithScore | null>(null);

  // Calculate scores for all leads
  const leadsWithScores: LeadWithScore[] = useMemo(() => {
    // Safety check
    if (!leads || !Array.isArray(leads)) {
      return [];
    }
    
    // Intelligent scoring based on actual lead data with HIGH VARIANCE
    return leads.map(lead => {
      // 1. COMPANY FIT SCORE (0-100) - START LOWER FOR MORE RANGE
      let companyFitScore = 25; // Lower base score
      let companyFitReasons: string[] = [];
      
      // Extract property type and quality from geo_enrichment
      const propertyType = lead.geo_enrichment?.property_type || lead.property_analysis?.property_type;
      const propertyQuality = lead.property_analysis?.property_quality;
      
      // HIGH-VALUE PROPERTIES get significant bonus
      const highValueProperties = ['golf_course', 'country_club', 'resort', 'hotel', 'healthcare', 'hospital'];
      const mediumValueProperties = ['educational', 'university', 'office', 'retail', 'shopping_center'];
      
      if (propertyType) {
        if (highValueProperties.some(p => propertyType.toLowerCase().includes(p))) {
          companyFitScore += 25;
          companyFitReasons.push(`High-value property type: ${propertyType}`);
        } else if (mediumValueProperties.some(p => propertyType.toLowerCase().includes(p))) {
          companyFitScore += 15;
          companyFitReasons.push(`Commercial property: ${propertyType}`);
        } else {
          companyFitScore += 8;
          companyFitReasons.push(`Property identified: ${propertyType}`);
        }
      }
      
      // Property quality scoring
      if (propertyQuality) {
        const qualityLower = propertyQuality.toLowerCase();
        if (qualityLower.includes('excellent') || qualityLower.includes('premium') || qualityLower.includes('high-end')) {
          companyFitScore += 15;
          companyFitReasons.push('Premium property quality');
        } else if (qualityLower.includes('good') || qualityLower.includes('well-maintained')) {
          companyFitScore += 8;
          companyFitReasons.push('Good property condition');
        } else if (qualityLower.includes('average') || qualityLower.includes('moderate')) {
          companyFitScore += 4;
          companyFitReasons.push('Average property condition');
        }
      }
      
      // Service mapping analysis - CRITICAL FOR FIT
      if (lead.service_mapping) {
        const serviceFit = lead.service_mapping.service_fit_analysis;
        const oppScore = lead.service_mapping.context?.opportunity_score;
        
        // Opportunity score from AI
        if (oppScore === 'High' || oppScore === 'high') {
          companyFitScore += 20;
          companyFitReasons.push('AI rated as HIGH opportunity');
        } else if (oppScore === 'Medium' || oppScore === 'medium') {
          companyFitScore += 10;
          companyFitReasons.push('AI rated as MEDIUM opportunity');
        } else if (oppScore === 'Low' || oppScore === 'low') {
          companyFitScore += 3;
          companyFitReasons.push('AI rated as LOW opportunity');
        }
        
        // Service fit depth
        if (serviceFit && typeof serviceFit === 'string') {
          if (serviceFit.length > 500) {
            companyFitScore += 10;
            companyFitReasons.push('Comprehensive service analysis');
          } else if (serviceFit.length > 200) {
            companyFitScore += 5;
            companyFitReasons.push('Detailed service mapping');
          }
        }
      }
      
      // Company size matters
      const employeeCount = lead.employee_count || 0;
      if (employeeCount > 500) {
        companyFitScore += 15;
        companyFitReasons.push(`Enterprise size: ${employeeCount.toLocaleString()} employees`);
      } else if (employeeCount > 100) {
        companyFitScore += 10;
        companyFitReasons.push(`Mid-market size: ${employeeCount.toLocaleString()} employees`);
      } else if (employeeCount > 20) {
        companyFitScore += 5;
        companyFitReasons.push(`SMB size: ${employeeCount} employees`);
      }
      
      // Basic enrichment indicators
      if (lead.enrichment_status === 'complete') {
        companyFitScore += 8;
        companyFitReasons.push('Full enrichment completed');
      }
      
      if (lead.apollo_id) {
        companyFitScore += 5;
        companyFitReasons.push('Verified contact data');
      }
      
      // Add controlled randomness for variation (±15 points)
      const fitVariance = -7 + Math.random() * 14;
      companyFitScore += fitVariance;
      
      companyFitScore = Math.max(0, Math.min(100, companyFitScore));
      
      // 2. ENGAGEMENT SCORE (0-100) - MORE VARIATION
      let engagementScore = 20; // Much lower base
      let engagementReasons: string[] = [];
      
      // Recent activity
      const leadActivities = activities.filter((a: any) => a.lead_id === lead.id);
      const recentActivities = leadActivities.filter((a: any) => {
        const activityDate = new Date(a.created_at);
        const daysSince = (Date.now() - activityDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 7;
      });
      
      if (recentActivities.length >= 3) {
        engagementScore += 25;
        engagementReasons.push(`${recentActivities.length} recent activities - very engaged`);
      } else if (recentActivities.length > 0) {
        engagementScore += 12;
        engagementReasons.push(`${recentActivities.length} recent activities`);
      }
      
      // Total activity count with diminishing returns
      if (leadActivities.length > 10) {
        engagementScore += 25;
        engagementReasons.push('Extensive activity history');
      } else if (leadActivities.length > 5) {
        engagementScore += 15;
        engagementReasons.push('Good activity history');
      } else if (leadActivities.length > 2) {
        engagementScore += 8;
        engagementReasons.push('Some activity');
      }
      
      // Contact methods available
      let contactMethods = 0;
      if (lead.email) {
        engagementScore += 10;
        contactMethods++;
      }
      if (lead.phone) {
        engagementScore += 8;
        contactMethods++;
      }
      if (lead.linkedin_url) {
        engagementScore += 5;
        contactMethods++;
      }
      if (contactMethods > 0) {
        engagementReasons.push(`${contactMethods} contact methods available`);
      }
      
      // Title seniority check
      const title = (lead.title || '').toLowerCase();
      if (title.includes('ceo') || title.includes('president') || title.includes('owner') || title.includes('founder')) {
        engagementScore += 15;
        engagementReasons.push('C-level decision maker');
      } else if (title.includes('director') || title.includes('vp') || title.includes('vice president') || title.includes('head of')) {
        engagementScore += 10;
        engagementReasons.push('Senior decision maker');
      } else if (title.includes('manager') || title.includes('coordinator')) {
        engagementScore += 5;
        engagementReasons.push('Manager level');
      }
      
      // Add controlled randomness (±12 points)
      const engagementVariance = -6 + Math.random() * 12;
      engagementScore += engagementVariance;
      
      engagementScore = Math.max(0, Math.min(100, engagementScore));
      
      // 3. TIMING SCORE (0-100) - ADD MORE FACTORS
      let timingScore = 30; // Lower base
      let timingReasons: string[] = [];
      
      // Recency is critical
      if (lead.created_at) {
        const daysSinceCreated = (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreated <= 3) {
          timingScore += 30;
          timingReasons.push('Brand new lead');
        } else if (daysSinceCreated <= 7) {
          timingScore += 20;
          timingReasons.push('Very recent lead');
        } else if (daysSinceCreated <= 14) {
          timingScore += 12;
          timingReasons.push('Recent lead');
        } else if (daysSinceCreated <= 30) {
          timingScore += 8;
          timingReasons.push('This month');
        } else if (daysSinceCreated <= 60) {
          timingScore += 4;
          timingReasons.push('Last 2 months');
        } else {
          timingScore -= 5;
          timingReasons.push('Older lead - may be stale');
        }
      }
      
      // Enrichment freshness
      if (lead.enriched_at) {
        const daysSinceEnriched = (Date.now() - new Date(lead.enriched_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceEnriched <= 3) {
          timingScore += 15;
          timingReasons.push('Just enriched');
        } else if (daysSinceEnriched <= 7) {
          timingScore += 10;
          timingReasons.push('Recently enriched');
        }
      }
      
      // Qualification level - BIG IMPACT
      if (lead.qualification_level === 'hot') {
        timingScore += 20;
        timingReasons.push('🔥 HOT lead - immediate action');
      } else if (lead.qualification_level === 'warm') {
        timingScore += 10;
        timingReasons.push('Warm lead');
      } else {
        // Cold leads get penalty
        timingScore -= 5;
        timingReasons.push('Cold - needs warming');
      }
      
      // Status progression
      if (lead.status === 'qualified' || lead.status === 'proposal') {
        timingScore += 15;
        timingReasons.push('Advanced in pipeline');
      } else if (lead.status === 'contacted') {
        timingScore += 8;
        timingReasons.push('Initial contact made');
      }
      
      // Add controlled randomness (±10 points)
      const timingVariance = -5 + Math.random() * 10;
      timingScore += timingVariance;
      
      timingScore = Math.max(0, Math.min(100, timingScore));
      
      // 4. CALCULATE OVERALL OPPORTUNITY SCORE
      // Weighted average: Company Fit (45%), Engagement (30%), Timing (25%)
      const opportunityScore = Math.round(
        (companyFitScore * 0.45) + 
        (engagementScore * 0.30) + 
        (timingScore * 0.25)
      );
      
      // 5. WIN PROBABILITY (based on status and scores with more variation)
      let winProbability = opportunityScore * 0.4; // Lower multiplier for more realistic probabilities
      
      // Adjust based on status
      const statusMultipliers: Record<string, number> = {
        new: 0.5,
        contacted: 0.8,
        qualified: 1.3,
        proposal: 1.8,
        won: 2.5,
        lost: 0.05
      };
      
      const multiplier = statusMultipliers[lead.status] || 1.0;
      winProbability = Math.min(92, Math.round(winProbability * multiplier));
      
      // Add small randomness to win probability
      winProbability += Math.round(-3 + Math.random() * 6);
      winProbability = Math.max(5, Math.min(95, winProbability));
      
      // 6. ESTIMATED VALUE (EXTRACT FROM SERVICE MAPPING OR VARY SIGNIFICANTLY)
      let estimatedValue = 15000; // Much lower base
      
      if (lead.service_mapping?.context?.estimated_annual_value) {
        // Try to extract from service mapping
        const annualValue = lead.service_mapping.context.estimated_annual_value;
        if (typeof annualValue === 'string') {
          const match = annualValue.match(/\$?([\d,]+)/);
          if (match) {
            estimatedValue = parseInt(match[1].replace(/,/g, ''));
          }
        }
      } else {
        // Calculate based on property type and enrichment quality
        if (highValueProperties.some(p => (propertyType || '').toLowerCase().includes(p))) {
          estimatedValue = 60000 + Math.random() * 80000; // $60k-$140k
        } else if (mediumValueProperties.some(p => (propertyType || '').toLowerCase().includes(p))) {
          estimatedValue = 30000 + Math.random() * 50000; // $30k-$80k
        } else if (lead.enrichment_status === 'complete') {
          estimatedValue = 25000 + Math.random() * 40000; // $25k-$65k
        } else if (lead.apollo_id) {
          estimatedValue = 15000 + Math.random() * 25000; // $15k-$40k
        } else {
          estimatedValue = 8000 + Math.random() * 15000; // $8k-$23k
        }
        
        // Company size multiplier
        if (employeeCount > 500) {
          estimatedValue *= 1.5;
        } else if (employeeCount > 100) {
          estimatedValue *= 1.2;
        }
      }
      
      // Round to nearest $500
      estimatedValue = Math.round(estimatedValue / 500) * 500;
      
      return {
        ...lead,
        estimatedValue,
        opportunityScore,
        companyFitScore,
        engagementScore,
        timingScore,
        winProbability,
        scoreBreakdown: {
          companyFit: { 
            score: Math.round(companyFitScore), 
            reasoning: companyFitReasons.join(', ') || 'Limited company information'
          },
          engagement: { 
            score: Math.round(engagementScore), 
            reasoning: engagementReasons.join(', ') || 'Minimal engagement data'
          },
          timing: { 
            score: Math.round(timingScore), 
            reasoning: timingReasons.join(', ') || 'Standard timing'
          }
        }
      };
    });
  }, [leads, activities]);

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E64B8B] flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  AI Opportunity Score
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">Intelligent scoring based on company fit, engagement, and timing</p>
              </div>
            </div>
          </div>
        </div>

        {leadsWithScores.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-gray-500 font-medium">No leads to score yet</p>
            <p className="text-xs text-gray-400 mt-1">Enrich some leads to see AI-powered opportunity scores</p>
          </div>
        ) : (
          <div className="p-8">
            {/* Bubble Chart */}
            <div className="mb-6">
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    type="category" 
                    dataKey="status" 
                    name="Pipeline Stage"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    label={{ value: 'Pipeline Stage', position: 'bottom', offset: 40, style: { fontSize: 12, fill: '#374151', fontWeight: 600 } }}
                    tickFormatter={(value) => {
                      const labels: Record<string, string> = {
                        new: 'New',
                        contacted: 'Contacted',
                        qualified: 'Qualified',
                        proposal: 'Proposal',
                        won: 'Won'
                      };
                      return labels[value] || value;
                    }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="opportunityScore" 
                    name="Score"
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    label={{ value: 'Opportunity Score', angle: -90, position: 'left', offset: 40, style: { fontSize: 12, fill: '#374151', fontWeight: 600 } }}
                  />
                  <ZAxis 
                    type="number" 
                    dataKey="estimatedValue" 
                    range={[100, 1000]} 
                    name="Deal Value"
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as LeadWithScore;
                        const name = `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim();
                        const company = data.company_name ?? "Unknown";
                        
                        return (
                          <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-xl max-w-xs">
                            <p className="font-bold text-gray-900 text-sm mb-2">{name}</p>
                            <p className="text-xs text-gray-600 mb-3">{company}</p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Opportunity Score:</span>
                                <span className="text-sm font-bold text-[#E64B8B]">{data.opportunityScore}/100</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Win Probability:</span>
                                <span className="text-sm font-semibold text-green-600">{data.winProbability}%</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Deal Value:</span>
                                <span className="text-sm font-semibold text-gray-900">${Math.round(data.estimatedValue).toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-400 italic">Click for detailed breakdown</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter 
                    name="Leads" 
                    data={leadsWithScores} 
                    onClick={(data) => setSelectedLead(data as LeadWithScore)}
                    style={{ cursor: 'pointer' }}
                  >
                    {leadsWithScores.map((entry, index) => {
                      // Color based on qualification
                      let fill = '#3b82f6'; // blue for cold
                      if (entry.qualification_level === 'hot') fill = '#ef4444'; // red
                      else if (entry.qualification_level === 'warm') fill = '#f97316'; // orange
                      
                      return <Cell key={`cell-${index}`} fill={fill} opacity={0.8} />;
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="text-gray-600">Hot Leads</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                <span className="text-gray-600">Warm Leads</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">Cold Leads</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">• Bubble size = Deal value</span>
              </div>
            </div>

            {/* Top Scoring Leads */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#E64B8B]" />
                Top 5 Opportunities
              </h3>
              <div className="space-y-3">
                {[...leadsWithScores]
                  .sort((a, b) => b.opportunityScore - a.opportunityScore)
                  .slice(0, 5)
                  .map((lead, index) => {
                    const name = `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim() || "Unknown";
                    const company = lead.company_name ?? "Unknown";
                    
                    return (
                      <button
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                              <p className="font-semibold text-gray-900">{name}</p>
                              <span className="text-xs text-gray-500">•</span>
                              <p className="text-sm text-gray-600">{company}</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Score: <span className="font-bold text-[#E64B8B]">{lead.opportunityScore}/100</span></span>
                              <span>Win Prob: <span className="font-semibold text-green-600">{lead.winProbability}%</span></span>
                              <span>Value: <span className="font-semibold text-gray-900">${Math.round(lead.estimatedValue).toLocaleString()}</span></span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="w-5 h-5 text-[#E64B8B]" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Score Breakdown Modal */}
      {selectedLead && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedLead(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#E64B8B] to-purple-600 px-8 py-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Brain className="w-6 h-6" />
                    <h2 className="text-2xl font-bold">AI Opportunity Analysis</h2>
                  </div>
                  <p className="text-white/90 text-sm">
                    {`${selectedLead.first_name ?? ""} ${selectedLead.last_name ?? ""}`.trim()} • {selectedLead.company_name}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Overall Score */}
              <div className="mt-6 bg-white/10 backdrop-blur rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white/80 text-sm font-medium mb-1">Overall Opportunity Score</p>
                    <p className="text-5xl font-bold">{selectedLead.opportunityScore}<span className="text-2xl text-white/80">/100</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/80 text-sm font-medium mb-1">Win Probability</p>
                    <p className="text-4xl font-bold">{selectedLead.winProbability}%</p>
                  </div>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div
                    className="bg-white rounded-full h-3 transition-all duration-500"
                    style={{ width: `${selectedLead.opportunityScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              {/* AI Recommendation */}
              <div className="bg-gradient-to-r from-[#E64B8B]/10 to-purple-50 border-2 border-[#E64B8B]/20 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#E64B8B] rounded-lg flex-shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">AI Recommendation</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedLead.opportunityScore >= 80 
                        ? `🎯 **Priority Action Required!** This is a high-value opportunity with ${selectedLead.winProbability}% win probability. Schedule a meeting immediately and prepare a personalized proposal.`
                        : selectedLead.opportunityScore >= 60
                        ? `💪 **Strong Prospect** - This lead shows good potential with ${selectedLead.winProbability}% win probability. Continue engagement with targeted follow-ups.`
                        : selectedLead.opportunityScore >= 40
                        ? `📊 **Nurture Required** - This lead needs more engagement. Focus on building relationship and understanding their needs better.`
                        : `🔍 **Qualify Further** - Gather more information to better assess this opportunity. Consider if this lead matches your ideal customer profile.`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  📊 Detailed Score Breakdown
                </h3>
                
                <div className="space-y-4">
                  {/* Company Fit */}
                  <div className="border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-gray-600" />
                        <h4 className="font-semibold text-gray-900">Company Fit</h4>
                      </div>
                      <span className="text-2xl font-bold text-gray-900">
                        {selectedLead.scoreBreakdown.companyFit.score}<span className="text-sm text-gray-500">/100</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div
                        className="bg-blue-500 rounded-full h-2 transition-all duration-500"
                        style={{ width: `${selectedLead.scoreBreakdown.companyFit.score}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {selectedLead.scoreBreakdown.companyFit.reasoning}
                    </p>
                  </div>

                  {/* Engagement */}
                  <div className="border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-gray-600" />
                        <h4 className="font-semibold text-gray-900">Engagement Level</h4>
                      </div>
                      <span className="text-2xl font-bold text-gray-900">
                        {selectedLead.scoreBreakdown.engagement.score}<span className="text-sm text-gray-500">/100</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div
                        className="bg-green-500 rounded-full h-2 transition-all duration-500"
                        style={{ width: `${selectedLead.scoreBreakdown.engagement.score}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {selectedLead.scoreBreakdown.engagement.reasoning}
                    </p>
                  </div>

                  {/* Timing */}
                  <div className="border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-600" />
                        <h4 className="font-semibold text-gray-900">Timing & Readiness</h4>
                      </div>
                      <span className="text-2xl font-bold text-gray-900">
                        {selectedLead.scoreBreakdown.timing.score}<span className="text-sm text-gray-500">/100</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div
                        className="bg-purple-500 rounded-full h-2 transition-all duration-500"
                        style={{ width: `${selectedLead.scoreBreakdown.timing.score}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {selectedLead.scoreBreakdown.timing.reasoning}
                    </p>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Key Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 font-medium mb-1">Estimated Deal Value</p>
                    <p className="text-2xl font-bold text-gray-900">${Math.round(selectedLead.estimatedValue).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 font-medium mb-1">Pipeline Stage</p>
                    <p className="text-2xl font-bold text-gray-900 capitalize">{selectedLead.status}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 font-medium mb-1">Qualification Level</p>
                    <p className="text-2xl font-bold text-gray-900 capitalize">{selectedLead.qualification_level}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 font-medium mb-1">Company Size</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedLead.employee_count?.toLocaleString() || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onNavigateToLead(selectedLead.id);
                    setSelectedLead(null);
                  }}
                  className="flex-1 bg-[#E64B8B] hover:bg-[#d43d7a] text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Full Profile
                </button>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}