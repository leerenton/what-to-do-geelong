-- Structured start/end datetimes for events (promoter signup + fixture support)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_date   TIMESTAMPTZ;

-- Index for date-ordered queries
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events (start_date);
