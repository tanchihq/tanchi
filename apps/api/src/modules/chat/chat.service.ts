import {
  getBillingAccess,
  getMonthlyUsage,
  incrementMonthlyUsage,
} from "@shared/billing";
import type { LlmProvider } from "@shared/llm";
import { agentModel } from "@shared/llm";
import { todayLabel } from "@shared/utils";
import type { ChatRepository } from "./repository/chat/chat.repository.ts";
import {
  AttachLeadErrors,
  CreateConversationErrors,
  DeleteConversationErrors,
  DetachLeadErrors,
  GetConversationErrors,
  GetConversationsErrors,
  SendMessageErrors,
} from "./chat.errors.ts";
import {
  AGENT_MAX_STEPS,
  CHAT_MAX_TOKENS,
  CHAT_TEMPERATURE,
  CONVERSATIONS_LIMIT,
  HISTORY_LIMIT,
  TITLE_FROM_CONTENT_LENGTH,
} from "./chat.constants.ts";
import { buildChatPrompt, CHAT_SYSTEM } from "./chat.prompt.ts";
import {
  buildChatMcpServer,
  CHAT_TOOLS,
  createChatToolExecutor,
} from "./chat.tools.ts";
import type * as RequestDto from "./dto/request/index.ts";
import type * as ResponseDto from "./dto/response/index.ts";
import * as utils from "./chat.utils.ts";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function titleFromContent(content: string): string {
  const trimmed = content.trim();
  return trimmed.length <= TITLE_FROM_CONTENT_LENGTH
    ? trimmed
    : `${trimmed.slice(0, TITLE_FROM_CONTENT_LENGTH)}…`;
}

export type ChatStreamEvent =
  | Readonly<{
      type: "user";
      message: ResponseDto.ChatMessageDto;
      title: string;
    }>
  | Readonly<{ type: "delta"; text: string }>
  | Readonly<{ type: "action"; name: string }>
  | Readonly<{
      type: "done";
      message: ResponseDto.ChatMessageDto;
      title: string;
    }>
  | Readonly<{ type: "error"; error: SendMessageErrors }>;

