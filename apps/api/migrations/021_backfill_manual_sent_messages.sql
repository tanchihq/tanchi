WITH victims AS (
  SELECT DISTINCT ON (l.id)
    l.id AS lead_id,
    l.organization_id,
    l.channel,
    l.updated_at AS validated_at,
    m.id AS message_id
  FROM leads l
  JOIN messages m ON m.lead_id = l.id
  WHERE l.channel <> 'email'
    AND l.stage IN ('contacted', 'following-up')
    AND l.sequence_step = 0
    AND m.status IN ('draft', 'edited')
    AND m.sent_at IS NULL
  ORDER BY l.id, m.created_at DESC
),
marked AS (
  UPDATE messages m
  SET status = 'sent', sent_at = v.validated_at, updated_at = NOW()
  FROM victims v
  WHERE m.id = v.message_id
  RETURNING m.id
),
recorded AS (
  INSERT INTO outcomes (
    id, organization_id, message_id, lead_id, stage_signal, created_at
  )
  SELECT
    gen_random_uuid(), v.organization_id, v.message_id, v.lead_id,
    'sent', v.validated_at
  FROM victims v
  WHERE NOT EXISTS (
    SELECT 1 FROM outcomes o
    WHERE o.message_id = v.message_id AND o.stage_signal = 'sent'
  )
  RETURNING id
),
logged AS (
  INSERT INTO activity (id, organization_id, type, title, lead_id, created_at)
  SELECT
    gen_random_uuid(), v.organization_id, 'sent',
    CASE v.channel
      WHEN 'linkedin' THEN 'LinkedIn message marked as sent'
      WHEN 'whatsapp' THEN 'WhatsApp message marked as sent'
      WHEN 'instagram' THEN 'Instagram message marked as sent'
      WHEN 'sms' THEN 'SMS message marked as sent'
      WHEN 'call' THEN 'Call message marked as sent'
      ELSE 'Message marked as sent'
    END,
    v.lead_id, v.validated_at
  FROM victims v
  RETURNING id
)
UPDATE leads l
SET sequence_step = 1, next_follow_up_at = NULL
FROM victims v
WHERE l.id = v.lead_id;
