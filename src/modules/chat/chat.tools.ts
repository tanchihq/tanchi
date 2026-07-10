import type {
  LlmMcpServer,
  LlmProvider,
  LlmToolInvocation,
  LlmToolSpec,
} from "@shared/llm";
import { todayLabel } from "@shared/utils";
import type { ChatRepository } from "./repository/chat/chat.repository.ts";
import { buildResearchPrompt, buildRewritePrompt } from "./chat.prompt.ts";
import { extractJson, optionalString, parseDate } from "./chat.utils.ts";
import {
  MCP_SERVER_NAME,
  RESEARCH_TIMEOUT_MS,
  REWRITE_MAX_TOKENS,
  REWRITE_TEMPERATURE,
} from "./chat.constants.ts";

export const CHAT_TOOLS: ReadonlyArray<LlmToolSpec> = [
  {
    name: "create_lead",
    description:
      "Create a new prospect card from information the user provides (a prospect they found themselves), and attach it to this conversation. Use when the user wants to add a new lead.",
    inputSchema: {
      type: "object",
      properties: {
        companyName: {
          type: "string",
          description: "Company name (required).",
        },
        companyDomain: {
          type: "string",
          description: "Company website domain, e.g. acme.com.",
        },
        firstName: { type: "string" },
        lastName: { type: "string" },
        role: { type: "string", description: "Job title / role." },
        email: { type: "string" },
        linkedinUrl: { type: "string" },
        icpName: {
          type: "string",
          description:
            "Name of an EXISTING ICP to associate (must match one of the Available ICPs listed in context). Do not invent an ICP.",
        },
        icpId: {
          type: "string",
          description: "Id of an existing ICP (from the Available ICPs list).",
        },
      },
      required: ["companyName"],
    },
  },
  {
    name: "update_lead",
    description:
      "Update the contact details or identity of an existing lead: email, phone, LinkedIn, Instagram, first/last name, role, or channel. Use whenever the user gives information for a lead that already exists — e.g. they provide the email after the card was created. Only the fields you pass are changed.",
    inputSchema: {
      type: "object",
      properties: {
        leadId: {
          type: "string",
          description: "The lead to update (required).",
        },
        firstName: { type: "string" },
        lastName: { type: "string" },
        role: { type: "string", description: "Job title / role." },
        email: { type: "string" },
        phone: { type: "string" },
        linkedinUrl: { type: "string" },
        instagramUrl: { type: "string" },
        channel: {
          type: "string",
          description:
            "Preferred channel. One of: email, linkedin, whatsapp, instagram, sms, call.",
        },
      },
      required: ["leadId"],
    },
  },
  {
    name: "assign_icp",
    description:
      "Associate an existing lead with an EXISTING ICP (from the Available ICPs listed in context). Use when the user asks to set or change a lead's ICP. You cannot create a new ICP — that is done in the app's strategy setup.",
    inputSchema: {
      type: "object",
      properties: {
        leadId: {
          type: "string",
          description: "The lead to associate (required).",
        },
        icpName: {
          type: "string",
          description: "Name of an existing ICP (must match one in context).",
        },
        icpId: {
          type: "string",
          description: "Id of an existing ICP (from the Available ICPs list).",
        },
      },
      required: ["leadId"],
    },
  },
  {
    name: "fetch_context",
    description:
      "Research a prospect or company on the web to gather fresh, sourced context (recent news, funding, hiring, positioning). Every fact returned is tied to a source URL. Use before writing a message when you need grounding.",
    inputSchema: {
      type: "object",
      properties: {
        leadId: {
          type: "string",
          description:
            "The attached lead to research (optional if 'query' is given).",
        },
        query: {
          type: "string",
          description: "Free-text research target, e.g. a company name.",
        },
      },
    },
  },
  {
    name: "rewrite_draft",
    description:
      "Write or rewrite the outreach draft for an attached lead, with a specific angle and/or instructions, and save it as a new draft the user can review and send. Only uses sourced facts.",
    inputSchema: {
      type: "object",
      properties: {
        leadId: {
          type: "string",
          description: "The lead whose draft to (re)write (required).",
        },
        angle: {
          type: "string",
          description: "The angle to play, e.g. 'recent funding', 'social proof'.",
        },
        instructions: {
          type: "string",
          description: "Extra instructions, e.g. 'shorter, more direct'.",
        },
        sourcedContext: {
          type: "string",
          description:
            "Sourced facts to ground the message (e.g. the output of fetch_context), each with its source URL. Only pass verifiable, sourced facts here.",
        },
      },
      required: ["leadId"],
    },
  },
  {
    name: "plan_follow_ups",
    description:
      "Arm the automatic follow-up sequence for a lead: the app will then draft the next follow-up(s) for the user to review and send, on the cadence configured in the app's follow-up settings. If the last message was sent OUTSIDE the app, provide it (lastMessage + lastSentAt) so the sequence is anchored on the right date. Use when the user wants to plan or schedule follow-ups. You do NOT pick arbitrary dates — the cadence comes from the user's settings.",
    inputSchema: {
      type: "object",
      properties: {
        leadId: {
          type: "string",
          description: "The lead to plan follow-ups for (required).",
        },
        lastMessage: {
          type: "string",
          description:
            "Body of the last email already sent to this prospect, only if it was sent outside the app.",
        },
        lastSubject: {
          type: "string",
          description: "Subject of that last sent email.",
        },
        lastSentAt: {
          type: "string",
          description:
            "Date the last email was sent, ISO format e.g. 2026-07-07. Defaults to today if omitted.",
        },
      },
      required: ["leadId"],
    },
  },
];

