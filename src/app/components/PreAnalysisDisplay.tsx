interface PreAnalysisDisplayProps {
  preAnalysis: any;
  analysisMetadata: any;
}

export function PreAnalysisDisplay({ preAnalysis, analysisMetadata }: PreAnalysisDisplayProps) {
  if (!preAnalysis) return null;
  
  return (
    <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border-2 border-purple-300 rounded-xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-purple-600 text-white rounded-full p-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">🧠 AI Pre-Analysis Intelligence</h3>
          <p className="text-xs text-gray-600">AI analyzed an overview image first to understand property context before detailed capture</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Property Identification */}
        <div className="bg-white rounded-lg p-4 border border-purple-200">
          <div className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">Property Identified</div>
          <div className="text-sm text-gray-900 font-semibold capitalize">
            {preAnalysis.property_identification.primary_type.replace(/_/g, ' ')}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {preAnalysis.property_identification.description}
          </div>
          {preAnalysis.property_identification.boundaries_visible && (
            <div className="mt-2 text-xs text-green-600 font-medium">
              ✓ Property boundaries visible
            </div>
          )}
        </div>
        
        {/* Size Analysis */}
        <div className="bg-white rounded-lg p-4 border border-purple-200">
          <div className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">Estimated Size</div>
          <div className="text-sm text-gray-900 font-semibold">
            {preAnalysis.size_analysis.estimated_acres}
          </div>
          <div className="text-xs text-gray-600 mt-1 capitalize">
            Category: {preAnalysis.size_analysis.estimated_size_category}
          </div>
          <div className="text-xs text-gray-500 mt-1 italic">
            {preAnalysis.size_analysis.reasoning}
          </div>
        </div>
      </div>
      
      {/* Recommended Strategy */}
      <div className="bg-white rounded-lg p-4 border-2 border-purple-300">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold text-purple-700 uppercase tracking-wider">AI Recommended Strategy</div>
          <div className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            {preAnalysis.recommended_strategy.capture_mode.toUpperCase()}
          </div>
        </div>
        <div className="text-sm text-gray-900 mb-2">
          <strong>Zoom Level:</strong> {preAnalysis.recommended_strategy.zoom_level} | 
          <strong className="ml-2">Grid:</strong> {analysisMetadata?.grid_size || 'N/A'} | 
          <strong className="ml-2">Tiles:</strong> {analysisMetadata?.tile_count || 0}
        </div>
        <div className="text-xs text-gray-600 mb-3">
          <strong>Reasoning:</strong> {preAnalysis.recommended_strategy.reasoning}
        </div>
        
        {/* Warnings */}
        {preAnalysis.recommended_strategy.warnings && preAnalysis.recommended_strategy.warnings.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
            <div className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-2">⚠️ AI Warnings</div>
            <ul className="space-y-1">
              {preAnalysis.recommended_strategy.warnings.map((warning: string, idx: number) => (
                <li key={idx} className="text-xs text-orange-800 flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Context Assessment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-white rounded-lg p-4 border border-purple-200">
          <div className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">Context</div>
          <div className="text-sm text-gray-900">
            <strong>Setting:</strong> <span className="capitalize">{preAnalysis.context_assessment.setting}</span>
          </div>
          <div className="text-sm text-gray-900 mt-1">
            <strong>Adjacent Property Risk:</strong> 
            <span className={`ml-2 capitalize ${
              preAnalysis.context_assessment.adjacent_properties_risk === 'high' ? 'text-red-600 font-semibold' :
              preAnalysis.context_assessment.adjacent_properties_risk === 'medium' ? 'text-orange-600' :
              'text-green-600'
            }`}>
              {preAnalysis.context_assessment.adjacent_properties_risk}
            </span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-purple-200">
          <div className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">Analysis Focus</div>
          <div className="text-xs text-gray-600">
            <strong>Look for:</strong> {preAnalysis.analysis_focus.what_to_look_for}
          </div>
          {preAnalysis.analysis_focus.what_to_ignore && (
            <div className="text-xs text-gray-600 mt-1">
              <strong>Ignore:</strong> {preAnalysis.analysis_focus.what_to_ignore}
            </div>
          )}
        </div>
      </div>
      
      {/* Key Features */}
      {preAnalysis.features_to_analyze && preAnalysis.features_to_analyze.length > 0 && (
        <div className="mt-4 bg-white rounded-lg p-4 border border-purple-200">
          <div className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">Key Features AI Identified</div>
          <div className="flex flex-wrap gap-2">
            {preAnalysis.features_to_analyze.map((feature: string, idx: number) => (
              <span key={idx} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium">
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
