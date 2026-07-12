CREATE TABLE IF NOT EXISTS onboarding_state (
  organization_id UUID PRIMARY KEY REFERENCES organization(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress','completed')),
  current_step INT NOT NULL DEFAULT 0,
  draft JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_profile (
  organization_id UUID PRIMARY KEY REFERENCES organization(id) ON DELETE CASCADE,
  website TEXT NOT NULL,
  product_page_url TEXT,
  sales_deck_url TEXT,
  onboarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS icp (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  archetype TEXT,
  description TEXT NOT NULL,
  perceived_value TEXT,
  angle TEXT,
  golden_rule TEXT,
  position INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS icp_organization_id_idx ON icp(organization_id);
