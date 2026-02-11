-- Complete Database Schema Creation for Sales Prospecting SaaS
-- Run this in Supabase SQL Editor

-- Create Enums
CREATE TYPE "UserRole" AS ENUM ('admin');
CREATE TYPE "IcpStatus" AS ENUM ('draft', 'running', 'complete', 'failed');
CREATE TYPE "LeadStatus" AS ENUM ('discovered', 'enriched', 'suppressed', 'archived');
CREATE TYPE "EnrichmentStatus" AS ENUM ('pending', 'complete', 'failed');
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'ready', 'running', 'paused', 'completed');
CREATE TYPE "CampaignLeadStatus" AS ENUM ('queued', 'active', 'stopped', 'completed');
CREATE TYPE "MessageStatus" AS ENUM ('generated', 'approved', 'rejected', 'edited');
CREATE TYPE "SendStatus" AS ENUM ('scheduled', 'sent', 'failed', 'bounced');
CREATE TYPE "EventType" AS ENUM ('open', 'click', 'reply', 'bounce', 'unsub');

-- Create Tables

-- Workspace (Organization)
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'admin',
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Business Profile
CREATE TABLE "BusinessProfile" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "industry" TEXT,
    "services" JSONB NOT NULL DEFAULT '[]',
    "painPoints" JSONB NOT NULL DEFAULT '[]',
    "idealCustomer" TEXT,
    "outreachTone" TEXT NOT NULL DEFAULT 'consultative',
    "extraContext" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);

-- ICP Run
CREATE TABLE "IcpRun" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT,
    "filters" JSONB NOT NULL,
    "status" "IcpStatus" NOT NULL DEFAULT 'draft',
    "discoveredCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IcpRun_pkey" PRIMARY KEY ("id")
);

-- Lead
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "icpRunId" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'discovered',
    "firstName" TEXT,
    "lastName" TEXT,
    "title" TEXT,
    "linkedinUrl" TEXT,
    "companyName" TEXT,
    "companyDomain" TEXT,
    "companySize" TEXT,
    "industry" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "discoveryData" JSONB NOT NULL DEFAULT '{}',
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- Lead Enrichment
CREATE TABLE "LeadEnrichment" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "status" "EnrichmentStatus" NOT NULL DEFAULT 'pending',
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "companyAddress" JSONB NOT NULL DEFAULT '{}',
    "companyDetails" JSONB NOT NULL DEFAULT '{}',
    "provider" TEXT,
    "raw" JSONB NOT NULL DEFAULT '{}',
    "enrichedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadEnrichment_pkey" PRIMARY KEY ("id")
);

-- Credit Ledger
CREATE TABLE "CreditLedger" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "refTable" TEXT,
    "refId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditLedger_pkey" PRIMARY KEY ("id")
);

-- Campaign
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "sendingRules" JSONB NOT NULL DEFAULT '{}',
    "startAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- Sequence Step
CREATE TABLE "SequenceStep" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "delayDays" INTEGER NOT NULL DEFAULT 0,
    "subjectTemplate" TEXT,
    "bodyTemplate" TEXT,
    "aiInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SequenceStep_pkey" PRIMARY KEY ("id")
);

-- Campaign Lead (Enrollment)
CREATE TABLE "CampaignLead" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "status" "CampaignLeadStatus" NOT NULL DEFAULT 'queued',
    "currentStepOrder" INTEGER,
    "nextScheduledDate" TIMESTAMP(3),
    "stopReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignLead_pkey" PRIMARY KEY ("id")
);

-- Generated Message
CREATE TABLE "GeneratedMessage" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "status" "MessageStatus" NOT NULL DEFAULT 'generated',
    "meta" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedMessage_pkey" PRIMARY KEY ("id")
);

-- Email Send
CREATE TABLE "EmailSend" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "generatedMessageId" TEXT,
    "toEmail" TEXT NOT NULL,
    "status" "SendStatus" NOT NULL DEFAULT 'scheduled',
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "providerMessageId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailSend_pkey" PRIMARY KEY ("id")
);

-- Engagement Event
CREATE TABLE "EngagementEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "campaignId" TEXT,
    "leadId" TEXT,
    "emailSendId" TEXT,
    "type" "EventType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "EngagementEvent_pkey" PRIMARY KEY ("id")
);

