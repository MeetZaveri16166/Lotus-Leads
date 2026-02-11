import { useState, useEffect } from "react";
import { Phone, Mail, Calendar, FileText, Pencil, Trash2, Check, X, Building2, Globe, MapPin, Bell, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Api } from "@/lib/api";

interface Activity {
  id: string;
  lead_id: string;
  activity_type: "call" | "email" | "meeting" | "note";
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  follow_up_date?: string;
  follow_up_action?: string;
  follow_up_completed?: boolean;
}

interface Lead {
  id: string;
  company_name?: string;
  company_website?: string;
  company_domain?: string;
  company_phone?: string;
  company_street?: string;
  company_city?: string;
  company_state?: string;
  company_postal_code?: string;
  company_country?: string;
}

interface ActivityLogProps {
  leadId: string;
  lead: Lead;
}

const CURRENT_USER = "Rahul Surana";

const activityConfig = {
  call: { icon: Phone, label: "Call", bgColor: "bg-blue-50" },
  email: { icon: Mail, label: "Email", bgColor: "bg-green-50" },
  meeting: { icon: Calendar, label: "Meeting", bgColor: "bg-purple-50" },
  note: { icon: FileText, label: "Note", bgColor: "bg-gray-50" },
};

// Format date and time in CST
function formatDateTime(isoString: string): { date: string; time: string } {
  if (!isoString) return { date: "—", time: "—" };
  try {
    const date = new Date(isoString);
    const dateStr = date.toLocaleString("en-US", {
      timeZone: "America/Chicago",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = date.toLocaleString("en-US", {
      timeZone: "America/Chicago",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return { date: dateStr, time: timeStr };
  } catch {
    return { date: "—", time: "—" };
  }
}

// Format date for grouping (e.g., "TODAY", "YESTERDAY", "Monday, Jan 25, 2026")
function formatDateGroup(isoString: string): string {
  if (!isoString) return "Unknown Date";
  try {
    const date = new Date(isoString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (activityDate.getTime() === today.getTime()) {
      return "TODAY";
    } else if (activityDate.getTime() === yesterday.getTime()) {
      return "YESTERDAY";
    } else {
      return date.toLocaleString("en-US", {
        timeZone: "America/Chicago",
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      }).toUpperCase();
    }
  } catch {
    return "Unknown Date";
  }
}

// Get date key for grouping (YYYY-MM-DD in CST)
function getDateKey(isoString: string): string {
  if (!isoString) return "unknown";
  try {
    const date = new Date(isoString);
    const year = date.toLocaleString("en-US", { timeZone: "America/Chicago", year: "numeric" });
    const month = date.toLocaleString("en-US", { timeZone: "America/Chicago", month: "2-digit" });
    const day = date.toLocaleString("en-US", { timeZone: "America/Chicago", day: "2-digit" });
    return `${year}-${month}-${day}`;
  } catch {
    return "unknown";
  }
}

// Check if follow-up is overdue
function isFollowUpOverdue(followUpDate: string | undefined): boolean {
  if (!followUpDate) return false;
  try {
    const now = new Date();
    const dueDate = new Date(followUpDate);
    return dueDate < now;
  } catch {
    return false;
  }
}

// Check if follow-up is due soon (within 24 hours)
function isFollowUpSoon(followUpDate: string | undefined): boolean {
  if (!followUpDate) return false;
  try {
    const now = new Date();
    const dueDate = new Date(followUpDate);
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilDue > 0 && hoursUntilDue <= 24;
  } catch {
    return false;
  }
}

export function ActivityLog({ leadId, lead }: ActivityLogProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<"call" | "email" | "meeting" | "note">("note");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  
  // Follow-up fields
  const [followUpEnabled, setFollowUpEnabled] = useState(false);
  const [followUpDay, setFollowUpDay] = useState("");
  const [followUpHour, setFollowUpHour] = useState("10");
  const [followUpMinute, setFollowUpMinute] = useState("00");
  const [followUpPeriod, setFollowUpPeriod] = useState<"AM" | "PM">("AM");
  const [followUpAction, setFollowUpAction] = useState("");
  
  useEffect(() => {
    loadActivities();
  }, [leadId]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await Api.getLeadActivities(leadId);
      setActivities(data);
    } catch (error: any) {
      console.error("[ACTIVITY LOG] Error loading activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      const payload: any = {
        activity_type: selectedType,
        content: content.trim(),
        created_by: CURRENT_USER,
      };

      // Add follow-up fields if enabled
      if (followUpEnabled && followUpDay) {
        // Combine date and time into ISO string
        let hour = parseInt(followUpHour);
        if (followUpPeriod === "PM" && hour !== 12) hour += 12;
        if (followUpPeriod === "AM" && hour === 12) hour = 0;
        
        const dateTime = new Date(followUpDay);
        dateTime.setHours(hour, parseInt(followUpMinute), 0, 0);
        
        payload.follow_up_date = dateTime.toISOString();
        payload.follow_up_action = followUpAction.trim() || "Follow up";
        payload.follow_up_completed = false;
      }

      await Api.createLeadActivity(leadId, payload);
      
      // Reset form
      setContent("");
      setFollowUpEnabled(false);
      setFollowUpDay("");
      setFollowUpHour("10");
      setFollowUpMinute("00");
      setFollowUpPeriod("AM");
      setFollowUpAction("");
      
      await loadActivities();
    } catch (error: any) {
      alert(`Error creating activity: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (activityId: string) => {
    if (!confirm("Delete this activity? This cannot be undone.")) return;

    try {
      await Api.deleteLeadActivity(leadId, activityId);
      await loadActivities();
    } catch (error: any) {
      alert(`Error deleting activity: ${error.message}`);
    }
  };

  const startEdit = (activity: Activity) => {
    setEditingId(activity.id);
    setEditContent(activity.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const saveEdit = async (activityId: string) => {
    if (!editContent.trim()) return;

    try {
      await Api.updateLeadActivity(leadId, activityId, {
        content: editContent.trim(),
      });
      setEditingId(null);
      setEditContent("");
      await loadActivities();
    } catch (error: any) {
      alert(`Error updating activity: ${error.message}`);
    }
  };

  const toggleFollowUpComplete = async (activity: Activity) => {
    try {
      await Api.updateLeadActivity(leadId, activity.id, {
        follow_up_completed: !activity.follow_up_completed,
      });
      await loadActivities();
    } catch (error: any) {
      alert(`Error updating follow-up: ${error.message}`);
    }
  };

  // Group activities by date
  const groupedActivities = activities.reduce((groups, activity) => {
    const dateKey = getDateKey(activity.created_at);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
    return groups;
  }, {} as Record<string, Activity[]>);

  // Sort date groups (most recent first)
  const sortedDateKeys = Object.keys(groupedActivities).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {/* Business Information Reference */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-200 mb-4">
          <div className="h-1 w-8 bg-[#E64B8B] rounded-full"></div>
          <Building2 className="w-5 h-5 text-[#E64B8B]" />
          <h3 className="text-base font-semibold text-gray-900">Business Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Company Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Company Name
            </label>
            <p className="text-sm text-gray-900 font-medium">
              {lead.company_name || "—"}
            </p>
          </div>

          {/* Website */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Website
            </label>
            {lead.company_website || lead.company_domain ? (
              <a
                href={
                  lead.company_website || 
                  (lead.company_domain?.startsWith("http") 
                    ? lead.company_domain 
                    : `https://${lead.company_domain}`)
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#E64B8B] hover:text-[#d43d7a] transition-colors"
              >
                <Globe className="w-4 h-4" />
                {lead.company_website || lead.company_domain}
              </a>
            ) : (
              <p className="text-sm text-gray-400">Not available</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Phone
            </label>
            {lead.company_phone ? (
              <a
                href={`tel:${lead.company_phone}`}
                className="inline-flex items-center gap-2 text-sm text-[#E64B8B] hover:text-[#d43d7a] transition-colors"
              >
                <Phone className="w-4 h-4" />
                {lead.company_phone}
              </a>
            ) : (
              <p className="text-sm text-gray-400">Not available</p>
            )}
          </div>
        </div>

        {/* Full Address */}
        {(lead.company_street || lead.company_city || lead.company_state || lead.company_postal_code || lead.company_country) && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Address
            </label>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                {lead.company_street && <div>{lead.company_street}</div>}
                <div>
                  {[lead.company_city, lead.company_state, lead.company_postal_code]
                    .filter(Boolean)
                    .join(", ")}
                </div>
                {lead.company_country && <div>{lead.company_country}</div>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Activity Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Log New Activity</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Activity Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Activity Type
            </label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(activityConfig) as Array<keyof typeof activityConfig>).map((type) => {
                const config = activityConfig[type];
                const Icon = config.icon;
                const isSelected = selectedType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={`
                      inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border
                      ${isSelected
                        ? "bg-[#E64B8B] text-white border-[#E64B8B]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Textarea */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Details <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What happened during this ${activityConfig[selectedType].label.toLowerCase()}?`}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/20 focus:border-[#E64B8B] transition-all resize-none"
              required
            />
          </div>

          {/* Follow-up Section */}
          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={followUpEnabled}
                onChange={(e) => setFollowUpEnabled(e.target.checked)}
                className="w-4 h-4 text-[#E64B8B] border-gray-300 rounded focus:ring-[#E64B8B]"
              />
              <Bell className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Set Follow-up Reminder</span>
            </label>

            {followUpEnabled && (
              <div className="grid grid-cols-1 gap-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                {/* Date Selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={followUpDay}
                    onChange={(e) => setFollowUpDay(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/20 focus:border-[#E64B8B] bg-white"
                    required={followUpEnabled}
                  />
                </div>

                {/* Time Selectors */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Time (CST) <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Hour */}
                    <select
                      value={followUpHour}
                      onChange={(e) => setFollowUpHour(e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/20 focus:border-[#E64B8B] bg-white"
                      required={followUpEnabled}
                    >
                      {Array.from({ length: 12 }, (_, i) => {
                        const hour = i + 1;
                        const val = hour.toString().padStart(2, '0');
                        return <option key={hour} value={val}>{hour}</option>;
                      })}
                    </select>

                    {/* Minute */}
                    <select
                      value={followUpMinute}
                      onChange={(e) => setFollowUpMinute(e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/20 focus:border-[#E64B8B] bg-white"
                      required={followUpEnabled}
                    >
                      <option value="00">00</option>
                      <option value="15">15</option>
                      <option value="30">30</option>
                      <option value="45">45</option>
                    </select>

                    {/* AM/PM */}
                    <select
                      value={followUpPeriod}
                      onChange={(e) => setFollowUpPeriod(e.target.value as "AM" | "PM")}
                      className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/20 focus:border-[#E64B8B] bg-white"
                      required={followUpEnabled}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>

                {/* Action */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Follow-up Action
                  </label>
                  <input
                    type="text"
                    value={followUpAction}
                    onChange={(e) => setFollowUpAction(e.target.value)}
                    placeholder="e.g., Call to discuss proposal"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/20 focus:border-[#E64B8B] bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-between items-center pt-2">
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <span className="text-base">💡</span>
              <span><strong>Best Practice:</strong> Log each new interaction as a separate activity to maintain full timeline history</span>
            </p>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className={`
                px-5 py-2.5 rounded-lg text-sm font-medium transition-all
                ${submitting || !content.trim()
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[#E64B8B] text-white hover:bg-[#d43d7a]"
                }
              `}
            >
              {submitting ? "Logging..." : "Log Activity"}
            </button>
          </div>
        </form>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-gray-900">Activity Timeline</h3>
          {activities.length > 0 && (
            <span className="text-xs font-medium text-gray-500">
              {activities.length} {activities.length === 1 ? "activity" : "activities"}
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center gap-3 text-gray-500">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-[#E64B8B] rounded-full animate-spin"></div>
              Loading activities...
            </div>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No activities yet</p>
            <p className="text-sm text-gray-400 mt-1">Log your first interaction above</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDateKeys.map((dateKey) => {
              const dateActivities = groupedActivities[dateKey];
              const dateLabel = formatDateGroup(dateActivities[0].created_at);

              return (
                <div key={dateKey} className="space-y-4">
                  {/* Date Header - More Prominent */}
                  <div className="text-center">
                    <div className="inline-block text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-4 py-1.5 rounded-full">
                      {dateLabel}
                    </div>
                  </div>

                  {/* Activities for this date */}
                  <div className="space-y-3">
                    {dateActivities.map((activity) => {
                      const config = activityConfig[activity.activity_type];
                      const Icon = config.icon;
                      const isEditing = editingId === activity.id;
                      const hasFollowUp = !!activity.follow_up_date;
                      const isOverdue = hasFollowUp && !activity.follow_up_completed && isFollowUpOverdue(activity.follow_up_date);
                      const isDueSoon = hasFollowUp && !activity.follow_up_completed && isFollowUpSoon(activity.follow_up_date);
                      const { date, time } = formatDateTime(activity.created_at);

                      return (
                        <div
                          key={activity.id}
                          className={`border rounded-lg p-4 transition-all ${config.bgColor} ${
                            isOverdue ? "border-red-400 shadow-sm" : isDueSoon ? "border-orange-400 shadow-sm" : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="p-2 rounded-lg bg-white border border-gray-200 flex-shrink-0">
                                <Icon className="w-4 h-4 text-gray-700" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap text-sm">
                                  <span className="font-semibold text-gray-900">
                                    {config.label}
                                  </span>
                                  <span className="text-gray-400">•</span>
                                  <span className="font-medium text-gray-900">
                                    {time}
                                  </span>
                                  <span className="text-gray-400 text-xs">by {activity.created_by}</span>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            {!isEditing && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => startEdit(activity)}
                                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(activity.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          {isEditing ? (
                            <div className="space-y-3 pl-14">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/20 focus:border-[#E64B8B] resize-none bg-white"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => saveEdit(activity.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#E64B8B] text-white text-xs font-medium rounded-md hover:bg-[#d43d7a] transition-colors"
                                >
                                  <Check className="w-3 h-3" />
                                  Save
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-gray-600 text-xs font-medium rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap pl-14">
                                {activity.content}
                              </p>

                              {/* Follow-up Reminder */}
                              {hasFollowUp && (
                                <div className={`mt-3 pl-14 p-3 rounded-lg border ${
                                  activity.follow_up_completed
                                    ? "bg-green-50 border-green-200"
                                    : isOverdue
                                    ? "bg-red-50 border-red-300"
                                    : isDueSoon
                                    ? "bg-orange-50 border-orange-300"
                                    : "bg-blue-50 border-blue-200"
                                }`}>
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                      {activity.follow_up_completed ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                      ) : isOverdue ? (
                                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                      ) : isDueSoon ? (
                                        <Clock className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                      ) : (
                                        <Bell className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
                                          activity.follow_up_completed
                                            ? "text-green-700"
                                            : isOverdue
                                            ? "text-red-700"
                                            : isDueSoon
                                            ? "text-orange-700"
                                            : "text-blue-700"
                                        }`}>
                                          {activity.follow_up_completed
                                            ? "Follow-up Completed"
                                            : isOverdue
                                            ? "Overdue Follow-up"
                                            : isDueSoon
                                            ? "Due Soon"
                                            : "Follow-up Scheduled"
                                          }
                                        </div>
                                        <div className="text-sm text-gray-700 font-medium">
                                          {activity.follow_up_action || "Follow up"}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">
                                          {formatDateTime(activity.follow_up_date!).date} at {formatDateTime(activity.follow_up_date!).time}
                                        </div>
                                      </div>
                                    </div>
                                    {!activity.follow_up_completed && (
                                      <button
                                        onClick={() => toggleFollowUpComplete(activity)}
                                        className="px-3 py-1.5 bg-white text-gray-700 text-xs font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors flex-shrink-0"
                                      >
                                        Mark Complete
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Updated timestamp */}
                              {activity.updated_at !== activity.created_at && (
                                <div className="text-xs text-gray-400 italic mt-2 pl-14">
                                  Edited {date} at {formatDateTime(activity.updated_at).time}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}