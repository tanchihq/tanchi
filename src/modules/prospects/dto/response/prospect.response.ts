export type ChannelDto =
  | "email"
  | "linkedin"
  | "whatsapp"
  | "instagram"
  | "sms"
  | "call";

export type StageDto =
  | "identified"
  | "contacted"
  | "following-up"
  | "replied"
  | "meeting"
  | "won"
  | "not-interested"
  | "snoozed";

export type OriginDto = "auto" | "manual";

export type EmailStatusDto = "verified" | "guessed" | "none";

export type ProspectDto = Readonly<{
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  channel: ChannelDto;
  icp: string;
  hot: boolean;
  stage: StageDto;
  origin: OriginDto;
  score: number | null;
  qualification: string | null;
  createdAt: string;
  nextFollowUpAt: string | null;
  snoozeUntil: string | null;
}>;
