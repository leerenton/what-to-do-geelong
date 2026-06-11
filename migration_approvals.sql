-- ─────────────────────────────────────────────────────────
-- WTDG Migration: Approval workflow + business image columns
-- Run this in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────

-- Add status column to businesses (pending = awaiting admin review)
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS img    text;   -- cover photo URL

-- New businesses/claims start as pending
-- (existing ones default to 'approved' so nothing breaks)

-- Add status to events (business-submitted events need review)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved';

-- Add status to promos
ALTER TABLE promos
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved';

-- Add claim_notes so businesses can leave a note when claiming
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS claim_notes text;

-- Add lat/lng to businesses for map pin and distance features
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision;

-- Index for fast pending-queue queries
CREATE INDEX IF NOT EXISTS businesses_status_idx ON businesses (status);
CREATE INDEX IF NOT EXISTS events_status_idx     ON events     (status);
CREATE INDEX IF NOT EXISTS promos_status_idx     ON promos     (status);

-- Storage bucket for business-uploaded media (if not already created)
-- Run separately in Supabase dashboard Storage UI, or:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('business-media', 'business-media', true, 5242880,
        ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload to business-media
DROP POLICY IF EXISTS "biz_media_public_read"  ON storage.objects;
CREATE POLICY "biz_media_public_read"  ON storage.objects
  FOR SELECT USING (bucket_id = 'business-media');

DROP POLICY IF EXISTS "biz_media_auth_insert"  ON storage.objects;
CREATE POLICY "biz_media_auth_insert"  ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'business-media');

DROP POLICY IF EXISTS "biz_media_auth_update"  ON storage.objects;
CREATE POLICY "biz_media_auth_update"  ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'business-media');

DROP POLICY IF EXISTS "biz_media_auth_delete"  ON storage.objects;
CREATE POLICY "biz_media_auth_delete"  ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'business-media');

-- Verify
SELECT table_name, column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('businesses','events','promos')
  AND column_name IN ('status','img','claim_notes')
ORDER BY table_name, column_name;
