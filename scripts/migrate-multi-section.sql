-- Migration: add sections[] and ensure tags[] exist on businesses table
-- Run this in Supabase Dashboard → SQL Editor

-- Add sections array (multi-section support)
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS sections text[] DEFAULT '{}';

-- Ensure tags column exists (may already be present)
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Back-fill sections from existing single section field
-- (so all existing businesses appear in the right pages immediately)
UPDATE businesses
  SET sections = ARRAY[section]
  WHERE section IS NOT NULL
    AND (sections IS NULL OR sections = '{}');
