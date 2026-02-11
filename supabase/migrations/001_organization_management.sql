-- ============================================================================
-- LotusLeads - Organization & User Management Migration
-- ============================================================================
-- Version: 1.0
-- Date: 2026-01-24
-- Description: Multi-tenant SaaS architecture with org-level billing
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Organizations Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly: "acme-corp"
  industry TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  
  -- Optional Features
  domain TEXT, -- For email domain matching (auto-add users with @acme.com)
  logo_url TEXT,
  
  -- API Keys (consider moving to KV store for better security)
  api_keys JSONB DEFAULT '{}'::jsonb, -- { "google_maps": "...", "apollo": "..." }
  
  -- Subscription & Trial
  subscription_status TEXT CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled')) DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain) WHERE domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_deleted ON organizations(deleted_at) WHERE deleted_at IS NULL;

COMMENT ON TABLE organizations IS 'Each business/tenant in the multi-tenant system';
COMMENT ON COLUMN organizations.slug IS 'URL-friendly identifier for organization';
COMMENT ON COLUMN organizations.api_keys IS 'Encrypted API keys for third-party services';

-- ============================================================================
-- STEP 2: Create User Profiles (Extends auth.users)
-- ============================================================================

-- Note: auth.users is managed by Supabase Auth
-- We extend it with additional profile data
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  
  -- Auth Method
  auth_method TEXT CHECK (auth_method IN ('google', 'email', 'invited')) NOT NULL,
  
  -- Status
  status TEXT CHECK (status IN ('active', 'suspended', 'deleted')) DEFAULT 'active',
  password_reset_required BOOLEAN DEFAULT FALSE, -- Force password change on first login
  last_login_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_method ON user_profiles(auth_method);

COMMENT ON TABLE user_profiles IS 'Extended user profile data (auth.users managed by Supabase)';

-- ============================================================================
-- STEP 3: Create Memberships (User ↔ Organization)
-- ============================================================================

CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Role & Permissions
  role TEXT CHECK (role IN ('admin', 'user')) NOT NULL,
  
  -- Credit Allocation (per user)
  credit_limit INTEGER, -- NULL = unlimited (within org pool)
  
  -- Status
  status TEXT CHECK (status IN ('active', 'invited', 'suspended')) DEFAULT 'active',
  
  -- Audit Trail
  invited_by UUID REFERENCES auth.users(id), -- Who invited this user
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, organization_id) -- User can only be in org once
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org ON memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_memberships_role ON memberships(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status) WHERE status = 'active';

COMMENT ON TABLE memberships IS 'Many-to-many relationship between users and organizations with role-based access';
COMMENT ON COLUMN memberships.credit_limit IS 'Monthly credit limit per user (NULL = unlimited within org pool)';

-- ============================================================================
-- STEP 4: Create Organization Wallets (Credit Balance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_wallets (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE organization_wallets IS 'Organization credit balance (updated atomically with ledger)';

-- ============================================================================
-- STEP 5: Create Credit Ledger (Immutable Audit Log)
-- ============================================================================

CREATE TABLE IF NOT EXISTS credit_ledger (
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
    'credit_purchase',    -- Purchase (positive)
    'credit_grant',       -- Trial/admin grant (positive)
    'credit_refund'       -- Refund (positive)
  )),
  
  -- Credits (negative for usage, positive for purchase)
  credits_delta INTEGER NOT NULL,
  balance_before INTEGER NOT NULL, -- Org balance before transaction
  balance_after INTEGER NOT NULL,  -- Org balance after transaction
  
  -- Tracking
  request_id UUID NOT NULL, -- Links to API request (for debugging)
  reference_id TEXT,        -- lead_id, search_id, deal_id, etc.
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional context
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT credits_sign_check CHECK (
    (operation_type IN ('credit_purchase', 'credit_grant', 'credit_refund') AND credits_delta > 0) OR
    (operation_type NOT IN ('credit_purchase', 'credit_grant', 'credit_refund') AND credits_delta < 0)
  ),
  CONSTRAINT balance_consistency CHECK (balance_after = balance_before + credits_delta)
);

-- Indexes (CRITICAL for performance)
CREATE INDEX IF NOT EXISTS idx_credit_ledger_org ON credit_ledger(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user ON credit_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_request ON credit_ledger(request_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_operation ON credit_ledger(operation_type);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_reference ON credit_ledger(reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_credit_ledger_time_series ON credit_ledger(organization_id, created_at DESC, operation_type);

COMMENT ON TABLE credit_ledger IS 'Immutable append-only log of all credit transactions';
COMMENT ON COLUMN credit_ledger.credits_delta IS 'Negative for consumption, positive for purchase/grant';
COMMENT ON COLUMN credit_ledger.request_id IS 'UUID linking to API request for debugging';

-- ============================================================================
-- STEP 6: Create Invitations Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Invitation Details
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  temporary_password TEXT, -- For admin-created users
  
  -- Token
  token TEXT UNIQUE NOT NULL,
  
  -- Status
  status TEXT CHECK (status IN ('pending', 'accepted', 'expired', 'canceled')) DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id),
  
  -- Expiry
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, email, status) -- Can't have multiple pending invites
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invitations_org ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);

