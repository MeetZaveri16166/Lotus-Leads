import React from "react";
import { ArrowRight, Sparkles, Target, Brain, Zap, Mail } from "lucide-react";
import { AppShell } from "@/app/components/AppShell";

export function LandingPage({ onNav }: { onNav: (key: string) => void }) {
  return (
    <AppShell title="Marketing Website" active="landing" onNav={onNav}>
      <div className="min-h-screen bg-white -mx-6 lg:-mx-8 -my-6">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#E64B8B] to-[#d43d7a] rounded-lg" />
                <span className="text-xl font-bold text-gray-900">ProspectAI</span>
              </div>
              
              <div className="flex items-center gap-6">
                <button onClick={() => onNav("features")} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Features
                </button>
                <button onClick={() => onNav("pricing")} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Pricing
                </button>
                <button
                  onClick={() => onNav("dashboard")}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Dashboard
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Column */}
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-50 border border-pink-200 rounded-full">
                  <Sparkles className="w-4 h-4 text-[#E64B8B]" />
                  <span className="text-sm font-semibold text-[#E64B8B]">AI-Powered Sales Intelligence</span>
                </div>
                
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                  Stop guessing.
                  <br />
                  <span className="bg-gradient-to-r from-[#E64B8B] to-[#d43d7a] bg-clip-text text-transparent">
                    Start knowing.
                  </span>
                </h1>
                
                <p className="text-xl text-gray-600 leading-relaxed">
                  Transform raw leads into revenue with AI that actually understands your prospects. 
                  Property analysis, service mapping, and personalized outreach—all automated.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => onNav("dashboard")}
                    className="group px-8 py-4 bg-gradient-to-r from-[#E64B8B] to-[#d43d7a] text-white font-semibold rounded-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  
                  <button
                    onClick={() => onNav("features")}
                    className="px-8 py-4 bg-gray-100 text-gray-900 font-semibold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                  >
                    See How It Works
                    <Brain className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center gap-6 pt-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">10x</div>
                    <div className="text-sm text-gray-600">Faster Research</div>
                  </div>
                  <div className="w-px h-12 bg-gray-300" />
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">85%</div>
                    <div className="text-sm text-gray-600">Less Manual Work</div>
                  </div>
                  <div className="w-px h-12 bg-gray-300" />
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">3x</div>
                    <div className="text-sm text-gray-600">Higher Conversion</div>
                  </div>
                </div>
              </div>

              {/* Right Column - Visual */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#E64B8B]/20 to-purple-500/20 rounded-3xl blur-3xl" />
                <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-8">
                  <div className="space-y-6">
                    {/* Mock Dashboard Preview */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#E64B8B] to-[#d43d7a] rounded-lg flex items-center justify-center">
                          <Target className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">AI Opportunity Score</div>
                          <div className="text-xs text-gray-500">Real-time analysis</div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-[#E64B8B]">92</div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-white rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium text-gray-900">Property Analyzed</span>
                        </div>
                        <Sparkles className="w-4 h-4 text-green-600" />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium text-gray-900">Service Fit: High</span>
                        </div>
                        <Brain className="w-4 h-4 text-blue-600" />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-white rounded-lg border border-purple-200">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium text-gray-900">Message Generated</span>
                        </div>
                        <Mail className="w-4 h-4 text-purple-600" />
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-2">Est. Annual Value</div>
                      <div className="text-3xl font-bold text-gray-900">$127,500</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Bar */}
        <div className="py-16 bg-gray-50 border-y border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Built for modern sales teams who demand more
              </p>
            </div>
          </div>
        </div>

        {/* Key Features Preview */}
        <div className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Five AI features that
                <br />
                <span className="bg-gradient-to-r from-[#E64B8B] to-[#d43d7a] bg-clip-text text-transparent">
                  actually differentiate
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Not just CRM. Not just enrichment. A complete AI-powered intelligence layer.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 hover:shadow-xl transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-[#E64B8B] to-[#d43d7a] rounded-xl flex items-center justify-center mb-6">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">AI Property Analysis</h3>
                <p className="text-gray-600 leading-relaxed">
                  Satellite imagery + GPT-4o Vision. Analyze properties, identify opportunities, 
                  and understand facility needs automatically.
                </p>
              </div>

              <div className="p-8 bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-200 hover:shadow-xl transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Service Mapping AI</h3>
                <p className="text-gray-600 leading-relaxed">
                  Automatically match your services to prospect needs. Know exactly what to pitch, 
                  backed by AI analysis.
                </p>
              </div>

              <div className="p-8 bg-gradient-to-br from-white to-purple-50 rounded-2xl border border-purple-200 hover:shadow-xl transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Outreach</h3>
                <p className="text-gray-600 leading-relaxed">
                  GPT-4o writes personalized emails using all enrichment data. Every message is unique 
                  and contextually relevant.
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <button
                onClick={() => onNav("features")}
                className="inline-flex items-center gap-2 text-[#E64B8B] font-semibold hover:gap-4 transition-all"
              >
                Explore all 5 AI features
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to stop wasting time on bad-fit leads?
            </h2>
            <p className="text-xl text-gray-300 mb-10">
              Join forward-thinking sales teams using AI to win faster.
            </p>
            <button
              onClick={() => onNav("dashboard")}
              className="px-10 py-5 bg-gradient-to-r from-[#E64B8B] to-[#d43d7a] text-white text-lg font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all"
            >
              Start Using ProspectAI
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
                <button onClick={() => onNav("features")} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Features
                </button>
                <button onClick={() => onNav("pricing")} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Pricing
                </button>
                <button
                  onClick={() => onNav("dashboard")}
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