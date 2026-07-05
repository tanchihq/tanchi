export type CreateSenderDto = Readonly<{
  fromName: string;
  fromEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  username: string;
  secret: string;
  dailyCap: number;
  signature: string;
}>;
