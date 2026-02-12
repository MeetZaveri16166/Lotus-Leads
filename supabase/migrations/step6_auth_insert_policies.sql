-- ============================================================================
-- STEP 6: Add INSERT-specific RLS policies for signup flow
-- ============================================================================
-- The existing policies use FOR ALL USING(...) which checks memberships.
-- A newly signed-up user has no membership yet, so they can't INSERT their
-- profile, org, or membership. These policies fix that.
-- ============================================================================

-- Allow users to insert their own profile (id must match auth.uid())
DROP POLICY IF EXISTS user_profiles_insert ON user_profiles;
CREATE POLICY user_profiles_insert ON user_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Allow any authenticated user to create an organization
DROP POLICY IF EXISTS org_insert ON organizations;
CREATE POLICY org_insert ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to create their own membership (user_id must match auth.uid())
DROP POLICY IF EXISTS memberships_insert ON memberships;
CREATE POLICY memberships_insert ON memberships
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'STEP 6 COMPLETE: Added INSERT policies for signup flow';
  RAISE NOTICE '   - user_profiles: INSERT allowed when id = auth.uid()';
  RAISE NOTICE '   - organizations: INSERT allowed for authenticated users';
  RAISE NOTICE '   - memberships: INSERT allowed when user_id = auth.uid()';
END $$;
