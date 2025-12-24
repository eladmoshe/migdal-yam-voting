-- ============================================
-- CREATE APARTMENT FUNCTION
-- Admin function to create new apartments with secure PIN generation
-- ============================================
CREATE OR REPLACE FUNCTION create_apartment(
  p_apartment_number TEXT,
  p_owner_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_apartment_id UUID;
  v_user_id UUID;
  v_user_email TEXT;
  v_plaintext_pin TEXT;
  v_pin_hash TEXT;
  v_random_int BIGINT;
BEGIN
  -- Get current user (must be admin)
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    PERFORM log_audit_event(
      'system',
      NULL,
      NULL,
      NULL,
      'apartment_created',
      'apartment',
      NULL,
      FALSE,
      'Unauthenticated request',
      jsonb_build_object('apartment_number', p_apartment_number)
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
      'apartment_created',
      'apartment',
      NULL,
      FALSE,
      'Insufficient permissions',
      jsonb_build_object('apartment_number', p_apartment_number)
    );
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  -- Get admin email
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  -- Validate apartment number
  IF p_apartment_number IS NULL OR LENGTH(TRIM(p_apartment_number)) = 0 THEN
    PERFORM log_audit_event(
      'admin',
      v_user_id::TEXT,
      v_user_email,
      NULL,
      'apartment_created',
      'apartment',
      NULL,
      FALSE,
      'Invalid apartment number',
      jsonb_build_object('apartment_number', p_apartment_number)
    );
    RAISE EXCEPTION 'Apartment number is required';
  END IF;

  -- Validate owner name
  IF p_owner_name IS NULL OR LENGTH(TRIM(p_owner_name)) = 0 THEN
    PERFORM log_audit_event(
      'admin',
      v_user_id::TEXT,
      v_user_email,
      NULL,
      'apartment_created',
      'apartment',
      NULL,
      FALSE,
      'Invalid owner name',
      jsonb_build_object('apartment_number', p_apartment_number)
    );
    RAISE EXCEPTION 'Owner name is required';
  END IF;

  -- Check for duplicate apartment number
  IF EXISTS (SELECT 1 FROM apartments WHERE number = p_apartment_number) THEN
    PERFORM log_audit_event(
      'admin',
      v_user_id::TEXT,
      v_user_email,
      NULL,
      'apartment_created',
      'apartment',
      NULL,
      FALSE,
      'Apartment number already exists',
      jsonb_build_object('apartment_number', p_apartment_number)
    );
    RAISE EXCEPTION 'Apartment number already exists';
  END IF;

  -- Generate cryptographically secure 6-digit PIN
  -- Using gen_random_bytes with rejection sampling to eliminate modulo bias
  -- This ensures uniform distribution across all possible PINs (000000-999999)
  LOOP
    v_random_int := (ABS(('x' || ENCODE(gen_random_bytes(4), 'hex'))::bit(32)::bigint));
    -- Reject values >= 4290000000 (largest multiple of 1000000 that fits in 32 bits)
    -- This eliminates modulo bias entirely
    EXIT WHEN v_random_int < 4290000000;
  END LOOP;
  v_plaintext_pin := LPAD((v_random_int % 1000000)::TEXT, 6, '0');

  -- Hash the PIN using bcrypt (cost factor 10)
  v_pin_hash := crypt(v_plaintext_pin, gen_salt('bf', 10));

  -- Insert the apartment
  INSERT INTO apartments (number, owner_name, pin_hash)
  VALUES (p_apartment_number, p_owner_name, v_pin_hash)
  RETURNING id INTO v_apartment_id;

  -- Log successful apartment creation (without plaintext PIN)
  PERFORM log_audit_event(
    'admin',
    v_user_id::TEXT,
    v_user_email,
    NULL,
    'apartment_created',
    'apartment',
    v_apartment_id,
    TRUE,
    NULL,
    jsonb_build_object(
      'apartment_number', p_apartment_number,
      'owner_name', p_owner_name
    )
  );

  -- Return apartment_id and plaintext PIN (ONE TIME ONLY)
  -- This is the ONLY time the plaintext PIN is ever exposed
  RETURN jsonb_build_object(
    'apartment_id', v_apartment_id,
    'apartment_number', p_apartment_number,
    'owner_name', p_owner_name,
    'pin', v_plaintext_pin
  );
END;
$$;

-- Only authenticated users (admins)
GRANT EXECUTE ON FUNCTION create_apartment TO authenticated;