-- Suppression
CREATE TABLE "Suppression" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "email" TEXT,
    "domain" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Suppression_pkey" PRIMARY KEY ("id")
);

-- Create Unique Constraints
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "BusinessProfile_workspaceId_key" ON "BusinessProfile"("workspaceId");
CREATE UNIQUE INDEX "Lead_workspaceId_dedupeKey_key" ON "Lead"("workspaceId", "dedupeKey");
CREATE UNIQUE INDEX "LeadEnrichment_leadId_key" ON "LeadEnrichment"("leadId");
CREATE UNIQUE INDEX "SequenceStep_campaignId_stepOrder_key" ON "SequenceStep"("campaignId", "stepOrder");
CREATE UNIQUE INDEX "CampaignLead_campaignId_leadId_key" ON "CampaignLead"("campaignId", "leadId");
CREATE UNIQUE INDEX "GeneratedMessage_campaignId_leadId_stepId_key" ON "GeneratedMessage"("campaignId", "leadId", "stepId");

-- Create Indexes for Performance
CREATE INDEX "Lead_workspaceId_idx" ON "Lead"("workspaceId");
CREATE INDEX "Lead_icpRunId_idx" ON "Lead"("icpRunId");
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
CREATE INDEX "LeadEnrichment_workspaceId_idx" ON "LeadEnrichment"("workspaceId");
CREATE INDEX "LeadEnrichment_status_idx" ON "LeadEnrichment"("status");
CREATE INDEX "CreditLedger_workspaceId_idx" ON "CreditLedger"("workspaceId");
CREATE INDEX "Campaign_workspaceId_idx" ON "Campaign"("workspaceId");
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");
CREATE INDEX "CampaignLead_nextScheduledDate_idx" ON "CampaignLead"("nextScheduledDate");
CREATE INDEX "GeneratedMessage_workspaceId_idx" ON "GeneratedMessage"("workspaceId");
CREATE INDEX "EmailSend_workspaceId_idx" ON "EmailSend"("workspaceId");
CREATE INDEX "EmailSend_status_idx" ON "EmailSend"("status");
CREATE INDEX "EmailSend_scheduledFor_idx" ON "EmailSend"("scheduledFor");
CREATE INDEX "Suppression_workspaceId_idx" ON "Suppression"("workspaceId");

-- Create Foreign Keys
ALTER TABLE "User" ADD CONSTRAINT "User_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IcpRun" ADD CONSTRAINT "IcpRun_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_icpRunId_fkey" FOREIGN KEY ("icpRunId") REFERENCES "IcpRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeadEnrichment" ADD CONSTRAINT "LeadEnrichment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadEnrichment" ADD CONSTRAINT "LeadEnrichment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreditLedger" ADD CONSTRAINT "CreditLedger_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SequenceStep" ADD CONSTRAINT "SequenceStep_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignLead" ADD CONSTRAINT "CampaignLead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignLead" ADD CONSTRAINT "CampaignLead_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GeneratedMessage" ADD CONSTRAINT "GeneratedMessage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GeneratedMessage" ADD CONSTRAINT "GeneratedMessage_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GeneratedMessage" ADD CONSTRAINT "GeneratedMessage_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GeneratedMessage" ADD CONSTRAINT "GeneratedMessage_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "SequenceStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailSend" ADD CONSTRAINT "EmailSend_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailSend" ADD CONSTRAINT "EmailSend_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailSend" ADD CONSTRAINT "EmailSend_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailSend" ADD CONSTRAINT "EmailSend_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "SequenceStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailSend" ADD CONSTRAINT "EmailSend_generatedMessageId_fkey" FOREIGN KEY ("generatedMessageId") REFERENCES "GeneratedMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EngagementEvent" ADD CONSTRAINT "EngagementEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EngagementEvent" ADD CONSTRAINT "EngagementEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EngagementEvent" ADD CONSTRAINT "EngagementEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EngagementEvent" ADD CONSTRAINT "EngagementEvent_emailSendId_fkey" FOREIGN KEY ("emailSendId") REFERENCES "EmailSend"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Suppression" ADD CONSTRAINT "Suppression_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
