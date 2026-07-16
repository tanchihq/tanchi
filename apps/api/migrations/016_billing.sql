ALTER TABLE "user" ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE TABLE IF NOT EXISTS subscription (
  id UUID PRIMARY KEY,
  plan TEXT NOT NULL,
  reference_id UUID NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'incomplete',
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  seats INTEGER,
  billing_interval TEXT,
  stripe_schedule_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscription_reference_id_idx ON subscription(reference_id);
CREATE INDEX IF NOT EXISTS subscription_stripe_subscription_id_idx ON subscription(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS subscription_stripe_customer_id_idx ON subscription(stripe_customer_id);

CREATE TABLE IF NOT EXISTS usage_counters (
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  metric TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, period, metric)
);
