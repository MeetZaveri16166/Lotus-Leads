-- ============================================================================
-- STEP 1: Create New Organization Tables
-- ============================================================================
-- Run this FIRST. These are brand new tables, no dependencies.
-- ============================================================================

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  industry TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  domain TEXT,
  logo_url TEXT,
  api_keys JSONB DEFAULT '{}'::jsonb,
  subscription_status TEXT CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled')) DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain) WHERE domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_deleted ON organizations(deleted_at) WHERE deleted_at IS NULL;

-- User Profiles
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

-- Memberships
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

-- Organization Wallets
CREATE TABLE IF NOT EXISTS organization_wallets (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Ledger
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

-- Invitations
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

-- Billing Accounts
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

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ STEP 1 COMPLETE: Created 7 new tables';
  RAISE NOTICE '   - organizations';
  RAISE NOTICE '   - user_profiles';
  RAISE NOTICE '   - memberships';
  RAISE NOTICE '   - organization_wallets';
  RAISE NOTICE '   - credit_ledger';
  RAISE NOTICE '   - invitations';
  RAISE NOTICE '   - billing_accounts';
END $$;
