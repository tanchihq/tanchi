import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { llm } from "@shared/llm";
import { db } from "../../db.ts";
import { ChatPostgres } from "./repository/chat/chat.postgres.ts";
import { ChatRepository } from "./repository/chat/chat.repository.ts";
import { CHAT_TOOLS, createChatToolExecutor } from "./chat.tools.ts";
import { MCP_SERVER_NAME } from "./chat.constants.ts";

const organizationId = process.env.CHAT_ORG_ID;
const conversationId = process.env.CHAT_CONVERSATION_ID;
if (
  organizationId === undefined ||
  organizationId === "" ||
  conversationId === undefined ||
  conversationId === ""
) {
  console.error("[chat-mcp] missing CHAT_ORG_ID / CHAT_CONVERSATION_ID");
  process.exit(1);
}

const repository = new ChatRepository(new ChatPostgres(db));
const outreachLanguage =
  (await repository.getOutreachLanguage(organizationId)) ?? "fr";
const execute = createChatToolExecutor({
  repository,
  llm,
  organizationId,
  conversationId,
  outreachLanguage,
});

const server = new Server(
  { name: MCP_SERVER_NAME, version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: CHAT_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema as Readonly<{
      type: "object";
      properties?: Record<string, unknown>;
    }>,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const output = await execute({
    name: request.params.name,
    input: (request.params.arguments ?? {}) as Record<string, unknown>,
  });
  return { content: [{ type: "text" as const, text: output }] };
});

await server.connect(new StdioServerTransport());
