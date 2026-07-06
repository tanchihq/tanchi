ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS sequence_step INT NOT NULL DEFAULT 0;

ALTER TABLE organization_profile
  ADD COLUMN IF NOT EXISTS follow_up_intervals INT[] NOT NULL DEFAULT '{3,4}',
  ADD COLUMN IF NOT EXISTS excluded_weekdays INT[] NOT NULL DEFAULT '{0,6}';
