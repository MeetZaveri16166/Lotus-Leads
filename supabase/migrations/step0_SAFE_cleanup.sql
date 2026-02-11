-- ============================================================================
-- STEP 0: ULTRA SAFE CLEANUP
-- ============================================================================
-- This version checks if tables exist BEFORE dropping policies
-- ============================================================================

DO $$ 
DECLARE
  table_exists BOOLEAN;
BEGIN
  RAISE NOTICE '🧹 Starting cleanup...';
  
  -- Check and clean: organizations
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') INTO table_exists;
  IF table_exists THEN
    DROP POLICY IF EXISTS org_isolation ON organizations;
    ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ Cleaned: organizations';
  END IF;

  -- Check and clean: user_profiles
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') INTO table_exists;
  IF table_exists THEN
    DROP POLICY IF EXISTS user_profiles_isolation ON user_profiles;
    ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ Cleaned: user_profiles';
  END IF;

  -- Check and clean: memberships
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships') INTO table_exists;
  IF table_exists THEN
    DROP POLICY IF EXISTS memberships_isolation ON memberships;
    ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ Cleaned: memberships';
  END IF;

  -- Check and clean: organization_wallets
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_wallets') INTO table_exists;
  IF table_exists THEN
    DROP POLICY IF EXISTS wallets_isolation ON organization_wallets;
    ALTER TABLE organization_wallets DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ Cleaned: organization_wallets';
  END IF;

  -- Check and clean: credit_ledger
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credit_ledger') INTO table_exists;
  IF table_exists THEN
    DROP POLICY IF EXISTS credit_ledger_isolation ON credit_ledger;
    ALTER TABLE credit_ledger DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ Cleaned: credit_ledger';
  END IF;

  -- Check and clean: invitations
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invitations') INTO table_exists;
  IF table_exists THEN
    DROP POLICY IF EXISTS invitations_isolation ON invitations;
    ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ Cleaned: invitations';
  END IF;

  -- Check and clean: billing_accounts
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'billing_accounts') INTO table_exists;
  IF table_exists THEN
    DROP POLICY IF EXISTS billing_isolation ON billing_accounts;
    ALTER TABLE billing_accounts DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ Cleaned: billing_accounts';
  END IF;

  -- Check and clean: leads
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') INTO table_exists;
  IF table_exists THEN
    DROP POLICY IF EXISTS leads_isolation ON leads;
    ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ Cleaned: leads';
  END IF;

  -- Check and clean: business_profiles
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_profiles') INTO table_exists;
  IF table_exists THEN
    DROP POLICY IF EXISTS business_profiles_isolation ON business_profiles;
    ALTER TABLE business_profiles DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ Cleaned: business_profiles';
  END IF;

  -- Check and clean: campaigns
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns') INTO table_exists;
  IF table_exists THEN
    DROP POLICY IF EXISTS campaigns_isolation ON campaigns;
    ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ Cleaned: campaigns';
  END IF;

  -- Check and clean: campaign_prospects
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_prospects') INTO table_exists;
  IF table_exists THEN
    DROP POLICY IF EXISTS campaign_prospects_isolation ON campaign_prospects;
    ALTER TABLE campaign_prospects DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ Cleaned: campaign_prospects';
  END IF;

  -- Check and clean: icp_definitions
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'icp_definitions') INTO table_exists;
  IF table_exists THEN
    DROP POLICY IF EXISTS icp_definitions_isolation ON icp_definitions;
    ALTER TABLE icp_definitions DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ Cleaned: icp_definitions';
  END IF;

  -- Check and clean: icp_searches
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'icp_searches') INTO table_exists;
  IF table_exists THEN
    DROP POLICY IF EXISTS icp_searches_isolation ON icp_searches;
    ALTER TABLE icp_searches DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ Cleaned: icp_searches';
  END IF;

  -- Check and clean: saved_searches
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_searches') INTO table_exists;
  IF table_exists THEN
    DROP POLICY IF EXISTS saved_searches_isolation ON saved_searches;
    ALTER TABLE saved_searches DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ Cleaned: saved_searches';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ CLEANUP COMPLETE!';
  RAISE NOTICE '👉 Now run step1_create_new_tables.sql';
END $$;
