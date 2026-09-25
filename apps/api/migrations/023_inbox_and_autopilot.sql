ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS email_message_id TEXT,
  ADD COLUMN IF NOT EXISTS send_claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sent_automatically BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS skip_reason TEXT;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_skip_reason_check;
ALTER TABLE messages ADD CONSTRAINT messages_skip_reason_check
  CHECK (skip_reason IN (
    'wrong_lead', 'wrong_angle', 'too_generic', 'not_now',
    'lead_replied', 'address_bounced'
  ));

CREATE INDEX IF NOT EXISTS messages_organization_email_message_id_idx
  ON messages(organization_id, email_message_id)
  WHERE email_message_id IS NOT NULL;

ALTER TABLE outcomes
  ADD COLUMN IF NOT EXISTS reply_message_id TEXT,
  ADD COLUMN IF NOT EXISTS reply_from TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS outcomes_organization_reply_message_id_idx
  ON outcomes(organization_id, reply_message_id)
  WHERE reply_message_id IS NOT NULL;

ALTER TABLE outcomes DROP CONSTRAINT IF EXISTS outcomes_classification_check;
ALTER TABLE outcomes ADD CONSTRAINT outcomes_classification_check
  CHECK (classification IN ('positive', 'negative', 'later', 'neutral', 'none'));

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_stage_check;
ALTER TABLE leads ADD CONSTRAINT leads_stage_check
  CHECK (stage IN (
    'identified', 'contacted', 'following-up', 'replied', 'meeting', 'won',
    'not-interested', 'snoozed', 'bounced'
  ));

ALTER TABLE organization_profile
  ADD COLUMN IF NOT EXISTS autopilot_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS autopilot_updated_at TIMESTAMPTZ;
