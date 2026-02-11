# Real Research Integration Instructions

## What We Need To Add

After line 1806 in `/supabase/functions/server/index.tsx` (right after the property type detection), add this REAL RESEARCH code:

```typescript
// Step 1.5: REAL RESEARCH - Search for news, events, community involvement
console.log(`[PROPERTY ANALYSIS] 🔍 Starting REAL RESEARCH for: ${companyName}`);

let realResearchData: any = null;
const city = lead.geo_enrichment?.city || "";
const researchPlaceId = placesData?.results?.[0]?.place_id;

try {
  const searchResults: any[] = [];
  const customSearchEngineId = settings?.google_custom_search_id;
  
  // Web search for news, events, community activity
  if (customSearchEngineId && companyName && city) {
    console.log(`[PROPERTY ANALYSIS] Searching web for recent news and events...`);
    
    const searchQueries = [
      `"${companyName}" ${city} news OR event OR fundraiser OR charity OR community OR sponsorship`,
      `"${companyName}" ${city} award OR recognition OR celebration OR anniversary`,
    ];
    
    for (const query of searchQueries) {
      try {
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleMapsKey}&cx=${customSearchEngineId}&q=${encodeURIComponent(query)}&num=5&dateRestrict=y1`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        
        if (searchData.error) {
          console.log(`[PROPERTY ANALYSIS] ⚠️ Custom Search API error: ${searchData.error.message}`);
          break;
        }
        
        if (searchData.items && searchData.items.length > 0) {
          searchResults.push(...searchData.items.map((item: any) => ({
            title: item.title,
            snippet: item.snippet,
            link: item.link,
            source: item.displayLink
          })));
        }
      } catch (err: any) {
        console.log(`[PROPERTY ANALYSIS] Search failed: ${err.message}`);
      }
    }
  }
  
  // Enhanced Google Places data
  let enhancedPlacesData: any = {};
  const reviewThemes: any = {
    outdoor_mentions: [],
    appearance_mentions: [],
    recent_praise: [],
    recent_concerns: []
  };
  
  if (researchPlaceId) {
    const detailedUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${researchPlaceId}&fields=reviews,website,formatted_phone_number,url&key=${googleMapsKey}`;
    const detailedResponse = await fetch(detailedUrl);
    const detailedData = await detailedResponse.json();
    
    if (detailedData.status === "OK" && detailedData.result) {
      enhancedPlacesData = {
        website: detailedData.result.website,
        phone: detailedData.result.formatted_phone_number,
        google_maps_url: detailedData.result.url,
        recent_reviews: detailedData.result.reviews?.slice(0, 15) || []
      };
      
      // Analyze reviews for landscaping themes
      enhancedPlacesData.recent_reviews.forEach((review: any) => {
        const text = (review.text || "").toLowerCase();
        const isRecent = review.time && (Date.now() / 1000 - review.time) < (90 * 24 * 60 * 60);
        
        if (text.includes('patio') || text.includes('outdoor') || text.includes('garden')) {
          reviewThemes.outdoor_mentions.push({ text: review.text.substring(0, 200), rating: review.rating, recent: isRecent });
        }
        
        if (text.includes('beautiful') || text.includes('landscap') || text.includes('gorgeous')) {
          reviewThemes.appearance_mentions.push({ text: review.text.substring(0, 200), rating: review.rating, recent: isRecent });
        }
        
        if (review.rating >= 4 && isRecent) {
          reviewThemes.recent_praise.push(review.text.substring(0, 150));
        } else if (review.rating <= 3 && isRecent) {
          reviewThemes.recent_concerns.push(review.text.substring(0, 150));
        }
      });
    }
  }
  
  realResearchData = {
    web_search_results: searchResults,
    enhanced_places: enhancedPlacesData,
    review_themes: reviewThemes
  };
  
  console.log(`[PROPERTY ANALYSIS] ✅ Research complete: ${searchResults.length} web results, ${enhancedPlacesData.recent_reviews?.length || 0} reviews analyzed`);
  
} catch (researchError: any) {
  console.error(`[PROPERTY ANALYSIS] Research error:`, researchError.message);
}
```

## Setup Required

1. **Enable Google Custom Search API:**
   - Go to: https://programmablesearchengine.google.com/
   - Create a new search engine (search the entire web)
   - Copy the Search Engine ID (looks like: `abc123def456:xyz`)
   - Add it to Settings UI as new field: `google_custom_search_id`

2. **Update Settings Component** (`/src/app/components/Settings.tsx`):
   Add new input field after Google Maps API key:
   ```
   Google Custom Search Engine ID (for web research)
   ```

## What This Provides

### Real Data:
- Recent news articles mentioning the company
- Community events they hosted (fundraisers, sponsorships)
- Awards and recognition
- Social media mentions
- Website URL
- Phone number
- Google Maps listing link

### Review Intelligence:
- Outdoor/patio mentions from customers
- Landscaping/appearance feedback
- Recent praise (last 90 days)
- Recent concerns (last 90 days)

### Example Output:
```
"I saw you hosted the Little League fundraiser last month"
"Congrats on winning Best Italian Restaurant 2025"
"Customers mention your patio 12 times in recent reviews"
"Recent review: 'The outdoor garden seating is gorgeous'"
```

This is REAL research, not AI guessing!
