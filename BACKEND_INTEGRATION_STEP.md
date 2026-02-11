# Backend Integration - Add Real Research to Stage 2

## Location
Insert this code in `/supabase/functions/server/index.tsx` at **line 1807** (right before "Step 2: Generate context-aware OpenAI Vision prompt")

## Code to Insert

```typescript
// Step 1.5: REAL RESEARCH - Web search + Review analysis
console.log(`[PROPERTY ANALYSIS] 🔍 Starting REAL RESEARCH for: ${companyName}`);

let realResearchData: any = null;
const city = lead.geo_enrichment?.city || "";
const researchPlaceId = placesData?.results?.[0]?.place_id;

try {
  const searchResults: any[] = [];
  const customSearchEngineId = settings?.google_custom_search_id;
  
  // Web search for news/events if Custom Search is configured
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
  
  // Enhanced Google Places reviews
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
        
        if (text.includes('patio') || text.includes('outdoor') || text.includes('garden') || text.includes('outside')) {
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

## Then Update the OpenAI Prompt

Find the line where `visionPrompt` is sent to OpenAI (around line 2100-2200). Add real research data to the prompt:

```typescript
// Add real research context to the prompt if available
if (realResearchData && (realResearchData.web_search_results.length > 0 || realResearchData.review_themes.outdoor_mentions.length > 0)) {
  visionPrompt += `\n\n=== REAL RESEARCH DATA ===\n`;
  
  if (realResearchData.web_search_results.length > 0) {
    visionPrompt += `\nRecent News & Events:\n`;
    realResearchData.web_search_results.forEach((result: any, idx: number) => {
      visionPrompt += `${idx + 1}. ${result.title}\n   ${result.snippet}\n   Source: ${result.source}\n\n`;
    });
  }
  
  if (realResearchData.review_themes.outdoor_mentions.length > 0) {
    visionPrompt += `\nCustomer Reviews Mentioning Outdoor/Landscaping:\n`;
    realResearchData.review_themes.outdoor_mentions.slice(0, 5).forEach((mention: any) => {
      visionPrompt += `- "${mention.text}" (${mention.rating}⭐)\n`;
    });
  }
  
  if (realResearchData.enhanced_places.website) {
    visionPrompt += `\nWebsite: ${realResearchData.enhanced_places.website}\n`;
  }
  
  visionPrompt += `\nUSE THIS REAL DATA TO CREATE AUTHENTIC CONVERSATION STARTERS!\n`;
}
```

## What This Does

✅ **Searches Google** for recent news, events, fundraisers, community involvement
✅ **Analyzes Google Reviews** for outdoor/landscaping mentions
✅ **Collects Contact Data** (website, phone, Google Maps link)
✅ **Feeds Real Data to AI** so it creates authentic insights

### Example Output:
- "I saw you hosted the fire department fundraiser last month"
- "Congrats on your 25th anniversary celebration"
- "12 customers mentioned your patio in recent reviews"
- "Recent review: 'The outdoor garden seating is gorgeous'"

This transforms AI from guessing to **real sales intelligence**!
