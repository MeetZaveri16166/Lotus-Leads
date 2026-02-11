-- ============================================================================
-- STEP 2: Add organization_id Columns to Existing Tables
-- ============================================================================
-- Adds organization_id foreign key to all existing data tables
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '📦 ADDING organization_id COLUMNS TO EXISTING TABLES...';
  RAISE NOTICE '';
  
  -- ========================================
  -- LEADS
  -- ========================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    RAISE NOTICE '🎯 Adding organization_id to leads...';
    
    ALTER TABLE leads 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_leads_organization ON leads(organization_id);
    
    RAISE NOTICE '✅ leads updated';
  ELSE
    RAISE NOTICE '⏭️  leads table does not exist, skipping';
  END IF;
  
  -- ========================================
  -- BUSINESS PROFILES
  -- ========================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'business_profiles') THEN
    RAISE NOTICE '🏪 Adding organization_id to business_profiles...';
    
    ALTER TABLE business_profiles 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_business_profiles_organization ON business_profiles(organization_id);
    
    RAISE NOTICE '✅ business_profiles updated';
  ELSE
    RAISE NOTICE '⏭️  business_profiles table does not exist, skipping';
  END IF;
  
  -- ========================================
  -- CAMPAIGNS
  -- ========================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campaigns') THEN
    RAISE NOTICE '📢 Adding organization_id to campaigns...';
    
    ALTER TABLE campaigns 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_campaigns_organization ON campaigns(organization_id);
    
    RAISE NOTICE '✅ campaigns updated';
  ELSE
    RAISE NOTICE '⏭️  campaigns table does not exist, skipping';
  END IF;
  
  -- ========================================
  -- CAMPAIGN PROSPECTS
  -- ========================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campaign_prospects') THEN
    RAISE NOTICE '👥 Adding organization_id to campaign_prospects...';
    
    ALTER TABLE campaign_prospects 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_campaign_prospects_organization ON campaign_prospects(organization_id);
    
    RAISE NOTICE '✅ campaign_prospects updated';
  ELSE
    RAISE NOTICE '⏭️  campaign_prospects table does not exist, skipping';
  END IF;
  
  -- ========================================
  -- ICP DEFINITIONS
  -- ========================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'icp_definitions') THEN
    RAISE NOTICE '🎯 Adding organization_id to icp_definitions...';
    
    ALTER TABLE icp_definitions 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_icp_definitions_organization ON icp_definitions(organization_id);
    
    RAISE NOTICE '✅ icp_definitions updated';
  ELSE
    RAISE NOTICE '⏭️  icp_definitions table does not exist, skipping';
  END IF;
  
  -- ========================================
  -- ICP SEARCHES
  -- ========================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'icp_searches') THEN
    RAISE NOTICE '🔍 Adding organization_id to icp_searches...';
    
    ALTER TABLE icp_searches 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_icp_searches_organization ON icp_searches(organization_id);
    
    RAISE NOTICE '✅ icp_searches updated';
  ELSE
    RAISE NOTICE '⏭️  icp_searches table does not exist, skipping';
  END IF;
  
  -- ========================================
  -- SAVED SEARCHES
  -- ========================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saved_searches') THEN
    RAISE NOTICE '💾 Adding organization_id to saved_searches...';
    
    ALTER TABLE saved_searches 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_saved_searches_organization ON saved_searches(organization_id);
    
    RAISE NOTICE '✅ saved_searches updated';
  ELSE
    RAISE NOTICE '⏭️  saved_searches table does not exist, skipping';
  END IF;
  
  -- ========================================
  -- SUMMARY
  -- ========================================
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ STEP 2 COMPLETE!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Added organization_id to:';
  RAISE NOTICE '   - leads';
  RAISE NOTICE '   - business_profiles';
  RAISE NOTICE '   - campaigns';
  RAISE NOTICE '   - campaign_prospects';
  RAISE NOTICE '   - icp_definitions';
  RAISE NOTICE '   - icp_searches';
  RAISE NOTICE '   - saved_searches';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next: Run Step 3 (Helper Functions)';
  RAISE NOTICE '';
END $$;