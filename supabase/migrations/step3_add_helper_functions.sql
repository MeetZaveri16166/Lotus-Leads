-- ============================================================================
-- STEP 3: Create Helper Functions & Triggers
-- ============================================================================
-- Run this after Step 1 completes successfully
-- ============================================================================

-- Function: Get organization credit balance
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

-- Function: Get user's monthly usage
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

-- Auto-update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS organizations_updated_at ON organizations;
DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS memberships_updated_at ON memberships;
DROP TRIGGER IF EXISTS organization_wallets_updated_at ON organization_wallets;
DROP TRIGGER IF EXISTS billing_accounts_updated_at ON billing_accounts;

-- Create triggers
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

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ STEP 3 COMPLETE: Created helper functions and triggers';
  RAISE NOTICE '   - get_org_credit_balance()';
  RAISE NOTICE '   - get_user_monthly_usage()';
  RAISE NOTICE '   - can_user_perform_operation()';
  RAISE NOTICE '   - update_updated_at_column() + 5 triggers';
END $$;
