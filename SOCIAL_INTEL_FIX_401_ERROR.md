# Fixing Social Intelligence 401 Error

## The Problem

Social Intelligence is showing "Search error" for all platforms because the **Perplexity API key is missing or invalid**.

**Error in logs:**
```
[SOCIAL INTEL] ❌ Perplexity API error for linkedin: 401 Authorization Required
[SOCIAL INTEL] ❌ Perplexity API error for facebook: 401 Authorization Required
[SOCIAL INTEL] ❌ Perplexity API error for yelp: 401 Authorization Required
[SOCIAL INTEL] ❌ Perplexity API error for instagram: 401 Authorization Required
```

---

## The Solution

### Step 1: Get a Perplexity API Key

1. Go to: https://www.perplexity.ai/
2. Sign up or log in
3. Navigate to **Settings → API**
4. Click **Generate New API Key**
5. Copy the key (starts with `pplx-`)

**Pricing:**
- Free tier: Limited requests (good for testing)
- Pro tier: $20/month for higher limits

---

### Step 2: Add API Key to Settings

1. In your app, go to **Admin → Settings**
2. Scroll to the **AI/LLM Provider** section
3. Find the **Perplexity API Key** field
4. Paste your API key
5. Click **Save Settings**

---

### Step 3: Test Again

1. Go to **Leads** page
2. Select a lead (e.g., Mt. Hawley Country Club)
3. Run **Stage 2: Property Analysis**
4. Wait ~6-8 seconds
5. Scroll down to see **Social Media Intelligence** card

**Expected result:**
- Social Intelligence card shows platform presence
- No "Search error" messages
- AI insights populated

---

## What I Fixed

### Backend Improvements:

**File:** `/supabase/functions/server/social_intelligence.tsx`

1. **Better 401 Detection:**
   ```typescript
   if (response.status === 401) {
     return { 
       found: false, 
       url: null, 
       snippet: null, 
       error: 'Invalid Perplexity API key - check Settings'
     };
   }
   ```

2. **Clear Error Messages:**
   - Old: `API error: 401`
   - New: `Invalid Perplexity API key - check Settings`

### Frontend Improvements:

**File:** `/src/app/components/SocialIntelligenceDisplay.tsx`

1. **Red Alert Banner** when API key missing:
   ```
   ⚠️ Configuration Required: Invalid Perplexity API key - check Settings
   Go to Admin → Settings → Add Perplexity API key to enable social intelligence.
   ```

2. **Error Detection Logic:**
   - Checks if ALL platforms have errors
   - Detects if error is authentication-related
   - Shows prominent alert at top of card

---

## Testing with Valid API Key

Once you add a valid Perplexity API key, here's what you should see:

### For Mt. Hawley Country Club:
```
📱 Social Media Intelligence
Overall Score: ?/4 Platforms

Platform Presence:
✅ LinkedIn   🔗 View Profile  (if found)
✅ Facebook   🔗 View Page     (if found)
❌ Yelp       Not found
❌ Instagram  Not found

💡 AI Analysis:
Mt. Hawley Country Club has a presence on LinkedIn and Facebook, 
indicating some digital engagement...

Strategic Opportunities:
→ Claim Yelp listing to capture review traffic
→ Launch Instagram to showcase golf course beauty
```

---

## Why This Happens

The Perplexity API requires authentication via an API key. When the key is:
- **Missing:** Returns 401 error
- **Invalid:** Returns 401 error
- **Expired:** Returns 401 error

The backend now catches these 401 errors and provides helpful feedback instead of generic "search error" messages.

---

## Alternative: Skip Social Intelligence (Temporary)

If you want to test other features without Perplexity:

The system will gracefully skip social intelligence if:
- Perplexity API key is missing
- API call fails

The rest of Property Analysis (satellite imagery, AI vision, etc.) will still work fine.

---

## Verifying Your API Key

To verify your Perplexity API key is working:

1. Open browser console
2. Run Stage 2 Property Analysis
3. Look for these logs:
   ```
   [SOCIAL INTEL] 🔍 Searching linkedin for: [Company]
   [SOCIAL INTEL] 📝 linkedin response: [actual response]
   ```

If you see **actual responses** instead of errors, your API key is working! 🎉

---

## Cost Estimate

With Perplexity API:
- 4 searches per lead (LinkedIn, Facebook, Yelp, Instagram)
- ~$0.04 per lead
- Free tier: ~250 leads
- Pro tier: ~5,000 leads/month

**Recommendation:** Start with free tier for testing.

---

## Next Steps

1. ✅ Get Perplexity API key
2. ✅ Add to Settings
3. ✅ Run Stage 2 on a test lead
4. ✅ Verify social intelligence appears
5. ✅ Check that real company (like TruGreen) shows profiles found
6. ✅ Test with unknown company (should show 0/4 platforms)

Then we can proceed to Phase 2: Competitive Social Intelligence! 🚀
