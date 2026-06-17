-- Page cache table — stores edge-enhanced HTML for SEO
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS page_cache (
  url        TEXT PRIMARY KEY,          -- e.g. "whattodoballarat.com.au/the-phoenix"
  html       TEXT NOT NULL,             -- full enhanced HTML
  city       TEXT,                      -- city slug for bulk-flush by city
  cached_at  TIMESTAMPTZ DEFAULT NOW()  -- used for TTL check in middleware
);

-- Allow anon read (middleware uses anon key to check cache)
ALTER TABLE page_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_cache"   ON page_cache FOR SELECT USING (true);
CREATE POLICY "anon_insert_cache" ON page_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_cache" ON page_cache FOR UPDATE USING (true);
CREATE POLICY "anon_delete_cache" ON page_cache FOR DELETE USING (true);

-- Index for fast city-level flush
CREATE INDEX IF NOT EXISTS idx_page_cache_city ON page_cache (city);
