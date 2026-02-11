-- ============================================================================
-- NUCLEAR CLEANUP - Drop EVERYTHING related to organization management
-- ============================================================================
-- This removes ALL objects that might be causing conflicts
-- ============================================================================

DO $$ 
DECLARE
  table_exists BOOLEAN;
  tbl_name TEXT;
BEGIN
  RAISE NOTICE '💣 NUCLEAR CLEANUP STARTING...';
  RAISE NOTICE '';
  
  -- ========================================
  -- 1. DROP ALL FUNCTIONS
  -- ========================================
  RAISE NOTICE '🔧 Dropping functions...';
  
  DROP FUNCTION IF EXISTS get_org_credit_balance(UUID);
  DROP FUNCTION IF EXISTS get_user_monthly_usage(UUID);
  DROP FUNCTION IF EXISTS can_user_perform_operation(UUID, UUID, INTEGER);
  DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
  
  RAISE NOTICE '✅ Functions dropped';
  RAISE NOTICE '';
  
  -- ========================================
  -- 2. DROP ALL POLICIES (safe version)
  -- ========================================
  RAISE NOTICE '🔒 Dropping policies...';
  
  -- New org tables
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') INTO table_exists;
  IF table_exists THEN DROP POLICY IF EXISTS org_isolation ON organizations; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') INTO table_exists;
  IF table_exists THEN DROP POLICY IF EXISTS user_profiles_isolation ON user_profiles; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships') INTO table_exists;
  IF table_exists THEN DROP POLICY IF EXISTS memberships_isolation ON memberships; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_wallets') INTO table_exists;
  IF table_exists THEN DROP POLICY IF EXISTS wallets_isolation ON organization_wallets; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credit_ledger') INTO table_exists;
  IF table_exists THEN DROP POLICY IF EXISTS credit_ledger_isolation ON credit_ledger; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invitations') INTO table_exists;
  IF table_exists THEN DROP POLICY IF EXISTS invitations_isolation ON invitations; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'billing_accounts') INTO table_exists;
  IF table_exists THEN DROP POLICY IF EXISTS billing_isolation ON billing_accounts; END IF;
  
  -- Existing tables
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') INTO table_exists;
  IF table_exists THEN DROP POLICY IF EXISTS leads_isolation ON leads; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_profiles') INTO table_exists;
  IF table_exists THEN DROP POLICY IF EXISTS business_profiles_isolation ON business_profiles; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns') INTO table_exists;
  IF table_exists THEN DROP POLICY IF EXISTS campaigns_isolation ON campaigns; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_prospects') INTO table_exists;
  IF table_exists THEN DROP POLICY IF EXISTS campaign_prospects_isolation ON campaign_prospects; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'icp_definitions') INTO table_exists;
  IF table_exists THEN DROP POLICY IF EXISTS icp_definitions_isolation ON icp_definitions; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'icp_searches') INTO table_exists;
  IF table_exists THEN DROP POLICY IF EXISTS icp_searches_isolation ON icp_searches; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_searches') INTO table_exists;
  IF table_exists THEN DROP POLICY IF EXISTS saved_searches_isolation ON saved_searches; END IF;
  
  RAISE NOTICE '✅ Policies dropped';
  RAISE NOTICE '';
  
  -- ========================================
  -- 3. DISABLE RLS ON ALL TABLES
  -- ========================================
  RAISE NOTICE '🔓 Disabling RLS...';
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') INTO table_exists;
  IF table_exists THEN ALTER TABLE organizations DISABLE ROW LEVEL SECURITY; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') INTO table_exists;
  IF table_exists THEN ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships') INTO table_exists;
  IF table_exists THEN ALTER TABLE memberships DISABLE ROW LEVEL SECURITY; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_wallets') INTO table_exists;
  IF table_exists THEN ALTER TABLE organization_wallets DISABLE ROW LEVEL SECURITY; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credit_ledger') INTO table_exists;
  IF table_exists THEN ALTER TABLE credit_ledger DISABLE ROW LEVEL SECURITY; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invitations') INTO table_exists;
  IF table_exists THEN ALTER TABLE invitations DISABLE ROW LEVEL SECURITY; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'billing_accounts') INTO table_exists;
  IF table_exists THEN ALTER TABLE billing_accounts DISABLE ROW LEVEL SECURITY; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') INTO table_exists;
  IF table_exists THEN ALTER TABLE leads DISABLE ROW LEVEL SECURITY; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_profiles') INTO table_exists;
  IF table_exists THEN ALTER TABLE business_profiles DISABLE ROW LEVEL SECURITY; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns') INTO table_exists;
  IF table_exists THEN ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_prospects') INTO table_exists;
  IF table_exists THEN ALTER TABLE campaign_prospects DISABLE ROW LEVEL SECURITY; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'icp_definitions') INTO table_exists;
  IF table_exists THEN ALTER TABLE icp_definitions DISABLE ROW LEVEL SECURITY; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'icp_searches') INTO table_exists;
  IF table_exists THEN ALTER TABLE icp_searches DISABLE ROW LEVEL SECURITY; END IF;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_searches') INTO table_exists;
  IF table_exists THEN ALTER TABLE saved_searches DISABLE ROW LEVEL SECURITY; END IF;
  
  RAISE NOTICE '✅ RLS disabled';
  RAISE NOTICE '';
  
  -- ========================================
  -- 4. DROP ALL ORGANIZATION TABLES
  -- ========================================
  RAISE NOTICE '🗑️  Dropping organization tables (if they exist)...';
  
  DROP TABLE IF EXISTS billing_accounts CASCADE;
  DROP TABLE IF EXISTS invitations CASCADE;
  DROP TABLE IF EXISTS credit_ledger CASCADE;
  DROP TABLE IF EXISTS organization_wallets CASCADE;
  DROP TABLE IF EXISTS memberships CASCADE;
  DROP TABLE IF EXISTS user_profiles CASCADE;
  DROP TABLE IF EXISTS organizations CASCADE;
  
  RAISE NOTICE '✅ Tables dropped';
  RAISE NOTICE '';
  
  -- ========================================
  -- 5. SHOW WHAT TABLES REMAIN
  -- ========================================
  RAISE NOTICE '📋 Remaining tables in database:';
  FOR tbl_name IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  LOOP
    RAISE NOTICE '   - %', tbl_name;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ NUCLEAR CLEANUP COMPLETE!';
  RAISE NOTICE '🟢 Database is now in clean state';
  RAISE NOTICE '👉 Now run step1_create_new_tables.sql';
END $$;