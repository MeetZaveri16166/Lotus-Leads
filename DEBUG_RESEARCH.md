# 🐛 DEBUG: Is Real Research Working?

## Quick Diagnostic Checklist

### ✅ Step 1: Check Settings

1. Go to **Settings** page
2. Scroll to **"Business Opportunity Insight"** section
3. Look for **"Google Custom Search Engine ID"** field
4. **Is it filled in?**
   - ✅ YES → Continue to Step 2
   - ❌ NO → Add your Search Engine ID, then test again

---

### ✅ Step 2: Check Console Logs

1. Open **browser console** (F12)
2. Click on a lead with an address
3. Run **Stage 2: Property Analysis**
4. Watch console output

#### **What You Should See:**

```
[PROPERTY ANALYSIS] 🔍 Starting REAL RESEARCH...
[REAL RESEARCH] 🔍 Starting research for: Company Name
```

#### **Possible Outcomes:**

**✅ GOOD: You see research logs**
```
[REAL RESEARCH] Searching web for recent activity...
[REAL RESEARCH] Fetching detailed place data...
[REAL RESEARCH] Found 15 reviews
[REAL RESEARCH] ✅ Research complete: 8 web results, 15 reviews
```
→ **Research is running!** Go to Step 3

**⚠️ WARNING: No Custom Search ID**
```
[REAL RESEARCH] ⚠️ No Custom Search Engine ID configured
[REAL RESEARCH] To enable web research:
  1. Go to https://programmablesearchengine.google.com/
  ...
```
→ **Add Search Engine ID to Settings**

**⚠️ WARNING: API key error**
```
[REAL RESEARCH] ⚠️ Search API error: API key not valid
```
→ **Enable Custom Search API:**
1. Go to: https://console.cloud.google.com/apis/library/customsearch.googleapis.com
2. Click "Enable"
3. Try again

**❌ ERROR: No research logs at all**
```
[PROPERTY ANALYSIS] Starting Stage 2...
[PROPERTY ANALYSIS] Calling OpenAI Vision API...
(no research logs!)
```
→ **Backend not deployed properly** - Let me know!

---

### ✅ Step 3: Check Stage 2 Output

After Stage 2 completes, click the lead and look at the **Property Future** section.

#### **Where to Look:**

1. **Scroll to "Conversation Starters"** section
2. Look for **specific details** instead of generic phrases

#### **Examples:**

**❌ GENERIC (No Research):**
> "Your business likely values customer experience and professional appearance..."

**✅ SPECIFIC (Research Working!):**
> "I saw you hosted the Children's Hospital fundraiser last month"
> "12 customers mentioned your outdoor patio in recent reviews"
> "Congrats on winning Best Restaurant 2025"

---

### ✅ Step 4: Verify Research Data Format

If you see research logs but NOT seeing it in output, check if the data structure is correct:

**In console, after Stage 2 runs, type:**
```javascript
// This will show you if research data exists
console.log("Last research data:", window.lastResearchData);
```

---

## 🎯 What You Should See in Stage 2 Results

### **Before Real Research:**
```json
{
  "customer_business_intelligence": {
    "business_type_analysis": "This appears to be a restaurant...",
    "what_they_care_about": ["customer experience", "food quality", "ambiance"]
  },
  "sales_conversation_insights": {
    "conversation_starters": [
      "Your restaurant likely values customer experience...",
      "Maintaining a professional appearance is probably important..."
    ]
  }
}
```

### **After Real Research:**
```json
{
  "customer_business_intelligence": {
    "business_type_analysis": "Buca di Beppo is an Italian restaurant known for family-style dining. Recent reviews mention their beautiful outdoor patio (8 customers) and they hosted a Children's Hospital fundraiser in November 2025.",
    "what_they_care_about": [
      "Community involvement (hosted charity fundraiser Nov 2025)",
      "Outdoor dining experience (8 customers praised patio)",
      "Award-winning reputation (Best Italian Restaurant 2025)"
    ]
  },
  "sales_conversation_insights": {
    "conversation_starters": [
      "I saw you hosted the Children's Hospital fundraiser last month—incredible community support! With outdoor events like that, maintaining your beautiful patio (which 8 customers raved about!) must be a priority.",
      "Congrats on winning Best Italian Restaurant 2025! Keeping that award-worthy curb appeal year-round requires consistent care.",
      "Your outdoor patio is clearly a customer favorite—I counted 8 reviews mentioning it in the last 90 days alone."
    ]
  }
}
```

---

## 🔍 Key Differences to Look For:

| **Without Research** | **With Research** |
|---------------------|-------------------|
| "Your business likely values..." | "I saw you hosted [actual event]..." |
| "Professional appearance is probably important..." | "8 customers mentioned your patio in reviews..." |
| Generic industry assumptions | Specific dates, numbers, quotes |
| "You probably care about..." | "You hosted the fundraiser in November 2025..." |

---

## 🚨 Troubleshooting

### Issue 1: No console logs at all
**Problem:** Research module not running
**Solution:** Backend might not be deployed. Check Supabase Edge Function logs.

### Issue 2: "No Custom Search Engine ID configured"
**Problem:** Settings not saved
**Solution:** 
1. Go to Settings
2. Add Search Engine ID
3. Click **Save Settings**
4. Hard refresh page (Ctrl+Shift+R)
5. Try again

### Issue 3: "API key not valid"
**Problem:** Custom Search API not enabled
**Solution:**
1. https://console.cloud.google.com/apis/library/customsearch.googleapis.com
2. Click "Enable"
3. Wait 1-2 minutes
4. Try again

### Issue 4: Research logs appear but no web results
**Problem:** Business has no recent news (normal!)
**Solution:** 
- This is OK! Not all businesses have news articles
- You should still see enhanced reviews (15 instead of 5)
- Review analysis still works

### Issue 5: See logs but output still generic
**Problem:** Data not reaching OpenAI prompt
**Solution:** Let me know - I'll check the integration

---

## ✅ Test with a Known-Good Lead

**Best test candidates:**
- Local **restaurant** with good reviews
- **Golf course** with tournaments
- **Hotel** with awards/events
- **Country club** with community events

These typically have:
- ✅ Recent news/events
- ✅ Lots of reviews
- ✅ Social media presence

---

## 📊 Success Metrics

**If research is working, you should see:**

✅ Console logs showing research execution
✅ "X web results, Y reviews" in logs
✅ Conversation starters with specific details
✅ References to actual events/reviews in output
✅ Customer quotes included in analysis

**The key indicator:** Conversation starters should sound like a sales rep who **actually researched the company**, not AI making generic assumptions!

---

## 🎯 Next Steps

**Which scenario matches your situation?**

1. **No console logs at all** → Backend issue, let me know
2. **"No Custom Search Engine ID"** → Add it to Settings
3. **"API key not valid"** → Enable Custom Search API
4. **Logs appear but output still generic** → Integration issue, let me know
5. **Everything looks good!** → Test with more leads! 🎉

Let me know which one you're seeing and I'll help debug!
