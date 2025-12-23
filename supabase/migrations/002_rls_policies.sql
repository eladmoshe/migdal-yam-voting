-- Enable Row Level Security on all tables
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_roles WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- APARTMENTS POLICIES
-- ============================================
-- No direct read access to apartments (prevents PIN hash exposure)
-- Only admins can read/write apartments

CREATE POLICY "Admins can read apartments"
  ON apartments FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert apartments"
  ON apartments FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update apartments"
  ON apartments FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete apartments"
  ON apartments FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================
-- VOTING ISSUES POLICIES
-- ============================================
-- Anyone can read active issues (for voting)
CREATE POLICY "Anyone can read active issues"
  ON voting_issues FOR SELECT
  TO anon, authenticated
  USING (active = TRUE);

-- Admins can read all issues (including inactive)
CREATE POLICY "Admins can read all issues"
  ON voting_issues FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can create issues
CREATE POLICY "Admins can create issues"
  ON voting_issues FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Admins can update issues
CREATE POLICY "Admins can update issues"
  ON voting_issues FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins can delete issues
CREATE POLICY "Admins can delete issues"
  ON voting_issues FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================
-- VOTES POLICIES
-- ============================================
-- Votes are inserted via RPC function, not directly
-- Admins can read all votes
CREATE POLICY "Admins can read votes"
  ON votes FOR SELECT
  TO authenticated
  USING (is_admin());

-- No direct insert/update/delete for votes (must use RPC functions)

-- ============================================
-- ADMIN ROLES POLICIES
-- ============================================
-- Only super_admins can manage admin_roles
CREATE POLICY "Super admins can read admin roles"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage admin roles"
  ON admin_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );
