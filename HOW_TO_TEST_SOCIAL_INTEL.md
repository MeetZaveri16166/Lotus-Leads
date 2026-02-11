# How to Test Social Intelligence Feature

## Quick Test Guide

### Prerequisites

1. **Perplexity API Key Required**
   - Go to: https://www.perplexity.ai/settings/api
   - Create new API key
   - Copy the key

2. **Add to Settings**
   - Navigate to Admin > Settings in the app
   - Scroll to "AI/LLM Provider" section
   - Paste Perplexity API key in the "Perplexity API Key" field
   - Save settings

---

## Test Scenario 1: Full Social Presence

**Test Company:** A well-known landscaping company with all platforms

**Steps:**
1. Create a new lead with:
   - Company Name: "TruGreen" (or any well-known landscaping company)
   - City: "Memphis"
   - State: "Tennessee"

2. Run Stage 1: Geo Enrichment

3. Run Stage 2: Property Analysis

4. Wait ~6-8 seconds (4 platform searches + AI synthesis)

5. **Expected Result:**
   - Social Intelligence card appears at bottom of Property Analysis
   - Should show 3-4 platforms found (✅ green)
   - LinkedIn, Facebook, Yelp likely present
   - Profile URLs should be extracted
   - AI insights should highlight strengths

---

## Test Scenario 2: Partial Presence

**Test Company:** A smaller local business

**Steps:**
1. Create lead with a smaller local landscaping company
   - Example: "Green Acres Landscaping" + your city

2. Run Stages 1 & 2

3. **Expected Result:**
   - Presence score: 1-2 out of 4
   - Some platforms found, others missing
   - AI insights should identify gaps
   - Sales talking points about missing platforms

---

## Test Scenario 3: No Social Presence

**Test Company:** Made-up company name

**Steps:**
1. Create lead with:
   - Company Name: "XYZ NonExistent Landscaping Co"
   - City: "Springfield"
   - State: "Illinois"

2. Run Stages 1 & 2

3. **Expected Result:**
   - Presence score: 0 out of 4
   - All platforms show ❌ red X
   - AI insights focus on opportunities to establish presence
   - Sales talking points about competitive disadvantage

---

## What to Look For

### **In Server Logs (Browser Console → Network → Response):**

```javascript
{
  "property_analysis": {
    "social_intelligence": {
      "analyzed_at": "2025-01-29T...",
      "platforms": {
        "linkedin": {
          "exists": true,
          "profile_url": "https://linkedin.com/company/...",
          "snippet": "...",
          "search_attempted": true
        },
        // ... other platforms
      },
      "presence_score": 2,
      "ai_insights": {
        "summary": "...",
        "strengths": [...],
        "gaps": [...],
        "opportunities": [...],
        "recommended_talking_points": [...]
      }
    }
  }
}
```

### **In Browser Console Logs:**

Look for these log messages:
```
[PROPERTY ANALYSIS] 📱 Starting Social Intelligence Analysis...
[SOCIAL INTEL] 🎯 Starting target social intelligence for: [Company]
[SOCIAL INTEL] 🔍 Searching linkedin for: [Company]
[SOCIAL INTEL] 📝 linkedin response: ...
[SOCIAL INTEL] 🔍 Searching facebook for: [Company]
[SOCIAL INTEL] 🔍 Searching yelp for: [Company]
[SOCIAL INTEL] 🔍 Searching instagram for: [Company]
[SOCIAL INTEL] 📊 Presence score: X/4 platforms
[SOCIAL INTEL] 🤖 Synthesizing insights with OpenAI...
[SOCIAL INTEL] ✅ AI insights generated
[SOCIAL INTEL] ✅ Analysis complete for [Company]
[SOCIAL INTEL] 📈 Summary: [AI summary]
[PROPERTY ANALYSIS] ✅ Social Intelligence complete: X/4 platforms found
```

---

## Troubleshooting

### **Social Intelligence Card Not Showing**

**Problem:** Card doesn't appear after Stage 2 completes

**Check:**
1. Perplexity API key configured in Settings?
2. Company name, city, state all populated on lead?
3. Check browser console for errors
4. Verify `lead.property_analysis.social_intelligence` exists in API response

### **All Platforms Showing "Not Found"**

**Problem:** Even well-known companies show 0/4 presence

**Check:**
1. Perplexity API key valid? (test at perplexity.ai)
2. API rate limit exceeded? (check Perplexity dashboard)
3. Check server logs for API errors
4. Try again after 1 minute (rate limit cooldown)

### **URLs Not Extracted**

**Problem:** Platform detected but "Profile found (URL not extracted)"

**Cause:** Perplexity's response didn't include a valid URL

**Solution:** 
- This is normal ~20% of the time
- URL detection regex may need adjustment
- Manual verification can find the profile

### **Analysis Taking Too Long**

**Problem:** Stage 2 hangs or times out

**Check:**
1. Network connection stable?
2. Perplexity API responding? (check status.perplexity.ai)
3. Each platform search has 1-second delay (4 searches = 4+ seconds minimum)
4. Total expected time: 5-8 seconds

### **API Errors**

**Error Message:** `API error: 401`
- **Cause:** Invalid Perplexity API key
- **Fix:** Double-check key in Settings, regenerate if needed

**Error Message:** `API error: 429`
- **Cause:** Rate limit exceeded
- **Fix:** Wait 1 minute, or upgrade Perplexity plan

**Error Message:** `API error: 500`
- **Cause:** Perplexity service issue
- **Fix:** Check Perplexity status page, retry later

---

## Manual Verification

After analysis completes, manually verify results:

1. **LinkedIn:** Google search `"[Company Name]" [City] LinkedIn`
2. **Facebook:** Google search `"[Company Name]" [City] Facebook`
3. **Yelp:** Go to yelp.com, search for company
4. **Instagram:** Go to instagram.com, search for company

Compare manual results with AI detection to measure accuracy.

---

## Performance Benchmarks

**Expected Performance:**
- ✅ Social Intelligence analysis: 5-8 seconds
- ✅ Platform detection accuracy: 80-90%
- ✅ URL extraction rate: 70-80%
- ✅ AI insights quality: High (GPT-4o-mini)

**If seeing worse performance:**
- Check internet connection speed
- Check Perplexity API latency
- Consider parallelizing searches (future optimization)

---

## Cost Tracking

Monitor actual costs in Perplexity dashboard:
- Each lead = 4 searches + 1 AI synthesis
- Expected: ~$0.045 per lead
- If cost higher: Check if searches are being retried/duplicated

---

## Next Steps After Testing

Once Phase 1 working:
1. ✅ Test with 5-10 real leads
2. ✅ Verify sales team finds insights useful
3. ✅ Measure accuracy vs manual verification
4. ✅ Collect feedback on UI/UX
5. ✅ Then proceed to Phase 2 (Competitive Social Intelligence)

---

## Support

Issues? Check:
1. This guide
2. `/SOCIAL_INTELLIGENCE_PHASE1_COMPLETE.md` (implementation details)
3. Server console logs
4. Browser console logs
5. Perplexity API dashboard for errors
