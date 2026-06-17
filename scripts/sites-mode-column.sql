-- Add site_mode column to sites table
ALTER TABLE sites ADD COLUMN IF NOT EXISTS site_mode TEXT NOT NULL DEFAULT 'active';

-- site_mode values: 'active' | 'coming_soon' | 'maintenance'
-- Migrate existing active/inactive state
UPDATE sites SET site_mode = CASE WHEN active = true THEN 'active' ELSE 'coming_soon' END;

COMMENT ON COLUMN sites.site_mode IS 'active | coming_soon | maintenance';
