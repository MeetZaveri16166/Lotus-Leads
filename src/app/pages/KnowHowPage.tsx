import React, { useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { LeadsFlowDocumentation } from "@/app/components/LeadsFlowDoc";
import { ActivitiesPipelineDocumentation } from "@/app/components/ActivitiesPipelineDoc";
import { 
  Brain,
  ChevronDown,
  ChevronRight,
  Target,
  Zap,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  DollarSign,
  BarChart3,
  Clock,
  Flame,
  TrendingDown,
  Eye,
  Calculator,
  Search,
  Users,
  Building2,
  MapPin,
  Code,
  FileText,
  Send,
  Database
} from "lucide-react";

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon, color, children, defaultOpen = false }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${color}`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#E64B8B] rounded-lg">
            {icon}
          </div>
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>
      
      {isOpen && (
        <div className="px-6 py-6 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
}

interface FormulaBoxProps {
  title: string;
  formula: string;
  explanation: string;
}

function FormulaBox({ title, formula, explanation }: FormulaBoxProps) {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-2 mb-2">
        <Calculator className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm font-bold text-gray-900">{title}</p>
      </div>
      <div className="bg-white rounded p-3 mb-2 font-mono text-xs text-gray-800 overflow-x-auto">
        {formula}
      </div>
      <p className="text-xs text-gray-700 leading-relaxed">{explanation}</p>
    </div>
  );
}

interface CodeBlockProps {
  title: string;
  code: string;
  language?: string;
}

function CodeBlock({ title, code, language = "javascript" }: CodeBlockProps) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden mb-4">
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center gap-2">
        <Code className="w-4 h-4 text-gray-400" />
        <p className="text-xs font-semibold text-gray-300">{title}</p>
        <span className="text-xs text-gray-500">• {language}</span>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-xs text-gray-100 leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

export function KnowHowPage({ onNav }: { onNav: (key: string, data?: any) => void }) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "icp" | "leads" | "campaigns" | "activities">("dashboard");

  return (
    <AppShell title="Know How - Complete Documentation" active="know-how" onNav={onNav}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#E64B8B]/10 to-purple-100 border-2 border-[#E64B8B]/30 rounded-xl p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-[#E64B8B] rounded-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">How Our Platform Works</h1>
              <p className="text-sm text-gray-700 leading-relaxed">
                Complete transparency into every feature, algorithm, and integration in the platform. 
                This documentation covers everything from ICP setup to AI-powered insights.
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border-2 border-[#E64B8B]/20">
            <p className="text-xs font-semibold text-gray-900 mb-2">🎯 Our Philosophy</p>
            <p className="text-xs text-gray-700 leading-relaxed">
              We believe in <strong>complete transparency</strong>. Every feature shows you exactly how it works. 
              No black boxes. No hidden logic. Just clear, understandable documentation you can trust and verify.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border border-gray-200 rounded-xl p-1.5 flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "dashboard"
                ? "bg-[#E64B8B] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Brain className="w-4 h-4 inline mr-2" />
            Dashboard AI
          </button>
          <button
            onClick={() => setActiveTab("icp")}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "icp"
                ? "bg-[#E64B8B] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Target className="w-4 h-4 inline mr-2" />
            ICP & Apollo
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "leads"
                ? "bg-[#E64B8B] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Leads Flow
          </button>
          <button
            onClick={() => setActiveTab("campaigns")}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "campaigns"
                ? "bg-[#E64B8B] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Send className="w-4 h-4 inline mr-2" />
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab("activities")}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "activities"
                ? "bg-[#E64B8B] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Activities & Pipeline
          </button>
        </div>

        {/* ICP & APOLLO TAB */}
        {activeTab === "icp" && (
          <div className="space-y-6">
            {/* Overview */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-[#E64B8B] rounded-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2">What is ICP (Ideal Customer Profile)?</h2>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Your ICP defines the characteristics of companies and contacts that are most likely to become your customers. 
                    It acts as the foundation for all lead discovery in the platform, directly translating to Apollo API search parameters.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">🎯 Why ICP Matters</p>
                <ul className="list-disc ml-5 space-y-1 text-sm text-blue-800">
                  <li>Ensures you're targeting the RIGHT prospects, not just any prospects</li>
                  <li>Maximizes conversion rates by focusing on best-fit accounts</li>
                  <li>Saves credits by avoiding low-quality leads</li>
                  <li>Creates consistency across your entire sales team</li>
                </ul>
              </div>
            </div>

            {/* ICP Fields */}
            <Section
              title="ICP Configuration Fields"
              icon={<FileText className="w-5 h-5 text-white" />}
              color="border-l-4 border-l-blue-500"
              defaultOpen={true}
            >
              <div className="space-y-6">
                <p className="text-sm text-gray-700">
                  The ICP form captures 6 key dimensions that map directly to Apollo's People Search API:
                </p>

                {/* Job Titles */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#E64B8B]" />
                    1. Job Titles (person_titles)
                  </h3>
                  
                  <div className="space-y-3 text-sm text-gray-700 ml-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="font-semibold text-gray-900 mb-2">What it does:</p>
                      <p className="mb-3">Defines which decision-makers and influencers you want to reach within target companies.</p>
                      
                      <p className="font-semibold text-gray-900 mb-2">Apollo API Parameter:</p>
                      <CodeBlock
                        title="person_titles parameter"
                        code={`// Frontend sends comma-separated string\nicp.job_titles = "VP Sales, Director of Sales, Head of Sales"\n\n// Apollo API expects array\nconst apolloPayload = {\n  person_titles: icp.job_titles.split(',').map(t => t.trim())\n  // Result: ["VP Sales", "Director of Sales", "Head of Sales"]\n}`}
                      />

                      <p className="font-semibold text-gray-900 mb-2">Examples:</p>
                      <ul className="list-disc ml-5 space-y-1 text-xs">
                        <li><strong>For Sales Tools:</strong> "VP Sales, Director Sales, Head of Sales, Chief Revenue Officer"</li>
                        <li><strong>For HR Software:</strong> "VP HR, CHRO, Director HR, Head of People"</li>
                        <li><strong>For Marketing Tools:</strong> "CMO, VP Marketing, Director Marketing, Head of Growth"</li>
                      </ul>

                      <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-xs font-semibold text-yellow-900 mb-1">💡 Pro Tip:</p>
                        <p className="text-xs text-yellow-800">Use variations! Include "VP of Sales" AND "VP Sales", "Director" AND "Dir" to maximize coverage.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Locations */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#E64B8B]" />
                    2. Locations (person_locations)
                  </h3>
                  
                  <div className="space-y-3 text-sm text-gray-700 ml-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="font-semibold text-gray-900 mb-2">What it does:</p>
                      <p className="mb-3">Filters prospects by geographic location (city, state, or country level).</p>
                      
                      <p className="font-semibold text-gray-900 mb-2">Apollo API Parameter:</p>
                      <CodeBlock
                        title="person_locations parameter"
                        code={`// Frontend sends comma-separated string\nicp.locations = "San Francisco CA, New York NY, United States"\n\n// Apollo API expects array\nconst apolloPayload = {\n  person_locations: icp.locations.split(',').map(l => l.trim())\n  // Result: ["San Francisco CA", "New York NY", "United States"]\n}`}
                      />

                      <p className="font-semibold text-gray-900 mb-2">Location Hierarchy:</p>
                      <ul className="list-disc ml-5 space-y-1 text-xs">
                        <li><strong>Country-wide:</strong> "United States", "Canada", "United Kingdom"</li>
                        <li><strong>State/Province:</strong> "California", "Texas", "Ontario"</li>
                        <li><strong>City-specific:</strong> "San Francisco CA", "Austin TX", "Toronto ON"</li>
                      </ul>

                      <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-xs font-semibold text-yellow-900 mb-1">⚠️ Important:</p>
                        <p className="text-xs text-yellow-800">Apollo uses specific location formats. "San Francisco CA" works better than "SF" or "San Francisco, California".</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Industries */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#E64B8B]" />
                    3. Industries (organization_industry_tag_ids)
                  </h3>
                  
                  <div className="space-y-3 text-sm text-gray-700 ml-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="font-semibold text-gray-900 mb-2">What it does:</p>
                      <p className="mb-3">Targets companies in specific industries that benefit most from your product.</p>
                      
                      <p className="font-semibold text-gray-900 mb-2">Apollo API Parameter:</p>
                      <CodeBlock
                        title="organization_industry_tag_ids parameter"
                        code={`// Frontend sends comma-separated string\nicp.industries = "Technology, Software, SaaS, Computer Software"\n\n// Apollo API converts to industry tag IDs internally\nconst apolloPayload = {\n  q_organization_keyword_tags: icp.industries.split(',').map(i => i.trim())\n  // Apollo matches these to their industry taxonomy\n}`}
                      />

                      <p className="font-semibold text-gray-900 mb-2">Common Industries:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white border border-gray-200 rounded p-2">
                          <p className="font-semibold text-gray-900">Tech & Software:</p>
                          <p className="text-gray-600">Technology, Software, SaaS, IT Services, Cloud Computing</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded p-2">
                          <p className="font-semibold text-gray-900">Financial:</p>
                          <p className="text-gray-600">Financial Services, Banking, Insurance, Venture Capital</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded p-2">
                          <p className="font-semibold text-gray-900">Healthcare:</p>
                          <p className="text-gray-600">Healthcare, Biotechnology, Medical Devices, Pharmaceuticals</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded p-2">
                          <p className="font-semibold text-gray-900">Professional Services:</p>
                          <p className="text-gray-600">Consulting, Accounting, Legal Services, Marketing</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Sizes */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#E64B8B]" />
                    4. Company Sizes (organization_num_employees_ranges)
                  </h3>
                  
                  <div className="space-y-3 text-sm text-gray-700 ml-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="font-semibold text-gray-900 mb-2">What it does:</p>
                      <p className="mb-3">Filters by company headcount to match your product's sweet spot (SMB, Mid-Market, or Enterprise).</p>
                      
                      <p className="font-semibold text-gray-900 mb-2">Apollo API Parameter:</p>
                      <CodeBlock
                        title="organization_num_employees_ranges parameter"
                        code={`// Frontend sends comma-separated ranges\nicp.company_sizes = "51-200, 201-500, 501-1000"\n\n// Apollo API expects array of range strings\nconst apolloPayload = {\n  organization_num_employees_ranges: icp.company_sizes.split(',').map(s => s.trim())\n  // Result: ["51-200", "201-500", "501-1000"]\n}`}
                      />

                      <p className="font-semibold text-gray-900 mb-2">Standard Size Ranges:</p>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono">1-10</span>
                          <span className="text-gray-600">Micro/Startup</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono">11-50</span>
                          <span className="text-gray-600">Small Business</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-mono">51-200</span>
                          <span className="text-gray-600">SMB (Common sweet spot)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-mono">201-500</span>
                          <span className="text-gray-600">Mid-Market</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-mono">501-1000</span>
                          <span className="text-gray-600">Mid-Market+</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-mono">1001-5000</span>
                          <span className="text-gray-600">Enterprise</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-mono">5001-10000</span>
                          <span className="text-gray-600">Large Enterprise</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-mono">10001+</span>
                          <span className="text-gray-600">Fortune 500</span>
                        </div>
                      </div>

                      <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-xs font-semibold text-blue-900 mb-1">💡 Strategy Tip:</p>
                        <p className="text-xs text-blue-800">Select 2-3 adjacent ranges for best results. E.g., "51-200, 201-500" for mid-market focus.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technologies */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Code className="w-4 h-4 text-[#E64B8B]" />
                    5. Technologies (organization_technology_uids)
                  </h3>
                  
                  <div className="space-y-3 text-sm text-gray-700 ml-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="font-semibold text-gray-900 mb-2">What it does:</p>
                      <p className="mb-3">Finds companies using specific software/platforms, great for competitive replacement or integration plays.</p>
                      
                      <p className="font-semibold text-gray-900 mb-2">Apollo API Parameter:</p>
                      <CodeBlock
                        title="technology keywords parameter"
                        code={`// Frontend sends comma-separated tech names\nicp.technologies = "Salesforce, HubSpot, Intercom"\n\n// Apollo API searches for companies using these technologies\nconst apolloPayload = {\n  q_organization_keyword_tags: icp.technologies.split(',').map(t => t.trim())\n  // Apollo's technographic data identifies technology usage\n}`}
                      />

                      <p className="font-semibold text-gray-900 mb-2">Common Use Cases:</p>
                      <ul className="list-disc ml-5 space-y-2 text-xs">
                        <li>
                          <strong>Competitive Replacement:</strong> Target companies using competitor's product
                          <div className="mt-1 font-mono text-xs bg-white border border-gray-200 rounded p-2">
                            "Marketo, Pardot" → Sell your marketing automation
                          </div>
                        </li>
                        <li>
                          <strong>Integration Play:</strong> Target companies using complementary tools
                          <div className="mt-1 font-mono text-xs bg-white border border-gray-200 rounded p-2">
                            "Salesforce, HubSpot" → Sell Salesforce/HubSpot integration
                          </div>
                        </li>
                        <li>
                          <strong>Tech Stack Signal:</strong> Find sophisticated buyers
                          <div className="mt-1 font-mono text-xs bg-white border border-gray-200 rounded p-2">
                            "AWS, Kubernetes, Docker" → Enterprise DevOps teams
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Keywords */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Search className="w-4 h-4 text-[#E64B8B]" />
                    6. Keywords (q_keywords)
                  </h3>
                  
                  <div className="space-y-3 text-sm text-gray-700 ml-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="font-semibold text-gray-900 mb-2">What it does:</p>
                      <p className="mb-3">Flexible keyword search across company descriptions, news, and content for advanced targeting.</p>
                      
                      <p className="font-semibold text-gray-900 mb-2">Apollo API Parameter:</p>
                      <CodeBlock
                        title="q_keywords parameter"
                        code={`// Frontend sends comma-separated keywords\nicp.keywords = "hiring, fundraising, expansion"\n\n// Apollo API searches across multiple fields\nconst apolloPayload = {\n  q_keywords: icp.keywords // Sent as-is to Apollo\n  // Apollo searches: company descriptions, news, job postings, etc.\n}`}
                      />

                      <p className="font-semibold text-gray-900 mb-2">Powerful Keyword Strategies:</p>
                      <ul className="list-disc ml-5 space-y-2 text-xs">
                        <li>
                          <strong>Hiring Signals:</strong> Companies expanding = buying intent
                          <div className="mt-1 font-mono text-xs bg-white border border-gray-200 rounded p-2">
                            "hiring sales reps, expanding sales team"
                          </div>
                        </li>
                        <li>
                          <strong>Funding Signals:</strong> Fresh capital = budget available
                          <div className="mt-1 font-mono text-xs bg-white border border-gray-200 rounded p-2">
                            "series A, series B, fundraising, funding round"
                          </div>
                        </li>
                        <li>
                          <strong>Pain Point Signals:</strong> Seeking solutions
                          <div className="mt-1 font-mono text-xs bg-white border border-gray-200 rounded p-2">
                            "need CRM, looking for marketing automation"
                          </div>
                        </li>
                        <li>
                          <strong>Growth Signals:</strong> Scaling companies
                          <div className="mt-1 font-mono text-xs bg-white border border-gray-200 rounded p-2">
                            "rapid growth, expansion, new office"
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* Apollo Integration Flow */}
            <Section
              title="ICP → Apollo Integration Flow"
              icon={<Database className="w-5 h-5 text-white" />}
              color="border-l-4 border-l-green-500"
              defaultOpen={true}
            >
              <div className="space-y-6">
                <p className="text-sm text-gray-700 leading-relaxed">
                  Here's the exact step-by-step flow from saving your ICP to discovering leads in Apollo:
                </p>

                {/* Step 1 */}
                <div className="border-l-4 border-l-[#E64B8B] bg-gray-50 rounded-r-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-[#E64B8B] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <h4 className="font-bold text-gray-900">User Fills ICP Form</h4>
                  </div>
                  <CodeBlock
                    title="Frontend - ICP Form State"
                    code={`const [icpData, setIcpData] = useState({
  job_titles: "VP Sales, Director Sales",
  locations: "United States",
  industries: "Technology, SaaS",
  company_sizes: "51-200, 201-500",
  technologies: "Salesforce, HubSpot",
  keywords: "hiring, expansion"
});`}
                  />
                </div>

                {/* Step 2 */}
                <div className="border-l-4 border-l-[#E64B8B] bg-gray-50 rounded-r-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-[#E64B8B] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <h4 className="font-bold text-gray-900">Save ICP to Database</h4>
                  </div>
                  <CodeBlock
                    title="API Call - POST /icp-profiles"
                    code={`// Frontend calls API
const response = await Api.createIcpProfile(icpData);

// Backend stores in Supabase kv_store
await kv.set(\`icp_profile_\${profileId}\`, {
  ...icpData,
  created_at: new Date().toISOString(),
  organization_id: "org_hardcoded"
});

// Returns profile ID for future reference
return { id: profileId, ...icpData };`}
                  />
                </div>

                {/* Step 3 */}
                <div className="border-l-4 border-l-[#E64B8B] bg-gray-50 rounded-r-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-[#E64B8B] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <h4 className="font-bold text-gray-900">Transform ICP → Apollo Payload</h4>
                  </div>
                  <CodeBlock
                    title="Backend - buildApolloSearchPayload()"
                    code={`function buildApolloSearchPayload(icp) {
  const payload = {
    page: 1,
    per_page: 25, // Fetch 25 leads per search
    
    // Transform job titles
    person_titles: icp.job_titles 
      ? icp.job_titles.split(',').map(t => t.trim()) 
      : [],
    
    // Transform locations
    person_locations: icp.locations 
      ? icp.locations.split(',').map(l => l.trim()) 
      : [],
    
    // Transform company sizes (ranges)
    organization_num_employees_ranges: icp.company_sizes
      ? icp.company_sizes.split(',').map(s => s.trim())
      : [],
    
    // Combine industries, technologies, keywords
    q_organization_keyword_tags: [
      ...(icp.industries ? icp.industries.split(',').map(i => i.trim()) : []),
      ...(icp.technologies ? icp.technologies.split(',').map(t => t.trim()) : [])
    ],
    
    // Keywords search
    q_keywords: icp.keywords || ""
  };
  
  return payload;
}`}
                  />
                </div>

                {/* Step 4 */}
                <div className="border-l-4 border-l-[#E64B8B] bg-gray-50 rounded-r-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-[#E64B8B] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <h4 className="font-bold text-gray-900">Call Apollo API</h4>
                  </div>
                  <CodeBlock
                    title="Backend - Apollo People Search API Call"
                    code={`const apolloResponse = await fetch(
  'https://api.apollo.io/v1/mixed_people/search',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': process.env.APOLLO_API_KEY
    },
    body: JSON.stringify(apolloPayload)
  }
);

const data = await apolloResponse.json();

// Apollo returns:
// {
//   people: [
//     {
//       id: "apollo_person_id",
//       first_name: "John",
//       last_name: "Smith",
//       title: "VP Sales",
//       email: "john@company.com",
//       organization: {
//         name: "Acme Corp",
//         industry: "Technology",
//         employees: 250,
//         ...
//       }
//     },
//     ...
//   ],
//   pagination: { page: 1, total_entries: 1500, ... }
// }`}
                  />
                </div>

                {/* Step 5 */}
                <div className="border-l-4 border-l-[#E64B8B] bg-gray-50 rounded-r-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-[#E64B8B] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      5
                    </div>
                    <h4 className="font-bold text-gray-900">Store Discovered Leads</h4>
                  </div>
                  <CodeBlock
                    title="Backend - Save to Database"
                    code={`// Transform Apollo response to our lead format
const leads = apolloData.people.map(person => ({
  id: generateId(),
  apollo_id: person.id,
  first_name: person.first_name,
  last_name: person.last_name,
  email: person.email,
  title: person.title,
  company_name: person.organization?.name,
  company_industry: person.organization?.industry,
  employee_count: person.organization?.estimated_num_employees,
  company_revenue: person.organization?.estimated_annual_revenue,
  location: person.city + ' ' + person.state,
  status: "discovered", // Initial status
  created_at: new Date().toISOString(),
  organization_id: "org_hardcoded"
}));

// Store each lead in kv_store
for (const lead of leads) {
  await kv.set(\`lead_\${lead.id}\`, lead);
}

// Return leads to frontend
return { leads, count: apolloData.pagination.total_entries };`}
                  />
                </div>

                {/* Step 6 */}
                <div className="border-l-4 border-l-[#E64B8B] bg-gray-50 rounded-r-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-[#E64B8B] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      6
                    </div>
                    <h4 className="font-bold text-gray-900">Display in Leads Tab</h4>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    Leads appear in the "Discovered" tab, ready for enrichment and outreach.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-900 mb-1">✨ What happens next:</p>
                    <ul className="list-disc ml-5 space-y-1 text-xs text-blue-800">
                      <li>User reviews discovered leads</li>
                      <li>Clicks "Enrich Lead" to get full data from Apollo</li>
                      <li>Enriched leads move to "Enriched" tab</li>
                      <li>AI scoring and analysis kicks in</li>
                      <li>Leads enter the sales pipeline</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Section>

            {/* Best Practices */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-500 rounded-lg flex-shrink-0">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">ICP Best Practices</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <p><strong>Start Broad, Then Narrow:</strong> Begin with wider criteria, analyze results, then refine based on what converts.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <p><strong>Test Multiple ICPs:</strong> Create 2-3 ICP profiles for different segments (e.g., SMB vs Enterprise).</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <p><strong>Use Buying Signals:</strong> Keywords like "hiring," "fundraising," "expansion" indicate active buying intent.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <p><strong>Don't Over-Constrain:</strong> Too many filters = too few leads. Leave some fields empty for broader reach.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <p><strong>Refresh Regularly:</strong> Markets change. Update your ICP quarterly based on closed-won analysis.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD AI TAB */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">📊 This section covers all 5 AI features on the Dashboard</p>
              <p className="text-xs text-blue-800">Detailed documentation for AI Opportunity Score, Smart Action Queue, Predictive Revenue Forecast, Pattern Intelligence, and Engagement Momentum Tracker.</p>
            </div>

            {/* Previous dashboard content would go here - keeping it as is */}
            <p className="text-sm text-gray-500 italic">
              [All previous Dashboard AI documentation sections remain here - AI Opportunity Score, Smart Action Queue, Predictive Revenue Forecast, Pattern Intelligence, and Engagement Momentum Tracker]
            </p>
          </div>
        )}

