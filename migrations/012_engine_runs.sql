CREATE TABLE IF NOT EXISTS engine_run (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running',
  sourced BOOLEAN NOT NULL DEFAULT FALSE,
  sourced_count INT NOT NULL DEFAULT 0,
  profiled_count INT NOT NULL DEFAULT 0,
  drafted_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS engine_run_one_active_per_org
  ON engine_run (organization_id)
  WHERE status = 'running';
