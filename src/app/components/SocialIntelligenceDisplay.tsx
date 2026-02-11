import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { ExternalLink, Check, X, Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";

interface SocialPlatformData {
  exists: boolean;
  profile_url: string | null;
  snippet: string | null;
  search_attempted: boolean;
  error?: string;
}

interface SocialIntelligenceProps {
  data: {
    analyzed_at: string;
    platforms: {
      linkedin: SocialPlatformData;
      facebook: SocialPlatformData;
      yelp: SocialPlatformData;
      instagram: SocialPlatformData;
    };
    presence_score: number;
    ai_insights: {
      summary: string;
      strengths: string[];
      gaps: string[];
      opportunities: string[];
      recommended_talking_points: string[];
    };
  };
}

const platformConfig = {
  linkedin: {
    name: 'LinkedIn',
    color: 'bg-blue-600',
    icon: '💼'
  },
  facebook: {
    name: 'Facebook',
    color: 'bg-blue-500',
    icon: '👥'
  },
  yelp: {
    name: 'Yelp',
    color: 'bg-red-600',
    icon: '⭐'
  },
  instagram: {
    name: 'Instagram',
    color: 'bg-pink-600',
    icon: '📸'
  }
};

export function SocialIntelligenceDisplay({ data }: SocialIntelligenceProps) {
  if (!data) {
    return null;
  }

  const { platforms, presence_score, ai_insights } = data;

  // Calculate presence percentage
  const presencePercentage = (presence_score / 4) * 100;
  
  // Determine overall rating
  const getPresenceRating = (score: number) => {
    if (score >= 3) return { label: 'Strong', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (score === 2) return { label: 'Moderate', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { label: 'Weak', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  const rating = getPresenceRating(presence_score);
  
  // Check if all platforms have the same error (API key issue)
  const allPlatformErrors = Object.values(platforms).every(p => p.error);
  const firstError = Object.values(platforms).find(p => p.error)?.error;
  const isAuthError = firstError?.includes('Invalid Perplexity API key');

  return (
    <Card className="border-[#E64B8B]/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              📱 Social Media Intelligence
            </CardTitle>
            <CardDescription className="mt-1">
              Target company's digital presence across key platforms
            </CardDescription>
          </div>
          <div className={`px-4 py-2 rounded-lg ${rating.bgColor}`}>
            <div className={`text-2xl font-bold text-center ${rating.color}`}>
              {presence_score}/4
            </div>
            <div className={`text-xs font-medium text-center ${rating.color}`}>
              {rating.label}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Alert for API Key Issues */}
        {allPlatformErrors && isAuthError && (
          <Alert className="border-red-300 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-sm">
              <strong className="text-red-900">Configuration Required:</strong> {firstError}
              <br />
              <span className="text-xs text-red-700 mt-1 block">
                Go to Admin → Settings → Add Perplexity API key to enable social intelligence.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Platform Grid */}
        <div>
          <h4 className="text-sm font-semibold mb-3 text-gray-700">Platform Presence</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(platforms).map(([key, platform]) => {
              const config = platformConfig[key as keyof typeof platformConfig];
              return (
                <div
                  key={key}
                  className={`p-4 rounded-lg border-2 ${
                    platform.exists
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{config.icon}</span>
                      <div>
                        <div className="font-semibold text-sm">{config.name}</div>
                        {platform.error && (
                          <div className="text-xs text-red-600">Search error</div>
                        )}
                      </div>
                    </div>
                    {platform.exists ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  {platform.exists && platform.profile_url && (
                    <a
                      href={platform.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-[#E64B8B] hover:underline mt-2"
                    >
                      View Profile
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {platform.exists && !platform.profile_url && (
                    <div className="text-xs text-gray-600 mt-2">
                      Profile found (URL not extracted)
                    </div>
                  )}

                  {!platform.exists && platform.search_attempted && (
                    <div className="text-xs text-gray-500 mt-2">
                      No profile found
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Insights Summary */}
        <Alert className="border-blue-200 bg-blue-50">
          <Lightbulb className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-gray-700">
            <strong className="text-blue-900">AI Analysis:</strong> {ai_insights.summary}
          </AlertDescription>
        </Alert>

        {/* Strengths */}
        {ai_insights.strengths && ai_insights.strengths.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Strengths
            </h4>
            <div className="space-y-1">
              {ai_insights.strengths.map((strength, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{strength}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gaps */}
        {ai_insights.gaps && ai_insights.gaps.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              Gaps & Weaknesses
            </h4>
            <div className="space-y-1">
              {ai_insights.gaps.map((gap, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                  <X className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>{gap}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Opportunities */}
        {ai_insights.opportunities && ai_insights.opportunities.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
            <h4 className="text-sm font-semibold mb-3 text-purple-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Strategic Opportunities
            </h4>
            <div className="space-y-2">
              {ai_insights.opportunities.map((opportunity, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-purple-600 font-bold mt-0.5">→</span>
                  <span>{opportunity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sales Talking Points */}
        {ai_insights.recommended_talking_points && ai_insights.recommended_talking_points.length > 0 && (
          <div className="bg-gradient-to-r from-[#E64B8B]/5 to-[#E64B8B]/10 p-4 rounded-lg border-2 border-[#E64B8B]/30">
            <h4 className="text-sm font-semibold mb-3 text-[#E64B8B] flex items-center gap-2">
              💬 Recommended Sales Talking Points
            </h4>
            <div className="space-y-2">
              {ai_insights.recommended_talking_points.map((point, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3 rounded border border-[#E64B8B]/20 text-sm text-gray-700"
                >
                  <span className="text-[#E64B8B] font-semibold">"{point}"</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Analysis completed: {new Date(data.analyzed_at).toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}