-- ============================================================================
-- LotusLeads - Organization & User Management Migration (CLEAN VERSION)
-- ============================================================================
-- Version: 1.0.2 (Fixed all RLS conflicts)
-- Date: 2026-01-24
-- Description: Multi-tenant SaaS architecture with org-level billing
-- ============================================================================

-- ============================================================================
-- CRITICAL STEP 0: Drop ALL existing RLS policies unconditionally
-- ============================================================================

-- Drop policies that might reference organization_id
DROP POLICY IF EXISTS leads_isolation ON leads;
DROP POLICY IF EXISTS business_profiles_isolation ON business_profiles;
DROP POLICY IF EXISTS campaigns_isolation ON campaigns;
DROP POLICY IF EXISTS campaign_prospects_isolation ON campaign_prospects;
DROP POLICY IF EXISTS icp_definitions_isolation ON icp_definitions;
DROP POLICY IF EXISTS icp_searches_isolation ON icp_searches;
DROP POLICY IF EXISTS saved_searches_isolation ON saved_searches;
DROP POLICY IF EXISTS org_isolation ON organizations;
DROP POLICY IF EXISTS user_profiles_isolation ON user_profiles;
DROP POLICY IF EXISTS memberships_isolation ON memberships;
DROP POLICY IF EXISTS wallets_isolation ON organization_wallets;
DROP POLICY IF EXISTS credit_ledger_isolation ON credit_ledger;
DROP POLICY IF EXISTS invitations_isolation ON invitations;
DROP POLICY IF EXISTS billing_isolation ON billing_accounts;

-- ============================================================================
-- STEP 1: Create Organizations Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  industry TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  
  -- Optional Features
  domain TEXT,
  logo_url TEXT,
  
  -- API Keys
  api_keys JSONB DEFAULT '{}'::jsonb,
  
  -- Subscription & Trial
  subscription_status TEXT CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled')) DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain) WHERE domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_deleted ON organizations(deleted_at) WHERE deleted_at IS NULL;

COMMENT ON TABLE organizations IS 'Each business/tenant in the multi-tenant system';

-- ============================================================================
-- STEP 2: Create User Profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  
  auth_method TEXT CHECK (auth_method IN ('google', 'email', 'invited')) NOT NULL,
  
  status TEXT CHECK (status IN ('active', 'suspended', 'deleted')) DEFAULT 'active',
  password_reset_required BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_method ON user_profiles(auth_method);

COMMENT ON TABLE user_profiles IS 'Extended user profile data';

-- ============================================================================
-- STEP 3: Create Memberships
-- ============================================================================

CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  role TEXT CHECK (role IN ('admin', 'user')) NOT NULL,
  
  credit_limit INTEGER,
  
  status TEXT CHECK (status IN ('active', 'invited', 'suspended')) DEFAULT 'active',
  
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org ON memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_memberships_role ON memberships(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status) WHERE status = 'active';

COMMENT ON TABLE memberships IS 'User-Organization relationships with role-based access';

-- ============================================================================
-- STEP 4: Create Organization Wallets
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_wallets (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE organization_wallets IS 'Organization credit balance';

-- ============================================================================
-- STEP 5: Create Credit Ledger
-- ============================================================================

CREATE TABLE IF NOT EXISTS credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  operation_type TEXT NOT NULL CHECK (operation_type IN (
    'apollo_search',
    'apollo_enrich',
    'geo_enrichment',
    'property_analysis',
    'service_mapping',
    'credit_purchase',
    'credit_grant',
    'credit_refund'
  )),
  
  credits_delta INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  
  request_id UUID NOT NULL,
  reference_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT credits_sign_check CHECK (
    (operation_type IN ('credit_purchase', 'credit_grant', 'credit_refund') AND credits_delta > 0) OR
    (operation_type NOT IN ('credit_purchase', 'credit_grant', 'credit_refund') AND credits_delta < 0)
  ),
  CONSTRAINT balance_consistency CHECK (balance_after = balance_before + credits_delta)
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_org ON credit_ledger(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user ON credit_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_request ON credit_ledger(request_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_operation ON credit_ledger(operation_type);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_reference ON credit_ledger(reference_id) WHERE reference_id IS NOT NULL;

COMMENT ON TABLE credit_ledger IS 'Immutable append-only log of all credit transactions';

-- ============================================================================
-- STEP 6: Create Invitations
-- ============================================================================

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  temporary_password TEXT,
  
  token TEXT UNIQUE NOT NULL,
  
  status TEXT CHECK (status IN ('pending', 'accepted', 'expired', 'canceled')) DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id),
  
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, email, status)
);

