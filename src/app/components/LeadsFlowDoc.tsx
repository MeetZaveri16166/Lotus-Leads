import React from "react";
import { Search, Zap, Activity, Target, Brain, TrendingUp, CheckCircle2, Sparkles, BarChart3, Users } from "lucide-react";

// Section Component
const Section = ({ title, icon, color, children, defaultOpen = false }: any) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden ${color}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#E64B8B] rounded-lg">
            {icon}
          </div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
        </div>
        <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="px-6 pb-6">
          {children}
        </div>
      )}
    </div>
  );
};

export function LeadsFlowDocumentation() {
  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-[#E64B8B] rounded-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">AI-Powered Lead Intelligence Flow</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              Our platform transforms raw prospect data into actionable sales intelligence through a <strong>3-stage AI-enhanced workflow</strong>. 
              Each stage applies machine learning analysis to identify the highest-value opportunities and guide your sales strategy with unprecedented precision.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <h3 className="font-bold text-gray-900">Smart Discovery</h3>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              AI matches your ideal customer profile against 275M+ professional contacts. Preview prospects before committing resources.
            </p>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <h3 className="font-bold text-gray-900">Intelligent Enrichment</h3>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              Unlock full contact profiles with AI-scored opportunity potential, engagement signals, and predictive pattern analysis.
            </p>
          </div>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <h3 className="font-bold text-gray-900">Predictive Pipeline</h3>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              AI continuously monitors engagement momentum, predicts close probability, and surfaces next-best actions in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Stage 1: Smart Discovery */}
      <Section
        title="Stage 1: Smart Discovery with AI Matching"
        icon={<Search className="w-5 h-5 text-white" />}
        color="border-l-4 border-l-blue-500"
        defaultOpen={true}
      >
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">🎯 What Is Smart Discovery?</p>
            <p className="text-xs text-blue-800 leading-relaxed">
              Smart Discovery uses AI to <strong>preview potential prospects</strong> before you invest in full contact data. 
              You define your ideal customer profile once, and our AI continuously scans 275+ million professional contacts 
              to surface the best matches—eliminating manual list building and reducing wasted effort.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">How AI Powers Discovery</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm mb-1">ICP Profile Analysis</p>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Your Ideal Customer Profile (job titles, industries, company sizes, technologies, locations) 
                    serves as the targeting blueprint. Our AI translates these criteria into intelligent search parameters, 
                    going beyond simple keyword matching to understand context and intent.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm mb-1">Multi-Dimensional Matching</p>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    AI evaluates prospects across multiple dimensions simultaneously—not just "VP of Sales" but 
                    "VP of Sales at a 200-person SaaS company using Salesforce in the US hiring actively." 
                    This multi-factor analysis ensures higher-quality matches than traditional list providers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm mb-1">Preview Before Commitment</p>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Discovery shows you <strong>basic information</strong> (name, title, company, location) for 25+ prospects at minimal cost. 
                    This "window shopping" approach lets you evaluate fit before investing in full enrichment, 
                    dramatically improving ROI on your prospecting budget.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">What You See During Discovery</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-xs font-bold text-green-900 mb-3">✅ Available in Discovery</p>
                <ul className="space-y-1.5 text-xs text-green-800">
                  <li>• <strong>Full Name</strong> - Professional identity</li>
                  <li>• <strong>Job Title</strong> - Current role & seniority</li>
                  <li>• <strong>Company Name</strong> - Organization affiliation</li>
                  <li>• <strong>Industry</strong> - Sector classification</li>
                  <li>• <strong>Company Size</strong> - Employee count range</li>
                  <li>• <strong>Location</strong> - Geographic market</li>
                  <li>• <strong>LinkedIn Profile</strong> - Professional network presence</li>
                </ul>
                <p className="text-xs text-green-700 mt-3 italic">
                  Enough data to evaluate fit and prioritize enrichment decisions.
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-xs font-bold text-red-900 mb-3">🔒 Unlocked After Enrichment</p>
                <ul className="space-y-1.5 text-xs text-red-800">
                  <li>• <strong>Email Address</strong> - Direct outreach capability</li>
                  <li>• <strong>Phone Numbers</strong> - Voice contact options</li>
                  <li>• <strong>Mobile Phone</strong> - Expanded reach</li>
                  <li>• <strong>Social Profiles</strong> - Multi-channel intelligence</li>
                  <li>• <strong>AI Opportunity Score</strong> - Predictive insights</li>
                  <li>• <strong>Engagement Tracking</strong> - Interaction history</li>
                  <li>• <strong>Pattern Analysis</strong> - Behavioral intelligence</li>
                </ul>
                <p className="text-xs text-red-700 mt-3 italic">
                  Full capabilities require enrichment investment.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-gray-900 mb-2">Why This Two-Stage Approach?</p>
                <p className="text-xs text-gray-700 leading-relaxed mb-3">
                  <strong>Resource Efficiency:</strong> Discovery costs significantly less than enrichment. 
                  By previewing 25+ prospects for minimal investment, you can strategically select only the 
                  highest-quality leads for full enrichment—preventing budget waste on low-fit prospects.
                </p>
                <div className="bg-white/70 rounded p-3">
                  <p className="text-xs text-gray-900 font-semibold mb-1">Example ROI Impact:</p>
                  <p className="text-xs text-gray-700">
                    Preview 100 prospects → Enrich only the 20 best fits = <strong>80% cost savings</strong> vs. blind enrichment
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">The Discovery Experience</h3>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-[#E64B8B] font-bold">→</span>
                  <div>
                    <p className="font-semibold text-gray-900">Discovered Tab (Simple View)</p>
                    <p className="text-gray-600">All discovered leads appear in a clean table showing Name, Title, Company, and Location. No complex filters—just quick scanning to identify promising prospects.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#E64B8B] font-bold">→</span>
                  <div>
                    <p className="font-semibold text-gray-900">"Enrich Lead" Decision Point</p>
                    <p className="text-gray-600">Each lead has an "Enrich" button. This is your strategic decision: "Is this prospect worth investing in full contact data?" Click to unlock complete intelligence.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#E64B8B] font-bold">→</span>
                  <div>
                    <p className="font-semibold text-gray-900">No Pipeline Management Yet</p>
                    <p className="text-gray-600">Discovered leads are "window shopping" mode—status tracking, activities, and AI scoring activate after enrichment.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Stage 2: Intelligent Enrichment */}
      <Section
        title="Stage 2: Intelligent Enrichment with AI Scoring"
        icon={<Zap className="w-5 h-5 text-white" />}
        color="border-l-4 border-l-green-500"
        defaultOpen={true}
      >
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-green-900 mb-2">⚡ What Is Intelligent Enrichment?</p>
            <p className="text-xs text-green-800 leading-relaxed">
              Enrichment transforms a basic prospect into a <strong>fully actionable sales opportunity</strong>. 
              You get complete contact information (email, phone, social profiles) plus <strong>AI-powered intelligence</strong>—
              opportunity scores, engagement predictions, pattern analysis, and recommended next actions. This is where AI converts data into strategy.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">What Changes After Enrichment?</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs font-bold">
                    BEFORE
                  </div>
                  <p className="text-xs font-bold text-gray-900">Discovered State</p>
                </div>
                <ul className="space-y-1.5 text-xs text-gray-700">
                  <li>• Basic info only (name, title, company)</li>
                  <li>• ❌ No contact methods</li>
                  <li>• ❌ No AI analysis</li>
                  <li>• ❌ No opportunity scoring</li>
                  <li>• ❌ No engagement tracking</li>
                  <li>• ❌ No pattern detection</li>
                  <li>• ❌ Can't log activities</li>
                  <li>• ❌ Can't add to campaigns</li>
                  <li>• Limited value - just preview</li>
                </ul>
              </div>

              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="px-3 py-1 bg-green-200 text-green-800 rounded text-xs font-bold">
                    AFTER
                  </div>
                  <p className="text-xs font-bold text-green-900">Enriched State</p>
                </div>
                <ul className="space-y-1.5 text-xs text-green-800">
                  <li>• ✅ Work email + personal email</li>
                  <li>• ✅ Direct phone + mobile phone</li>
                  <li>• ✅ LinkedIn, Twitter, social profiles</li>
                  <li>• ✅ <strong>AI Opportunity Score (0-100)</strong></li>
                  <li>• ✅ <strong>Engagement Momentum Tracking</strong></li>
                  <li>• ✅ <strong>Pattern Intelligence Insights</strong></li>
                  <li>• ✅ Pipeline management unlocked</li>
                  <li>• ✅ Activity logging enabled</li>
                  <li>• ✅ Campaign inclusion available</li>
                  <li>• ✅ <strong>AI-powered next actions</strong></li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">AI Intelligence Layers Activated</h3>
            
            <div className="space-y-3">
              <div className="bg-white border-2 border-[#E64B8B]/30 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-2">
                  <Target className="w-5 h-5 text-[#E64B8B] flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900 text-sm">AI Opportunity Score (0-100)</p>
                    <p className="text-xs text-gray-700 leading-relaxed mt-1">
                      Machine learning evaluates 12+ factors (company fit, role seniority, timing signals, engagement readiness) 
                      to predict deal potential. Scores above 70 indicate high-probability opportunities. 
                      <strong> Transparent breakdown</strong> shows exactly why each lead scored high or low.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-purple-300 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Engagement Momentum Tracker</p>
                    <p className="text-xs text-gray-700 leading-relaxed mt-1">
                      AI monitors interaction velocity (email opens, link clicks, call connections, meeting attendance) 
                      and calculates momentum direction. <strong>Rising momentum</strong> = strike while hot. 
                      <strong>Declining momentum</strong> = intervention needed. Real-time temperature tracking (Cold/Warming/Hot/Cooling).
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-2">
                  <Brain className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Pattern Intelligence</p>
                    <p className="text-xs text-gray-700 leading-relaxed mt-1">
                      AI detects patterns across your entire pipeline: which industries close fastest, which titles respond best, 
                      which company sizes have highest LTV. Surfaces <strong>actionable recommendations</strong> like 
                      "Leads from this industry typically close in 45 days—prioritize accordingly."
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-orange-300 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-2">
                  <BarChart3 className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Predictive Revenue Forecast</p>
                    <p className="text-xs text-gray-700 leading-relaxed mt-1">
                      AI projects likely revenue by pipeline stage, calculating 30/60/90-day close probabilities. 
                      <strong>Confidence bands</strong> show best-case, likely-case, and worst-case scenarios. 
                      Helps prioritize which deals need attention to hit quarterly targets.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-gray-900 mb-2">The Enrichment Decision: When to Invest</p>
                <div className="space-y-2 text-xs text-gray-700">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <p><strong>Enrich if:</strong> Recognizable brand, senior title, target industry, active company signals (hiring, funding, expansion)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <p><strong>Enrich if:</strong> High-value account, multiple stakeholders identified, strategic priority market</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <p><strong>Skip if:</strong> Poor fit, wrong seniority level, saturated market, low priority segment</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Stage 3: Predictive Pipeline */}
      <Section
        title="Stage 3: Predictive Pipeline Management"
        icon={<Activity className="w-5 h-5 text-white" />}
        color="border-l-4 border-l-purple-500"
        defaultOpen={true}
      >
        <div className="space-y-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-purple-900 mb-2">📊 What Is Predictive Pipeline Management?</p>
            <p className="text-xs text-purple-800 leading-relaxed">
              Once enriched, leads enter an <strong>AI-monitored sales pipeline</strong> that tracks progress through 6 stages, 
              predicts close probability, detects engagement momentum shifts, and automatically surfaces the next-best action 
              for each opportunity. This isn't just a CRM—it's an intelligent sales co-pilot.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">6-Stage Sales Pipeline</h3>
            
            <div className="space-y-3">
              <div className="bg-gray-50 border-l-4 border-l-gray-400 rounded-r-lg p-3">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <p className="font-bold text-gray-900">New</p>
                </div>
                <p className="text-xs text-gray-700 ml-11">
                  Freshly enriched, AI scoring complete. Review opportunity score and AI-recommended first touch strategy.
                </p>
              </div>

              <div className="bg-blue-50 border-l-4 border-l-blue-500 rounded-r-lg p-3">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <p className="font-bold text-gray-900">Contacted</p>
                </div>
                <p className="text-xs text-gray-700 ml-11">
                  Initial outreach sent. AI monitors engagement signals (email opens, link clicks) and suggests follow-up timing.
                </p>
              </div>

              <div className="bg-yellow-50 border-l-4 border-l-yellow-500 rounded-r-lg p-3">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <p className="font-bold text-gray-900">Qualified</p>
                </div>
                <p className="text-xs text-gray-700 ml-11">
                  Prospect engaged, fit confirmed. AI tracks engagement momentum and predicts close probability based on historical patterns.
                </p>
              </div>

              <div className="bg-purple-50 border-l-4 border-l-purple-500 rounded-r-lg p-3">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <p className="font-bold text-gray-900">Proposal Sent</p>
                </div>
                <p className="text-xs text-gray-700 ml-11">
                  Formal proposal delivered. AI calculates time-to-close projection and flags if deal velocity slows unexpectedly.
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-l-green-500 rounded-r-lg p-3">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</div>
                  <p className="font-bold text-gray-900">Won 🎉</p>
                </div>
                <p className="text-xs text-gray-700 ml-11">
                  Deal closed! AI analyzes what worked (which messages, timing, touchpoints) to refine future strategies.
                </p>
              </div>

              <div className="bg-red-50 border-l-4 border-l-red-500 rounded-r-lg p-3">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">✗</div>
                  <p className="font-bold text-gray-900">Lost</p>
                </div>
                <p className="text-xs text-gray-700 ml-11">
                  Deal didn't close. AI suggests re-engagement timing based on loss reason and industry benchmarks (e.g., "Follow up in 6 months").
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">Qualification Levels (Temperature)</h3>
            
            <div className="space-y-3">
              <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded font-bold text-sm">COLD</div>
                  <p className="font-bold text-gray-900">Low Engagement</p>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  No response after multiple attempts, or said "not now." AI recommends nurture campaigns or 3-6 month follow-up cycles.
                </p>
              </div>

              <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="px-3 py-1.5 bg-orange-200 text-orange-800 rounded font-bold text-sm">WARM</div>
                  <p className="font-bold text-gray-900">Active Engagement</p>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Responding, showing interest, but not ready to buy. AI suggests content-based nurturing and schedules optimal check-in timing.
                </p>
              </div>

              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="px-3 py-1.5 bg-red-200 text-red-800 rounded font-bold text-sm">HOT</div>
                  <p className="font-bold text-gray-900">High Intent</p>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Active buying signals (requested pricing, involving decision-makers, discussing timeline). AI prioritizes in Smart Action Queue.
                </p>
              </div>
            </div>

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-xs font-semibold text-blue-900 mb-1">🎯 Status vs. Qualification</p>
              <p className="text-xs text-blue-800">
                <strong>Status</strong> = Pipeline stage (where they are). <strong>Qualification</strong> = Engagement level (how hot they are). 
                Both dimensions give you full picture—e.g., "Qualified" + "Hot" = high-priority opportunity.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">AI-Powered Pipeline Features</h3>
            
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#E64B8B] text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-1">Smart Action Queue</p>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      AI automatically prioritizes your daily actions: "Follow up with Sarah (momentum rising)" or "Call John today (proposal sent 3 days ago, no response)." 
                      Eliminates decision fatigue—just work the queue.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#E64B8B] text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-1">Engagement Momentum Tracking</p>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      Visual velocity indicators show if deals are accelerating (🔥 Hot streak!), maintaining pace (→ Steady), or stalling (⚠️ Cooling down). 
                      Catch momentum shifts before deals go dark.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#E64B8B] text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-1">Predictive Revenue Forecasting</p>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      AI calculates weighted pipeline value with confidence intervals. See likely revenue in 30/60/90 days, 
                      plus "at-risk" deals that need intervention to hit targets.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#E64B8B] text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-1">Pattern Intelligence Recommendations</p>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      "SaaS companies in California close 2x faster when contacted on Tuesday mornings"—AI surfaces these patterns so you can replicate what works.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Complete Flow Summary */}
      <div className="bg-gradient-to-r from-[#E64B8B]/10 to-purple-100 border-2 border-[#E64B8B]/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#E64B8B] rounded-lg flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">End-to-End AI-Powered Sales Journey</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#E64B8B]">1.</span>
                <p><strong>Define ICP</strong> → AI translates your ideal customer criteria into intelligent search parameters</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#E64B8B]">2.</span>
                <p><strong>Smart Discovery</strong> → AI scans 275M+ contacts, surfaces best matches with basic info (preview before commitment)</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#E64B8B]">3.</span>
                <p><strong>Strategic Selection</strong> → You evaluate discovered leads, choose which to enrich based on fit and priority</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#E64B8B]">4.</span>
                <p><strong>Intelligent Enrichment</strong> → Full contact data + AI scoring (opportunity score, momentum tracking, pattern insights)</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#E64B8B]">5.</span>
                <p><strong>Predictive Pipeline</strong> → AI monitors engagement, predicts close probability, surfaces next-best actions daily</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#E64B8B]">6.</span>
                <p><strong>Continuous Learning</strong> → AI analyzes wins/losses, refines predictions, surfaces patterns to optimize future outreach</p>
              </div>
            </div>

            <div className="mt-4 bg-white/70 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-900 mb-2">🚀 The AI Advantage</p>
              <p className="text-xs text-gray-700 leading-relaxed">
                Traditional prospecting is manual list-building + guesswork. Our AI layer automates the heavy lifting 
                (matching, scoring, prioritizing) while providing <strong>transparent intelligence</strong> at every decision point. 
                You stay in control, but with Fortune 500-grade insights powering every move.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
