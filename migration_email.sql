-- ── Email personalisation schema ──────────────────────────

-- 1. Add user_id + category to page_views so we can attribute views to users
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS category text;
CREATE INDEX IF NOT EXISTS idx_pv_user_cat ON page_views (user_id, category, viewed_at DESC)
  WHERE user_id IS NOT NULL;

-- 2. Email preferences — one row per registered user
CREATE TABLE IF NOT EXISTS email_preferences (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL,
  weekly_digest boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own preferences
CREATE POLICY "email_prefs_select" ON email_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "email_prefs_insert" ON email_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "email_prefs_update" ON email_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Anon upsert for unsubscribe links (token-based — we pass user_id in the link)
-- Service role bypasses RLS so the Edge Function / API route can update freely.
