CREATE TABLE IF NOT EXISTS suppression_list (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

CREATE INDEX IF NOT EXISTS suppression_organization_id_idx
  ON suppression_list(organization_id);
