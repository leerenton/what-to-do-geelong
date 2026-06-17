-- Add city column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles (city);

-- Update the trigger to capture city from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, city, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'city',
    NEW.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    city = EXCLUDED.city;
  RETURN NEW;
END; $$;

-- Backfill existing users from their business city where possible
UPDATE profiles p
SET city = b.city
FROM businesses b
WHERE b.owner_id = p.id
  AND p.city IS NULL
  AND b.city IS NOT NULL;
