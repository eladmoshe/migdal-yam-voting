-- Migration 014: Fix search_path to include extensions schema for pgcrypto

DROP FUNCTION IF EXISTS validate_apartment_credentials(text, text) CASCADE;

CREATE FUNCTION validate_apartment_credentials(
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
SET search_path = public, extensions  -- Include extensions schema for pgcrypto
AS $$
DECLARE
  v_apartment RECORD;
BEGIN
  SELECT a.id, a.number, a.owner_name, a.pin_hash INTO v_apartment
  FROM apartments a
  WHERE a.number = p_apartment_number;

  IF v_apartment IS NULL THEN
    PERFORM log_audit_event(
      'voter', p_apartment_number, NULL, NULL,
      'voter_login_failed', 'auth', NULL, FALSE,
      'Apartment not found',
      jsonb_build_object('apartment_number', p_apartment_number)
    );
    RETURN;
  END IF;

  IF v_apartment.pin_hash != crypt(p_pin, v_apartment.pin_hash) THEN
    PERFORM log_audit_event(
      'voter', p_apartment_number, NULL, v_apartment.owner_name,
      'voter_login_failed', 'auth', v_apartment.id, FALSE,
      'Invalid PIN',
      jsonb_build_object('apartment_number', p_apartment_number)
    );
    RETURN;
  END IF;

  PERFORM log_audit_event(
    'voter', p_apartment_number, NULL, v_apartment.owner_name,
    'voter_login_success', 'auth', v_apartment.id, TRUE, NULL,
    jsonb_build_object('apartment_number', p_apartment_number, 'owner_name', v_apartment.owner_name)
  );

  RETURN QUERY SELECT
    v_apartment.id AS apartment_id,
    v_apartment.number AS apartment_number,
    v_apartment.owner_name AS owner_name;
END;
$$;

GRANT EXECUTE ON FUNCTION validate_apartment_credentials(text, text) TO anon, authenticated;
