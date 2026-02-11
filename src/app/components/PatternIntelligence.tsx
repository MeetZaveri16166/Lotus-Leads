import React, { useMemo, useState } from "react";
import { 
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Target,
  CheckCircle2,
  XCircle,
  ChevronRight,
  BarChart3,
  Users,
  Clock,
  Zap,
  Eye
} from "lucide-react";

type Lead = any;
type ActivityLog = any;

interface Pattern {
  id: string;
  type: 'winning' | 'risk' | 'insight';
  title: string;
  description: string;
  impact: string;
  confidence: number; // 0-100
  dataPoints: number;
  recommendation: string;
  affectedLeads: number;
  exampleLeads?: Lead[];
}

interface PatternIntelligenceProps {
  leads: Lead[];
  activities: ActivityLog[];
  onNavigateToLead: (leadId: string) => void;
}

export function PatternIntelligence({ 
  leads, 
  activities, 
  onNavigateToLead 
}: PatternIntelligenceProps) {
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);

  // Analyze patterns
  const patterns = useMemo(() => {
    const detectedPatterns: Pattern[] = [];
    const now = new Date();

    // Skip if not enough data
    if (leads.length < 5) {
      return detectedPatterns;
    }

    // Pattern 1: Early Engagement Impact
    const leadsWithEarlyEngagement = leads.filter(lead => {
      const leadActivities = activities.filter(a => a.lead_id === lead.id);
      const createdDate = new Date(lead.created_at);
      const earlyActivities = leadActivities.filter(a => {
        const activityDate = new Date(a.created_at);
        const daysDiff = (activityDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
      });
      return earlyActivities.length >= 3;
    });

    const earlyEngagementWonRate = leadsWithEarlyEngagement.filter(l => l.status === 'won').length / 
      Math.max(leadsWithEarlyEngagement.length, 1);
    const overallWonRate = leads.filter(l => l.status === 'won').length / leads.length;

    if (leadsWithEarlyEngagement.length >= 5 && earlyEngagementWonRate > overallWonRate * 1.5) {
      detectedPatterns.push({
        id: 'early-engagement',
        type: 'winning',
        title: '⚡ Early Engagement Drives Conversion',
        description: `Leads with 3+ activities in the first week convert ${Math.round((earlyEngagementWonRate / overallWonRate) * 100)}% better than average.`,
        impact: `${Math.round(earlyEngagementWonRate * 100)}% conversion rate vs ${Math.round(overallWonRate * 100)}% average`,
        confidence: Math.min(95, 60 + leadsWithEarlyEngagement.length * 2),
        dataPoints: leadsWithEarlyEngagement.length,
        recommendation: '📌 Action: Contact new leads within 24 hours and schedule 2-3 touchpoints in the first week.',
        affectedLeads: leads.filter(l => {
          const daysSinceCreated = (now.getTime() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceCreated <= 7 && activities.filter(a => a.lead_id === l.id).length < 3;
        }).length,
        exampleLeads: leadsWithEarlyEngagement.filter(l => l.status === 'won').slice(0, 3)
      });
    }

    // Pattern 2: Hot Leads Stalling
    const hotLeads = leads.filter(l => l.qualification_level === 'hot');
    const stalledHotLeads = hotLeads.filter(lead => {
      const leadActivities = activities.filter(a => a.lead_id === lead.id);
      if (leadActivities.length === 0) return true;
      
      const lastActivity = leadActivities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      const daysSinceLastActivity = (now.getTime() - new Date(lastActivity.created_at).getTime()) / (1000 * 60 * 60 * 24);
      
      return daysSinceLastActivity > 14 && lead.status !== 'won' && lead.status !== 'lost';
    });

    if (stalledHotLeads.length >= 2) {
      detectedPatterns.push({
        id: 'hot-stalling',
        type: 'risk',
        title: '⚠️ Hot Leads Losing Momentum',
        description: `${stalledHotLeads.length} hot leads have had no activity in 14+ days. These high-value prospects are at risk of going cold.`,
        impact: `${stalledHotLeads.length} hot leads at risk`,
        confidence: 90,
        dataPoints: stalledHotLeads.length,
        recommendation: '📌 Action: Immediately re-engage these leads with personalized outreach or value-add content.',
        affectedLeads: stalledHotLeads.length,
        exampleLeads: stalledHotLeads.slice(0, 3)
      });
    }

    // Pattern 3: Company Size Sweet Spot
    const leadsBySize: Record<string, { leads: Lead[]; won: number }> = {
      small: { leads: [], won: 0 },
      medium: { leads: [], won: 0 },
      large: { leads: [], won: 0 },
      enterprise: { leads: [], won: 0 }
    };

    leads.forEach(lead => {
      if (!lead.employee_count) return;
      
      let category = 'small';
      if (lead.employee_count >= 1000) category = 'enterprise';
      else if (lead.employee_count >= 200) category = 'large';
      else if (lead.employee_count >= 50) category = 'medium';
      
      leadsBySize[category].leads.push(lead);
      if (lead.status === 'won') leadsBySize[category].won++;
    });

    // Find best performing size
    let bestCategory = '';
    let bestRate = 0;
    Object.entries(leadsBySize).forEach(([category, data]) => {
      if (data.leads.length >= 3) {
        const rate = data.won / data.leads.length;
        if (rate > bestRate) {
          bestRate = rate;
          bestCategory = category;
        }
      }
    });

    if (bestCategory && bestRate > overallWonRate * 1.3 && leadsBySize[bestCategory].leads.length >= 5) {
      const categoryLabels: Record<string, string> = {
        small: '10-49 employees',
        medium: '50-199 employees',
        large: '200-999 employees',
        enterprise: '1,000+ employees'
      };

      detectedPatterns.push({
        id: 'size-sweet-spot',
        type: 'winning',
        title: '🎯 Company Size Sweet Spot Identified',
        description: `Companies with ${categoryLabels[bestCategory]} convert ${Math.round((bestRate / overallWonRate) * 100)}% better than average.`,
        impact: `${Math.round(bestRate * 100)}% win rate in this segment`,
        confidence: Math.min(90, 50 + leadsBySize[bestCategory].leads.length * 3),
        dataPoints: leadsBySize[bestCategory].leads.length,
        recommendation: `📌 Action: Prioritize prospecting companies with ${categoryLabels[bestCategory]}. Focus your outbound efforts here.`,
        affectedLeads: leadsBySize[bestCategory].leads.filter(l => l.status !== 'won' && l.status !== 'lost').length,
        exampleLeads: leadsBySize[bestCategory].leads.filter(l => l.status === 'won').slice(0, 3)
      });
    }

    // Pattern 4: Multi-Channel Engagement
    const leadsWithMultiChannel = leads.filter(lead => {
      const leadActivities = activities.filter(a => a.lead_id === lead.id);
      const activityTypes = new Set(leadActivities.map(a => a.activity_type));
      return activityTypes.size >= 3; // At least 3 different types (call, email, meeting, note)
    });

    const multiChannelWonRate = leadsWithMultiChannel.filter(l => l.status === 'won').length / 
      Math.max(leadsWithMultiChannel.length, 1);

    if (leadsWithMultiChannel.length >= 5 && multiChannelWonRate > overallWonRate * 1.4) {
      detectedPatterns.push({
        id: 'multi-channel',
        type: 'winning',
        title: '📞 Multi-Channel Approach Works',
        description: `Leads engaged through 3+ channels (calls, emails, meetings) convert ${Math.round((multiChannelWonRate / overallWonRate) * 100)}% better.`,
        impact: `${Math.round(multiChannelWonRate * 100)}% conversion with multi-channel vs ${Math.round(overallWonRate * 100)}% average`,
        confidence: Math.min(88, 55 + leadsWithMultiChannel.length * 2),
        dataPoints: leadsWithMultiChannel.length,
        recommendation: '📌 Action: Vary your outreach. If email doesn\'t work, try calling. Follow up meetings with notes.',
        affectedLeads: leads.filter(l => {
          const leadActivities = activities.filter(a => a.lead_id === l.id);
          const activityTypes = new Set(leadActivities.map(a => a.activity_type));
          return activityTypes.size < 3 && l.status !== 'won' && l.status !== 'lost';
        }).length,
        exampleLeads: leadsWithMultiChannel.filter(l => l.status === 'won').slice(0, 3)
      });
    }

    // Pattern 5: Time-to-Contact Impact
    const contactedLeads = leads.filter(l => 
      activities.some(a => a.lead_id === l.id && (a.activity_type === 'call' || a.activity_type === 'email'))
    );

    const quickContactLeads = contactedLeads.filter(lead => {
      const firstContact = activities
        .filter(a => a.lead_id === lead.id && (a.activity_type === 'call' || a.activity_type === 'email'))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
      
      if (!firstContact) return false;
      
      const hoursToContact = (new Date(firstContact.created_at).getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60);
      return hoursToContact <= 48;
    });

    const quickContactWonRate = quickContactLeads.filter(l => l.status === 'won').length / 
      Math.max(quickContactLeads.length, 1);

    if (quickContactLeads.length >= 5 && quickContactWonRate > overallWonRate * 1.3) {
      detectedPatterns.push({
        id: 'quick-contact',
        type: 'winning',
        title: '⏱️ Speed to Lead Matters',
        description: `Leads contacted within 48 hours convert ${Math.round((quickContactWonRate / overallWonRate) * 100)}% better than those contacted later.`,
        impact: `${Math.round(quickContactWonRate * 100)}% conversion with quick contact`,
        confidence: Math.min(85, 50 + quickContactLeads.length * 2),
        dataPoints: quickContactLeads.length,
        recommendation: '📌 Action: Set up alerts for new leads and commit to reaching out within 48 hours maximum.',
        affectedLeads: leads.filter(l => {
          const hasContact = activities.some(a => a.lead_id === l.id && (a.activity_type === 'call' || a.activity_type === 'email'));
          const hoursSinceCreated = (now.getTime() - new Date(l.created_at).getTime()) / (1000 * 60 * 60);
          return !hasContact && hoursSinceCreated > 48 && l.status !== 'won' && l.status !== 'lost';
        }).length,
        exampleLeads: quickContactLeads.filter(l => l.status === 'won').slice(0, 3)
      });
    }

    // Pattern 6: Industry Performance
    const industryCounts: Record<string, { leads: Lead[]; won: number }> = {};
    leads.forEach(lead => {
      if (!lead.company_industry) return;
      
      const industry = lead.company_industry.trim();
      if (!industryCounts[industry]) {
        industryCounts[industry] = { leads: [], won: 0 };
      }
      
      industryCounts[industry].leads.push(lead);
      if (lead.status === 'won') industryCounts[industry].won++;
    });

    // Find best and worst performing industries
    let bestIndustry = '';
    let bestIndustryRate = 0;
    let worstIndustry = '';
    let worstIndustryRate = 1;

    Object.entries(industryCounts).forEach(([industry, data]) => {
      if (data.leads.length >= 3) {
        const rate = data.won / data.leads.length;
        if (rate > bestIndustryRate) {
          bestIndustryRate = rate;
          bestIndustry = industry;
        }
        if (rate < worstIndustryRate && data.leads.length >= 5) {
          worstIndustryRate = rate;
          worstIndustry = industry;
        }
      }
    });

    if (bestIndustry && bestIndustryRate > overallWonRate * 1.5 && industryCounts[bestIndustry].leads.length >= 5) {
      detectedPatterns.push({
        id: 'industry-winner',
        type: 'winning',
        title: '🏆 High-Performing Industry Found',
        description: `${bestIndustry} leads convert at ${Math.round(bestIndustryRate * 100)}% vs ${Math.round(overallWonRate * 100)}% average.`,
        impact: `${industryCounts[bestIndustry].won} wins from ${industryCounts[bestIndustry].leads.length} leads`,
        confidence: Math.min(92, 60 + industryCounts[bestIndustry].leads.length * 2),
        dataPoints: industryCounts[bestIndustry].leads.length,
        recommendation: `📌 Action: Double down on ${bestIndustry}. Build industry-specific messaging and case studies.`,
        affectedLeads: industryCounts[bestIndustry].leads.filter(l => l.status !== 'won' && l.status !== 'lost').length,
        exampleLeads: industryCounts[bestIndustry].leads.filter(l => l.status === 'won').slice(0, 3)
      });
    }

    if (worstIndustry && worstIndustryRate < overallWonRate * 0.5 && industryCounts[worstIndustry].leads.length >= 5) {
      detectedPatterns.push({
        id: 'industry-underperformer',
        type: 'risk',
        title: '📉 Underperforming Industry Detected',
        description: `${worstIndustry} leads convert at only ${Math.round(worstIndustryRate * 100)}% vs ${Math.round(overallWonRate * 100)}% average.`,
        impact: `Only ${industryCounts[worstIndustry].won} wins from ${industryCounts[worstIndustry].leads.length} leads`,
        confidence: Math.min(88, 55 + industryCounts[worstIndustry].leads.length * 2),
        dataPoints: industryCounts[worstIndustry].leads.length,
        recommendation: `📌 Action: Reduce focus on ${worstIndustry} or refine your approach. Consider if product-market fit exists here.`,
        affectedLeads: industryCounts[worstIndustry].leads.filter(l => l.status !== 'won' && l.status !== 'lost').length,
        exampleLeads: industryCounts[worstIndustry].leads.filter(l => l.status === 'lost').slice(0, 3)
      });
    }

    // Pattern 7: Qualification Accuracy
    const hotLeadsConverted = leads.filter(l => l.qualification_level === 'hot' && l.status === 'won').length;
    const totalHotLeads = leads.filter(l => l.qualification_level === 'hot').length;
    const hotConversionRate = totalHotLeads > 0 ? hotLeadsConverted / totalHotLeads : 0;

    if (totalHotLeads >= 10 && hotConversionRate < 0.3) {
      detectedPatterns.push({
        id: 'qualification-issue',
        type: 'insight',
        title: '🔍 Hot Lead Qualification Needs Review',
        description: `Only ${Math.round(hotConversionRate * 100)}% of "hot" leads convert. Your qualification criteria may be too loose.`,
        impact: `${hotLeadsConverted}/${totalHotLeads} hot leads converted`,
        confidence: 85,
        dataPoints: totalHotLeads,
        recommendation: '📌 Action: Tighten qualification criteria. Consider factors like budget confirmation, timeline, and decision-maker access.',
        affectedLeads: totalHotLeads - hotLeadsConverted,
        exampleLeads: leads.filter(l => l.qualification_level === 'hot' && l.status === 'lost').slice(0, 3)
      });
    }

    // Sort patterns by confidence and type
    return detectedPatterns.sort((a, b) => {
      // Prioritize: winning > insight > risk
      const typeOrder = { winning: 0, insight: 1, risk: 2 };
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return b.confidence - a.confidence;
    });
  }, [leads, activities]);

  // Summary stats
  const summary = useMemo(() => {
    const winningPatterns = patterns.filter(p => p.type === 'winning').length;
    const riskPatterns = patterns.filter(p => p.type === 'risk').length;
    const insightPatterns = patterns.filter(p => p.type === 'insight').length;
    const totalAffectedLeads = patterns.reduce((sum, p) => sum + p.affectedLeads, 0);
    const avgConfidence = patterns.length > 0 
      ? Math.round(patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length)
      : 0;

    return {
      winningPatterns,
      riskPatterns,
      insightPatterns,
      totalAffectedLeads,
      avgConfidence
    };
  }, [patterns]);

  const typeConfig = {
    winning: {
      icon: <CheckCircle2 className="w-5 h-5" />,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      badgeColor: 'bg-green-100 text-green-700',
      label: 'WINNING PATTERN'
    },
    risk: {
      icon: <AlertTriangle className="w-5 h-5" />,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      badgeColor: 'bg-orange-100 text-orange-700',
      label: 'RISK PATTERN'
    },
    insight: {
      icon: <Lightbulb className="w-5 h-5" />,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      badgeColor: 'bg-blue-100 text-blue-700',
      label: 'INSIGHT'
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#E64B8B]/5 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#E64B8B] rounded-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                🧠 Pattern Intelligence
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">AI-detected patterns from your pipeline with automated recommendations</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-gray-500">{patterns.length} pattern{patterns.length !== 1 ? 's' : ''} detected</p>
            <p className="text-xs text-[#E64B8B] font-semibold">{summary.avgConfidence}% avg confidence</p>
          </div>
        </div>
      </div>

      {patterns.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500 font-medium">Not enough data yet</p>
          <p className="text-xs text-gray-400 mt-1">Keep working your pipeline. Patterns will emerge as you get more data.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <p className="text-2xl font-bold text-gray-900">{summary.winningPatterns}</p>
                </div>
                <p className="text-xs text-gray-600">Winning Patterns</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <p className="text-2xl font-bold text-gray-900">{summary.riskPatterns}</p>
                </div>
                <p className="text-xs text-gray-600">Risks Identified</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  <p className="text-2xl font-bold text-gray-900">{summary.insightPatterns}</p>
                </div>
                <p className="text-xs text-gray-600">Insights</p>
              </div>
            </div>
          </div>

          {/* Patterns List */}
          <div className="divide-y divide-gray-100">
            {patterns.map((pattern, index) => {
              const config = typeConfig[pattern.type];

              return (
                <div
                  key={pattern.id}
                  className={`relative group hover:bg-gray-50 transition-colors border-l-4 ${config.borderColor}`}
                >
                  <div className="px-6 py-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Icon */}
                        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${config.bgColor} flex-shrink-0`}>
                          <span className={config.iconColor}>{config.icon}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${config.badgeColor}`}>
                              {config.label}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                              {pattern.confidence}% confidence
                            </span>
                          </div>
                          
                          <p className="text-sm font-bold text-gray-900 mb-2">{pattern.title}</p>
                          <p className="text-sm text-gray-700 leading-relaxed mb-3">{pattern.description}</p>
                          
                          {/* Impact */}
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                            <div className="flex items-start gap-2">
                              <Target className="w-4 h-4 text-[#E64B8B] mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Impact</p>
                                <p className="text-sm font-semibold text-gray-900">{pattern.impact}</p>
                                <p className="text-xs text-gray-600 mt-1">Based on {pattern.dataPoints} data points • Affects {pattern.affectedLeads} lead{pattern.affectedLeads !== 1 ? 's' : ''}</p>
                              </div>
                            </div>
                          </div>

                          {/* Recommendation */}
                          <div className="bg-gradient-to-r from-[#E64B8B]/5 to-purple-50 border-2 border-[#E64B8B]/20 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <Zap className="w-4 h-4 text-[#E64B8B] mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-gray-900 font-medium leading-relaxed">{pattern.recommendation}</p>
                            </div>
                          </div>

                          {/* Example Leads */}
                          {pattern.exampleLeads && pattern.exampleLeads.length > 0 && (
                            <button
                              onClick={() => setSelectedPattern(selectedPattern?.id === pattern.id ? null : pattern)}
                              className="mt-3 text-xs font-semibold text-[#E64B8B] hover:text-[#d43d7a] transition-colors flex items-center gap-1"
                            >
                              {selectedPattern?.id === pattern.id ? 'Hide' : 'View'} {pattern.exampleLeads.length} Example Lead{pattern.exampleLeads.length !== 1 ? 's' : ''}
                              <ChevronRight className={`w-3 h-3 transition-transform ${selectedPattern?.id === pattern.id ? 'rotate-90' : ''}`} />
                            </button>
                          )}

                          {/* Expanded Examples */}
                          {selectedPattern?.id === pattern.id && pattern.exampleLeads && (
                            <div className="mt-3 space-y-2">
                              {pattern.exampleLeads.map(lead => {
                                const name = `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim() || "Unknown";
                                const company = lead.company_name ?? "Unknown";
                                
                                return (
                                  <div
                                    key={lead.id}
                                    className="bg-white border border-gray-200 rounded-lg p-3 hover:border-[#E64B8B]/30 transition-colors group/lead"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-900 mb-1">{name} • {company}</p>
                                        <div className="flex items-center gap-3 text-xs text-gray-600">
                                          <span className="capitalize">{lead.status}</span>
                                          {lead.employee_count && (
                                            <>
                                              <span>•</span>
                                              <span>{lead.employee_count.toLocaleString()} employees</span>
                                            </>
                                          )}
                                          {lead.company_industry && (
                                            <>
                                              <span>•</span>
                                              <span>{lead.company_industry}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => onNavigateToLead(lead.id)}
                                        className="p-2 rounded-lg text-gray-400 hover:text-[#E64B8B] hover:bg-gray-100 transition-all opacity-0 group-hover/lead:opacity-100"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs">
              <p className="text-gray-600">
                💡 <strong>Tip:</strong> These patterns are automatically detected from your pipeline data. Act on recommendations to improve conversion.
              </p>
              <p className="text-gray-500 font-medium">
                Total Affected: <span className="text-gray-900 font-bold">{summary.totalAffectedLeads} lead{summary.totalAffectedLeads !== 1 ? 's' : ''}</span>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
