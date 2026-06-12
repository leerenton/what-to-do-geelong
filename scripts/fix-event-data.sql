-- Fix event data imported from geelongcity.vic.gov.au
-- 1. Strip external source URLs — we don't link back to scraped sources
-- 2. Clear generic council descriptions ("wide range of services to support life in Geelong")

-- Remove URLs pointing back to geelongcity.vic.gov.au
UPDATE events
SET url = NULL
WHERE url ILIKE '%geelongcity.vic.gov.au%';

-- Clear the generic fallback description that came from the council site footer
UPDATE events
SET description = NULL
WHERE description ILIKE '%wide range of services to support life%';

-- Also clear other common generic council descriptions
UPDATE events
SET description = NULL
WHERE description ILIKE '%City of Greater Geelong%provides a wide range%'
   OR description ILIKE '%support life in Geelong%';

-- Summary check — see what's left with descriptions vs null
SELECT
  COUNT(*) FILTER (WHERE description IS NOT NULL AND description != '') AS with_description,
  COUNT(*) FILTER (WHERE description IS NULL OR description = '')       AS no_description,
  COUNT(*) FILTER (WHERE url IS NOT NULL AND url != '')                 AS with_url,
  COUNT(*) FILTER (WHERE url IS NULL OR url = '')                       AS no_url
FROM events;
