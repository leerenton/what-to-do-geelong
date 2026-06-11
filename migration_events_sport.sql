-- ─────────────────────────────────────────────────────────
-- WTDG Migration: Add slug + source columns to events
-- Run this in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────

-- slug: used for deduplication in sync scripts (afl-cats, nbl-united, scrape-gpac etc.)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS slug   text,
  ADD COLUMN IF NOT EXISTS source text;  -- e.g. 'afl-cats', 'nbl-united', 'gpac', 'eventbrite'

-- Optional: index on slug for faster dedup lookups
CREATE INDEX IF NOT EXISTS events_slug_idx   ON events (slug);
CREATE INDEX IF NOT EXISTS events_source_idx ON events (source);

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'events'
  AND table_schema = 'public'
  AND column_name IN ('slug', 'source')
ORDER BY column_name;
