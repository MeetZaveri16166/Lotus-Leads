import React, { useState, useEffect } from "react";
import { AppShell } from "@/app/components/AppShell";
import { Api } from "@/lib/api";
import { ExternalLink } from "lucide-react";

interface Lead {
  apollo_id?: string;
  organization_id?: string;
  full_name: string;
  email: string;
  company_name: string;
  company_city?: string;
  phone: string;
  linkedin: string;
  title?: string;
  first_name?: string;
  last_name?: string;
  company_domain?: string;
  company_state?: string;
  company_country?: string;
}

interface SearchResponse {
  leads: Lead[];
  page: number;
  has_more: boolean;
}

const SENIORITY_OPTIONS = [
  "entry",
  "senior",
  "manager",
  "director",
  "vp",
  "c-suite",
  "owner",
];

const COMPANY_SIZE_OPTIONS = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5001-10000",
  "10001+",
];

const COUNTRY_OPTIONS = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Netherlands",
  "India",
  "Singapore",
  "Japan",
];

export default function IcpPage({ onNav, savedSearch }: { onNav: (key: string) => void; savedSearch?: any }) {
  // Form state
  const [icpName, setIcpName] = useState("");
  const [description, setDescription] = useState("");
  const [jobTitlesInput, setJobTitlesInput] = useState("");
  const [selectedSeniorities, setSelectedSeniorities] = useState<string[]>([]);
  const [industriesInput, setIndustriesInput] = useState("");
  const [selectedCompanySizes, setSelectedCompanySizes] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("United States");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [savedSearchId, setSavedSearchId] = useState<string | null>(null);

  // Results state
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Lead[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingSearch, setSavingSearch] = useState(false);
  
  // Load saved search if provided
  useEffect(() => {
    if (savedSearch) {
      console.log("[ICP PAGE] Loading saved search:", savedSearch);
      setSavedSearchId(savedSearch.id);
      setIcpName(savedSearch.name || "");
      setDescription(savedSearch.description || "");
      setJobTitlesInput((savedSearch.job_titles || []).join(", "));
      setSelectedSeniorities(savedSearch.seniorities || []);
      setIndustriesInput((savedSearch.industries || []).join(", "));
      setSelectedCompanySizes(savedSearch.company_sizes || []);
      setSelectedCountry(savedSearch.country || "United States");
      setCity(savedSearch.city || "");
      setState(savedSearch.state || "");
      setZipCode(savedSearch.zip_code || "");
    }
  }, [savedSearch]);

  const toggleSeniority = (seniority: string) => {
    setSelectedSeniorities((prev) =>
      prev.includes(seniority)
        ? prev.filter((s) => s !== seniority)
        : [...prev, seniority]
    );
  };

  const toggleCompanySize = (size: string) => {
    setSelectedCompanySizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleSearch = async (page = 1) => {
    setSearching(true);
    setSavingSearch(true);
    try {
      const titles = jobTitlesInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const industries = industriesInput
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);

      const payload = {
        titles,
        seniorities: selectedSeniorities,
        industries,
        company_size: selectedCompanySizes,
        country: selectedCountry,
        city,
        state,
        zip_code: zipCode,
        page,
      };

      console.log('[ICP SEARCH] Sending payload:', payload);

      const data = await Api.searchLeads(payload);
      
      if (page === 1) {
        setResults(data.leads);
      } else {
        setResults((prev) => [...prev, ...data.leads]);
      }
      
      setCurrentPage(data.page);
      setHasMore(data.has_more);
    } catch (e: any) {
      console.error('[ICP SEARCH] Error:', e);
      alert(`Search failed: ${e.message}`);
      // Clear results on error
      if (page === 1) {
        setResults([]);
      }
    } finally {
      setSearching(false);
      setSavingSearch(false);
    }
  };

  const loadMore = () => {
    if (!searching && hasMore) {
      handleSearch(currentPage + 1);
    }
  };

  const toggleLeadSelection = (idx: number) => {
    setSelectedLeads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      return Array.from(newSet);
    });
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === results.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(results.map((_, idx) => idx));
    }
  };

  const handleAddToLeads = async () => {
    if (selectedLeads.length === 0) {
      alert("Please select at least one lead to add.");
      return;
    }

    setSaving(true);
    try {
      const selectedResults = selectedLeads.map((idx) => results[idx]);
      
      console.log(`[ADD TO LEADS] Saving ${selectedResults.length} leads...`);
      
      const response = await Api.saveSearchResultsAsLeads(selectedResults);
      
      if (response.skipped > 0) {
        // Some duplicates were skipped
        alert(
          `Added ${response.count} new lead(s) to your Leads list!\n\n` +
          `${response.skipped} duplicate(s) were skipped (already in your database).`
        );
      } else {
        // All leads were added
        alert(`Successfully added ${response.count} lead(s) to your Leads list!`);
      }
      
      setSelectedLeads([]);
      
    } catch (e: any) {
      console.error('[ADD TO LEADS] Error:', e);
      alert(`Failed to add leads: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };
  
  const handleSaveSearch = async () => {
    if (!icpName.trim()) {
      alert("Please enter an ICP name before saving the search.");
      return;
    }
    
    setSavingSearch(true);
    try {
      const titles = jobTitlesInput.split(",").map((t) => t.trim()).filter(Boolean);
      const industries = industriesInput.split(",").map((i) => i.trim()).filter(Boolean);
      
      await Api.saveIcpSearch({
        name: icpName.trim(),
        description: description.trim() || undefined,
        job_titles: titles,
        seniorities: selectedSeniorities,
        industries: industries,
        company_sizes: selectedCompanySizes,
        country: selectedCountry || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zip_code: zipCode.trim() || undefined,
      });
      
      alert(`Search "${icpName}" has been saved! View it in Saved Searches.`);
    } catch (e: any) {
      console.error('[SAVE SEARCH] Error:', e);
      alert(`Failed to save search: ${e.message}`);
    } finally {
      setSavingSearch(false);
    }
  };

  return (
    <AppShell title="ICP Search" active="icp" onNav={onNav}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ICP Lead Search</h1>
          <p className="text-gray-600">
            Define your ideal customer profile to discover qualified leads from our database.
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
          {/* ICP Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              ICP Name
            </label>
            <input
              type="text"
              value={icpName}
              onChange={(e) => setIcpName(e.target.value)}
              placeholder="e.g., Landscaping Decision Makers"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E64B8B] focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your ideal customer profile..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E64B8B] focus:border-transparent resize-none"
            />
          </div>

          {/* Job Titles */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Job Titles
            </label>
            <input
              type="text"
              value={jobTitlesInput}
              onChange={(e) => setJobTitlesInput(e.target.value)}
              placeholder="e.g., Director, VP, Owner (comma-separated)"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E64B8B] focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Enter multiple job titles separated by commas
            </p>
          </div>

          {/* Seniority */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Seniority
            </label>
            <div className="flex flex-wrap gap-2">
              {SENIORITY_OPTIONS.map((seniority) => (
                <button
                  key={seniority}
                  type="button"
                  onClick={() => toggleSeniority(seniority)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    selectedSeniorities.includes(seniority)
                      ? "bg-[#E64B8B] text-white border-[#E64B8B]"
                      : "bg-white text-gray-700 border-gray-300 hover:border-[#E64B8B]"
                  }`}
                >
                  {seniority}
                </button>
              ))}
            </div>
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Industry
            </label>
            <input
              type="text"
              value={industriesInput}
              onChange={(e) => setIndustriesInput(e.target.value)}
              placeholder="e.g., Landscaping, Irrigation (comma-separated)"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E64B8B] focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Enter multiple industries separated by commas
            </p>
          </div>

          {/* Company Size */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Company Size
            </label>
            <div className="flex flex-wrap gap-2">
              {COMPANY_SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleCompanySize(size)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    selectedCompanySizes.includes(size)
                      ? "bg-[#E64B8B] text-white border-[#E64B8B]"
                      : "bg-white text-gray-700 border-gray-300 hover:border-[#E64B8B]"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Country
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E64B8B] focus:border-transparent bg-white"
            >
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., New York"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E64B8B] focus:border-transparent"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              State
            </label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g., NY"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E64B8B] focus:border-transparent"
            />
          </div>

          {/* Zip Code */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Zip Code
            </label>
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="e.g., 10001"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E64B8B] focus:border-transparent"
            />
          </div>

          {/* Search Button */}
          <button
            onClick={() => handleSearch(1)}
            disabled={searching}
            className="w-full bg-[#E64B8B] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#d43d7a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {searching ? "Searching..." : "Search Leads"}
          </button>
        </div>

        {/* Results Table */}
        {results.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Search Results ({results.length} leads)
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveSearch}
                  disabled={savingSearch || !icpName.trim()}
                  className="bg-gray-900 text-white font-medium py-2 px-4 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={!icpName.trim() ? "Enter an ICP name to save this search" : "Save this search for reuse"}
                >
                  {savingSearch ? "Saving..." : "Save Search"}
                </button>
                {selectedLeads.length > 0 && (
                  <button
                    onClick={handleAddToLeads}
                    disabled={saving}
                    className="bg-[#E64B8B] text-white font-medium py-2 px-4 rounded-lg hover:bg-[#d43d7a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? "Adding..." : `Add ${selectedLeads.length} to Leads`}
                  </button>
                )}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedLeads.length === results.length && results.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apollo ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company City</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LinkedIn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {results.map((lead, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(idx)}
                          onChange={() => toggleLeadSelection(idx)}
                          className="w-4 h-4 text-[#E64B8B] border-gray-300 rounded focus:ring-[#E64B8B]"
                        />
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                        {lead.apollo_id ? (
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {lead.apollo_id.slice(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {lead.full_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {lead.email || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {lead.company_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {lead.company_city || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {lead.phone || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {lead.linkedin ? (
                          <a
                            href={lead.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#E64B8B] hover:text-[#d43d7a] transition-colors"
                          >
                            View Profile
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="px-6 py-4 border-t border-gray-200">
                <button
                  onClick={loadMore}
                  disabled={searching}
                  className="w-full bg-gray-100 text-gray-700 font-medium py-2.5 px-6 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {searching ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {results.length === 0 && !searching && (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <p className="text-gray-500 text-sm">
              Fill out the form above and click "Search Leads" to discover prospects.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}