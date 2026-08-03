UPDATE leads
SET stage = 'following-up', updated_at = NOW()
WHERE stage = 'contacted'
  AND sequence_step >= 1
  AND (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.lead_id = leads.id
        AND m.angle_type = 'follow_up'
        AND m.status IN ('draft', 'edited')
    )
    OR (
      SELECT COUNT(*) FROM messages m
      WHERE m.lead_id = leads.id AND m.status = 'sent'
    ) > 1
  );
