# Where Is The Google Custom Search Engine ID Field?

## 🎯 Exact Location

### Step 1: Go to Settings
Click **"Settings"** in your app navigation

### Step 2: Scroll Down
Scroll past:
- ✅ Lead Enrichment Provider
- ✅ Email Sending Provider  
- ✅ AI/LLM Provider

### Step 3: Find "Business Opportunity Insight" Section
This is the section with the pink/lotus Target icon (🎯)

### Step 4: Look Under "STAGE 1: GEO ENRICHMENT"
You should see TWO fields:

```
┌─────────────────────────────────────────────────────────┐
│  🎯 Business Opportunity Insight                        │
│  Configure API keys for three-stage opportunity analysis│
│                                                          │
│  ▌ STAGE 1: GEO ENRICHMENT                             │
│  ▌ Google Maps API for satellite imagery               │
│  ▌                                                       │
│  ▌ Google Maps API Key                                  │
│  ▌ [••••••••••••••••••••]  (password field)            │
│  ▌                                                       │
│  ▌ 🔍 Google Custom Search Engine ID (for web research) │
│  ▌ [abc123def456:xyz789]  (text field, monospace)      │
│  ▌                                                       │
│  ▌ 🔍 Enables Real Research: Finds recent news,         │
│  ▌    events, fundraisers, awards, social media...      │
│  ▌ Setup: Go to programmablesearchengine.google.com    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## ❌ If You Still Don't See It:

### Check 1: Browser Cache
```bash
Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
Or: Clear browser cache completely
```

### Check 2: Is the file deployed?
The changes are in `/src/app/pages/SettingsPage.tsx`

### Check 3: Check console for errors
Open browser DevTools (F12) and look for React errors

### Check 4: Search the page
Press Ctrl+F (or Cmd+F) and search for:
- "Custom Search"
- "web research"  
- "programmablesearchengine"

If you find the text, it's there but maybe styling is hiding it.

## 🔍 Debugging: Verify the Code

Open `/src/app/pages/SettingsPage.tsx` and search for line 378-395. You should see:

```typescript
<div>
  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
    <Search size={14} style={{ color: "#E64B8B" }} />
    Google Custom Search Engine ID (for web research)
  </div>
  <input
    type="text"
    value={settings.google_custom_search_id}
    onChange={(e) => setSettings({ ...settings, google_custom_search_id: e.target.value })}
    placeholder="abc123def456:xyz789"
    style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #e5e7eb", fontFamily: "monospace", fontSize: 13 }}
  />
  <div style={{ fontSize: 11, color: "#666", marginTop: 6, lineHeight: 1.5 }}>
    <strong>🔍 Enables Real Research:</strong> Finds recent news, events, fundraisers, awards, social media mentions
    <br />
    <strong>Setup:</strong> Go to <a href="https://programmablesearchengine.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: "#E64B8B", textDecoration: "underline" }}>programmablesearchengine.google.com</a> → Create engine → Search entire web → Copy Search Engine ID
  </div>
</div>
```

If that code exists, the field MUST be visible on the page!

## 📸 What It Looks Like

The field has:
- 🔍 Pink search icon next to the label
- Monospace font (like code)
- Placeholder text: `abc123def456:xyz789`
- Help text below with a clickable link
- Located RIGHT UNDER the Google Maps API Key field

## Still Can't Find It?

Tell me:
1. Can you see the "Business Opportunity Insight" section?
2. Can you see "STAGE 1: GEO ENRICHMENT"?
3. Can you see the Google Maps API Key field?
4. Are there any console errors?

I'll help you troubleshoot!
