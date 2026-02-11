import { Sparkles, Star, MessageCircle, Briefcase, Heart, Target, AlertCircle, User, TrendingUp } from "lucide-react";

interface BusinessIntelligenceDisplayProps {
  businessIntelligence: any;
}

export function BusinessIntelligenceDisplay({ businessIntelligence }: BusinessIntelligenceDisplayProps) {
  if (!businessIntelligence) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
        <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h4 className="text-lg font-semibold text-gray-900 mb-2">No Business Data Found</h4>
        <p className="text-sm text-gray-600">
          This location was not found in Google's business directory. This may be a residential property or a business without a Google listing.
        </p>
      </div>
    );
  }

  const { business_name, rating, total_reviews, categories, website, phone, description, reviews, ai_insights } = businessIntelligence;

  return (
    <div className="space-y-6">
      {/* Business Profile Header - Light version with full address */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{business_name}</h3>
            {description && (
              <p className="text-sm text-gray-600 mb-3">{description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {rating && (
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold text-gray-900">{rating}</span>
                  <span className="text-gray-500">({total_reviews?.toLocaleString()} reviews)</span>
                </div>
              )}
              {categories && categories.length > 0 && (
                <div className="text-gray-600">
                  {categories.slice(0, 3).map((cat: string) => cat.replace(/_/g, " ")).join(" • ")}
                </div>
              )}
            </div>
          </div>
          {rating && (
            <div className="flex-shrink-0 text-center bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{rating}</div>
              <div className="text-xs text-gray-500 mt-1">Rating</div>
            </div>
          )}
        </div>
        
        {(website || phone) && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200">
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#E64B8B] hover:text-[#d43d7a] transition-colors"
              >
                🌐 {website}
              </a>
            )}
            {phone && (
              <div className="text-sm text-gray-700">
                📞 {phone}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI-Powered Insights */}
      {ai_insights && (
        <div className="space-y-6">
          {/* Conversation Starters - MOST IMPORTANT */}
          {ai_insights.conversation_starters && ai_insights.conversation_starters.length > 0 && (
            <div className="bg-gradient-to-br from-[#E64B8B] to-[#EC6FA0] rounded-xl p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5" />
                <h4 className="text-lg font-bold">Sales Conversation Starters</h4>
              </div>
              <div className="space-y-3">
                {ai_insights.conversation_starters.map((starter: string, index: number) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-[#E64B8B] flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-relaxed">{starter}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid of Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Unique Features */}
            {ai_insights.unique_features && ai_insights.unique_features.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-[#E64B8B]" />
                  <h4 className="font-bold text-gray-900">Unique Features</h4>
                </div>
                <ul className="space-y-2">
                  {ai_insights.unique_features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-[#E64B8B] mt-1">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Customer Love */}
            {ai_insights.customer_love && ai_insights.customer_love.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-5 h-5 text-red-500" />
                  <h4 className="font-bold text-gray-900">What Customers Love</h4>
                </div>
                <div className="space-y-3">
                  {ai_insights.customer_love.map((quote: string, index: number) => (
                    <div key={index} className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
                      <p className="text-sm text-gray-700 italic">"{quote}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Services Offered */}
            {ai_insights.services_offered && ai_insights.services_offered.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-5 h-5 text-blue-500" />
                  <h4 className="font-bold text-gray-900">Services & Offerings</h4>
                </div>
                <ul className="space-y-2">
                  {ai_insights.services_offered.map((service: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{service}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Values & Culture */}
            {ai_insights.values_culture && ai_insights.values_culture.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-purple-500" />
                  <h4 className="font-bold text-gray-900">Values & Culture</h4>
                </div>
                <ul className="space-y-2">
                  {ai_insights.values_culture.map((value: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-purple-500 mt-1">♦</span>
                      <span>{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Pain Points - Sales Opportunities */}
          {ai_insights.pain_points && ai_insights.pain_points.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <h4 className="font-bold text-gray-900">Pain Points Detected (Sales Opportunities)</h4>
              </div>
              <ul className="space-y-2">
                {ai_insights.pain_points.map((pain: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-orange-500 mt-1">⚠</span>
                    <span>{pain}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Opportunity Insights */}
          {ai_insights.opportunity_insights && ai_insights.opportunity_insights.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-green-600" />
                <h4 className="font-bold text-gray-900">Why This Is a Good Fit</h4>
              </div>
              <ul className="space-y-2">
                {ai_insights.opportunity_insights.map((insight: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-600 mt-1">→</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Decision Maker Context */}
          {ai_insights.decision_maker_context && ai_insights.decision_maker_context.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-gray-900">Decision Maker Context</h4>
              </div>
              <ul className="space-y-2">
                {ai_insights.decision_maker_context.map((context: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-600 mt-1">👤</span>
                    <span>{context}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Recent Reviews (if no AI insights) */}
      {!ai_insights && reviews && reviews.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-gray-500" />
            <h4 className="font-bold text-gray-900">Recent Customer Reviews</h4>
          </div>
          <div className="space-y-4">
            {reviews.slice(0, 5).map((review: any, index: number) => (
              <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900">{review.author}</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{review.relative_time}</span>
                </div>
                <p className="text-sm text-gray-700">{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}