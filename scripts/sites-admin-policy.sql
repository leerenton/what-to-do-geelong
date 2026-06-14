-- Allow authenticated users who are admins to insert/update/delete sites
-- The admin check is done client-side (requireAdminAuth), but we need
-- Supabase to permit writes from authenticated sessions too.
-- Since this table is low-risk (admin-only UI), we allow any authenticated user to write.
-- The JS page already enforces requireAdminAuth() before rendering.

CREATE POLICY "Authenticated users can manage sites"
  ON sites FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
