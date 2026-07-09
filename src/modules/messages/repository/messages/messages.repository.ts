import type { MessagesPostgres } from "./messages.postgres.ts";
import type {
  GetMessagesFilter,
  PgEditableMessage,
  PgMessageHistoryRow,
  SaveMessageEditInput,
} from "./messages.entities.ts";

export class MessagesRepository {
  constructor(private readonly messagesPostgres: MessagesPostgres) {}

  getMessages(
    filter: GetMessagesFilter
  ): Promise<ReadonlyArray<PgMessageHistoryRow>> {
    return this.messagesPostgres.getMessages(filter);
  }

  getEditableMessageById(id: string): Promise<PgEditableMessage | null> {
    return this.messagesPostgres.getEditableMessageById(id);
  }

  getOriginalAiVersion(messageId: string): Promise<string | null> {
    return this.messagesPostgres.getOriginalAiVersion(messageId);
  }

  saveMessageEdit(
    input: SaveMessageEditInput
  ): Promise<PgEditableMessage | null> {
    return this.messagesPostgres.saveMessageEdit(input);
  }
}
