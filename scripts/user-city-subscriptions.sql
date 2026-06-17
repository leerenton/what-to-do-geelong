-- ── User City Subscriptions ────────────────────────────────────────────────
-- Each row = a user opted in to emails for a specific city.
-- Auto-inserted on registration for the city the user signed up on.
-- Managed via the city switcher UI (account page / nav).

CREATE TABLE IF NOT EXISTS user_city_subscriptions (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city          TEXT        NOT NULL,  -- slug: 'geelong', 'ballarat', etc.
  subscribed    BOOLEAN     NOT NULL DEFAULT true,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, city)
);

-- Index for fast digest queries (city-first)
CREATE INDEX IF NOT EXISTS idx_ucs_city ON user_city_subscriptions (city, subscribed);
CREATE INDEX IF NOT EXISTS idx_ucs_user ON user_city_subscriptions (user_id);

-- RLS
ALTER TABLE user_city_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscriptions"
  ON user_city_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON user_city_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON user_city_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can read all (for digest sending)
CREATE POLICY "Service role full access"
  ON user_city_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- ── Backfill existing Geelong subscribers ──────────────────────────────────
-- Anyone who currently has weekly_digest=true gets a geelong subscription row.
INSERT INTO user_city_subscriptions (user_id, city, subscribed, subscribed_at)
SELECT ep.user_id, 'geelong', true, NOW()
FROM   email_preferences ep
WHERE  ep.weekly_digest = true
ON CONFLICT (user_id, city) DO NOTHING;
