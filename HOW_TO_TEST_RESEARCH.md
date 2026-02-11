# 🧪 HOW TO TEST THE REAL RESEARCH ENGINE

## ✅ Setup Complete!

You've added the Google Custom Search Engine ID to Settings. The backend is now integrated and ready to test!

---

## 🎯 How to Test

### Step 1: Find or Create a Test Lead

**Best test candidates:**
- **Restaurant** (great reviews and news!)
- **Golf course**
- **Hotel/Resort**
- **Country club**
- **Large retail business**
- **Community center**

Any business with:
- ✅ Recent news/events
- ✅ Customer reviews
- ✅ Public presence

### Step 2: Run Stage 2 Analysis

1. Go to **Leads** page
2. Click on a lead with an address
3. If Stage 1 hasn't run, click **"Run Stage 1: Geo Enrichment"** first
4. Once Stage 1 completes, click **"Run Stage 2: Property Analysis"**

### Step 3: Watch the Logs

**Open browser console** (F12) and watch for:

```
[PROPERTY ANALYSIS] 🔍 Starting REAL RESEARCH...
[PROPERTY ANALYSIS] Searching web for recent news and events...
[PROPERTY ANALYSIS] Fetching detailed place data...
[PROPERTY ANALYSIS] ✅ Research complete: 8 web results, 15 reviews
```

### Step 4: Check the Results

Look for **REAL data** in Stage 2 output:

#### ✅ **What You Should See:**

**📰 Recent News & Events:**
- "I saw you hosted the Little League fundraiser in November 2025"
- "Congrats on winning Best Italian Restaurant 2025"
- "I read about your 20th anniversary celebration"

**⭐ Customer Review Intelligence:**
- "12 customers mentioned your patio in recent reviews"
- Direct quote: "'The outdoor seating is gorgeous!' - actual customer"
- "Recent reviews praise your landscaping (5⭐)"

**🔗 Contact Data:**
- Website URL
- Phone number
- Google Maps listing link

**💡 Conversation Starters Using Real Data:**
- "I saw you hosted the fire department fundraiser last month—incredible community support!"
- "8 customers mentioned your beautiful patio area—clearly a customer favorite"
- "Congrats on the anniversary—maintaining that curb appeal for 20 years is impressive"

---

## 🔍 What Gets Searched

### Web Search (if Custom Search Engine ID is configured):

**Query 1:** `"[Company Name]" [City] news OR event OR fundraiser OR charity OR community OR sponsorship`
- Finds: Fundraisers, community events, sponsorships

**Query 2:** `"[Company Name]" [City] award OR recognition OR celebration OR anniversary`
- Finds: Awards, anniversaries, milestones

**Date Filter:** Last 12 months only (recent = relevant!)

### Enhanced Google Places Data:

- **15 reviews** (instead of default 5)
- **Review analysis** for landscaping themes:
  - Outdoor/patio mentions
  - Beauty/appearance comments
  - Recent praise vs concerns
- **Contact info:** website, phone, Google Maps URL

---

## ❌ Troubleshooting

### "No research results"

**Check logs for:**

```
[PROPERTY ANALYSIS] ⚠️ No Custom Search Engine ID configured
```

**Solution:** Add your Search Engine ID to Settings

---

### "Custom Search API error: API key not valid"

**The issue:** Google Maps API key doesn't have Custom Search enabled

**Solution:**
1. Go to: https://console.cloud.google.com/apis/library/customsearch.googleapis.com
2. Click **"Enable"**
3. Your existing Google Maps API key will now work for Custom Search!

---

### "Search returned 0 results"

**Possible reasons:**
1. **Business has no recent news** - Normal! Not all businesses have news articles
2. **Company name is too generic** - "ABC Company" won't find much
3. **City is missing** - City helps narrow results

**What still works without web search:**
- ✅ Enhanced Google Places reviews (15 instead of 5)
- ✅ Review theme analysis
- ✅ Contact information

---

### "Research timeout"

**The issue:** Web search is slow (Google Custom Search can take 2-3 seconds per query)

**This is normal:** Research runs 2 queries, so 4-6 seconds total is expected

---

## 📊 Success Metrics

### **Before Real Research:**
> "This business likely values customer experience and professional appearance..."

### **After Real Research:**
> **Recent Activity:**
> - "Buca di Beppo hosts annual pasta fundraiser for Children's Hospital" (Jan 2026)
> - "Named Best Italian Restaurant by Metro Weekly" (Dec 2025)
> 
> **Customer Intelligence:**
> - 8 customers mentioned "outdoor seating" in last 90 days
> - Recent: "The patio is beautiful, perfect for summer dining" (5⭐)
> 
> **Conversation Starter:**
> "I saw you hosted the Children's Hospital fundraiser last month—that's incredible community support! With outdoor events like that, maintaining your beautiful patio (which 8 customers raved about!) must be a priority..."

### **The Difference:**

❌ **Generic AI guessing:** "They probably care about appearance"
✅ **Real research:** "I saw you hosted [actual event]" + "12 customers mentioned [actual theme]"

This shows you **actually did your homework** = warm introduction, not cold spam! 🔥

---

## 🎯 Best Test Example

**Test with a restaurant in your area:**

1. Search Apollo for: `restaurant owner` in your city
2. Pick a restaurant with good reviews
3. Enrich the lead
4. Run Stage 1 & Stage 2
5. Watch the magic happen! ✨

The research should find:
- Recent events they hosted
- Award mentions
- Customer reviews praising outdoor seating
- Social media mentions

**Result:** Conversation starters that sound like you're a regular customer who follows their business! 🎯

---

## 💡 Pro Tips

1. **Best results:** Established businesses (5+ years) with active community presence
2. **Restaurant/hospitality:** Usually have TONS of reviews and events
3. **Golf courses:** Often have tournaments and member events in news
4. **Generic businesses:** May have fewer results, but review analysis still works!

Ready to test? Pick a lead and run Stage 2! 🚀
