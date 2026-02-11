-- ============================================================================
-- LotusLeads - Organization & User Management Database Schema
-- ============================================================================
-- Multi-tenant SaaS architecture with org-level billing and user-level tracking
-- ============================================================================

-- ============================================================================
-- 1. ORGANIZATIONS
-- ============================================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly: "acme-corp"
  industry TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  
  -- Settings
  domain TEXT, -- Optional: for email domain matching
  logo_url TEXT,
  
  -- API Keys (encrypted in production)
  api_keys JSONB DEFAULT '{}'::jsonb, -- { "google_maps": "...", "apollo": "...", "openai": "..." }
  
  -- Billing
  stripe_customer_id TEXT UNIQUE,
  subscription_status TEXT CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled')),
  trial_ends_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP -- Soft delete
);

-- Indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_domain ON organizations(domain);
CREATE INDEX idx_organizations_deleted ON organizations(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- 2. USERS (extends Supabase auth.users)
-- ============================================================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile
  full_name TEXT NOT NULL,
  username TEXT UNIQUE, -- For email/password auth
  avatar_url TEXT,
  phone TEXT,
  
  -- Auth Method
  auth_method TEXT NOT NULL CHECK (auth_method IN ('google', 'email', 'invited')),
  
  -- Password (only for email/invited)
  password_hash TEXT, -- Hashed via bcrypt
  password_reset_required BOOLEAN DEFAULT false, -- Force password change on first login
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  last_login_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_status ON user_profiles(status);

-- ============================================================================
-- 3. ORGANIZATION MEMBERS (Many-to-Many with Roles)
-- ============================================================================

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Role & Permissions
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  
  -- Credit Allocation
  monthly_credit_limit INTEGER DEFAULT NULL, -- NULL = unlimited (within org pool)
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  invited_by UUID REFERENCES auth.users(id), -- Who invited this user
  joined_at TIMESTAMP DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, user_id) -- User can only be in org once
);

-- Indexes
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_role ON organization_members(organization_id, role);

-- ============================================================================
-- 4. INVITATIONS
-- ============================================================================

CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Invitation Details
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  temporary_password TEXT, -- For admin-created users
  
  -- Token
  token TEXT UNIQUE NOT NULL, -- Secure random token for acceptance link
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'canceled')),
  accepted_at TIMESTAMP,
  accepted_by UUID REFERENCES auth.users(id),
  
  -- Expiry
  expires_at TIMESTAMP NOT NULL, -- Default: 7 days from creation
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, email, status) -- Can't have multiple pending invites for same email
);

-- Indexes
CREATE INDEX idx_invitations_org ON invitations(organization_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_status ON invitations(status) WHERE status = 'pending';

-- ============================================================================
-- 5. CREDIT LEDGER (Append-only log)
-- ============================================================================

CREATE TABLE credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Context
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Operation
  operation_type TEXT NOT NULL CHECK (operation_type IN (
    'apollo_search',      -- 10 credits
    'apollo_enrich',      -- 5 credits
    'geo_enrichment',     -- 1 credit
    'property_analysis',  -- 2 credits
    'service_mapping',    -- 2 credits
    'credit_purchase',    -- Purchase (positive delta)
    'credit_grant',       -- Admin grant (positive delta)
    'credit_refund'       -- Refund (positive delta)
  )),
  
  -- Credits
  credits_delta INTEGER NOT NULL, -- Negative for consumption, positive for purchase
  balance_before INTEGER NOT NULL, -- Org balance before this transaction
  balance_after INTEGER NOT NULL,  -- Org balance after this transaction
  
  -- Tracking
  request_id UUID NOT NULL, -- Links to specific API request (for correlation)
  lead_id UUID REFERENCES leads(id), -- Optional: which lead triggered this
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional context: { "search_query": "...", "results_count": 50 }
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CHECK (
    (operation_type IN ('credit_purchase', 'credit_grant', 'credit_refund') AND credits_delta > 0) OR
    (operation_type NOT IN ('credit_purchase', 'credit_grant', 'credit_refund') AND credits_delta < 0)
  )
);

-- Indexes (critical for performance)
CREATE INDEX idx_credit_ledger_org ON credit_ledger(organization_id, created_at DESC);
CREATE INDEX idx_credit_ledger_user ON credit_ledger(user_id, created_at DESC);
CREATE INDEX idx_credit_ledger_request ON credit_ledger(request_id);
CREATE INDEX idx_credit_ledger_operation ON credit_ledger(operation_type);
CREATE INDEX idx_credit_ledger_lead ON credit_ledger(lead_id) WHERE lead_id IS NOT NULL;

-- ============================================================================
-- 6. USAGE ANALYTICS (Materialized view for performance)
-- ============================================================================

-- Real-time view of current month's usage per user
CREATE MATERIALIZED VIEW user_monthly_usage AS
SELECT 
  organization_id,
  user_id,
  DATE_TRUNC('month', created_at) as month,
  operation_type,
  COUNT(*) as operation_count,
  SUM(ABS(credits_delta)) as credits_used
