import React, { useState, useMemo } from "react";
import { 
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  BarChart3,
  Target,
  Zap,
  TrendingDown,
  Activity
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

type Lead = any;
type ActivityLog = any;

interface ForecastPeriod {
  period: string;
  days: number;
  expected: number;
  conservative: number;
  optimistic: number;
  dealCount: number;
  contributingDeals: Array<{
    lead: Lead;
    probability: number;
    value: number;
    expectedRevenue: number;
    daysToClose: number;
    reasoning: string;
  }>;
}

interface PredictiveRevenueForecastProps {
  leads: Lead[];
  activities: ActivityLog[];
  onNavigateToLead: (leadId: string) => void;
}

export function PredictiveRevenueForecast({ 
  leads, 
  activities, 
  onNavigateToLead 
}: PredictiveRevenueForecastProps) {
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);
  const [showMethodology, setShowMethodology] = useState(false);

  // Calculate forecast
  const forecast = useMemo(() => {
    const now = new Date();
    
    // Historical conversion rates (baseline)
    const baselineConversion = {
      new: 0.15,
      contacted: 0.35,
      qualified: 0.60,
      proposal: 0.75,
      won: 1.0
    };

    // Average days to close by stage
    const avgDaysToClose = {
      new: 45,
      contacted: 35,
      qualified: 25,
      proposal: 15,
      won: 0
    };

    // Qualification multipliers
    const qualMultipliers = {
      hot: 1.4,
      warm: 1.0,
      cold: 0.7
    };

    // Calculate forecast for each lead
    const leadForecasts = leads.map(lead => {
      // Skip won/lost deals
      if (lead.status === 'won' || lead.status === 'lost') {
        return null;
      }

      const leadActivities = activities.filter(a => a.lead_id === lead.id);
      
      // Calculate estimated value
      let estimatedValue = 0;
      if (lead.company_revenue && typeof lead.company_revenue === 'string') {
        const revenueStr = lead.company_revenue.replace(/[$,]/g, '');
        const match = revenueStr.match(/(\d+(?:\.\d+)?)(M|K|B)?/i);
        if (match) {
          let value = parseFloat(match[1]);
          const unit = match[2]?.toUpperCase();
          if (unit === 'M') value *= 1000000;
          else if (unit === 'K') value *= 1000;
          else if (unit === 'B') value *= 1000000000;
          estimatedValue = value * 0.01;
        }
      } else {
        if (lead.qualification_level === 'hot') estimatedValue = 50000;
        else if (lead.qualification_level === 'warm') estimatedValue = 30000;
        else estimatedValue = 10000;
      }

      // Calculate win probability
      let baseProbability = baselineConversion[lead.status as keyof typeof baselineConversion] || 0.1;
      const qualMultiplier = qualMultipliers[lead.qualification_level as keyof typeof qualMultipliers] || 1.0;
      
      // Engagement boost
      let engagementBoost = 0;
      if (leadActivities.length >= 5) engagementBoost = 0.15;
      else if (leadActivities.length >= 3) engagementBoost = 0.10;
      else if (leadActivities.length >= 1) engagementBoost = 0.05;

      // Recent activity boost
      const recentActivity = leadActivities.filter(a => {
        const daysSince = (now.getTime() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince < 7;
      });
      const recentBoost = recentActivity.length > 0 ? 0.1 : 0;

      // Stagnation penalty
      const daysSinceCreated = (now.getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24);
      let stagnationPenalty = 0;
      if (daysSinceCreated > 60) stagnationPenalty = -0.15;
      else if (daysSinceCreated > 30) stagnationPenalty = -0.10;

      // Calculate final probability
      let probability = baseProbability * qualMultiplier + engagementBoost + recentBoost + stagnationPenalty;
      probability = Math.max(0.05, Math.min(0.95, probability)); // Clamp between 5% and 95%

      // Estimate days to close
      let baseDays = avgDaysToClose[lead.status as keyof typeof avgDaysToClose] || 30;
      
      // Adjust based on engagement
      if (leadActivities.length >= 5) baseDays *= 0.8; // Active deals close faster
      else if (leadActivities.length >= 3) baseDays *= 0.9;
      
      // Adjust based on age
      if (daysSinceCreated > 60) baseDays *= 1.3; // Older deals take longer
      else if (daysSinceCreated < 14) baseDays *= 1.1; // Very new deals need more time

      const daysToClose = Math.round(baseDays);

      // Expected revenue
      const expectedRevenue = estimatedValue * probability;

      // Reasoning
      const reasoning = [
        `${(probability * 100).toFixed(0)}% win probability`,
        `${daysToClose} days to close`,
        lead.qualification_level === 'hot' ? '+40% hot lead bonus' : 
          lead.qualification_level === 'warm' ? 'Warm lead baseline' : '-30% cold lead penalty',
        leadActivities.length >= 5 ? '+15% high engagement' : 
          leadActivities.length >= 3 ? '+10% active engagement' : 
          leadActivities.length >= 1 ? '+5% some engagement' : 'No engagement yet',
        recentActivity.length > 0 ? '+10% recent activity' : '',
        stagnationPenalty < 0 ? `${(stagnationPenalty * 100).toFixed(0)}% stagnation penalty` : ''
      ].filter(Boolean).join('; ');

      return {
        lead,
        estimatedValue,
        probability,
        expectedRevenue,
        daysToClose,
        reasoning
      };
    }).filter(Boolean) as Array<{
      lead: Lead;
      estimatedValue: number;
      probability: number;
      expectedRevenue: number;
      daysToClose: number;
      reasoning: string;
    }>;

    // Group by forecast periods
    const periods: ForecastPeriod[] = [
      { period: '30 Days', days: 30, expected: 0, conservative: 0, optimistic: 0, dealCount: 0, contributingDeals: [] },
      { period: '60 Days', days: 60, expected: 0, conservative: 0, optimistic: 0, dealCount: 0, contributingDeals: [] },
      { period: '90 Days', days: 90, expected: 0, conservative: 0, optimistic: 0, dealCount: 0, contributingDeals: [] }
    ];

    leadForecasts.forEach(forecast => {
      periods.forEach(period => {
        if (forecast.daysToClose <= period.days) {
          // Expected scenario
          period.expected += forecast.expectedRevenue;
          
          // Conservative scenario (reduce probability by 30%)
          const conservativeProbability = Math.max(0.05, forecast.probability * 0.7);
          period.conservative += forecast.estimatedValue * conservativeProbability;
          
          // Optimistic scenario (increase probability by 30%)
          const optimisticProbability = Math.min(0.95, forecast.probability * 1.3);
          period.optimistic += forecast.estimatedValue * optimisticProbability;
          
          period.dealCount++;
          period.contributingDeals.push({
            lead: forecast.lead,
            probability: forecast.probability,
            value: forecast.estimatedValue,
            expectedRevenue: forecast.expectedRevenue,
            daysToClose: forecast.daysToClose,
            reasoning: forecast.reasoning
          });
        }
      });
    });

    // Round values
    periods.forEach(p => {
      p.expected = Math.round(p.expected);
      p.conservative = Math.round(p.conservative);
      p.optimistic = Math.round(p.optimistic);
      
      // Sort deals by expected revenue
      p.contributingDeals.sort((a, b) => b.expectedRevenue - a.expectedRevenue);
    });

    return periods;
  }, [leads, activities]);

  // Chart data
  const chartData = useMemo(() => {
    return [
      { name: 'Now', conservative: 0, expected: 0, optimistic: 0 },
      { name: '30d', conservative: forecast[0].conservative, expected: forecast[0].expected, optimistic: forecast[0].optimistic },
      { name: '60d', conservative: forecast[1].conservative, expected: forecast[1].expected, optimistic: forecast[1].optimistic },
      { name: '90d', conservative: forecast[2].conservative, expected: forecast[2].expected, optimistic: forecast[2].optimistic }
    ];
  }, [forecast]);

  // Calculate insights
  const insights = useMemo(() => {
    const period90 = forecast[2];
    const period30 = forecast[0];
    
    const topDeal = period90.contributingDeals[0];
    const riskDeals = period90.contributingDeals.filter(d => d.probability < 0.4);
    const sureDeals = period90.contributingDeals.filter(d => d.probability > 0.7);
    
    const growthPotential = period90.optimistic - period90.expected;
    const downriskAmount = period90.expected - period90.conservative;

    return {
      topDeal,
      riskDeals: riskDeals.length,
      sureDeals: sureDeals.length,
      growthPotential,
      downriskAmount,
      confidenceSpread: ((downriskAmount / period90.expected) * 100).toFixed(0)
    };
  }, [forecast]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#E64B8B]/5 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#E64B8B] rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                📊 Predictive Revenue Forecast
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">AI-powered 30/60/90 day revenue projections with confidence bands</p>
            </div>
          </div>
          <button
            onClick={() => setShowMethodology(!showMethodology)}
            className="text-xs font-medium text-[#E64B8B] hover:text-[#d43d7a] transition-colors flex items-center gap-1"
          >
            {showMethodology ? 'Hide' : 'Show'} Methodology
            {showMethodology ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Methodology */}
      {showMethodology && (
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            How We Calculate Forecasts
          </h3>
          <div className="space-y-2 text-xs text-gray-700 leading-relaxed">
            <p><strong>1. Base Probability:</strong> Each stage has a baseline win probability (New: 15%, Contacted: 35%, Qualified: 60%, Proposal: 75%)</p>
            <p><strong>2. Qualification Multiplier:</strong> Hot leads get +40% boost, Cold leads get -30% penalty</p>
            <p><strong>3. Engagement Boost:</strong> +5% to +15% based on activity count (more engagement = higher probability)</p>
            <p><strong>4. Recency Bonus:</strong> +10% if there's activity in the last 7 days</p>
            <p><strong>5. Stagnation Penalty:</strong> -10% to -15% for leads older than 30-60 days without progress</p>
            <p><strong>6. Time to Close:</strong> Estimated based on current stage, reduced 10-20% for highly engaged deals</p>
            <p><strong>7. Confidence Bands:</strong> Conservative = 70% of probabilities, Optimistic = 130% of probabilities</p>
          </div>
        </div>
      )}

      {forecast[2].dealCount === 0 ? (
        <div className="px-6 py-16 text-center">
          <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500 font-medium">No active deals in pipeline</p>
          <p className="text-xs text-gray-400 mt-1">Add leads to see revenue forecasts</p>
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="p-8">
            <div className="mb-6">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 60, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorConservative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E64B8B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#E64B8B" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    label={{ value: 'Time Period', position: 'bottom', offset: 0, style: { fontSize: 12, fill: '#374151', fontWeight: 600 } }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    label={{ value: 'Revenue ($)', angle: -90, position: 'left', offset: 40, style: { fontSize: 12, fill: '#374151', fontWeight: 600 } }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-xl">
                            <p className="font-bold text-gray-900 text-sm mb-3">{payload[0].payload.name}</p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-xs text-gray-500">Conservative:</span>
                                <span className="text-sm font-semibold text-red-600">${Math.round(payload[0].payload.conservative).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-xs text-gray-500">Expected:</span>
                                <span className="text-sm font-bold text-[#E64B8B]">${Math.round(payload[0].payload.expected).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-xs text-gray-500">Optimistic:</span>
                                <span className="text-sm font-semibold text-green-600">${Math.round(payload[0].payload.optimistic).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="optimistic" stroke="#22c55e" strokeWidth={2} fill="url(#colorOptimistic)" />
                  <Area type="monotone" dataKey="expected" stroke="#E64B8B" strokeWidth={3} fill="url(#colorExpected)" />
                  <Area type="monotone" dataKey="conservative" stroke="#ef4444" strokeWidth={2} fill="url(#colorConservative)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-xs mb-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-red-500"></div>
                <span className="text-gray-600">Conservative</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-[#E64B8B]"></div>
                <span className="text-gray-600 font-semibold">Expected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-green-500"></div>
                <span className="text-gray-600">Optimistic</span>
              </div>
            </div>

            {/* Period Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {forecast.map((period) => (
                <div key={period.period} className="border-2 border-gray-200 rounded-xl p-5 hover:border-[#E64B8B]/30 transition-all">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{period.period}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    ${Math.round(period.expected / 1000).toLocaleString()}K
                  </p>
                  <p className="text-xs text-gray-500 mb-4">{period.dealCount} deal{period.dealCount !== 1 ? 's' : ''} expected to close</p>
                  
                  {/* Range */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Range:</span>
                      <span className="font-medium text-gray-900">
                        ${Math.round(period.conservative / 1000)}K - ${Math.round(period.optimistic / 1000)}K
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 relative">
                      <div
                        className="absolute left-0 top-0 h-2 bg-red-200 rounded-l-full"
                        style={{ width: `${(period.conservative / period.optimistic) * 100}%` }}
                      />
                      <div
                        className="absolute left-0 top-0 h-2 bg-[#E64B8B] rounded-l-full"
                        style={{ width: `${(period.expected / period.optimistic) * 100}%` }}
                      />
                      <div className="absolute left-0 top-0 w-full h-2 border-2 border-green-500 rounded-full" />
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedPeriod(expandedPeriod === period.period ? null : period.period)}
                    className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {expandedPeriod === period.period ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    View {period.dealCount} Deal{period.dealCount !== 1 ? 's' : ''}
                  </button>
                </div>
              ))}
            </div>

            {/* Expanded Deal List */}
            {expandedPeriod && (
              <div className="mb-8 border-2 border-[#E64B8B]/20 rounded-xl overflow-hidden">
                <div className="bg-[#E64B8B]/5 px-6 py-3 border-b border-[#E64B8B]/20">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#E64B8B]" />
                    Contributing Deals - {expandedPeriod}
                  </h3>
                </div>
                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  {forecast.find(p => p.period === expandedPeriod)?.contributingDeals.map((deal, index) => {
                    const name = `${deal.lead.first_name} ${deal.lead.last_name}`.trim();
                    const company = deal.lead.company_name;
                    
                    return (
                      <div key={deal.lead.id} className="p-4 hover:bg-gray-50 transition-colors group">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                              <p className="font-semibold text-gray-900">{name}</p>
                              <span className="text-xs text-gray-400">•</span>
                              <p className="text-sm text-gray-600">{company}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                              <div>
                                <p className="text-xs text-gray-500">Deal Value</p>
                                <p className="text-sm font-bold text-gray-900">${Math.round(deal.value).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Win Probability</p>
                                <p className="text-sm font-bold text-[#E64B8B]">{(deal.probability * 100).toFixed(0)}%</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Expected Revenue</p>
                                <p className="text-sm font-bold text-green-600">${Math.round(deal.expectedRevenue).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Days to Close</p>
                                <p className="text-sm font-semibold text-gray-900">{deal.daysToClose}</p>
                              </div>
                            </div>

                            <p className="text-xs text-gray-600 leading-relaxed">{deal.reasoning}</p>
                          </div>

                          <button
                            onClick={() => onNavigateToLead(deal.lead.id)}
                            className="ml-4 p-2 rounded-lg text-gray-400 hover:text-[#E64B8B] hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Growth Potential */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-500 rounded-lg flex-shrink-0">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-2">🎯 Growth Potential</h3>
                    <p className="text-2xl font-bold text-green-600 mb-2">
                      +${Math.round(insights.growthPotential / 1000).toLocaleString()}K
                    </p>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      If all deals perform better than expected, you could add <strong>${Math.round(insights.growthPotential / 1000).toLocaleString()}K</strong> in the next 90 days.
                      You have <strong>{insights.sureDeals} high-confidence deals</strong> (70%+ win probability).
                    </p>
                  </div>
                </div>
              </div>

              {/* Downside Risk */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-500 rounded-lg flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-2">⚠️ Downside Risk</h3>
                    <p className="text-2xl font-bold text-orange-600 mb-2">
                      -${Math.round(insights.downriskAmount / 1000).toLocaleString()}K
                    </p>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      If deals underperform, you could lose <strong>${Math.round(insights.downriskAmount / 1000).toLocaleString()}K</strong> vs expected.
                      You have <strong>{insights.riskDeals} risky deals</strong> (&lt;40% win probability) worth protecting.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Stats */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">
                    {insights.sureDeals} High Confidence
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="text-gray-600">
                    {insights.riskDeals} At Risk
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600">
                    {forecast[2].dealCount} Total Opportunities
                  </span>
                </div>
              </div>
              <p className="text-gray-500 font-medium">
                90-Day Expected: <span className="text-gray-900 font-bold">
                  ${Math.round(forecast[2].expected / 1000).toLocaleString()}K
                </span> ±{insights.confidenceSpread}%
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
