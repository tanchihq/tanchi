import { db } from "../../db.ts";
import { llm } from "@shared/llm";
import { ChatPostgres } from "./repository/chat/chat.postgres.ts";
import { ChatRepository } from "./repository/chat/chat.repository.ts";
import { ChatService } from "./chat.service.ts";
import { createChatRouter } from "./chat.controller.ts";

const chatRepository = new ChatRepository(new ChatPostgres(db));
const chatService = new ChatService(chatRepository, llm);

export const chatRouter = createChatRouter(chatService);