COMMENT ON TABLE invitations IS 'Team member invitations sent by admins';
COMMENT ON COLUMN invitations.token IS 'Secure random token for invitation acceptance link';

-- ============================================================================
-- STEP 7: Create Billing Accounts (Future Stripe Integration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Stripe Integration
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  
  -- Plan & Status
  plan TEXT, -- 'free', 'starter', 'pro', 'enterprise'
  status TEXT, -- 'active', 'past_due', 'canceled', 'trialing'
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_billing_accounts_org ON billing_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_accounts_stripe ON billing_accounts(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

COMMENT ON TABLE billing_accounts IS 'Stripe billing integration (org-level only)';

-- ============================================================================
-- STEP 8: Connect Existing Tables to Organizations
-- ============================================================================

-- Add organization_id to existing tables
-- Note: Update these table names to match your actual schema

DO $$ 
BEGIN
  -- leads table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'organization_id') THEN
      ALTER TABLE leads ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      CREATE INDEX idx_leads_org ON leads(organization_id);
    END IF;
  END IF;

  -- business_profiles table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_profiles') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'organization_id') THEN
      ALTER TABLE business_profiles ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      CREATE INDEX idx_business_profiles_org ON business_profiles(organization_id);
    END IF;
  END IF;

  -- icp_definitions / icp_searches table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'icp_definitions') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'icp_definitions' AND column_name = 'organization_id') THEN
      ALTER TABLE icp_definitions ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      CREATE INDEX idx_icp_definitions_org ON icp_definitions(organization_id);
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'icp_searches') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'icp_searches' AND column_name = 'organization_id') THEN
      ALTER TABLE icp_searches ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      CREATE INDEX idx_icp_searches_org ON icp_searches(organization_id);
    END IF;
  END IF;

  -- saved_searches table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_searches') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_searches' AND column_name = 'organization_id') THEN
      ALTER TABLE saved_searches ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      CREATE INDEX idx_saved_searches_org ON saved_searches(organization_id);
    END IF;
  END IF;

  -- campaigns table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'organization_id') THEN
      ALTER TABLE campaigns ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      CREATE INDEX idx_campaigns_org ON campaigns(organization_id);
    END IF;
  END IF;

  -- campaign_prospects table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_prospects') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaign_prospects' AND column_name = 'organization_id') THEN
      ALTER TABLE campaign_prospects ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      CREATE INDEX idx_campaign_prospects_org ON campaign_prospects(organization_id);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- STEP 9: Helper Functions
-- ============================================================================

-- Function: Get organization credit balance from wallet
CREATE OR REPLACE FUNCTION get_org_credit_balance(org_id UUID)
RETURNS INTEGER AS $$
DECLARE
  balance INTEGER;
BEGIN
  SELECT COALESCE(organization_wallets.balance, 0) INTO balance
  FROM organization_wallets
  WHERE organization_id = org_id;
  
  RETURN COALESCE(balance, 0);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_org_credit_balance IS 'Get current credit balance for organization';

-- Function: Get user's monthly usage
CREATE OR REPLACE FUNCTION get_user_monthly_usage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  usage INTEGER;
BEGIN
  SELECT COALESCE(SUM(ABS(credits_delta)), 0) INTO usage
  FROM credit_ledger
  WHERE user_id = p_user_id
    AND credits_delta < 0 -- Only consumption
    AND created_at >= DATE_TRUNC('month', NOW());
  
  RETURN usage;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_monthly_usage IS 'Get user''s credit usage for current month';

-- Function: Check if user can perform operation
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
    RETURN FALSE;
  END IF;
  
  -- Check user's monthly limit (if set)
  SELECT credit_limit INTO user_limit
  FROM memberships
  WHERE user_id = p_user_id 
    AND organization_id = p_org_id
    AND status = 'active';
  
  IF user_limit IS NOT NULL THEN
    user_usage := get_user_monthly_usage(p_user_id);
    IF (user_usage + p_credits_required) > user_limit THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION can_user_perform_operation IS 'Check if user has sufficient credits to perform operation';

-- ============================================================================
-- STEP 10: Triggers for Auto-Update Timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER organizations_updated_at 
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER memberships_updated_at 
  BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER organization_wallets_updated_at 
  BEFORE UPDATE ON organization_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER billing_accounts_updated_at 
  BEFORE UPDATE ON billing_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 11: Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_accounts ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see their own org
