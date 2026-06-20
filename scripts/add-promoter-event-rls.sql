-- Allow authenticated promoters to insert events where promoter_id = their user id
CREATE POLICY "Promoters can insert their own events"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = promoter_id);

-- Allow promoters to update/delete their own events
CREATE POLICY "Promoters can update their own events"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = promoter_id);

CREATE POLICY "Promoters can delete their own events"
  ON public.events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = promoter_id);

-- Allow promoters to read their own events on the account dashboard
CREATE POLICY "Promoters can read their own events"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = promoter_id);
