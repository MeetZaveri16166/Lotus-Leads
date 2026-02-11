import { Sparkles, Target, Brain, Mail, TrendingUp, MapPin, CheckCircle, DollarSign } from "lucide-react";

// Sample anonymized data based on real enriched leads
const samplePropertyAnalysis = {
  property_type: "Commercial Retail Center",
  lot_size_acres: "8.5 acres",
  property_condition: "Good",
  opportunity_score: 82,
  facilities_identified: ["Parking lot areas", "Landscape zones", "Building perimeter"],
  estimated_mowing_hours: "4-6 hours/week"
};

const sampleServiceMapping = {
  services: [
    { name: "Parking Lot Maintenance", fit: "High", value: "$24,000", confidence: "94%" },
    { name: "Landscape Management", fit: "High", value: "$18,500", confidence: "89%" },
    { name: "Snow Removal", fit: "Medium", value: "$12,000", confidence: "76%" }
  ],
  total_value: "$54,500",
  opportunity_score: "High"
};

const sampleOpportunityScore = {
  overall: 87,
  company_fit: 92,
  engagement: 78,
  timing: 84,
  win_probability: "78%"
};

const sampleMessage = {
  subject: "Landscape Solutions for [Company Name]",
  preview: "I noticed your retail facility could benefit from...",
  personalization: ["Property-specific insights", "Service fit analysis", "Seasonal context"],
  tone: "Professional"
};

const sampleResearch = {
  sources: 18,
  market_position: "Growing regional player",
  recent_activity: ["Opened new location (3 months ago)", "Hiring for expansion", "Investing in property improvements"],
  competitive_landscape: "Mid-market segment, high growth potential"
};

