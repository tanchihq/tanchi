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
  subject: string | null;
  facts: ReadonlyArray<QueueFactDto>;
  angle: string;
  message: string;
}>;

export type QueueDto = Readonly<{
  preparedAt: string | null;
  items: ReadonlyArray<QueueItemDto>;
}>;
