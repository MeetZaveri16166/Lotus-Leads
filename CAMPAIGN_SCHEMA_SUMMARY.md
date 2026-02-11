# 🎯 AI-Powered Campaign System - Database Schema

## ✅ Schema Changes Complete!

We added **3 new fields** to your existing campaign infrastructure to enable AI-powered personalization and automation:

---

## 📊 Updated Tables

### **1. Campaign Table**
**New Field Added:**
- `goal` (TEXT, nullable) - Campaign objective description

**Example:**
```json
{
  "goal": "Book discovery calls with VP+ at SaaS companies >100 employees"
}
```

---

### **2. SequenceStep Table**
**New Field Added:**
- `aiInstructions` (TEXT, nullable) - AI personalization instructions

**Example:**
```json
{
  "stepOrder": 1,
  "delayDays": 0,
  "subjectTemplate": "{{firstName}}, quick question about {{companyName}}",
  "bodyTemplate": "Hi {{firstName}},\n\nI noticed {{companyName}}...",
  "aiInstructions": "Mention their industry, company size, and recent growth. Emphasize ROI and quick implementation. Keep tone consultative."
}
```

---

### **3. CampaignLead Table**
**New Fields Added:**
- `currentStepOrder` (INT, nullable) - Tracks which step (1, 2, 3...) the lead is currently on
- `nextScheduledDate` (TIMESTAMP, nullable) - When to send the next email
- **New Index:** `nextScheduledDate_idx` - For efficient cron job queries

**Example:**
```json
{
  "leadId": "lead_123",
  "campaignId": "camp_456",
  "status": "active",
  "currentStepOrder": 2,
  "nextScheduledDate": "2026-01-28T10:00:00Z"
}
```

---

## 🗄️ Complete Table Overview

### **Campaign** (Updated)
- ✅ id, workspaceId, name, status, sendingRules, startAt, createdAt, updatedAt
- 🆕 **goal** - Campaign objective

### **SequenceStep** (Updated)
- ✅ id, campaignId, stepOrder, delayDays, subjectTemplate, bodyTemplate, createdAt
- 🆕 **aiInstructions** - AI personalization prompt

### **CampaignLead** (Updated)
- ✅ id, campaignId, leadId, status, stopReason, createdAt, updatedAt
- 🆕 **currentStepOrder** - Current step number
- 🆕 **nextScheduledDate** - Next send time

### **GeneratedMessage** (Existing - No Changes)
- Stores AI-generated email content per lead/step
- Links to Campaign, Lead, SequenceStep

### **EmailSend** (Existing - No Changes)
- Tracks scheduled/sent emails
- Has scheduledFor, sentAt, status, providerMessageId

### **EngagementEvent** (Existing - No Changes)
- Tracks opens, clicks, replies, bounces

---

## 🔄 Data Flow

### **Enrollment → Generation → Sending → Tracking**

1. **Lead Enrolled in Campaign**
   ```javascript
   CampaignLead.create({
     campaignId: "camp_123",
     leadId: "lead_456",
     status: "active",
     currentStepOrder: 1,
     nextScheduledDate: new Date() // Send immediately
   })
   ```

2. **Cron Job Finds Due Emails**
   ```sql
   SELECT * FROM CampaignLead 
   WHERE status = 'active' 
   AND nextScheduledDate <= NOW()
   ```

3. **AI Generates Personalized Email**
   ```javascript
   GeneratedMessage.create({
     campaignId, leadId, stepId,
     subject: "Sarah, quick question about Acme Corp",
     body: "Hi Sarah, I noticed Acme Corp recently expanded...",
     status: "generated"
   })
   ```

4. **Email Scheduled for Sending**
   ```javascript
   EmailSend.create({
     campaignId, leadId, stepId, generatedMessageId,
     toEmail: "sarah@acmecorp.com",
     status: "scheduled",
     scheduledFor: new Date()
   })
   ```

5. **Progression Updated**
   ```javascript
   CampaignLead.update({
     currentStepOrder: 2,
     nextScheduledDate: new Date(+3 days)
   })
   ```

6. **Engagement Tracked**
   ```javascript
   EngagementEvent.create({
     emailSendId, type: "open",
     occurredAt: new Date()
   })
   ```

---

## 🚀 Next Steps

1. **Run the migration SQL** in your Supabase SQL Editor:
   - File: `/prisma/migrations/add_ai_campaign_fields.sql`

2. **Regenerate Prisma Client** (if using Prisma from frontend):
   ```bash
   npx prisma generate
   ```

3. **Build the Campaign UI**:
   - Campaign list page
   - Campaign builder (create/edit)
   - Sequence step editor
   - Lead enrollment interface

4. **Build AI Email Generator**:
   - Backend endpoint to generate personalized emails
   - Uses lead data + template + AI instructions
   - OpenAI API integration

5. **Build Cron Automation**:
   - `/cron/process-campaign-sends` endpoint
   - Runs hourly (or more frequently)
   - Finds due sends → generates → schedules → updates progression

---

## 📝 Key Design Decisions

✅ **Minimal Schema Changes** - Only added 3 fields to existing tables

✅ **Separation of Concerns** - Generation, sending, and tracking are separate

✅ **Flexible AI Instructions** - Each step can have custom AI prompts

✅ **Efficient Querying** - Indexed nextScheduledDate for fast cron lookups

✅ **Progression Tracking** - CampaignLead knows exactly where each lead is

✅ **Full Audit Trail** - Every email generation and send is logged

---

## 🎯 Why This Design Works

1. **Scalable** - Can handle thousands of leads across multiple campaigns
2. **Debuggable** - Clear separation between generation, sending, tracking
3. **Flexible** - AI instructions can be different for each step
4. **Auditable** - Complete history of all emails and engagement
5. **Resilient** - If sending fails, data is preserved for retry
6. **Fast** - Indexed queries for cron job performance

---

**Ready to build the UI and automation!** 🚀