export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly llm: LlmProvider
  ) {}

  async createConversation(
    dto: RequestDto.CreateConversationDto,
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.ConversationSummaryDto | CreateConversationErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return CreateConversationErrors.noActiveOrganization;
    }
    try {
      const conversation = await this.chatRepository.createConversation(
        organizationId,
        dto.title ?? ""
      );
      return utils.convertPgConversationToSummaryDto(conversation);
    } catch (error) {
      console.error(
        `[chat] createConversation failed orgId=${organizationId}: ${errorMessage(error)}`
      );
      return CreateConversationErrors.createFailed;
    }
  }

  async getConversations(
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.ConversationListDto | GetConversationsErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return GetConversationsErrors.noActiveOrganization;
    }
    const conversations =
      await this.chatRepository.getConversationsByOrganization(
        organizationId,
        CONVERSATIONS_LIMIT
      );
    return conversations.map(utils.convertPgConversationToSummaryDto);
  }

  async getConversation(
    id: string,
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.ConversationDetailDto | GetConversationErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return GetConversationErrors.noActiveOrganization;
    }
    const conversation = await this.chatRepository.getConversationById(id);
    if (conversation === null) return GetConversationErrors.inexistingConversation;
    if (conversation.organization_id !== organizationId) {
      return GetConversationErrors.notInMyOrg;
    }

    const [messages, leads] = await Promise.all([
      this.chatRepository.getMessagesByConversation(id),
      this.chatRepository.getAttachedLeads(id),
    ]);

    return {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.created_at.toISOString(),
      updatedAt: conversation.updated_at.toISOString(),
      messages: messages.map(utils.convertPgChatMessageToDto),
      leads: leads.map(utils.convertPgAttachedLeadToDto),
    };
  }

  async *streamMessage(
    id: string,
    dto: RequestDto.SendMessageDto,
    activeOrganizationId: string | null | undefined
  ): AsyncGenerator<ChatStreamEvent> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      yield { type: "error", error: SendMessageErrors.noActiveOrganization };
      return;
    }
    const conversation = await this.chatRepository.getConversationById(id);
    if (conversation === null) {
      yield { type: "error", error: SendMessageErrors.inexistingConversation };
      return;
    }
    if (conversation.organization_id !== organizationId) {
      yield { type: "error", error: SendMessageErrors.notInMyOrg };
      return;
    }

    const access = await getBillingAccess(organizationId);
    if (access.state === "expired") {
      yield { type: "error", error: SendMessageErrors.subscriptionExpired };
      return;
    }
    if (Number.isFinite(access.entitlements.monthlyChatMessages)) {
      const usage = await getMonthlyUsage(organizationId);
      if (usage.chatMessages >= access.entitlements.monthlyChatMessages) {
        yield { type: "error", error: SendMessageErrors.chatQuotaReached };
        return;
      }
    }
    await incrementMonthlyUsage(organizationId, "chat_messages", 1);

    const title =
      conversation.title === ""
        ? titleFromContent(dto.content)
        : conversation.title;

    let userMessage;
    try {
      userMessage = await this.chatRepository.insertMessage({
        organizationId,
        conversationId: id,
        role: "user",
        content: dto.content,
      });
      if (conversation.title === "") {
        await this.chatRepository.setConversationTitle(
          id,
          title,
          organizationId
        );
      }
    } catch (error) {
      console.error(
        `[chat] streamMessage persist user failed conversationId=${id}: ${errorMessage(error)}`
      );
      yield { type: "error", error: SendMessageErrors.sendFailed };
      return;
    }
    yield {
      type: "user",
      message: utils.convertPgChatMessageToDto(userMessage),
      title,
    };

    const [history, contexts, icps, outreachLanguage] = await Promise.all([
      this.chatRepository.getMessagesByConversation(id),
      this.chatRepository.getLeadContextsForConversation(id),
      this.chatRepository.getIcpsForOrganization(organizationId),
      this.chatRepository.getOutreachLanguage(organizationId),
    ]);

    const execute = createChatToolExecutor({
      repository: this.chatRepository,
      llm: this.llm,
      organizationId,
      conversationId: id,
      outreachLanguage: outreachLanguage ?? "fr",
    });

    let reply = "";
    try {
      const events = this.llm.agent({
        system: CHAT_SYSTEM,
        prompt: buildChatPrompt(
          todayLabel(),
          icps,
          contexts,
          history.slice(-HISTORY_LIMIT)
        ),
        tools: CHAT_TOOLS,
        execute,
        mcp: buildChatMcpServer({ organizationId, conversationId: id }),
        model: agentModel("chat"),
        maxTokens: CHAT_MAX_TOKENS,
        temperature: CHAT_TEMPERATURE,
        maxSteps: AGENT_MAX_STEPS,
      });
      for await (const event of events) {
        if (event.type === "text") {
          reply += event.text;
          yield { type: "delta", text: event.text };
        } else {
          yield { type: "action", name: event.name };
        }
      }
    } catch (error) {
      console.error(
        `[chat] streamMessage llm failed conversationId=${id}: ${errorMessage(error)}`
      );
      yield { type: "error", error: SendMessageErrors.llmFailed };
      return;
    }

    const finalReply = reply.trim() === "" ? "Done." : reply.trim();
    try {
      const assistantMessage = await this.chatRepository.insertMessage({
        organizationId,
        conversationId: id,
        role: "assistant",
        content: finalReply,
      });
      await this.chatRepository.touchConversation(id, organizationId);
      yield {
        type: "done",
        message: utils.convertPgChatMessageToDto(assistantMessage),
        title,
      };
    } catch (error) {
      console.error(
        `[chat] streamMessage persist assistant failed conversationId=${id}: ${errorMessage(error)}`
      );
      yield { type: "error", error: SendMessageErrors.sendFailed };
    }
  }

  async attachLead(
    id: string,
    dto: RequestDto.AttachLeadDto,
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.AttachedLeadDto | AttachLeadErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return AttachLeadErrors.noActiveOrganization;
    }
    const conversation = await this.chatRepository.getConversationById(id);
    if (conversation === null) return AttachLeadErrors.inexistingConversation;
    if (conversation.organization_id !== organizationId) {
      return AttachLeadErrors.notInMyOrg;
    }

    const lead = await this.chatRepository.getLeadForOrganization(
      dto.leadId,
      organizationId
    );
    if (lead === null) return AttachLeadErrors.inexistingLead;

    try {
      await this.chatRepository.attachLead(id, dto.leadId);
      await this.chatRepository.touchConversation(id, organizationId);
    } catch (error) {
      console.error(
        `[chat] attachLead failed conversationId=${id}: ${errorMessage(error)}`
      );
      return AttachLeadErrors.attachFailed;
    }
    return utils.convertPgAttachedLeadToDto(lead);
  }

  async detachLead(
    id: string,
    leadId: string,
    activeOrganizationId: string | null | undefined
  ): Promise<void | DetachLeadErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return DetachLeadErrors.noActiveOrganization;
    }
    const conversation = await this.chatRepository.getConversationById(id);
    if (conversation === null) return DetachLeadErrors.inexistingConversation;
    if (conversation.organization_id !== organizationId) {
      return DetachLeadErrors.notInMyOrg;
    }

    try {
      await this.chatRepository.detachLead(id, leadId);
    } catch (error) {
      console.error(
        `[chat] detachLead failed conversationId=${id}: ${errorMessage(error)}`
      );
      return DetachLeadErrors.detachFailed;
    }
    return;
  }

  async deleteConversation(
    id: string,
    activeOrganizationId: string | null | undefined
  ): Promise<void | DeleteConversationErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return DeleteConversationErrors.noActiveOrganization;
    }
    const conversation = await this.chatRepository.getConversationById(id);
    if (conversation === null) {
      return DeleteConversationErrors.inexistingConversation;
    }
    if (conversation.organization_id !== organizationId) {
      return DeleteConversationErrors.notInMyOrg;
    }

    try {
      await this.chatRepository.deleteConversation(organizationId, id);
    } catch (error) {
      console.error(
        `[chat] deleteConversation failed conversationId=${id}: ${errorMessage(error)}`
      );
      return DeleteConversationErrors.deleteFailed;
    }
    return;
  }
}

function resolveActiveOrganization(
  activeOrganizationId: string | null | undefined
): string | null {
  if (
    activeOrganizationId === null ||
    activeOrganizationId === undefined ||
    activeOrganizationId === ""
  ) {
    return null;
  }
  return activeOrganizationId;
}
