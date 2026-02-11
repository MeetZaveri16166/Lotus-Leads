import { useState, useEffect } from "react";
import { MapPin, Sprout, Target, ChevronDown, ChevronRight, Sparkles, RefreshCw, CheckCircle, Circle, Loader2, ExternalLink, Globe, X, Maximize2 } from "lucide-react";
import { PropertyAnalysisDisplay } from "@/app/components/PropertyAnalysisDisplay";
import { Stage3Tabs } from "@/app/components/Stage3Tabs";
import { BusinessIntelligenceDisplay } from "@/app/components/BusinessIntelligenceDisplay";

interface OpportunityStageNavigatorProps {
  // Lead data
  lead: any;
  
  // Stage 1: Geo Enrichment
  geoEnrichment: any;
  geoLoading: boolean;
  onRunGeoEnrichment: () => void;
  googleMapsKey: string;
  
  // Stage 2: Property Analysis
  propertyAnalysis: any;
  analysisLoading: boolean;
  onRunPropertyAnalysis: () => void;
  
  // Stage 3: Service Mapping
  serviceMapping: any;
  serviceMappingLoading: boolean;
  onRunServiceMapping: () => void;
  
  // Full Analysis
  onRunFullAnalysis: () => void;
}

type StageKey = "geo" | "property" | "service";

interface StageStatus {
  status: "complete" | "loading" | "pending" | "disabled";
  canRun: boolean;
}

