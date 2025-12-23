-- Seed data for apartments
-- PINs are hashed using pgcrypto's crypt function with bf (blowfish) algorithm

-- Note: In production, use unique PINs for each apartment
-- These are example PINs for testing

INSERT INTO apartments (number, pin_hash, owner_name) VALUES
  ('1', crypt('12345', gen_salt('bf')), 'משפחת כהן'),
  ('2', crypt('23456', gen_salt('bf')), 'משפחת לוי'),
  ('3', crypt('34567', gen_salt('bf')), 'משפחת ישראלי'),
  ('4', crypt('45678', gen_salt('bf')), 'משפחת אברהם'),
  ('5', crypt('56789', gen_salt('bf')), 'משפחת דוד'),
  ('6', crypt('67890', gen_salt('bf')), 'משפחת משה'),
  ('7', crypt('78901', gen_salt('bf')), 'משפחת יעקב'),
  ('8', crypt('89012', gen_salt('bf')), 'משפחת שרה')
ON CONFLICT (number) DO NOTHING;

-- Create a sample voting issue (inactive by default)
INSERT INTO voting_issues (title, description, active) VALUES
  ('שיפוץ חדר המדרגות', 'האם לאשר שיפוץ חדר המדרגות בעלות של 50,000 ש"ח?', TRUE)
ON CONFLICT DO NOTHING;
