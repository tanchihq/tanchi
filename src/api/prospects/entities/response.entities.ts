import {
  type Channel,
  type EmailStatus,
  type Origin,
  type Stage,
} from '@/api/shared/enums';

export type ProspectDto = Readonly<{
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  channel: Channel;
  icp: string;
  hot: boolean;
  stage: Stage;
  origin: Origin;
  score: number | null;
  qualification: string | null;
  createdAt: string;
  nextFollowUpAt: string | null;
  snoozeUntil: string | null;
}>;

export type ProspectCompanyDto = Readonly<{
  name: string;
  sector: string | null;
  size: string | null;
  hq: string | null;
}>;

export type ProspectFactDto = Readonly<{
  text: string;
  sourceUrl: string;
}>;

export type ProspectAngleDto = Readonly<{
  rank: number;
  title: string;
  note: string;
  angleType: string | null;
  chosen: boolean;
}>;

export type TimelineEventDto = Readonly<{
  kind: string;
  at: string;
  title: string;
  origin: Origin;
}>;

export type ProspectMessageDto = Readonly<{
  id: string;
  channel: Channel;
  subject: string | null;
  body: string;
  status: string;
  sentAt: string | null;
}>;

export type LeadDetailDto = Readonly<{
  id: string;
  firstName: string;
  lastName: string;
  role: string | null;
  hot: boolean;
  icp: string;
  channel: Channel;
  stage: Stage;
  origin: Origin;
  company: ProspectCompanyDto;
  siteUrl: string | null;
  linkedinUrl: string | null;
  instagramUrl: string | null;
  email: string | null;
  emailStatus: EmailStatus;
  phone: string | null;
  facts: ReadonlyArray<ProspectFactDto>;
  sourcesCount: number;
  angles: ReadonlyArray<ProspectAngleDto>;
  timeline: ReadonlyArray<TimelineEventDto>;
  message: ProspectMessageDto | null;
  reply: string | null;
  createdAt: string;
  nextFollowUpAt: string | null;
  snoozeUntil: string | null;
}>;
