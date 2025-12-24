-- ============================================
-- APARTMENT MANAGEMENT FUNCTIONS
-- Admin functions for updating and deleting apartments
-- ============================================

-- ============================================
-- UPDATE APARTMENT OWNER NAME
-- ============================================
CREATE OR REPLACE FUNCTION update_apartment_owner(
  p_apartment_id UUID,
  p_new_owner_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_apartment_number TEXT;
  v_old_owner_name TEXT;
BEGIN
  -- Get current user (must be admin)
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    PERFORM log_audit_event(
      'system',
      NULL,
      NULL,
      NULL,
      'apartment_update',
      'apartment',
      p_apartment_id,
      FALSE,
      'Unauthenticated request',
      jsonb_build_object('apartment_id', p_apartment_id)
    );
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Verify user is admin
  IF NOT is_admin() THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

    PERFORM log_audit_event(
      'admin',
      v_user_id::TEXT,
      v_user_email,
      NULL,
      'apartment_update',
      'apartment',
      p_apartment_id,
      FALSE,
      'Insufficient permissions',
      jsonb_build_object('apartment_id', p_apartment_id)
    );
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  -- Get admin email
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  -- Validate new owner name
  IF p_new_owner_name IS NULL OR LENGTH(TRIM(p_new_owner_name)) = 0 THEN
    PERFORM log_audit_event(
      'admin',
      v_user_id::TEXT,
      v_user_email,
      NULL,
      'apartment_update',
      'apartment',
      p_apartment_id,
      FALSE,
      'Invalid owner name',
      jsonb_build_object('apartment_id', p_apartment_id)
    );
    RAISE EXCEPTION 'Owner name is required';
  END IF;

  -- Get apartment details before update
  SELECT number, owner_name
  INTO v_apartment_number, v_old_owner_name
  FROM apartments
  WHERE id = p_apartment_id;

  IF v_apartment_number IS NULL THEN
    PERFORM log_audit_event(
      'admin',
      v_user_id::TEXT,
      v_user_email,
      NULL,
      'apartment_update',
      'apartment',
      p_apartment_id,
      FALSE,
      'Apartment not found',
      jsonb_build_object('apartment_id', p_apartment_id)
    );
    RAISE EXCEPTION 'Apartment not found';
  END IF;

  -- Update the apartment owner name
  UPDATE apartments
  SET
    owner_name = TRIM(p_new_owner_name),
    updated_at = NOW()
  WHERE id = p_apartment_id;

  -- Log successful update
  PERFORM log_audit_event(
    'admin',
    v_user_id::TEXT,
    v_user_email,
    NULL,
    'apartment_update',
    'apartment',
    p_apartment_id,
    TRUE,
    NULL,
    jsonb_build_object(
      'apartment_number', v_apartment_number,
      'old_owner_name', v_old_owner_name,
      'new_owner_name', TRIM(p_new_owner_name)
    )
  );

  -- Return updated apartment info
  RETURN jsonb_build_object(
    'apartment_id', p_apartment_id,
    'apartment_number', v_apartment_number,
    'owner_name', TRIM(p_new_owner_name)
  );
END;
$$;

-- Grant execute to authenticated users (admins)
GRANT EXECUTE ON FUNCTION update_apartment_owner TO authenticated;

-- ============================================
-- DELETE APARTMENT
-- ============================================
CREATE OR REPLACE FUNCTION delete_apartment(
  p_apartment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_apartment_number TEXT;
  v_owner_name TEXT;
  v_vote_count INTEGER;
BEGIN
  -- Get current user (must be admin)
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    PERFORM log_audit_event(
      'system',
      NULL,
      NULL,
      NULL,
      'apartment_delete',
      'apartment',
      p_apartment_id,
      FALSE,
      'Unauthenticated request',
      jsonb_build_object('apartment_id', p_apartment_id)
    );
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Verify user is admin
  IF NOT is_admin() THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

    PERFORM log_audit_event(
      'admin',
      v_user_id::TEXT,
      v_user_email,
      NULL,
      'apartment_delete',
      'apartment',
      p_apartment_id,
      FALSE,
      'Insufficient permissions',
      jsonb_build_object('apartment_id', p_apartment_id)
    );
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  -- Get admin email
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  -- Get apartment details before deletion
  SELECT number, owner_name
  INTO v_apartment_number, v_owner_name
  FROM apartments
  WHERE id = p_apartment_id;

  IF v_apartment_number IS NULL THEN
    PERFORM log_audit_event(
      'admin',
      v_user_id::TEXT,
      v_user_email,
      NULL,
      'apartment_delete',
      'apartment',
      p_apartment_id,
      FALSE,
      'Apartment not found',
      jsonb_build_object('apartment_id', p_apartment_id)
    );
    RAISE EXCEPTION 'Apartment not found';
  END IF;

  -- Count existing votes from this apartment
  SELECT COUNT(*)::INTEGER
  INTO v_vote_count
  FROM votes
  WHERE apartment_id = p_apartment_id;

  -- Delete associated votes first (cascade)
  DELETE FROM votes WHERE apartment_id = p_apartment_id;

  -- Delete the apartment
  DELETE FROM apartments WHERE id = p_apartment_id;

  -- Log successful deletion
  PERFORM log_audit_event(
    'admin',
    v_user_id::TEXT,
    v_user_email,
    NULL,
    'apartment_delete',
    'apartment',
    p_apartment_id,
    TRUE,
    NULL,
    jsonb_build_object(
      'apartment_number', v_apartment_number,
      'owner_name', v_owner_name,
      'deleted_votes_count', v_vote_count
    )
  );

  -- Return deleted apartment info
  RETURN jsonb_build_object(
    'apartment_id', p_apartment_id,
    'apartment_number', v_apartment_number,
    'owner_name', v_owner_name,
    'deleted_votes_count', v_vote_count
  );
END;
$$;

-- Grant execute to authenticated users (admins)
GRANT EXECUTE ON FUNCTION delete_apartment TO authenticated;
