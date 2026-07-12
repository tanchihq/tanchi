import { db } from "../../db.ts";
import { MessagesPostgres } from "./repository/messages/messages.postgres.ts";
import { MessagesRepository } from "./repository/messages/messages.repository.ts";
import { MessagesService } from "./messages.service.ts";
import { createMessagesRouter } from "./messages.controller.ts";

const messagesRepository = new MessagesRepository(new MessagesPostgres(db));
const messagesService = new MessagesService(messagesRepository);

export const messagesRouter = createMessagesRouter(messagesService);