type ExecutorDeps = Readonly<{
  repository: ChatRepository;
  llm: LlmProvider;
  organizationId: string;
  conversationId: string;
  outreachLanguage: string;
}>;

function fullName(
  firstName: string | null,
  lastName: string | null
): string {
  return [firstName, lastName]
    .filter((part) => part !== null && part !== "")
    .join(" ");
}

async function resolveIcp(
  deps: ExecutorDeps,
  input: Record<string, unknown>
): Promise<Readonly<{ id: string; name: string }> | null> {
  const byId = optionalString(input.icpId);
  const byName = optionalString(input.icpName);
  if (byId === null && byName === null) return null;

  const icps = await deps.repository.getIcpsForOrganization(
    deps.organizationId
  );
  if (byId !== null) {
    const match = icps.find((icp) => icp.id === byId);
    if (match !== undefined) return match;
  }
  if (byName !== null) {
    const lowered = byName.toLowerCase();
    const exact = icps.find((icp) => icp.name.toLowerCase() === lowered);
    if (exact !== undefined) return exact;
    const fuzzy = icps.find(
      (icp) =>
        icp.name.toLowerCase().includes(lowered) ||
        lowered.includes(icp.name.toLowerCase())
    );
    if (fuzzy !== undefined) return fuzzy;
  }
  return null;
}

async function createLead(
  deps: ExecutorDeps,
  input: Record<string, unknown>
): Promise<string> {
  const companyName = optionalString(input.companyName);
  if (companyName === null) {
    return "Error: companyName is required to create a lead.";
  }
  const requestedIcp =
    optionalString(input.icpName) ?? optionalString(input.icpId);
  const icp = await resolveIcp(deps, input);
  const created = await deps.repository.createManualLead({
    organizationId: deps.organizationId,
    companyName,
    companyDomain: optionalString(input.companyDomain),
    firstName: optionalString(input.firstName),
    lastName: optionalString(input.lastName),
    role: optionalString(input.role),
    email: optionalString(input.email),
    linkedinUrl: optionalString(input.linkedinUrl),
    icpId: icp?.id ?? null,
  });
  await deps.repository.attachLead(deps.conversationId, created.lead_id);
  const name =
    fullName(created.first_name, created.last_name) || "the contact";
  const icpNote =
    icp !== null
      ? ` (ICP: ${icp.name})`
      : requestedIcp === null
        ? ""
        : ` (note: no ICP matched "${requestedIcp}" — created without ICP)`;
  return `Created and attached lead "${name}" at ${companyName}${icpNote} (leadId: ${created.lead_id}).`;
}

const ALLOWED_CHANNELS: ReadonlyArray<string> = [
  "email",
  "linkedin",
  "whatsapp",
  "instagram",
  "sms",
  "call",
];

