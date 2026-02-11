-- ============================================================================
-- STEP 5: Seed Data & Migrate Existing Records
-- ============================================================================
-- Creates default organization and migrates all existing data to it
-- ============================================================================

DO $$ 
DECLARE
  default_org_id UUID;
  default_wallet_id UUID;
  user_record RECORD;
  user_count INTEGER := 0;
  lead_count INTEGER := 0;
  campaign_count INTEGER := 0;
  profile_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🌱 SEEDING DATA & MIGRATING EXISTING RECORDS...';
  RAISE NOTICE '';
  
  -- ========================================
  -- 1. CREATE DEFAULT ORGANIZATION
  -- ========================================
  RAISE NOTICE '🏢 Creating default organization...';
  
  INSERT INTO organizations (id, name, slug, subscription_status)
  VALUES (
    gen_random_uuid(),
    'Default Organization',
    'default-org',
    'trial'
  )
  RETURNING id INTO default_org_id;
  
  RAISE NOTICE '✅ Default organization created: %', default_org_id;
  RAISE NOTICE '';
  
  -- ========================================
  -- 2. CREATE ORGANIZATION WALLET
  -- ========================================
  RAISE NOTICE '💰 Creating organization wallet...';
  
  INSERT INTO organization_wallets (organization_id, balance)
  VALUES (
    default_org_id,
    100000 -- Starting with 100k credits
  );
  
  RAISE NOTICE '✅ Wallet created with 100,000 credits';
  RAISE NOTICE '';
  
  -- ========================================
  -- 3. CREATE BILLING ACCOUNT
  -- ========================================
  RAISE NOTICE '💳 Creating billing account...';
  
  INSERT INTO billing_accounts (organization_id, status)
  VALUES (
    default_org_id,
    'active'
  );
  
  RAISE NOTICE '✅ Billing account created';
  RAISE NOTICE '';
  
  -- ========================================
  -- 4. CREATE USER PROFILES & MEMBERSHIPS
  -- ========================================
  RAISE NOTICE '👥 Creating user profiles and memberships...';
  
  FOR user_record IN 
    SELECT id, email, raw_user_meta_data->>'full_name' as full_name
    FROM auth.users
  LOOP
    -- Create user profile
    INSERT INTO user_profiles (id, full_name, auth_method, status)
    VALUES (
      user_record.id,
      COALESCE(user_record.full_name, 'User'),
      'email',
      'active'
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Create membership (first user is admin, rest are users)
    INSERT INTO memberships (user_id, organization_id, role, status)
    VALUES (
      user_record.id,
      default_org_id,
      CASE WHEN user_count = 0 THEN 'admin' ELSE 'user' END,
      'active'
    )
    ON CONFLICT (user_id, organization_id) DO NOTHING;
    
    user_count := user_count + 1;
  END LOOP;
  
  RAISE NOTICE '✅ Created profiles and memberships for % users', user_count;
  RAISE NOTICE '';
  
  -- ========================================
  -- 5. MIGRATE EXISTING LEADS
  -- ========================================
  RAISE NOTICE '🎯 Migrating existing leads...';
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    UPDATE leads 
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
    
    GET DIAGNOSTICS lead_count = ROW_COUNT;
    RAISE NOTICE '✅ Migrated % leads', lead_count;
  ELSE
    RAISE NOTICE '⏭️  No leads table found';
  END IF;
  
  RAISE NOTICE '';
  
  -- ========================================
  -- 6. MIGRATE EXISTING BUSINESS PROFILES
  -- ========================================
  RAISE NOTICE '🏪 Migrating existing business profiles...';
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'business_profiles') THEN
    UPDATE business_profiles 
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
    
    GET DIAGNOSTICS profile_count = ROW_COUNT;
    RAISE NOTICE '✅ Migrated % business profiles', profile_count;
  ELSE
    RAISE NOTICE '⏭️  No business_profiles table found';
  END IF;
  
  RAISE NOTICE '';
  
  -- ========================================
  -- 7. MIGRATE EXISTING CAMPAIGNS
  -- ========================================
  RAISE NOTICE '📢 Migrating existing campaigns...';
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campaigns') THEN
    UPDATE campaigns 
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
    
    GET DIAGNOSTICS campaign_count = ROW_COUNT;
    RAISE NOTICE '✅ Migrated % campaigns', campaign_count;
  ELSE
    RAISE NOTICE '⏭️  No campaigns table found';
  END IF;
  
  RAISE NOTICE '';
  
  -- ========================================
  -- 8. MIGRATE OTHER TABLES
  -- ========================================
  RAISE NOTICE '📦 Migrating other tables...';
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campaign_prospects') THEN
    UPDATE campaign_prospects SET organization_id = default_org_id WHERE organization_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'icp_definitions') THEN
    UPDATE icp_definitions SET organization_id = default_org_id WHERE organization_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'icp_searches') THEN
    UPDATE icp_searches SET organization_id = default_org_id WHERE organization_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saved_searches') THEN
    UPDATE saved_searches SET organization_id = default_org_id WHERE organization_id IS NULL;
  END IF;
  
  RAISE NOTICE '✅ All tables migrated';
  RAISE NOTICE '';
  
  -- ========================================
  -- SUMMARY
  -- ========================================
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ MIGRATION COMPLETE!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '   - Organization created: %', default_org_id;
  RAISE NOTICE '   - Starting credits: 100,000';
  RAISE NOTICE '   - Users migrated: %', user_count;
  RAISE NOTICE '   - Leads migrated: %', lead_count;
  RAISE NOTICE '   - Business profiles: %', profile_count;
  RAISE NOTICE '   - Campaigns migrated: %', campaign_count;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '   1. Update Prisma schema';
  RAISE NOTICE '   2. Run: npx prisma generate';
  RAISE NOTICE '   3. Build Google OAuth signup flow';
  RAISE NOTICE '   4. Build team invitation system';
  RAISE NOTICE '';
END $$;