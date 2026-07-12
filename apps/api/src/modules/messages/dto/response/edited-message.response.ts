export type EditedMessageDto = Readonly<{
  id: string;
  subject: string | null;
  body: string;
  status: string;
}>;