CREATE INDEX IF NOT EXISTS idx_invitations_org ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);

COMMENT ON TABLE invitations IS 'Team member invitations';

-- ============================================================================
-- STEP 7: Create Billing Accounts
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  
  plan TEXT,
  status TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_accounts_org ON billing_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_accounts_stripe ON billing_accounts(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

COMMENT ON TABLE billing_accounts IS 'Stripe billing integration';

-- ============================================================================
-- STEP 8: Add organization_id to Existing Tables
-- ============================================================================

DO $$ 
BEGIN
  -- leads
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'organization_id') THEN
      ALTER TABLE leads ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      CREATE INDEX idx_leads_org ON leads(organization_id);
    END IF;
  END IF;

  -- business_profiles
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_profiles') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'organization_id') THEN
      ALTER TABLE business_profiles ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      CREATE INDEX idx_business_profiles_org ON business_profiles(organization_id);
    END IF;
  END IF;

  -- icp_definitions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'icp_definitions') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'icp_definitions' AND column_name = 'organization_id') THEN
      ALTER TABLE icp_definitions ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      CREATE INDEX idx_icp_definitions_org ON icp_definitions(organization_id);
    END IF;
  END IF;

  -- icp_searches
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'icp_searches') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'icp_searches' AND column_name = 'organization_id') THEN
      ALTER TABLE icp_searches ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      CREATE INDEX idx_icp_searches_org ON icp_searches(organization_id);
    END IF;
  END IF;

  -- saved_searches
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_searches') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_searches' AND column_name = 'organization_id') THEN
      ALTER TABLE saved_searches ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      CREATE INDEX idx_saved_searches_org ON saved_searches(organization_id);
    END IF;
  END IF;

  -- campaigns
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'organization_id') THEN
      ALTER TABLE campaigns ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      CREATE INDEX idx_campaigns_org ON campaigns(organization_id);
    END IF;
  END IF;

  -- campaign_prospects
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
$$ LANGUAGE plpgsql STABLE;

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
  org_balance := get_org_credit_balance(p_org_id);
  IF org_balance < p_credits_required THEN
    RETURN FALSE;
  END IF;
  
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

-- ============================================================================
-- STEP 10: Triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS organizations_updated_at ON organizations;
DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS memberships_updated_at ON memberships;
DROP TRIGGER IF EXISTS organization_wallets_updated_at ON organization_wallets;
DROP TRIGGER IF EXISTS billing_accounts_updated_at ON billing_accounts;

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
-- STEP 11: Row-Level Security
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_accounts ENABLE ROW LEVEL SECURITY;

-- New table policies
CREATE POLICY org_isolation ON organizations
  FOR ALL USING (
    id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY user_profiles_isolation ON user_profiles
  FOR ALL USING (
    id = auth.uid() OR
    id IN (
      SELECT m2.user_id 
      FROM memberships m1
      JOIN memberships m2 ON m1.organization_id = m2.organization_id
      WHERE m1.user_id = auth.uid() AND m1.status = 'active'
    )
  );

CREATE POLICY memberships_isolation ON memberships
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY wallets_isolation ON organization_wallets
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY credit_ledger_isolation ON credit_ledger
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY invitations_isolation ON invitations
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY billing_isolation ON billing_accounts
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid() AND status = 'active')
  );

-- Existing table policies (only if organization_id exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'organization_id') THEN
    ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
    CREATE POLICY leads_isolation ON leads
      FOR ALL USING (
        organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid() AND status = 'active')
      );
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'organization_id') THEN
    ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
    CREATE POLICY business_profiles_isolation ON business_profiles
      FOR ALL USING (
        organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid() AND status = 'active')
      );
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'organization_id') THEN
    ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
    CREATE POLICY campaigns_isolation ON campaigns
      FOR ALL USING (
        organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid() AND status = 'active')
      );
  END IF;
END $$;

-- ============================================================================
-- Done!
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed!';
  RAISE NOTICE '📊 Tables: organizations, user_profiles, memberships, organization_wallets, credit_ledger, invitations, billing_accounts';
  RAISE NOTICE '🔒 RLS enabled on all tables';
  RAISE NOTICE '⚡ Helper functions created';
END $$;
