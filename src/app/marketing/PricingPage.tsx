import React from "react";
import { ArrowLeft, Check, ArrowRight } from "lucide-react";
import { AppShell } from "@/app/components/AppShell";

export function PricingPage({ onNav }: { onNav: (key: string) => void }) {
  const plans = [
    {
      name: "Starter",
      price: "Contact Us",
      description: "Perfect for small teams testing AI-powered prospecting",
      features: [
        "Up to 500 leads/month",
        "AI Property Analysis",
        "Service Mapping AI",
        "Basic Opportunity Scoring",
        "Email Support"
      ],
      cta: "Contact Sales",
      popular: false
    },
    {
      name: "Professional",
      price: "Contact Us",
      description: "For growing teams serious about sales intelligence",
      features: [
        "Up to 2,500 leads/month",
        "All AI Features",
        "Advanced Opportunity Scoring",
        "AI Message Generation",
        "Perplexity Research",
        "Priority Support",
        "Custom Integrations"
      ],
      cta: "Contact Sales",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Unlimited scale with dedicated support",
      features: [
        "Unlimited leads",
        "All AI Features",
        "Custom AI Training",
        "Dedicated Success Manager",
        "SLA Guarantees",
        "Custom Development",
        "White-glove Onboarding"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <AppShell title="Pricing" active="pricing" onNav={onNav}>
      <div className="min-h-screen bg-white -mx-6 lg:-mx-8 -my-6">
      {/* Hero */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <button onClick={() => onNav("landing")} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Simple, transparent
            <br />
            <span className="bg-gradient-to-r from-[#E64B8B] to-[#d43d7a] bg-clip-text text-transparent">
              pricing that scales
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12">
            Pay for what you use. No hidden fees. No surprises.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-8 rounded-2xl border-2 ${
                  plan.popular
                    ? "border-[#E64B8B] shadow-2xl bg-gradient-to-br from-white to-pink-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#E64B8B] to-[#d43d7a] text-white text-sm font-bold rounded-full">
                    Most Popular
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {plan.price}
                  </div>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                </div>
                
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <div className="mt-0.5 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => onNav("dashboard")}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? "bg-gradient-to-r from-[#E64B8B] to-[#d43d7a] text-white hover:shadow-lg"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Enterprise Note */}
          <div className="mt-16 p-8 bg-gray-50 rounded-2xl border border-gray-200 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Need something custom?
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              We work with enterprise teams to build custom AI workflows, integrations, and training programs.
            </p>
            <button
              onClick={() => onNav("dashboard")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#E64B8B] to-[#d43d7a] text-white font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              Talk to Sales
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                What's included in the AI features?
              </h3>
              <p className="text-gray-600">
                All plans include core AI capabilities. Professional and Enterprise get access to advanced features like AI message generation and Perplexity research.
              </p>
            </div>
            
            <div className="p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Can I upgrade or downgrade anytime?
              </h3>
              <p className="text-gray-600">
                Yes. Change plans as your needs evolve. No penalties, no lock-ins.
              </p>
            </div>
            
            <div className="p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Do you offer a free trial?
              </h3>
              <p className="text-gray-600">
                Contact our sales team to discuss trial options. We want to make sure ProspectAI is the right fit before you commit.
              </p>
            </div>
            
            <div className="p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                What kind of support do you provide?
              </h3>
              <p className="text-gray-600">
                Starter gets email support. Professional gets priority support. Enterprise gets a dedicated success manager and SLA guarantees.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Try the admin dashboard now. See what AI can do for your pipeline.
          </p>
          <button
            onClick={() => onNav("dashboard")}
            className="px-10 py-5 bg-gradient-to-r from-[#E64B8B] to-[#d43d7a] text-white text-lg font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all"
          >
            Access Dashboard
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
              <button onClick={() => onNav("pricing")} className="text-sm text-[#E64B8B] font-semibold">
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