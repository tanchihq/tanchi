export type Channel =
  | 'email'
  | 'linkedin'
  | 'whatsapp'
  | 'instagram'
  | 'sms'
  | 'call';

export type Stage =
  | 'identified'
  | 'contacted'
  | 'following-up'
  | 'replied'
  | 'meeting'
  | 'won'
  | 'not-interested'
  | 'snoozed';

export type Origin = 'auto' | 'manual';

export type EmailStatus = 'verified' | 'guessed' | 'none';

export type SenderStatus = 'unverified' | 'active' | 'error';
