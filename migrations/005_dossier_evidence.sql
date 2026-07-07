ALTER TABLE dossier_facts
  ADD COLUMN IF NOT EXISTS evidence TEXT,
  ADD COLUMN IF NOT EXISTS provenance TEXT
    CHECK (provenance IN ('own_source', 'third_party'));
