-- ─────────────────────────────────────────────────────────────
-- WTDG Migration: Trending & View Tracking
-- Run in Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────

-- ── 1. PAGE VIEWS TABLE ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS page_views (
  id         bigserial PRIMARY KEY,
  item_id    text        NOT NULL,   -- business/event/stay id
  item_type  text        NOT NULL,   -- 'business' | 'event' | 'stay'
  viewed_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for fast time-windowed aggregation
CREATE INDEX IF NOT EXISTS idx_page_views_type_time
  ON page_views (item_type, viewed_at DESC);

-- Index for per-item lookups
CREATE INDEX IF NOT EXISTS idx_page_views_item
  ON page_views (item_id, item_type);

-- ── 2. ROW LEVEL SECURITY ─────────────────────────────────────
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Drop policies first so re-running the script is safe
DROP POLICY IF EXISTS "public_can_insert_views"   ON page_views;
DROP POLICY IF EXISTS "admin_can_read_views"       ON page_views;
DROP POLICY IF EXISTS "service_role_full_access"   ON page_views;

-- Anyone can insert a view (anonymous tracking)
CREATE POLICY "public_can_insert_views"
  ON page_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated (admin) can read
CREATE POLICY "admin_can_read_views"
  ON page_views FOR SELECT
  TO authenticated
  USING (true);

-- Service role can do anything (for cleanup jobs)
CREATE POLICY "service_role_full_access"
  ON page_views FOR ALL
  TO service_role
  USING (true);

-- ── 3. TRENDING SCORES VIEW ───────────────────────────────────
-- Pre-aggregates view counts by time window — query this on homepage load
CREATE OR REPLACE VIEW trending_scores AS
  SELECT
    item_id,
    item_type,
    COUNT(*) FILTER (WHERE viewed_at > now() - interval '1 day')   AS views_24h,
    COUNT(*) FILTER (WHERE viewed_at > now() - interval '7 days')  AS views_7d,
    COUNT(*) FILTER (WHERE viewed_at > now() - interval '30 days') AS views_30d,
    COUNT(*)                                                         AS views_all
  FROM page_views
  GROUP BY item_id, item_type;

-- ── 4. SITE SETTINGS: homepage sort & trending period ─────────
-- Insert defaults if not already present
INSERT INTO site_settings (key, value)
VALUES
  ('homepage_sort',     '"latest"'),
  ('trending_period',   '"7d"')
ON CONFLICT (key) DO NOTHING;

-- ── 5. AUTO-CLEANUP FUNCTION (keeps table from growing forever) 
-- Prunes views older than 90 days — run via cron or scheduled edge function
CREATE OR REPLACE FUNCTION prune_old_page_views()
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  deleted integer;
BEGIN
  DELETE FROM page_views WHERE viewed_at < now() - interval '90 days';
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$$;

-- ── VERIFY ────────────────────────────────────────────────────
SELECT 
  'page_views table' AS check_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'page_views' AND table_schema = 'public'
  ) AS ok
UNION ALL
SELECT 
  'trending_scores view',
  EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_name = 'trending_scores' AND table_schema = 'public'
  )
UNION ALL
SELECT 
  'homepage_sort setting',
  EXISTS (SELECT 1 FROM site_settings WHERE key = 'homepage_sort')
UNION ALL
SELECT 
  'trending_period setting',
  EXISTS (SELECT 1 FROM site_settings WHERE key = 'trending_period');
