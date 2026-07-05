import type { MessagesPostgres } from "./messages.postgres.ts";
import type {
  GetMessagesFilter,
  PgMessageHistoryRow,
} from "./messages.entities.ts";

export class MessagesRepository {
  constructor(private readonly messagesPostgres: MessagesPostgres) {}

  getMessages(
    filter: GetMessagesFilter
  ): Promise<ReadonlyArray<PgMessageHistoryRow>> {
    return this.messagesPostgres.getMessages(filter);
  }
}
