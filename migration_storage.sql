-- Supabase Storage: public 'media' bucket for admin image uploads
-- Run in Supabase SQL editor

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media', 'media', true,
  10485760,  -- 10 MB limit per file
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read (anyone can view uploaded images via URL)
DROP POLICY IF EXISTS "media_public_read"       ON storage.objects;
CREATE POLICY "media_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

-- Authenticated users (admins) can upload
DROP POLICY IF EXISTS "media_auth_insert"       ON storage.objects;
CREATE POLICY "media_auth_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_auth_update"       ON storage.objects;
CREATE POLICY "media_auth_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_auth_delete"       ON storage.objects;
CREATE POLICY "media_auth_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media');
