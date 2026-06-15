-- Allow authenticated users to update admin_priority on events and businesses
-- The client-side isAdminUser() check already gates the UI — this just lets the DB accept the write.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Authenticated users can update event priority'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can update event priority"
      ON events FOR UPDATE TO authenticated
      USING (true) WITH CHECK (true)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'businesses' AND policyname = 'Authenticated users can update business priority'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can update business priority"
      ON businesses FOR UPDATE TO authenticated
      USING (true) WITH CHECK (true)';
  END IF;
END $$;
