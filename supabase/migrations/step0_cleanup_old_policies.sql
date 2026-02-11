-- ============================================================================
-- STEP 0: CLEANUP - Remove all leftover policies from failed migrations
-- ============================================================================
-- Run this FIRST before Step 1
-- ============================================================================

-- Drop ALL policies that might exist from previous attempts
-- (This is safe - we'll recreate them properly later)

-- Policies on new tables (that might not exist yet)
DROP POLICY IF EXISTS org_isolation ON organizations;
DROP POLICY IF EXISTS user_profiles_isolation ON user_profiles;
DROP POLICY IF EXISTS memberships_isolation ON memberships;
DROP POLICY IF EXISTS wallets_isolation ON organization_wallets;
DROP POLICY IF EXISTS credit_ledger_isolation ON credit_ledger;
DROP POLICY IF EXISTS invitations_isolation ON invitations;
DROP POLICY IF EXISTS billing_isolation ON billing_accounts;

-- Policies on existing tables (that reference organization_id but column doesn't exist yet)
DROP POLICY IF EXISTS leads_isolation ON leads;
DROP POLICY IF EXISTS business_profiles_isolation ON business_profiles;
DROP POLICY IF EXISTS campaigns_isolation ON campaigns;
DROP POLICY IF EXISTS campaign_prospects_isolation ON campaign_prospects;
DROP POLICY IF EXISTS icp_definitions_isolation ON icp_definitions;
DROP POLICY IF EXISTS icp_searches_isolation ON icp_searches;
DROP POLICY IF EXISTS saved_searches_isolation ON saved_searches;

-- Also disable RLS on existing tables (in case it was enabled)
DO $$ 
BEGIN
  -- Only disable RLS if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
    ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_profiles') THEN
    ALTER TABLE business_profiles DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns') THEN
    ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_prospects') THEN
    ALTER TABLE campaign_prospects DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'icp_definitions') THEN
    ALTER TABLE icp_definitions DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'icp_searches') THEN
    ALTER TABLE icp_searches DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_searches') THEN
    ALTER TABLE saved_searches DISABLE ROW LEVEL SECURITY;
  END IF;

  -- Disable RLS on organization tables if they exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
    ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships') THEN
    ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_wallets') THEN
    ALTER TABLE organization_wallets DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credit_ledger') THEN
    ALTER TABLE credit_ledger DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invitations') THEN
    ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'billing_accounts') THEN
    ALTER TABLE billing_accounts DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ CLEANUP COMPLETE';
  RAISE NOTICE '   - Dropped all existing policies';
  RAISE NOTICE '   - Disabled RLS on all tables';
  RAISE NOTICE '   - Ready for fresh migration';
  RAISE NOTICE '';
  RAISE NOTICE '👉 Now run STEP 1';
END $$;
