-- Ensure profiles has all the columns we need
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name          TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email         TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city          TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS promoter_type TEXT;

-- Allow events to be submitted by a promoter without a business
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS promoter_id UUID REFERENCES auth.users(id);

-- Allow credit_ledger to attach to a user directly (for promoter credits)
ALTER TABLE public.credit_ledger ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Replace the trigger with a version that handles all paths
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, city, promoter_type, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'city',
    CASE NEW.raw_user_meta_data->>'user_type'
      WHEN 'promoter' THEN 'multi_event'
      ELSE NULL
    END,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email         = EXCLUDED.email,
    name          = COALESCE(EXCLUDED.name, profiles.name),
    city          = COALESCE(EXCLUDED.city, profiles.city),
    promoter_type = COALESCE(EXCLUDED.promoter_type, profiles.promoter_type);
  RETURN NEW;
END; $$;
