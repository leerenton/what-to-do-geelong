-- Guide v2 columns: description, public sharing, any-day mode
ALTER TABLE guides ADD COLUMN IF NOT EXISTS description  text;
ALTER TABLE guides ADD COLUMN IF NOT EXISTS is_public    boolean NOT NULL DEFAULT false;
ALTER TABLE guides ADD COLUMN IF NOT EXISTS is_anyday    boolean NOT NULL DEFAULT false;

-- Index for public guides list (used in community guides feed)
CREATE INDEX IF NOT EXISTS idx_guides_public ON guides (is_public, created_at DESC)
  WHERE is_public = true;
