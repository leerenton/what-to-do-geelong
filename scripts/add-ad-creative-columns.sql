-- Add ad creative columns to promotions table
-- Run in Supabase SQL editor

ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS ad_image_url    text,
  ADD COLUMN IF NOT EXISTS ad_link_url     text,
  ADD COLUMN IF NOT EXISTS ad_headline     text,
  ADD COLUMN IF NOT EXISTS ad_live         boolean NOT NULL DEFAULT false;

-- ad_live = true means the business has uploaded their creative and the ad is ready to show
-- (status stays 'pending' until we optionally review; for now we auto-set ad_live=true on upload)

-- Index for fast "give me all active ads right now" queries
CREATE INDEX IF NOT EXISTS idx_promotions_active_ads
  ON promotions (package, ad_live, ends_at)
  WHERE ad_live = true;

-- Check what you have
SELECT id, business_id, package, status, ad_live, ad_image_url, starts_at, ends_at
FROM promotions
ORDER BY created_at DESC
LIMIT 20;
