-- Health checks table to track keep-alive pings
-- This table stores heartbeat records from the keep-alive system
CREATE TABLE health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'github-actions',
  apartments_count INTEGER,
  issues_count INTEGER,
  votes_count INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying recent health checks
CREATE INDEX idx_health_checks_checked_at ON health_checks(checked_at DESC);

-- Auto-cleanup function to keep only the last 30 health check records
-- This prevents the table from growing indefinitely
CREATE OR REPLACE FUNCTION cleanup_old_health_checks()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all but the most recent 30 records
  DELETE FROM health_checks
  WHERE id NOT IN (
    SELECT id
    FROM health_checks
    ORDER BY checked_at DESC
    LIMIT 30
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run cleanup after each insert
CREATE TRIGGER trigger_cleanup_health_checks
  AFTER INSERT ON health_checks
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_old_health_checks();

-- Enable RLS for security (but allow anon inserts for keep-alive)
ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for the keep-alive function
CREATE POLICY "Allow anonymous inserts for health checks"
  ON health_checks FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated reads (for admin dashboard monitoring)
CREATE POLICY "Allow authenticated reads for health checks"
  ON health_checks FOR SELECT
  TO authenticated
  USING (true);