FROM credit_ledger
WHERE credits_delta < 0 -- Only consumption, not purchases
GROUP BY organization_id, user_id, DATE_TRUNC('month', created_at), operation_type;

-- Indexes
CREATE INDEX idx_user_monthly_usage_org ON user_monthly_usage(organization_id, month);
CREATE INDEX idx_user_monthly_usage_user ON user_monthly_usage(user_id, month);

-- Refresh function (call periodically or after each transaction)
CREATE OR REPLACE FUNCTION refresh_user_monthly_usage()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_monthly_usage;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. UPDATE EXISTING TABLES (Add organization_id)
-- ============================================================================

-- Add organization_id to all existing tables
ALTER TABLE leads ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE business_profiles ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE icp_definitions ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE saved_searches ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE campaigns ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE campaign_prospects ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_leads_org ON leads(organization_id);
CREATE INDEX idx_business_profiles_org ON business_profiles(organization_id);
CREATE INDEX idx_icp_definitions_org ON icp_definitions(organization_id);
CREATE INDEX idx_saved_searches_org ON saved_searches(organization_id);
CREATE INDEX idx_campaigns_org ON campaigns(organization_id);
CREATE INDEX idx_campaign_prospects_org ON campaign_prospects(organization_id);

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE icp_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see their own org
CREATE POLICY org_isolation ON organizations
  FOR ALL
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Leads: Users can only see leads from their org
CREATE POLICY leads_isolation ON leads
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Credit Ledger: Users can only see their org's transactions
CREATE POLICY credit_ledger_isolation ON credit_ledger
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Apply similar policies to all other tables...
CREATE POLICY business_profiles_isolation ON business_profiles FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY icp_definitions_isolation ON icp_definitions FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY saved_searches_isolation ON saved_searches FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY campaigns_isolation ON campaigns FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'));

-- ============================================================================
-- 9. HELPER FUNCTIONS
-- ============================================================================

-- Function: Get organization credit balance (from ledger)
CREATE OR REPLACE FUNCTION get_org_credit_balance(org_id UUID)
RETURNS INTEGER AS $$
DECLARE
  balance INTEGER;
BEGIN
  SELECT COALESCE(
    (SELECT balance_after FROM credit_ledger 
     WHERE organization_id = org_id 
     ORDER BY created_at DESC 
     LIMIT 1),
    0
  ) INTO balance;
  
  RETURN balance;
END;
$$ LANGUAGE plpgsql;

-- Function: Get user's current month usage
CREATE OR REPLACE FUNCTION get_user_monthly_usage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  usage INTEGER;
BEGIN
  SELECT COALESCE(SUM(ABS(credits_delta)), 0) INTO usage
  FROM credit_ledger
  WHERE user_id = p_user_id
    AND credits_delta < 0
    AND created_at >= DATE_TRUNC('month', NOW());
  
  RETURN usage;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if user can perform operation (enforces limits)
CREATE OR REPLACE FUNCTION can_user_perform_operation(
  p_user_id UUID,
  p_org_id UUID,
  p_credits_required INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  org_balance INTEGER;
  user_limit INTEGER;
  user_usage INTEGER;
BEGIN
  -- Check org balance
  org_balance := get_org_credit_balance(p_org_id);
  IF org_balance < p_credits_required THEN
    RETURN false;
  END IF;
  
  -- Check user's monthly limit (if set)
  SELECT monthly_credit_limit INTO user_limit
  FROM organization_members
  WHERE user_id = p_user_id AND organization_id = p_org_id;
  
  IF user_limit IS NOT NULL THEN
    user_usage := get_user_monthly_usage(p_user_id);
    IF (user_usage + p_credits_required) > user_limit THEN
      RETURN false;
    END IF;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER organization_members_updated_at BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 11. SEED DATA (for testing)
-- ============================================================================

-- Create a demo organization
INSERT INTO organizations (name, slug, industry, subscription_status)
VALUES ('Demo Corp', 'demo-corp', 'Technology', 'trial');

-- Grant initial trial credits (100)
INSERT INTO credit_ledger (
  organization_id,
  user_id,
  operation_type,
  credits_delta,
  balance_before,
  balance_after,
  request_id
)
SELECT 
  id,
  (SELECT id FROM auth.users LIMIT 1), -- Placeholder
  'credit_grant',
  100,
  0,
  100,
  gen_random_uuid()
FROM organizations
WHERE slug = 'demo-corp';

-- ============================================================================
-- 12. INDEXES FOR ANALYTICS QUERIES
-- ============================================================================

-- Performance correlation: credits by lead outcome
CREATE INDEX idx_credit_ledger_lead_outcome ON credit_ledger(lead_id, operation_type) 
  WHERE lead_id IS NOT NULL;

-- Time-series analytics
CREATE INDEX idx_credit_ledger_time_series ON credit_ledger(organization_id, created_at DESC, operation_type);

-- User performance tracking
CREATE INDEX idx_credit_ledger_user_perf ON credit_ledger(user_id, operation_type, created_at DESC);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
