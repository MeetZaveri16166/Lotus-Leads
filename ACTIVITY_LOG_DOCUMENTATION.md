# 📋 Activity Log System - Complete Documentation

## Overview

The Activity Log system provides enterprise-grade CRM functionality for tracking sales interactions, research, and follow-ups directly on each lead. Sales reps can log calls, emails, meetings, and notes with optional follow-up reminders.

---

## 🎯 Features

### 1. **Activity Types**
- 📞 **Call** - Phone conversations with prospects
- 📧 **Email** - Email communications
- 🗓️ **Meeting** - In-person or virtual meetings
- 📝 **Note** - Research findings, general notes

### 2. **Timeline Display**
- **Grouped by Date** - Activities organized by "Today", "Yesterday", or full date
- **Time Stamps** - Shows exact time (CST timezone) for each activity
- **User Attribution** - Displays who logged each activity (currently: Rahul Surana)
- **Edit History** - Shows "Edited" timestamp if modified

### 3. **Follow-up Reminders**
- **Scheduled Follow-ups** - Set date/time for next action
- **Custom Actions** - Specify what needs to be done ("Call to discuss proposal")
- **Visual Alerts**:
  - 🔴 **Red border** - Overdue follow-ups
  - 🟠 **Orange border** - Due within 24 hours
  - 🔵 **Blue** - Scheduled future follow-ups
  - 🟢 **Green** - Completed follow-ups
- **One-click Complete** - Mark follow-ups as done

### 4. **Business Context**
- Quick reference card showing:
  - Company name
  - Website (clickable)
  - Phone number (clickable)
  - Full address

---

## 📊 Data Structure

### Activity Object
```typescript
{
  id: string;                    // UUID
  lead_id: string;               // Foreign key to lead
  org_id: string;                // Organization ID
  activity_type: "call" | "email" | "meeting" | "note";
  content: string;               // Activity details
  created_by: string;            // User name (hardcoded: "Rahul Surana")
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
  follow_up_date?: string;       // ISO timestamp (optional)
  follow_up_action?: string;     // Description of follow-up (optional)
  follow_up_completed?: boolean; // Completion status (optional)
}
```

### Storage
- **Backend**: KV Store
- **Key Pattern**: `lead_activity:{leadId}:{activityId}`
- **Sorting**: Client-side by `created_at` descending

---

## 🔧 Technical Implementation

### Backend Endpoints

#### 1. **GET** `/api/leads/:id/activities`
Fetches all activities for a lead, sorted by date (most recent first).

**Response**: `Activity[]`

#### 2. **POST** `/api/leads/:id/activities`
Creates a new activity.

**Request Body**:
```json
{
  "activity_type": "call",
  "content": "Called John, discussed spring cleanup. Quoted $5K.",
  "created_by": "Rahul Surana",
  "follow_up_date": "2026-02-01T10:00:00",
  "follow_up_action": "Send formal proposal",
  "follow_up_completed": false
}
```

**Response**: `Activity` (201 Created)

#### 3. **PUT** `/api/leads/:leadId/activities/:activityId`
Updates an existing activity (content, follow-up status, etc.).

**Request Body** (all fields optional):
```json
{
  "content": "Updated content",
  "follow_up_completed": true
}
```

**Response**: `Activity` (200 OK)

#### 4. **DELETE** `/api/leads/:leadId/activities/:activityId`
Deletes an activity permanently.

**Response**: `{ success: true }` (200 OK)

---

## 🎨 UI Components

### 1. **ActivityLog Component** (`/src/app/components/ActivityLog.tsx`)

**Props**:
```typescript
{
  leadId: string;  // Lead ID to fetch activities for
  lead: Lead;      // Lead object for business info reference
}
```

**Key Features**:
- Business information card
- Add activity form with type selector
- Follow-up checkbox with date/time picker
- Grouped timeline view
- Inline editing
- Delete confirmation

### 2. **Lead Detail Page Integration**

Added new "Activity Log" tab alongside "Lead Details" and "Business Opportunity Insight".

**Location**: `/src/app/pages/LeadDetailPage.tsx`

---

## 📅 Date/Time Handling

### Timezone
All timestamps use **CST (Central Standard Time)** via `America/Chicago` timezone.

### Formatting Functions

#### `formatFullDateTime(isoString)`
Returns: "Jan 25, 2026, 3:45 PM"

#### `formatTime(isoString)`
Returns: "3:45 PM"

#### `formatDateGroup(isoString)`
Returns: "Today", "Yesterday", or "Monday, Jan 25, 2026"

### Follow-up Date Validation
- Minimum: Current time + 5 minutes
- Input: HTML5 `datetime-local` picker
- Stored: ISO 8601 format

---

## 💡 Best Practices & User Guidance

### When to Edit vs. Create New Activity

**✅ EDIT (Quick fixes only)**:
- Fix typos
- Correct minor details
- Update formatting

**✅ CREATE NEW (Recommended for updates)**:
- New conversation happened
- Additional information learned
- Status changes
- Follow-up discussions