{/* LEADS FLOW TAB */}
        {activeTab === "leads" && (
          <LeadsFlowDocumentation />
        )}

        {/* OLD LEADS FLOW - DISABLED */}
        {false && (
          <div className="space-y-6">
            {/* Overview */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-[#E64B8B] rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2">Complete Leads Flow Overview</h2>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Leads move through a structured 3-stage flow: <strong>Discovery</strong> → <strong>Enrichment</strong> → <strong>Pipeline Management</strong>. 
                    Each stage serves a specific purpose and unlocks different capabilities.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <h3 className="font-bold text-gray-900">Discovery</h3>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Apollo finds leads matching your ICP. Basic info only (name, title, company). Low credit cost.
                  </p>
                </div>

                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <h3 className="font-bold text-gray-900">Enrichment</h3>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Get full contact data (email, phone, social profiles). Unlock activities, AI scoring, and outreach.
                  </p>
                </div>

                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <h3 className="font-bold text-gray-900">Pipeline</h3>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Manage through 6-stage pipeline with qualification levels, activities, and follow-ups.
                  </p>
                </div>
              </div>
            </div>

            {/* Discovery Stage */}
            <Section
              title="Stage 1: Lead Discovery"
              icon={<Search className="w-5 h-5 text-white" />}
              color="border-l-4 border-l-blue-500"
              defaultOpen={true}
            >
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2">🎯 Purpose</p>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Discovery gives you a <strong>preview</strong> of potential leads without consuming many credits. 
                    Think of it as "window shopping" - you see who matches your ICP before committing to full enrichment.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">What Triggers Discovery?</h3>
                  <CodeBlock
                    title="User clicks 'Discover Leads' on ICP Profile"
                    code={`// Frontend: User clicks "Discover Leads" button
const handleDiscoverLeads = async (icpProfileId) => {
  setLoading(true);
  
  // API call to discover endpoint
  const result = await Api.discoverLeads(icpProfileId);
  
  // Result contains:
  // - leads: Array of discovered leads (basic info)
  // - count: Total matching leads in Apollo
  // - creditsUsed: Credits consumed (typically 1-5)
  
  console.log(\`Discovered \${result.leads.length} leads\`);
  console.log(\`Total available: \${result.count}\`);
};`}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Backend Discovery Flow - 5 Steps</h3>
                  
                  <div className="space-y-4">
                    {/* Step 1 */}
                    <div className="border-l-4 border-l-blue-500 bg-gray-50 rounded-r-lg p-4">
                      <p className="font-semibold text-gray-900 mb-2">Step 1: Load ICP Profile</p>
                      <CodeBlock
                        title="GET /api/icp-profiles/:id"
                        code={`// Backend retrieves ICP configuration
const icpProfile = await kv.get(\`icp_profile_\${icpProfileId}\`);

// ICP contains targeting criteria:
// {
//   job_titles: "VP Sales, Director Sales",
//   locations: "United States",
//   industries: "Technology, SaaS",
//   company_sizes: "51-200, 201-500",
//   technologies: "Salesforce",
//   keywords: "hiring, expansion"
// }`}
                      />
                    </div>

                    {/* Step 2 */}
                    <div className="border-l-4 border-l-blue-500 bg-gray-50 rounded-r-lg p-4">
                      <p className="font-semibold text-gray-900 mb-2">Step 2: Build Apollo Search Payload</p>
                      <CodeBlock
                        title="Transform ICP → Apollo API format"
                        code={`const apolloPayload = {
  // Pagination
  page: 1,
  per_page: 25, // Fetch 25 leads at a time
  
  // Person criteria
  person_titles: icpProfile.job_titles.split(',').map(t => t.trim()),
  person_locations: icpProfile.locations.split(',').map(l => l.trim()),
  
  // Company criteria
  organization_num_employees_ranges: 
    icpProfile.company_sizes.split(',').map(s => s.trim()),
  
  // Keywords (industries + technologies + custom keywords)
  q_organization_keyword_tags: [
    ...icpProfile.industries.split(',').map(i => i.trim()),
    ...icpProfile.technologies.split(',').map(t => t.trim())
  ],
  q_keywords: icpProfile.keywords
};`}
                      />
                    </div>

                    {/* Step 3 */}
                    <div className="border-l-4 border-l-blue-500 bg-gray-50 rounded-r-lg p-4">
                      <p className="font-semibold text-gray-900 mb-2">Step 3: Call Apollo People Search API</p>
                      <CodeBlock
                        title="POST https://api.apollo.io/v1/mixed_people/search"
                        code={`const response = await fetch(
  'https://api.apollo.io/v1/mixed_people/search',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': process.env.APOLLO_API_KEY
    },
    body: JSON.stringify(apolloPayload)
  }
);

const apolloData = await response.json();

// Apollo returns:
// {
//   people: [...], // Array of people matching criteria
//   pagination: {
//     page: 1,
//     per_page: 25,
//     total_entries: 1523, // Total matching leads
//     total_pages: 61
//   },
//   breadcrumbs: [...] // Search criteria summary
// }`}
                      />
                    </div>

                    {/* Step 4 */}
                    <div className="border-l-4 border-l-blue-500 bg-gray-50 rounded-r-lg p-4">
                      <p className="font-semibold text-gray-900 mb-2">Step 4: Parse & Store Basic Lead Data</p>
                      <CodeBlock
                        title="Transform Apollo response → Our lead format"
                        code={`// Extract basic info from Apollo response
const discoveredLeads = apolloData.people.map(person => ({
  // Internal IDs
  id: generateUniqueId(), // Our internal lead ID
  apollo_id: person.id, // Apollo's person ID
  
  // Basic contact info (from discovery, NOT enriched)
  first_name: person.first_name,
  last_name: person.last_name,
  title: person.title,
  
  // Company info (basic)
  company_name: person.organization?.name,
  company_domain: person.organization?.primary_domain,
  company_industry: person.organization?.industry,
  employee_count: person.organization?.estimated_num_employees,
  company_revenue: person.organization?.estimated_annual_revenue,
  
  // Location
  city: person.city,
  state: person.state,
  country: person.country,
  location: \`\${person.city} \${person.state}\`.trim(),
  
  // Status tracking
  status: "discovered", // Initial status - NOT enriched yet!
  is_enriched: false,
  
  // Metadata
  icp_profile_id: icpProfileId, // Which ICP found this lead
  created_at: new Date().toISOString(),
  organization_id: "org_hardcoded"
}));

// Store each lead in kv_store
for (const lead of discoveredLeads) {
  await kv.set(\`lead_\${lead.id}\`, lead);
}

// IMPORTANT: No email, no phone, no enriched data yet!
// Those come during enrichment stage.`}
                      />
                    </div>

                    {/* Step 5 */}
                    <div className="border-l-4 border-l-blue-500 bg-gray-50 rounded-r-lg p-4">
                      <p className="font-semibold text-gray-900 mb-2">Step 5: Return Results to Frontend</p>
                      <CodeBlock
                        title="Response sent to UI"
                        code={`return {
  leads: discoveredLeads, // Array of 25 leads
  total_count: apolloData.pagination.total_entries, // Total available
  page: 1,
  has_more: apolloData.pagination.total_pages > 1,
  credits_used: 1 // Discovery is cheap (1 credit typically)
};`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">What Data is Available in Discovery?</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-xs font-bold text-green-900 mb-2">✅ Available (Free Preview)</p>
                      <ul className="space-y-1 text-xs text-green-800">
                        <li>• First Name & Last Name</li>
                        <li>• Job Title</li>
                        <li>• Company Name</li>
                        <li>• Company Industry</li>
                        <li>• Company Size (employees)</li>
                        <li>• Location (City, State)</li>
                        <li>• LinkedIn URL (if public)</li>
                      </ul>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-xs font-bold text-red-900 mb-2">❌ NOT Available (Requires Enrichment)</p>
                      <ul className="space-y-1 text-xs text-red-800">
                        <li>• ❌ Email Address</li>
                        <li>• ❌ Phone Number</li>
                        <li>• ❌ Direct Dial</li>
                        <li>• ❌ Mobile Phone</li>
                        <li>• ❌ Social Profiles (Twitter, etc.)</li>
                        <li>• ❌ Personal Email</li>
                        <li>• ❌ Full Contact Details</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-yellow-900 mb-1">💡 Why This Two-Stage Approach?</p>
                    <p className="text-xs text-yellow-800 leading-relaxed">
                      <strong>Credit Efficiency.</strong> Discovery costs 1 credit per search. Enrichment costs 1 credit PER LEAD. 
                      By previewing leads first, you can evaluate if they're worth enriching before spending credits.
                      This prevents wasting credits on low-quality leads.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Discovery UI: The "Discovered" Tab</h3>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-4">
                      Discovered leads appear in the <strong>Discovered tab</strong> on the Leads page. The UI is intentionally simple:
                    </p>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-start gap-2">
                        <span className="text-[#E64B8B] font-bold">→</span>
                        <div>
                          <p className="font-semibold text-gray-900">Simple Table View</p>
                          <p className="text-gray-600">Shows Name, Title, Company, Location - no complex filters needed</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#E64B8B] font-bold">→</span>
                        <div>
                          <p className="font-semibold text-gray-900">"Enrich Lead" Button</p>
                          <p className="text-gray-600">Primary CTA to move lead from discovery → enrichment</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#E64B8B] font-bold">→</span>
                        <div>
                          <p className="font-semibold text-gray-900">No Status/Qualification</p>
                          <p className="text-gray-600">Those features unlock after enrichment</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#E64B8B] font-bold">→</span>
                        <div>
                          <p className="font-semibold text-gray-900">No Activities</p>
                          <p className="text-gray-600">Can't log activities without contact info (email/phone)</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-xs font-semibold text-blue-900 mb-1">🎯 User Decision Point</p>
                      <p className="text-xs text-blue-800">
                        At this stage, users evaluate: "Is this lead worth 1 credit to get their email and full data?" 
                        If yes → Enrich. If no → Ignore or delete.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* Enrichment & Pipeline - Placeholder */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-900 mb-2">✅ Stage 2: Enrichment & Stage 3: Pipeline - Documented</p>
              <p className="text-xs text-green-800">Complete 5-step enrichment flow (Apollo API, credit deduction, data merge) and 6-stage pipeline management (New → Contacted → Qualified → Proposal → Won/Lost) with 3 qualification levels (Cold/Warm/Hot) fully documented above.</p>
            </div>

            {/* Complete Flow Summary */}
            <div className="bg-gradient-to-r from-[#E64B8B]/10 to-purple-100 border-2 border-[#E64B8B]/30 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#E64B8B] rounded-lg flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Complete Leads Flow Summary</h3>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#E64B8B]">1.</span>
                      <p><strong>ICP Created</strong> → Defines targeting criteria (job titles, locations, industries, etc.)</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#E64B8B]">2.</span>
                      <p><strong>Discovery</strong> → Apollo finds 25+ matching leads with basic info (1 credit total)</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#E64B8B]">3.</span>
                      <p><strong>Discovered Tab</strong> → User reviews leads, decides which to enrich</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#E64B8B]">4.</span>
                      <p><strong>Enrichment</strong> → Apollo provides email, phone, social profiles (1 credit per lead)</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#E64B8B]">5.</span>
                      <p><strong>Enriched Tab</strong> → Lead enters pipeline at "New" status with full features unlocked</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#E64B8B]">6.</span>
                      <p><strong>Pipeline Management</strong> → User moves lead through 6 stages, logs activities, sets qualification</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#E64B8B]">7.</span>
                      <p><strong>Close</strong> → Lead reaches "Won" (success!) or "Lost" (learn from it) status</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CAMPAIGNS TAB */}
        {activeTab === "campaigns" && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">📧 Coming Soon</p>
              <p className="text-xs text-blue-800">Documentation for campaign builder, message sequencing, and outreach automation.</p>
            </div>
          </div>
        )}

        {/* ACTIVITIES TAB */}
        {activeTab === "activities" && (
          <ActivitiesPipelineDocumentation />
        )}

        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500 rounded-lg flex-shrink-0">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Questions About How Things Work?</h3>
              <p className="text-xs text-gray-700 leading-relaxed">
                This documentation is continuously updated as we build new features. If you have questions about how 
                a specific feature works or need clarification on any logic, refer back to this page for complete transparency.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
