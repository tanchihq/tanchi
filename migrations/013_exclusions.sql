ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS excluded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS leads_organization_excluded_idx
  ON leads(organization_id, excluded_at);

CREATE TABLE IF NOT EXISTS exclusions (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('person','company')),
  email TEXT,
  company_domain TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS exclusions_organization_id_idx
  ON exclusions(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS exclusions_person_idx
  ON exclusions(organization_id, email) WHERE scope = 'person';
CREATE UNIQUE INDEX IF NOT EXISTS exclusions_company_idx
  ON exclusions(organization_id, company_domain) WHERE scope = 'company';

INSERT INTO exclusions (id, organization_id, scope, email, created_at)
  SELECT id, organization_id, 'person', email, created_at
  FROM suppression_list
ON CONFLICT DO NOTHING;

DROP TABLE IF EXISTS suppression_list;
