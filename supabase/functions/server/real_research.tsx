// Real Research Engine - Web search, social media, news, events
// This module performs actual research that a good sales rep would do manually

export async function performRealResearch(params: {
  companyName: string;
  city: string;
  placeId?: string;
  googleMapsKey: string;
  customSearchEngineId?: string;
}) {
  const { companyName, city, placeId, googleMapsKey, customSearchEngineId } = params;
  
  console.log(`[REAL RESEARCH] 🔍 Starting research for: ${companyName}`);
  
  const searchResults: any[] = [];
  let enhancedPlacesData: any = {};
  const reviewThemes: any = {
    landscaping_mentions: [],
    outdoor_mentions: [],
    appearance_mentions: [],
    recent_praise: [],
    recent_concerns: []
  };
  
  try {
    // ========== WEB SEARCH FOR NEWS, EVENTS, COMMUNITY INVOLVEMENT ==========
    if (customSearchEngineId) {
      console.log(`[REAL RESEARCH] Searching web for recent activity...`);
      
      const searchQueries = [
        `"${companyName}" ${city} news OR event OR fundraiser OR charity OR community OR sponsorship`,
        `"${companyName}" ${city} award OR recognition OR celebration OR anniversary OR milestone`,
        `"${companyName}" ${city} Facebook OR Instagram OR "social media"`,
      ];
      
      for (const query of searchQueries) {
        try {
          const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleMapsKey}&cx=${customSearchEngineId}&q=${encodeURIComponent(query)}&num=5&dateRestrict=y1`; // Last year
          const searchResponse = await fetch(searchUrl);
          const searchData = await searchResponse.json();
          
          if (searchData.error) {
            console.log(`[REAL RESEARCH] ⚠️ Search API error: ${searchData.error.message}`);
            
            // Provide helpful guidance based on error type
            if (searchData.error.message.includes('blocked')) {
              console.log(`[REAL RESEARCH] 🔧 FIX: Your Google Maps API key has restrictions.`);
              console.log(`[REAL RESEARCH] 🔧 Go to: https://console.cloud.google.com/apis/credentials`);
              console.log(`[REAL RESEARCH] 🔧 Edit your API key and either:`);
              console.log(`[REAL RESEARCH] 🔧   1. Select "Don't restrict key", OR`);
              console.log(`[REAL RESEARCH] 🔧   2. Add "Custom Search API" to the allowed APIs list`);
            } else if (searchData.error.message.includes('not been used') || searchData.error.message.includes('disabled')) {
              console.log(`[REAL RESEARCH] 🔧 FIX: Enable the Custom Search API`);
              console.log(`[REAL RESEARCH] 🔧 Go to: ${searchData.error.message.match(/https:\/\/[^\s]+/)?.[0] || 'Google Cloud Console'}`);
            } else if (searchData.error.message.includes('quota')) {
              console.log(`[REAL RESEARCH] 🔧 FIX: API quota exceeded. Wait or increase quota.`);
            } else if (searchData.error.message.includes('API key not valid')) {
              console.log(`[REAL RESEARCH] 🔧 FIX: Google Maps API key doesn't work for Custom Search`);
              console.log(`[REAL RESEARCH] 🔧 User needs to enable Custom Search API in Google Cloud Console`);
            }
            
            break; // Stop trying if API key is wrong
          }
          
          if (searchData.items && searchData.items.length > 0) {
            searchResults.push(...searchData.items.map((item: any) => ({
              title: item.title,
              snippet: item.snippet,
              link: item.link,
              source: item.displayLink,
              query_type: query.includes('news') ? 'news_events' : query.includes('award') ? 'recognition' : 'social_media'
            })));
          }
        } catch (err: any) {
          console.log(`[REAL RESEARCH] Search query failed: ${err.message}`);
        }
      }
    } else {
      console.log(`[REAL RESEARCH] ⚠️ No Custom Search Engine ID configured`);
      console.log(`[REAL RESEARCH] To enable web research:`);
      console.log(`  1. Go to https://programmablesearchengine.google.com/`);
      console.log(`  2. Create a new search engine (search the entire web)`);
      console.log(`  3. Copy the Search Engine ID`);
      console.log(`  4. Add it to Settings as 'Google Custom Search Engine ID'`);
    }
    
    // ========== ENHANCED GOOGLE PLACES DATA (REVIEWS, WEBSITE, PHONE) ==========
    if (placeId) {
      console.log(`[REAL RESEARCH] Fetching detailed place data...`);
      
      const detailedUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,reviews,website,formatted_phone_number,url,editorial_summary&key=${googleMapsKey}`;
      const detailedResponse = await fetch(detailedUrl);
      const detailedData = await detailedResponse.json();
      
      if (detailedData.status === "OK" && detailedData.result) {
        enhancedPlacesData = {
          website: detailedData.result.website || null,
          phone: detailedData.result.formatted_phone_number || null,
          google_maps_url: detailedData.result.url || null,
          editorial_summary: detailedData.result.editorial_summary?.overview || null,
          recent_reviews: detailedData.result.reviews?.slice(0, 15) || []
        };
        
        console.log(`[REAL RESEARCH] Found ${enhancedPlacesData.recent_reviews.length} reviews`);
      }
    }
    
    // ========== ANALYZE REVIEWS FOR THEMES ==========
    if (enhancedPlacesData.recent_reviews && enhancedPlacesData.recent_reviews.length > 0) {
      console.log(`[REAL RESEARCH] Analyzing reviews for landscaping themes...`);
      
      enhancedPlacesData.recent_reviews.forEach((review: any) => {
        const text = (review.text || "").toLowerCase();
        const isRecent = review.time && (Date.now() / 1000 - review.time) < (90 * 24 * 60 * 60); // Last 90 days
        
        // Outdoor/patio mentions
        if (text.includes('patio') || text.includes('outdoor') || text.includes('garden') || 
            text.includes('outside') || text.includes('terrace') || text.includes('deck')) {
          reviewThemes.outdoor_mentions.push({
            text: review.text.substring(0, 250),
            rating: review.rating,
            author: review.author_name,
            recent: isRecent,
            time: review.time
          });
        }
        
        // Appearance/landscaping mentions
        if (text.includes('beautiful') || text.includes('clean') || text.includes('well-maintained') || 
            text.includes('gorgeous') || text.includes('landscap') || text.includes('grounds') ||
            text.includes('grass') || text.includes('flowers') || text.includes('curb appeal')) {
          reviewThemes.appearance_mentions.push({
            text: review.text.substring(0, 250),
            rating: review.rating,
            author: review.author_name,
            recent: isRecent,
            time: review.time
          });
        }
        
        // Recent positive feedback
        if (review.rating >= 4 && isRecent) {
          reviewThemes.recent_praise.push({
            text: review.text.substring(0, 200),
            rating: review.rating
          });
        }
        
        // Recent concerns
        if (review.rating <= 3 && isRecent) {
          reviewThemes.recent_concerns.push({
            text: review.text.substring(0, 200),
            rating: review.rating
          });
        }
      });
      
      console.log(`[REAL RESEARCH] Review analysis:`);
      console.log(`  - Outdoor mentions: ${reviewThemes.outdoor_mentions.length}`);
      console.log(`  - Appearance mentions: ${reviewThemes.appearance_mentions.length}`);
      console.log(`  - Recent praise: ${reviewThemes.recent_praise.length}`);
      console.log(`  - Recent concerns: ${reviewThemes.recent_concerns.length}`);
    }
    
    // ========== COMPILE RESEARCH RESULTS ==========
    const researchData = {
      web_search_results: searchResults,
      enhanced_places: enhancedPlacesData,
      review_themes: reviewThemes,
      research_timestamp: new Date().toISOString(),
      has_web_results: searchResults.length > 0,
      has_review_insights: reviewThemes.outdoor_mentions.length > 0 || reviewThemes.appearance_mentions.length > 0
    };
    
    console.log(`[REAL RESEARCH] ✅ Research complete:`);
    console.log(`  - Web search results: ${searchResults.length}`);
    console.log(`  - Has meaningful insights: ${researchData.has_web_results || researchData.has_review_insights}`);
    
    return researchData;
    
  } catch (error: any) {
    console.error(`[REAL RESEARCH] Error:`, error.message);
    return {
      web_search_results: [],
      enhanced_places: enhancedPlacesData,
      review_themes: reviewThemes,
      research_timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}
