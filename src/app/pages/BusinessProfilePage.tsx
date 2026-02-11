import React, { useEffect, useState } from "react";
import { Api } from "@/lib/api";
import { BusinessProfile } from "@/types/database";
import { AppShell } from "@/app/components/AppShell";
import { Building2, Briefcase, Target, MessageSquare, X, Save, CheckCircle2 } from "lucide-react";

function ChipInput({ value, onChange, placeholder }: any) {
  const [text, setText] = useState("");
  return (
    <div>
      <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg min-h-[44px]">
        {value.map((v: string) => (
          <span key={v} className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md border border-gray-200">
            {v}
            <button
              onClick={() => onChange(value.filter((x: string) => x !== v))}
              className="hover:text-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          value={text}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const v = text.trim();
              if (!v) return;
              if (!value.includes(v)) onChange([...value, v]);
              setText("");
            }
          }}
          className="flex-1 min-w-[200px] border-none outline-none text-sm"
        />
      </div>
      <p className="text-xs text-gray-500 mt-1.5">Press Enter to add items</p>
    </div>
  );
}

export default function BusinessProfilePage({ onNav }: { onNav: (key: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profile, setProfile] = useState<Partial<BusinessProfile>>({
    company_name: "",
    industry: "",
    services: [],
    pain_points: [],
    ideal_customer: "",
    outreach_tone: "consultative",
    extra_context: {},
  });

  useEffect(() => {
    (async () => {
      try {
        const p = await Api.getBusinessProfile();
        if (p) setProfile(p);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await Api.upsertBusinessProfile(profile);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const debugAuth = async () => {
    try {
      const result = await Api.debugAuth();
      console.log('=== AUTH DEBUG RESULT ===');
      console.log(result);
      alert(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Debug auth failed:', error);
      alert('Debug failed: ' + error);
    }
  };

  if (loading) {
    return (
      <AppShell title="Business Profile" active="profile" onNav={onNav}>
        <div className="flex items-center justify-center py-12">
          <div className="inline-flex items-center gap-3 text-gray-500">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-[#E64B8B] rounded-full animate-spin"></div>
            Loading profile...
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Business Profile" active="profile" onNav={onNav}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">Business Profile</h2>
            <p className="text-sm text-gray-600">
              Define your business truth once. LotusLeads uses this to score prospects and personalize outreach.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={debugAuth}
              className="px-3 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              🔍 Debug Auth
            </button>
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
                  Save Profile
                </>
              )}
            </button>
          </div>
        </div>

        {/* Company Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-gray-200">
            <Building2 className="w-5 h-5 text-[#E64B8B]" />
            <h3 className="font-semibold text-gray-900">Company Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input
                value={profile.company_name ?? ""}
                onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                placeholder="Your Company Inc."
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/20 focus:border-[#E64B8B] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
              <input
                value={profile.industry ?? ""}
                onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                placeholder="e.g., Landscaping, SaaS, Consulting"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/20 focus:border-[#E64B8B] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Services & Pain Points */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-gray-200">
            <Briefcase className="w-5 h-5 text-[#E64B8B]" />
            <h3 className="font-semibold text-gray-900">What You Offer</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Services you offer</label>
              <ChipInput
                value={profile.services ?? []}
                onChange={(services: string[]) => setProfile({ ...profile, services })}
                placeholder="e.g., irrigation maintenance, proposal automation, back-office ops"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pain points you solve</label>
              <ChipInput
                value={profile.pain_points ?? []}
                onChange={(pain_points: string[]) => setProfile({ ...profile, pain_points })}
                placeholder="e.g., slow quoting, missed follow-ups, margin pressure"
              />
            </div>
          </div>
        </div>

        {/* Ideal Customer */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-gray-200">
            <Target className="w-5 h-5 text-[#E64B8B]" />
            <h3 className="font-semibold text-gray-900">Target Audience</h3>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ideal customer description</label>
            <textarea
              value={profile.ideal_customer ?? ""}
              onChange={(e) => setProfile({ ...profile, ideal_customer: e.target.value })}
              placeholder="Describe your ideal customer profile, size, characteristics, needs..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/20 focus:border-[#E64B8B] transition-all min-h-[120px]"
            />
          </div>
        </div>

        {/* Outreach Preferences */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-gray-200">
            <MessageSquare className="w-5 h-5 text-[#E64B8B]" />
            <h3 className="font-semibold text-gray-900">Outreach Preferences</h3>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred outreach tone</label>
            <select
              value={profile.outreach_tone ?? "consultative"}
              onChange={(e) => setProfile({ ...profile, outreach_tone: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/20 focus:border-[#E64B8B] transition-all"
            >
              <option value="professional">Professional</option>
              <option value="consultative">Consultative</option>
              <option value="friendly">Friendly</option>
            </select>
          </div>
        </div>
      </div>
    </AppShell>
  );
}