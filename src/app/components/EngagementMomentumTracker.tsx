import React, { useMemo } from "react";
import { 
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  AlertCircle,
  Eye,
  Clock,
  Target,
  Flame,
  Snowflake,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";

type Lead = any;
type ActivityLog = any;

interface LeadMomentum {
  lead: Lead;
  momentum: 'accelerating' | 'steady' | 'slowing' | 'stalled';
  score: number; // -100 to +100
  velocityDays: number; // avg days between activities
  recentActivityCount: number; // last 14 days
  trend: 'up' | 'down' | 'flat';
  reasoning: string[];
  temperature: 'hot' | 'warm' | 'cooling' | 'cold';
  nextAction: string;
  daysUntilStale: number;
}

interface EngagementMomentumTrackerProps {
  leads: Lead[];
  activities: ActivityLog[];
  onNavigateToLead: (leadId: string) => void;
}

export function EngagementMomentumTracker({ 
  leads, 
  activities, 
  onNavigateToLead 
}: EngagementMomentumTrackerProps) {
  // Calculate momentum for each lead
  const leadMomentum: LeadMomentum[] = useMemo(() => {
    const now = new Date();

    return leads.map(lead => {
      const leadActivities = activities
        .filter(a => a.lead_id === lead.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      if (leadActivities.length === 0) {
        const daysSinceCreated = (now.getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return {
          lead,
          momentum: 'stalled' as const,
          score: -80,
          velocityDays: 999,
          recentActivityCount: 0,
          trend: 'down' as const,
          reasoning: [
            `No activities recorded yet`,
            `Lead created ${Math.round(daysSinceCreated)} days ago`,
            `Action required to start engagement`
          ],
          temperature: 'cold' as const,
          nextAction: 'Make initial contact within 24 hours',
          daysUntilStale: Math.max(0, 7 - daysSinceCreated)
        };
      }

      // Recent activity (last 14 days)
      const recentActivities = leadActivities.filter(a => {
        const daysSince = (now.getTime() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 14;
      });

      // Very recent (last 7 days)
      const veryRecentActivities = leadActivities.filter(a => {
        const daysSince = (now.getTime() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 7;
      });

      // Calculate velocity (avg days between activities)
      let avgDaysBetween = 0;
      if (leadActivities.length >= 2) {
        const intervals: number[] = [];
        for (let i = 1; i < leadActivities.length; i++) {
          const diff = (new Date(leadActivities[i].created_at).getTime() - 
                       new Date(leadActivities[i - 1].created_at).getTime()) / (1000 * 60 * 60 * 24);
          intervals.push(diff);
        }
        avgDaysBetween = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      }

      // Calculate momentum score (-100 to +100)
      let momentumScore = 0;
      const reasoning: string[] = [];

      // Factor 1: Recent activity count (±40 points)
      if (recentActivities.length >= 4) {
        momentumScore += 40;
        reasoning.push(`${recentActivities.length} activities in last 14 days - High engagement`);
      } else if (recentActivities.length >= 2) {
        momentumScore += 20;
        reasoning.push(`${recentActivities.length} activities in last 14 days - Moderate engagement`);
      } else if (recentActivities.length === 1) {
        momentumScore -= 10;
        reasoning.push(`Only 1 activity in last 14 days - Low engagement`);
      } else {
        momentumScore -= 40;
        reasoning.push(`No activities in last 14 days - Stalled`);
      }

      // Factor 2: Activity velocity (±30 points)
      if (avgDaysBetween > 0) {
        if (avgDaysBetween <= 3) {
          momentumScore += 30;
          reasoning.push(`Activity every ${avgDaysBetween.toFixed(1)} days - Excellent cadence`);
        } else if (avgDaysBetween <= 7) {
          momentumScore += 15;
          reasoning.push(`Activity every ${avgDaysBetween.toFixed(1)} days - Good cadence`);
        } else if (avgDaysBetween <= 14) {
          momentumScore -= 10;
          reasoning.push(`Activity every ${avgDaysBetween.toFixed(1)} days - Slow cadence`);
        } else {
          momentumScore -= 30;
          reasoning.push(`Activity every ${avgDaysBetween.toFixed(1)} days - Very slow`);
        }
      }

      // Factor 3: Trend analysis (±20 points)
      const recent7 = veryRecentActivities.length;
      const previous7 = leadActivities.filter(a => {
        const daysSince = (now.getTime() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince > 7 && daysSince <= 14;
      }).length;

      let trend: 'up' | 'down' | 'flat' = 'flat';
      if (recent7 > previous7) {
        momentumScore += 20;
        trend = 'up';
        reasoning.push(`📈 Accelerating: ${recent7} activities this week vs ${previous7} last week`);
      } else if (recent7 < previous7) {
        momentumScore -= 20;
        trend = 'down';
        reasoning.push(`📉 Slowing: ${recent7} activities this week vs ${previous7} last week`);
      } else if (recent7 > 0) {
        trend = 'flat';
        reasoning.push(`➡️ Steady: ${recent7} activities per week`);
      }

      // Factor 4: Time since last activity (±10 points)
      const lastActivity = leadActivities[leadActivities.length - 1];
      const daysSinceLastActivity = (now.getTime() - new Date(lastActivity.created_at).getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceLastActivity <= 1) {
        momentumScore += 10;
        reasoning.push(`Last activity today - Fresh engagement`);
      } else if (daysSinceLastActivity <= 3) {
        momentumScore += 5;
        reasoning.push(`Last activity ${Math.round(daysSinceLastActivity)} days ago`);
      } else if (daysSinceLastActivity <= 7) {
        momentumScore -= 5;
        reasoning.push(`Last activity ${Math.round(daysSinceLastActivity)} days ago - Follow up soon`);
      } else {
        momentumScore -= 10;
        reasoning.push(`Last activity ${Math.round(daysSinceLastActivity)} days ago - Overdue`);
      }

      // Determine momentum category
      let momentum: 'accelerating' | 'steady' | 'slowing' | 'stalled';
      if (momentumScore >= 40) momentum = 'accelerating';
      else if (momentumScore >= 0) momentum = 'steady';
      else if (momentumScore >= -40) momentum = 'slowing';
      else momentum = 'stalled';

      // Determine temperature
      let temperature: 'hot' | 'warm' | 'cooling' | 'cold';
      if (momentumScore >= 40 || (recentActivities.length >= 3 && daysSinceLastActivity <= 3)) {
        temperature = 'hot';
      } else if (momentumScore >= 0 || recentActivities.length >= 2) {
        temperature = 'warm';
      } else if (momentumScore >= -40 || recentActivities.length >= 1) {
        temperature = 'cooling';
      } else {
        temperature = 'cold';
      }

      // Next action recommendation
      let nextAction = '';
      if (daysSinceLastActivity > 14) {
        nextAction = '🚨 Urgent: Re-engage immediately with personalized outreach';
      } else if (daysSinceLastActivity > 7) {
        nextAction = '⚠️ Follow up within 24 hours to maintain momentum';
      } else if (momentum === 'accelerating') {
        nextAction = '🎯 Strike while hot! Schedule a meeting or advance to next stage';
      } else if (momentum === 'steady') {
        nextAction = '✅ Maintain cadence with regular touchpoints every 3-5 days';
      } else {
        nextAction = '📞 Increase engagement frequency to rebuild momentum';
      }

      // Days until stale
      const daysUntilStale = Math.max(0, 14 - daysSinceLastActivity);

      return {
        lead,
        momentum,
        score: Math.round(momentumScore),
        velocityDays: avgDaysBetween,
        recentActivityCount: recentActivities.length,
        trend,
        reasoning,
        temperature,
        nextAction,
        daysUntilStale
      };
    }).sort((a, b) => b.score - a.score); // Sort by momentum score
  }, [leads, activities]);

  // Summary stats
  const summary = useMemo(() => {
    const accelerating = leadMomentum.filter(l => l.momentum === 'accelerating').length;
    const steady = leadMomentum.filter(l => l.momentum === 'steady').length;
    const slowing = leadMomentum.filter(l => l.momentum === 'slowing').length;
    const stalled = leadMomentum.filter(l => l.momentum === 'stalled').length;

    const hot = leadMomentum.filter(l => l.temperature === 'hot').length;
    const cooling = leadMomentum.filter(l => l.temperature === 'cooling').length;

    const avgScore = leadMomentum.length > 0
      ? Math.round(leadMomentum.reduce((sum, l) => sum + l.score, 0) / leadMomentum.length)
      : 0;

    return {
      accelerating,
      steady,
      slowing,
      stalled,
      hot,
      cooling,
      avgScore
    };
  }, [leadMomentum]);

  const momentumConfig = {
    accelerating: {
      icon: <Zap className="w-5 h-5" />,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      badgeColor: 'bg-green-100 text-green-700',
      label: 'ACCELERATING'
    },
    steady: {
      icon: <Activity className="w-5 h-5" />,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      badgeColor: 'bg-blue-100 text-blue-700',
      label: 'STEADY'
    },
    slowing: {
      icon: <TrendingDown className="w-5 h-5" />,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      badgeColor: 'bg-orange-100 text-orange-700',
      label: 'SLOWING'
    },
    stalled: {
      icon: <AlertCircle className="w-5 h-5" />,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200',
      badgeColor: 'bg-red-100 text-red-700',
      label: 'STALLED'
    }
  };

  const temperatureConfig = {
    hot: { icon: <Flame className="w-4 h-4" />, color: 'text-red-500', label: '🔥 HOT' },
    warm: { icon: <TrendingUp className="w-4 h-4" />, color: 'text-orange-500', label: '🟡 WARM' },
    cooling: { icon: <TrendingDown className="w-4 h-4" />, color: 'text-blue-500', label: '🔵 COOLING' },
    cold: { icon: <Snowflake className="w-4 h-4" />, color: 'text-gray-500', label: '❄️ COLD' }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#E64B8B]/5 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#E64B8B] rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                📊 Engagement Momentum Tracker
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">Real-time velocity and temperature analysis for every lead</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-gray-500">{leadMomentum.length} leads tracked</p>
            <p className="text-xs text-[#E64B8B] font-semibold">Avg Score: {summary.avgScore > 0 ? '+' : ''}{summary.avgScore}</p>
          </div>
        </div>
      </div>

      {leadMomentum.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500 font-medium">No leads to track yet</p>
          <p className="text-xs text-gray-400 mt-1">Add leads to see engagement momentum</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-green-600" />
                  <p className="text-2xl font-bold text-gray-900">{summary.accelerating}</p>
                </div>
                <p className="text-xs text-gray-600">Accelerating</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <p className="text-2xl font-bold text-gray-900">{summary.steady}</p>
                </div>
                <p className="text-xs text-gray-600">Steady</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-orange-600" />
                  <p className="text-2xl font-bold text-gray-900">{summary.slowing}</p>
                </div>
                <p className="text-xs text-gray-600">Slowing</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-2xl font-bold text-gray-900">{summary.stalled}</p>
                </div>
                <p className="text-xs text-gray-600">Stalled</p>
              </div>
            </div>
          </div>

          {/* Leads List */}
          <div className="divide-y divide-gray-100">
            {leadMomentum.map((item, index) => {
              const config = momentumConfig[item.momentum];
              const tempConfig = temperatureConfig[item.temperature];
              const name = `${item.lead.first_name ?? ""} ${item.lead.last_name ?? ""}`.trim() || "Unknown";
              const company = item.lead.company_name ?? "Unknown";

              return (
                <div
                  key={item.lead.id}
                  className={`relative group hover:bg-gray-50 transition-colors border-l-4 ${config.borderColor}`}
                >
                  <div className="px-6 py-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Momentum Icon */}
                        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${config.bgColor} flex-shrink-0`}>
                          <span className={config.iconColor}>{config.icon}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                            <p className="font-semibold text-gray-900">{name}</p>
                            <span className="text-xs text-gray-400">•</span>
                            <p className="text-sm text-gray-600">{company}</p>
                          </div>

                          {/* Badges */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${config.badgeColor}`}>
                              {config.label}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${tempConfig.color} bg-gray-100`}>
                              {tempConfig.label}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              item.score >= 40 ? 'bg-green-100 text-green-700' :
                              item.score >= 0 ? 'bg-blue-100 text-blue-700' :
                              item.score >= -40 ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              Score: {item.score > 0 ? '+' : ''}{item.score}
                            </span>
                            {item.trend === 'up' && (
                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
                                <ArrowUp className="w-3 h-3" /> Trending Up
                              </span>
                            )}
                            {item.trend === 'down' && (
                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 flex items-center gap-1">
                                <ArrowDown className="w-3 h-3" /> Trending Down
                              </span>
                            )}
                          </div>

                          {/* Metrics Grid */}
                          <div className="grid grid-cols-3 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Recent Activity</p>
                              <p className="text-sm font-bold text-gray-900">{item.recentActivityCount} in 14 days</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Avg Velocity</p>
                              <p className="text-sm font-bold text-gray-900">
                                {item.velocityDays < 999 ? `${item.velocityDays.toFixed(1)} days` : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Days Until Stale</p>
                              <p className={`text-sm font-bold ${
                                item.daysUntilStale <= 3 ? 'text-red-600' :
                                item.daysUntilStale <= 7 ? 'text-orange-600' :
                                'text-gray-900'
                              }`}>
                                {item.daysUntilStale}
                              </p>
                            </div>
                          </div>

                          {/* Reasoning */}
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Analysis</p>
                            <div className="space-y-1">
                              {item.reasoning.map((reason, idx) => (
                                <p key={idx} className="text-xs text-gray-700 leading-relaxed">• {reason}</p>
                              ))}
                            </div>
                          </div>

                          {/* Next Action */}
                          <div className="bg-gradient-to-r from-[#E64B8B]/5 to-purple-50 border-2 border-[#E64B8B]/20 rounded-lg p-3 mb-3">
                            <div className="flex items-start gap-2">
                              <Target className="w-4 h-4 text-[#E64B8B] mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Recommended Action</p>
                                <p className="text-sm text-gray-900 font-medium leading-relaxed">{item.nextAction}</p>
                              </div>
                            </div>
                          </div>

                          {/* View Button */}
                          <button
                            onClick={() => onNavigateToLead(item.lead.id)}
                            className="text-xs font-semibold text-[#E64B8B] hover:text-[#d43d7a] transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View Lead Details
                          </button>
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
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-500" />
                  <span className="text-gray-600">{summary.hot} Hot Leads</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600">{summary.cooling} Cooling Down</span>
                </div>
              </div>
              <p className="text-gray-500 font-medium">
                💡 <strong>Tip:</strong> Focus on accelerating and slowing leads for maximum impact
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
