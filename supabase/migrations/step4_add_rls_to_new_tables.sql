-- ============================================================================
-- STEP 4: Enable RLS on New Tables
-- ============================================================================
-- Run this after Step 3 completes successfully
-- ============================================================================

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_accounts ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies (in case this is run multiple times)
DROP POLICY IF EXISTS org_isolation ON organizations;
DROP POLICY IF EXISTS user_profiles_isolation ON user_profiles;
DROP POLICY IF EXISTS memberships_isolation ON memberships;
DROP POLICY IF EXISTS wallets_isolation ON organization_wallets;
DROP POLICY IF EXISTS credit_ledger_isolation ON credit_ledger;
DROP POLICY IF EXISTS invitations_isolation ON invitations;
DROP POLICY IF EXISTS billing_isolation ON billing_accounts;

-- Organizations Policy
CREATE POLICY org_isolation ON organizations
  FOR ALL USING (
    id IN (
      SELECT organization_id 
      FROM memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- User Profiles Policy
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

-- Memberships Policy
CREATE POLICY memberships_isolation ON memberships
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Organization Wallets Policy
CREATE POLICY wallets_isolation ON organization_wallets
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Credit Ledger Policy
CREATE POLICY credit_ledger_isolation ON credit_ledger
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Invitations Policy
CREATE POLICY invitations_isolation ON invitations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Billing Accounts Policy
CREATE POLICY billing_isolation ON billing_accounts
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ STEP 4 COMPLETE: Enabled RLS on all new tables';
  RAISE NOTICE '   - Organizations can only see their own data';
  RAISE NOTICE '   - Users can only see teammates';
  RAISE NOTICE '   - All policies use auth.uid() for security';
END $$;
