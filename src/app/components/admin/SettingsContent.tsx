import React, { useEffect, useState } from "react";
import { Api } from "@/lib/api";
import { Key, Mail, Sparkles, MapPin, Search, Target, Save, AlertCircle, CheckCircle2, Zap } from "lucide-react";

interface ApiSettings {
  enrichment_provider: string;
  enrichment_api_key: string;
  email_provider: string;
  email_api_key: string;
  email_from_address: string;
  ai_provider: string;
  ai_api_key: string;
  ai_model: string;
  google_maps_api_key: string;
  google_custom_search_id: string;
  perplexity_api_key: string;
  gmail_client_id: string;
  gmail_client_secret: string;
  gmail_refresh_token: string;
  outlook_client_id: string;
  outlook_client_secret: string;
  outlook_refresh_token: string;
}

export function SettingsContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [settings, setSettings] = useState<ApiSettings>({
    enrichment_provider: "mock",
    enrichment_api_key: "",
    email_provider: "mock",
    email_api_key: "",
    email_from_address: "",
    ai_provider: "mock",
    ai_api_key: "",
    ai_model: "",
    google_maps_api_key: "",
    google_custom_search_id: "",
    perplexity_api_key: "",
    gmail_client_id: "",
    gmail_client_secret: "",
    gmail_refresh_token: "",
    outlook_client_id: "",
    outlook_client_secret: "",
    outlook_refresh_token: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await Api.getSettings();
        if (data) {
          setSettings({
            enrichment_provider: data.enrichment_provider || "mock",
            enrichment_api_key: data.enrichment_api_key || "",
            email_provider: data.email_provider || "mock",
            email_api_key: data.email_api_key || "",
            email_from_address: data.email_from_address || "",
            ai_provider: data.ai_provider || "mock",
            ai_api_key: data.ai_api_key || "",
            ai_model: data.ai_model || "",
            google_maps_api_key: data.google_maps_api_key || "",
            google_custom_search_id: data.google_custom_search_id || "",
            perplexity_api_key: data.perplexity_api_key || "",
            gmail_client_id: data.gmail_client_id || "",
            gmail_client_secret: data.gmail_client_secret || "",
            gmail_refresh_token: data.gmail_refresh_token || "",
            outlook_client_id: data.outlook_client_id || "",
            outlook_client_secret: data.outlook_client_secret || "",
            outlook_refresh_token: data.outlook_refresh_token || "",
          });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        // Don't block UI - just use default empty settings
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      console.log('[SETTINGS] Saving settings:', settings);
      await Api.updateSettings(settings);
      console.log('[SETTINGS] Settings saved successfully');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      console.error('[SETTINGS] Error saving settings:', e);
      alert(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const runMigration = async () => {
    if (!confirm("This will update existing enriched leads to appear in the 'Enriched' tab. Continue?")) return;
    
    setMigrating(true);
    try {
      const result: any = await Api.migrateEnrichedLeads();
      alert(`Migration complete!\n\nTotal leads: ${result.stats.total}\nUpdated: ${result.stats.updated}\nSkipped: ${result.stats.skipped}`);
    } catch (e: any) {
      alert(`Migration failed: ${e.message}`);
    } finally {
      setMigrating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-[#E64B8B] rounded-full animate-spin"></div>
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            Configure integrations for enrichment, email, AI, and opportunity analysis
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all border
            ${saving
              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              : saveSuccess
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-white text-[#E64B8B] border-[#E64B8B] hover:bg-[#E64B8B] hover:text-white"
            }
          `}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>
      </div>

      {/* Lead Enrichment Provider */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-[#E64B8B]" />
            <div>
              <h3 className="font-semibold text-gray-900">Lead Enrichment Provider</h3>
              <p className="text-sm text-gray-500">Get email, phone, and company data for leads</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
            <select
              value={settings.enrichment_provider}
              onChange={(e) => setSettings({ ...settings, enrichment_provider: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/20 focus:border-[#E64B8B] transition-all"
            >
              <option value="mock">Mock (for testing)</option>
              <option value="apollo">Apollo.io</option>
              <option value="zoominfo">ZoomInfo</option>
              <option value="clearbit">Clearbit</option>
              <option value="hunter">Hunter.io</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
            <input
              type="password"
              value={settings.enrichment_api_key}
              onChange={(e) => setSettings({ ...settings, enrichment_api_key: e.target.value })}
              placeholder="Enter your API key"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/20 focus:border-[#E64B8B] transition-all font-mono"
            />
            <p className="text-xs text-gray-500 mt-1.5">🔒 Your API key is stored securely and never logged</p>
          </div>
        </div>
      </div>

      {/* Email Provider */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-[#E64B8B]" />
            <div>
              <h3 className="font-semibold text-gray-900">Email Sending Provider</h3>
              <p className="text-sm text-gray-500">Configure outbound email delivery</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
            <select
              value={settings.email_provider}
              onChange={(e) => setSettings({ ...settings, email_provider: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/20 focus:border-[#E64B8B] transition-all"
            >
              <option value="mock">Mock (for testing)</option>
              <option value="gmail">Gmail API</option>
              <option value="outlook">Outlook API</option>
              <option value="sendgrid">SendGrid</option>
              <option value="ses">Amazon SES</option>
              <option value="postmark">Postmark</option>
              <option value="mailgun">Mailgun</option>
            </select>
          </div>

          {/* Gmail OAuth */}
          {settings.email_provider === "gmail" && (
            <div className="bg-blue-50 rounded-xl p-4 space-y-4 border border-blue-200">
              <p className="text-sm text-blue-900 font-medium">Gmail OAuth Configuration</p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Client ID</label>
                <input
                  type="text"
                  value={settings.gmail_client_id}
                  onChange={(e) => setSettings({ ...settings, gmail_client_id: e.target.value })}
                  placeholder="Enter Gmail Client ID"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Client Secret</label>
                <input
                  type="password"
                  value={settings.gmail_client_secret}
                  onChange={(e) => setSettings({ ...settings, gmail_client_secret: e.target.value })}
                  placeholder="Enter Gmail Client Secret"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Refresh Token</label>
                <input
                  type="password"
                  value={settings.gmail_refresh_token}
                  onChange={(e) => setSettings({ ...settings, gmail_refresh_token: e.target.value })}
                  placeholder="Enter Gmail Refresh Token"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm"
                />
              </div>
            </div>
          )}

          {/* Outlook OAuth */}
          {settings.email_provider === "outlook" && (
            <div className="bg-blue-50 rounded-xl p-4 space-y-4 border border-blue-200">
              <p className="text-sm text-blue-900 font-medium">Outlook OAuth Configuration</p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Client ID</label>
                <input
                  type="text"
                  value={settings.outlook_client_id}
                  onChange={(e) => setSettings({ ...settings, outlook_client_id: e.target.value })}
                  placeholder="Enter Outlook Client ID"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Client Secret</label>
                <input
                  type="password"
                  value={settings.outlook_client_secret}
                  onChange={(e) => setSettings({ ...settings, outlook_client_secret: e.target.value })}
                  placeholder="Enter Outlook Client Secret"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Refresh Token</label>
                <input
                  type="password"
                  value={settings.outlook_refresh_token}
                  onChange={(e) => setSettings({ ...settings, outlook_refresh_token: e.target.value })}
                  placeholder="Enter Outlook Refresh Token"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm"
                />
              </div>
            </div>
          )}

          {/* API Key for other providers */}
          {!["gmail", "outlook", "mock"].includes(settings.email_provider) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
              <input
                type="password"
                value={settings.email_api_key}
                onChange={(e) => setSettings({ ...settings, email_api_key: e.target.value })}
                placeholder="Enter your API key"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/20 focus:border-[#E64B8B] transition-all font-mono"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Email Address</label>
            <input
              type="email"
              value={settings.email_from_address}
              onChange={(e) => setSettings({ ...settings, email_from_address: e.target.value })}
              placeholder="hello@yourcompany.com"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/20 focus:border-[#E64B8B] transition-all"
            />
          </div>
        </div>
      </div>

      {/* AI Provider */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#E64B8B]" />
            <div>
              <h3 className="font-semibold text-gray-900">AI/LLM Provider</h3>
              <p className="text-sm text-gray-500">Power intelligent analysis and content generation</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
            <select
              value={settings.ai_provider}
              onChange={(e) => setSettings({ ...settings, ai_provider: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/20 focus:border-[#E64B8B] transition-all"
            >
              <option value="mock">Mock (template-based)</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="together">Together AI</option>
              <option value="perplexity">Perplexity AI</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
            <input
              type="password"
              value={settings.ai_provider === "perplexity" ? settings.perplexity_api_key : settings.ai_api_key}
              onChange={(e) => {
                if (settings.ai_provider === "perplexity") {
                  setSettings({ ...settings, perplexity_api_key: e.target.value });
                } else {
                  setSettings({ ...settings, ai_api_key: e.target.value });
                }
              }}
              placeholder="Enter your API key"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/20 focus:border-[#E64B8B] transition-all font-mono text-sm"
            />
          </div>

          {settings.ai_provider !== "perplexity" && settings.ai_provider !== "mock" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
              <input
                type="text"
                value={settings.ai_model}
                onChange={(e) => setSettings({ ...settings, ai_model: e.target.value })}
                placeholder="e.g., gpt-4o, claude-3-opus"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/20 focus:border-[#E64B8B] transition-all font-mono text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Business Opportunity Insight */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-[#E64B8B]" />
            <div>
              <h3 className="font-semibold text-gray-900">Business Opportunity Insight</h3>
              <p className="text-sm text-gray-500">3-stage opportunity analysis on lead detail pages</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Stage 1 */}
          <div className="border-l-4 border-[#E64B8B] pl-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-[#E64B8B]" />
              <span className="text-sm font-bold text-[#E64B8B] uppercase tracking-wider">Stage 1: Geo Enrichment</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">Google Maps API for satellite imagery and location analysis</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Google Maps API Key</label>
                <input
                  type="password"
                  value={settings.google_maps_api_key}
                  onChange={(e) => setSettings({ ...settings, google_maps_api_key: e.target.value })}
                  placeholder="Enter your Google Maps API key"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/20 focus:border-[#E64B8B] transition-all font-mono text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#E64B8B]" />
                  Google Custom Search Engine ID (CX)
                </label>
                <input
                  type="text"
                  value={settings.google_custom_search_id}
                  onChange={(e) => setSettings({ ...settings, google_custom_search_id: e.target.value })}
                  placeholder="abc123def456:xyz789"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/20 focus:border-[#E64B8B] transition-all font-mono text-sm"
                />
                <div className="mt-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs text-blue-900">
                    <strong>🔍 Enables Real Competitor Research & Property Intelligence:</strong> Uses your Google Maps API key above to search for actual local competitors with real reviews and ratings (Stage 3)
                  </p>
                  <p className="text-xs text-blue-800 mt-2">
                    <strong>⚠️ Note:</strong> This is NOT an API key - it's a Search Engine ID (CX parameter)
                  </p>
                  <p className="text-xs text-blue-800 mt-2">
                    <strong>Quick Setup (2 steps):</strong>
                  </p>
                  <ol className="text-xs text-blue-800 mt-1 ml-4 space-y-1 list-decimal">
                    <li>
                      Go to{" "}
                      <a 
                        href="https://programmablesearchengine.google.com/" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-semibold hover:text-[#E64B8B]"
                      >
                        Google Programmable Search
                      </a>
                      {" "}→ Create new search engine → Search the entire web
                    </li>
                    <li>Copy the "Search Engine ID" (looks like abc123:xyz789) and paste it here</li>
                  </ol>
                  <p className="text-xs text-blue-700 mt-2">
                    <strong>✅ Uses the same Google Maps API key above</strong> - no additional key needed!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stages 2 & 3 Note */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <strong>Stage 2 (Property Analysis) & Stage 3 (Service Mapping)</strong> use the AI/LLM provider configured above (OpenAI recommended for best results)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Migration Tool */}
      <div className="bg-yellow-50 rounded-2xl shadow-sm border border-yellow-200 p-6">
        <div className="flex items-start gap-4">
          <Zap className="w-6 h-6 text-yellow-700 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Data Migration Tool</h3>
            <p className="text-sm text-gray-700 mb-4">
              Update existing enriched leads to appear in the 'Enriched' tab (run once after setup)
            </p>
            <button
              onClick={runMigration}
              disabled={migrating}
              className={`
                px-5 py-2.5 rounded-xl font-semibold text-sm transition-all
                ${migrating
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-yellow-600 text-white hover:bg-yellow-700"
                }
              `}
            >
              {migrating ? "Running Migration..." : "Run Migration"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}