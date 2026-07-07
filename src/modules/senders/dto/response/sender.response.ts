export type SenderStatusDto = "unverified" | "active" | "error";

export type SenderDto = Readonly<{
  id: string;
  fromName: string;
  fromEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  username: string;
  dailyCap: number;
  signature: string;
  status: SenderStatusDto;
  warmupStartedAt: string | null;
  lastVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;
