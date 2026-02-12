import React from "react";
import { ArrowLeft, Sparkles, Target, Brain, Mail, TrendingUp, ArrowRight } from "lucide-react";
import { AppShell } from "@/app/components/AppShell";
import { 
  PropertyAnalysisPreview, 
  ServiceMappingPreview, 
  OpportunityScoringPreview, 
  MessageGenerationPreview, 
  PerplexityResearchPreview 
} from "@/app/components/marketing/FeaturePreviewComponents";
import { useNavigate } from "react-router";

export function FeaturesPage({ onNav }: { onNav?: (key: string) => void }) {
  const navigate = useNavigate();
  const handleNav = onNav || ((key: string) => {
    if (key === "landing" || key === "features" || key === "pricing") {
      navigate(`/${key === "landing" ? "" : key}`);
    } else {
      navigate("/app/");
    }
  });
  const features = [
    {
      icon: Sparkles,
      title: "AI Property Analysis",
      tagline: "See what your prospects can't even articulate",
      description: "Combines satellite imagery with GPT-4o Vision to analyze properties at scale. Identifies facility types, assesses condition, spots opportunities—automatically.",
      benefits: [
        "Satellite imagery capture with intelligent grid sizing",
        "GPT-4o Vision analysis of property characteristics",
        "Automated opportunity scoring based on visual assessment",
        "Property quality grading (Excellent, Good, Fair, Poor)"
      ],
      color: "from-pink-500 to-rose-500",
      bgColor: "from-pink-50 to-rose-50",
      borderColor: "border-pink-200",
      PreviewComponent: PropertyAnalysisPreview
    },
    {
      icon: Target,
      title: "Service Mapping AI",
      tagline: "Know exactly what to pitch, before the first call",
      description: "AI analyzes property analysis, company data, and your service catalog to automatically map service fit. Stop guessing. Start knowing.",
      benefits: [
        "Automatic service-to-need matching using GPT-4o",
        "Opportunity scoring (High, Medium, Low)",
        "Estimated annual value calculations",
        "Specific service recommendations with reasoning"
      ],
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50",
      borderColor: "border-blue-200",
      PreviewComponent: ServiceMappingPreview
    },
    {
      icon: Brain,
      title: "AI Opportunity Scoring",
      tagline: "Prioritize the right leads, ignore the noise",
      description: "Multi-factor AI scoring engine that combines company fit, engagement data, and timing signals. Get a 0-100 score on every lead with full transparency.",
      benefits: [
        "Company fit analysis (property type, size, quality)",
        "Engagement scoring (activity history, contact availability)",
        "Timing analysis (recency, qualification level, pipeline stage)",
        "Win probability calculations with clear reasoning"
      ],
      color: "from-purple-500 to-violet-500",
      bgColor: "from-purple-50 to-violet-50",
      borderColor: "border-purple-200",
      PreviewComponent: OpportunityScoringPreview
    },
    {
      icon: Mail,
      title: "AI Message Generation",
      tagline: "Personalized outreach that doesn't sound like AI",
      description: "GPT-4o writes emails using all enrichment data—property analysis, service fit, company info. Every message is unique, contextual, and ready to send.",
      benefits: [
        "Leverages all enrichment data for personalization",
        "Multiple tone options (Professional, Consultative, Direct)",
        "Property-specific language and insights",
        "Service-fit based value propositions"
      ],
      color: "from-green-500 to-emerald-500",
      bgColor: "from-green-50 to-emerald-50",
      borderColor: "border-green-200",
      PreviewComponent: MessageGenerationPreview
    },
    {
      icon: TrendingUp,
      title: "Real-Time Perplexity Research",
      tagline: "Deep web research, automated and instant",
      description: "Perplexity AI conducts comprehensive web research on prospects. Market trends, recent news, competitive landscape—everything a rep needs to know.",
      benefits: [
        "Live web search using Perplexity's Sonar models",
        "Company background and market position analysis",
        "Recent news, events, and strategic initiatives",
        "Competitive landscape and industry trends"
      ],
      color: "from-orange-500 to-amber-500",
      bgColor: "from-orange-50 to-amber-50",
      borderColor: "border-orange-200",
      PreviewComponent: PerplexityResearchPreview
    }
  ];

  return (
    <AppShell title="Features" active="features" onNav={handleNav}>
      <div className="min-h-screen bg-white -mx-6 lg:-mx-8 -my-6">
      {/* Hero */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <button onClick={() => handleNav("landing")} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Five AI features that
            <br />
            <span className="bg-gradient-to-r from-[#E64B8B] to-[#d43d7a] bg-clip-text text-transparent">
              truly differentiate
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Not incremental improvements. Fundamental advantages that competitors can't easily replicate.
            Built for teams who refuse to accept mediocrity.
          </p>
        </div>
      </div>

      {/* Features List */}
      <div className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-24">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`grid lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? "lg:grid-flow-dense" : ""
              }`}
            >
              <div className={index % 2 === 1 ? "lg:col-start-2" : ""}>
                <div className="space-y-6">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl shadow-lg`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                      {feature.title}
                    </h2>
                    <p className="text-lg text-gray-600 italic mb-4">
                      {feature.tagline}
                    </p>
                    <p className="text-lg text-gray-700 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {feature.benefits.map((benefit) => (
                      <div key={benefit} className="flex items-start gap-3">
                        <div className="mt-1 w-1.5 h-1.5 bg-[#E64B8B] rounded-full flex-shrink-0" />
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={index % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""}>
                <div className={`p-6 bg-gradient-to-br ${feature.bgColor} rounded-3xl border ${feature.borderColor} shadow-xl`}>
                  <feature.PreviewComponent />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            See it in action
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            These aren't theoretical features. They're live, running, and ready to use.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-[#E64B8B] to-[#d43d7a] text-white text-lg font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all"
          >
            Access Dashboard
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-[#E64B8B] to-[#d43d7a] rounded-lg" />
              <span className="font-bold text-gray-900">ProspectAI</span>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => handleNav("features")} className="text-sm text-[#E64B8B] font-semibold">
                Features
              </button>
              <button onClick={() => handleNav("pricing")} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Pricing
              </button>
              <button
                onClick={() => navigate("/auth")}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </button>
            </div>
            <div className="text-sm text-gray-500">
              © 2026 ProspectAI. Progress over perfection.
            </div>
          </div>
        </div>
      </footer>
      </div>
    </AppShell>
  );
}