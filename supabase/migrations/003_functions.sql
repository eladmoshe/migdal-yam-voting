-- ============================================
-- VALIDATE APARTMENT CREDENTIALS
-- Server-side PIN validation (never exposes hash to client)
-- ============================================
CREATE OR REPLACE FUNCTION validate_apartment_credentials(
  p_apartment_number TEXT,
  p_pin TEXT
)
RETURNS TABLE (
  apartment_id UUID,
  apartment_number TEXT,
  owner_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_apartment RECORD;
BEGIN
  -- Find apartment and verify PIN hash
  SELECT id, number, owner_name, pin_hash INTO v_apartment
  FROM apartments
  WHERE number = p_apartment_number;

  IF v_apartment IS NULL THEN
    RETURN;  -- No apartment found
  END IF;

  -- Verify PIN using pgcrypto crypt function
  IF v_apartment.pin_hash != crypt(p_pin, v_apartment.pin_hash) THEN
    RETURN;  -- Invalid PIN
  END IF;

  -- Return apartment info (without PIN hash)
  RETURN QUERY SELECT
    v_apartment.id,
    v_apartment.number,
    v_apartment.owner_name;
END;
$$;

-- Grant execute to anon for login
GRANT EXECUTE ON FUNCTION validate_apartment_credentials TO anon;

-- ============================================
-- CAST VOTE
-- Secure vote submission with validation
-- ============================================
CREATE OR REPLACE FUNCTION cast_vote(
  p_apartment_id UUID,
  p_issue_id UUID,
  p_vote TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate vote value
  IF p_vote NOT IN ('yes', 'no') THEN
    RAISE EXCEPTION 'Invalid vote value. Must be yes or no.';
  END IF;

  -- Check if apartment exists
  IF NOT EXISTS (SELECT 1 FROM apartments WHERE id = p_apartment_id) THEN
    RAISE EXCEPTION 'Apartment not found';
  END IF;

  -- Check if issue exists and is active
  IF NOT EXISTS (SELECT 1 FROM voting_issues WHERE id = p_issue_id AND active = TRUE) THEN
    RAISE EXCEPTION 'Issue is not active or does not exist';
  END IF;

  -- Insert vote (UNIQUE constraint prevents duplicates)
  INSERT INTO votes (issue_id, apartment_id, vote)
  VALUES (p_issue_id, p_apartment_id, p_vote);

  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    RETURN FALSE;  -- Already voted
END;
$$;

-- Grant execute to anon for voting
GRANT EXECUTE ON FUNCTION cast_vote TO anon;

-- ============================================
-- CHECK IF APARTMENT HAS VOTED
-- ============================================
CREATE OR REPLACE FUNCTION check_apartment_voted(
  p_apartment_id UUID,
  p_issue_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM votes
    WHERE apartment_id = p_apartment_id AND issue_id = p_issue_id
  );
END;
$$;

-- Grant execute to anon
GRANT EXECUTE ON FUNCTION check_apartment_voted TO anon;

-- ============================================
-- GET VOTE RESULTS (PUBLIC AGGREGATES)
-- ============================================
CREATE OR REPLACE FUNCTION get_vote_results(p_issue_id UUID)
RETURNS TABLE (
  yes_count BIGINT,
  no_count BIGINT,
  total_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*) FILTER (WHERE vote = 'yes') as yes_count,
    COUNT(*) FILTER (WHERE vote = 'no') as no_count,
    COUNT(*) as total_count
  FROM votes
  WHERE issue_id = p_issue_id;
$$;

-- Grant execute to anon for viewing results
GRANT EXECUTE ON FUNCTION get_vote_results TO anon;

-- ============================================
-- GET ACTIVE ISSUE
-- ============================================
CREATE OR REPLACE FUNCTION get_active_issue()
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, title, description, created_at
  FROM voting_issues
  WHERE active = TRUE
  LIMIT 1;
$$;

-- Grant execute to anon
GRANT EXECUTE ON FUNCTION get_active_issue TO anon;

-- ============================================
-- ADMIN: GET ALL ISSUES WITH VOTE COUNTS
-- ============================================
CREATE OR REPLACE FUNCTION get_all_issues_with_counts()
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  active BOOLEAN,
  created_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  yes_count BIGINT,
  no_count BIGINT,
  total_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    vi.id,
    vi.title,
    vi.description,
    vi.active,
    vi.created_at,
    vi.closed_at,
    COUNT(*) FILTER (WHERE v.vote = 'yes') as yes_count,
    COUNT(*) FILTER (WHERE v.vote = 'no') as no_count,
    COUNT(v.id) as total_count
  FROM voting_issues vi
  LEFT JOIN votes v ON vi.id = v.issue_id
  GROUP BY vi.id
  ORDER BY vi.created_at DESC;
$$;

-- Only authenticated users (admins check in RLS)
GRANT EXECUTE ON FUNCTION get_all_issues_with_counts TO authenticated;

-- ============================================
-- ADMIN: GET VOTES BY ISSUE WITH APARTMENT INFO
-- ============================================
CREATE OR REPLACE FUNCTION get_votes_by_issue(p_issue_id UUID)
RETURNS TABLE (
  vote_id UUID,
  apartment_number TEXT,
  owner_name TEXT,
  vote TEXT,
  voted_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    v.id as vote_id,
    a.number as apartment_number,
    a.owner_name,
    v.vote,
    v.created_at as voted_at
  FROM votes v
  JOIN apartments a ON v.apartment_id = a.id
  WHERE v.issue_id = p_issue_id
  ORDER BY v.created_at DESC;
$$;

-- Only authenticated users (admins)
GRANT EXECUTE ON FUNCTION get_votes_by_issue TO authenticated;

-- ============================================
-- ADMIN: CREATE NEW ISSUE
-- ============================================
CREATE OR REPLACE FUNCTION create_issue(
  p_title TEXT,
  p_description TEXT,
  p_active BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_issue_id UUID;
BEGIN
  -- If setting as active, deactivate all other issues first
  IF p_active THEN
    UPDATE voting_issues SET active = FALSE WHERE active = TRUE;
  END IF;

  INSERT INTO voting_issues (title, description, active, created_by)
  VALUES (p_title, p_description, p_active, auth.uid())
  RETURNING id INTO v_issue_id;

  RETURN v_issue_id;
END;
$$;

-- Only authenticated users (admins)
GRANT EXECUTE ON FUNCTION create_issue TO authenticated;

-- ============================================
-- ADMIN: TOGGLE ISSUE ACTIVE STATUS
-- ============================================
CREATE OR REPLACE FUNCTION toggle_issue_active(
  p_issue_id UUID,
  p_active BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If activating, deactivate all other issues first
  IF p_active THEN
    UPDATE voting_issues SET active = FALSE WHERE active = TRUE;
  END IF;

  UPDATE voting_issues
  SET
    active = p_active,
    closed_at = CASE WHEN p_active = FALSE THEN NOW() ELSE NULL END
  WHERE id = p_issue_id;

  RETURN TRUE;
END;
$$;

-- Only authenticated users (admins)
GRANT EXECUTE ON FUNCTION toggle_issue_active TO authenticated;
