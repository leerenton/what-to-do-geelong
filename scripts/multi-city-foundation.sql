-- ─────────────────────────────────────────────────────────────
-- WTDG Multi-City Foundation — Session A
-- Run this in the Supabase SQL editor (safe to re-run: all IF NOT EXISTS)
-- ─────────────────────────────────────────────────────────────


-- ── 1. ADD city COLUMN TO businesses ─────────────────────────
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT 'geelong';

-- Tag all existing rows
UPDATE businesses SET city = 'geelong' WHERE city IS NULL OR city = '';

CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses (city);


-- ── 2. ADD city COLUMN TO events ─────────────────────────────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT 'geelong';

UPDATE events SET city = 'geelong' WHERE city IS NULL OR city = '';

CREATE INDEX IF NOT EXISTS idx_events_city ON events (city);


-- ── 3. ADD city COLUMN TO parks ──────────────────────────────
-- (only if parks table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'parks') THEN
    ALTER TABLE parks ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT 'geelong';
    UPDATE parks SET city = 'geelong' WHERE city IS NULL OR city = '';
  END IF;
END $$;


-- ── 4. ADD cities ARRAY TO news ──────────────────────────────
-- (only if news table exists; allows one article to appear in multiple cities)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'news') THEN
    ALTER TABLE news ADD COLUMN IF NOT EXISTS cities text[] DEFAULT '{geelong}';
    UPDATE news SET cities = '{geelong}' WHERE cities IS NULL;
  END IF;
END $$;


-- ── 5. ADD city COLUMN TO promotions ─────────────────────────
ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT 'geelong';

UPDATE promotions SET city = 'geelong' WHERE city IS NULL OR city = '';

CREATE INDEX IF NOT EXISTS idx_promotions_city ON promotions (city);


-- ── 6. CREATE sites TABLE ────────────────────────────────────
CREATE TABLE IF NOT EXISTS sites (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL UNIQUE,        -- 'geelong', 'ballarat', etc.
  name            text NOT NULL,               -- 'Geelong'
  full_name       text NOT NULL,               -- 'What To Do Geelong'
  domain          text NOT NULL UNIQUE,        -- 'whattodogeelong.com.au'
  domain_www      text,                        -- 'www.whattodogeelong.com.au'
  active          boolean NOT NULL DEFAULT true,
  -- Branding
  logo_url        text,                        -- URL to city logo file
  primary_color   text DEFAULT '#0d9488',      -- teal by default
  -- Map defaults
  map_lat         numeric(9,6) DEFAULT -38.1499,
  map_lng         numeric(9,6) DEFAULT 144.3617,
  map_zoom        int DEFAULT 13,
  -- Hero text
  hero_tagline    text DEFAULT 'Discover what''s on',
  -- Meta
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- Anyone can read active sites (needed for domain detection on page load)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sites' AND policyname = 'Public read active sites'
  ) THEN
    EXECUTE 'CREATE POLICY "Public read active sites" ON sites FOR SELECT USING (active = true)';
  END IF;
END $$;

-- Only service role can insert/update (managed via admin UI using service key)
-- No INSERT/UPDATE policy needed for anon/authenticated roles


-- ── 7. INSERT Geelong site row ───────────────────────────────
INSERT INTO sites (slug, name, full_name, domain, domain_www, map_lat, map_lng, map_zoom, hero_tagline)
VALUES (
  'geelong',
  'Geelong',
  'What To Do Geelong',
  'whattodogeelong.com.au',
  'www.whattodogeelong.com.au',
  -38.1499,
  144.3617,
  13,
  'Your guide to Geelong'
)
ON CONFLICT (slug) DO NOTHING;


-- ── 8. VERIFY — check what we have ───────────────────────────
SELECT 'sites' as tbl, count(*) FROM sites
UNION ALL
SELECT 'businesses with city', count(*) FROM businesses WHERE city IS NOT NULL
UNION ALL
SELECT 'events with city', count(*) FROM events WHERE city IS NOT NULL
UNION ALL
SELECT 'promotions with city', count(*) FROM promotions WHERE city IS NOT NULL;
