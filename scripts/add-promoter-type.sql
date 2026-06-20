-- Add promoter_type flag to profiles
-- Values: null (regular user), 'multi_event', 'gold_promoter'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS promoter_type TEXT;

-- Allow credit_ledger entries to attach to a user directly (for promoter credits)
ALTER TABLE credit_ledger ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Allow events to be created by a promoter without a business
ALTER TABLE events ADD COLUMN IF NOT EXISTS promoter_id UUID REFERENCES auth.users(id);

-- Update handle_new_user trigger to set promoter_type from metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, city, promoter_type)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'city',
    CASE NEW.raw_user_meta_data->>'user_type'
      WHEN 'promoter' THEN 'multi_event'
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    name          = EXCLUDED.name,
    city          = EXCLUDED.city,
    promoter_type = EXCLUDED.promoter_type;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
