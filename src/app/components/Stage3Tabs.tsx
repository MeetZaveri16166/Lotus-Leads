import { useState } from "react";
import { Target, Users, Sprout, Wrench, Lightbulb, Sparkles, TrendingUp, DollarSign, Clock, CheckCircle, Calendar, Zap, AlertCircle, MapPin, Star, Award, BarChart3, Globe, MessageCircle, Shield, Wifi, Package, TrendingDown, ArrowUpRight, Award as Trophy } from "lucide-react";

interface Stage3TabsProps {
  serviceMapping: any;
  propertyType?: string;
}

export function Stage3Tabs({ serviceMapping, propertyType }: Stage3TabsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "competition" | "irrigation" | "services" | "strategy">("overview");

  const tabs = [
    { key: "overview", label: "Overview", icon: Sparkles },
    { key: "competition", label: "Competition", icon: Users },
    { key: "irrigation", label: "Irrigation Intel", icon: Sprout },
    { key: "services", label: "Services & Costs", icon: Wrench },
    { key: "strategy", label: "Sales Strategy", icon: Lightbulb },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`
                flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap
                ${isActive 
                  ? 'border-[#E64B8B] text-[#E64B8B]' 
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && <OverviewTab serviceMapping={serviceMapping} />}
        {activeTab === "competition" && <CompetitionTab serviceMapping={serviceMapping} />}
        {activeTab === "irrigation" && <IrrigationTab serviceMapping={serviceMapping} />}
        {activeTab === "services" && <ServicesTab serviceMapping={serviceMapping} propertyType={propertyType} />}
        {activeTab === "strategy" && <StrategyTab serviceMapping={serviceMapping} />}
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ serviceMapping }: { serviceMapping: any }) {
  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      {serviceMapping.executive_summary && (
        <div className="bg-gradient-to-br from-[#E64B8B] to-[#d43d7a] rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-white/20 rounded-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2">Executive Summary</h3>
              <p className="text-white/95 leading-relaxed">{serviceMapping.executive_summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Current Season</div>
          <div className="text-lg font-bold text-gray-900">{serviceMapping.context?.current_season || "Unknown"}</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Region</div>
          <div className="text-lg font-bold text-gray-900">{serviceMapping.context?.region || "Unknown"}</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Opportunity Score</div>
          <div className={`text-lg font-bold ${
            serviceMapping.context?.opportunity_score === 'High' ? 'text-[#EC6FA0]' :
            serviceMapping.context?.opportunity_score === 'Medium' ? 'text-yellow-600' :
            'text-gray-600'
          }`}>
            {serviceMapping.context?.opportunity_score || "Unknown"}
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Annual Value</div>
          <div className="text-base font-bold text-[#EC6FA0]">{serviceMapping.context?.estimated_annual_value || "TBD"}</div>
        </div>
      </div>

      {/* Seasonal Revenue Intelligence - NEW */}
      {(serviceMapping.context?.climate_zone || serviceMapping.context?.mowing_weeks || serviceMapping.context?.snow_potential) && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-white rounded-lg shadow-sm">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Seasonal Revenue Intelligence</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-5">
            {serviceMapping.context?.climate_zone && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Climate Zone</div>
                <div className="text-base font-bold text-gray-900">{serviceMapping.context.climate_zone}</div>
                {serviceMapping.context?.growing_season && (
                  <div className="text-xs text-gray-600 mt-1">{serviceMapping.context.growing_season}</div>
                )}
              </div>
            )}
            
            {serviceMapping.context?.mowing_weeks && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mowing Season</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold text-green-600">{serviceMapping.context.mowing_weeks}</div>
                  <div className="text-sm text-gray-600">weeks/year</div>
                </div>
                <div className="text-xs text-gray-600 mt-1">Weekly lawn care opportunity</div>
              </div>
            )}
            
            {serviceMapping.context?.snow_potential && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Winter Services</div>
                <div className="text-base font-bold text-blue-700">{serviceMapping.context.snow_potential}</div>
                {serviceMapping.context?.snow_potential !== 'None' && serviceMapping.context?.snow_potential !== 'Minimal' && (
                  <div className="text-xs text-green-600 mt-1 font-medium">✓ Bundle opportunity available</div>
                )}
                {(serviceMapping.context?.snow_potential === 'None' || serviceMapping.context?.snow_potential === 'Minimal') && (
                  <div className="text-xs text-gray-500 mt-1">Focus on extended growing season</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top 3 Priorities */}
      {serviceMapping.recommended_services && serviceMapping.recommended_services.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-4">Top 3 Priority Services</h3>
          <div className="space-y-3">
            {serviceMapping.recommended_services
              .sort((a: any, b: any) => (a.priority || 999) - (b.priority || 999))
              .slice(0, 3)
              .map((service: any, idx: number) => (
                <div key={idx} className="bg-white rounded-xl p-5 border-l-4 border-[#EC6FA0] shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-bold text-base text-gray-900">{service.name}</div>
                    <span className="px-3 py-1 bg-pink-50 text-[#EC6FA0] rounded-full text-xs font-semibold border border-pink-100">
                      Priority {service.priority}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">{service.rationale}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Sales Pitch */}
      {serviceMapping.sales_angle && (
        <div className="bg-gradient-to-br from-pink-50 to-white rounded-xl p-6 border border-pink-100 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-pink-100 rounded-lg">
              <Target className="w-5 h-5 text-[#EC6FA0]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 mb-2">Sales Pitch</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{serviceMapping.sales_angle}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Competition Tab
function CompetitionTab({ serviceMapping }: { serviceMapping: any }) {
  const competition = serviceMapping.competition_assessment;
  const [activeSection, setActiveSection] = useState<string>("overview");
  
  if (!competition) {
    return <div className="text-center text-gray-500 py-12">No competition data available</div>;
  }

  const sections = [
    { id: "overview", label: "Market Overview", icon: BarChart3, available: true },
    { id: "providers", label: "Competitors", icon: Users, available: competition.local_providers?.length > 0 },
    { id: "strategy", label: "Our Strategy", icon: Lightbulb, available: !!competition.strategic_recommendations },
  ].filter(s => s.available);

  return (
    <div>
      {/* Mobile: Horizontal Tabs */}
      <div className="lg:hidden mb-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                  ${isActive 
                    ? 'bg-[#E64B8B] text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-700'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: Sidebar + Content */}
      <div className="flex gap-6">
        {/* Left Sidebar Navigation - Desktop Only */}
        <div className="hidden lg:block w-44 flex-shrink-0">
          <div className="sticky top-4 space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-[#E64B8B] text-white shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0">
          <div className="space-y-6">
      {/* Market Overview Banner */}
      {activeSection === "overview" && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Our Differentiation */}
          {competition.our_differentiation && (
            <div className="bg-[#E64B8B]/5 rounded-lg p-5 border border-[#E64B8B]/20">
              <div className="font-semibold text-[#E64B8B] mb-2 text-sm">Our Competitive Edge</div>
              <div className="text-sm text-gray-700 leading-relaxed">{competition.our_differentiation}</div>
            </div>
          )}
          
          {/* Market Landscape */}
          {competition.market_landscape && (
            <div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
              <div className="font-semibold text-blue-900 mb-2 text-sm">Market Landscape</div>
              <div className="text-sm text-gray-700 leading-relaxed">{competition.market_landscape}</div>
            </div>
          )}
        </div>
      )}

      {/* Strategic Recommendations */}
      {activeSection === "strategy" && competition.strategic_recommendations && (
        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-gray-600" />
            <div className="font-semibold text-gray-900 text-sm">Strategic Recommendations</div>
          </div>
          <div className="text-sm text-gray-700 leading-relaxed">{competition.strategic_recommendations}</div>
        </div>
      )}

      {/* Competitor Cards */}
      {activeSection === "providers" && competition.local_providers && competition.local_providers.length > 0 && (
        <div className="space-y-6">
          {competition.local_providers.map((provider: any, idx: number) => (
            <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-gray-900 mb-1">{provider.name}</h3>
                    {provider.address && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-2">
                        <MapPin className="w-3.5 h-3.5" />
                        {provider.address}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <span className="px-3 py-1.5 bg-white rounded-full text-xs font-medium text-gray-700 border border-gray-200 shadow-sm">
                      {provider.estimated_size}
                    </span>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                      provider.pricing_tier === 'Premium' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                      provider.pricing_tier === 'Mid' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                      'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      {provider.pricing_tier}
                    </span>
                  </div>
                </div>
                
                {/* Rating & Business Longevity */}
                <div className="flex items-center gap-6 flex-wrap">
                  {provider.google_rating && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-gray-900">{provider.google_rating}</span>
                      </div>
                      <span className="text-sm text-gray-500">({provider.review_count} reviews)</span>
                    </div>
                  )}
                  {provider.business_stability?.years_in_business && (
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{provider.business_stability.years_in_business} years in business</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        provider.business_stability.longevity_indicator === 'Legacy' ? 'bg-purple-100 text-purple-700' :
                        provider.business_stability.longevity_indicator === 'Veteran' ? 'bg-blue-100 text-blue-700' :
                        provider.business_stability.longevity_indicator === 'Established' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {provider.business_stability.longevity_indicator}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Intelligence Grid - 6 Cards */}
                <div className="grid md:grid-cols-3 gap-3">
                  {/* Business Stability */}
                  {provider.business_stability && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4 text-gray-600" />
                        <div className="font-semibold text-gray-900 text-xs uppercase tracking-wide">Stability</div>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div><span className="text-gray-600">Status:</span> <span className={`font-medium ${
                          provider.business_stability.stability_assessment === 'Growing' ? 'text-green-600' :
                          provider.business_stability.stability_assessment === 'Declining' ? 'text-red-600' :
                          'text-gray-900'
                        }`}>{provider.business_stability.stability_assessment || 'Unknown'}</span></div>
                        {provider.business_stability.management_changes && (
                          <div className="text-gray-700 italic">{provider.business_stability.management_changes}</div>
                        )}
                        {provider.business_stability.recent_changes && provider.business_stability.recent_changes !== 'None known' && (
                          <div className="text-amber-700 font-medium">{provider.business_stability.recent_changes}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Market Position */}
                  {provider.market_position && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <div className="font-semibold text-blue-900 text-xs uppercase tracking-wide">Market Position</div>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div><span className="text-blue-700">Trajectory:</span> <span className={`font-medium ${
                          provider.market_position.growth_trajectory === 'Expanding' ? 'text-green-600' :
                          provider.market_position.growth_trajectory === 'Declining' ? 'text-red-600' :
                          'text-gray-900'
                        }`}>{provider.market_position.growth_trajectory}</span></div>
                        <div className="text-gray-700">{provider.market_position.employee_count}</div>
                        {provider.market_position.market_share && (
                          <div><span className="text-blue-700">Share:</span> <span className="font-medium text-gray-900">{provider.market_position.market_share}</span></div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Digital Presence */}
                  {provider.digital_presence && (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-4 h-4 text-purple-600" />
                        <div className="font-semibold text-purple-900 text-xs uppercase tracking-wide">Digital Presence</div>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div><span className="text-purple-700">Website:</span> <span className="font-medium text-gray-900">{provider.digital_presence.website_quality}</span></div>
                        <div><span className="text-purple-700">SEO:</span> <span className="font-medium text-gray-900">{provider.digital_presence.seo_ranking}</span></div>
                        <div><span className="text-purple-700">Social:</span> <span className="font-medium text-gray-900">{provider.digital_presence.social_media_activity}</span></div>
                        <div><span className="text-purple-700">Reviews/mo:</span> <span className="font-medium text-gray-900">{provider.digital_presence.review_velocity}</span></div>
                      </div>
                    </div>
                  )}

                  {/* Customer Sentiment */}
                  {provider.customer_sentiment && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="w-4 h-4 text-green-600" />
                        <div className="font-semibold text-green-900 text-xs uppercase tracking-wide">Sentiment</div>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div><span className="text-green-700">Trend:</span> <span className={`font-medium ${
                          provider.customer_sentiment.review_trend === 'Improving' ? 'text-green-600' :
                          provider.customer_sentiment.review_trend === 'Declining' ? 'text-red-600' :
                          'text-gray-900'
                        }`}>{provider.customer_sentiment.review_trend}</span></div>
                        <div><span className="text-green-700">Response:</span> <span className="font-medium text-gray-900">{provider.customer_sentiment.response_rate}</span></div>
                        <div><span className="text-green-700">Score:</span> <span className="font-medium text-gray-900">{provider.customer_sentiment.sentiment_score}</span></div>
                        {provider.customer_sentiment.recurring_complaints && provider.customer_sentiment.recurring_complaints.length > 0 && (
                          <div className="text-red-700 italic">{provider.customer_sentiment.recurring_complaints.join(', ')}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Service Delivery */}
                  {provider.service_delivery && (
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-amber-600" />
                        <div className="font-semibold text-amber-900 text-xs uppercase tracking-wide">Service Delivery</div>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {provider.service_delivery.certifications && (
                          <div className="text-gray-700">{provider.service_delivery.certifications}</div>
                        )}
                        <div><span className="text-amber-700">Equipment:</span> <span className="font-medium text-gray-900">{provider.service_delivery.equipment_sophistication}</span></div>
                        <div><span className="text-amber-700">Tech:</span> <span className="font-medium text-gray-900">{provider.service_delivery.technology_adoption}</span></div>
                        <div><span className="text-amber-700">Consistency:</span> <span className="font-medium text-gray-900">{provider.service_delivery.service_consistency}</span></div>
                      </div>
                    </div>
                  )}

                  {/* Pricing Intelligence */}
                  {provider.pricing && (
                    <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-indigo-600" />
                        <div className="font-semibold text-indigo-900 text-xs uppercase tracking-wide">Pricing</div>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="text-gray-700">{provider.pricing.tier_confirmation}</div>
                        <div><span className="text-indigo-700">Flexibility:</span> <span className="font-medium text-gray-900">{provider.pricing.contract_flexibility}</span></div>
                        <div><span className="text-indigo-700">Structure:</span> <span className="font-medium text-gray-900">{provider.pricing.package_structure}</span></div>
                        {provider.pricing.seasonal_promotions && (
                          <div className="text-green-700 font-medium">{provider.pricing.seasonal_promotions}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Services */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Services Offered</div>
                  <div className="flex flex-wrap gap-2">
                    {provider.services?.map((service: string, sidx: number) => (
                      <span key={sidx} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs border border-gray-200">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Vulnerability Analysis - Critical for Sales */}
                {provider.vulnerability_analysis && (
                  <div className="bg-[#E64B8B]/5 rounded-lg p-5 border-2 border-[#E64B8B]/30">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="w-5 h-5 text-[#E64B8B]" />
                      <div className="font-bold text-[#E64B8B] text-sm uppercase tracking-wide">How to Win Against Them</div>
                      <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${
                        provider.vulnerability_analysis.win_probability === 'High' ? 'bg-green-100 text-green-700 border border-green-300' :
                        provider.vulnerability_analysis.win_probability === 'Medium' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                        'bg-red-100 text-red-700 border border-red-300'
                      }`}>
                        {provider.vulnerability_analysis.win_probability} Win Probability
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Service Gaps */}
                      {provider.vulnerability_analysis.service_gaps && provider.vulnerability_analysis.service_gaps.length > 0 && (
                        <div>
                          <div className="font-semibold text-gray-900 text-xs mb-2 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-[#E64B8B]" />
                            Service Gaps (Our Opportunities)
                          </div>
                          <ul className="space-y-1">
                            {provider.vulnerability_analysis.service_gaps.map((gap: string, gidx: number) => (
                              <li key={gidx} className="text-xs text-gray-700 flex items-start gap-1.5">
                                <span className="text-[#E64B8B] font-bold">✓</span>
                                <span>{gap}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Primary Vulnerabilities */}
                      {provider.vulnerability_analysis.primary_vulnerabilities && provider.vulnerability_analysis.primary_vulnerabilities.length > 0 && (
                        <div>
                          <div className="font-semibold text-gray-900 text-xs mb-2 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                            Their Weaknesses
                          </div>
                          <ul className="space-y-1">
                            {provider.vulnerability_analysis.primary_vulnerabilities.map((vuln: string, vidx: number) => (
                              <li key={vidx} className="text-xs text-gray-700 flex items-start gap-1.5">
                                <span className="text-red-600 font-bold">●</span>
                                <span>{vuln}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Best Attack Angles */}
                    {provider.vulnerability_analysis.best_attack_angles && provider.vulnerability_analysis.best_attack_angles.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[#E64B8B]/20">
                        <div className="font-semibold text-gray-900 text-xs mb-2 flex items-center gap-1.5">
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#E64B8B]" />
                          Best Sales Attack Angles
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {provider.vulnerability_analysis.best_attack_angles.map((angle: string, aidx: number) => (
                            <span key={aidx} className="px-3 py-1.5 bg-[#E64B8B] text-white rounded-lg text-xs font-semibold shadow-sm">
                              {angle}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Transition Timing */}
                    {provider.vulnerability_analysis.transition_timing && (
                      <div className="mt-4 pt-4 border-t border-[#E64B8B]/20">
                        <div className="font-semibold text-gray-900 text-xs mb-1.5">Best Time to Approach Their Customers:</div>
                        <div className="text-sm text-gray-700 italic">{provider.vulnerability_analysis.transition_timing}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews Section */}
                {(provider.positive_reviews?.length > 0 || provider.critical_reviews?.length > 0) && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Positive Reviews */}
                    {provider.positive_reviews && provider.positive_reviews.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <div className="font-semibold text-green-900 text-sm">What Customers Love</div>
                        </div>
                        <ul className="space-y-1.5 text-xs text-gray-700">
                          {provider.positive_reviews.map((review: string, ridx: number) => (
                            <li key={ridx} className="flex items-start gap-1.5">
                              <span className="text-green-600 mt-0.5">✓</span>
                              <span>{review}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Critical Reviews */}
                    {provider.critical_reviews && provider.critical_reviews.length > 0 && (
                      <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <div className="font-semibold text-red-900 text-sm">Common Complaints</div>
                        </div>
                        <ul className="space-y-1.5 text-xs text-gray-700">
                          {provider.critical_reviews.map((review: string, ridx: number) => (
                            <li key={ridx} className="flex items-start gap-1.5">
                              <span className="text-red-600 mt-0.5">✗</span>
                              <span>{review}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Strengths & Weaknesses Summary */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <div className="font-semibold text-green-700 text-xs mb-1.5 uppercase tracking-wide">Overall Strengths</div>
                    <div className="text-sm text-gray-700">{provider.strengths}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-red-700 text-xs mb-1.5 uppercase tracking-wide">Overall Weaknesses</div>
                    <div className="text-sm text-gray-700">{provider.weaknesses}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Irrigation Tab
function IrrigationTab({ serviceMapping }: { serviceMapping: any }) {
  const irrigation = serviceMapping.irrigation_intelligence;
  const [activeSection, setActiveSection] = useState<string>("overview");
  
  if (!irrigation) {
    return <div className="text-center text-gray-500 py-12">No irrigation data available</div>;
  }

  const sections = [
    { id: "overview", label: "System Overview", icon: Sprout, available: true },
    { id: "scenarios", label: "Age & Condition", icon: Calendar, available: irrigation.age_scenarios?.length > 0 },
    { id: "upgrade", label: "Upgrade Intel", icon: ArrowUpRight, available: !!irrigation.upgrade_opportunities || !!irrigation.smart_irrigation_potential },
  ].filter(s => s.available);

  return (
    <div>
      {/* Mobile: Horizontal Tabs */}
      <div className="lg:hidden mb-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                  ${isActive 
                    ? 'bg-[#E64B8B] text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-700'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: Sidebar + Content */}
      <div className="flex gap-6">
        {/* Left Sidebar Navigation - Desktop Only */}
        <div className="hidden lg:block w-44 flex-shrink-0">
          <div className="sticky top-4 space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-[#E64B8B] text-white shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0">
          <div className="space-y-6">
      {/* System Overview */}
      {activeSection === "overview" && (
      <>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-5">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Likely System</div>
          <div className="text-lg font-semibold text-gray-900">{irrigation.likely_system}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-5">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Most Likely Age</div>
          <div className="text-lg font-semibold text-gray-900">{irrigation.most_likely_age || irrigation.system_age_estimate}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-5">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Technology Level</div>
          <div className="text-lg font-semibold text-gray-900">{irrigation.current_technology_level}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-5">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Replacement Cycle</div>
          <div className="text-lg font-semibold text-gray-900">{irrigation.replacement_cycle}</div>
        </div>
      </div>

      {/* Methodology */}
      {irrigation.methodology && (
        <div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
          <div className="flex items-start gap-3 mb-2">
            <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-blue-900 mb-2 text-sm">How We Determined This</div>
              <div className="text-sm text-gray-700 leading-relaxed">{irrigation.methodology}</div>
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {/* Age Scenarios */}
      {activeSection === "scenarios" && irrigation.age_scenarios && irrigation.age_scenarios.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Age Scenarios</h3>
          <div className="space-y-3">
            {irrigation.age_scenarios.map((scenario: any, idx: number) => (
              <div key={idx} className={`rounded-lg p-4 border-l-4 ${
                scenario.likelihood === 'High' ? 'bg-green-50 border-green-500' :
                scenario.likelihood === 'Medium' ? 'bg-yellow-50 border-yellow-500' :
                'bg-gray-50 border-gray-400'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="font-semibold text-gray-900">{scenario.scenario}</div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    scenario.likelihood === 'High' ? 'bg-green-100 text-green-700' :
                    scenario.likelihood === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-200 text-gray-700'
                  }`}>
                    {scenario.likelihood} Likelihood
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-1">Age: {scenario.estimated_age}</div>
                <div className="text-sm text-gray-700 italic">{scenario.reasoning}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification Questions */}
      {irrigation.verification_questions && irrigation.verification_questions.length > 0 && (
        <div className="bg-purple-50 rounded-lg p-5 border border-purple-100">
          <div className="font-semibold text-purple-900 mb-3 text-sm">Questions to Ask During Discovery Call</div>
          <div className="space-y-2">
            {irrigation.verification_questions.map((question: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2.5">
                <div className="w-5 h-5 flex items-center justify-center bg-purple-200 text-purple-900 rounded-full text-xs font-bold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="text-sm text-gray-700 italic">"{question}"</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modernization Opportunities */}
      {irrigation.modernization_opportunities && irrigation.modernization_opportunities.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Modernization Opportunities</h3>
          <div className="space-y-2">
            {irrigation.modernization_opportunities.map((opp: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2.5 bg-white rounded-lg p-4 border border-gray-200">
                <Zap className="w-4 h-4 text-[#E64B8B] flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700">{opp}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smart Irrigation Potential */}
      {activeSection === "upgrade" && (
        <>
          {irrigation.smart_irrigation_potential && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-5 border border-blue-100">
              <div className="font-semibold text-blue-900 mb-2 text-sm">Smart Irrigation Potential</div>
              <div className="text-sm text-gray-700 leading-relaxed">{irrigation.smart_irrigation_potential}</div>
            </div>
          )}

          {/* Upgrade Timing */}
          {irrigation.estimated_upgrade_timing && (
            <div className="flex items-center gap-3 bg-white rounded-lg p-4 border border-gray-200">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <span className="text-sm text-gray-600">Recommended Upgrade Timing:</span>
                <div className="font-semibold text-gray-900">{irrigation.estimated_upgrade_timing}</div>
              </div>
            </div>
          )}
        </>
      )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Services & Costs Tab
function ServicesTab({ serviceMapping, propertyType }: { serviceMapping: any; propertyType?: string }) {
  const [activeSection, setActiveSection] = useState<string>("services");

  const sections = [
    { id: "services", label: "Services", icon: Wrench, available: serviceMapping.recommended_services?.length > 0 },
    { id: "costs", label: "Cost & Time", icon: DollarSign, available: !!serviceMapping.cost_time_analysis },
    { id: "seasonal", label: "Seasonal", icon: Calendar, available: serviceMapping.seasonal_addons?.length > 0 || serviceMapping.future_services?.length > 0 },
  ].filter(s => s.available);

  return (
    <div>
      {/* Mobile: Horizontal Tabs */}
      <div className="lg:hidden mb-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                  ${isActive 
                    ? 'bg-[#E64B8B] text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-700'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: Sidebar + Content */}
      <div className="flex gap-6">
        {/* Left Sidebar Navigation - Desktop Only */}
        <div className="hidden lg:block w-44 flex-shrink-0">
          <div className="sticky top-4 space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-[#E64B8B] text-white shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0">
          <div className="space-y-6">
      {/* Recommended Services */}
      {activeSection === "services" && serviceMapping.recommended_services && serviceMapping.recommended_services.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-4">All Recommended Services</h3>
          <div className="space-y-4">
            {serviceMapping.recommended_services
              .sort((a: any, b: any) => (a.priority || 999) - (b.priority || 999))
              .map((service: any, idx: number) => {
                const isPriority = idx < 2;
                const borderColor = isPriority ? 'border-[#EC6FA0]' : 'border-gray-300';
                
                const categoryStyles = service.category === 'CORE' || service.category === 'SEASONAL'
                  ? 'bg-pink-50 text-[#EC6FA0] border-pink-100'
                  : service.category === 'UPGRADE'
                  ? 'bg-blue-50 text-blue-700 border-blue-100'
                  : 'bg-gray-100 text-gray-700 border-gray-200';
                
                const urgencyColor = service.urgency === 'High' ? 'text-red-600' :
                                     service.urgency === 'Medium' ? 'text-yellow-600' :
                                     'text-gray-600';
                
                return (
                  <div key={idx} className={`bg-white rounded-xl p-6 border-l-4 ${borderColor} shadow-sm`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="font-bold text-lg text-gray-900 mb-1">{service.name}</div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={urgencyColor}>● {service.urgency} Urgency</span>
                          {service.estimated_cost && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-600">{service.estimated_cost}</span>
                            </>
                          )}
                          {service.time_to_implement && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-600">{service.time_to_implement}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className={`${categoryStyles} px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap`}>
                        {service.category}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-700 leading-relaxed mb-4">{service.rationale}</div>
                    
                    {/* Cost Breakdown Section - NEW */}
                    {service.cost_breakdown && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <DollarSign className="w-4 h-4 text-gray-600" />
                          <div className="font-semibold text-gray-900 text-sm">Cost Breakdown</div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 text-xs">
                          {/* Left Column */}
                          <div className="space-y-2">
                            {service.cost_breakdown.hours_per_service && (
                              <div>
                                <span className="text-gray-600 font-medium">Time Required:</span>
                                <div className="text-gray-900 font-semibold">{service.cost_breakdown.hours_per_service}</div>
                              </div>
                            )}
                            {service.cost_breakdown.crew_size && (
                              <div>
                                <span className="text-gray-600 font-medium">Crew Size:</span>
                                <div className="text-gray-900">{service.cost_breakdown.crew_size}</div>
                              </div>
                            )}
                            {service.cost_breakdown.frequency && (
                              <div>
                                <span className="text-gray-600 font-medium">Frequency:</span>
                                <div className="text-gray-900">{service.cost_breakdown.frequency}</div>
                              </div>
                            )}
                          </div>
                          
                          {/* Right Column - Costs */}
                          <div className="space-y-2">
                            {service.cost_breakdown.weekly_cost && (
                              <div>
                                <span className="text-gray-600 font-medium">Weekly:</span>
                                <div className="text-gray-900 font-bold">{service.cost_breakdown.weekly_cost}</div>
                              </div>
                            )}
                            {service.cost_breakdown.monthly_cost && (
                              <div>
                                <span className="text-gray-600 font-medium">Monthly:</span>
                                <div className="text-gray-900 font-bold">{service.cost_breakdown.monthly_cost}</div>
                              </div>
                            )}
                            {service.cost_breakdown.annual_cost && (
                              <div>
                                <span className="text-gray-600 font-medium">Annual:</span>
                                <div className="text-[#E64B8B] font-bold text-base">{service.cost_breakdown.annual_cost}</div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Calculation Method */}
                        {service.cost_breakdown.calculation_method && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-gray-700 font-medium text-xs mb-1">How We Calculated This:</div>
                            <div className="text-gray-600 text-xs italic">{service.cost_breakdown.calculation_method}</div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                      {service.roi_projection && (
                        <div className="flex items-start gap-2.5">
                          <TrendingUp className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ROI</div>
                            <div className="text-sm text-gray-900 font-medium">{service.roi_projection}</div>
                          </div>
                        </div>
                      )}
                      {(service.member_experience_impact || service.customer_experience_impact) && (
                        <div className="flex items-start gap-2.5">
                          <CheckCircle className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Impact</div>
                            <div className="text-sm text-gray-900">{service.member_experience_impact || service.customer_experience_impact}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Cost & Time Analysis */}
      {activeSection === "costs" && serviceMapping.cost_time_analysis && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gray-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Cost & Time Analysis</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-5">
            {/* Current Costs */}
            {serviceMapping.cost_time_analysis.current_estimated_costs && (
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="font-semibold text-gray-900 mb-3">Current Estimated Costs</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Annual Labor:</span>
                    <span className="font-semibold text-gray-900">{serviceMapping.cost_time_analysis.current_estimated_costs.annual_labor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Equipment Costs:</span>
                    <span className="font-semibold text-gray-900">{serviceMapping.cost_time_analysis.current_estimated_costs.equipment_costs}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-700">Total Annual:</span>
                    <span className="font-bold text-gray-900">{serviceMapping.cost_time_analysis.current_estimated_costs.total_annual}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Our Solution Costs */}
            {serviceMapping.cost_time_analysis.our_solution_costs && (
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="font-semibold text-gray-900 mb-3">Our Solution Costs</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Annual Contract:</span>
                    <span className="font-semibold text-[#E64B8B]">{serviceMapping.cost_time_analysis.our_solution_costs.annual_service_contract}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Additional Services:</span>
                    <span className="font-semibold text-gray-900">{serviceMapping.cost_time_analysis.our_solution_costs.additional_services}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Time Savings */}
          {serviceMapping.cost_time_analysis.time_savings && (
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-gray-600" />
                <div className="font-semibold text-gray-900">Time Savings</div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Hours per Week</div>
                  <div className="font-bold text-gray-900">{serviceMapping.cost_time_analysis.time_savings.hours_per_week}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Crew Reduction</div>
                  <div className="font-semibold text-gray-900">{serviceMapping.cost_time_analysis.time_savings.crew_reduction}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Staff Redeployment</div>
                  <div className="text-gray-700">{serviceMapping.cost_time_analysis.time_savings.staff_redeployment}</div>
                </div>
              </div>
            </div>
          )}

          {/* Efficiency Gains */}
          {serviceMapping.cost_time_analysis.efficiency_gains && serviceMapping.cost_time_analysis.efficiency_gains.length > 0 && (
            <div className="mb-5">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Efficiency Gains</div>
              <div className="flex flex-wrap gap-2">
                {serviceMapping.cost_time_analysis.efficiency_gains.map((gain: string, idx: number) => (
                  <span key={idx} className="bg-white px-3 py-2 rounded-lg text-sm text-gray-700 border border-gray-200 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-600" />
                    {gain}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cost Benefit Summary */}
          {serviceMapping.cost_time_analysis.cost_benefit_summary && (
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <div className="font-semibold text-gray-900 mb-2 text-sm">Cost-Benefit Summary</div>
              <div className="text-sm text-gray-700 leading-relaxed">{serviceMapping.cost_time_analysis.cost_benefit_summary}</div>
            </div>
          )}
          
          {/* Irrigation T&M Analysis */}
          {serviceMapping.irrigation_intelligence && (
            <div className="mt-6 bg-blue-50 rounded-xl p-5 border border-blue-200">
              <div className="flex items-start gap-3 mb-4">
                <Wrench className="w-5 h-5 text-blue-700 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900 mb-1">Irrigation Maintenance & T&M Revenue</h3>
                  <p className="text-xs text-gray-600">
                    System: {serviceMapping.irrigation_intelligence.likely_system || 'Unknown'} • Age: {serviceMapping.irrigation_intelligence.most_likely_age || 'Unknown'}
                  </p>
                </div>
              </div>
              
              {/* Annual Contract (Check Time) */}
              <div className="bg-white rounded-lg p-4 mb-3 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-gray-900 text-sm">Annual Maintenance Contract</div>
                  <span className="text-xs text-gray-500 italic">Often bundled or "free" with lawn care</span>
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Spring Startup & Inspection</span>
                    <span className="font-medium">2-3 hours check time</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fall Winterization & Blowout</span>
                    <span className="font-medium">2-3 hours check time</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 text-xs text-gray-600">
                    Contract Value: $300-500/year (or bundled free to win lawn maintenance contract)
                  </div>
                </div>
              </div>
              
              {/* T&M Revenue (The Real Money) */}
              <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                <div className="font-semibold text-gray-900 mb-2 text-sm">💰 T&M Revenue Opportunity</div>
                <p className="text-xs text-gray-600 mb-3 italic">
                  Incremental revenue from repairs found during check visits
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">Broken/Damaged Heads</div>
                      <div className="text-xs text-gray-600">$25-45/head × 5-15 heads = $125-675/year</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">Valve Repairs/Replacements</div>
                      <div className="text-xs text-gray-600">$85/hr labor + $50-200 parts = $150-400/valve</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">Pipe Leaks & Line Breaks</div>
                      <div className="text-xs text-gray-600">$85/hr × 2-4 hours + parts = $250-500/repair</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">Controller Issues</div>
                      <div className="text-xs text-gray-600">$85/hr labor + $100-400 parts = $200-600/repair</div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 bg-green-50 rounded p-2 text-xs">
                  <strong>Typical Annual T&M:</strong> $800-2,500 in incremental repair revenue per customer
                </div>
              </div>
              
              {/* Business Model Note */}
              <div className="mt-3 bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-700 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-gray-700">
                    <strong className="text-yellow-900">Strategy:</strong> Win lawn maintenance contract by including "free" spring/fall irrigation checks. 
                    T&M repairs found during checks become incremental revenue. System age ({serviceMapping.irrigation_intelligence.most_likely_age || '10+ years'}) 
                    = higher repair frequency = more T&M opportunities.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Seasonal Add-ons & Future Services */}
      {activeSection === "seasonal" && (
      <div className="grid md:grid-cols-2 gap-6">
        {serviceMapping.seasonal_addons && serviceMapping.seasonal_addons.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Seasonal Add-Ons</h3>
            <div className="flex flex-wrap gap-2">
              {serviceMapping.seasonal_addons.map((addon: string, idx: number) => (
                <span key={idx} className="bg-white text-[#EC6FA0] px-3 py-2 rounded-full text-sm font-medium border border-pink-200">
                  {addon}
                </span>
              ))}
            </div>
          </div>
        )}

        {serviceMapping.future_services && serviceMapping.future_services.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Future Services</h3>
            <div className="flex flex-wrap gap-2">
              {serviceMapping.future_services.map((service: string, idx: number) => (
                <span key={idx} className="bg-white text-gray-600 px-3 py-2 rounded-full text-sm font-medium border border-gray-200">
                  {service}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Strategy Tab - Comprehensive AI-Powered Sales Playbook
function StrategyTab({ serviceMapping }: { serviceMapping: any }) {
  const insights = serviceMapping.actionable_insights;
  const [activeSection, setActiveSection] = useState<string>("opening");
  
  if (!insights) {
    return <div className="text-center text-gray-500 py-12">No strategy data available</div>;
  }

  const sections = [
    { id: "opening", label: "Opening Strategy", icon: Target, available: !!insights.opening_strategy },
    { id: "value", label: "Value Story", icon: TrendingUp, available: !!insights.value_narrative },
    { id: "pain", label: "Pain Points", icon: Zap, available: insights.pain_point_mapping?.length > 0 },
    { id: "competition", label: "vs Competition", icon: Trophy, available: insights.competitive_positioning?.length > 0 },
    { id: "decision", label: "Decision Maker", icon: Users, available: !!insights.decision_maker_profile },
    { id: "roadmap", label: "Outreach Plan", icon: MessageCircle, available: insights.conversation_roadmap?.length > 0 },
    { id: "closing", label: "Closing Tactics", icon: Target, available: insights.closing_tactics?.length > 0 },
    { id: "risks", label: "Risk Factors", icon: Shield, available: insights.risk_factors?.length > 0 },
    { id: "additional", label: "Additional", icon: Lightbulb, available: true },
  ].filter(s => s.available);

  return (
    <div>
      {/* Mobile: Horizontal Tabs */}
      <div className="lg:hidden mb-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                  ${isActive 
                    ? 'bg-[#E64B8B] text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-700'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: Sidebar + Content */}
      <div className="flex gap-6">
        {/* Left Sidebar Navigation - Desktop Only */}
        <div className="hidden lg:block w-44 flex-shrink-0">
          <div className="sticky top-4 space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-[#E64B8B] text-white shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0">
          <div className="space-y-6">
      {/* Opening Strategy */}
      {activeSection === "opening" && insights.opening_strategy && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gray-100 rounded-lg">
              <Target className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Opening Strategy: How to Make First Contact</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Best Contact Method</div>
              <div className="text-gray-900 font-semibold">{insights.opening_strategy.best_first_contact_method}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Who to Contact</div>
              <div className="text-gray-900 font-semibold">{insights.opening_strategy.ideal_contact_person}</div>
            </div>
          </div>
          
          <div className="mb-5 bg-[#E64B8B]/10 rounded-lg p-5 border border-[#E64B8B]/20">
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Personalized Hook</div>
            <div className="text-gray-900 italic leading-relaxed text-base">"{insights.opening_strategy.personalized_hook}"</div>
          </div>
          
          <div className="mb-5 bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Credibility Builder</div>
            <div className="text-gray-700">{insights.opening_strategy.credibility_builder}</div>
          </div>
          
          <div className="pt-5 border-t border-gray-200">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Call to Action</div>
            <div className="font-bold text-lg text-[#E64B8B]">{insights.opening_strategy.call_to_action}</div>
          </div>
        </div>
      )}

      {/* Value Narrative */}
      {activeSection === "value" && insights.value_narrative && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gray-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Value Story</h3>
          </div>
          
          {insights.value_narrative.roi_headline && (
            <div className="bg-[#E64B8B]/10 rounded-lg p-4 mb-5 border border-[#E64B8B]/30">
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">ROI Headline</div>
              <div className="text-xl font-bold text-[#E64B8B]">{insights.value_narrative.roi_headline}</div>
            </div>
          )}
          
          <div className="space-y-4 text-sm">
            <div>
              <div className="font-semibold text-gray-900 mb-1.5">Current State:</div>
              <div className="text-gray-700 leading-relaxed">{insights.value_narrative.current_state_story}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900 mb-1.5">Future State with Our Services:</div>
              <div className="text-gray-700 leading-relaxed">{insights.value_narrative.desired_future_state}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900 mb-1.5">How We Get There:</div>
              <div className="text-gray-700 leading-relaxed">{insights.value_narrative.transformation_path}</div>
            </div>
          </div>
          
          {insights.value_narrative.proof_points && insights.value_narrative.proof_points.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="font-semibold text-gray-900 mb-2 text-sm">Proof Points:</div>
              <div className="space-y-1">
                {insights.value_narrative.proof_points.map((point: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {insights.value_narrative.risk_reversal && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <div className="font-semibold text-gray-900 mb-1 text-sm">Risk Reversal:</div>
              <div className="text-gray-700 text-sm">{insights.value_narrative.risk_reversal}</div>
            </div>
          )}
        </div>
      )}

      {/* Pain Point Mapping */}
      {activeSection === "pain" && insights.pain_point_mapping && insights.pain_point_mapping.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gray-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Pain Points & Solutions</h3>
          </div>
          
          <div className="space-y-4">
            {insights.pain_point_mapping.map((pain: any, idx: number) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-5">
                <div className="font-bold text-gray-900 mb-2 flex items-start gap-2">
                  <Zap className="w-5 h-5 text-[#E64B8B] flex-shrink-0 mt-0.5" />
                  {pain.pain_point}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Evidence:</span>{' '}
                    <span className="text-gray-600">{pain.evidence}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Business Impact:</span>{' '}
                    <span className="text-gray-600">{pain.impact}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Our Solution:</span>{' '}
                    <span className="text-gray-600">{pain.our_solution}</span>
                  </div>
                </div>
                
                {pain.talking_point && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="bg-gray-50 rounded p-3">
                      <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Talking Point:</div>
                      <div className="text-sm text-gray-900 italic">"{pain.talking_point}"</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitive Positioning */}
      {activeSection === "competition" && insights.competitive_positioning && insights.competitive_positioning.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gray-100 rounded-lg">
              <Trophy className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">How to Beat the Competition</h3>
          </div>
          
          <div className="space-y-4">
            {insights.competitive_positioning.map((comp: any, idx: number) => (
              <div key={idx} className="border-l-4 border-[#E64B8B] bg-gray-50 rounded-r-lg p-5">
                <div className="font-bold text-gray-900 mb-3">vs. {comp.competitor_name}</div>
                
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-gray-700 min-w-[100px]">Their Weakness:</span>
                    <span className="text-gray-600">{comp.their_weakness}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-gray-700 min-w-[100px]">Our Advantage:</span>
                    <span className="text-gray-600">{comp.our_advantage}</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-3 mb-3">
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Differentiation Statement:</div>
                  <div className="text-sm text-gray-900 italic">"{comp.differentiation_statement}"</div>
                </div>
                
                <div className="text-sm">
                  <span className="font-semibold text-gray-700">Win Strategy:</span>{' '}
                  <span className="text-gray-600">{comp.win_strategy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decision Maker Profile */}
      {activeSection === "decision" && insights.decision_maker_profile && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gray-100 rounded-lg">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Decision Maker Intelligence</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-5 text-sm">
            <div>
              <div className="font-semibold text-gray-900 mb-1.5">Primary Decision Maker:</div>
              <div className="text-gray-700">{insights.decision_maker_profile.primary_decision_maker}</div>
            </div>
            
            {insights.decision_maker_profile.influencers && insights.decision_maker_profile.influencers.length > 0 && (
              <div>
                <div className="font-semibold text-gray-900 mb-1.5">Key Influencers:</div>
                <div className="text-gray-700">{insights.decision_maker_profile.influencers.join(', ')}</div>
              </div>
            )}
            
            <div>
              <div className="font-semibold text-gray-900 mb-1.5">Decision Timeline:</div>
              <div className="text-gray-700">{insights.decision_maker_profile.decision_timeline}</div>
            </div>
            
            <div>
              <div className="font-semibold text-gray-900 mb-1.5">Budget Authority:</div>
              <div className="text-gray-700">{insights.decision_maker_profile.budget_authority}</div>
            </div>
          </div>
          
          {insights.decision_maker_profile.key_concerns && insights.decision_maker_profile.key_concerns.length > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-200">
              <div className="font-semibold text-gray-900 mb-2.5">What Keeps Them Up at Night:</div>
              <div className="space-y-1.5">
                {insights.decision_maker_profile.key_concerns.map((concern: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <AlertCircle className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    <span>{concern}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {insights.decision_maker_profile.success_metrics && insights.decision_maker_profile.success_metrics.length > 0 && (
            <div className="mt-4">
              <div className="font-semibold text-gray-900 mb-2.5">Success Metrics They Care About:</div>
              <div className="flex flex-wrap gap-2">
                {insights.decision_maker_profile.success_metrics.map((metric: string, idx: number) => (
                  <span key={idx} className="bg-gray-100 px-3 py-1.5 rounded-full text-sm text-gray-700">
                    {metric}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {insights.decision_maker_profile.personal_motivations && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <div className="font-semibold text-gray-900 mb-1 text-sm">Personal Motivations:</div>
              <div className="text-gray-700 text-sm">{insights.decision_maker_profile.personal_motivations}</div>
            </div>
          )}
        </div>
      )}

      {/* Conversation Roadmap */}
      {activeSection === "roadmap" && insights.conversation_roadmap && insights.conversation_roadmap.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gray-100 rounded-lg">
              <MessageCircle className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Multi-Touch Outreach Sequence</h3>
          </div>
          
          <div className="space-y-4">
            {insights.conversation_roadmap.map((touch: any, idx: number) => (
              <div key={idx} className="relative">
                {idx < insights.conversation_roadmap.length - 1 && (
                  <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gray-200"></div>
                )}
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-[#E64B8B] text-white flex items-center justify-center font-bold">
                      {touch.touch_number}
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-bold text-gray-900">{touch.method}</div>
                      <div className="text-xs text-gray-600 bg-white px-2 py-1 rounded">{touch.timing}</div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">Objective:</span>{' '}
                        <span className="text-gray-600">{touch.objective}</span>
                      </div>
                      
                      {touch.talking_points && touch.talking_points.length > 0 && (
                        <div>
                          <div className="font-semibold text-gray-700 mb-1">Talking Points:</div>
                          <ul className="space-y-1 ml-4">
                            {touch.talking_points.map((point: string, pidx: number) => (
                              <li key={pidx} className="text-gray-600 list-disc">{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <div>
                          <span className="font-semibold text-gray-700">Call to Action:</span>{' '}
                          <span className="text-[#E64B8B] font-medium">{touch.call_to_action}</span>
                        </div>
                      </div>
                      
                      {touch.success_criteria && (
                        <div className="bg-white rounded px-3 py-2 mt-2">
                          <span className="font-semibold text-gray-700 text-xs">Success:</span>{' '}
                          <span className="text-gray-600 text-xs">{touch.success_criteria}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Closing Tactics */}
      {activeSection === "closing" && insights.closing_tactics && insights.closing_tactics.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gray-100 rounded-lg">
              <Target className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Closing Tactics</h3>
          </div>
          
          <div className="space-y-4">
            {insights.closing_tactics.map((tactic: any, idx: number) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-gray-900 text-lg">{tactic.tactic}</div>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">When to Use:</span>{' '}
                    <span className="text-gray-600">{tactic.when_to_use}</span>
                  </div>
                  
                  {tactic.script && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Script:</div>
                      <div className="text-gray-900 italic leading-relaxed">"{tactic.script}"</div>
                    </div>
                  )}
                  
                  <div>
                    <span className="font-semibold text-gray-700">Expected Outcome:</span>{' '}
                    <span className="text-gray-600">{tactic.expected_outcome}</span>
                  </div>
                  
                  {tactic.if_unsuccessful && (
                    <div className="bg-yellow-50 rounded p-3 border border-yellow-200">
                      <span className="font-semibold text-yellow-900 text-xs">If Unsuccessful:</span>{' '}
                      <span className="text-yellow-800 text-xs">{tactic.if_unsuccessful}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Factors */}
      {activeSection === "risks" && insights.risk_factors && insights.risk_factors.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gray-100 rounded-lg">
              <Shield className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Risk Factors & Mitigation</h3>
          </div>
          
          <div className="space-y-3">
            {insights.risk_factors.map((risk: any, idx: number) => (
              <div key={idx} className={`rounded-lg p-4 border-l-4 ${
                risk.likelihood === 'High' ? 'bg-red-50 border-red-500' :
                risk.likelihood === 'Medium' ? 'bg-yellow-50 border-yellow-500' :
                'bg-gray-50 border-gray-400'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="font-semibold text-gray-900">{risk.risk}</div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    risk.likelihood === 'High' ? 'bg-red-100 text-red-700' :
                    risk.likelihood === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {risk.likelihood} Risk
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Mitigation:</span>{' '}
                    <span className="text-gray-600">{risk.mitigation}</span>
                  </div>
                  
                  {risk.discovery_question && (
                    <div className="bg-white rounded p-3 mt-2">
                      <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Discovery Question:</div>
                      <div className="text-gray-900 italic text-sm">"{risk.discovery_question}"</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Section */}
      {activeSection === "additional" && (
        <div className="space-y-6">
      {/* Timing Recommendation */}
      {insights.timing_recommendation && (
        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
          <div className="flex items-start gap-3 mb-2">
            <Calendar className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div className="font-semibold text-gray-900">Best Approach Time</div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  insights.timing_recommendation.urgency_level === 'High' ? 'bg-red-100 text-red-700' :
                  insights.timing_recommendation.urgency_level === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {insights.timing_recommendation.urgency_level} Urgency
                </span>
              </div>
              <div className="text-sm text-gray-700 mb-2">{insights.timing_recommendation.best_approach_time}</div>
              <div className="text-sm text-gray-600 italic">{insights.timing_recommendation.reasoning}</div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Planning */}
      {insights.budget_planning && (
        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
          <div className="font-semibold text-gray-900 mb-3">Budget Planning</div>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium text-gray-700">Project Costs:</span> {insights.budget_planning.typical_project_costs}</div>
            <div><span className="font-medium text-gray-700">Payment Options:</span> {insights.budget_planning.payment_structures}</div>
            <div><span className="font-medium text-gray-700">ROI Timeline:</span> {insights.budget_planning.ROI_timeline}</div>
          </div>
        </div>
      )}

      {/* Priority Opportunities */}
      {insights.priority_opportunities && insights.priority_opportunities.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Priority Opportunities</h3>
          <div className="space-y-3">
            {insights.priority_opportunities.map((opp: any, idx: number) => (
              <div key={idx} className="bg-[#E64B8B]/5 rounded-lg p-4 border border-[#E64B8B]/20">
                <div className="font-semibold text-[#E64B8B] mb-1.5">{opp.opportunity}</div>
                <div className="text-sm text-gray-700 mb-2">{opp.why}</div>
                {opp.talking_points && opp.talking_points.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {opp.talking_points.map((point: string, pidx: number) => (
                      <div key={pidx} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-[#E64B8B]">→</span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Objection Handling */}
      {insights.objection_handling && insights.objection_handling.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Objection Handling</h3>
          <div className="space-y-3">
            {insights.objection_handling.map((obj: any, idx: number) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start gap-2.5 mb-2">
                  <AlertCircle className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="font-medium text-gray-900 text-sm">{obj.objection}</div>
                </div>
                <div className="pl-6.5 text-sm text-gray-700">{obj.response}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversation Starters */}
      {insights.conversation_starters && insights.conversation_starters.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Conversation Starters</h3>
          <div className="space-y-2">
            {insights.conversation_starters.map((starter: string, idx: number) => (
              <div key={idx} className="bg-white rounded-lg p-4 border-l-4 border-[#E64B8B] shadow-sm">
                <div className="text-sm text-gray-700 italic">"{starter}"</div>
              </div>
            ))}
          </div>
        </div>
      )}
        </div>
      )}
        </div>
      </div>
      </div>
    </div>
  );
}