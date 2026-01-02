-- ============================================
-- Migration 011: Fix ambiguous column reference in validate_apartment_credentials
-- The RETURNS TABLE column 'owner_name' was conflicting with v_apartment.owner_name
-- Fixed by using AS aliases in the RETURN QUERY SELECT
-- ============================================

-- Ensure pgcrypto extension is enabled (required for crypt function)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
  SELECT id, number, a.owner_name, pin_hash INTO v_apartment
  FROM apartments a
  WHERE a.number = p_apartment_number;

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
  -- Use explicit AS aliases to avoid ambiguity with RETURNS TABLE column names
  RETURN QUERY SELECT
    v_apartment.id AS apartment_id,
    v_apartment.number AS apartment_number,
    v_apartment.owner_name AS owner_name;
END;
$$;

-- Ensure permissions are maintained
GRANT EXECUTE ON FUNCTION validate_apartment_credentials TO anon, authenticated;
