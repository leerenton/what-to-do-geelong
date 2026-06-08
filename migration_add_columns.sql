-- ─────────────────────────────────────────────────────────
-- WTDG Migration: Add missing columns to businesses, stays, events
-- Run this in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────

-- ── BUSINESSES: add lat / lng ─────────────────────────────
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS lat  double precision,
  ADD COLUMN IF NOT EXISTS lng  double precision;

-- ── STAYS: add lat, lng, description, suburb, website, slug ──
ALTER TABLE stays
  ADD COLUMN IF NOT EXISTS lat         double precision,
  ADD COLUMN IF NOT EXISTS lng         double precision,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS suburb      text,
  ADD COLUMN IF NOT EXISTS website     text,
  ADD COLUMN IF NOT EXISTS slug        text;

-- ── EVENTS: add lat, lng, img ────────────────────────────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS lat  double precision,
  ADD COLUMN IF NOT EXISTS lng  double precision,
  ADD COLUMN IF NOT EXISTS img  text;

-- Verify
SELECT 'businesses' AS tbl, column_name FROM information_schema.columns WHERE table_name='businesses' AND table_schema='public' AND column_name IN ('lat','lng')
UNION ALL
SELECT 'stays', column_name FROM information_schema.columns WHERE table_name='stays' AND table_schema='public' AND column_name IN ('lat','lng','description','slug')
UNION ALL
SELECT 'events', column_name FROM information_schema.columns WHERE table_name='events' AND table_schema='public' AND column_name IN ('lat','lng','img');
