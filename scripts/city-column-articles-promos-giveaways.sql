-- Add city column to articles, promos and giveaways
-- Defaults to 'geelong' so all existing content stays visible
ALTER TABLE articles  ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT 'geelong';
ALTER TABLE promos    ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT 'geelong';
ALTER TABLE giveaways ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT 'geelong';
