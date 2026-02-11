import { AlertTriangle, CheckCircle, TrendingUp, MessageCircle, Lightbulb, DollarSign, MapPin, BarChart3, Clock, Zap } from "lucide-react";
import { PreAnalysisDisplay } from "@/app/components/PreAnalysisDisplay";
import { SocialIntelligenceDisplay } from "@/app/components/SocialIntelligenceDisplay";
import { useState } from "react";

interface PropertyAnalysisDisplayProps {
  propertyAnalysis: any;
  geoEnrichment: any;
  googleMapsKey?: string; // Add this prop
}

export function PropertyAnalysisDisplay({ propertyAnalysis, geoEnrichment, googleMapsKey }: PropertyAnalysisDisplayProps) {
  const [selectedTile, setSelectedTile] = useState<{ idx: number; lat: number; lng: number; tag?: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(19);
  
  if (!propertyAnalysis) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-gray-400" />
        </div>
        <h4 className="text-base font-semibold text-gray-800 mb-2">Property Analysis Required</h4>
        <p className="text-sm text-gray-500">
          Run Property Analysis to generate AI-powered insights
        </p>
      </div>
    );
  }

  const { vision_analysis } = propertyAnalysis;
  const hasPropertyIntelligence = vision_analysis?.observed_features;
  
  // Extract metadata
  const analysisMetadata = propertyAnalysis?.analysis_metadata;
  const preAnalysis = propertyAnalysis?.pre_analysis;
  const isMultiTile = analysisMetadata?.mode === "multi-tile";
  const satelliteTiles = analysisMetadata?.satellite_tiles || [];
  const tileMetadata = analysisMetadata?.tile_metadata || [];

  return (
    <div className="space-y-6">
      {/* ========== ANALYSIS OVERVIEW ========== */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-[#E64B8B] rounded-full"></div>
            <h2 className="text-base font-semibold text-gray-900">Property Analysis Overview</h2>
          </div>
          {isMultiTile && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              Multi-Zone Analysis
            </span>
          )}
        </div>
        
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {preAnalysis?.size_analysis?.estimated_acres && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Estimated Size
              </div>
              <div className="text-xl font-bold text-gray-900 mb-1">
                {preAnalysis.size_analysis.estimated_acres}
              </div>
              <div className="text-xs text-gray-600">
                {preAnalysis.size_analysis.estimated_size_category}
              </div>
            </div>
          )}
          
          {preAnalysis?.property_identification?.primary_type && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Property Type
              </div>
              <div className="text-base font-semibold text-gray-900 capitalize leading-tight">
                {preAnalysis.property_identification.primary_type.replace(/_/g, ' ')}
              </div>
            </div>
          )}
          
          {analysisMetadata?.tile_count && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Tiles Analyzed
              </div>
              <div className="text-xl font-bold text-gray-900 mb-1">
                {analysisMetadata.tile_count}
              </div>
              <div className="text-xs text-gray-600">
                {analysisMetadata.grid_size} grid
              </div>
            </div>
          )}
          
          {vision_analysis?.technical_estimates?.estimated_mowing_hours_per_week && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Mowing Time/Week
              </div>
              <div className="text-xl font-bold text-gray-900 mb-1">
                {vision_analysis.technical_estimates.estimated_mowing_hours_per_week}
              </div>
              <div className="text-xs text-gray-600">
                hours
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========== SATELLITE IMAGERY (if multi-tile) ========== */}
      {satelliteTiles.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-5 bg-[#E64B8B] rounded-full"></div>
            <h3 className="text-base font-semibold text-gray-900">Satellite Imagery Analysis</h3>
          </div>
          
          <div className={`grid gap-3 ${
            satelliteTiles.length === 4 ? 'grid-cols-2' :
            satelliteTiles.length === 9 ? 'grid-cols-3' :
            'grid-cols-2 md:grid-cols-3'
          }`}>
            {satelliteTiles.map((tileUrl: string, idx: number) => {
              const tileMeta = tileMetadata[idx];
              const tag = tileMeta?.tag || `${idx + 1}`;
              
              // Calculate coordinates if not in metadata
              const gridSize = satelliteTiles.length === 9 ? 3 : satelliteTiles.length === 4 ? 2 : 1;
              const row = Math.floor(idx / gridSize);
              const col = idx % gridSize;
              const centerLat = geoEnrichment?.latitude || geoEnrichment?.lat || 0;
              const centerLng = geoEnrichment?.longitude || geoEnrichment?.lng || 0;
              const latOffset = (1 - row) * 0.003;
              const lngOffset = (col - 1) * 0.003;
              const tileLat = tileMeta?.lat || (centerLat + latOffset);
              const tileLng = tileMeta?.lng || (centerLng + lngOffset);
              
              return (
                <div 
                  key={idx} 
                  className="relative group cursor-pointer"
                  onClick={() => {
                    setZoomLevel(19);
                    setSelectedTile({ idx: idx + 1, lat: tileLat, lng: tileLng, tag });
                  }}
                >
                  <img 
                    src={tileUrl} 
                    alt={`Zone ${tag}`}
                    className="w-full h-auto rounded-lg border border-gray-300 shadow-sm group-hover:shadow-md group-hover:border-gray-400 transition-all"
                    style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                  />
                  {/* Zone Tag */}
                  <div className="absolute top-2 left-2 bg-gray-900 bg-opacity-80 text-white text-xs font-semibold px-2 py-1 rounded">
                    {tag}
                  </div>
                  {/* Hover Indicator */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white rounded-full p-2 shadow-lg">
                      <Zap className="w-4 h-4 text-gray-700" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <p className="text-xs text-gray-500 mt-3">
            Click any zone to view detailed satellite view
          </p>
        </div>
      )}

      {/* Zoom Modal */}
      {selectedTile && (geoEnrichment?.latitude || geoEnrichment?.lat) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTile(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white text-gray-900 rounded w-8 h-8 flex items-center justify-center font-semibold text-sm">
                  {selectedTile.tag || selectedTile.idx}
                </div>
                <div>
                  <h3 className="text-base font-semibold">Zone {selectedTile.tag || selectedTile.idx}</h3>
                  <p className="text-xs text-gray-300">
                    {selectedTile.lat.toFixed(6)}, {selectedTile.lng.toFixed(6)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTile(null)}
                className="text-white hover:bg-white hover:bg-opacity-10 rounded p-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Map */}
            <div className="relative w-full h-[600px] bg-gray-100">
              <iframe
                key={zoomLevel}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/view?key=${googleMapsKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&center=${selectedTile.lat},${selectedTile.lng}&zoom=${zoomLevel}&maptype=satellite`}
              />
              {/* Zoom Controls */}
              <div className="absolute top-4 right-4 bg-white rounded shadow-lg overflow-hidden">
                <button
                  onClick={() => setZoomLevel(prev => Math.min(21, prev + 1))}
                  disabled={zoomLevel >= 21}
                  className="w-10 h-10 flex items-center justify-center border-b border-gray-200 hover:bg-gray-50 disabled:opacity-30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <div className="w-10 h-8 flex items-center justify-center bg-gray-50 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-700">{zoomLevel}</span>
                </div>
                <button
                  onClick={() => setZoomLevel(prev => Math.max(10, prev - 1))}
                  disabled={zoomLevel <= 10}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
              <button
                onClick={() => setSelectedTile(null)}
                className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== PROPERTY OBSERVATIONS ========== */}
      {hasPropertyIntelligence && vision_analysis.observed_features && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-5 bg-[#E64B8B] rounded-full"></div>
            <h3 className="text-base font-semibold text-gray-900">Property Observations</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {vision_analysis.observed_features.map((feature: string, idx: number) => (
              <div key={idx} className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 leading-relaxed">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== RISKS & OPPORTUNITIES ========== */}
      {(vision_analysis?.property_risks || vision_analysis?.property_opportunities) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risks */}
          {vision_analysis.property_risks && vision_analysis.property_risks.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-base font-semibold text-gray-700">Risk Factors</h3>
              </div>
              <div className="space-y-3">
                {vision_analysis.property_risks.map((risk: any, idx: number) => (
                  <div key={idx} className="border-l-2 border-red-500 bg-red-50 rounded-r-lg p-4">
                    <div className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1">
                      {risk.feature}
                    </div>
                    <div className="text-sm font-semibold text-gray-800 mb-1">{risk.risk}</div>
                    <div className="text-xs text-gray-600">{risk.impact}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Opportunities */}
          {vision_analysis.property_opportunities && vision_analysis.property_opportunities.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="text-base font-semibold text-gray-700">Opportunities</h3>
              </div>
              <div className="space-y-3">
                {vision_analysis.property_opportunities.map((opp: any, idx: number) => (
                  <div key={idx} className="border-l-2 border-green-500 bg-green-50 rounded-r-lg p-4">
                    <div className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1">
                      {opp.feature}
                    </div>
                    <div className="text-sm font-semibold text-gray-800 mb-1">{opp.opportunity}</div>
                    <div className="text-xs text-gray-600">{opp.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== SERVICE RECOMMENDATIONS ========== */}
      {vision_analysis?.service_recommendations && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-5 bg-[#E64B8B] rounded-full"></div>
            <h3 className="text-base font-semibold text-gray-900">Service Recommendations</h3>
          </div>
          
          <div className="space-y-4">
            {vision_analysis.service_recommendations.map((rec: any, idx: number) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#E64B8B] bg-opacity-10 text-[#E64B8B] rounded-lg flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-gray-800 mb-3">{rec.service}</div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide w-20 flex-shrink-0">Feature</span>
                        <span className="text-sm text-gray-700">{rec.feature}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide w-20 flex-shrink-0">Problem</span>
                        <span className="text-sm text-gray-700">{rec.problem}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide w-20 flex-shrink-0">Solution</span>
                        <span className="text-sm text-gray-700">{rec.reasoning}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== CONVERSATION STARTERS ========== */}
      {vision_analysis?.conversation_starters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-5 bg-[#E64B8B] rounded-full"></div>
            <h3 className="text-base font-semibold text-gray-900">Conversation Starters</h3>
          </div>
          
          <div className="space-y-3">
            {vision_analysis.conversation_starters.map((starter: string, idx: number) => (
              <div key={idx} className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="w-6 h-6 bg-[#E64B8B] bg-opacity-10 text-[#E64B8B] rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0">
                  {idx + 1}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{starter}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== TECHNICAL ESTIMATES ========== */}
      {vision_analysis?.technical_estimates && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-5 bg-[#E64B8B] rounded-full"></div>
            <h3 className="text-base font-semibold text-gray-900">Technical Estimates</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {vision_analysis.technical_estimates.approx_total_turf_area && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Turf Area</div>
                <div className="text-lg font-semibold text-gray-900">{vision_analysis.technical_estimates.approx_total_turf_area}</div>
              </div>
            )}
            
            {vision_analysis.technical_estimates.estimated_irrigation_zones && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Irrigation Zones</div>
                <div className="text-lg font-semibold text-gray-900">{vision_analysis.technical_estimates.estimated_irrigation_zones}</div>
              </div>
            )}
            
            {vision_analysis.technical_estimates.estimated_mowing_hours_per_week && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Mowing Hours</div>
                <div className="text-lg font-semibold text-gray-900">{vision_analysis.technical_estimates.estimated_mowing_hours_per_week} hrs/week</div>
              </div>
            )}
            
            {vision_analysis.technical_estimates.maintenance_staffing_level && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Staffing Level</div>
                <div className="text-sm font-semibold text-gray-900 capitalize">
                  {vision_analysis.technical_estimates.maintenance_staffing_level.replace(/_/g, ' ')}
                </div>
              </div>
            )}
          </div>
          
          {/* Reasoning Notes */}
          {vision_analysis.technical_estimates.reasoning_notes && (
            <div className="border-t border-gray-200 pt-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Analysis Notes</div>
              <div className="space-y-2">
                {vision_analysis.technical_estimates.reasoning_notes.map((note: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-xs text-gray-600 leading-relaxed">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== SOCIAL INTELLIGENCE ========== */}
      {propertyAnalysis?.social_intelligence && (
        <SocialIntelligenceDisplay data={propertyAnalysis.social_intelligence} />
      )}
    </div>
  );
}