ALTER TABLE organization_profile
  ADD COLUMN IF NOT EXISTS company_profile TEXT NOT NULL DEFAULT '';
