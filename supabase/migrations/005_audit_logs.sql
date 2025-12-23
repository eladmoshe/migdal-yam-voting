-- ============================================
-- AUDIT LOGS TABLE
-- Immutable audit trail for all system actions
-- ============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Timestamp (immutable, set on insert)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Actor information
  actor_type TEXT NOT NULL CHECK (actor_type IN ('voter', 'admin', 'system')),
  actor_id TEXT,  -- apartment_number for voters, user_id for admins
  actor_email TEXT,  -- Only for admin actions
  actor_name TEXT,  -- Owner name for voters, null for admins

  -- Action details
  action TEXT NOT NULL,
  -- Possible actions:
  -- voter_login_success, voter_login_failed
  -- vote_cast, vote_duplicate_attempt
  -- admin_login_success, admin_login_failed
  -- admin_logout
  -- issue_created, issue_activated, issue_deactivated
  -- issue_details_viewed, votes_viewed

  -- Resource information
  resource_type TEXT NOT NULL CHECK (resource_type IN ('auth', 'vote', 'issue', 'apartment', 'system')),
  resource_id UUID,  -- ID of the affected resource (issue_id, vote_id, etc.)

  -- Result
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,

  -- Additional context (flexible JSON for action-specific data)
  details JSONB DEFAULT '{}'::jsonb
);

-- Prevent any modifications after insert (immutable audit trail)
-- No UPDATE or DELETE will be allowed

-- Create indexes for common query patterns
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_actor_type ON audit_logs(actor_type);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR AUDIT LOGS
-- Only admins can read, NO ONE can update/delete
-- Writes happen via SECURITY DEFINER functions only
-- ============================================

-- Admins can read all audit logs
CREATE POLICY "Admins can read audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (is_admin());

-- No direct insert policy - all inserts go through SECURITY DEFINER functions
-- No update policy - audit logs are immutable
-- No delete policy - audit logs are immutable

