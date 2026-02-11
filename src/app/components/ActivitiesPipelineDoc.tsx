import React from "react";
import { Phone, Mail, Calendar, FileText, Bell, Clock, Target, Brain, TrendingUp, Zap, CheckCircle2, Activity, Sparkles, BarChart3, AlertCircle } from "lucide-react";

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

export function ActivitiesPipelineDocumentation() {
  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-[#E64B8B] rounded-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">AI-Enhanced Activity & Pipeline Intelligence</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              Transform every sales touchpoint into strategic intelligence. Our <strong>AI-powered activity system</strong> doesn't just log what happened—
              it analyzes engagement patterns, predicts optimal follow-up timing, surfaces relationship health signals, and automatically prioritizes 
              your next actions based on deal momentum and close probability.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-900">Activity Intelligence</h3>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              Log calls, emails, meetings, and notes with AI analyzing sentiment, engagement signals, and optimal next steps. 
              Complete interaction history creates context for every conversation.
            </p>
          </div>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-gray-900">Pipeline Orchestration</h3>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              AI monitors stage progression velocity, flags stalled deals, predicts close dates, and surfaces the highest-value 
              opportunities requiring immediate attention across your entire pipeline.
            </p>
          </div>
        </div>
      </div>

      {/* Activity Logging System */}
      <Section
        title="Comprehensive Activity Logging"
        icon={<FileText className="w-5 h-5 text-white" />}
        color="border-l-4 border-l-blue-500"
        defaultOpen={true}
      >
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">📝 What Is Activity Logging?</p>
            <p className="text-xs text-blue-800 leading-relaxed">
              Every interaction with a prospect—calls, emails, meetings, notes—becomes part of a <strong>living relationship timeline</strong>. 
              AI analyzes this history to understand engagement patterns, detect sentiment shifts, calculate relationship strength, 
              and predict the optimal timing and messaging for your next touchpoint. This isn't just record-keeping; it's predictive relationship intelligence.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">4 Activity Types + AI Analysis</h3>
            
            <div className="space-y-4">
              {/* Calls */}
              <div className="bg-white border-2 border-green-300 rounded-lg overflow-hidden">
                <div className="bg-green-50 px-4 py-3 border-b border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Calls</p>
                      <p className="text-xs text-gray-600">Voice conversations - highest engagement signal</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">What You Log:</p>
                      <ul className="space-y-1 text-gray-700 ml-4 list-disc">
                        <li><strong>Duration:</strong> Call length (AI correlates longer calls with higher close rates)</li>
                        <li><strong>Outcome:</strong> Connected, Voicemail, No Answer, Busy</li>
                        <li><strong>Notes:</strong> Key discussion points, objections, next steps agreed upon</li>
                        <li><strong>Sentiment:</strong> Positive, Neutral, or Negative tone</li>
                      </ul>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <p className="font-semibold text-green-900 mb-1">🤖 AI Analysis:</p>
                      <ul className="space-y-1 text-green-800">
                        <li>• <strong>Engagement Score Boost:</strong> Connected calls increase momentum significantly</li>
                        <li>• <strong>Pattern Detection:</strong> "This prospect responds best on Tue/Thu mornings"</li>
                        <li>• <strong>Follow-up Timing:</strong> Suggests optimal callback window based on previous interactions</li>
                        <li>• <strong>Velocity Analysis:</strong> Multiple calls in short timeframe = deal acceleration signal</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emails */}
              <div className="bg-white border-2 border-blue-300 rounded-lg overflow-hidden">
                <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Emails</p>
                      <p className="text-xs text-gray-600">Written correspondence - trackable engagement</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">What You Log:</p>
                      <ul className="space-y-1 text-gray-700 ml-4 list-disc">
                        <li><strong>Subject:</strong> Email topic for quick reference</li>
                        <li><strong>Direction:</strong> Sent or Received (track response rates)</li>
                        <li><strong>Content Summary:</strong> Key points discussed, resources shared</li>
                        <li><strong>Engagement Signals:</strong> Opened, clicked links, forwarded to colleagues</li>
                      </ul>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="font-semibold text-blue-900 mb-1">🤖 AI Analysis:</p>
                      <ul className="space-y-1 text-blue-800">
                        <li>• <strong>Response Rate Tracking:</strong> Calculates reply speed (fast = high interest)</li>
                        <li>• <strong>Engagement Signals:</strong> Email opens + link clicks = warming up</li>
                        <li>• <strong>Sentiment Analysis:</strong> Detects enthusiastic vs. hesitant language in replies</li>
                        <li>• <strong>Optimal Timing:</strong> "Your emails to this industry get 3x more opens on Wednesdays"</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meetings */}
              <div className="bg-white border-2 border-purple-300 rounded-lg overflow-hidden">
                <div className="bg-purple-50 px-4 py-3 border-b border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Meetings</p>
                      <p className="text-xs text-gray-600">Scheduled conversations - high-intent interactions</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">What You Log:</p>
                      <ul className="space-y-1 text-gray-700 ml-4 list-disc">
                        <li><strong>Meeting Type:</strong> Discovery, Demo, Negotiation, Decision-maker briefing</li>
                        <li><strong>Attendees:</strong> Who participated (stakeholder mapping)</li>
                        <li><strong>Duration:</strong> Meeting length (longer = deeper engagement)</li>
                        <li><strong>Outcome:</strong> Next steps, action items, decisions made</li>
                        <li><strong>Status:</strong> Scheduled, Completed, Canceled, Rescheduled</li>
                      </ul>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded p-3">
                      <p className="font-semibold text-purple-900 mb-1">🤖 AI Analysis:</p>
                      <ul className="space-y-1 text-purple-800">
                        <li>• <strong>Deal Acceleration:</strong> Meetings = strongest forward momentum signal</li>
                        <li>• <strong>Stakeholder Mapping:</strong> Multiple attendees = buying committee engagement</li>
                        <li>• <strong>Meeting Velocity:</strong> "Deals with 3+ meetings in 14 days close at 2.5x rate"</li>
                        <li>• <strong>Cancellation Alerts:</strong> Rescheduled meetings flag potential cooling interest</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white border-2 border-orange-300 rounded-lg overflow-hidden">
                <div className="bg-orange-50 px-4 py-3 border-b border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Notes</p>
                      <p className="text-xs text-gray-600">General observations - contextual intelligence</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">What You Log:</p>
                      <ul className="space-y-1 text-gray-700 ml-4 list-disc">
                        <li><strong>Free-form Context:</strong> Any relevant information (budget discussed, pain points, competitors mentioned)</li>
                        <li><strong>Research Findings:</strong> LinkedIn insights, company news, funding announcements</li>
                        <li><strong>Internal Strategy:</strong> Approach adjustments, pricing considerations, team alignment</li>
                        <li><strong>Personal Details:</strong> Relationship-building intel (interests, communication preferences)</li>
                      </ul>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded p-3">
                      <p className="font-semibold text-orange-900 mb-1">🤖 AI Analysis:</p>
                      <ul className="space-y-1 text-orange-800">
                        <li>• <strong>Keyword Detection:</strong> Flags mentions of budget, timeline, competitors, objections</li>
                        <li>• <strong>Sentiment Tracking:</strong> Detects concern phrases vs. enthusiasm indicators</li>
                        <li>• <strong>Pattern Recognition:</strong> "You mention 'budget' in 80% of notes—consider earlier pricing discussion"</li>
                        <li>• <strong>Context Carryover:</strong> Summarizes relationship context before next interaction</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">Timeline View: Complete Relationship History</h3>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-[#E64B8B] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Chronological Activity Stream</p>
                    <p className="text-gray-700">Every interaction appears in reverse chronological order—newest first. Quickly scan the last 5 touchpoints to understand where the conversation left off.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#E64B8B] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Edit & Delete Capability</p>
                    <p className="text-gray-700">Correct mistakes, update outcomes, or remove duplicate entries. Clean data = better AI predictions.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Brain className="w-4 h-4 text-[#E64B8B] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">AI Context Summary</p>
                    <p className="text-gray-700">Before your next call, AI generates a 3-sentence summary: "Last contact: 5 days ago. Discussed pricing—positive response. Follow-up on implementation timeline agreed."</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Follow-up Reminder System */}
      <Section
        title="Intelligent Follow-up Reminder System"
        icon={<Bell className="w-5 h-5 text-white" />}
        color="border-l-4 border-l-orange-500"
        defaultOpen={true}
      >
        <div className="space-y-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-orange-900 mb-2">⏰ What Are Intelligent Follow-ups?</p>
            <p className="text-xs text-orange-800 leading-relaxed">
              The #1 reason deals die: <strong>forgotten follow-ups</strong>. Our AI doesn't just remind you—
              it <strong>predicts optimal timing</strong> based on prospect engagement patterns, suggests the best communication channel, 
              and even drafts contextual message templates. Never let a hot lead go cold due to delayed outreach.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">How AI Optimizes Follow-up Timing</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm mb-1">Context-Aware Scheduling</p>
                  <p className="text-xs text-gray-700 leading-relaxed mb-2">
                    When logging any activity, you can set a follow-up date/time. AI suggests optimal windows: 
                    "After sending proposal → Follow up in 48 hours" or "Post-meeting → Check in within 24 hours while top-of-mind."
                  </p>
                  <div className="bg-white border border-gray-200 rounded p-2">
                    <p className="text-xs text-gray-600">
                      <strong>Example:</strong> Log "Sent pricing proposal" → AI suggests "Follow up on Friday 10am" 
                      (analysis shows prospects in this industry review proposals mid-week, respond by Friday).
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm mb-1">Dynamic Prioritization</p>
                  <p className="text-xs text-gray-700 leading-relaxed mb-2">
                    Not all follow-ups are equal. AI prioritizes based on:
                  </p>
                  <ul className="space-y-1 text-xs text-gray-700 ml-4 list-disc">
                    <li><strong>Deal Value:</strong> High-opportunity-score leads surface first</li>
                    <li><strong>Momentum:</strong> "Hot" prospects get same-day priority</li>
                    <li><strong>Pipeline Stage:</strong> "Proposal Sent" = more urgent than "Contacted"</li>
                    <li><strong>Overdue Status:</strong> Missed follow-ups flagged in red</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm mb-1">Multi-Surface Visibility</p>
                  <p className="text-xs text-gray-700 leading-relaxed mb-2">
                    Follow-ups appear everywhere so nothing slips through the cracks:
                  </p>
                  <div className="bg-white border border-gray-200 rounded p-2 space-y-1 text-xs text-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="text-[#E64B8B] font-bold">→</span>
                      <p><strong>Dashboard Urgent Actions Panel:</strong> "3 follow-ups due today"</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#E64B8B] font-bold">→</span>
                      <p><strong>Leads Table Follow-up Column:</strong> Shows due dates, overdue in red</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#E64B8B] font-bold">→</span>
                      <p><strong>Smart Action Queue:</strong> Auto-surfaces today's priorities</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#E64B8B] font-bold">→</span>
                      <p><strong>Lead Detail Page:</strong> Upcoming follow-up prominently displayed</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm mb-1">AI-Drafted Context</p>
                  <p className="text-xs text-gray-700 leading-relaxed mb-2">
                    When a follow-up is due, AI prepares a context brief:
                  </p>
                  <div className="bg-purple-50 border border-purple-200 rounded p-3">
                    <p className="text-xs text-purple-900 font-semibold mb-1">Example AI Brief:</p>
                    <p className="text-xs text-purple-800 italic">
                      "Sarah Martinez - Acme Corp<br/>
                      Last Contact: 3 days ago (proposal sent via email)<br/>
                      Opportunity Score: 78/100<br/>
                      Suggested Action: Call to discuss questions on implementation timeline<br/>
                      Talking Points: She mentioned budget approval needed by month-end—position urgency."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">Follow-up Strategy Best Practices</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-xs font-bold text-green-900 mb-3">✅ DO: Follow These Rules</p>
                <ul className="space-y-1.5 text-xs text-green-800">
                  <li>• <strong>Always set a next step</strong> after every activity</li>
                  <li>• <strong>Trust AI timing suggestions</strong>—they're data-driven</li>
                  <li>• <strong>Follow up within 24 hours</strong> after meetings</li>
                  <li>• <strong>Use different channels</strong> (email → call → LinkedIn)</li>
                  <li>• <strong>Check Dashboard daily</strong> for urgent actions</li>
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-xs font-bold text-red-900 mb-3">❌ DON'T: Avoid These Mistakes</p>
                <ul className="space-y-1.5 text-xs text-red-800">
                  <li>• <strong>Don't log without follow-up</strong>—every activity needs next step</li>
                  <li>• <strong>Don't ignore overdue flags</strong>—momentum dies fast</li>
                  <li>• <strong>Don't follow up too soon</strong>—respect the AI cadence</li>
                  <li>• <strong>Don't use same message</strong> for every follow-up (personalize!)</li>
                  <li>• <strong>Don't let hot leads wait</strong>—prioritize high-score prospects</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Pipeline Orchestration */}
      <Section
        title="AI Pipeline Orchestration & Velocity Tracking"
        icon={<Activity className="w-5 h-5 text-white" />}
        color="border-l-4 border-l-purple-500"
        defaultOpen={true}
      >
        <div className="space-y-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-purple-900 mb-2">🎯 What Is Pipeline Orchestration?</p>
            <p className="text-xs text-purple-800 leading-relaxed">
              Pipeline orchestration means AI doesn't just track where deals are—it <strong>actively manages deal flow</strong>, 
              identifies bottlenecks, predicts which opportunities will close when, flags at-risk deals before they die, 
              and prescribes specific actions to accelerate velocity. Think of it as a revenue operations co-pilot analyzing your entire funnel 24/7.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">How AI Monitors Your Pipeline</h3>
            
            <div className="space-y-4">
              <div className="bg-white border-2 border-[#E64B8B]/30 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-[#E64B8B] flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Stage Velocity Analysis</p>
                    <p className="text-xs text-gray-700 leading-relaxed mt-1 mb-3">
                      AI tracks how long deals spend in each pipeline stage and compares against historical benchmarks. 
                      Deals moving too slowly trigger alerts; fast-moving deals get prioritized.
                    </p>
                    <div className="bg-gray-50 border border-gray-200 rounded p-3">
                      <p className="text-xs text-gray-900 mb-2"><strong>Example Insights:</strong></p>
                      <ul className="space-y-1 text-xs text-gray-700">
                        <li>• "This deal has been 'Contacted' for 12 days—avg is 5. Send follow-up today."</li>
                        <li>• "Sarah moved from Qualified → Proposal in 3 days (2x faster than avg). High intent!"</li>
                        <li>• "Deals in 'Proposal Sent' for 7+ days have 60% loss rate. Reach out now."</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-2">
                  <BarChart3 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Conversion Rate Tracking</p>
                    <p className="text-xs text-gray-700 leading-relaxed mt-1 mb-3">
                      AI calculates stage-to-stage conversion rates across your entire pipeline, highlighting where deals are getting stuck.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-xs text-blue-900 mb-2"><strong>Pipeline Health Dashboard:</strong></p>
                      <div className="space-y-1 text-xs text-blue-800">
                        <p>• New → Contacted: <strong>85%</strong> (healthy)</p>
                        <p>• Contacted → Qualified: <strong>45%</strong> (avg: 52%, needs improvement)</p>
                        <p>• Qualified → Proposal: <strong>72%</strong> (excellent)</p>
                        <p>• Proposal → Won: <strong>38%</strong> (avg: 35%, performing well)</p>
                      </div>
                      <p className="text-xs text-blue-900 mt-2 italic">
                        <strong>AI Recommendation:</strong> "Focus on improving Contacted→Qualified conversion. 
                        Try adding discovery call script template."
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-red-300 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900 text-sm">At-Risk Deal Detection</p>
                    <p className="text-xs text-gray-700 leading-relaxed mt-1 mb-3">
                      AI identifies deals showing "cooling" signals—declining engagement, missed meetings, slowing response times—
                      before they officially die. Early intervention saves deals.
                    </p>
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <p className="text-xs text-red-900 mb-2"><strong>Warning Signals AI Monitors:</strong></p>
                      <ul className="space-y-1 text-xs text-red-800">
                        <li>⚠️ No activity in 7+ days (engagement gap)</li>
                        <li>⚠️ Email open rate dropped from 80% to 20%</li>
                        <li>⚠️ Meeting rescheduled twice (priority shift?)</li>
                        <li>⚠️ Stopped responding to calls/emails (ghosting pattern)</li>
                        <li>⚠️ Multiple stakeholders but no champion identified</li>
                      </ul>
                      <p className="text-xs text-red-900 mt-2 italic">
                        <strong>AI Action:</strong> Surfaces in "Urgent Actions" with suggested recovery tactics.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-green-300 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-2">
                  <Sparkles className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900 text-sm">High-Velocity Opportunity Identification</p>
                    <p className="text-xs text-gray-700 leading-relaxed mt-1 mb-3">
                      On the flip side, AI detects deals showing acceleration signals—rapid stage progression, 
                      high engagement, multiple stakeholder involvement—and flags them for immediate focus.
                    </p>
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <p className="text-xs text-green-900 mb-2"><strong>Acceleration Signals:</strong></p>
                      <ul className="space-y-1 text-xs text-green-800">
                        <li>🔥 Moved through 2+ stages in 7 days</li>
                        <li>🔥 Multiple meetings scheduled proactively by prospect</li>
                        <li>🔥 High email engagement (100% open rate, link clicks)</li>
                        <li>🔥 Decision-makers actively involved in conversations</li>
                        <li>🔥 Requesting pricing, contracts, implementation details</li>
                      </ul>
                      <p className="text-xs text-green-900 mt-2 italic">
                        <strong>AI Action:</strong> "Strike while hot—this deal could close this week. Prioritize immediately."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">Pipeline-Wide AI Features</h3>
            
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-2">Smart Action Queue (Daily Prioritization)</p>
                    <p className="text-xs text-gray-700 leading-relaxed mb-3">
                      Every morning, AI generates your personalized action list ranked by urgency and impact. 
                      No more guessing "who should I call first?"—just work the queue top to bottom.
                    </p>
                    <div className="bg-white/70 rounded p-3">
                      <p className="text-xs text-gray-900 font-semibold mb-2">Today's Smart Actions (Example):</p>
                      <div className="space-y-2 text-xs text-gray-700">
                        <div className="flex items-start gap-2">
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold">HIGH</span>
                          <p><strong>Call John Smith</strong> - Proposal sent 3 days ago, no response. Deal value: $50K</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold">HIGH</span>
                          <p><strong>Follow up Sarah Lee</strong> - Hot lead, meeting yesterday, said "send contract"</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-bold">MED</span>
                          <p><strong>Email Mike Chen</strong> - Requested case study last week, sent but no follow-up</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-2">Predictive Revenue Forecasting</p>
                    <p className="text-xs text-gray-700 leading-relaxed mb-3">
                      AI calculates weighted pipeline value based on stage, engagement momentum, and historical close rates. 
                      See likely revenue in 30/60/90 days with confidence intervals.
                    </p>
                    <div className="bg-white/70 rounded p-3">
                      <p className="text-xs text-gray-900 font-semibold mb-2">Revenue Projection:</p>
                      <div className="space-y-1 text-xs text-gray-700">
                        <p>• <strong>Next 30 Days:</strong> $120K - $180K (likely: $150K) - 75% confidence</p>
                        <p>• <strong>Next 60 Days:</strong> $280K - $420K (likely: $350K) - 65% confidence</p>
                        <p>• <strong>Next 90 Days:</strong> $450K - $680K (likely: $565K) - 55% confidence</p>
                      </div>
                      <p className="text-xs text-gray-700 mt-2 italic">
                        AI factors in: stage conversion rates, deal velocity, engagement momentum, seasonal patterns.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-2">Pattern Intelligence Recommendations</p>
                    <p className="text-xs text-gray-700 leading-relaxed mb-3">
                      AI analyzes all pipeline data to surface winning patterns you can replicate and losing patterns to avoid.
                    </p>
                    <div className="bg-white/70 rounded p-3">
                      <p className="text-xs text-gray-900 font-semibold mb-2">Detected Patterns:</p>
                      <ul className="space-y-1 text-xs text-gray-700">
                        <li>✅ <strong>Winning:</strong> "Deals with 3+ logged calls close at 2.5x rate vs. email-only"</li>
                        <li>✅ <strong>Winning:</strong> "SaaS prospects responding within 2 hours have 85% qualification rate"</li>
                        <li>⚠️ <strong>Losing:</strong> "Deals in 'Contacted' for 10+ days have 75% loss rate—follow up faster"</li>
                        <li>⚠️ <strong>Losing:</strong> "No activities logged in 14 days = 90% probability of going dark"</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Complete Integration */}
      <div className="bg-gradient-to-r from-[#E64B8B]/10 to-purple-100 border-2 border-[#E64B8B]/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#E64B8B] rounded-lg flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Why Activities + Pipeline = Unstoppable Sales Intelligence</h3>
            
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#E64B8B]">→</span>
                <p>
                  <strong>Complete Context:</strong> Every logged activity feeds AI analysis. More data = better predictions. 
                  Your activity history becomes your competitive advantage.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#E64B8B]">→</span>
                <p>
                  <strong>Proactive Guidance:</strong> AI doesn't wait for you to ask "what should I do?"—it automatically 
                  surfaces the next-best action, the optimal timing, and the reasoning behind recommendations.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#E64B8B]">→</span>
                <p>
                  <strong>Never Miss a Beat:</strong> Follow-up reminders, at-risk alerts, high-velocity flags—AI ensures 
                  no opportunity falls through the cracks due to forgetting or mistiming.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#E64B8B]">→</span>
                <p>
                  <strong>Continuous Learning:</strong> Every won/lost deal teaches AI what works. Patterns detected across 
                  hundreds of interactions become your personalized playbook.
                </p>
              </div>
            </div>

            <div className="mt-4 bg-white/70 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-900 mb-2">🚀 The Compound Effect</p>
              <p className="text-xs text-gray-700 leading-relaxed">
                Traditional CRMs are data graveyards—you enter information and nothing happens. Our AI-powered system is a 
                <strong> living intelligence layer</strong> that transforms every logged interaction into strategic insights, 
                predictive guidance, and automated prioritization. The more you use it, the smarter it gets, and the more 
                revenue it helps you close. This is sales prospecting evolved for the AI era.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
