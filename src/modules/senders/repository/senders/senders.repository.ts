import type { SendersPostgres } from "./senders.postgres.ts";
import type {
  CreateSenderFactoryInput,
  PgSender,
  UpdateSenderInput,
  UpdateSenderVerificationInput,
} from "./senders.entities.ts";
import * as utils from "./senders.utils.ts";

export class SendersRepository {
  constructor(private readonly sendersPostgres: SendersPostgres) {}

  createOneSender(input: CreateSenderFactoryInput): Promise<PgSender> {
    const factory = utils.convertCreateSenderFactoryInputToPgSenderFactory(
      input
    );
    return this.sendersPostgres.createOneSender(factory);
  }

  getManySendersByOrganization(
    organizationId: string
  ): Promise<ReadonlyArray<PgSender>> {
    return this.sendersPostgres.getManySendersByOrganization(organizationId);
  }

  getOneSenderById(id: string): Promise<PgSender | null> {
    return this.sendersPostgres.getOneSenderById(id);
  }

  updateOneSender(
    id: string,
    input: UpdateSenderInput
  ): Promise<PgSender | null> {
    const update = utils.convertUpdateSenderInputToPgSenderUpdate(input);
    return this.sendersPostgres.updateOneSender(id, update);
  }

  updateOneSenderVerification(
    id: string,
    input: UpdateSenderVerificationInput
  ): Promise<void> {
    return this.sendersPostgres.updateOneSenderVerification(id, input);
  }

  deleteOneSender(id: string): Promise<void> {
    return this.sendersPostgres.deleteOneSender(id);
  }
}
