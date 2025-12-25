-- Add phone number and owner name columns to apartments table
ALTER TABLE apartments
ADD COLUMN phone_number_1 TEXT,
ADD COLUMN owner_name_1 TEXT,
ADD COLUMN phone_number_2 TEXT,
ADD COLUMN owner_name_2 TEXT;

-- Add comments for documentation
COMMENT ON COLUMN apartments.phone_number_1 IS 'Primary phone number for WhatsApp PIN sharing';
COMMENT ON COLUMN apartments.owner_name_1 IS 'Owner name associated with primary phone number';
COMMENT ON COLUMN apartments.phone_number_2 IS 'Secondary phone number for WhatsApp PIN sharing';
COMMENT ON COLUMN apartments.owner_name_2 IS 'Owner name associated with secondary phone number';
