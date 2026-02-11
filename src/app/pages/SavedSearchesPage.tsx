import React, { useState, useEffect } from "react";
import { AppShell } from "@/app/components/AppShell";
import { Api } from "@/lib/api";
import { Play, Trash2, Calendar, Hash } from "lucide-react";

interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  job_titles: string[];
  seniorities: string[];
  industries: string[];
  company_sizes: string[];
  country?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  created_at: string;
  last_run_at?: string;
  last_run_count?: number;
}

export default function SavedSearchesPage({ onNav }: { onNav: (key: string, data?: any) => void }) {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadSearches();
  }, []);

  const loadSearches = async () => {
    setLoading(true);
    try {
      const data = await Api.listIcpSearches();
      setSearches(data);
      console.log(`[SAVED SEARCHES] Loaded ${data.length} searches`);
    } catch (e: any) {
      console.error("[SAVED SEARCHES] Error loading:", e);
      alert(`Failed to load searches: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunSearch = (search: SavedSearch) => {
    // Navigate to ICP page with pre-filled data
    onNav("icp", { savedSearch: search });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setDeleting(id);
    try {
      await Api.deleteIcpSearch(id);
      setSearches((prev) => prev.filter((s) => s.id !== id));
      console.log(`[SAVED SEARCHES] Deleted: ${id}`);
    } catch (e: any) {
      console.error("[SAVED SEARCHES] Error deleting:", e);
      alert(`Failed to delete: ${e.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <AppShell title="Saved Searches" active="saved-searches" onNav={onNav}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ICP Saved Searches</h1>
          <p className="text-gray-600">
            Manage and re-run your saved ICP search criteria to discover fresh leads.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-500">Loading saved searches...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && searches.length === 0 && (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <p className="text-gray-500 text-sm mb-4">
              No saved searches yet. Run an ICP search and click "Save Search" to create one.
            </p>
            <button
              onClick={() => onNav("icp")}
              className="bg-[#E64B8B] text-white font-medium py-2 px-4 rounded-lg hover:bg-[#d43d7a] transition-colors"
            >
              Go to ICP Search
            </button>
          </div>
        )}

        {/* Searches Grid */}
        {!loading && searches.length > 0 && (
          <div className="grid gap-4">
            {searches.map((search) => (
              <div
                key={search.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Search Info */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {search.name}
                      </h3>
                      {search.description && (
                        <p className="text-sm text-gray-600">{search.description}</p>
                      )}
                    </div>

                    {/* Criteria Summary */}
                    <div className="flex flex-wrap gap-2">
                      {search.job_titles.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                          Titles: {search.job_titles.join(", ")}
                        </span>
                      )}
                      {search.seniorities.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
                          Seniority: {search.seniorities.join(", ")}
                        </span>
                      )}
                      {search.industries.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                          Industries: {search.industries.join(", ")}
                        </span>
                      )}
                      {search.company_sizes.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded-full">
                          Size: {search.company_sizes.join(", ")}
                        </span>
                      )}
                      {search.country && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                          {search.country}
                          {search.city && `, ${search.city}`}
                          {search.state && `, ${search.state}`}
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Created: {formatDate(search.created_at)}
                      </div>
                      {search.last_run_at && (
                        <>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Last run: {formatDate(search.last_run_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Hash className="w-3.5 h-3.5" />
                            {search.last_run_count} results
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRunSearch(search)}
                      className="inline-flex items-center gap-2 bg-[#E64B8B] text-white font-medium py-2 px-4 rounded-lg hover:bg-[#d43d7a] transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      Run
                    </button>
                    <button
                      onClick={() => handleDelete(search.id, search.name)}
                      disabled={deleting === search.id}
                      className="inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-300 font-medium py-2 px-4 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                      {deleting === search.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}