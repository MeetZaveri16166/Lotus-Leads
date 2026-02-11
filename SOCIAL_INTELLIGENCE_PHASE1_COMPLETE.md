# Social Intelligence - Phase 1 Implementation Complete ✅

## What We Built

**Target Social Intelligence** - Automatically analyzes a lead's social media presence across 4 key platforms to provide strategic sales insights.

---

## Implementation Details

### 1. **Backend Module: Social Intelligence Engine**
**File:** `/supabase/functions/server/social_intelligence.tsx`

**Features:**
- 🔍 **Platform Detection** - Searches for company presence on:
  - LinkedIn (company pages)
  - Facebook (business pages)
  - Yelp (business listings)
  - Instagram (business accounts)

- 🤖 **AI-Powered Search** - Uses Perplexity Sonar API for intelligent web search
  - Platform-specific queries
  - URL extraction from search results
  - NOT FOUND detection logic
  - Rate limiting (1s delay between searches)

- 💡 **AI Synthesis** - OpenAI GPT-4o-mini generates:
  - Summary of social presence
  - Strengths (what they're doing well)
  - Gaps (missing/underutilized platforms)
  - Strategic opportunities
  - Sales talking points

**Data Structure:**
```typescript
{
  analyzed_at: "2025-01-29T...",
  platforms: {
    linkedin: { exists: true, profile_url: "...", snippet: "..." },
    facebook: { exists: true, profile_url: "...", snippet: "..." },
    yelp: { exists: false, search_attempted: true },
    instagram: { exists: false, search_attempted: true }
  },
  presence_score: 2,  // Out of 4
  ai_insights: {
    summary: "...",
    strengths: [...],
    gaps: [...],
    opportunities: [...],
    recommended_talking_points: [...]
  }
}
```

---

### 2. **Integration into Stage 2 Property Analysis**
**File:** `/supabase/functions/server/index.tsx`

**Location:** Line ~3046 (after real research, before vision analysis)

**Flow:**
```
Stage 2: Property Analysis
├─ Step 1: Google Places lookup
├─ Step 1.5: Real Research (web search + reviews)
├─ Step 1.75: Social Intelligence ← NEW!
│  ├─ Search LinkedIn
│  ├─ Search Facebook
│  ├─ Search Yelp
│  ├─ Search Instagram
│  └─ AI synthesis
├─ Step 2: Satellite imagery capture
└─ Step 3: GPT-4 Vision analysis
```

**Conditional Execution:**
- Only runs if ALL required data present:
  - ✓ Company name
  - ✓ City
  - ✓ State
  - ✓ Perplexity API key
  - ✓ OpenAI API key

**Error Handling:**
- Non-critical: Continues analysis if social intel fails
- Detailed logging for debugging

**Credit Cost:** 20 credits (PERPLEXITY_SOCIAL_INTEL)

---

### 3. **Frontend Display Component**
**File:** `/src/app/components/SocialIntelligenceDisplay.tsx`

**UI Features:**

**📊 Platform Grid**
- 4 platform cards with visual status (✓ found / ✗ not found)
- Color-coded: Green for found, gray for not found
- Platform icons: 💼 LinkedIn, 👥 Facebook, ⭐ Yelp, 📸 Instagram
- Direct links to profiles (if URL extracted)

**📈 Presence Score**
- Visual badge: X/4 platforms
- Rating: Strong (3-4), Moderate (2), Weak (0-1)
- Color-coded background

**💡 AI Insights Sections:**
1. **Summary Card** - Quick overview (blue alert box)
2. **Strengths** - What they're doing well (green checkmarks)
3. **Gaps & Weaknesses** - Missing platforms (yellow X marks)
4. **Strategic Opportunities** - Purple gradient card with actionable items
5. **Sales Talking Points** - Pink gradient card with recommended pitch angles

**Visual Hierarchy:**
- Lotus Pink (#E64B8B) accents for brand consistency
- Clear section separation
- Emoji icons for quick scanning
- Responsive grid layout

---

### 4. **Integration into Property Analysis Display**
**File:** `/src/app/components/PropertyAnalysisDisplay.tsx`

**Changes:**
- Added import for `SocialIntelligenceDisplay`
- Added conditional render at end of component (after technical estimates)
- Only shows if `propertyAnalysis.social_intelligence` exists

**Position:** Appears as final card in Stage 2 analysis view

---

## API Usage & Costs

### **Per Lead Analysis:**

**Perplexity API Calls:**
- 4 searches (LinkedIn, Facebook, Yelp, Instagram)
- Model: `sonar` (online search)
- Temperature: 0.2 (factual)
- Max tokens: 300/search
- **Cost:** ~$0.04 per lead

**OpenAI API Calls:**
- 1 synthesis call (GPT-4o-mini)
- Max tokens: 1000
- Response format: JSON
- **Cost:** ~$0.005 per lead

**Total: ~$0.045 per lead**

**Internal Credits:** 20 credits/lead

---

## Testing Checklist

### **Backend:**
- [ ] Test with valid company (all 4 platforms present)
- [ ] Test with partial presence (2-3 platforms)
- [ ] Test with no social presence
- [ ] Test with missing Perplexity key
- [ ] Test with API rate limits
- [ ] Verify error handling

### **Frontend:**
- [ ] Social intelligence card displays correctly
- [ ] Platform links work (open in new tab)
- [ ] Presence score calculates correctly
- [ ] AI insights render properly
- [ ] Responsive layout on mobile
- [ ] Integration with existing Property Analysis flow

### **Data Flow:**
- [ ] Stage 2 includes social_intelligence in response
- [ ] Data persists in KV store (`lead.property_analysis.social_intelligence`)
- [ ] GET /api/leads/:id returns social intelligence
- [ ] No data loss on page refresh

---

## Example Output

**For a company with moderate presence:**

```
📱 Social Media Intelligence
Overall Score: 2/4 Platforms ⭐⭐☆☆ (Moderate)

Platform Presence:
✅ LinkedIn   🔗 View Profile  (350 followers)
✅ Facebook   🔗 View Page     (1.2K likes)
❌ Yelp       Not found
❌ Instagram  Not found

💡 AI Analysis:
Company has established presence on professional/B2C platforms 
but missing review sites and visual social media.

Strengths:
✓ Active LinkedIn presence with engaged followers
✓ Decent Facebook following for local business

Gaps & Weaknesses:
✗ No Yelp listing - missing critical review platform
✗ No Instagram - losing visual engagement opportunity

Strategic Opportunities:
→ Claim Yelp listing and request customer reviews
→ Launch Instagram to showcase before/after work
→ Increase LinkedIn posting frequency

💬 Recommended Sales Talking Points:
"We noticed you have a LinkedIn page but low recent activity..."
"Your Facebook following is good, but missing Yelp reviews..."
```

---

## What's Next: Phase 2

**Competitive Social Intelligence** (Stage 3)
- Analyze ALL 5 competitors' social presence
- Benchmark target vs competitors
- Identify competitive gaps and opportunities
- Generate comparative insights
- Add Yelp Fusion API for detailed review data

---

## Configuration Required

### **Perplexity API Key**
Must be configured in Settings:
1. Go to Admin > Settings
2. Under "AI/LLM Provider" section
3. Add Perplexity API key
4. Field: `perplexity_api_key`

**Get API Key:**
- Sign up at https://www.perplexity.ai/
- Navigate to API settings
- Generate new API key
- Free tier: Limited requests
- Pro tier: Higher rate limits

---

## Files Created/Modified

### **Created:**
- `/supabase/functions/server/social_intelligence.tsx` (247 lines)
- `/src/app/components/SocialIntelligenceDisplay.tsx` (270 lines)
- `/SOCIAL_INTELLIGENCE_PHASE1_COMPLETE.md` (this file)

### **Modified:**
- `/supabase/functions/server/index.tsx`:
  - Added import for social intelligence module
  - Added social intel call in Stage 2 (line ~3046)
  - Added `social_intelligence` to property analysis result
  - Added credit cost constant (PERPLEXITY_SOCIAL_INTEL: 20)
  
- `/src/app/components/PropertyAnalysisDisplay.tsx`:
  - Added import for SocialIntelligenceDisplay
  - Added conditional render for social intelligence card

---

## Known Limitations

1. **URL Extraction Not 100% Reliable**
   - Depends on Perplexity returning URLs in response
   - Some profiles may be detected but URL not extracted
   - Fallback: "Profile found (URL not extracted)" message

2. **Rate Limits**
   - 1-second delay between searches (prevents rate limiting)
   - Total analysis time: ~5-7 seconds per lead
   - Could be optimized with parallel requests if needed

3. **False Negatives Possible**
   - If company uses different name on social platforms
   - If Perplexity search fails to find profile
   - Mitigation: Manual verification recommended

4. **No Follower/Engagement Metrics Yet**
   - Basic platform detection only
   - Future: Extract follower counts, post frequency, etc.

---

## Success Metrics

Track in production:
- **Coverage:** % of leads with social intelligence data
- **Accuracy:** % of platform detections verified correct
- **Performance:** Average analysis time
- **Cost:** Actual API costs vs estimates
- **Sales Impact:** Conversion rate with vs without social insights

---

## Developer Notes

**Code Quality:**
- ✅ TypeScript interfaces defined
- ✅ Comprehensive error handling
- ✅ Detailed console logging
- ✅ Rate limiting protection
- ✅ Fallback behavior on failures

**Scalability:**
- Sequential searches (can parallelize if needed)
- Small delays prevent rate limiting
- Non-blocking (doesn't block property analysis)
- Stateless function (no global state)

**Maintainability:**
- Separated module for social intelligence
- Clear function naming
- Inline comments for complex logic
- Platform config centralized

---

## Questions or Issues?

If social intelligence not working:

1. **Check Perplexity API Key**
   ```bash
   # In browser console, check lead response
   lead.property_analysis.social_intelligence
   // Should not be null
   ```

2. **Check Server Logs**
   ```
   [PROPERTY ANALYSIS] 📱 Starting Social Intelligence Analysis...
   [SOCIAL INTEL] 🔍 Searching linkedin for: [Company]
   [SOCIAL INTEL] ✅ Analysis complete
   ```

3. **Verify API Keys in Settings**
   - OpenAI API key present
   - Perplexity API key present
   - Both keys valid

4. **Test Individual Platform Search**
   - Try searching manually on Perplexity.ai
   - Verify company has profiles on those platforms