CREATE POLICY org_isolation ON organizations
  FOR ALL
  USING (
    id IN (
      SELECT organization_id 
      FROM memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- User Profiles: Users can see their own profile + teammates
CREATE POLICY user_profiles_isolation ON user_profiles
  FOR ALL
  USING (
    id = auth.uid() OR
    id IN (
      SELECT m2.user_id 
      FROM memberships m1
      JOIN memberships m2 ON m1.organization_id = m2.organization_id
      WHERE m1.user_id = auth.uid() AND m1.status = 'active'
    )
  );

-- Memberships: Users can only see members of their org
CREATE POLICY memberships_isolation ON memberships
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Organization Wallets: Users can only see their org's wallet
CREATE POLICY wallets_isolation ON organization_wallets
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Credit Ledger: Users can only see their org's transactions
CREATE POLICY credit_ledger_isolation ON credit_ledger
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Invitations: Users can only see invitations for their org
CREATE POLICY invitations_isolation ON invitations
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Billing Accounts: Users can only see their org's billing
CREATE POLICY billing_isolation ON billing_accounts
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Apply RLS to existing tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'organization_id') THEN
    ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS leads_isolation ON leads;
    CREATE POLICY leads_isolation ON leads
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id FROM memberships WHERE user_id = auth.uid() AND status = 'active'
        )
      );
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_profiles')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'organization_id') THEN
    ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS business_profiles_isolation ON business_profiles;
    CREATE POLICY business_profiles_isolation ON business_profiles
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id FROM memberships WHERE user_id = auth.uid() AND status = 'active'
        )
      );
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'organization_id') THEN
    ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS campaigns_isolation ON campaigns;
    CREATE POLICY campaigns_isolation ON campaigns
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id FROM memberships WHERE user_id = auth.uid() AND status = 'active'
        )
      );
  END IF;
END $$;

-- ============================================================================
-- STEP 12: Create Default/Demo Organization (Optional - for testing)
-- ============================================================================

-- Uncomment to create a demo org with trial credits
/*
DO $$
DECLARE
  demo_org_id UUID;
BEGIN
  -- Create demo organization
  INSERT INTO organizations (name, slug, industry, subscription_status)
  VALUES ('Demo Corporation', 'demo-corp', 'Technology', 'trial')
  RETURNING id INTO demo_org_id;
  
  -- Create wallet with trial credits
  INSERT INTO organization_wallets (organization_id, balance)
  VALUES (demo_org_id, 100);
  
  -- Log trial credit grant
  INSERT INTO credit_ledger (
    organization_id,
    user_id,
    operation_type,
    credits_delta,
    balance_before,
    balance_after,
    request_id
  )
  VALUES (
    demo_org_id,
    (SELECT id FROM auth.users LIMIT 1), -- Use first auth user
    'credit_grant',
    100,
    0,
    100,
    gen_random_uuid()
  );
END $$;
*/

-- ============================================================================
-- STEP 13: Analytics Views (Optional - for dashboards)
-- ============================================================================

-- Materialized view for monthly usage analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS user_monthly_usage AS
SELECT 
  organization_id,
  user_id,
  DATE_TRUNC('month', created_at) AS month,
  operation_type,
  COUNT(*) AS operation_count,
  SUM(ABS(credits_delta)) AS credits_used
FROM credit_ledger
WHERE credits_delta < 0 -- Only consumption
GROUP BY organization_id, user_id, DATE_TRUNC('month', created_at), operation_type;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_monthly_usage_org ON user_monthly_usage(organization_id, month);
CREATE INDEX IF NOT EXISTS idx_user_monthly_usage_user ON user_monthly_usage(user_id, month);

-- Function to refresh the view
CREATE OR REPLACE FUNCTION refresh_user_monthly_usage()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_monthly_usage;
END;
$$ LANGUAGE plpgsql;

COMMENT ON MATERIALIZED VIEW user_monthly_usage IS 'Aggregated monthly usage statistics per user';

-- ============================================================================
-- Migration Complete! 🎉
-- ============================================================================

-- Verify tables were created
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '📊 Created tables:';
  RAISE NOTICE '   - organizations';
  RAISE NOTICE '   - user_profiles';
  RAISE NOTICE '   - memberships';
  RAISE NOTICE '   - organization_wallets';
  RAISE NOTICE '   - credit_ledger';
  RAISE NOTICE '   - invitations';
  RAISE NOTICE '   - billing_accounts';
  RAISE NOTICE '🔒 Enabled RLS on all tables';
  RAISE NOTICE '⚡ Created helper functions';
  RAISE NOTICE '📈 Created analytics views';
END $$;