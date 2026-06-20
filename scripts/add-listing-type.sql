-- listing_type on businesses: 'business' (default), 'community', 'sports_team'
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'business';

-- Sports fixture fields on events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS opponent      TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_home_game  BOOLEAN DEFAULT true;

-- Major event flag — admin-only creation, different display layout
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_major BOOLEAN DEFAULT false;

-- Index for fast listing_type queries
CREATE INDEX IF NOT EXISTS idx_businesses_listing_type ON public.businesses (listing_type);