export function OpportunityStageNavigator({
  lead,
  geoEnrichment,
  geoLoading,
  onRunGeoEnrichment,
  googleMapsKey,
  propertyAnalysis,
  analysisLoading,
  onRunPropertyAnalysis,
  serviceMapping,
  serviceMappingLoading,
  onRunServiceMapping,
  onRunFullAnalysis,
}: OpportunityStageNavigatorProps) {
  const [activeStage, setActiveStage] = useState<StageKey>("geo");
  const [expandedStages, setExpandedStages] = useState<Set<StageKey>>(new Set(["geo"]));
  const [mapFullscreen, setMapFullscreen] = useState(false);

  // Auto-expand active stage and collapse others on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        // Desktop: only expand active stage
        setExpandedStages(new Set([activeStage]));
      } else {
        // Mobile: keep all expanded or handle differently
        // For now, keep current behavior
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeStage]);

  // Calculate stage status
  const getStageStatus = (stage: StageKey): StageStatus => {
    switch (stage) {
      case "geo":
        return {
          status: geoLoading ? "loading" : geoEnrichment ? "complete" : "pending",
          canRun: !!(lead?.company_street || lead?.company_city),
        };
      case "property":
        return {
          status: analysisLoading ? "loading" : propertyAnalysis ? "complete" : !geoEnrichment ? "disabled" : "pending",
          canRun: !!geoEnrichment,
        };
      case "service":
        return {
          status: serviceMappingLoading ? "loading" : serviceMapping ? "complete" : !propertyAnalysis ? "disabled" : "pending",
          canRun: !!propertyAnalysis,
        };
    }
  };

  const stages = [
    {
      key: "geo" as StageKey,
      label: "Geo Enrichment",
      shortLabel: "Geo",
      icon: MapPin,
      subtitle: "Address → Physical context",
      description: "Google Maps API for satellite imagery and location analysis",
    },
    {
      key: "property" as StageKey,
      label: "Property Analysis",
      shortLabel: "Property",
      icon: Sprout,
      subtitle: "AI Vision + Public Data → Property intelligence",
      description: "OpenAI analyzes property features from satellite imagery",
    },
    {
      key: "service" as StageKey,
      label: "Service Mapping",
      shortLabel: "Service",
      icon: Target,
      subtitle: "Property needs + Season → What to sell",
      description: "Comprehensive business intelligence and sales recommendations",
    },
  ];

  const toggleStageExpansion = (stageKey: StageKey) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageKey)) {
      newExpanded.delete(stageKey);
    } else {
      newExpanded.add(stageKey);
    }
    setExpandedStages(newExpanded);
  };

  const handleStageClick = (stageKey: StageKey) => {
    setActiveStage(stageKey);
    // Auto-expand on mobile
    if (window.innerWidth < 1024) {
      const newExpanded = new Set(expandedStages);
      newExpanded.add(stageKey);
      setExpandedStages(newExpanded);
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "loading":
        return <Loader2 className="w-4 h-4 text-[#E64B8B] animate-spin" />;
      case "disabled":
        return <Circle className="w-4 h-4 text-gray-300" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSummaryText = (stageKey: StageKey): string | null => {
    const stageStatus = getStageStatus(stageKey);
    if (stageStatus.status !== "complete") return null;

    switch (stageKey) {
      case "geo":
        if (!geoEnrichment) return null;
        return `${geoEnrichment.city || "Unknown"}, ${geoEnrichment.state || "Unknown"} · ${geoEnrichment.lat?.toFixed(4) || ""}°, ${geoEnrichment.lng?.toFixed(4) || ""}°`;
      case "property":
        if (!propertyAnalysis) return null;
        const parts = [];
        if (propertyAnalysis.property_type) parts.push(propertyAnalysis.property_type);
        if (propertyAnalysis.lot_size_acres) parts.push(`${propertyAnalysis.lot_size_acres} acres`);
        if (propertyAnalysis.property_condition) parts.push(propertyAnalysis.property_condition);
        return parts.join(" · ") || null;
      case "service":
        if (!serviceMapping) return null;
        const summaryParts = [];
        if (serviceMapping.context?.estimated_annual_value) summaryParts.push(serviceMapping.context.estimated_annual_value);
        if (serviceMapping.context?.opportunity_score) summaryParts.push(`${serviceMapping.context.opportunity_score} Opportunity`);
        return summaryParts.join(" · ") || null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Run Full Analysis Button - Prominent Action */}
      <div className="bg-gradient-to-br from-[#E64B8B]/5 to-pink-50/30 rounded-2xl p-6 border-l-4 border-[#E64B8B]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#E64B8B]" />
              Complete Business Intelligence Analysis
            </h3>
            <p className="text-sm text-gray-600">
              Run all 3 stages sequentially: Geo Enrichment → Property Analysis → Service Mapping
            </p>
          </div>
          <button
            onClick={onRunFullAnalysis}
            disabled={geoLoading || analysisLoading || serviceMappingLoading || !getStageStatus("geo").canRun}
            className={`
              flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg
              ${geoLoading || analysisLoading || serviceMappingLoading || !getStageStatus("geo").canRun
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-[#E64B8B] to-[#d43d7a] text-white hover:shadow-xl hover:scale-105 active:scale-95"
              }
            `}
          >
            <Sparkles className="w-4 h-4" />
            {geoLoading || analysisLoading || serviceMappingLoading ? "Running..." : "Run Full Analysis"}
          </button>
        </div>
      </div>

      {/* Progress Stepper - Sticky on mobile, part of layout on desktop */}
      <div className="lg:hidden sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 -mx-6 px-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {stages.map((stage, index) => {
            const stageStatus = getStageStatus(stage.key);
            const isActive = activeStage === stage.key;
            const Icon = stage.icon;

            return (
              <div key={stage.key} className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleStageClick(stage.key)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all border
                    ${isActive 
                      ? 'bg-white text-[#E64B8B] border-[#E64B8B] shadow-sm' 
                      : stageStatus.status === 'complete'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : stageStatus.status === 'disabled'
                      ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-gray-50 text-gray-700 border-gray-200'
                    }
                  `}
                  disabled={stageStatus.status === 'disabled'}
                >
                  <Icon className="w-4 h-4" />
                  <span>{index + 1}. {stage.shortLabel}</span>
                  <StatusIcon status={stageStatus.status} />
                </button>
                {index < stages.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Layout: Sidebar (desktop) + Stage Content */}
      <div className="flex gap-6">
        {/* Left Sidebar - Desktop Only */}
        <div className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-4 space-y-2">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">
              Analysis Stages
            </div>
            {stages.map((stage, index) => {
              const stageStatus = getStageStatus(stage.key);
              const isActive = activeStage === stage.key;
              const Icon = stage.icon;

              return (
                <button
                  key={stage.key}
                  onClick={() => handleStageClick(stage.key)}
                  disabled={stageStatus.status === 'disabled'}
                  className={`
                    w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-all border
                    ${isActive 
                      ? 'bg-gray-50 text-gray-900 border-[#E64B8B]' 
                      : stageStatus.status === 'complete'
                      ? 'text-gray-900 hover:bg-gray-50 border-gray-200'
                      : stageStatus.status === 'disabled'
                      ? 'text-gray-400 cursor-not-allowed opacity-60 border-gray-200'
                      : 'text-gray-700 hover:bg-gray-50 border-gray-200'
                    }
                    disabled:cursor-not-allowed
                  `}
                >
                  <div className={`flex-shrink-0 mt-0.5 ${isActive ? 'text-[#E64B8B]' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        {index + 1}. {stage.label}
                      </span>
                      <StatusIcon status={stageStatus.status} />
                    </div>
                    <div className={`text-xs ${isActive ? 'text-gray-600' : 'text-gray-500'}`}>
                      {stage.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Quick Stats */}
            <div className="mt-6 pt-6 border-t border-gray-200 px-3 space-y-2">
              <div className="text-xs font-medium text-gray-500">Progress</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#E64B8B] transition-all duration-500"
                    style={{ 
                      width: `${(stages.filter(s => getStageStatus(s.key).status === 'complete').length / stages.length) * 100}%` 
                    }}
                  />
                </div>
                <div className="text-xs font-bold text-gray-700">
                  {stages.filter(s => getStageStatus(s.key).status === 'complete').length}/{stages.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stage Content Area */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Stage 1: Geo Enrichment */}
          <StageCard
            stage={stages[0]}
            stageStatus={getStageStatus("geo")}
            isActive={activeStage === "geo"}
            isExpanded={expandedStages.has("geo")}
            onToggleExpand={() => toggleStageExpansion("geo")}
            onStageClick={() => handleStageClick("geo")}
            summary={getSummaryText("geo")}
            actionButton={
              <button
                onClick={onRunGeoEnrichment}
                disabled={geoLoading || !getStageStatus("geo").canRun}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border disabled:opacity-50 disabled:cursor-not-allowed
                  ${geoEnrichment
                    ? "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    : "bg-white text-[#E64B8B] border-[#E64B8B] hover:bg-[#E64B8B] hover:text-white"
                  }
                `}
              >
                {geoEnrichment ? <RefreshCw className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                {geoLoading ? "Enriching..." : geoEnrichment ? "Re-analyze" : "Run Geo Enrichment"}
              </button>
            }
          >
            <div className="space-y-8">
              {/* Input Section */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Input</h3>
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {lead?.company_street && <div>{lead.company_street}</div>}
                      <div>
                        {[lead?.company_city, lead?.company_state, lead?.company_postal_code]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                      {lead?.company_country && <div>{lead.company_country}</div>}
                      {!lead?.company_street && !lead?.company_city && (
                        <span className="text-gray-400 italic">No address available</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Analysis */}
              {geoEnrichment && geoEnrichment.lat && geoEnrichment.lng && googleMapsKey && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Visual Analysis</h3>
                    <button
                      onClick={() => setMapFullscreen(!mapFullscreen)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#EC6FA0] hover:text-[#d85f93] transition-colors"
                    >
                      {mapFullscreen ? (
                        <>
                          <X className="w-3.5 h-3.5" />
                          Close Fullscreen
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3.5 h-3.5" />
                          Enlarge Map
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className={`transition-all duration-300 ${mapFullscreen ? 'fixed inset-0 z-50 bg-white p-6' : 'relative'}`}>
                    {mapFullscreen && (
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Interactive Map View</h3>
                        <button
                          onClick={() => setMapFullscreen(false)}
                          className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Close
                        </button>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 gap-4">
                      {/* Static Satellite Image */}
                      {geoEnrichment.image_url ? (
                        <div className={`bg-gray-50 border-2 border-gray-200 rounded-xl overflow-hidden ${!mapFullscreen && 'hover:border-[#EC6FA0] transition-all duration-200'}`}>
                          <img 
                            src={geoEnrichment.image_url} 
                            alt="Satellite view of property"
                            className="w-full h-auto"
                            onError={(e) => {
                              console.error('[SATELLITE IMAGE] Failed to load:', geoEnrichment.image_url);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 text-center">
                          <p className="text-sm text-amber-800">
                            <strong>Note:</strong> Static satellite image not available. The interactive map below shows the location.
                          </p>
                        </div>
                      )}
                      
                      {/* Interactive Google Maps Embed */}
                      <div className={`bg-gray-50 border-2 border-gray-200 rounded-xl overflow-hidden ${!mapFullscreen && 'hover:border-[#EC6FA0] transition-all duration-200'}`}>
                        <iframe
                          width="100%"
                          height={mapFullscreen ? "calc(100vh - 150px)" : "400"}
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          src={`https://www.google.com/maps/embed/v1/view?key=${googleMapsKey}&center=${geoEnrichment.lat},${geoEnrichment.lng}&zoom=19&maptype=satellite`}
                        />
                      </div>
                      
                      {!mapFullscreen && (
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            Interactive view at {geoEnrichment.lat?.toFixed(6)}, {geoEnrichment.lng?.toFixed(6)}
                          </div>
                          <a
                            href={`https://www.google.com/maps?q=${geoEnrichment.lat},${geoEnrichment.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#EC6FA0] hover:text-[#d85f93] transition-colors"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            Open in Google Maps
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Output Section - Real Data */}
              {geoEnrichment && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Location Data</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">City</div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">{geoEnrichment.city || "—"}</div>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">State</div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">{geoEnrichment.state || "—"}</div>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Region</div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">{geoEnrichment.region || "Unknown"}</div>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Latitude</div>
                      <div className="text-lg font-bold text-gray-900 mb-1">{geoEnrichment.lat?.toFixed(6) || "—"}</div>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Longitude</div>
                      <div className="text-lg font-bold text-gray-900 mb-1">{geoEnrichment.lng?.toFixed(6) || "—"}</div>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Country</div>
                      <div className="text-xl font-bold text-gray-900 mb-1">{geoEnrichment.country || "—"}</div>
                    </div>
                  </div>
                </div>
              )}

              {geoEnrichment && (
                <div className="bg-pink-50 border border-pink-100 rounded-xl p-5">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    <strong className="text-gray-900">Location verified:</strong> Property located in {geoEnrichment.city}, {geoEnrichment.state} ({geoEnrichment.region} region). Satellite imagery captured at coordinates {geoEnrichment.lat?.toFixed(6)}, {geoEnrichment.lng?.toFixed(6)}.
                  </p>
                </div>
              )}
              
              {/* Business Intelligence Section */}
              {geoEnrichment && geoEnrichment.business_intelligence && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Business Intelligence & Conversation Starters</h3>
                  <BusinessIntelligenceDisplay businessIntelligence={geoEnrichment.business_intelligence} />
                </div>
              )}
              
              {!geoEnrichment && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Geo Enrichment Data</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Click "Run Geo Enrichment" above to fetch satellite imagery and location data for this property.
                  </p>
                </div>
              )}
            </div>
          </StageCard>

          {/* Stage 2: Property Analysis */}
          <StageCard
            stage={stages[1]}
            stageStatus={getStageStatus("property")}
            isActive={activeStage === "property"}
            isExpanded={expandedStages.has("property")}
            onToggleExpand={() => toggleStageExpansion("property")}
            onStageClick={() => handleStageClick("property")}
            summary={getSummaryText("property")}
            actionButton={
              <button
                onClick={onRunPropertyAnalysis}
                disabled={analysisLoading || !getStageStatus("property").canRun}
                className={`
                  inline-flex items-center gap-2 font-medium py-2.5 px-5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                  ${propertyAnalysis
                    ? "bg-white text-[#EC6FA0] border-2 border-[#EC6FA0] hover:bg-pink-50"
                    : "bg-[#EC6FA0] text-white hover:bg-[#d85f93]"
                  }
                `}
              >
                {propertyAnalysis ? <RefreshCw className="w-4 h-4" /> : <Sprout className="w-4 h-4" />}
                {analysisLoading ? "Analyzing..." : propertyAnalysis ? "Re-analyze" : "Run Property Analysis"}
              </button>
            }
          >
            <div className="space-y-8">
              {propertyAnalysis ? (
                <PropertyAnalysisDisplay 
                  propertyAnalysis={propertyAnalysis} 
                  geoEnrichment={geoEnrichment}
                  googleMapsKey={googleMapsKey}
                />
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                  <Sprout className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {!geoEnrichment ? "Stage 1 Required" : "No Property Analysis Data"}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {!geoEnrichment 
                      ? "Run Geo Enrichment first to capture satellite imagery for AI analysis."
                      : "Click \"Run Property Analysis\" above to infer property features and intelligence."
                    }
                  </p>
                </div>
              )}
            </div>
          </StageCard>

          {/* Stage 3: Service Mapping */}
          <StageCard
            stage={stages[2]}
            stageStatus={getStageStatus("service")}
            isActive={activeStage === "service"}
            isExpanded={expandedStages.has("service")}
            onToggleExpand={() => toggleStageExpansion("service")}
            onStageClick={() => handleStageClick("service")}
            summary={getSummaryText("service")}
            actionButton={
              <button
                onClick={onRunServiceMapping}
                disabled={serviceMappingLoading || !getStageStatus("service").canRun}
                className={`
                  inline-flex items-center gap-2 font-medium py-2.5 px-5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                  ${serviceMapping
                    ? "bg-white text-[#EC6FA0] border-2 border-[#EC6FA0] hover:bg-pink-50"
                    : "bg-[#EC6FA0] text-white hover:bg-[#d85f93]"
                  }
                `}
              >
                {serviceMapping ? <RefreshCw className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                {serviceMappingLoading ? "Analyzing..." : serviceMapping ? "Re-analyze" : "Run Service Mapping"}
              </button>
            }
          >
            <div className="space-y-8">
              {serviceMapping ? (
                <Stage3Tabs 
                  serviceMapping={serviceMapping} 
                  propertyType={propertyAnalysis?.property_type}
                />
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                  <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {!propertyAnalysis ? "Stage 2 Required" : "No Service Mapping Data"}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {!propertyAnalysis
                      ? "Run Property Analysis first to analyze property features for service recommendations."
                      : "Click \"Run Service Mapping\" above to generate comprehensive business intelligence."
                    }
                  </p>
                </div>
              )}
            </div>
          </StageCard>
        </div>
      </div>
    </div>
  );
}

// Reusable Stage Card Component
interface StageCardProps {
  stage: {
    key: StageKey;
    label: string;
    icon: any;
    subtitle: string;
    description: string;
  };
  stageStatus: StageStatus;
  isActive: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStageClick: () => void;
  summary: string | null;
  actionButton: React.ReactNode;
  children: React.ReactNode;
}

function StageCard({
  stage,
  stageStatus,
  isActive,
  isExpanded,
  onToggleExpand,
  onStageClick,
  summary,
  actionButton,
  children,
}: StageCardProps) {
  const Icon = stage.icon;
  const showBadge = stageStatus.status === "complete" || stageStatus.status === "loading";

  return (
    <div 
      className={`
        bg-white rounded-2xl overflow-hidden transition-all
        ${isActive ? 'shadow-lg shadow-[#E64B8B]/10' : 'shadow-sm'}
      `}
    >
      {/* Header - Always Visible */}
      <div 
        className={`
          p-4 md:p-6 cursor-pointer
          ${isActive ? 'bg-gradient-to-r from-[#E64B8B]/5 to-pink-50/30 border-b-2 border-[#E64B8B]' : 'bg-gray-50/50'}
        `}
        onClick={() => {
          onStageClick();
          // Auto-expand when clicking the card
          if (!isExpanded) {
            onToggleExpand();
          }
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-2.5 rounded-xl flex-shrink-0 transition-colors ${isActive ? 'bg-white shadow-sm' : 'bg-white'}`}>
              <Icon className={`w-5 h-5 md:w-6 md:h-6 ${isActive ? 'text-[#E64B8B]' : 'text-gray-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-base md:text-lg font-bold text-gray-900">{stage.label}</h2>
                {showBadge && stageStatus.status === "complete" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-semibold rounded-md border border-green-200">
                    <CheckCircle className="w-3 h-3" />
                    Complete
                  </span>
                )}
                {showBadge && stageStatus.status === "loading" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-pink-50 text-[#E64B8B] text-xs font-semibold rounded-md border border-pink-200">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Processing
                  </span>
                )}
              </div>
              <p className="text-xs md:text-sm text-gray-600">{stage.subtitle}</p>
              
              {/* Summary - Show when collapsed and complete */}
              {!isExpanded && summary && (
                <div className="mt-2 text-xs md:text-sm text-gray-700 font-medium">
                  {summary}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-end md:items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Expand/Collapse Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="p-2 hover:bg-white rounded-lg transition-colors"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>
        </div>
        
        {/* Action Button - Mobile: Full width below header */}
        {isExpanded && (
          <div className="mt-3 md:mt-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-full md:w-auto">
              {actionButton}
            </div>
          </div>
        )}
      </div>

      {/* Content - Collapsible */}
      {isExpanded && (
        <div className="p-4 md:p-6 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}