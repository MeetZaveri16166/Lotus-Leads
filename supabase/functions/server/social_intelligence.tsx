// Social Intelligence Module - Analyze target company's social media presence
// Uses Perplexity API for web search + OpenAI for synthesis

interface SocialPlatformData {
  exists: boolean;
  profile_url: string | null;
  snippet: string | null;
  search_attempted: boolean;
  error?: string;
}

interface SocialIntelligenceResult {
  analyzed_at: string;
  platforms: {
    linkedin: SocialPlatformData;
    facebook: SocialPlatformData;
    yelp: SocialPlatformData;
    instagram: SocialPlatformData;
  };
  presence_score: number; // 0-4
  ai_insights: {
    summary: string;
    strengths: string[];
    gaps: string[];
    opportunities: string[];
    recommended_talking_points: string[];
  };
  web_research_results: Array<{
    platform: string;
    query: string;
    found: boolean;
    result: string;
  }>;
}

/**
 * Search for a company's presence on a specific social platform using Perplexity
 */
async function searchPlatformPresence(
  companyName: string,
  city: string,
  state: string,
  platform: string,
  perplexityKey: string
): Promise<{ found: boolean; url: string | null; snippet: string | null; error?: string }> {
  try {
    console.log(`[SOCIAL INTEL] 🔍 Searching ${platform} for: ${companyName}`);
    
    // Craft platform-specific search queries
    const platformQueries: Record<string, string> = {
      linkedin: `Find the official LinkedIn company page URL for "${companyName}" located in ${city}, ${state}. Return the exact LinkedIn URL if found, or "NOT FOUND" if the company has no LinkedIn presence.`,
      facebook: `Find the official Facebook business page URL for "${companyName}" in ${city}, ${state}. Return the exact Facebook URL if found, or "NOT FOUND" if the company has no Facebook page.`,
      yelp: `Find the Yelp business page URL for "${companyName}" in ${city}, ${state}. Return the exact Yelp URL if found, or "NOT FOUND" if the company is not on Yelp.`,
      instagram: `Find the official Instagram account URL for "${companyName}" in ${city}, ${state}. Return the exact Instagram URL if found, or "NOT FOUND" if the company has no Instagram presence.`
    };
    
    const query = platformQueries[platform] || `Find ${platform} for \"${companyName}\" in ${city}, ${state}`;
    
    // DEBUG: Log API call details
    console.log(`[SOCIAL INTEL] 🔑 API Key exists: ${!!perplexityKey}`);
    console.log(`[SOCIAL INTEL] 🔑 API Key length: ${perplexityKey.length}`);
    console.log(`[SOCIAL INTEL] 🔑 API Key starts with: ${perplexityKey.substring(0, 15)}...`);
    console.log(`[SOCIAL INTEL] 📋 Using model: sonar`);
    console.log(`[SOCIAL INTEL] 🌐 Endpoint: https://api.perplexity.ai/chat/completions`);
    
    // Call Perplexity Sonar API (online search model)
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',  // Perplexity's basic online search model
        messages: [{
          role: 'user',
          content: query
        }],
        temperature: 0.2,  // Low temperature for factual searches
        max_tokens: 300
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SOCIAL INTEL] ❌ Perplexity API error for ${platform}:`, errorText);
      
      // Detect 401 authentication errors
      if (response.status === 401) {
        return { 
          found: false, 
          url: null, 
          snippet: null, 
          error: 'Invalid Perplexity API key - check Settings'
        };
      }
      
      return { found: false, url: null, snippet: null, error: `API error: ${response.status}` };
    }
    
    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "";
    
    console.log(`[SOCIAL INTEL] 📝 ${platform} response: ${answer.substring(0, 150)}...`);
    
    // Parse response to determine if profile was found
    const notFoundIndicators = [
      'NOT FOUND',
      'not found',
      'no LinkedIn',
      'no Facebook',
      'no Yelp',
      'no Instagram',
      'does not have',
      'doesn\'t have',
      'no official',
      'could not find',
      'unable to find'
    ];
    
    const foundProfile = !notFoundIndicators.some(indicator => 
      answer.toLowerCase().includes(indicator.toLowerCase())
    );
    
    // Extract URL if found
    let extractedUrl: string | null = null;
    if (foundProfile) {
      // Look for URLs in the response
      const urlPatterns: Record<string, RegExp> = {
        linkedin: /https?:\/\/(www\.)?linkedin\.com\/company\/[^\s]+/i,
        facebook: /https?:\/\/(www\.)?facebook\.com\/[^\s]+/i,
        yelp: /https?:\/\/(www\.)?yelp\.com\/biz\/[^\s]+/i,
        instagram: /https?:\/\/(www\.)?instagram\.com\/[^\s]+/i
      };
      
      const urlMatch = answer.match(urlPatterns[platform]);
      if (urlMatch) {
        extractedUrl = urlMatch[0].replace(/[),.\]}>]+$/, ''); // Clean trailing punctuation
      }
    }
    
    return {
      found: foundProfile,
      url: extractedUrl,
      snippet: answer.substring(0, 300),
      error: undefined
    };
    
  } catch (error: any) {
    console.error(`[SOCIAL INTEL] ❌ Error searching ${platform}:`, error.message);
    return { found: false, url: null, snippet: null, error: error.message };
  }
}

/**
 * Use OpenAI to synthesize social intelligence insights
 */
async function synthesizeInsights(
  companyName: string,
  platformData: Record<string, SocialPlatformData>,
  openaiKey: string
): Promise<{
  summary: string;
  strengths: string[];
  gaps: string[];
  opportunities: string[];
  recommended_talking_points: string[];
}> {
  try {
    console.log(`[SOCIAL INTEL] 🤖 Synthesizing insights with OpenAI...`);
    
    const platformSummary = Object.entries(platformData)
      .map(([platform, data]) => `${platform}: ${data.exists ? '✓ Found' : '✗ Not found'}${data.profile_url ? ` (${data.profile_url})` : ''}`)
      .join('\n');
    
    const prompt = `You are analyzing the social media presence of a landscaping/lawn care company for sales prospecting purposes.

COMPANY: ${companyName}

SOCIAL MEDIA PRESENCE:
${platformSummary}

TASK: Provide a strategic analysis of their social media presence to help a salesperson craft a compelling pitch.

Respond in JSON format:
{
  "summary": "2-sentence overview of their social presence",
  "strengths": ["array of 1-3 strengths if they have good presence"],
  "gaps": ["array of 1-3 platforms they're missing or underutilizing"],
  "opportunities": ["array of 2-3 specific opportunities to improve their presence"],
  "recommended_talking_points": ["array of 2-3 specific talking points a salesperson could use, referencing their actual presence"]
}

Be specific and actionable. If they have weak presence overall, focus on competitive disadvantages and missed opportunities.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a strategic sales intelligence analyst specializing in social media presence analysis. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SOCIAL INTEL] ❌ OpenAI synthesis error:`, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    const insights = JSON.parse(data.choices[0].message.content);
    
    console.log(`[SOCIAL INTEL] ✅ AI insights generated`);
    
    return insights;
    
  } catch (error: any) {
    console.error(`[SOCIAL INTEL] ❌ Synthesis error:`, error.message);
    
    // Return fallback insights
    return {
      summary: "Unable to generate AI insights due to an error.",
      strengths: [],
      gaps: [],
      opportunities: ["Establish or improve social media presence"],
      recommended_talking_points: ["Discuss social media marketing strategy"]
    };
  }
}

/**
 * Main function: Analyze target company's social media presence
 */
export async function analyzeTargetSocialPresence(params: {
  companyName: string;
  city: string;
  state: string;
  perplexityKey: string;
  openaiKey: string;
}): Promise<SocialIntelligenceResult> {
  const { companyName, city, state, perplexityKey, openaiKey } = params;
  
  console.log(`[SOCIAL INTEL] 🎯 Starting target social intelligence for: ${companyName}`);
  
  const platforms = ['linkedin', 'facebook', 'yelp', 'instagram'];
  const platformData: Record<string, SocialPlatformData> = {};
  const researchResults: Array<any> = [];
  
  // Search each platform sequentially (to avoid rate limits)
  for (const platform of platforms) {
    const result = await searchPlatformPresence(
      companyName,
      city,
      state,
      platform,
      perplexityKey
    );
    
    platformData[platform] = {
      exists: result.found,
      profile_url: result.url,
      snippet: result.snippet,
      search_attempted: true,
      error: result.error
    };
    
    researchResults.push({
      platform,
      query: `${platform} presence for ${companyName}`,
      found: result.found,
      result: result.snippet || result.error || "No data"
    });
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Calculate presence score (0-4)
  const presenceScore = Object.values(platformData).filter(p => p.exists).length;
  
  console.log(`[SOCIAL INTEL] 📊 Presence score: ${presenceScore}/4 platforms`);
  
  // Generate AI insights
  const aiInsights = await synthesizeInsights(companyName, platformData, openaiKey);
  
  const result: SocialIntelligenceResult = {
    analyzed_at: new Date().toISOString(),
    platforms: {
      linkedin: platformData.linkedin,
      facebook: platformData.facebook,
      yelp: platformData.yelp,
      instagram: platformData.instagram
    },
    presence_score: presenceScore,
    ai_insights: aiInsights,
    web_research_results: researchResults
  };
  
  console.log(`[SOCIAL INTEL] ✅ Analysis complete for ${companyName}`);
  console.log(`[SOCIAL INTEL] 📈 Summary: ${aiInsights.summary}`);
  
  return result;
}