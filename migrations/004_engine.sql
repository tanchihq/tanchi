CREATE TABLE IF NOT EXISTS senders (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  smtp_host TEXT NOT NULL,
  smtp_port INT NOT NULL,
  smtp_secure BOOLEAN NOT NULL DEFAULT TRUE,
  imap_host TEXT NOT NULL,
  imap_port INT NOT NULL,
  imap_secure BOOLEAN NOT NULL DEFAULT TRUE,
  username TEXT NOT NULL,
  secret_encrypted TEXT NOT NULL,
  daily_cap INT NOT NULL DEFAULT 30,
  warmup_started_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (status IN ('unverified','active','error')),
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS senders_organization_id_idx ON senders(organization_id);

CREATE TABLE IF NOT EXISTS sourcing_credentials (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('hunter','apollo','zoominfo')),
  api_key_encrypted TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (status IN ('unverified','active','error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, provider)
);

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  website TEXT,
  sector TEXT,
  size TEXT,
  hq TEXT,
  linkedin_url TEXT,
  instagram_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS companies_organization_id_idx ON companies(organization_id);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  icp_id UUID REFERENCES icp(id) ON DELETE SET NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  email TEXT,
  email_status TEXT NOT NULL DEFAULT 'none'
    CHECK (email_status IN ('verified','guessed','none')),
  phone TEXT,
  linkedin_url TEXT,
  instagram_url TEXT,
  channel TEXT NOT NULL DEFAULT 'email'
    CHECK (channel IN ('email','linkedin','whatsapp','instagram','sms','call')),
  stage TEXT NOT NULL DEFAULT 'identified'
    CHECK (stage IN ('identified','contacted','following-up','replied','meeting','won','not-interested','snoozed')),
  origin TEXT NOT NULL DEFAULT 'auto'
    CHECK (origin IN ('auto','manual')),
  qualification TEXT CHECK (qualification IN ('A','B','C')),
  score INT,
  hot BOOLEAN NOT NULL DEFAULT FALSE,
  next_follow_up_at TIMESTAMPTZ,
  snooze_until TIMESTAMPTZ,
  source_provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leads_organization_id_idx ON leads(organization_id);
CREATE INDEX IF NOT EXISTS leads_organization_stage_idx ON leads(organization_id, stage);
CREATE INDEX IF NOT EXISTS leads_company_id_idx ON leads(company_id);
CREATE INDEX IF NOT EXISTS leads_icp_id_idx ON leads(icp_id);

CREATE TABLE IF NOT EXISTS dossiers (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dossier_facts (
  id UUID PRIMARY KEY,
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  source_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dossier_facts_dossier_id_idx ON dossier_facts(dossier_id);

CREATE TABLE IF NOT EXISTS dossier_angles (
  id UUID PRIMARY KEY,
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  rank INT NOT NULL,
  title TEXT NOT NULL,
  note TEXT,
  angle_type TEXT,
  fact_id UUID REFERENCES dossier_facts(id) ON DELETE SET NULL,
  chosen BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dossier_angles_dossier_id_idx ON dossier_angles(dossier_id);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES senders(id) ON DELETE SET NULL,
  icp_id UUID REFERENCES icp(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email','linkedin','whatsapp','instagram','sms','call')),
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','edited','sent','skipped')),
  origin TEXT NOT NULL DEFAULT 'auto'
    CHECK (origin IN ('auto','manual','seed')),
  is_exploration BOOLEAN NOT NULL DEFAULT FALSE,
  angle_type TEXT,
  angle_type_inferred TEXT,
  length_bucket TEXT,
  cta_type TEXT,
  perso_depth TEXT,
  slot TEXT,
  seed_rationale TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_organization_id_idx ON messages(organization_id);
CREATE INDEX IF NOT EXISTS messages_lead_id_idx ON messages(lead_id);
CREATE INDEX IF NOT EXISTS messages_organization_origin_idx ON messages(organization_id, origin);

CREATE TABLE IF NOT EXISTS edits (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  ai_version TEXT NOT NULL,
  edited_version TEXT NOT NULL,
  diff JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS edits_message_id_idx ON edits(message_id);

CREATE TABLE IF NOT EXISTS outcomes (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  stage_signal TEXT NOT NULL
    CHECK (stage_signal IN ('sent','delivered','opened','replied','positive','meeting','deal')),
  classification TEXT
    CHECK (classification IN ('positive','negative','later','none')),
  reply_text TEXT,
  attribution_window_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS outcomes_message_id_idx ON outcomes(message_id);
CREATE INDEX IF NOT EXISTS outcomes_lead_id_idx ON outcomes(lead_id);
CREATE INDEX IF NOT EXISTS outcomes_organization_signal_idx ON outcomes(organization_id, stage_signal);

CREATE TABLE IF NOT EXISTS playbook (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  icp_id UUID NOT NULL REFERENCES icp(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  generated_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS playbook_organization_icp_idx ON playbook(organization_id, icp_id);