**Why?** Preserves full audit trail and interaction history.

### Follow-up Reminders

**Use Cases**:
- Schedule callback after initial contact
- Remind to send proposal/quote
- Set meeting follow-up dates
- Track pending decisions

**Best Practice**: Always add a specific action description ("Call to discuss pricing options" not just "Follow up").

---

## 🔔 Follow-up Alert System

### Visual Indicators

| Status | Border Color | Icon | Badge |
|--------|-------------|------|-------|
| Overdue | Red (ring-2 ring-red-300) | ⚠️ AlertCircle | "⚠️ Overdue Follow-up" |
| Due Soon (<24h) | Orange (ring-2 ring-orange-300) | 🕐 Clock | "🔔 Due Soon" |
| Upcoming | Blue | 🔔 Bell | "Follow-up Scheduled" |
| Completed | Green | ✓ CheckCircle2 | "✓ Follow-up Completed" |

### Completion Workflow
1. User clicks "Mark Complete" button
2. API updates `follow_up_completed: true`
3. Card changes to green with checkmark
4. Badge shows "✓ Follow-up Completed"

---

## 🚀 Usage Examples

### Example 1: Log Initial Call
```
Type: Call
Content: "Spoke with John Smith. Interested in spring cleanup package. 
         Property is 5 acres with pond. Budget: $4-6K. Decision maker."
Follow-up: Feb 1, 2026 10:00 AM CST
Action: "Send detailed proposal with pond maintenance options"
```

### Example 2: Log Email Sent
```
Type: Email
Content: "Sent proposal for spring cleanup + pond maintenance. 
         Total: $5,200. Includes weekly visits April-June."
Follow-up: Feb 5, 2026 2:00 PM CST
Action: "Call to discuss proposal if no response"
```

### Example 3: Log Meeting Notes
```
Type: Meeting
Content: "On-site visit. Toured property. Confirmed scope: 
         - Lawn fertilization
         - Pond algae treatment
         - Tree trimming (3 oaks)
         John wants to start by April 1st."
Follow-up: None (proposal already sent)
```

### Example 4: Research Note
```
Type: Note
Content: "LinkedIn research: John was previously Head of Operations at 
         Oakwood Golf Club. Likely values quality over price. 
         Mention our work with similar golf courses."
Follow-up: None
```

---

## 🔍 Future Enhancements (Not Yet Implemented)

### Phase 2 (Potential)
- [ ] Filter timeline by activity type
- [ ] Search activities by keyword
- [ ] Attach files/documents to activities
- [ ] Email integration (auto-log sent emails)
- [ ] Calendar sync for follow-ups
- [ ] Activity templates for common scenarios

### Phase 3 (Potential)
- [ ] Activity analytics (calls per week, etc.)
- [ ] Team activity feed (see other reps' activities)
- [ ] Real-time notifications for overdue follow-ups
- [ ] Export activities to PDF report
- [ ] Automated follow-up suggestions

---

## 📝 Implementation Checklist

✅ Backend API endpoints (GET, POST, PUT, DELETE)  
✅ Frontend API client methods  
✅ ActivityLog component with full UI  
✅ Follow-up reminder system  
✅ Date/time formatting (CST)  
✅ Business information reference card  
✅ Grouped timeline by date  
✅ Edit/delete functionality  
✅ Visual alert system (overdue/due soon)  
✅ Integration with Lead Detail Page  
✅ Best practice guidance in UI  

---

## 🐛 Known Limitations

1. **Hardcoded User**: Currently uses "Rahul Surana" - will need auth integration later
2. **No Notifications**: Follow-up reminders are visual only (no email/push)
3. **No Search**: Must scroll to find specific activities
4. **No Export**: Cannot download activity history
5. **Client-side Sorting**: All activities loaded at once (fine for hundreds, may need pagination for thousands)

---

## 🎓 Sales Team Training

### Quick Start Guide

1. **Open Lead** → Click "Activity Log" tab
2. **Select Type** → Choose Call, Email, Meeting, or Note
3. **Write Details** → Be specific about what happened
4. **Add Follow-up** (optional) → Check box, set date/time, describe action
5. **Log Activity** → Click button to save

### Tips for Effective Activity Logging

✅ **Be Specific**: "Discussed spring cleanup, 5 acres, $5K budget" not "Had a call"  
✅ **Log Immediately**: Don't wait - details fade fast  
✅ **Use Follow-ups**: Set reminders for every next action  
✅ **Create New Activities**: Don't edit old ones for new info  
✅ **Include Context**: Names, numbers, dates, decisions  

---

## 📞 Support & Questions

For technical issues or feature requests related to the Activity Log system, refer to:
- This documentation file
- `/src/app/components/ActivityLog.tsx` (component code)
- `/supabase/functions/server/index.tsx` (API endpoints, search for "LEAD ACTIVITIES")

---

**Last Updated**: January 25, 2026  
**Version**: 1.0  
**Status**: ✅ Production Ready
