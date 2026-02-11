/**
 * Competitor Search using Google Places API
 * Finds real local competitors with actual business data
 * 
 * Configuration:
 * - Search radius: 25 miles (40 km) from city center
 * - Max competitors shown: 5 (top rated/most reviewed) (reduced from 8 to avoid token limits)
 * - Fetches: Accurate ratings, reviews, website, phone, hours
 */

// Configuration constants
const SEARCH_RADIUS_KM = 40; // ~25 miles
const MAX_COMPETITORS = 5; // Number of competitors to return (reduced from 8 to avoid token limits)
const MAX_REVIEWS_PER_COMPETITOR = 2; // Most recent reviews to fetch (reduced to optimize prompt size)

/**
 * Sanitizes text for safe inclusion in JSON prompts
 * Removes/escapes problematic characters that cause JSON parsing errors
 */
function sanitizeTextForJSON(text: string): string {
  if (!text) return '';
  
  return text
    // Remove or replace actual newlines
    .replace(/\n/g, ' ')
    .replace(/\r/g, '')
    // Replace smart quotes with regular quotes
    .replace(/[\u201C\u201D]/g, '"')  // Smart double quotes
    .replace(/[\u2018\u2019]/g, "'")  // Smart single quotes
    // Remove other problematic Unicode characters
    .replace(/[\u2013\u2014]/g, '-')  // Em/en dashes
    .replace(/\u2026/g, '...')         // Ellipsis
    // Replace double quotes with single quotes to avoid escaping issues
    .replace(/"/g, "'")
    // Remove any remaining control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Trim excessive whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

export async function searchCompetitors(
  googleMapsKey: string,
  city: string,
  state: string,
  propertyLat?: number,
  propertyLng?: number
): Promise<any[]> {
  const competitorSearchResults: any[] = [];
  
  if (!googleMapsKey || !city || !state) {
    console.log(`[COMPETITOR SEARCH] ⚠️ Missing required parameters`);
    return [];
  }

  try {
    console.log(`[COMPETITOR SEARCH] 🔍 Searching for local competitors in ${city}, ${state}...`);
    console.log(`[COMPETITOR SEARCH] 📍 Search radius: ${SEARCH_RADIUS_KM}km (~${Math.round(SEARCH_RADIUS_KM * 0.621371)} miles)`);
    console.log(`[COMPETITOR SEARCH] 🎯 Max competitors to return: ${MAX_COMPETITORS}`);
    const searchStartTime = Date.now();
    
    // STEP 1: Use Text Search to find competitor place_ids
    const searchQuery = `landscape lawn care irrigation services in ${city} ${state}`;
    let placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${googleMapsKey}`;
    
    // If we have property coordinates, add location bias for better radius control
    if (propertyLat && propertyLng) {
      placesUrl += `&location=${propertyLat},${propertyLng}&radius=${SEARCH_RADIUS_KM * 1000}`; // Convert km to meters
      console.log(`[COMPETITOR SEARCH] 📍 Using property location: ${propertyLat}, ${propertyLng}`);
    }
    
    console.log(`[COMPETITOR SEARCH] 🔍 Text Search query: "${searchQuery}"`);
    console.log(`[COMPETITOR SEARCH] 🔍 API Key starts with: ${googleMapsKey?.substring(0, 10)}...`);
    
    try {
      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Search timeout')), 10000)
      );
      
      const fetchPromise = fetch(placesUrl).then(r => r.json());
      const placesData = await Promise.race([fetchPromise, timeoutPromise]) as any;
      
      if (placesData.error_message) {
        console.log(`[COMPETITOR SEARCH] ⚠️ Places API error: ${placesData.error_message}`);
        console.log(`[COMPETITOR SEARCH] 🔍 Status: ${placesData.status}`);
        
        // Provide helpful guidance
        if (placesData.status === 'REQUEST_DENIED') {
          console.log(`[COMPETITOR SEARCH] 🔧 FIX: Check your API key restrictions`);
          console.log(`[COMPETITOR SEARCH] 🔧 Make sure Places API is enabled and key has access`);
        }
      } else if (placesData.results && placesData.results.length > 0) {
        console.log(`[COMPETITOR SEARCH] ✅ Found ${placesData.results.length} initial results from Text Search`);
        
        // STEP 2: Fetch detailed info for top competitors using Place Details API
        // This gives us ACCURATE ratings, reviews, website, phone, etc.
        const topPlaces = placesData.results.slice(0, MAX_COMPETITORS);
        
        console.log(`[COMPETITOR SEARCH] 🔄 Fetching detailed data for ${topPlaces.length} competitors...`);
        
        // Fetch details for all competitors in parallel
        const detailsPromises = topPlaces.map(async (place: any) => {
          try {
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,reviews,business_status,opening_hours,price_level,types&key=${googleMapsKey}`;
            
            const detailsResponse = await fetch(detailsUrl);
            const detailsData = await detailsResponse.json();
            
            if (detailsData.status === 'OK' && detailsData.result) {
              const details = detailsData.result;
              
              return {
                title: details.name,
                place_id: place.place_id,
                address: details.formatted_address,
                phone: details.formatted_phone_number || null,
                website: details.website || null,
                google_maps_link: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
                rating: details.rating || null,
                user_ratings_total: details.user_ratings_total || 0,
                business_status: details.business_status || 'OPERATIONAL',
                price_level: details.price_level || null, // 0-4 scale (free to expensive)
                types: details.types || [],
                is_open_now: details.opening_hours?.open_now || null,
                reviews: details.reviews ? details.reviews.slice(0, MAX_REVIEWS_PER_COMPETITOR).map((review: any) => ({
                  author: review.author_name,
                  rating: review.rating,
                  text: sanitizeTextForJSON(review.text).substring(0, 200), // Limit review text to 200 chars
                  time: review.relative_time_description,
                  timestamp: review.time
                })) : [],
                query: searchQuery
              };
            } else {
              console.log(`[COMPETITOR SEARCH] ⚠️ Could not fetch details for ${place.name}: ${detailsData.status}`);
              return null;
            }
          } catch (error: any) {
            console.error(`[COMPETITOR SEARCH] Error fetching details for ${place.name}:`, error.message);
            return null;
          }
        });
        
        const detailedResults = await Promise.all(detailsPromises);
        
        // Filter out any failed requests
        const validResults = detailedResults.filter(r => r !== null);
        competitorSearchResults.push(...validResults);
        
        console.log(`[COMPETITOR SEARCH] ✅ Successfully fetched detailed data for ${validResults.length} competitors`);
        console.log(`[COMPETITOR SEARCH] 📊 Competitor names:`, validResults.map((p: any) => `${p.title} (${p.rating}⭐)`).join(', '));
        
        // Log sample review data
        if (validResults.length > 0 && validResults[0].reviews?.length > 0) {
          console.log(`[COMPETITOR SEARCH] 💬 Sample review from ${validResults[0].title}:`, validResults[0].reviews[0].text.substring(0, 100) + '...');
        }
      } else {
        console.log(`[COMPETITOR SEARCH] ⚠️ No competitors found in Places API results`);
      }
    } catch (searchError: any) {
      console.error(`[COMPETITOR SEARCH] Error searching Places API:`, searchError.message);
    }
    
    const searchDuration = ((Date.now() - searchStartTime) / 1000).toFixed(1);
    console.log(`[COMPETITOR SEARCH] ✅ Found ${competitorSearchResults.length} total competitors in ${searchDuration}s`);
  } catch (error: any) {
    console.error(`[COMPETITOR SEARCH] Error during competitor search:`, error.message);
  }

  return competitorSearchResults;
}