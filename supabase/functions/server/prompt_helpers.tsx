/**
 * Helper functions for building AI prompts
 */

/**
 * Builds the competitor analysis instructions for the prompt
 */
export function buildCompetitorInstructions(competitorCount: number): string {
  return `
    YOUR TASK: Analyze these REAL search results and structure them according to the schema below.
    
    🚨 CRITICAL INSTRUCTION: You MUST include ALL ${competitorCount} competitors listed above in your local_providers array.
    DO NOT cherry-pick, filter, or limit the number. Include every single competitor shown.
    
    For each legitimate landscape/lawn care/irrigation business found:
    - Extract company name from title (use EXACT name provided)
    - Use the actual business website URL provided (if available)
    - Use the exact Google rating and review count provided
    - Include actual review quotes from the reviews shown above
    - Extract location info from the business address
    - For fields not provided, use "Unknown" rather than guessing
  `;
}

/**
 * Formats a single competitor's data for the GPT prompt
 * Includes all details from Google Places API: ratings, reviews, website, etc.
 */
export function formatCompetitorForPrompt(result: any, idx: number): string {
  // Helper function to escape quotes and special characters in text
  const sanitizeText = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/\\/g, '\\\\')  // Escape backslashes first
      .replace(/"/g, '\\"')    // Escape double quotes
      .replace(/\n/g, ' ')     // Replace newlines with spaces
      .replace(/\r/g, '')      // Remove carriage returns
      .replace(/\t/g, ' ')     // Replace tabs with spaces
      .trim();
  };
  
  let formatted = `Result ${idx + 1}: ${sanitizeText(result.title)}\n`;
  formatted += `    - Business Address: ${sanitizeText(result.address || result.snippet || 'Unknown')}\n`;
  formatted += `    - Business Website: ${result.website || 'Not available'}\n`;
  formatted += `    - Google Maps Link: ${result.google_maps_link || result.link}\n`;
  formatted += `    - Phone: ${result.phone || 'Not available'}\n`;
  formatted += `    - Google Rating: ${result.rating ? `${result.rating}/5 stars` : 'No rating'} (${result.user_ratings_total || 0} reviews)\n`;
  formatted += `    - Business Status: ${result.business_status || 'Unknown'}\n`;
  
  if (result.reviews && result.reviews.length > 0) {
    formatted += `    - Recent Customer Reviews:\n`;
    // Limit to first 3 reviews to reduce token usage
    result.reviews.slice(0, 3).forEach((review: any, ridx: number) => {
      const reviewText = sanitizeText(review.text || '');
      const truncatedText = reviewText.substring(0, 100); // Reduced from 120 to 100
      formatted += `      ${ridx + 1}. ${review.rating}⭐ by ${sanitizeText(review.author || 'Anonymous')} (${review.time || 'Unknown'}):\n`;
      formatted += `         "${truncatedText}${reviewText.length > 100 ? '...' : ''}"\n`;
    });
  }
  
  return formatted;
}