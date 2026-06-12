-- Migration: add sections[], categories[], tags[] to businesses table
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS sections   text[] DEFAULT '{}';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tags       text[] DEFAULT '{}';

-- Back-fill sections from existing single section field
UPDATE businesses
  SET sections = ARRAY[section]
  WHERE section IS NOT NULL
    AND (sections IS NULL OR sections = '{}');

-- Back-fill categories from existing type/category field
UPDATE businesses
  SET categories = ARRAY[COALESCE(type, category)]
  WHERE COALESCE(type, category) IS NOT NULL
    AND (categories IS NULL OR categories = '{}');
