-- Backfill city on promotions that are missing it
-- Copies city from the linked business record
UPDATE promotions p
SET city = b.city
FROM businesses b
WHERE p.business_id = b.id
  AND (p.city IS NULL OR p.city = '');

-- Verify
SELECT city, count(*) FROM promotions GROUP BY city ORDER BY count DESC;
