ALTER TABLE organization_profile
  ADD COLUMN IF NOT EXISTS leads_per_day INT NOT NULL DEFAULT 15;