async function updateLead(
  deps: ExecutorDeps,
  input: Record<string, unknown>
): Promise<string> {
  const leadId = optionalString(input.leadId);
  if (leadId === null) {
    return "Error: leadId is required to update a lead.";
  }
  const channel = optionalString(input.channel);
  if (channel !== null && !ALLOWED_CHANNELS.includes(channel)) {
    return `Error: invalid channel "${channel}". Allowed: ${ALLOWED_CHANNELS.join(", ")}.`;
  }
  const email = optionalString(input.email);
  const fields: ReadonlyArray<Readonly<{ key: string; value: string | null }>> =
    [
      { key: "firstName", value: optionalString(input.firstName) },
      { key: "lastName", value: optionalString(input.lastName) },
      { key: "role", value: optionalString(input.role) },
      { key: "email", value: email },
      { key: "phone", value: optionalString(input.phone) },
      { key: "linkedinUrl", value: optionalString(input.linkedinUrl) },
      { key: "instagramUrl", value: optionalString(input.instagramUrl) },
      { key: "channel", value: channel },
    ];
  const changed = fields
    .filter((field) => field.value !== null)
    .map((field) => field.key);
  if (changed.length === 0) {
    return "Error: nothing to update — provide at least one field (email, phone, linkedinUrl, name, role, or channel).";
  }

  const updated = await deps.repository.updateLead({
    organizationId: deps.organizationId,
    leadId,
    firstName: optionalString(input.firstName),
    lastName: optionalString(input.lastName),
    role: optionalString(input.role),
    email,
    emailStatus: email === null ? null : "guessed",
    phone: optionalString(input.phone),
    linkedinUrl: optionalString(input.linkedinUrl),
    instagramUrl: optionalString(input.instagramUrl),
    channel,
  });
  if (!updated) return "Error: lead not found in your organization.";
  return `Updated lead ${leadId} (${changed.join(", ")}).`;
}

async function assignIcp(
  deps: ExecutorDeps,
  input: Record<string, unknown>
): Promise<string> {
  const leadId = optionalString(input.leadId);
  if (leadId === null) {
    return "Error: leadId is required to assign an ICP.";
  }
  const icp = await resolveIcp(deps, input);
  if (icp === null) {
    const icps = await deps.repository.getIcpsForOrganization(
      deps.organizationId
    );
    const names = icps.map((option) => option.name).join(", ");
    return `Error: no matching ICP found. Existing ICPs: ${names === "" ? "(none)" : names}. I can only assign an existing ICP, not create one.`;
  }
  const assigned = await deps.repository.assignLeadIcp(
    leadId,
    deps.organizationId,
    icp.id
  );
  if (!assigned) return "Error: lead not found in your organization.";
  return `Assigned ICP "${icp.name}" to lead ${leadId}.`;
}

async function fetchContext(
  deps: ExecutorDeps,
  input: Record<string, unknown>
): Promise<string> {
  const leadId = optionalString(input.leadId);
  let target = optionalString(input.query);
  if (leadId !== null) {
    const lead = await deps.repository.getLeadDetailForOrganization(
      leadId,
      deps.organizationId
    );
    if (lead === null) return "Error: lead not found in your organization.";
    const name = fullName(lead.first_name, lead.last_name) || "contact";
    const domain =
      lead.company_domain === null ? "" : ` (${lead.company_domain})`;
    target = `${name} at ${lead.company_name ?? ""}${domain}`.trim();
  }
  if (target === null) {
    return "Error: provide a leadId or a query to research.";
  }
  try {
    const research = await deps.llm.research({
      prompt: buildResearchPrompt(target, todayLabel()),
      timeoutMs: RESEARCH_TIMEOUT_MS,
    });
    const trimmed = research.trim();
    if (trimmed === "") {
      return `No verifiable context could be retrieved for ${target}. Nothing was added to the dossier.`;
    }
    return `Research on ${target}:\n${trimmed}`;
  } catch (error) {
    return `Error: web research failed for ${target} (${
      error instanceof Error ? error.message : String(error)
    }). Nothing was retrieved. The user can retry.`;
  }
}

