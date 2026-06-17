-- Add analytics/tracking ID columns to the sites table
-- Run this in Supabase SQL editor

ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS ga_id          TEXT,   -- Google Analytics 4: G-XXXXXXXXXX or UA-XXXXXXXX-X
  ADD COLUMN IF NOT EXISTS gtm_id         TEXT,   -- Google Tag Manager: GTM-XXXXXXX
  ADD COLUMN IF NOT EXISTS adsense_id     TEXT,   -- Google AdSense publisher: ca-pub-XXXXXXXXXXXXXXXX
  ADD COLUMN IF NOT EXISTS meta_pixel_id  TEXT;   -- Meta (Facebook/Instagram) Pixel ID

-- Example: set Victoria's GA ID
-- UPDATE sites SET ga_id = 'G-XXXXXXXXXX' WHERE slug = 'victoria';
