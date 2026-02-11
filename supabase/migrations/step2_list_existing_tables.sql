-- ============================================================================
-- STEP 2: Discover Existing Tables
-- ============================================================================
-- Run this to see what tables already exist in your database
-- ============================================================================

SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('leads', 'business_profiles', 'campaigns', 'campaign_prospects', 
                        'icp_definitions', 'icp_searches', 'saved_searches')
    THEN '✅ Expected table'
    ELSE '❓ Unknown table'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name NOT LIKE 'kv_store%'
ORDER BY table_name;

-- Also check for existing columns
DO $$
DECLARE
  table_record RECORD;
  has_org_id BOOLEAN;
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Checking for organization_id columns:';
  RAISE NOTICE '===========================================';
  
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE 'kv_store%'
      AND table_name NOT IN ('organizations', 'user_profiles', 'memberships', 
                              'organization_wallets', 'credit_ledger', 'invitations', 'billing_accounts')
    ORDER BY table_name
  LOOP
    SELECT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = table_record.table_name 
        AND column_name = 'organization_id'
    ) INTO has_org_id;
    
    IF has_org_id THEN
      RAISE NOTICE '✅ % - already has organization_id', table_record.table_name;
    ELSE
      RAISE NOTICE '⚠️  % - needs organization_id', table_record.table_name;
    END IF;
  END LOOP;
END $$;
