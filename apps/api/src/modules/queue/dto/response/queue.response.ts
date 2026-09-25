export type QueueChannelDto =
  | "email"
  | "linkedin"
  | "whatsapp"
  | "instagram"
  | "sms"
  | "call";

export type QueueFactDto = Readonly<{
  text: string;
  sourceUrl: string;
}>;

export type QueueKindDto = "first-touch" | "follow-up";

export type QueuePreviousMessageDto = Readonly<{
  subject: string | null;
  body: string;
  sentAt: string | null;
}>;

export type QueueAngleDto = Readonly<{
  title: string;
  note: string | null;
  fact: QueueFactDto | null;
}>;

export type QueueSkipReasonDto =
  | "wrong_lead"
  | "wrong_angle"
  | "too_generic"
  | "not_now";

export type QueueItemDto = Readonly<{
  id: string;
  messageId: string;
  firstName: string;
  lastName: string;
  role: string | null;
  company: string;
  channel: QueueChannelDto;
  hot: boolean;
  done: boolean;
  status: string;
  subject: string | null;
  facts: ReadonlyArray<QueueFactDto>;
  angle: string;
  chosenAngle: QueueAngleDto | null;
  message: string;
  kind: QueueKindDto;
  followUpNumber: number;
  previousMessage: QueuePreviousMessageDto | null;
  email: string | null;
  profileUrl: string | null;
  score: number | null;
  qualification: string | null;
  autoSend: boolean;
}>;

export type QueueDto = Readonly<{
  preparedAt: string | null;
  autopilotEnabled: boolean;
  items: ReadonlyArray<QueueItemDto>;
}>;

export type QueueSkipNextStepDto = "excluded" | "snoozed" | "redraft";

export type QueueSkipResultDto = Readonly<{
  id: string;
  messageId: string;
  reason: QueueSkipReasonDto | null;
  nextStep: QueueSkipNextStepDto;
}>;
