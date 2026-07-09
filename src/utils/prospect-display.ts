import { type Channel, type Stage } from '@/api/shared/enums';

export const STAGE_LABEL: Readonly<Record<Stage, string>> = {
  identified: 'Identified',
  contacted: 'Contacted',
  'following-up': 'Following up',
  replied: 'Replied',
  meeting: 'Meeting',
  won: 'Won',
  'not-interested': 'Not interested',
  snoozed: 'Snoozed',
};

export const BOARD_STAGES: ReadonlyArray<Stage> = [
  'identified',
  'contacted',
  'following-up',
  'replied',
  'meeting',
  'won',
];

export const SIDE_STAGES: ReadonlyArray<Stage> = ['not-interested', 'snoozed'];

export const ALL_STAGES: ReadonlyArray<Stage> = [...BOARD_STAGES, ...SIDE_STAGES];

export const EMPTY_HINT: Readonly<Record<Stage, string>> = {
  identified: 'No prospect here',
  contacted: 'Nothing sent yet',
  'following-up': 'No follow-up in progress',
  replied: 'No reply yet',
  meeting: 'No meeting',
  won: 'Nothing won yet',
  'not-interested': 'Nobody here',
  snoozed: 'Nobody snoozed',
};

export const CHANNEL_META: Readonly<
  Record<Channel, Readonly<{ label: string; color: string; auto: boolean }>>
> = {
  email: { label: 'Email', color: '#7c79f6', auto: true },
  linkedin: { label: 'LinkedIn', color: '#5b9be8', auto: false },
  whatsapp: { label: 'WhatsApp', color: '#4ade80', auto: false },
  instagram: { label: 'Instagram', color: '#e4405f', auto: false },
  sms: { label: 'SMS', color: '#a9a6ff', auto: false },
  call: { label: 'Call', color: '#fbbf77', auto: false },
};

export const TONIGHT_STAGES: ReadonlyArray<Stage> = [
  'contacted',
  'replied',
];
