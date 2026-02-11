# Property Analysis System - Enhancement Checklist

## Current State (January 25, 2026)
We just implemented AI-guided multi-stage property analysis with intelligent capture strategy.

## ✅ Completed Features
- [x] AI Pre-Analysis (GPT-4 Vision analyzes overview image)
- [x] Dynamic capture strategy (single_point to 5x5 grid)
- [x] Pre-analysis results stored in database
- [x] Pre-analysis displayed prominently in UI
- [x] Property intelligence extraction from multiple tiles
- [x] Three-stage workflow (Geo → Property → Service Mapping)

## 🔧 Recommended Enhancements

### Priority 1: Make AI Pre-Analysis More Conservative
**Issue**: AI might be over-recommending multi-tile grids for small properties
**Solution**: 
- Review and tighten the pre-analysis prompt
- Add stricter acreage thresholds (maybe 2+ acres for 3x3, 10+ for 5x5)
- Add more context about urban vs. suburban vs. rural
- Consider making 2x2 grid the default for "medium" properties

**Files to update**:
- `/supabase/functions/server/index.tsx` - Update pre-analysis prompt

### Priority 2: Property Boundary Detection
**Issue**: No access to actual parcel boundaries (Google Maps doesn't provide this)
**Current Workaround**: AI tries to identify boundaries visually from satellite imagery
**Better Solutions**:
1. **Integrate Property Data API**:
   - **Regrid** - Property boundaries and parcel data (paid)
   - **Attom Data** - Comprehensive property information (paid)
   - **CoreLogic** - Parcel boundaries (enterprise)
   
2. **Use Pre-Analysis Boundary Detection**:
   - If AI says `boundaries_visible: true`, use visual analysis
   - If `boundaries_visible: false`, warn user and offer manual override
   - Add UI control to let user manually set property size category

**Files to update**:
- Add new API integration in `/supabase/functions/server/index.tsx`
- Update pre-analysis to include boundary confidence score
- Add manual override UI in `/src/app/components/PropertyAnalysisDisplay.tsx`

### Priority 3: Stage 3 Intelligence Enhancement
**Issue**: Stage 3 (Service Mapping) should better leverage new Stage 2 intelligence
**Solution**:
- Update Stage 3 prompt to reference pre-analysis data
- Use property size category to adjust service recommendations
- Reference specific zones/tiles when making recommendations

**Example**: 
> "Based on the AI pre-analysis identifying this as a 'large_property' with 25 tiles analyzed, we recommend..."

**Files to update**:
- `/supabase/functions/server/index.tsx` - Update Stage 3 prompt to consume pre-analysis

### Priority 4: Lead List View Enhancements
**Issue**: Can't see analysis stage completion from list view
**Solution**:
- Add visual indicators showing which stages are complete
- Show property size category badge
- Display capture strategy used (single vs grid)

**Example badges**:
- 🟢 Stage 1 ✓  🟢 Stage 2 ✓  ⚪ Stage 3
- 📍 Single Point  or  🌍 3x3 Grid
- 🏡 Small Property  or  ⛳ Large Property

**Files to update**:
- `/src/app/pages/LeadsPage.tsx` - Update lead card display

### Priority 5: Analysis Metadata Display
**Issue**: Users can't see why AI made specific recommendations
**Solution**:
- Add expandable "AI Decision Log" showing:
  - What AI saw in overview image
  - Why it chose specific capture strategy
  - Confidence scores for boundaries
  - Warnings/limitations

**Files to update**:
- `/src/app/components/PreAnalysisDisplay.tsx` - Add debug/explanation section
- Make it collapsible by default, expandable for power users

### Priority 6: Manual Override Controls
**Issue**: If AI gets it wrong, user has no way to fix it
**Solution**:
- Add "Re-analyze with different strategy" button
- Let user manually select:
  - Property size category (small/medium/large/very_large)
  - Grid size (1x1, 2x2, 3x3, 5x5)
  - Zoom level (17-20)
  
**Files to update**:
- `/src/app/components/PropertyAnalysisDisplay.tsx` - Add override UI
- `/supabase/functions/server/index.tsx` - Add override parameters to analysis endpoint

### Priority 7: Cost Tracking for Multi-Tile Analysis
**Issue**: 5x5 grid = 25 API calls to Google Maps + 1 large GPT-4 Vision call
**Solution**:
- Display estimated cost before running analysis
- Track actual costs per lead
- Add warning when analysis will exceed certain cost threshold
- Show cumulative costs in dashboard

**Example**: 
> "⚠️ This analysis will capture 25 satellite tiles and cost approximately $0.50 in API credits. Continue?"

**Files to update**:
- Add cost calculation function in `/supabase/functions/server/index.tsx`
- Update UI to show cost estimates
- Track costs in database (add `analysis_cost` field)

### Priority 8: Property Boundary Visualization
**Issue**: Hard to see which tiles are actually part of the property
**Solution**:
- Overlay property boundary line on tile grid display
- Shade tiles that are mostly off-property
- Add confidence indicator per tile

**Files to update**:
- `/src/app/components/PropertyAnalysisDisplay.tsx` - Add SVG overlay on grid
- Backend: Store per-tile analysis (which tiles are on/off property)

### Priority 9: Smart Zoom Level Selection
**Issue**: Currently using fixed zoom levels
**Solution**:
- AI should recommend zoom level based on property type:
  - Small residential: zoom 19-20 (very close)
  - Golf courses: zoom 16-17 (wide view)
  - Strip malls: zoom 18 (medium)
- Adjust tile spacing based on zoom level

**Files to update**:
- `/supabase/functions/server/index.tsx` - Make zoom level dynamic in pre-analysis

### Priority 10: Historical Analysis Comparison
**Issue**: If property is re-analyzed, can't compare to previous results
**Solution**:
- Store analysis history (don't overwrite)
- Show "Changes since last analysis" diff view
- Useful for seasonal changes (summer vs winter landscaping)

**Files to update**:
- Database schema: Add `analysis_version` and `analyzed_at` timestamps
- UI: Add version selector/comparison view

## 🎯 Immediate Next Steps (Top 3)

1. **Fix AI Over-Recommendation** (Priority 1)
   - Takes 30 mins
   - Immediate impact on accuracy

2. **Add Manual Override** (Priority 6)
   - Takes 2 hours
   - Critical for fixing AI mistakes

3. **Enhance Stage 3 Intelligence** (Priority 3)
   - Takes 1 hour
   - Makes full workflow more cohesive

## 📊 Longer-Term Improvements

4. Property Boundary API Integration (Priority 2) - 1 day
5. Cost Tracking System (Priority 7) - 2 hours
6. Lead List Indicators (Priority 4) - 1 hour
7. Property Boundary Visualization (Priority 8) - 3 hours
8. Smart Zoom Levels (Priority 9) - 1 hour
9. Analysis History (Priority 10) - 4 hours
10. AI Decision Log (Priority 5) - 1 hour

---

## Notes
- All priorities are independent and can be implemented in any order
- Priorities 1, 3, 6 provide immediate value with minimal effort
- Priority 2 (boundary API) requires budget for API subscriptions
- Priority 7 (cost tracking) becomes critical as usage scales