-- ============================================
-- INTERNAL LOGGING FUNCTION
-- Used by other functions to log events securely
-- ============================================
CREATE OR REPLACE FUNCTION log_audit_event(
  p_actor_type TEXT,
  p_actor_id TEXT,
  p_actor_email TEXT,
  p_actor_name TEXT,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_success BOOLEAN,
  p_error_message TEXT,
  p_details JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    actor_type,
    actor_id,
    actor_email,
    actor_name,
    action,
    resource_type,
    resource_id,
    success,
    error_message,
    details
  )
  VALUES (
    p_actor_type,
    p_actor_id,
    p_actor_email,
    p_actor_name,
    p_action,
    p_resource_type,
    p_resource_id,
    p_success,
    p_error_message,
    COALESCE(p_details, '{}'::jsonb)
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- NOTE: No GRANT here - this is an internal function only called by other
-- SECURITY DEFINER functions. It should not be directly callable by users.

-- ============================================
-- PUBLIC LOGGING FUNCTION FOR CLIENT-SIDE EVENTS
-- Used for events that happen on the client (admin login/logout)
-- ============================================
CREATE OR REPLACE FUNCTION log_client_event(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_success BOOLEAN,
  p_error_message TEXT,
  p_details JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  -- Get current user info if authenticated
  v_user_id := auth.uid();

  IF v_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = v_user_id;
  END IF;

  -- Log the event
  INSERT INTO audit_logs (
    actor_type,
    actor_id,
    actor_email,
    actor_name,
    action,
    resource_type,
    resource_id,
    success,
    error_message,
    details
  )
  VALUES (
    CASE WHEN v_user_id IS NOT NULL THEN 'admin' ELSE 'system' END,
    CASE WHEN v_user_id IS NOT NULL THEN v_user_id::TEXT ELSE NULL END,
    v_user_email,
    NULL,
    p_action,
    p_resource_type,
    p_resource_id,
    p_success,
    p_error_message,
    COALESCE(p_details, '{}'::jsonb)
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Grant execute to authenticated users (for admin actions)
GRANT EXECUTE ON FUNCTION log_client_event TO authenticated, anon;

-- ============================================
-- UPDATED: VALIDATE APARTMENT CREDENTIALS
-- Now logs login attempts
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
    -- Log failed login - apartment not found
    PERFORM log_audit_event(
      'voter',
      p_apartment_number,
      NULL,
      NULL,
      'voter_login_failed',
      'auth',
      NULL,
      FALSE,
      'Apartment not found',
      jsonb_build_object('apartment_number', p_apartment_number)
    );
    RETURN;  -- No apartment found
  END IF;

  -- Verify PIN using pgcrypto crypt function
  IF v_apartment.pin_hash != crypt(p_pin, v_apartment.pin_hash) THEN
    -- Log failed login - invalid PIN
    PERFORM log_audit_event(
      'voter',
      p_apartment_number,
      NULL,
      v_apartment.owner_name,
      'voter_login_failed',
      'auth',
      v_apartment.id,
      FALSE,
      'Invalid PIN',
      jsonb_build_object('apartment_number', p_apartment_number)
    );
    RETURN;  -- Invalid PIN
  END IF;

  -- Log successful login
  PERFORM log_audit_event(
    'voter',
    p_apartment_number,
    NULL,
    v_apartment.owner_name,
    'voter_login_success',
    'auth',
    v_apartment.id,
    TRUE,
    NULL,
    jsonb_build_object('apartment_number', p_apartment_number, 'owner_name', v_apartment.owner_name)
  );

  -- Return apartment info (without PIN hash)
  RETURN QUERY SELECT
    v_apartment.id,
    v_apartment.number,
    v_apartment.owner_name;
END;
$$;

-- ============================================
-- UPDATED: CAST VOTE
-- Now logs vote attempts
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
DECLARE
  v_apartment RECORD;
  v_issue RECORD;
  v_vote_id UUID;
BEGIN
  -- Validate vote value
  IF p_vote NOT IN ('yes', 'no') THEN
    PERFORM log_audit_event(
      'voter',
      p_apartment_id::TEXT,
      NULL,
      NULL,
      'vote_cast',
      'vote',
      p_issue_id,
      FALSE,
      'Invalid vote value',
      jsonb_build_object('vote', p_vote)
    );
    RAISE EXCEPTION 'Invalid vote value. Must be yes or no.';
  END IF;

  -- Get apartment info
  SELECT id, number, owner_name INTO v_apartment
  FROM apartments WHERE id = p_apartment_id;

  IF v_apartment IS NULL THEN
    PERFORM log_audit_event(
      'voter',
      p_apartment_id::TEXT,
      NULL,
      NULL,
      'vote_cast',
      'vote',
      p_issue_id,
      FALSE,
      'Apartment not found',
      NULL
    );
    RAISE EXCEPTION 'Apartment not found';
  END IF;

  -- Get issue info
  SELECT id, title, active INTO v_issue
  FROM voting_issues WHERE id = p_issue_id;

  -- Check if issue exists and is active
  IF v_issue IS NULL OR v_issue.active = FALSE THEN
    PERFORM log_audit_event(
      'voter',
      v_apartment.number,
      NULL,
      v_apartment.owner_name,
      'vote_cast',
      'vote',
      p_issue_id,
      FALSE,
      'Issue is not active or does not exist',
      jsonb_build_object('apartment_number', v_apartment.number, 'vote', p_vote)
    );
    RAISE EXCEPTION 'Issue is not active or does not exist';
  END IF;

  -- Insert vote (UNIQUE constraint prevents duplicates)
  INSERT INTO votes (issue_id, apartment_id, vote)
  VALUES (p_issue_id, p_apartment_id, p_vote)
  RETURNING id INTO v_vote_id;

  -- Log successful vote
  PERFORM log_audit_event(
    'voter',
    v_apartment.number,
    NULL,
    v_apartment.owner_name,
    'vote_cast',
    'vote',
    v_vote_id,
    TRUE,
    NULL,
    jsonb_build_object(
      'apartment_number', v_apartment.number,
      'owner_name', v_apartment.owner_name,
      'issue_id', p_issue_id,
      'issue_title', v_issue.title,
      'vote', p_vote
    )
  );

  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    -- Log duplicate vote attempt
    PERFORM log_audit_event(
      'voter',
      v_apartment.number,
      NULL,
      v_apartment.owner_name,
      'vote_duplicate_attempt',
      'vote',
      p_issue_id,
      FALSE,
      'Already voted on this issue',
      jsonb_build_object(
        'apartment_number', v_apartment.number,
        'issue_id', p_issue_id,
        'issue_title', v_issue.title
      )
    );
    RETURN FALSE;  -- Already voted
END;
$$;

-- ============================================
-- UPDATED: CREATE ISSUE
-- Now logs issue creation
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
  v_user_id UUID;
  v_user_email TEXT;
  v_deactivated_issues UUID[];
BEGIN
  v_user_id := auth.uid();

  -- Get user email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  -- If setting as active, deactivate all other issues first
  IF p_active THEN
    -- Get list of issues being deactivated
    SELECT ARRAY_AGG(id) INTO v_deactivated_issues
    FROM voting_issues
    WHERE active = TRUE;

    UPDATE voting_issues SET active = FALSE WHERE active = TRUE;
  END IF;

  INSERT INTO voting_issues (title, description, active, created_by)
  VALUES (p_title, p_description, p_active, v_user_id)
  RETURNING id INTO v_issue_id;

  -- Log issue creation
  PERFORM log_audit_event(
    'admin',
    v_user_id::TEXT,
    v_user_email,
    NULL,
    'issue_created',
    'issue',
    v_issue_id,
    TRUE,
    NULL,
    jsonb_build_object(
      'title', p_title,
      'description', p_description,
      'active', p_active,
      'deactivated_issues', v_deactivated_issues
    )
  );

  RETURN v_issue_id;
END;
$$;

-- ============================================
-- UPDATED: TOGGLE ISSUE ACTIVE STATUS
-- Now logs activation/deactivation
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
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_issue RECORD;
  v_deactivated_issues UUID[];
  v_vote_counts RECORD;
BEGIN
  v_user_id := auth.uid();

  -- Get user email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  -- Get current issue state
  SELECT id, title, active INTO v_issue
  FROM voting_issues
  WHERE id = p_issue_id;

  IF v_issue IS NULL THEN
    RETURN FALSE;
  END IF;

  -- If activating, deactivate all other issues first
  IF p_active THEN
    -- Get list of issues being deactivated
    SELECT ARRAY_AGG(id) INTO v_deactivated_issues
    FROM voting_issues
    WHERE active = TRUE AND id != p_issue_id;

    UPDATE voting_issues SET active = FALSE WHERE active = TRUE;
  END IF;

  -- Get vote counts for logging (useful when deactivating)
  SELECT
    COUNT(*) FILTER (WHERE vote = 'yes') as yes_count,
    COUNT(*) FILTER (WHERE vote = 'no') as no_count,
    COUNT(*) as total_count
  INTO v_vote_counts
  FROM votes
  WHERE issue_id = p_issue_id;

  UPDATE voting_issues
  SET
    active = p_active,
    closed_at = CASE WHEN p_active = FALSE THEN NOW() ELSE NULL END
  WHERE id = p_issue_id;

  -- Log the action
  PERFORM log_audit_event(
    'admin',
    v_user_id::TEXT,
    v_user_email,
    NULL,
    CASE WHEN p_active THEN 'issue_activated' ELSE 'issue_deactivated' END,
    'issue',
    p_issue_id,
    TRUE,
    NULL,
    jsonb_build_object(
      'title', v_issue.title,
      'previous_active', v_issue.active,
      'new_active', p_active,
      'deactivated_issues', v_deactivated_issues,
      'vote_counts', jsonb_build_object(
        'yes', v_vote_counts.yes_count,
        'no', v_vote_counts.no_count,
        'total', v_vote_counts.total_count
      )
    )
  );

  RETURN TRUE;
END;
$$;

-- ============================================
-- ADMIN: GET AUDIT LOGS (with pagination)
-- ============================================
CREATE OR REPLACE FUNCTION get_audit_logs(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_action_filter TEXT DEFAULT NULL,
  p_actor_type_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  actor_type TEXT,
  actor_id TEXT,
  actor_email TEXT,
  actor_name TEXT,
  action TEXT,
  resource_type TEXT,
  resource_id UUID,
  success BOOLEAN,
  error_message TEXT,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    al.id,
    al.created_at,
    al.actor_type,
    al.actor_id,
    al.actor_email,
    al.actor_name,
    al.action,
    al.resource_type,
    al.resource_id,
    al.success,
    al.error_message,
    al.details
  FROM audit_logs al
  WHERE
    (p_action_filter IS NULL OR al.action = p_action_filter)
    AND (p_actor_type_filter IS NULL OR al.actor_type = p_actor_type_filter)
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Only authenticated users (admins)
GRANT EXECUTE ON FUNCTION get_audit_logs TO authenticated;

-- ============================================
-- ADMIN: GET AUDIT LOG COUNTS BY ACTION
-- For dashboard statistics
-- ============================================
CREATE OR REPLACE FUNCTION get_audit_log_stats()
RETURNS TABLE (
  action TEXT,
  count BIGINT,
  last_occurrence TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    al.action,
    COUNT(*) as count,
    MAX(al.created_at) as last_occurrence
  FROM audit_logs al
  GROUP BY al.action
  ORDER BY count DESC;
END;
$$;

-- Only authenticated users (admins)
GRANT EXECUTE ON FUNCTION get_audit_log_stats TO authenticated;
