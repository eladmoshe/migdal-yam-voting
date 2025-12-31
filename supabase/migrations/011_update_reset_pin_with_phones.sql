-- ============================================
-- UPDATE RESET APARTMENT PIN FUNCTION TO RETURN PHONE NUMBERS
-- Updated to support phone numbers for WhatsApp PIN sharing
-- ============================================

CREATE OR REPLACE FUNCTION reset_apartment_pin(
  p_apartment_number TEXT
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
  v_owner_name TEXT;
  v_phone_number_1 TEXT;
  v_owner_name_1 TEXT;
  v_phone_number_2 TEXT;
  v_owner_name_2 TEXT;
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
      'pin_reset',
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
      'pin_reset',
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
      'pin_reset',
      'apartment',
      NULL,
      FALSE,
      'Invalid apartment number',
      jsonb_build_object('apartment_number', p_apartment_number)
    );
    RAISE EXCEPTION 'Apartment number is required';
  END IF;

  -- Check if apartment exists and get its details INCLUDING PHONE NUMBERS
  SELECT id, owner_name, phone_number_1, owner_name_1, phone_number_2, owner_name_2
  INTO v_apartment_id, v_owner_name, v_phone_number_1, v_owner_name_1, v_phone_number_2, v_owner_name_2
  FROM apartments
  WHERE number = p_apartment_number;

  IF v_apartment_id IS NULL THEN
    PERFORM log_audit_event(
      'admin',
      v_user_id::TEXT,
      v_user_email,
      NULL,
      'pin_reset',
      'apartment',
      NULL,
      FALSE,
      'Apartment not found',
      jsonb_build_object('apartment_number', p_apartment_number)
    );
    RAISE EXCEPTION 'Apartment not found: %', p_apartment_number;
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

  -- Update the apartment's PIN hash
  UPDATE apartments
  SET pin_hash = v_pin_hash
  WHERE id = v_apartment_id;

  -- Log successful PIN reset (without plaintext PIN, but with whether phone numbers exist)
  PERFORM log_audit_event(
    'admin',
    v_user_id::TEXT,
    v_user_email,
    NULL,
    'pin_reset',
    'apartment',
    v_apartment_id,
    TRUE,
    NULL,
    jsonb_build_object(
      'apartment_number', p_apartment_number,
      'owner_name', v_owner_name,
      'has_phone_1', v_phone_number_1 IS NOT NULL,
      'has_phone_2', v_phone_number_2 IS NOT NULL
    )
  );

  -- Return apartment info with phone numbers and plaintext PIN (ONE TIME ONLY)
  -- This is the ONLY time the plaintext PIN is ever exposed
  RETURN jsonb_build_object(
    'apartment_id', v_apartment_id,
    'apartment_number', p_apartment_number,
    'owner_name', v_owner_name,
    'phone_number_1', v_phone_number_1,
    'owner_name_1', v_owner_name_1,
    'phone_number_2', v_phone_number_2,
    'owner_name_2', v_owner_name_2,
    'pin', v_plaintext_pin
  );
END;
$$;

-- Keep existing permissions
GRANT EXECUTE ON FUNCTION reset_apartment_pin(TEXT) TO authenticated;
