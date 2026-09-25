export const MAX_MESSAGE_LENGTH = 20000;
export const MAX_SUBJECT_LENGTH = 300;

export const SEND_CLAIM_TTL_MINUTES = 10;

export const SKIP_REASONS = [
  "wrong_lead",
  "wrong_angle",
  "too_generic",
  "not_now",
] as const;

export const WRONG_LEAD_EXCLUSION_REASON = "Skipped from the queue: wrong lead";
