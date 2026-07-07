ALTER TABLE organization_profile
  ADD COLUMN IF NOT EXISTS outreach_language TEXT NOT NULL DEFAULT 'fr';
