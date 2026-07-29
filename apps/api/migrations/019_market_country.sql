ALTER TABLE market
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'US';

UPDATE market SET country = CASE outreach_language
  WHEN 'fr' THEN 'FR'
  WHEN 'es' THEN 'ES'
  WHEN 'de' THEN 'DE'
  WHEN 'it' THEN 'IT'
  WHEN 'nl' THEN 'NL'
  WHEN 'pt' THEN 'PT'
  ELSE 'US'
END;