async function rewriteDraft(
  deps: ExecutorDeps,
  input: Record<string, unknown>
): Promise<string> {
  const leadId = optionalString(input.leadId);
  if (leadId === null) {
    return "Error: leadId is required to rewrite a draft.";
  }
  const lead = await deps.repository.getLeadDetailForOrganization(
    leadId,
    deps.organizationId
  );
  if (lead === null) return "Error: lead not found in your organization.";

  const facts = await deps.repository.getFactsForLead(leadId);
  const name = fullName(lead.first_name, lead.last_name) || "the contact";
  const currentDraft =
    lead.draft_body === null
      ? null
      : `${lead.draft_subject === null ? "" : `Subject: ${lead.draft_subject}\n`}${lead.draft_body}`;

  let subject: string | null;
  let body: string | null;
  try {
    const raw = await deps.llm.generate({
      prompt: buildRewritePrompt({
        name,
        role: lead.role,
        company: lead.company_name,
        facts,
        sourcedContext: optionalString(input.sourcedContext),
        currentDraft,
        angle: optionalString(input.angle),
        instructions: optionalString(input.instructions),
        outreachLanguage: deps.outreachLanguage,
        today: todayLabel(),
      }),
      maxTokens: REWRITE_MAX_TOKENS,
      temperature: REWRITE_TEMPERATURE,
    });
    const parsed = extractJson(raw) as Readonly<{
      subject?: unknown;
      body?: unknown;
    }>;
    subject = optionalString(parsed.subject);
    body = optionalString(parsed.body);
  } catch (error) {
    return `Error: failed to generate the rewrite (${
      error instanceof Error ? error.message : String(error)
    }).`;
  }
  if (body === null) return "Error: the rewrite produced no message body.";

  await deps.repository.saveDraftForLead({
    organizationId: deps.organizationId,
    leadId,
    icpId: lead.icp_id,
    subject,
    body,
  });
  return `Saved a new draft for ${name}. Subject: ${subject ?? "(none)"}. The user can review and send it.\n\n${body}`;
}

async function planFollowUps(
  deps: ExecutorDeps,
  input: Record<string, unknown>
): Promise<string> {
  const leadId = optionalString(input.leadId);
  if (leadId === null) {
    return "Error: leadId is required to plan follow-ups.";
  }
  const lead = await deps.repository.getLeadDetailForOrganization(
    leadId,
    deps.organizationId
  );
  if (lead === null) return "Error: lead not found in your organization.";
  const name = fullName(lead.first_name, lead.last_name) || "the contact";

  const lastMessage = optionalString(input.lastMessage);
  if (lastMessage !== null) {
    const sentAt = parseDate(optionalString(input.lastSentAt)) ?? new Date();
    await deps.repository.recordSentMessage({
      organizationId: deps.organizationId,
      leadId,
      icpId: lead.icp_id,
      subject: optionalString(input.lastSubject),
      body: lastMessage,
      sentAt,
    });
  } else {
    const hasSent = await deps.repository.leadHasSentMessage(leadId);
    if (!hasSent) {
      return `Error: to plan follow-ups for ${name} I need the last message already sent and its date — paste it (lastMessage + lastSentAt), or send a first message from the app first.`;
    }
  }

  const armed = await deps.repository.armFollowUpSequence(
    leadId,
    deps.organizationId
  );
  if (!armed) return "Error: lead not found in your organization.";
  return `Follow-up sequence planned for ${name}. The app will automatically draft the next follow-up(s) on the cadence set in your follow-up settings, anchored on the last sent message. Each follow-up is a draft you review before it's sent.`;
}

export function createChatToolExecutor(
  deps: ExecutorDeps
): (call: LlmToolInvocation) => Promise<string> {
  return async (call) => {
    switch (call.name) {
      case "create_lead":
        return createLead(deps, call.input);
      case "update_lead":
        return updateLead(deps, call.input);
      case "assign_icp":
        return assignIcp(deps, call.input);
      case "fetch_context":
        return fetchContext(deps, call.input);
      case "rewrite_draft":
        return rewriteDraft(deps, call.input);
      case "plan_follow_ups":
        return planFollowUps(deps, call.input);
      default:
        return `Unknown tool: ${call.name}`;
    }
  };
}

export function buildChatMcpServer(
  context: Readonly<{ organizationId: string; conversationId: string }>
): LlmMcpServer {
  const inherited = Object.fromEntries(
    Object.entries(process.env).filter(([, value]) => value !== undefined)
  ) as Record<string, string>;
  return {
    serverName: MCP_SERVER_NAME,
    command: process.execPath,
    args: [`${import.meta.dir}/chat-mcp.server.ts`],
    env: {
      ...inherited,
      CHAT_ORG_ID: context.organizationId,
      CHAT_CONVERSATION_ID: context.conversationId,
    },
    toolNames: CHAT_TOOLS.map(
      (tool) => `mcp__${MCP_SERVER_NAME}__${tool.name}`
    ),
  };
}
