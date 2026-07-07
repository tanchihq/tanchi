import { type LeadDetailDto } from '@/api/prospects/entities/response.entities';
import { ageLabel } from '@/utils/format';

export const identityLine = (lead: LeadDetailDto): string =>
  [lead.company.size, lead.company.sector, lead.company.hq]
    .filter((value): value is string => value !== null)
    .join(' · ');

export const timeAgo = (iso: string): string =>
  ageLabel(iso) === 'today' ? 'today' : `${ageLabel(iso)} ago`;

export const isReviewStage = (lead: LeadDetailDto): boolean =>
  lead.stage === 'contacted' || lead.stage === 'following-up';

export const isClosedStage = (lead: LeadDetailDto): boolean =>
  lead.stage === 'meeting' ||
  lead.stage === 'won' ||
  lead.stage === 'not-interested' ||
  lead.stage === 'snoozed';

export const CLOSED_COPY: Readonly<Record<string, Readonly<{ title: string; note: string }>>> = {
  meeting: { title: 'Meeting upcoming', note: 'Next step: prepare the meeting.' },
  won: { title: 'Deal won', note: 'Next step: hand off to the onboarding team.' },
  'not-interested': {
    title: 'Prospect not interested',
    note: "No action needed. The agent won't write again.",
  },
  snoozed: { title: 'Snoozed', note: 'To reactivate later.' },
};
