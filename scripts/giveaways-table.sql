-- ── Giveaways table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS giveaways (
  id                 TEXT PRIMARY KEY,
  title              TEXT NOT NULL,
  slug               TEXT NOT NULL UNIQUE,
  description        TEXT,
  prize              TEXT,
  how_to_enter       TEXT,
  age_restriction    TEXT,
  img                TEXT,
  linked_event_id    TEXT,
  linked_business_id TEXT,
  status             TEXT NOT NULL DEFAULT 'active', -- active | completed
  winner_names       TEXT,
  winner_img         TEXT,
  ends_at            TIMESTAMPTZ,
  published          BOOLEAN DEFAULT true,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE giveaways ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_giveaways" ON giveaways;
CREATE POLICY "public_read_giveaways"
  ON giveaways FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS "authenticated_all_giveaways" ON giveaways;
CREATE POLICY "authenticated_all_giveaways"
  ON giveaways FOR ALL TO authenticated
  USING (true) WITH CHECK (true);


-- ── Giveaway entries table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS giveaway_entries (
  id           BIGSERIAL PRIMARY KEY,
  giveaway_id  TEXT NOT NULL REFERENCES giveaways(id) ON DELETE CASCADE,
  name         TEXT,
  email        TEXT NOT NULL,
  wants_alerts BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE giveaway_entries ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an entry
DROP POLICY IF EXISTS "public_insert_giveaway_entries" ON giveaway_entries;
CREATE POLICY "public_insert_giveaway_entries"
  ON giveaway_entries FOR INSERT
  WITH CHECK (true);

-- Only authenticated (admin) can read entries
DROP POLICY IF EXISTS "authenticated_read_giveaway_entries" ON giveaway_entries;
CREATE POLICY "authenticated_read_giveaway_entries"
  ON giveaway_entries FOR SELECT TO authenticated
  USING (true);
