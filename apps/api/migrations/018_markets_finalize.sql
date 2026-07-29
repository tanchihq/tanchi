ALTER TABLE market ALTER COLUMN outreach_language SET DEFAULT 'en';

ALTER TABLE organization_profile
  DROP COLUMN IF EXISTS outreach_language,
  DROP COLUMN IF EXISTS company_profile,
  DROP COLUMN IF EXISTS leads_per_day,
  DROP COLUMN IF EXISTS follow_up_intervals,
  DROP COLUMN IF EXISTS excluded_weekdays;