// Preview Component 1: Property Analysis
export function PropertyAnalysisPreview() {
  return (
    <div className="aspect-video bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4 overflow-hidden">
      <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm">AI Property Analysis</h3>
          <p className="text-xs text-gray-500">GPT-4o Vision Analysis</p>
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-gray-500 mb-1">Property Type</div>
          <div className="text-xs font-bold text-gray-900 leading-tight">{samplePropertyAnalysis.property_type}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-gray-500 mb-1">Size</div>
          <div className="text-xs font-bold text-gray-900">{samplePropertyAnalysis.lot_size_acres}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-gray-500 mb-1">Condition</div>
          <div className="text-xs font-bold text-green-600">{samplePropertyAnalysis.property_condition}</div>
        </div>
      </div>
      
      {/* Opportunity Score */}
      <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">Opportunity Score</span>
          <span className="text-lg font-bold text-pink-600">{samplePropertyAnalysis.opportunity_score}/100</span>
        </div>
        <div className="mt-2 h-1.5 bg-white rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full" 
            style={{ width: `${samplePropertyAnalysis.opportunity_score}%` }}
          />
        </div>
      </div>
      
      {/* Key Insights */}
      <div className="space-y-1.5">
        <div className="text-xs font-semibold text-gray-700">Key Insights:</div>
        {samplePropertyAnalysis.facilities_identified.slice(0, 2).map((facility, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <div className="w-1 h-1 bg-pink-500 rounded-full mt-1.5 flex-shrink-0" />
            <span className="text-xs text-gray-600">{facility}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Preview Component 2: Service Mapping
export function ServiceMappingPreview() {
  return (
    <div className="aspect-video bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4 overflow-hidden">
      <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
          <Target className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm">Service Mapping AI</h3>
          <p className="text-xs text-gray-500">AI-Powered Recommendations</p>
        </div>
      </div>
      
      {/* Service Recommendations */}
      <div className="space-y-2">
        {sampleServiceMapping.services.slice(0, 3).map((service, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-900">{service.name}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                service.fit === "High" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
              }`}>
                {service.fit} Fit
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Est. Annual Value:</span>
                <span className="ml-1 font-semibold text-gray-900">{service.value}</span>
              </div>
              <div>
                <span className="text-gray-500">Confidence:</span>
                <span className="ml-1 font-semibold text-blue-600">{service.confidence}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Total Value */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-gray-700">Total Annual Value</span>
          </div>
          <span className="text-lg font-bold text-blue-600">{sampleServiceMapping.total_value}</span>
        </div>
      </div>
    </div>
  );
}

// Preview Component 3: Opportunity Scoring
export function OpportunityScoringPreview() {
  return (
    <div className="aspect-video bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4 overflow-hidden">
      <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center flex-shrink-0">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm">AI Opportunity Scoring</h3>
          <p className="text-xs text-gray-500">Multi-Factor Analysis</p>
        </div>
      </div>
      
      {/* Overall Score - Prominent */}
      <div className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200 rounded-xl p-4 text-center">
        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Overall Score</div>
        <div className="text-4xl font-bold text-purple-600 mb-2">{sampleOpportunityScore.overall}<span className="text-2xl text-gray-400">/100</span></div>
        <div className="flex items-center justify-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-xs font-semibold text-green-600">High Priority Lead</span>
        </div>
      </div>
      
      {/* Score Breakdown */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-gray-200 rounded-lg p-2.5 text-center">
          <div className="text-xs text-gray-500 mb-1">Company Fit</div>
          <div className="text-lg font-bold text-gray-900">{sampleOpportunityScore.company_fit}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-2.5 text-center">
          <div className="text-xs text-gray-500 mb-1">Engagement</div>
          <div className="text-lg font-bold text-gray-900">{sampleOpportunityScore.engagement}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-2.5 text-center">
          <div className="text-xs text-gray-500 mb-1">Timing</div>
          <div className="text-lg font-bold text-gray-900">{sampleOpportunityScore.timing}</div>
        </div>
      </div>
      
      {/* Win Probability */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">Win Probability</span>
          <span className="text-sm font-bold text-green-600">{sampleOpportunityScore.win_probability}</span>
        </div>
      </div>
    </div>
  );
}

// Preview Component 4: Message Generation
export function MessageGenerationPreview() {
  return (
    <div className="aspect-video bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4 overflow-hidden">
      <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
          <Mail className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm">AI Message Generation</h3>
          <p className="text-xs text-gray-500">Personalized Outreach</p>
        </div>
      </div>
      
      {/* Message Preview */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-1">Subject</div>
          <div className="text-xs font-semibold text-gray-900">{sampleMessage.subject}</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-1">Preview</div>
          <div className="text-xs text-gray-700 leading-relaxed">{sampleMessage.preview}</div>
        </div>
      </div>
      
      {/* Personalization Tags */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-700">Personalization Applied:</div>
        <div className="flex flex-wrap gap-1.5">
          {sampleMessage.personalization.map((tag, idx) => (
            <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      {/* Status */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">Status</span>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
            <span className="text-xs font-bold text-green-600">Ready to Send</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Preview Component 5: Perplexity Research
export function PerplexityResearchPreview() {
  return (
    <div className="aspect-video bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4 overflow-hidden">
      <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm">Perplexity Research</h3>
          <p className="text-xs text-gray-500">Real-Time Web Intelligence</p>
        </div>
      </div>
      
      {/* Research Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-gray-200 rounded-lg p-2.5 text-center">
          <div className="text-xs text-gray-500 mb-1">Sources</div>
          <div className="text-lg font-bold text-gray-900">{sampleResearch.sources}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-2.5 text-center">
          <div className="text-xs text-gray-500 mb-1">Position</div>
          <div className="text-xs font-bold text-green-600 leading-tight">Growing</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-2.5 text-center">
          <div className="text-xs text-gray-500 mb-1">Updates</div>
          <div className="text-lg font-bold text-orange-600">3</div>
        </div>
      </div>
      
      {/* Market Position */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="text-xs font-semibold text-gray-700 mb-2">Market Position</div>
        <div className="text-xs text-gray-900">{sampleResearch.market_position}</div>
      </div>
      
      {/* Recent Activity */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-700">Recent Activity:</div>
        <div className="space-y-1.5">
          {sampleResearch.recent_activity.slice(0, 2).map((activity, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <div className="w-1 h-1 bg-orange-500 rounded-full mt-1.5 flex-shrink-0" />
              <span className="text-xs text-gray-600">{activity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
