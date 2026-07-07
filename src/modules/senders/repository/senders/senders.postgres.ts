import type { DbClient } from "@shared/db";
import { ARRAY, throwSanitizeError } from "@shared/utils";
import type {
  PgSender,
  PgSenderFactory,
  UpdateSenderVerificationInput,
} from "./senders.entities.ts";

export class SendersPostgres {
  constructor(private readonly db: DbClient) {}

  async createOneSender(factory: PgSenderFactory): Promise<PgSender> {
    try {
      const result = await this.db<ReadonlyArray<PgSender>>`
        INSERT INTO senders (
          id, organization_id, from_name, from_email,
          smtp_host, smtp_port, smtp_secure,
          imap_host, imap_port, imap_secure,
          username, secret_encrypted, daily_cap, signature
        ) VALUES (
          ${factory.id},
          ${factory.organization_id},
          ${factory.from_name},
          ${factory.from_email},
          ${factory.smtp_host},
          ${factory.smtp_port},
          ${factory.smtp_secure},
          ${factory.imap_host},
          ${factory.imap_port},
          ${factory.imap_secure},
          ${factory.username},
          ${factory.secret_encrypted},
          ${factory.daily_cap},
          ${factory.signature}
        )
        RETURNING *
      `;
      return result[ARRAY.FIRST_INDEX] as PgSender;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getManySendersByOrganization(
    organizationId: string
  ): Promise<ReadonlyArray<PgSender>> {
    try {
      const result = await this.db<ReadonlyArray<PgSender>>`
        SELECT * FROM senders
        WHERE organization_id = ${organizationId}
        ORDER BY created_at ASC
      `;
      return result;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getOneSenderById(id: string): Promise<PgSender | null> {
    try {
      const result = await this.db<ReadonlyArray<PgSender>>`
        SELECT * FROM senders WHERE id = ${id}
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async updateOneSenderVerification(
    id: string,
    input: UpdateSenderVerificationInput
  ): Promise<void> {
    try {
      await this.db`
        UPDATE senders
        SET status = ${input.status},
            last_verified_at = ${input.lastVerifiedAt},
            updated_at = NOW()
        WHERE id = ${id}
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async deleteOneSender(id: string): Promise<void> {
    try {
      await this.db`DELETE FROM senders WHERE id = ${id}`;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }
}
