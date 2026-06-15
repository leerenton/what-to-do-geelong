-- Anyone can submit an enquiry (anon INSERT)
DROP POLICY IF EXISTS "anon_insert_inquiries" ON inquiries;
CREATE POLICY "anon_insert_inquiries"
  ON inquiries FOR INSERT
  WITH CHECK (true);

-- Authenticated users (admins/owners) can read and update inquiries
DROP POLICY IF EXISTS "authenticated_select_inquiries" ON inquiries;
CREATE POLICY "authenticated_select_inquiries"
  ON inquiries FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated_update_inquiries" ON inquiries;
CREATE POLICY "authenticated_update_inquiries"
  ON inquiries FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
