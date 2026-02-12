-- ============================================================================
-- STEP 7: RLS policies for the invitations table
-- ============================================================================
-- Allows org admins to create invitations, anyone to read by token (for
-- the signup validation flow), and authenticated users to accept invitations.
-- ============================================================================

-- Allow org admins to insert invitations
DROP POLICY IF EXISTS invitations_insert ON invitations;
CREATE POLICY invitations_insert ON invitations
  FOR INSERT WITH CHECK (
    invited_by = auth.uid() AND
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Allow anyone to read invitations (needed for signup flow to validate token)
DROP POLICY IF EXISTS invitations_select ON invitations;
CREATE POLICY invitations_select ON invitations
  FOR SELECT USING (true);

-- Allow authenticated users to update invitation status (accept)
DROP POLICY IF EXISTS invitations_update ON invitations;
CREATE POLICY invitations_update ON invitations
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (status = 'accepted');

-- Allow org admins to delete/revoke invitations
DROP POLICY IF EXISTS invitations_delete ON invitations;
CREATE POLICY invitations_delete ON invitations
  FOR DELETE USING (
    invited_by = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'STEP 7 COMPLETE: Added RLS policies for invitations';
  RAISE NOTICE '   - INSERT: org admins can create invitations';
  RAISE NOTICE '   - SELECT: anyone can read (for token validation)';
  RAISE NOTICE '   - UPDATE: authenticated users can accept';
  RAISE NOTICE '   - DELETE: org admins can revoke';
END $$;
