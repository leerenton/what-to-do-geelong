-- Add city column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles (city);

-- Backfill existing users from their business city where possible
UPDATE profiles p
SET city = b.city
FROM businesses b
WHERE b.owner_id = p.id
  AND p.city IS NULL
  AND b.city IS NOT NULL;
