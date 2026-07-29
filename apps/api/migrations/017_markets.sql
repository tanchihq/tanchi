CREATE TABLE IF NOT EXISTS market (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  outreach_language TEXT NOT NULL DEFAULT 'en',
  company_profile TEXT NOT NULL DEFAULT '',
  leads_per_day INT NOT NULL DEFAULT 15,
  follow_up_intervals INT[] NOT NULL DEFAULT '{3,4}',
  excluded_weekdays INT[] NOT NULL DEFAULT '{0,6}',
  position INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS market_organization_id_idx ON market(organization_id);

ALTER TABLE icp
  ADD COLUMN IF NOT EXISTS market_id UUID REFERENCES market(id) ON DELETE CASCADE;

INSERT INTO market (
  id, organization_id, name,
  outreach_language, company_profile, leads_per_day,
  follow_up_intervals, excluded_weekdays, position, created_at
)
SELECT
  gen_random_uuid(),
  o.organization_id,
  'Main market',
  COALESCE(p.outreach_language, 'en'),
  COALESCE(p.company_profile, ''),
  COALESCE(p.leads_per_day, 15),
  COALESCE(p.follow_up_intervals, '{3,4}'),
  COALESCE(p.excluded_weekdays, '{0,6}'),
  0,
  NOW()
FROM (
  SELECT organization_id FROM organization_profile
  UNION
  SELECT DISTINCT organization_id FROM icp
) o
LEFT JOIN organization_profile p ON p.organization_id = o.organization_id
WHERE NOT EXISTS (
  SELECT 1 FROM market m WHERE m.organization_id = o.organization_id
);

UPDATE icp i
SET market_id = m.id
FROM market m
WHERE m.organization_id = i.organization_id
  AND m.position = 0
  AND i.market_id IS NULL;

ALTER TABLE icp ALTER COLUMN market_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS icp_market_id_idx ON icp(market_id);
