-- Allow authenticated users (admins) to insert, update and delete articles
DROP POLICY IF EXISTS "authenticated_insert_articles" ON articles;
DROP POLICY IF EXISTS "authenticated_update_articles" ON articles;
DROP POLICY IF EXISTS "authenticated_delete_articles" ON articles;

CREATE POLICY "authenticated_insert_articles"
  ON articles FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_articles"
  ON articles FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_articles"
  ON articles FOR DELETE TO authenticated
  USING (true);
