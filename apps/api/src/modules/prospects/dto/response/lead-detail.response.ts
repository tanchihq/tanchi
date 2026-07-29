import type {
  ChannelDto,
  EmailStatusDto,
  OriginDto,
  StageDto,
} from "./prospect.response.ts";

export type LeadDetailFactDto = Readonly<{
  text: string;
  sourceUrl: string;
}>;

export type LeadDetailAngleDto = Readonly<{
  rank: number;
  title: string;
  note: string;
  angleType: string | null;
  chosen: boolean;
}>;

export type LeadDetailTimelineEntryDto = Readonly<{
  kind: string;
  at: string;
  title: string;
  origin: OriginDto;
}>;

export type LeadDetailMessageDto = Readonly<{
  id: string;
  channel: ChannelDto;
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
  marketId: string | null;
  market: string;
  channel: ChannelDto;
  stage: StageDto;
  origin: OriginDto;
  company: Readonly<{
    name: string;
    sector: string | null;
    size: string | null;
    hq: string | null;
  }>;
  siteUrl: string | null;
  linkedinUrl: string | null;
  instagramUrl: string | null;
  email: string | null;
  emailStatus: EmailStatusDto;
  phone: string | null;
  facts: ReadonlyArray<LeadDetailFactDto>;
  sourcesCount: number;
  angles: ReadonlyArray<LeadDetailAngleDto>;
  timeline: ReadonlyArray<LeadDetailTimelineEntryDto>;
  message: LeadDetailMessageDto | null;
  reply: string | null;
  createdAt: string;
  nextFollowUpAt: string | null;
  snoozeUntil: string | null;
}>;
