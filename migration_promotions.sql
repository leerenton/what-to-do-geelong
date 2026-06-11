-- ─────────────────────────────────────────────────────────
-- WTDG Migration: Unified promotions + credit ledger
-- Run this in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────

-- Unified promotions table
-- Replaces scattered is_promoted flags with a proper audit trail
CREATE TABLE IF NOT EXISTS promotions (
  id              uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id     text    REFERENCES businesses(id) ON DELETE CASCADE,
  item_type       text    NOT NULL,   -- 'business' | 'event' | 'offer' | 'article'
  item_id         text    NOT NULL,   -- id of the promoted item
  package         text    NOT NULL,   -- 'boost' | 'spotlight' | 'premier'
  status          text    DEFAULT 'pending', -- 'pending'|'approved'|'live'|'completed'|'rejected'
  placement       text[],             -- ['homepage','events_page','email'] etc
  starts_at       timestamptz,
  ends_at         timestamptz,
  paid_amount     integer DEFAULT 0,  -- in cents AUD
  credits_used    integer DEFAULT 0,
  stripe_session_id text,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

-- Credit ledger — every credit earned or spent is a row
CREATE TABLE IF NOT EXISTS credit_ledger (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id text    NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  amount      integer NOT NULL,  -- positive = earned, negative = spent
  reason      text,              -- 'gold_annual_signup' | 'gold_monthly_renew' | 'boost_redeemed' etc
  ref_id      text,              -- promotion id or stripe invoice/session id
  created_at  timestamptz DEFAULT now()
);

-- Add credit_balance to businesses for fast reads (maintained by triggers/webhook)
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS credit_balance integer NOT NULL DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS promotions_business_idx  ON promotions  (business_id);
CREATE INDEX IF NOT EXISTS promotions_status_idx    ON promotions  (status);
CREATE INDEX IF NOT EXISTS promotions_item_idx      ON promotions  (item_type, item_id);
CREATE INDEX IF NOT EXISTS credit_ledger_biz_idx    ON credit_ledger (business_id);

-- RLS
ALTER TABLE promotions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;

-- Public can't read promotions directly (owner only)
CREATE POLICY "Owner reads promotions" ON promotions
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "Owner inserts promotions" ON promotions
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "Owner reads credits" ON credit_ledger
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- Verify
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('promotions','credit_ledger')
ORDER BY table_name;
